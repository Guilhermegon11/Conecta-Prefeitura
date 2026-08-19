import { downloadJsonObject, uploadJsonObject } from "../../supabase-admin";
import { feedbackPath, listCitizenFeedback, type CitizenFeedback } from "../../citizen-feedback-store.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, max: number) { return typeof value === "string" ? value.trim().replace(/\u0000/g, "").slice(0, max) : ""; }
function publicView(item: CitizenFeedback) {
  return {
    protocol: item.protocol, kind: item.kind, subject: item.subject, neighborhood: item.neighborhood, status: item.status,
    forwardedDepartment: item.forwardedDepartment, citizenResponse: item.citizenResponse ?? "", createdAt: item.createdAt, updatedAt: item.updatedAt,
    history: (item.history ?? []).filter((entry) => !["Anotação do Gabinete"].includes(entry.action)),
    canEvaluateResolution: item.status === "Concluído" && !item.resolutionEvaluatedAt,
    resolutionRating: item.resolutionRating ?? null, resolutionNps: item.resolutionNps ?? null, resolutionEvaluatedAt: item.resolutionEvaluatedAt ?? null,
  };
}

async function resolve(protocol: string, accessCode: string) {
  const all = await listCitizenFeedback();
  const item = all.find((entry) => entry.protocol.toUpperCase() === protocol.toUpperCase());
  if (!item || !item.accessCode || item.accessCode !== accessCode) return null;
  return item;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>; const protocol = clean(body.protocol, 60); const accessCode = clean(body.accessCode, 12).replace(/\D/g, "");
    if (!protocol || accessCode.length !== 6) return Response.json({ error: "Informe o protocolo e o código de acesso de 6 dígitos." }, { status: 400 });
    const item = await resolve(protocol, accessCode);
    if (!item) return Response.json({ error: "Protocolo ou código de acesso inválido." }, { status: 404 });
    return Response.json({ ok: true, feedback: publicView(item) }, { headers: { "cache-control": "no-store" } });
  } catch { return Response.json({ error: "Não foi possível consultar o protocolo agora." }, { status: 503 }); }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>; const protocol = clean(body.protocol, 60); const accessCode = clean(body.accessCode, 12).replace(/\D/g, "");
    const rating = Number(body.rating); const nps = Number(body.nps); const comment = clean(body.comment, 1200);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !Number.isInteger(nps) || nps < 0 || nps > 10) return Response.json({ error: "Informe a nota de 1 a 5 e o NPS de 0 a 10." }, { status: 400 });
    const item = await resolve(protocol, accessCode);
    if (!item) return Response.json({ error: "Protocolo ou código de acesso inválido." }, { status: 404 });
    if (item.status !== "Concluído") return Response.json({ error: "A avaliação da solução fica disponível quando o protocolo for concluído." }, { status: 409 });
    if (item.resolutionEvaluatedAt) return Response.json({ error: "A solução deste protocolo já foi avaliada." }, { status: 409 });
    const now = new Date().toISOString();
    const fresh = await downloadJsonObject<CitizenFeedback>(feedbackPath(item.id)) || item;
    const updated: CitizenFeedback = { ...fresh, resolutionRating: rating, resolutionNps: nps, resolutionComment: comment, resolutionEvaluatedAt: now, updatedAt: now, history: [...(fresh.history ?? []), { at: now, action: "Avaliação pós-atendimento", detail: `Cidadão avaliou a solução com ${rating}/5 e NPS ${nps}/10.` }] };
    await uploadJsonObject(feedbackPath(item.id), updated);
    return Response.json({ ok: true, feedback: publicView(updated) });
  } catch { return Response.json({ error: "Não foi possível registrar a avaliação agora." }, { status: 503 }); }
}
