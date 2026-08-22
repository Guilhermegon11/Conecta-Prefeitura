import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { fleetAuditLogs, fleetMileageRecords, fleetVehicles } from "../../../../db/schema";
import { fleetError, fleetSession, jsonNoStore } from "../../../fleet-api.server";
import { cleanFleetText, isValidVehiclePlate, normalizeVehiclePlate, parseOdometer } from "../../../fleet-mileage-domain";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actor = fleetSession(request);
  if (!actor) return jsonNoStore({ error: "Sessão expirada." }, { status: 401 });

  const url = new URL(request.url);
  const department = cleanFleetText(url.searchParams.get("department"), 160);
  const includeInactive = url.searchParams.get("includeInactive") === "true";
  if (!department) return jsonNoStore({ error: "Informe o setor responsável pela frota." }, { status: 400 });

  try {
    const db = getDb();
    const vehicles = await db.select().from(fleetVehicles)
      .where(includeInactive
        ? eq(fleetVehicles.department, department)
        : and(eq(fleetVehicles.department, department), eq(fleetVehicles.active, true)))
      .orderBy(asc(fleetVehicles.plate));
    return jsonNoStore({ ok: true, vehicles });
  } catch (error) {
    return fleetError(error, "Não foi possível consultar os veículos.");
  }
}

export async function POST(request: Request) {
  const actor = fleetSession(request);
  if (!actor) return jsonNoStore({ error: "Sessão expirada." }, { status: 401 });

  try {
    const payload = await request.json() as Record<string, unknown>;
    const plate = normalizeVehiclePlate(payload.plate);
    const name = cleanFleetText(payload.name, 140);
    const brandModel = cleanFleetText(payload.brandModel, 140);
    const department = cleanFleetText(payload.department, 160);
    const currentOdometer = parseOdometer(payload.currentOdometer);

    if (!isValidVehiclePlate(plate)) return jsonNoStore({ error: "Informe uma placa ou prefixo válido, com 3 a 16 caracteres." }, { status: 400 });
    if (!name) return jsonNoStore({ error: "Informe a identificação do veículo." }, { status: 400 });
    if (!department) return jsonNoStore({ error: "Informe o setor responsável pelo veículo." }, { status: 400 });
    if (currentOdometer === null) return jsonNoStore({ error: "Informe uma quilometragem atual válida." }, { status: 400 });

    const db = getDb();
    const duplicate = await db.select({ id: fleetVehicles.id }).from(fleetVehicles)
      .where(and(eq(fleetVehicles.department, department), eq(fleetVehicles.plate, plate))).limit(1);
    if (duplicate[0]) return jsonNoStore({ error: `A placa ou prefixo ${plate} já está cadastrado neste setor.` }, { status: 409 });

    const now = new Date().toISOString();
    const vehicle = {
      id: crypto.randomUUID(), plate, name, brandModel, department, currentOdometer,
      active: true, createdBy: actor.id, createdAt: now, updatedAt: now,
    };
    const audit = {
      id: crypto.randomUUID(), entityType: "vehicle", entityId: vehicle.id, action: "vehicle_created",
      actorId: actor.id, actorName: actor.name, detailJson: JSON.stringify({ plate, name, brandModel, department, currentOdometer }), createdAt: now,
    };
    await db.batch([
      db.insert(fleetVehicles).values(vehicle),
      db.insert(fleetAuditLogs).values(audit),
    ]);
    return jsonNoStore({ ok: true, vehicle }, { status: 201 });
  } catch (error) {
    return fleetError(error, "Não foi possível cadastrar o veículo.");
  }
}

export async function PATCH(request: Request) {
  const actor = fleetSession(request);
  if (!actor) return jsonNoStore({ error: "Sessão expirada." }, { status: 401 });

  try {
    const payload = await request.json() as Record<string, unknown>;
    const id = cleanFleetText(payload.id, 80);
    const department = cleanFleetText(payload.department, 160);
    if (!id || !department) return jsonNoStore({ error: "Informe o veículo e o setor." }, { status: 400 });

    const db = getDb();
    const current = await db.select().from(fleetVehicles)
      .where(and(eq(fleetVehicles.id, id), eq(fleetVehicles.department, department))).limit(1);
    if (!current[0]) return jsonNoStore({ error: "Veículo não encontrado neste setor." }, { status: 404 });

    const nextActive = typeof payload.active === "boolean" ? payload.active : current[0].active;
    if (!nextActive) {
      const openRecord = await db.select({ id: fleetMileageRecords.id }).from(fleetMileageRecords)
        .where(and(eq(fleetMileageRecords.vehicleId, id), eq(fleetMileageRecords.status, "open"))).limit(1);
      if (openRecord[0]) return jsonNoStore({ error: "Encerre a jornada aberta antes de inativar este veículo." }, { status: 409 });
    }

    const plate = payload.plate === undefined ? current[0].plate : normalizeVehiclePlate(payload.plate);
    const name = payload.name === undefined ? current[0].name : cleanFleetText(payload.name, 140);
    const brandModel = payload.brandModel === undefined ? current[0].brandModel : cleanFleetText(payload.brandModel, 140);
    const parsedOdometer = payload.currentOdometer === undefined ? current[0].currentOdometer : parseOdometer(payload.currentOdometer);
    if (!isValidVehiclePlate(plate) || !name || parsedOdometer === null) return jsonNoStore({ error: "Os dados informados para o veículo são inválidos." }, { status: 400 });
    if (parsedOdometer < current[0].currentOdometer) return jsonNoStore({ error: "O hodômetro não pode ser reduzido manualmente." }, { status: 400 });

    const conflict = await db.select({ id: fleetVehicles.id }).from(fleetVehicles)
      .where(and(eq(fleetVehicles.department, department), eq(fleetVehicles.plate, plate))).limit(1);
    if (conflict[0] && conflict[0].id !== id) return jsonNoStore({ error: `A placa ou prefixo ${plate} já está cadastrado neste setor.` }, { status: 409 });

    const now = new Date().toISOString();
    const changes = { plate, name, brandModel, currentOdometer: parsedOdometer, active: nextActive, updatedAt: now };
    await db.batch([
      db.update(fleetVehicles).set(changes).where(eq(fleetVehicles.id, id)),
      db.insert(fleetAuditLogs).values({
        id: crypto.randomUUID(), entityType: "vehicle", entityId: id, action: "vehicle_updated",
        actorId: actor.id, actorName: actor.name, detailJson: JSON.stringify({ before: current[0], after: changes }), createdAt: now,
      }),
    ]);
    return jsonNoStore({ ok: true, vehicle: { ...current[0], ...changes } });
  } catch (error) {
    return fleetError(error, "Não foi possível atualizar o veículo.");
  }
}
