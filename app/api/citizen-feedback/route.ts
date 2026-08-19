import { randomInt, randomUUID } from "node:crypto";
import { hasValidSession } from "../../auth-session";
import { analyzeMunicipalDemand, type MunicipalAiAnalysis } from "../../municipal-ai.server";
import { downloadJsonObject, uploadJsonObject } from "../../supabase-admin";
import { feedbackPath, listCitizenFeedback, type CitizenFeedback, type FeedbackKind, type FeedbackStatus } from "../../citizen-feedback-store.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedKinds = new Set<FeedbackKind>(["Reclamação", "Elogio", "Sugestão"]);
const allowedStatuses = new Set<FeedbackStatus>(["Novo", "Em análise", "Encaminhado", "Respondido", "Concluído"]);
const rateWindowMs = 10 * 60 * 1000;
const rateLimit = 8;
const hits = new Map<string, number[]>();

function clean(value: unknown, max: number) { return typeof value === "string" ? value.trim().replace(/\u0000/g, "").slice(0, max) : ""; }
function requestIp(request: Request) { return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"; }
function tooManyRequests(ip: string) { const now = Date.now(); const recent = (hits.get(ip) ?? []).filter((time) => now - time < rateWindowMs); if (recent.length >= rateLimit) { hits.set(ip, recent); return true; } recent.push(now); hits.set(ip, recent); return false; }
function normalizedWords(value: string) {
  return new Set(value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length >= 4 && !["para","com","uma","esse","essa","isso","mais","muito","prefeitura","bairro"].includes(word)));
}

function similarRecords(subject: string, message: string, neighborhood: string, ai: MunicipalAiAnalysis, records: CitizenFeedback[]) {
  const base = normalizedWords(`${subject} ${message} ${neighborhood} ${ai.tags.join(" ")}`);
  return records.map((item) => {
    const other = normalizedWords(`${item.subject} ${item.message} ${item.neighborhood} ${(item.ai?.tags ?? []).join(" ")}`);
    let intersection = 0; for (const word of base) if (other.has(word)) intersection += 1;
    const neighborhoodBonus = neighborhood && item.neighborhood && neighborhood.toLowerCase() === item.neighborhood.toLowerCase() ? 2 : 0;
    const categoryBonus = ai.category && item.ai?.category === ai.category ? 2 : 0;
    const denominator = Math.max(3, Math.min(base.size, other.size));
    return { item, score: (intersection + neighborhoodBonus + categoryBonus) / denominator };
  }).filter(({ score }) => score >= 0.45).sort((a, b) => b.score - a.score).slice(0, 10).map(({ item }) => item.protocol);
}

export async function POST(request: Request) {
  try {
    const ip = requestIp(request);
    if (tooManyRequests(ip)) return Response.json({ error: "Muitas tentativas em pouco tempo. Tente novamente mais tarde." }, { status: 429 });
    const body = await request.json() as Record<string, unknown>;
    if (clean(body.website, 120)) return Response.json({ ok: true });
    const kind = clean(body.kind, 20) as FeedbackKind; const rating = Number(body.rating); const subject = clean(body.subject, 140); const message = clean(body.message, 4000);
    const anonymous = body.anonymous === true; const consent = body.consent === true; const neighborhood = clean(body.neighborhood, 100);
    if (!allowedKinds.has(kind)) return Response.json({ error: "Selecione reclamação, elogio ou sugestão." }, { status: 400 });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return Response.json({ error: "Informe uma nota de 1 a 5." }, { status: 400 });
    if (subject.length < 4 || message.length < 10) return Response.json({ error: "Preencha o assunto e descreva sua manifestação com mais detalhes." }, { status: 400 });
    if (!consent) return Response.json({ error: "É necessário concordar com o tratamento dos dados informados para registrar a manifestação." }, { status: 400 });

    const id = randomUUID(); const now = new Date().toISOString(); const date = now.slice(0, 10).replaceAll("-", "");
    const ai = await analyzeMunicipalDemand(subject, message, neighborhood);
    const existing = await listCitizenFeedback().catch(() => [] as CitizenFeedback[]);
    const similarProtocols = similarRecords(subject, message, neighborhood, ai, existing);
    const accessCode = String(randomInt(100000, 1000000));
    const feedback: CitizenFeedback = {
      id, protocol: `PREF-${date}-${id.slice(0, 6).toUpperCase()}`, accessCode, kind, rating, subject, message,
      name: anonymous ? "Cidadão anônimo" : clean(body.name, 120) || "Cidadão não identificado",
      contact: anonymous ? "" : clean(body.contact, 180), neighborhood, anonymous, destination: "Gabinete do Prefeito", status: "Novo",
      mayorNote: "", citizenResponse: "", forwardedDepartment: "", ai, similarProtocols, similarCount: similarProtocols.length, attachments: [],
      resolutionRating: null, resolutionNps: null, resolutionComment: "", resolutionEvaluatedAt: null,
      history: [
        { at: now, action: "Recebido", detail: "Manifestação recebida pelo canal público e encaminhada automaticamente ao Gabinete do Prefeito." },
        { at: now, action: "Triagem inteligente", detail: `Classificação sugerida: ${ai.category} · ${ai.suggestedDepartment} · prioridade ${ai.urgency}.` },
        ...(similarProtocols.length ? [{ at: now, action: "Demandas semelhantes", detail: `${similarProtocols.length} protocolo(s) semelhante(s) identificado(s) automaticamente.` }] : []),
      ],
      createdAt: now, updatedAt: now, readAt: null,
    };
    await uploadJsonObject(feedbackPath(id), feedback);
    return Response.json({ ok: true, protocol: feedback.protocol, accessCode, createdAt: feedback.createdAt, triage: { category: ai.category, urgency: ai.urgency } }, { status: 201 });
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
    if (code === "STORAGE_NOT_CONFIGURED") return Response.json({ code, error: "Canal temporariamente indisponível enquanto o armazenamento seguro é configurado." }, { status: 503 });
    return Response.json({ error: "Não foi possível registrar a manifestação agora." }, { status: 503 });
  }
}

export async function GET(request: Request) {
  if (!hasValidSession(request)) return Response.json({ error: "Sessão expirada." }, { status: 401 });
  try {
    const feedback = await listCitizenFeedback();
    return Response.json({ feedback, total: feedback.length, unread: feedback.filter((item) => !item.readAt).length });
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
    if (code === "STORAGE_NOT_CONFIGURED") return Response.json({ code, error: "Armazenamento central ainda não configurado." }, { status: 503 });
    return Response.json({ error: "Não foi possível carregar as manifestações agora." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!hasValidSession(request)) return Response.json({ error: "Sessão expirada." }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>; const id = clean(body.id, 80);
    if (!id) return Response.json({ error: "Manifestação inválida." }, { status: 400 });
    const current = await downloadJsonObject<CitizenFeedback>(feedbackPath(id));
    if (!current) return Response.json({ error: "Manifestação não encontrada." }, { status: 404 });
    const nextStatus = clean(body.status, 30) as FeedbackStatus; const now = new Date().toISOString(); const status = allowedStatuses.has(nextStatus) ? nextStatus : current.status;
    const mayorNote = body.mayorNote === undefined ? current.mayorNote : clean(body.mayorNote, 2500);
    const citizenResponse = body.citizenResponse === undefined ? (current.citizenResponse ?? "") : clean(body.citizenResponse, 3500);
    const forwardedDepartment = body.forwardedDepartment === undefined ? (current.forwardedDepartment ?? "") : clean(body.forwardedDepartment, 180);
    const history = [...(current.history ?? [])];
    if (status !== current.status) history.push({ at: now, action: "Status atualizado", detail: `${current.status} → ${status}` });
    if (forwardedDepartment && forwardedDepartment !== current.forwardedDepartment) history.push({ at: now, action: "Encaminhamento", detail: `Encaminhado pelo Gabinete para ${forwardedDepartment}.` });
    if (mayorNote !== current.mayorNote && mayorNote.trim()) history.push({ at: now, action: "Anotação do Gabinete", detail: "Providência interna registrada no protocolo." });
    if (citizenResponse !== (current.citizenResponse ?? "") && citizenResponse.trim()) history.push({ at: now, action: "Resposta ao cidadão", detail: "Resposta oficial registrada para consulta pública pelo protocolo." });
    const updated: CitizenFeedback = { ...current, accessCode: current.accessCode || "", status, mayorNote, citizenResponse, forwardedDepartment, history, readAt: body.markRead === true ? (current.readAt ?? now) : current.readAt, updatedAt: now };
    await uploadJsonObject(feedbackPath(id), updated);
    return Response.json({ ok: true, feedback: updated });
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
    if (code === "STORAGE_NOT_CONFIGURED") return Response.json({ code, error: "Armazenamento central ainda não configurado." }, { status: 503 });
    return Response.json({ error: "Não foi possível atualizar a manifestação agora." }, { status: 503 });
  }
}
