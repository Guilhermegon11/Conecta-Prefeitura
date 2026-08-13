import { getRuntimeBindings } from "../../../db/runtime";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DEMO_USER_ID = "u-ana";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id")?.trim();
    const viewerId = url.searchParams.get("userId")?.trim() || DEMO_USER_ID;
    if (!id) return Response.json({ error: "Documento obrigatório" }, { status: 400 });

    const { DB, BUCKET } = getRuntimeBindings();
    const viewer = await DB.prepare("SELECT id, department FROM users WHERE id = ?").bind(viewerId).first<{ id: string; department: string }>();
    if (!viewer) return Response.json({ error: "Usuário não encontrado" }, { status: 404 });
    const document = await DB.prepare("SELECT name, storage_key AS storageKey, content_type AS contentType, ticket_id AS ticketId, department FROM documents WHERE id = ?")
      .bind(id).first<{ name: string; storageKey: string; contentType: string; ticketId: string | null; department: string }>();
    if (!document) return Response.json({ error: "Documento não encontrado" }, { status: 404 });
    if (document.ticketId) {
      const ticketAccess = await DB.prepare("SELECT id FROM tickets WHERE id = ? AND LOWER(TRIM(department)) = LOWER(TRIM(?))")
        .bind(document.ticketId, viewer.department).first<{ id: string }>();
      if (!ticketAccess) return Response.json({ error: "Documento privado do setor responsável" }, { status: 403 });
    }
    const linkedMessage = await DB.prepare("SELECT conversation_type AS conversationType, conversation_id AS conversationId FROM messages WHERE attachment_key = ? LIMIT 1")
      .bind(document.storageKey).first<{ conversationType: string; conversationId: string }>();
    if (linkedMessage?.conversationType === "direct" && !linkedMessage.conversationId.split("::").includes(viewerId)) {
      return Response.json({ error: "Documento privado desta conversa" }, { status: 403 });
    }
    if (linkedMessage?.conversationType === "group") {
      const membership = await DB.prepare("SELECT user_id AS userId FROM group_members WHERE group_id = ? AND user_id = ? AND invitation_status = 'aceito'")
        .bind(linkedMessage.conversationId, viewerId).first<{ userId: string }>();
      if (!membership) return Response.json({ error: "Documento privado deste grupo" }, { status: 403 });
    }
    if (!linkedMessage && document.department.trim().toLocaleLowerCase("pt-BR") !== viewer.department.trim().toLocaleLowerCase("pt-BR")) {
      return Response.json({ error: "Arquivo restrito aos integrantes do setor" }, { status: 403 });
    }

    const object = await BUCKET.get(document.storageKey);
    if (!object) return Response.json({ error: "Arquivo não encontrado" }, { status: 404 });
    const fallbackName = document.name.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");

    return new Response(object.body as unknown as BodyInit, {
      headers: {
        "content-type": document.contentType || object.httpMetadata?.contentType || "application/octet-stream",
        "content-disposition": `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(document.name)}`,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao baixar arquivo" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Arquivo obrigatório" }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return Response.json({ error: "O arquivo deve ter no máximo 10 MB" }, { status: 413 });

    const ownerId = String(form.get("userId") ?? DEMO_USER_ID);
    const conversationType = String(form.get("conversationType") ?? "");
    const conversationId = String(form.get("conversationId") ?? "");
    const recipientId = String(form.get("recipientId") ?? "");
    const isChatUpload = Boolean(conversationType && conversationId);
    if (isChatUpload && !["direct", "group"].includes(conversationType)) return Response.json({ error: "Tipo de conversa inválido" }, { status: 400 });

    const id = crypto.randomUUID();
    const messageId = isChatUpload ? crypto.randomUUID() : null;
    const now = new Date().toISOString();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const storageKey = `documents/${id}/${safeName}`;
    const contentType = file.type || "application/octet-stream";
    const { DB, BUCKET } = getRuntimeBindings();
    const actor = await DB.prepare("SELECT full_name AS fullName, initials, department FROM users WHERE id = ?").bind(ownerId).first<{ fullName: string; initials: string; department: string }>();
    if (!actor) return Response.json({ error: "Usuário não encontrado" }, { status: 404 });
    const ticketId = form.get("ticketId") ? String(form.get("ticketId")) : null;
    if (ticketId) {
      const ticketAccess = await DB.prepare("SELECT id FROM tickets WHERE id = ? AND LOWER(TRIM(department)) = LOWER(TRIM(?))")
        .bind(ticketId, actor.department).first<{ id: string }>();
      if (!ticketAccess) return Response.json({ error: "Este chamado é privado para o setor responsável" }, { status: 403 });
    }
    if (isChatUpload && conversationType === "direct") {
      const expectedConversationId = [ownerId, recipientId].sort().join("::");
      if (!recipientId || conversationId !== expectedConversationId) return Response.json({ error: "Acesso negado à conversa" }, { status: 403 });
    }
    if (isChatUpload && conversationType === "group") {
      const membership = await DB.prepare("SELECT user_id AS userId FROM group_members WHERE group_id = ? AND user_id = ? AND invitation_status = 'aceito'")
        .bind(conversationId, ownerId).first<{ userId: string }>();
      if (!membership) return Response.json({ error: "Apenas participantes podem enviar documentos neste grupo" }, { status: 403 });
    }

    await BUCKET.put(storageKey, file.stream(), { httpMetadata: { contentType }, customMetadata: { originalName: file.name, ownerId } });

    const recipients: string[] = [];
    if (isChatUpload && conversationType === "direct" && recipientId && recipientId !== ownerId) recipients.push(recipientId);
    if (isChatUpload && conversationType === "group") {
      const members = await DB.prepare("SELECT user_id AS userId FROM group_members WHERE group_id = ? AND invitation_status = 'aceito' AND user_id <> ?")
        .bind(conversationId, ownerId).all<{ userId: string }>();
      recipients.push(...members.results.map((member) => member.userId));
    }

    const statements = [
      DB.prepare("INSERT INTO documents (id, name, category, owner_id, ticket_id, department, storage_key, content_type, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(id, file.name, String(form.get("category") ?? "Documento"), ownerId, ticketId, actor.department, storageKey, contentType, file.size, now),
    ];

    if (isChatUpload && messageId) {
      statements.push(
        DB.prepare(`INSERT INTO messages (id, conversation_type, conversation_id, sender_id, body, attachment_name, attachment_key, ticket_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(messageId, conversationType, conversationId, ownerId, String(form.get("messageBody") ?? "").trim(), file.name, storageKey, ticketId, now),
        DB.prepare("INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, detail, created_at) VALUES (?, ?, 'documento_enviado', 'mensagem', ?, ?, ?)")
          .bind(crypto.randomUUID(), ownerId, messageId, `${file.name} enviado em ${conversationType === "group" ? "grupo" : "conversa direta"}`, now),
        ...recipients.map((userId) => DB.prepare(`INSERT INTO notifications (id, user_id, actor_id, type, title, body, related_entity_id, read_at, created_at)
          VALUES (?, ?, ?, 'message', 'Novo documento na conversa', ?, ?, NULL, ?)`).bind(crypto.randomUUID(), userId, ownerId, `${actor.fullName} enviou o documento ${file.name}.`, messageId, now)),
      );
    } else {
      statements.push(DB.prepare("INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, detail, created_at) VALUES (?, ?, 'documento_enviado', 'documento', ?, ?, ?)")
        .bind(crypto.randomUUID(), ownerId, id, `${file.name} enviado para a plataforma`, now));
    }

    try { await DB.batch(statements); }
    catch (error) { await BUCKET.delete(storageKey); throw error; }

    return Response.json({
      id,
      name: file.name,
      size: file.size,
      contentType,
      department: actor.department,
      createdAt: now,
      message: messageId ? { id: messageId, conversationType, conversationId, senderId: ownerId, senderName: actor.fullName, senderInitials: actor.initials, body: String(form.get("messageBody") ?? "").trim(), attachmentId: id, attachmentName: file.name, attachmentSize: file.size, attachmentContentType: contentType, ticketId, createdAt: now } : null,
    }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao enviar arquivo" }, { status: 500 });
  }
}
