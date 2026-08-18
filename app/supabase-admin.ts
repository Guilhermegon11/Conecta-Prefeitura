export const DATA_BUCKET = "prefeitura-conecta-data";
let bucketReady: Promise<void> | null = null;

export function supabaseAdminConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) throw new Error("Supabase não está configurado neste ambiente. Verifique a integração do projeto na Vercel.");
  return { url: url.replace(/\/$/, ""), secret };
}

export function supabaseAdminHeaders(contentType?: string) {
  const { secret } = supabaseAdminConfig();
  const headers: Record<string,string> = { apikey: secret };
  // As novas chaves `sb_secret_...` autenticam chamadas server-to-server pelo header `apikey`.
  // A chave legada `service_role` é um JWT e continua compatível com Authorization Bearer.
  if (!secret.startsWith("sb_secret_")) headers.authorization = `Bearer ${secret}`;
  if (contentType) headers["content-type"] = contentType;
  return headers;
}

export function storagePath(path: string) {
  return path.split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

export async function ensureDataBucket() {
  if (!bucketReady) {
    bucketReady = (async () => {
      const { url } = supabaseAdminConfig();
      const check = await fetch(`${url}/storage/v1/bucket/${encodeURIComponent(DATA_BUCKET)}`, { headers: supabaseAdminHeaders(), cache: "no-store" });
      if (check.ok) return;
      if (check.status !== 404) throw new Error(`Não foi possível consultar o armazenamento do Supabase. ${await check.text().catch(() => "")}`.trim());
      const response = await fetch(`${url}/storage/v1/bucket`, {
        method: "POST",
        headers: supabaseAdminHeaders("application/json"),
        body: JSON.stringify({ id: DATA_BUCKET, name: DATA_BUCKET, public: false, file_size_limit: 15 * 1024 * 1024 }),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        if (response.status === 409 || /already exists|duplicate/i.test(detail)) return;
        throw new Error(`Não foi possível preparar o armazenamento do Supabase. ${detail}`.trim());
      }
    })();
  }
  try { await bucketReady; } catch (error) { bucketReady = null; throw error; }
}

export async function uploadPrivateObject(path: string, body: BodyInit, contentType: string, upsert = true) {
  await ensureDataBucket();
  const { url } = supabaseAdminConfig();
  const response = await fetch(`${url}/storage/v1/object/${DATA_BUCKET}/${storagePath(path)}`, {
    method: "POST",
    headers: { ...supabaseAdminHeaders(contentType), ...(upsert ? { "x-upsert": "true" } : {}), "cache-control": "no-store" },
    body,
  });
  if (!response.ok) throw new Error(await response.text());
  return response;
}

export async function downloadPrivateObject(path: string) {
  await ensureDataBucket();
  const { url } = supabaseAdminConfig();
  return fetch(`${url}/storage/v1/object/${DATA_BUCKET}/${storagePath(path)}`, { headers: supabaseAdminHeaders(), cache: "no-store" });
}

export async function uploadJsonObject(path: string, value: unknown) {
  return uploadPrivateObject(path, JSON.stringify(value ?? null), "application/json", true);
}

export async function downloadJsonObject<T>(path: string): Promise<T | null> {
  const response = await downloadPrivateObject(path);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}
