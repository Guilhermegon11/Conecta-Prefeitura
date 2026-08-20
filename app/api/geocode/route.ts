import { hasValidSession } from "../../auth-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CacheEntry = { lat: number; lon: number; displayName: string; neighborhood?: string; at: number };
type NominatimAddress = {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  residential?: string;
  path?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city_district?: string;
  city?: string;
  town?: string;
  municipality?: string;
  village?: string;
  state?: string;
  state_code?: string;
};
type NominatimResult = { lat?: string; lon?: string; display_name?: string; address?: NominatimAddress; error?: string };

const memoryCache = new Map<string, CacheEntry>();
let lastRequestAt = 0;
let requestChain: Promise<void> = Promise.resolve();

function clean(value: string, max = 420) { return value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max); }
function firstValue(values: Array<string | undefined>) { return values.find((value) => clean(value || "")) || ""; }
function stateLabel(address: NominatimAddress) {
  const code = clean(address.state_code || "", 12).toUpperCase().replace(/^BR[-_]/, "");
  if (code) return code;
  const state = clean(address.state || "", 80);
  return state === "Minas Gerais" ? "MG" : state;
}
function compactReverseAddress(result: NominatimResult) {
  const address = result.address || {};
  const street = clean(firstValue([address.road, address.pedestrian, address.residential, address.path]), 180);
  const number = clean(address.house_number || "", 30);
  const neighborhood = clean(firstValue([address.neighbourhood, address.suburb, address.quarter, address.city_district]), 120);
  const city = clean(firstValue([address.city, address.town, address.municipality, address.village]), 120);
  const state = stateLabel(address);
  const streetLine = [street, number].filter(Boolean).join(", ");
  const cityState = [city, state].filter(Boolean).join("/");
  const parts = [streetLine, neighborhood, cityState].filter((part, index, list) => part && list.findIndex((candidate) => candidate.toLocaleLowerCase("pt-BR") === part.toLocaleLowerCase("pt-BR")) === index);
  return { displayName: clean(parts.join(" · ") || result.display_name || "", 600), neighborhood };
}
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
  const latitudeParam = url.searchParams.get("lat");
  const longitudeParam = url.searchParams.get("lon");

  if (latitudeParam !== null || longitudeParam !== null) {
    const lat = Number(latitudeParam), lon = Number(longitudeParam);
    if (latitudeParam === null || longitudeParam === null || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      return Response.json({ error: "Localização inválida." }, { status: 400 });
    }
    const cacheKey = `reverse:${lat.toFixed(5)},${lon.toFixed(5)}`;
    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.at < 30 * 86400000) {
      return Response.json({ found: true, lat: cached.lat, lon: cached.lon, displayName: cached.displayName, neighborhood: cached.neighborhood || "", precision: "endereço" }, { headers: { "cache-control": "private, max-age=86400" } });
    }

    try {
      const result = await rateLimited(async () => {
        const endpoint = new URL("https://nominatim.openstreetmap.org/reverse");
        endpoint.searchParams.set("format", "jsonv2");
        endpoint.searchParams.set("addressdetails", "1");
        endpoint.searchParams.set("zoom", "18");
        endpoint.searchParams.set("lat", String(lat));
        endpoint.searchParams.set("lon", String(lon));
        const response = await fetch(endpoint, {
          headers: {
            "User-Agent": "Prefeitura-Conecta/4.9.4 (gestao municipal de Varzea da Palma; contato administrativo via portal municipal)",
            "Accept-Language": "pt-BR,pt;q=0.9",
          },
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Consulta de endereço indisponível (${response.status}).`);
        return await response.json() as NominatimResult;
      });
      if (!result || result.error) return Response.json({ found: false, precision: "endereço" }, { headers: { "cache-control": "private, max-age=3600" } });
      const resolved = compactReverseAddress(result);
      if (!resolved.displayName) return Response.json({ found: false, precision: "endereço" });
      const entry: CacheEntry = { lat, lon, displayName: resolved.displayName, neighborhood: resolved.neighborhood, at: Date.now() };
      memoryCache.set(cacheKey, entry);
      return Response.json({ found: true, lat, lon, displayName: entry.displayName, neighborhood: entry.neighborhood || "", precision: "endereço" }, { headers: { "cache-control": "private, max-age=2592000" } });
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "Não foi possível identificar o endereço atual." }, { status: 502 });
    }
  }

  const q = clean(url.searchParams.get("q") || "");
  const precision = url.searchParams.get("precision") === "bairro" ? "bairro" : "endereço";
  if (!q) return Response.json({ error: "Informe um endereço." }, { status: 400 });
  const cacheKey = `search:${q.toLocaleLowerCase("pt-BR")}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.at < 30 * 86400000) return Response.json({ found: true, lat: cached.lat, lon: cached.lon, displayName: cached.displayName, neighborhood: cached.neighborhood || "", precision }, { headers: { "cache-control": "private, max-age=86400" } });

  try {
    const result = await rateLimited(async () => {
      const endpoint = new URL("https://nominatim.openstreetmap.org/search");
      endpoint.searchParams.set("format", "jsonv2");
      endpoint.searchParams.set("limit", "1");
      endpoint.searchParams.set("countrycodes", "br");
      endpoint.searchParams.set("q", q);
      const response = await fetch(endpoint, {
        headers: {
          "User-Agent": "Prefeitura-Conecta/4.9.4 (gestao municipal de Varzea da Palma; contato administrativo via portal municipal)",
          "Accept-Language": "pt-BR,pt;q=0.9",
        },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Geocodificação indisponível (${response.status}).`);
      const list = await response.json() as NominatimResult[];
      return list[0] || null;
    });
    if (!result) return Response.json({ found: false, precision }, { headers: { "cache-control": "private, max-age=3600" } });
    const lat = Number(result.lat), lon = Number(result.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return Response.json({ found: false, precision });
    const displayName = clean(result.display_name || q, 600);
    memoryCache.set(cacheKey, { lat, lon, displayName, at: Date.now() });
    return Response.json({ found: true, lat, lon, displayName, neighborhood: "", precision }, { headers: { "cache-control": "private, max-age=2592000" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível localizar o endereço." }, { status: 502 });
  }
}
