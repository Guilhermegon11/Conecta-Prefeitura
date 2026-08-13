import { getRuntimeBindings } from "../../../db/runtime";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DEMO_USER_ID = "u-ana";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Arquivo obrigatório" }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return Response.json({ error: "O arquivo deve ter no máximo 10 MB" }, { status: 413 });

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const storageKey = `documents/${id}/${safeName}`;
    const { DB, BUCKET } = getRuntimeBindings();
    await BUCKET.put(storageKey, file.stream(), { httpMetadata: { contentType: file.type || "application/octet-stream" }, customMetadata: { originalName: file.name, ownerId: DEMO_USER_ID } });
    await DB.batch([
      DB.prepare("INSERT INTO documents (id, name, category, owner_id, ticket_id, storage_key, content_type, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(id, file.name, String(form.get("category") ?? "Documento"), DEMO_USER_ID, form.get("ticketId") ? String(form.get("ticketId")) : null, storageKey, file.type || "application/octet-stream", file.size, now),
      DB.prepare("INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, detail, created_at) VALUES (?, ?, 'documento_enviado', 'documento', ?, ?, ?)")
        .bind(crypto.randomUUID(), DEMO_USER_ID, id, `${file.name} enviado para a plataforma`, now),
    ]);
    return Response.json({ id, name: file.name, size: file.size, createdAt: now }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao enviar arquivo" }, { status: 500 });
  }
}
