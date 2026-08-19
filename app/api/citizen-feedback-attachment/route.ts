import { randomUUID } from "node:crypto";
import { hasValidSession } from "../../auth-session";
import { feedbackPath, listCitizenFeedback, type CitizenFeedback, type CitizenFeedbackAttachment } from "../../citizen-feedback-store.server";
import { downloadJsonObject, downloadPrivateObject, uploadJsonObject, uploadPrivateObject } from "../../supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 7 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 120) || "anexo";
const clean = (value: FormDataEntryValue | null, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

async function resolve(protocol: string, accessCode: string) {
  const all = await listCitizenFeedback();
  return all.find((item) => item.protocol.toUpperCase() === protocol.toUpperCase() && item.accessCode === accessCode) ?? null;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const protocol = clean(form.get("protocol"), 60);
    const accessCode = clean(form.get("accessCode"), 12).replace(/\D/g, "");
    if (!(file instanceof File)) return Response.json({ error: "Selecione uma imagem ou PDF." }, { status: 400 });
    if (!protocol || accessCode.length !== 6) return Response.json({ error: "Protocolo e código de acesso são obrigatórios." }, { status: 400 });
    if (!ALLOWED.has(file.type)) return Response.json({ error: "Formato não permitido. Envie JPG, PNG, WEBP ou PDF." }, { status: 415 });
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) return Response.json({ error: "O anexo deve ter no máximo 7 MB." }, { status: 413 });
    const feedback = await resolve(protocol, accessCode);
    if (!feedback) return Response.json({ error: "Protocolo ou código de acesso inválido." }, { status: 404 });
    if ((feedback.attachments?.length ?? 0) >= 3) return Response.json({ error: "Este protocolo já atingiu o limite de 3 anexos." }, { status: 409 });

    const now = new Date().toISOString();
    const attachment: CitizenFeedbackAttachment = {
      id: randomUUID(), name: file.name.slice(0, 180), contentType: file.type, size: file.size,
      storagePath: `citizen-feedback-attachments/${feedback.id}/${randomUUID()}-${safeName(file.name)}`, createdAt: now,
    };
    await uploadPrivateObject(attachment.storagePath, file, file.type, false);
    const fresh = await downloadJsonObject<CitizenFeedback>(feedbackPath(feedback.id)) ?? feedback;
    const updated: CitizenFeedback = {
      ...fresh,
      attachments: [...(fresh.attachments ?? []), attachment],
      updatedAt: now,
      history: [...(fresh.history ?? []), { at: now, action: "Anexo recebido", detail: `${attachment.name} foi anexado pelo cidadão ao protocolo.` }],
    };
    await uploadJsonObject(feedbackPath(feedback.id), updated);
    return Response.json({ ok: true, attachment: { id: attachment.id, name: attachment.name, contentType: attachment.contentType, size: attachment.size } }, { status: 201 });
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
    if (code === "STORAGE_NOT_CONFIGURED") return Response.json({ code, error: "O armazenamento seguro ainda não está configurado." }, { status: 503 });
    return Response.json({ error: "Não foi possível anexar o arquivo agora." }, { status: 503 });
  }
}

export async function GET(request: Request) {
  if (!hasValidSession(request)) return Response.json({ error: "Sessão expirada." }, { status: 401 });
  try {
    const url = new URL(request.url);
    const feedbackId = url.searchParams.get("feedbackId")?.trim() ?? "";
    const attachmentId = url.searchParams.get("attachmentId")?.trim() ?? "";
    if (!feedbackId || !attachmentId) return Response.json({ error: "Anexo inválido." }, { status: 400 });
    const feedback = await downloadJsonObject<CitizenFeedback>(feedbackPath(feedbackId));
    const attachment = feedback?.attachments?.find((item) => item.id === attachmentId);
    if (!attachment) return Response.json({ error: "Anexo não encontrado." }, { status: 404 });
    const object = await downloadPrivateObject(attachment.storagePath);
    if (object.status === 404) return Response.json({ error: "Arquivo não encontrado." }, { status: 404 });
    if (!object.ok) throw new Error(await object.text());
    const asciiName = attachment.name.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
    return new Response(object.body, { headers: {
      "content-type": attachment.contentType || object.headers.get("content-type") || "application/octet-stream",
      "content-disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
      "cache-control": "private, no-store",
    }});
  } catch { return Response.json({ error: "Não foi possível baixar o anexo." }, { status: 503 }); }
}
