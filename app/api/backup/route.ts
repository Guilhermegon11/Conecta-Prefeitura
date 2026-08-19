import { hasValidSession } from "../../auth-session";
import { createCriticalBackup } from "../../backup.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasValidSession(request)) return Response.json({ error: "Sessão expirada." }, { status: 401 });
  try {
    const result = await createCriticalBackup("manual");
    return Response.json({ ok: true, backup: result.stamp, count: result.count });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao criar backup." }, { status: 503 });
  }
}
