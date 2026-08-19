import { createCriticalBackup } from "../../../backup.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

export async function GET(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Cron não autorizado." }, { status: 401 });
  try {
    const result = await createCriticalBackup("scheduled");
    return Response.json({ ok: true, backup: result.stamp, count: result.count });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha no backup agendado." }, { status: 503 });
  }
}
