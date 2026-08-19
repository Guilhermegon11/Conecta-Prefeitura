import { randomUUID } from "node:crypto";
import { hasValidSession } from "../../auth-session";
import { DATA_BUCKET, downloadJsonObject, ensureDataBucket, storagePath, supabaseAdminConfig, supabaseAdminHeaders, uploadJsonObject } from "../../supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FeedbackKind = "Reclamação" | "Elogio" | "Sugestão";
type FeedbackStatus = "Novo" | "Em análise" | "Encaminhado" | "Respondido" | "Concluído";

type CitizenFeedback = {
  id: string;
  protocol: string;
  kind: FeedbackKind;
  rating: number;
  subject: string;
  message: string;
  name: string;
  contact: string;
  neighborhood: string;
  anonymous: boolean;
  destination: "Gabinete do Prefeito";
  status: FeedbackStatus;
  mayorNote: string;
  forwardedDepartment: string;
  history: Array<{ at: string; action: string; detail: string }>;
  createdAt: string;
  updatedAt: string;
  readAt: string | null;
};

const allowedKinds = new Set<FeedbackKind>(["Reclamação", "Elogio", "Sugestão"]);
const allowedStatuses = new Set<FeedbackStatus>(["Novo", "Em análise", "Encaminhado", "Respondido", "Concluído"]);
const rateWindowMs = 10 * 60 * 1000;
const rateLimit = 8;
const hits = new Map<string, number[]>();

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().replace(/\u0000/g, "").slice(0, max) : "";
}

function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function tooManyRequests(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < rateWindowMs);
  if (recent.length >= rateLimit) { hits.set(ip, recent); return true; }
  recent.push(now); hits.set(ip, recent); return false;
}

function feedbackPath(id: string) { return `citizen-feedback/${id}.json`; }

async function listFeedback(): Promise<CitizenFeedback[]> {
  await ensureDataBucket();
  const { url } = supabaseAdminConfig();
  const response = await fetch(`${url}/storage/v1/object/list/${encodeURIComponent(DATA_BUCKET)}`, {
    method: "POST",
    headers: supabaseAdminHeaders("application/json"),
    body: JSON.stringify({ prefix: "citizen-feedback", limit: 500, offset: 0, sortBy: { column: "created_at", order: "desc" } }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await response.text());
  const objects = await response.json() as Array<{ name?: string }>;
  const values = await Promise.all(objects.filter((item) => item.name?.endsWith(".json")).map(async (item) => {
    const name = item.name!;
    return downloadJsonObject<CitizenFeedback>(`citizen-feedback/${name}`);
  }));
  return values.filter((item): item is CitizenFeedback => Boolean(item)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function POST(request: Request) {
  try {
    const ip = requestIp(request);
    if (tooManyRequests(ip)) return Response.json({ error: "Muitas tentativas em pouco tempo. Tente novamente mais tarde." }, { status: 429 });
    const body = await request.json() as Record<string, unknown>;
    if (clean(body.website, 120)) return Response.json({ ok: true }); // honeypot antispam
    const kind = clean(body.kind, 20) as FeedbackKind;
    const rating = Number(body.rating);
    const subject = clean(body.subject, 140);
    const message = clean(body.message, 4000);
    const anonymous = body.anonymous === true;
    const consent = body.consent === true;
    if (!allowedKinds.has(kind)) return Response.json({ error: "Selecione reclamação, elogio ou sugestão." }, { status: 400 });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return Response.json({ error: "Informe uma nota de 1 a 5." }, { status: 400 });
    if (subject.length < 4 || message.length < 10) return Response.json({ error: "Preencha o assunto e descreva sua manifestação com mais detalhes." }, { status: 400 });
    if (!consent) return Response.json({ error: "É necessário concordar com o tratamento dos dados informados para registrar a manifestação." }, { status: 400 });

    const id = randomUUID();
    const now = new Date().toISOString();
    const date = now.slice(0, 10).replaceAll("-", "");
    const feedback: CitizenFeedback = {
      id,
      protocol: `PREF-${date}-${id.slice(0, 6).toUpperCase()}`,
      kind,
      rating,
      subject,
      message,
      name: anonymous ? "Cidadão anônimo" : clean(body.name, 120) || "Cidadão não identificado",
      contact: anonymous ? "" : clean(body.contact, 180),
      neighborhood: clean(body.neighborhood, 100),
      anonymous,
      destination: "Gabinete do Prefeito",
      status: "Novo",
      mayorNote: "",
      forwardedDepartment: "",
      history: [{ at: now, action: "Recebido", detail: "Manifestação recebida pelo canal público e encaminhada automaticamente ao Gabinete do Prefeito." }],
      createdAt: now,
      updatedAt: now,
      readAt: null,
    };
    await uploadJsonObject(feedbackPath(id), feedback);
    return Response.json({ ok: true, protocol: feedback.protocol, createdAt: feedback.createdAt }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível registrar a manifestação." }, { status: 503 });
  }
}

export async function GET(request: Request) {
  if (!hasValidSession(request)) return Response.json({ error: "Sessão expirada." }, { status: 401 });
  try {
    const feedback = await listFeedback();
    return Response.json({ feedback, total: feedback.length, unread: feedback.filter((item) => !item.readAt).length });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível carregar as manifestações." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!hasValidSession(request)) return Response.json({ error: "Sessão expirada." }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const id = clean(body.id, 80);
    if (!id) return Response.json({ error: "Manifestação inválida." }, { status: 400 });
    const current = await downloadJsonObject<CitizenFeedback>(feedbackPath(id));
    if (!current) return Response.json({ error: "Manifestação não encontrada." }, { status: 404 });
    const nextStatus = clean(body.status, 30) as FeedbackStatus;
    const now = new Date().toISOString();
    const status = allowedStatuses.has(nextStatus) ? nextStatus : current.status;
    const mayorNote = body.mayorNote === undefined ? current.mayorNote : clean(body.mayorNote, 2500);
    const forwardedDepartment = body.forwardedDepartment === undefined ? (current.forwardedDepartment ?? "") : clean(body.forwardedDepartment, 180);
    const history = [...(current.history ?? [])];
    if (status !== current.status) history.push({ at: now, action: "Status atualizado", detail: `${current.status} → ${status}` });
    if (forwardedDepartment && forwardedDepartment !== current.forwardedDepartment) history.push({ at: now, action: "Encaminhamento", detail: `Encaminhado pelo Gabinete para ${forwardedDepartment}.` });
    if (mayorNote !== current.mayorNote && mayorNote.trim()) history.push({ at: now, action: "Anotação do Gabinete", detail: "Providência interna registrada no protocolo." });
    const updated: CitizenFeedback = {
      ...current,
      status,
      mayorNote,
      forwardedDepartment,
      history,
      readAt: body.markRead === true ? (current.readAt ?? now) : current.readAt,
      updatedAt: now,
    };
    await uploadJsonObject(feedbackPath(id), updated);
    return Response.json({ ok: true, feedback: updated });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível atualizar a manifestação." }, { status: 503 });
  }
}
