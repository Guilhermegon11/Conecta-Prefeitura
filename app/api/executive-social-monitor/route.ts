import { hasValidSession } from "../../auth-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MonitorTone = "positivo" | "neutro" | "negativo";
type MonitorSource = "mention" | "comment" | "hashtag";

type MonitorItem = {
  id: string;
  source: MonitorSource;
  sourceLabel: string;
  author: string;
  text: string;
  permalink: string;
  timestamp: string;
  matchedKeywords: string[];
  tone: MonitorTone;
  needsAttention: boolean;
  engagement: number;
};

type SourceStatus = { id: string; label: string; status: "connected" | "pending" | "error"; detail: string };
type MetaList<T> = { data?: T[] };
type MetaComment = { id?: string; text?: string; timestamp?: string; username?: string; from?: { username?: string; name?: string } };
type MetaMedia = {
  id?: string;
  caption?: string;
  permalink?: string;
  timestamp?: string;
  username?: string;
  like_count?: number;
  comments_count?: number;
  comments?: MetaList<MetaComment>;
};

type MonitorPayload = {
  ok: true;
  configured: boolean;
  updatedAt: string;
  message?: string;
  keywords: string[];
  hashtags: string[];
  items: MonitorItem[];
  summary: { total: number; positive: number; neutral: number; negative: number; needsAttention: number; engagement: number };
  sources: SourceStatus[];
};

const EXECUTIVE_PROFILE_IDS = new Set(["u-prefeito", "u-vice"]);
const DEFAULT_KEYWORDS = [
  "Prefeitura Várzea da Palma",
  "Prefeitura de Várzea da Palma",
  "Rodrigo Dalla",
  "Rodrigo Aguiar Dalla Bernardina",
  "Jaime DS",
  "Jaime de Souza",
];
const POSITIVE_TERMS = ["parabens", "parabéns", "bom trabalho", "excelente", "obrigado", "obrigada", "melhorou", "aprovado", "otimo", "ótimo", "muito bom"];
const NEGATIVE_TERMS = ["vergonha", "abandono", "demora", "problema", "buraco", "falta", "pessimo", "péssimo", "ruim", "descaso", "reclamacao", "reclamação", "nao funciona", "não funciona"];
const URGENT_TERMS = ["urgente", "socorro", "risco", "perigo", "denuncia", "denúncia", "acidente", "sem atendimento", "sem agua", "sem água"];
const CACHE_TTL_MS = 5 * 60 * 1000;
const responseCache = new Map<string, { expiresAt: number; payload: MonitorPayload }>();

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

function unique(values: string[]) {
  const found = new Set<string>();
  return values.map((value) => value.trim()).filter((value) => {
    const key = normalize(value);
    if (!key || found.has(key)) return false;
    found.add(key);
    return true;
  });
}

function parseEnvironmentList(value: string | undefined) {
  return value ? unique(value.split(/[\n,;|]+/)) : [];
}

function hashtagFromKeyword(value: string) {
  return normalize(value).replace(/[^a-z0-9]/g, "").slice(0, 60);
}

function matchingKeywords(text: string, keywords: string[]) {
  const normalizedText = normalize(text);
  return keywords.filter((keyword) => normalizedText.includes(normalize(keyword)));
}

function includesAny(text: string, terms: string[]) {
  const normalizedText = normalize(text);
  return terms.some((term) => normalizedText.includes(normalize(term)));
}

function classifyTone(text: string): { tone: MonitorTone; needsAttention: boolean } {
  const positiveScore = POSITIVE_TERMS.filter((term) => includesAny(text, [term])).length;
  const negativeScore = NEGATIVE_TERMS.filter((term) => includesAny(text, [term])).length;
  const urgent = includesAny(text, URGENT_TERMS);
  if (negativeScore > positiveScore) return { tone: "negativo", needsAttention: true };
  if (positiveScore > 0) return { tone: "positivo", needsAttention: urgent };
  return { tone: "neutro", needsAttention: urgent };
}

function monitorConfig() {
  const accessToken = process.env.INSTAGRAM_MONITOR_ACCESS_TOKEN || process.env.META_INSTAGRAM_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_MONITOR_USER_ID || process.env.META_INSTAGRAM_USER_ID || process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const graphVersion = (process.env.META_GRAPH_VERSION || "v26.0").replace(/^\/?/, "");
  return accessToken && userId ? { accessToken, userId, graphVersion } : null;
}

async function metaGet<T>(config: NonNullable<ReturnType<typeof monitorConfig>>, path: string, params: Record<string, string>) {
  const url = new URL(`https://graph.facebook.com/${config.graphVersion}/${path.replace(/^\//, "")}`);
  Object.entries({ ...params, access_token: config.accessToken }).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
  const payload = await response.json().catch(() => null) as (T & { error?: { message?: string } }) | null;
  if (!response.ok || !payload || payload.error) throw new Error(payload?.error?.message || `A Meta respondeu com status ${response.status}.`);
  return payload;
}

function createItem(input: Omit<MonitorItem, "tone" | "needsAttention" | "matchedKeywords"> & { keywords: string[]; extraMatches?: string[] }): MonitorItem {
  const classification = classifyTone(input.text);
  return {
    id: input.id,
    source: input.source,
    sourceLabel: input.sourceLabel,
    author: input.author,
    text: input.text,
    permalink: input.permalink,
    timestamp: input.timestamp,
    engagement: input.engagement,
    matchedKeywords: unique([...matchingKeywords(input.text, input.keywords), ...(input.extraMatches ?? [])]),
    ...classification,
  };
}

async function fetchMentionItems(config: NonNullable<ReturnType<typeof monitorConfig>>, keywords: string[]) {
  const payload = await metaGet<{ mentioned_media?: MetaList<MetaMedia> }>(config, config.userId, {
    fields: "mentioned_media.limit(50){id,caption,permalink,timestamp,username,like_count,comments_count}",
  });
  return (payload.mentioned_media?.data ?? []).map((media) => createItem({
    id: `mention-${media.id ?? crypto.randomUUID()}`,
    source: "mention",
    sourceLabel: "Marcação ao perfil",
    author: media.username ? `@${media.username}` : "Perfil do Instagram",
    text: media.caption?.trim() || "Publicação que marcou o perfil oficial.",
    permalink: media.permalink ?? "",
    timestamp: media.timestamp ?? "",
    engagement: Number(media.like_count ?? 0) + Number(media.comments_count ?? 0),
    keywords,
    extraMatches: ["@perfil oficial"],
  }));
}

async function fetchOfficialCommentItems(config: NonNullable<ReturnType<typeof monitorConfig>>, keywords: string[]) {
  const payload = await metaGet<MetaList<MetaMedia>>(config, `${config.userId}/media`, {
    fields: "id,caption,permalink,timestamp,comments.limit(100){id,text,timestamp,username,from}",
    limit: "30",
  });
  return (payload.data ?? []).flatMap((media) => (media.comments?.data ?? []).map((comment) => createItem({
    id: `comment-${comment.id ?? crypto.randomUUID()}`,
    source: "comment",
    sourceLabel: "Comentário em publicação oficial",
    author: comment.username ? `@${comment.username}` : comment.from?.username ? `@${comment.from.username}` : comment.from?.name || "Usuário do Instagram",
    text: comment.text?.trim() || "Comentário sem texto disponível.",
    permalink: media.permalink ?? "",
    timestamp: comment.timestamp ?? media.timestamp ?? "",
    engagement: 0,
    keywords,
    extraMatches: matchingKeywords(media.caption ?? "", keywords),
  })));
}

async function fetchHashtagItems(config: NonNullable<ReturnType<typeof monitorConfig>>, keywords: string[], hashtags: string[]) {
  const results = await Promise.allSettled(hashtags.map(async (hashtag) => {
    const search = await metaGet<MetaList<{ id?: string }>>(config, "ig_hashtag_search", { user_id: config.userId, q: hashtag });
    const hashtagId = search.data?.[0]?.id;
    if (!hashtagId) return [];
    const media = await metaGet<MetaList<MetaMedia>>(config, `${hashtagId}/recent_media`, {
      user_id: config.userId,
      fields: "id,caption,permalink,timestamp,username,like_count,comments_count",
      limit: "50",
    });
    return (media.data ?? []).map((item) => createItem({
      id: `hashtag-${hashtag}-${item.id ?? crypto.randomUUID()}`,
      source: "hashtag",
      sourceLabel: `Hashtag #${hashtag}`,
      author: item.username ? `@${item.username}` : "Perfil público do Instagram",
      text: item.caption?.trim() || `Publicação encontrada em #${hashtag}.`,
      permalink: item.permalink ?? "",
      timestamp: item.timestamp ?? "",
      engagement: Number(item.like_count ?? 0) + Number(item.comments_count ?? 0),
      keywords,
      extraMatches: [`#${hashtag}`],
    }));
  }));
  const items = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  if (results.length && results.every((result) => result.status === "rejected")) {
    const firstError = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
    throw firstError?.reason instanceof Error ? firstError.reason : new Error("A busca de hashtags não respondeu.");
  }
  return items;
}

function emptySummary(items: MonitorItem[]) {
  return {
    total: items.length,
    positive: items.filter((item) => item.tone === "positivo").length,
    neutral: items.filter((item) => item.tone === "neutro").length,
    negative: items.filter((item) => item.tone === "negativo").length,
    needsAttention: items.filter((item) => item.needsAttention).length,
    engagement: items.reduce((total, item) => total + item.engagement, 0),
  };
}

export async function GET(request: Request) {
  if (!hasValidSession(request)) return Response.json({ error: "Sessão expirada." }, { status: 401 });
  const url = new URL(request.url);
  const profileId = url.searchParams.get("profile") || "";
  if (!EXECUTIVE_PROFILE_IDS.has(profileId)) return Response.json({ error: "Área exclusiva do Prefeito e do Vice-Prefeito." }, { status: 403 });

  const requestedKeywords = unique(url.searchParams.getAll("keyword")).slice(0, 20);
  const environmentKeywords = parseEnvironmentList(process.env.INSTAGRAM_MONITOR_KEYWORDS);
  const keywords = requestedKeywords.length ? requestedKeywords : environmentKeywords.length ? environmentKeywords.slice(0, 20) : DEFAULT_KEYWORDS;
  const environmentHashtags = parseEnvironmentList(process.env.INSTAGRAM_MONITOR_HASHTAGS).map((item) => item.replace(/^#/, ""));
  const hashtags = unique(environmentHashtags.length ? environmentHashtags : keywords.map(hashtagFromKeyword).filter(Boolean)).slice(0, 12);
  const config = monitorConfig();
  const now = new Date().toISOString();

  if (!config) {
    const sources: SourceStatus[] = [
      { id: "mentions", label: "Marcações ao perfil", status: "pending", detail: "Aguardando conta profissional da Meta" },
      { id: "comments", label: "Comentários nos posts oficiais", status: "pending", detail: "Aguardando permissão de comentários" },
      { id: "hashtags", label: "Hashtags públicas", status: "pending", detail: "Aguardando Instagram Public Content Access" },
    ];
    return Response.json({
      ok: true,
      configured: false,
      updatedAt: now,
      message: "Configure INSTAGRAM_MONITOR_ACCESS_TOKEN e INSTAGRAM_MONITOR_USER_ID no servidor.",
      keywords,
      hashtags,
      items: [],
      summary: emptySummary([]),
      sources,
    } satisfies MonitorPayload, { headers: { "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow" } });
  }

  const cacheKey = `${profileId}:${keywords.map(normalize).join("|")}:${hashtags.join("|")}`;
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return Response.json(cached.payload, { headers: { "cache-control": "private, max-age=60", "x-robots-tag": "noindex, nofollow" } });

  const tasks = [
    { id: "mentions", label: "Marcações ao perfil", run: () => fetchMentionItems(config, keywords) },
    { id: "comments", label: "Comentários nos posts oficiais", run: () => fetchOfficialCommentItems(config, keywords) },
    { id: "hashtags", label: "Hashtags públicas", run: () => fetchHashtagItems(config, keywords, hashtags) },
  ];
  const results = await Promise.allSettled(tasks.map((task) => task.run()));
  const sources: SourceStatus[] = results.map((result, index) => ({
    id: tasks[index].id,
    label: tasks[index].label,
    status: result.status === "fulfilled" ? "connected" : "error",
    detail: result.status === "fulfilled" ? `${result.value.length} itens recebidos` : result.reason instanceof Error ? result.reason.message.slice(0, 140) : "Falha na consulta",
  }));
  const merged = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const deduplicated = Array.from(new Map(merged.map((item) => [`${item.source}:${item.id}`, item])).values())
    .sort((first, second) => new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime())
    .slice(0, 250);
  const payload: MonitorPayload = {
    ok: true,
    configured: true,
    updatedAt: now,
    keywords,
    hashtags,
    items: deduplicated,
    summary: emptySummary(deduplicated),
    sources,
  };
  responseCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, payload });
  return Response.json(payload, { headers: { "cache-control": "private, max-age=60", "x-robots-tag": "noindex, nofollow" } });
}
