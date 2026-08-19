import { hasValidSession } from "../../auth-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const memoryCache = new Map<string, { lat: number; lon: number; displayName: string; at: number }>();
let lastRequestAt = 0;
let requestChain: Promise<void> = Promise.resolve();

function clean(value: string, max = 420) { return value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max); }
function wait(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }
async function rateLimited<T>(task: () => Promise<T>): Promise<T> {
  let release!: () => void;
  const previous = requestChain;
  requestChain = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try {
    const elapsed = Date.now() - lastRequestAt;
    if (elapsed < 1100) await wait(1100 - elapsed);
    lastRequestAt = Date.now();
    return await task();
  } finally { release(); }
}

export async function GET(request: Request) {
  if (!hasValidSession(request)) return Response.json({ error: "Sessão expirada." }, { status: 401 });
  const url = new URL(request.url);
  const q = clean(url.searchParams.get("q") || "");
  const precision = url.searchParams.get("precision") === "bairro" ? "bairro" : "endereço";
  if (!q) return Response.json({ error: "Informe um endereço." }, { status: 400 });
  const cacheKey = q.toLocaleLowerCase("pt-BR");
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.at < 30 * 86400000) return Response.json({ found: true, lat: cached.lat, lon: cached.lon, displayName: cached.displayName, precision }, { headers: { "cache-control": "private, max-age=86400" } });

  try {
    const result = await rateLimited(async () => {
      const endpoint = new URL("https://nominatim.openstreetmap.org/search");
      endpoint.searchParams.set("format", "jsonv2");
      endpoint.searchParams.set("limit", "1");
      endpoint.searchParams.set("countrycodes", "br");
      endpoint.searchParams.set("q", q);
      const response = await fetch(endpoint, {
        headers: {
          "User-Agent": "Prefeitura-Conecta/4.6.7 (mapa municipal de Varzea da Palma; contato administrativo via portal municipal)",
          "Accept-Language": "pt-BR,pt;q=0.9",
        },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Geocodificação indisponível (${response.status}).`);
      const list = await response.json() as Array<{ lat?: string; lon?: string; display_name?: string }>;
      return list[0] || null;
    });
    if (!result) return Response.json({ found: false, precision }, { headers: { "cache-control": "private, max-age=3600" } });
    const lat = Number(result.lat), lon = Number(result.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return Response.json({ found: false, precision });
    const displayName = clean(result.display_name || q, 600);
    memoryCache.set(cacheKey, { lat, lon, displayName, at: Date.now() });
    return Response.json({ found: true, lat, lon, displayName, precision }, { headers: { "cache-control": "private, max-age=2592000" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível localizar o endereço." }, { status: 502 });
  }
}
