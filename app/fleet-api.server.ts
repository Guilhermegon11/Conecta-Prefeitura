import { sessionForRequest } from "./auth-session";
import { cleanFleetText } from "./fleet-mileage-domain";

export function fleetSession(request: Request) {
  const session = sessionForRequest(request);
  return session ? { id: cleanFleetText(session.user, 120) || "usuario", name: cleanFleetText(session.user, 120) || "Usuário autenticado" } : null;
}

export function fleetError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const normalized = message.toLocaleLowerCase("pt-BR");
  if (normalized.includes("unique constraint") || normalized.includes("constraint failed")) {
    return Response.json({ error: "Já existe um registro com esses dados." }, { status: 409, headers: { "cache-control": "no-store" } });
  }
  if (normalized.includes("no such table") || normalized.includes("serviços de armazenamento")) {
    return Response.json({ error: "O banco da frota ainda não foi preparado. Aplique a migração da versão 6.2.0." }, { status: 503, headers: { "cache-control": "no-store" } });
  }
  return Response.json({ error: message || fallback }, { status: 500, headers: { "cache-control": "no-store" } });
}

export function jsonNoStore(value: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("cache-control", "no-store");
  return Response.json(value, { ...init, headers });
}
