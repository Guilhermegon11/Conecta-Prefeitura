export type FleetRecordStatus = "open" | "closed";

export type FleetVehicle = {
  id: string;
  plate: string;
  name: string;
  brandModel: string;
  department: string;
  currentOdometer: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FleetMileageRecord = {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleName: string;
  workDate: string;
  department: string;
  responsibleId: string;
  responsibleName: string;
  startKm: number;
  startAt: string;
  startNotes: string;
  endKm: number | null;
  endAt: string | null;
  endNotes: string;
  distanceKm: number | null;
  status: FleetRecordStatus;
  closedByName: string | null;
  createdAt: string;
  updatedAt: string;
};

export function cleanFleetText(value: unknown, maximum = 180) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maximum) : "";
}

export function normalizeVehiclePlate(value: unknown) {
  return cleanFleetText(value, 16).toLocaleUpperCase("pt-BR").replace(/[^A-Z0-9-]/g, "");
}

export function isValidVehiclePlate(value: string) {
  return /^[A-Z0-9][A-Z0-9-]{2,15}$/.test(value);
}

export function isIsoWorkDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function parseOdometer(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 9_999_999.9) return null;
  return Math.round(parsed * 10) / 10;
}

export function validateStartOdometer(startKm: number, currentOdometer: number) {
  if (startKm < currentOdometer) {
    return `A quilometragem inicial não pode ser menor que o hodômetro atual (${formatKm(currentOdometer)} km).`;
  }
  return null;
}

export function validateEndOdometer(endKm: number, startKm: number) {
  if (endKm < startKm) return `A quilometragem final não pode ser menor que a inicial (${formatKm(startKm)} km).`;
  return null;
}

export function calculateDistance(startKm: number, endKm: number) {
  return Math.round((endKm - startKm) * 10) / 10;
}

export function formatKm(value: number) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}
