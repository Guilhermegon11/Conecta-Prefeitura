const memoryCache = new Map<string, { lat: number; lng: number; displayName: string; expiresAt: number }>();
let lastRequestAt = 0;
let queue: Promise<void> = Promise.resolve();

function normalizeQuery(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 240);
}

async function throttle() {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < 1100) await new Promise((resolve) => setTimeout(resolve, 1100 - elapsed));
  lastRequestAt = Date.now();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("q") ?? "";
  const query = normalizeQuery(raw);
  if (!query) return Response.json({ error: "Endereço obrigatório" }, { status: 400 });

  const key = query.toLocaleLowerCase("pt-BR");
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return Response.json({ lat: cached.lat, lng: cached.lng, displayName: cached.displayName, cached: true });
  }

  let release!: () => void;
  const previous = queue;
  queue = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try {
    await throttle();
    const endpoint = new URL("https://nominatim.openstreetmap.org/search");
    endpoint.searchParams.set("format", "jsonv2");
    endpoint.searchParams.set("limit", "1");
    endpoint.searchParams.set("countrycodes", "br");
    endpoint.searchParams.set("accept-language", "pt-BR");
    endpoint.searchParams.set("q", query);

    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        "User-Agent": "PrefeituraConecta/1.0 (mapa-de-chamados; contato institucional)",
      },
    });
    if (!response.ok) return Response.json({ error: "Serviço de localização indisponível" }, { status: 502 });
    const results = await response.json() as Array<{ lat: string; lon: string; display_name?: string }>;
    const first = results[0];
    if (!first) return Response.json({ error: "Rua não encontrada" }, { status: 404 });
    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return Response.json({ error: "Coordenadas inválidas" }, { status: 502 });
    const result = { lat, lng, displayName: first.display_name ?? query, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30 };
    memoryCache.set(key, result);
    return Response.json({ lat, lng, displayName: result.displayName, cached: false }, { headers: { "Cache-Control": "public, max-age=86400, s-maxage=2592000" } });
  } catch {
    return Response.json({ error: "Falha ao localizar a rua" }, { status: 502 });
  } finally {
    release();
  }
}
