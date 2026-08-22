import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("validates and calculates odometer values with real domain code", async () => {
  const domain = await import(new URL("../app/fleet-mileage-domain.ts", import.meta.url));
  assert.equal(domain.normalizeVehiclePlate(" abc 1d23 "), "ABC1D23");
  assert.equal(domain.parseOdometer("123.45"), 123.5);
  assert.equal(domain.calculateDistance(1200.4, 1242.9), 42.5);
  assert.match(domain.validateStartOdometer(99, 100), /não pode ser menor/);
  assert.match(domain.validateEndOdometer(99, 100), /não pode ser menor/);
  assert.equal(domain.validateEndOdometer(125, 100), null);
});

test("adds a permission-aware fleet mileage module to the municipal navigation", async () => {
  const [page, access, component] = await Promise.all([
    read("app/page.tsx"),
    read("app/access-control.ts"),
    read("app/fleet-mileage.tsx"),
  ]);

  assert.match(page, /"Frota e Quilometragem": Bus/);
  assert.match(page, /<FleetMileageSection[^>]+readOnly=\{viewingOtherDepartment\}/);
  assert.match(access, /\| "Frota e Quilometragem"/);
  assert.match(access, /Saída, devolução e hodômetro diário dos veículos/);
  assert.match(component, /Início e encerramento da jornada/);
  assert.match(component, /Registrar início da jornada/);
  assert.match(component, /Registrar final e encerrar/);
});

test("exposes authenticated REST resources with odometer safeguards", async () => {
  const [mileage, vehicles, auth, domain] = await Promise.all([
    read("app/api/fleet/mileage/route.ts"),
    read("app/api/fleet/vehicles/route.ts"),
    read("app/fleet-api.server.ts"),
    read("app/fleet-mileage-domain.ts"),
  ]);

  assert.match(mileage, /export async function GET/);
  assert.match(mileage, /export async function POST/);
  assert.match(mileage, /export async function PATCH/);
  assert.match(vehicles, /export async function GET/);
  assert.match(vehicles, /export async function POST/);
  assert.match(vehicles, /export async function PATCH/);
  assert.match(auth, /sessionForRequest/);
  assert.match(domain, /startKm < currentOdometer/);
  assert.match(domain, /endKm < startKm/);
  assert.match(mileage, /status: "closed"/);
  assert.match(mileage, /calculateDistance/);
});

test("ships relational storage, unique daily records, and audit logs", async () => {
  const [schema, migration] = await Promise.all([
    read("db/schema.ts"),
    read("drizzle/0007_blue_guardian.sql"),
  ]);

  assert.match(schema, /export const fleetVehicles/);
  assert.match(schema, /export const fleetMileageRecords/);
  assert.match(schema, /export const fleetAuditLogs/);
  assert.match(migration, /CREATE UNIQUE INDEX `fleet_mileage_vehicle_date_uq`/);
  assert.match(migration, /CREATE INDEX `fleet_mileage_vehicle_status_idx`/);
  assert.match(migration, /CREATE TABLE `fleet_audit_logs`/);
});

test("provides responsive operational states and CSV history export", async () => {
  const [component, styles] = await Promise.all([
    read("app/fleet-mileage.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(component, /exportCsv/);
  assert.match(component, /fleet-loading/);
  assert.match(component, /fleet-error/);
  assert.match(component, /Nenhuma jornada pendente/);
  assert.match(styles, /Prefeitura Conecta v6\.2\.0/);
  assert.match(styles, /@media \(max-width:680px\)[\s\S]*?\.fleet-table-wrap td::before/);
});
