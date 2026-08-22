import { and, desc, eq, gte, lte } from "drizzle-orm";
import { getDb } from "../../../../db";
import { fleetAuditLogs, fleetMileageRecords, fleetVehicles } from "../../../../db/schema";
import { fleetError, fleetSession, jsonNoStore } from "../../../fleet-api.server";
import {
  calculateDistance,
  cleanFleetText,
  isIsoWorkDate,
  parseOdometer,
  validateEndOdometer,
  validateStartOdometer,
} from "../../../fleet-mileage-domain";

export const dynamic = "force-dynamic";

const mileageSelection = {
  id: fleetMileageRecords.id,
  vehicleId: fleetMileageRecords.vehicleId,
  vehiclePlate: fleetVehicles.plate,
  vehicleName: fleetVehicles.name,
  workDate: fleetMileageRecords.workDate,
  department: fleetMileageRecords.department,
  responsibleId: fleetMileageRecords.responsibleId,
  responsibleName: fleetMileageRecords.responsibleName,
  startKm: fleetMileageRecords.startKm,
  startAt: fleetMileageRecords.startAt,
  startNotes: fleetMileageRecords.startNotes,
  endKm: fleetMileageRecords.endKm,
  endAt: fleetMileageRecords.endAt,
  endNotes: fleetMileageRecords.endNotes,
  distanceKm: fleetMileageRecords.distanceKm,
  status: fleetMileageRecords.status,
  closedByName: fleetMileageRecords.closedByName,
  createdAt: fleetMileageRecords.createdAt,
  updatedAt: fleetMileageRecords.updatedAt,
};

export async function GET(request: Request) {
  const actor = fleetSession(request);
  if (!actor) return jsonNoStore({ error: "Sessão expirada." }, { status: 401 });

  const url = new URL(request.url);
  const department = cleanFleetText(url.searchParams.get("department"), 160);
  const vehicleId = cleanFleetText(url.searchParams.get("vehicleId"), 80);
  const status = cleanFleetText(url.searchParams.get("status"), 20);
  const date = cleanFleetText(url.searchParams.get("date"), 10);
  const from = cleanFleetText(url.searchParams.get("from"), 10);
  const to = cleanFleetText(url.searchParams.get("to"), 10);
  const requestedLimit = Number(url.searchParams.get("limit") || 100);
  const limit = Number.isFinite(requestedLimit) ? Math.min(200, Math.max(1, Math.trunc(requestedLimit))) : 100;

  if (!department) return jsonNoStore({ error: "Informe o setor responsável pela frota." }, { status: 400 });
  if (status && status !== "open" && status !== "closed") return jsonNoStore({ error: "Situação de jornada inválida." }, { status: 400 });
  if ((date && !isIsoWorkDate(date)) || (from && !isIsoWorkDate(from)) || (to && !isIsoWorkDate(to))) return jsonNoStore({ error: "Período de consulta inválido." }, { status: 400 });

  try {
    const conditions = [eq(fleetMileageRecords.department, department)];
    if (vehicleId) conditions.push(eq(fleetMileageRecords.vehicleId, vehicleId));
    if (status) conditions.push(eq(fleetMileageRecords.status, status));
    if (date) conditions.push(eq(fleetMileageRecords.workDate, date));
    if (from) conditions.push(gte(fleetMileageRecords.workDate, from));
    if (to) conditions.push(lte(fleetMileageRecords.workDate, to));

    const db = getDb();
    const records = await db.select(mileageSelection).from(fleetMileageRecords)
      .innerJoin(fleetVehicles, eq(fleetMileageRecords.vehicleId, fleetVehicles.id))
      .where(and(...conditions))
      .orderBy(desc(fleetMileageRecords.workDate), desc(fleetMileageRecords.startAt))
      .limit(limit);

    const closed = records.filter((record) => record.status === "closed");
    const totalDistanceKm = Math.round(closed.reduce((total, record) => total + (record.distanceKm ?? 0), 0) * 10) / 10;
    return jsonNoStore({
      ok: true,
      records,
      summary: {
        total: records.length,
        open: records.filter((record) => record.status === "open").length,
        closed: closed.length,
        totalDistanceKm,
      },
    });
  } catch (error) {
    return fleetError(error, "Não foi possível consultar o diário de quilometragem.");
  }
}

export async function POST(request: Request) {
  const actor = fleetSession(request);
  if (!actor) return jsonNoStore({ error: "Sessão expirada." }, { status: 401 });

  try {
    const payload = await request.json() as Record<string, unknown>;
    const vehicleId = cleanFleetText(payload.vehicleId, 80);
    const workDate = cleanFleetText(payload.workDate, 10);
    const department = cleanFleetText(payload.department, 160);
    const responsibleId = cleanFleetText(payload.responsibleId, 120);
    const responsibleName = cleanFleetText(payload.responsibleName, 160);
    const startNotes = cleanFleetText(payload.startNotes, 600);
    const startKm = parseOdometer(payload.startKm);

    if (!vehicleId || !department) return jsonNoStore({ error: "Selecione um veículo do setor." }, { status: 400 });
    if (!isIsoWorkDate(workDate)) return jsonNoStore({ error: "Informe uma data de trabalho válida." }, { status: 400 });
    if (!responsibleId || !responsibleName) return jsonNoStore({ error: "Não foi possível identificar o funcionário responsável." }, { status: 400 });
    if (startKm === null) return jsonNoStore({ error: "Informe uma quilometragem inicial válida." }, { status: 400 });

    const db = getDb();
    const vehicleRows = await db.select().from(fleetVehicles)
      .where(and(eq(fleetVehicles.id, vehicleId), eq(fleetVehicles.department, department))).limit(1);
    const vehicle = vehicleRows[0];
    if (!vehicle) return jsonNoStore({ error: "Veículo não encontrado neste setor." }, { status: 404 });
    if (!vehicle.active) return jsonNoStore({ error: "Este veículo está inativo e não pode iniciar uma jornada." }, { status: 409 });

    const openRecord = await db.select({ id: fleetMileageRecords.id, workDate: fleetMileageRecords.workDate }).from(fleetMileageRecords)
      .where(and(eq(fleetMileageRecords.vehicleId, vehicleId), eq(fleetMileageRecords.status, "open"))).limit(1);
    if (openRecord[0]) return jsonNoStore({ error: `O veículo possui uma jornada aberta em ${openRecord[0].workDate}. Encerre-a antes de iniciar outra.` }, { status: 409 });
    const existingDay = await db.select({ id: fleetMileageRecords.id }).from(fleetMileageRecords)
      .where(and(eq(fleetMileageRecords.vehicleId, vehicleId), eq(fleetMileageRecords.workDate, workDate))).limit(1);
    if (existingDay[0]) return jsonNoStore({ error: "Este veículo já possui um registro de quilometragem para a data informada." }, { status: 409 });

    const odometerError = validateStartOdometer(startKm, vehicle.currentOdometer);
    if (odometerError) return jsonNoStore({ error: odometerError }, { status: 400 });

    const now = new Date().toISOString();
    const record = {
      id: crypto.randomUUID(), vehicleId, workDate, department, responsibleId, responsibleName,
      startKm, startAt: now, startNotes, endKm: null, endAt: null, endNotes: "",
      distanceKm: null, status: "open", createdBy: actor.id, closedBy: null, closedByName: null,
      createdAt: now, updatedAt: now,
    };
    await db.batch([
      db.insert(fleetMileageRecords).values(record),
      db.insert(fleetAuditLogs).values({
        id: crypto.randomUUID(), entityType: "mileage_record", entityId: record.id, action: "journey_started",
        actorId: actor.id, actorName: actor.name,
        detailJson: JSON.stringify({ vehicleId, plate: vehicle.plate, workDate, responsibleId, responsibleName, startKm, startNotes }), createdAt: now,
      }),
    ]);
    return jsonNoStore({ ok: true, record: { ...record, vehiclePlate: vehicle.plate, vehicleName: vehicle.name } }, { status: 201 });
  } catch (error) {
    return fleetError(error, "Não foi possível registrar o início da jornada.");
  }
}

export async function PATCH(request: Request) {
  const actor = fleetSession(request);
  if (!actor) return jsonNoStore({ error: "Sessão expirada." }, { status: 401 });

  try {
    const payload = await request.json() as Record<string, unknown>;
    const id = cleanFleetText(payload.id, 80);
    const endKm = parseOdometer(payload.endKm);
    const endNotes = cleanFleetText(payload.endNotes, 600);
    const closedByName = cleanFleetText(payload.closedByName, 160) || actor.name;
    if (!id) return jsonNoStore({ error: "Informe o registro que será encerrado." }, { status: 400 });
    if (endKm === null) return jsonNoStore({ error: "Informe uma quilometragem final válida." }, { status: 400 });

    const db = getDb();
    const rows = await db.select({ record: fleetMileageRecords, vehicle: fleetVehicles }).from(fleetMileageRecords)
      .innerJoin(fleetVehicles, eq(fleetMileageRecords.vehicleId, fleetVehicles.id))
      .where(eq(fleetMileageRecords.id, id)).limit(1);
    if (!rows[0]) return jsonNoStore({ error: "Registro de quilometragem não encontrado." }, { status: 404 });
    const { record, vehicle } = rows[0];
    if (record.status !== "open") return jsonNoStore({ error: "Esta jornada já foi encerrada e permanece bloqueada para preservar a auditoria." }, { status: 409 });

    const odometerError = validateEndOdometer(endKm, record.startKm);
    if (odometerError) return jsonNoStore({ error: odometerError }, { status: 400 });
    if (endKm < vehicle.currentOdometer) return jsonNoStore({ error: "A quilometragem final não pode ser menor que o hodômetro atual do veículo." }, { status: 400 });

    const now = new Date().toISOString();
    const distanceKm = calculateDistance(record.startKm, endKm);
    const changes = { endKm, endAt: now, endNotes, distanceKm, status: "closed", closedBy: actor.id, closedByName, updatedAt: now };
    await db.batch([
      db.update(fleetMileageRecords).set(changes).where(and(eq(fleetMileageRecords.id, id), eq(fleetMileageRecords.status, "open"))),
      db.update(fleetVehicles).set({ currentOdometer: endKm, updatedAt: now }).where(eq(fleetVehicles.id, vehicle.id)),
      db.insert(fleetAuditLogs).values({
        id: crypto.randomUUID(), entityType: "mileage_record", entityId: id, action: "journey_closed",
        actorId: actor.id, actorName: actor.name,
        detailJson: JSON.stringify({ vehicleId: vehicle.id, plate: vehicle.plate, workDate: record.workDate, startKm: record.startKm, endKm, distanceKm, endNotes, closedByName }), createdAt: now,
      }),
    ]);
    return jsonNoStore({ ok: true, record: { ...record, ...changes, vehiclePlate: vehicle.plate, vehicleName: vehicle.name } });
  } catch (error) {
    return fleetError(error, "Não foi possível encerrar a jornada.");
  }
}
