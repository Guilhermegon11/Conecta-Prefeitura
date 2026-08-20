import { hasValidSession } from "../../auth-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OFFICIAL_ORIGIN = "https://www.varzeadapalma.mg.gov.br";
const NEWS_URL = `${OFFICIAL_ORIGIN}/portal/noticias/`;
const RSS_URL = `${OFFICIAL_ORIGIN}/portal/rss`;
const CACHE_TTL = 15 * 60 * 1000;

export type PrefeituraNewsItem = {
  id: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: string;
  url: string;
};

const FALLBACK_ITEMS: PrefeituraNewsItem[] = [
  {
    id: "oficial-5461",
    title: "Várzea da Palma conquista, pela primeira vez, o Selo Nota A da STN",
    summary: "O município recebeu a classificação máxima pela qualidade das informações contábeis e fiscais enviadas ao Siconfi.",
    category: "Administração e Finanças",
    publishedAt: "2026-08-17T12:00:00.000Z",
    url: `${NEWS_URL}0/3/5461/varzea-da-palma-conquista-pela-primeira-vez-o-selo-nota-a-da-stn/`,
  },
  {
    id: "oficial-5460",
    title: "Várzea da Palma alcança pontuação máxima no ICMS Turístico",
    summary: "O resultado reconhece o trabalho municipal de valorização das potencialidades turísticas e fortalece o desenvolvimento do setor.",
    category: "Turismo",
    publishedAt: "2026-08-17T11:30:00.000Z",
    url: `${NEWS_URL}0/3/5460/varzea-da-palma-alcanca-pontuacao-maxima-no-icms-turistico/`,
  },
  {
    id: "oficial-5459",
    title: "Várzea da Palma avança na Educação: IDEB cresce e alcança 5,9",
    summary: "A rede municipal elevou o indicador de 5,7 para 5,9, resultado atribuído ao trabalho conjunto de profissionais, estudantes e famílias.",
    category: "Educação",
    publishedAt: "2026-08-17T11:00:00.000Z",
    url: `${NEWS_URL}0/3/5459/varzea-da-palma-avanca-na-educacao-ideb-cresce-e-alcanca-59/`,
  },
  {
    id: "oficial-5458",
    title: "Prefeitura realiza audiência pública para fortalecer a proteção ambiental da Serra do Cabral",
    summary: "A consulta reuniu representantes locais para discutir a atualização das normas da Área de Proteção Ambiental da Serra do Cabral.",
    category: "Meio Ambiente",
    publishedAt: "2026-06-23T12:00:00.000Z",
    url: `${NEWS_URL}0/3/5458/prefeitura-realiza-audiencia-publica-para-fortalecer-a-protecao-ambiental-da-serra-do-cabral/`,
  },
  {
    id: "oficial-5457",
    title: "Município realiza a 18ª Conferência Municipal de Saúde",
    summary: "Profissionais, gestores, conselheiros e sociedade civil participaram do encontro para debater prioridades da saúde municipal.",
    category: "Saúde",
    publishedAt: "2026-06-18T12:06:00.000Z",
    url: `${NEWS_URL}0/3/5457/no-dia-18-a-prefeitura-de-varzea-da-palma-por-meio-da-secretaria-municipal-de-saude-e-do-conselho-municipal-de-saude-realizou-a-18-conferencia-municipal-de-saude-reunindo-profissionais-da-area-g/`,
  },
  {
    id: "oficial-5456",
    title: "Prefeitura promove Semana do Meio Ambiente 2026",
    summary: "A programação municipal reuniu ações de conscientização, educação ambiental e valorização dos recursos naturais.",
    category: "Meio Ambiente",
    publishedAt: "2026-06-08T11:59:00.000Z",
    url: `${NEWS_URL}0/3/5456/prefeitura-promove-semana-do-meio-ambiente-2026-com-acoes-de-conscientizacao-e-sustentabilidade/`,
  },
  {
    id: "oficial-5455",
    title: "Reunião de alinhamento para o MP Itinerante",
    summary: "A Prefeitura alinhou a chegada da iniciativa que levará serviços e atendimentos públicos à população.",
    category: "Secretarias",
    publishedAt: "2026-06-02T11:53:00.000Z",
    url: `${NEWS_URL}0/3/5455/reuniao-de-alinhamento-para-o-mp-itinerante/`,
  },
];

let memoryCache: { items: PrefeituraNewsItem[]; fetchedAt: string; expiresAt: number } | null = null;

function decodeEntities(value: string) {
  const named: Record<string, string> = { amp: "&", quot: "\"", apos: "'", lt: "<", gt: ">", nbsp: " " };
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, entity: string) => named[entity.toLowerCase()] ?? match);
}

function cleanText(value: string, max = 360) {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function readTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1] ?? "";
}

function officialUrl(value: string) {
  try {
    const url = new URL(cleanText(value, 900), OFFICIAL_ORIGIN);
    if (url.hostname !== "www.varzeadapalma.mg.gov.br" && url.hostname !== "varzeadapalma.mg.gov.br") return "";
    if (!url.pathname.startsWith("/portal/noticias/")) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function publishedIso(value: string, fallbackIndex: number) {
  const parsed = Date.parse(cleanText(value, 120));
  if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  return new Date(Date.now() - fallbackIndex * 60_000).toISOString();
}

function parseOfficialNewsFeed(xml: string): PrefeituraNewsItem[] {
  const blocks = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
  return blocks.flatMap((block, index) => {
    const title = cleanText(readTag(block, "title"), 210);
    const link = officialUrl(readTag(block, "link") || readTag(block, "guid"));
    if (!title || !link) return [];
    const rawSummary = readTag(block, "description") || readTag(block, "content:encoded");
    const summary = cleanText(rawSummary, 280) || "Acesse a publicação completa no portal oficial da Prefeitura.";
    const category = cleanText(readTag(block, "category"), 90) || "Prefeitura";
    const idMatch = link.match(/\/portal\/noticias\/\d+\/\d+\/(\d+)\//);
    return [{
      id: idMatch ? `oficial-${idMatch[1]}` : `oficial-rss-${index}`,
      title,
      summary,
      category,
      publishedAt: publishedIso(readTag(block, "pubDate") || readTag(block, "dc:date"), index),
      url: link,
    }];
  }).sort((first, second) => Date.parse(second.publishedAt) - Date.parse(first.publishedAt)).slice(0, 18);
}

async function loadOfficialNews(forceRefresh = false) {
  if (!forceRefresh && memoryCache && memoryCache.expiresAt > Date.now()) return { ...memoryCache, source: "rss" as const, cached: true };
  try {
    const response = await fetch(RSS_URL, {
      headers: { Accept: "application/rss+xml, application/xml, text/xml, text/html;q=0.8", "User-Agent": "Prefeitura-Conecta/4.7.9 (painel interno municipal)" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`RSS oficial indisponível (${response.status}).`);
    const items = parseOfficialNewsFeed(await response.text());
    if (!items.length) throw new Error("O RSS oficial não retornou publicações reconhecíveis.");
    const fetchedAt = new Date().toISOString();
    memoryCache = { items, fetchedAt, expiresAt: Date.now() + CACHE_TTL };
    return { ...memoryCache, source: "rss" as const, cached: false };
  } catch {
    return { items: FALLBACK_ITEMS, fetchedAt: new Date().toISOString(), expiresAt: Date.now() + 60_000, source: "verified-fallback" as const, cached: false };
  }
}

export async function GET(request: Request) {
  if (!hasValidSession(request)) return Response.json({ error: "Sessão expirada." }, { status: 401 });
  const forceRefresh = new URL(request.url).searchParams.has("refresh");
  const result = await loadOfficialNews(forceRefresh);
  return Response.json({
    ok: true,
    source: result.source,
    cached: result.cached,
    fetchedAt: result.fetchedAt,
    officialPortalUrl: OFFICIAL_ORIGIN,
    officialNewsUrl: NEWS_URL,
    items: result.items,
  }, { headers: { "cache-control": "private, max-age=300, stale-while-revalidate=900" } });
}
