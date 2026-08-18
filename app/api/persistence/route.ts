import { hasValidSession } from "../../auth-session";
import { DATA_BUCKET, downloadJsonObject, ensureDataBucket, storagePath, supabaseAdminConfig, supabaseAdminHeaders, uploadJsonObject } from "../../supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function validKey(key: string) { return key.length > 0 && key.length <= 240; }
function objectPath(key: string) { return `state/${Buffer.from(key, "utf8").toString("base64url")}.json`; }

export async function GET(request: Request) {
  if (!hasValidSession(request)) return Response.json({ error: "Sessão expirada." }, { status: 401 });
  try {
    const key = new URL(request.url).searchParams.get("key")?.trim() || "";
    if (!validKey(key)) return Response.json({ error: "Chave de persistência inválida." }, { status: 400 });
    const value = await downloadJsonObject<unknown>(objectPath(key));
    return Response.json({ found: value !== null, value });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Falha ao acessar o Supabase." }, { status: 503 }); }
}

export async function PUT(request: Request) {
  if (!hasValidSession(request)) return Response.json({ error: "Sessão expirada." }, { status: 401 });
  try {
    const body = await request.json() as { key?: unknown; value?: unknown };
    const key = typeof body.key === "string" ? body.key.trim() : "";
    if (!validKey(key)) return Response.json({ error: "Chave de persistência inválida." }, { status: 400 });
    await uploadJsonObject(objectPath(key), body.value ?? null);
    return Response.json({ ok: true, updatedAt: new Date().toISOString() });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Falha ao salvar no Supabase." }, { status: 503 }); }
}

export async function DELETE(request: Request) {
  if (!hasValidSession(request)) return Response.json({ error: "Sessão expirada." }, { status: 401 });
  try {
    await ensureDataBucket();
    const key = new URL(request.url).searchParams.get("key")?.trim() || "";
    if (!validKey(key)) return Response.json({ error: "Chave de persistência inválida." }, { status: 400 });
    const { url } = supabaseAdminConfig();
    const response = await fetch(`${url}/storage/v1/object/${DATA_BUCKET}/${storagePath(objectPath(key))}`, { method: "DELETE", headers: supabaseAdminHeaders() });
    if (!response.ok && response.status !== 404) throw new Error(await response.text());
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Falha ao remover o registro." }, { status: 503 }); }
}
