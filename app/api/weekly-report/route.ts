import { hasValidSession } from "../../auth-session";
import { DATA_BUCKET, downloadJsonObject, ensureDataBucket, supabaseAdminConfig, supabaseAdminHeaders } from "../../supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WeeklyRecord = { generatedAt: string; report: string; source: string; [key: string]: unknown };

export async function GET(request: Request) {
  if (!hasValidSession(request)) return Response.json({ error: "Sessão expirada." }, { status: 401 });
  try {
    await ensureDataBucket();
    const { url } = supabaseAdminConfig();
    const response = await fetch(`${url}/storage/v1/object/list/${encodeURIComponent(DATA_BUCKET)}`, {
      method: "POST",
      headers: supabaseAdminHeaders("application/json"),
      body: JSON.stringify({ prefix: "reports/weekly", limit: 20, offset: 0, sortBy: { column: "name", order: "desc" } }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(await response.text());
    const objects = await response.json() as Array<{ name?: string }>;
    const name = objects.find((item) => item.name?.endsWith(".json"))?.name;
    if (!name) return Response.json({ ok: true, report: null });
    const record = await downloadJsonObject<WeeklyRecord>(`reports/weekly/${name}`);
    return Response.json({ ok: true, report: record }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao consultar relatório semanal." }, { status: 503 });
  }
}
