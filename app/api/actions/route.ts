import { getRuntimeBindings } from "../../../db/runtime";
import { AuthorizationError, resolveActorId } from "../../server-authorization";

type ActionPayload = {
  action?: "create_ticket" | "update_ticket" | "send_message" | "create_group" | "respond_invitation" | "mark_notification" | "mark_all_notifications" | "create_event" | "invite_employee" | "resend_employee_invite";
  userId?: unknown;
  [key: string]: unknown;
};

const db = () => getRuntimeBindings().DB;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ActionPayload;
    if (!payload.action) return Response.json({ error: "Ação obrigatória" }, { status: 400 });
    // Em produção, o ator é derivado da sessão no servidor; o userId do cliente é ignorado.
    payload.userId = await resolveActorId(request, { userId: payload.userId });

    switch (payload.action) {
      case "create_ticket": return createTicket(payload);
      case "update_ticket": return updateTicket(payload);
      case "send_message": return sendMessage(payload);
      case "create_group": return createGroup(payload);
      case "respond_invitation": return respondInvitation(payload);
      case "mark_notification": return markNotification(payload);
      case "mark_all_notifications": return markAllNotifications(payload);
      case "create_event": return createEvent(payload);
      case "invite_employee": return inviteEmployee(payload);
      case "resend_employee_invite": return resendEmployeeInvite(payload);
      default: return Response.json({ error: "Ação não reconhecida" }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof AuthorizationError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao registrar ação" }, { status: 500 });
  }
}

async function inviteEmployee(payload: ActionPayload) {
  const actorId = String(payload.userId);
  const fullName = String(payload.fullName ?? "").trim();
  const email = String(payload.email ?? "").trim().toLowerCase();
  if (fullName.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Informe um nome e um e-mail válidos" }, { status: 400 });
  }

  const database = db();
  const actor = await database.prepare("SELECT id, full_name AS fullName, department, role FROM users WHERE id = ? AND account_status = 'Ativo'")
    .bind(actorId).first<{ id: string; fullName: string; department: string; role: string }>();
  if (!actor) return Response.json({ error: "Responsável não encontrado" }, { status: 404 });
  if (!isSectorManagerRole(actor.role)) return Response.json({ error: "Somente o responsável pelo setor pode convidar funcionários" }, { status: 403 });

  const existing = await database.prepare("SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))")
    .bind(email).first<{ id: string }>();
  if (existing) return Response.json({ error: "Já existe um acesso cadastrado com este e-mail" }, { status: 409 });

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const initials = makeInitials(fullName);
  await database.batch([
    database.prepare(`INSERT INTO users (id, full_name, email, department, role, initials, account_status, invited_by, invited_at, created_at)
      VALUES (?, ?, ?, ?, 'Funcionário', ?, 'Aguardando criação de senha', ?, ?, ?)`).bind(
      id, fullName, email, actor.department, initials, actorId, now, now,
    ),
    database.prepare("INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, detail, created_at) VALUES (?, ?, 'funcionario_convidado', 'funcionario', ?, ?, ?)")
      .bind(crypto.randomUUID(), actorId, id, `Convite simulado para ${fullName} (${email})`, now),
  ]);
  return Response.json({
    user: { id, fullName, email, department: actor.department, role: "Funcionário", initials, accountStatus: "Aguardando criação de senha", invitedBy: actorId, invitedAt: now },
    delivery: "simulated",
  }, { status: 201 });
}

async function resendEmployeeInvite(payload: ActionPayload) {
  const actorId = String(payload.userId);
  const employeeId = String(payload.employeeId ?? "");
  if (!employeeId) return Response.json({ error: "Funcionário obrigatório" }, { status: 400 });
  const database = db();
  const actor = await database.prepare("SELECT id, department, role FROM users WHERE id = ? AND account_status = 'Ativo'")
    .bind(actorId).first<{ id: string; department: string; role: string }>();
  if (!actor || !isSectorManagerRole(actor.role)) return Response.json({ error: "Acesso negado" }, { status: 403 });
  const employee = await database.prepare(`SELECT id, full_name AS fullName, email FROM users
    WHERE id = ? AND account_status = 'Aguardando criação de senha' AND LOWER(TRIM(department)) = LOWER(TRIM(?))`)
    .bind(employeeId, actor.department).first<{ id: string; fullName: string; email: string }>();
  if (!employee) return Response.json({ error: "Convite pendente não encontrado neste setor" }, { status: 404 });
  const now = new Date().toISOString();
  await database.batch([
    database.prepare("UPDATE users SET invited_at = ?, invited_by = ? WHERE id = ?").bind(now, actorId, employeeId),
    database.prepare("INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, detail, created_at) VALUES (?, ?, 'convite_funcionario_reenviado', 'funcionario', ?, ?, ?)")
      .bind(crypto.randomUUID(), actorId, employeeId, `Reenvio simulado do convite para ${employee.fullName} (${employee.email})`, now),
  ]);
  return Response.json({ employeeId, invitedAt: now, delivery: "simulated" });
}

function isSectorManagerRole(role: string) {
  return !role.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes("funcionario");
}

function makeInitials(fullName: string) {
  const names = fullName.trim().split(/\s+/).filter(Boolean);
  return `${names[0]?.[0] ?? ""}${names.length > 1 ? names[names.length - 1]?.[0] ?? "" : names[0]?.[1] ?? ""}`.toUpperCase();
}

async function createEvent(payload: ActionPayload) {
  const actorId = String(payload.userId);
  const title = String(payload.title ?? "").trim();
  const startsAt = String(payload.startsAt ?? "").trim();
  if (!title || !startsAt || Number.isNaN(Date.parse(startsAt))) {
    return Response.json({ error: "Título e data do evento são obrigatórios" }, { status: 400 });
  }

  const database = db();
  const actor = await database.prepare("SELECT id, department FROM users WHERE id = ?")
    .bind(actorId).first<{ id: string; department: string }>();
  if (!actor) return Response.json({ error: "Usuário não encontrado" }, { status: 404 });

  const endsAt = payload.endsAt ? String(payload.endsAt) : null;
  if (endsAt && (Number.isNaN(Date.parse(endsAt)) || Date.parse(endsAt) < Date.parse(startsAt))) {
    return Response.json({ error: "O término deve ser posterior ao início" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const departmentMembers = await database.prepare("SELECT id FROM users WHERE LOWER(TRIM(department)) = LOWER(TRIM(?)) AND id <> ?")
    .bind(actor.department, actorId).all<{ id: string }>();
  await database.batch([
    database.prepare(`INSERT INTO events (id, title, description, department, location, starts_at, ends_at, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, title, String(payload.description ?? "").trim(), actor.department, String(payload.location ?? "").trim(), startsAt, endsAt, actorId, now,
    ),
    database.prepare("INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, detail, created_at) VALUES (?, ?, 'evento_criado', 'evento', ?, ?, ?)")
      .bind(crypto.randomUUID(), actorId, id, `Evento criado para ${actor.department}: ${title}`, now),
    ...departmentMembers.results.map((member) => database.prepare(`INSERT INTO notifications (id, user_id, actor_id, type, title, body, related_entity_id, read_at, created_at)
      VALUES (?, ?, ?, 'system', 'Novo evento do setor', ?, ?, NULL, ?)`).bind(crypto.randomUUID(), member.id, actorId, title, id, now)),
  ]);
  return Response.json({ id, title, department: actor.department, createdBy: actorId, createdAt: now }, { status: 201 });
}

async function createTicket(payload: ActionPayload) {
  const actorId = String(payload.userId);
  const title = String(payload.title ?? "").trim();
  const department = String(payload.department ?? "").trim();
  if (!title || !department) return Response.json({ error: "Título e secretaria são obrigatórios" }, { status: 400 });

  const database = db();
  const actor = await database.prepare("SELECT id, department FROM users WHERE id = ?").bind(actorId).first<{ id: string; department: string }>();
  if (!actor) return Response.json({ error: "Usuário não encontrado" }, { status: 404 });
  const assigneeId = payload.assigneeId ? String(payload.assigneeId) : null;
  if (assigneeId) {
    const assignee = await database.prepare("SELECT id FROM users WHERE id = ? AND LOWER(TRIM(department)) = LOWER(TRIM(?))")
      .bind(assigneeId, department).first<{ id: string }>();
    if (!assignee) return Response.json({ error: "O responsável deve pertencer ao setor do chamado" }, { status: 400 });
  }
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const total = await database.prepare("SELECT COUNT(*) AS total FROM tickets").first<{ total: number }>();
  const protocol = `CH-${new Date().getUTCFullYear()}-${String(Number(total?.total ?? 0) + 188).padStart(4, "0")}`;
  const detail = `Chamado ${protocol} criado: ${title}`;
  const departmentMembers = await database.prepare("SELECT id FROM users WHERE LOWER(TRIM(department)) = LOWER(TRIM(?)) AND id <> ?")
    .bind(department, actorId).all<{ id: string }>();

  await database.batch([
    database.prepare(`INSERT INTO tickets (id, protocol, title, description, requester, department, priority, status, assignee_id, neighborhood, address, due_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Recebido', ?, ?, ?, ?, ?, ?)`).bind(
      id, protocol, title, String(payload.description ?? ""), String(payload.requester ?? "Secretaria de Governo"), department,
      String(payload.priority ?? "Média"), assigneeId,
      payload.neighborhood ? String(payload.neighborhood).trim() : null,
      payload.address ? String(payload.address).trim() : null,
      payload.dueDate ? String(payload.dueDate) : null, now, now,
    ),
    database.prepare("INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, detail, created_at) VALUES (?, ?, 'chamado_criado', 'chamado', ?, ?, ?)")
      .bind(crypto.randomUUID(), actorId, id, detail, now),
    ...departmentMembers.results.map((member) => database.prepare(`INSERT INTO notifications (id, user_id, actor_id, type, title, body, related_entity_id, read_at, created_at)
      VALUES (?, ?, ?, 'ticket', 'Novo chamado do setor', ?, ?, NULL, ?)`)
      .bind(crypto.randomUUID(), member.id, actorId, `${protocol}: ${title}`, id, now)),
  ]);
  return Response.json({ id, protocol, createdAt: now }, { status: 201 });
}

async function updateTicket(payload: ActionPayload) {
  const actorId = String(payload.userId);
  const id = String(payload.id ?? "");
  const status = String(payload.status ?? "");
  const allowed = ["Recebido", "Em análise", "Aguardando aprovação", "Em execução", "Aguardando resposta", "Concluído", "Cancelado"];
  if (!id || !allowed.includes(status)) return Response.json({ error: "Chamado ou status inválido" }, { status: 400 });
  const now = new Date().toISOString();
  const database = db();
  const access = await database.prepare(`SELECT t.id FROM tickets t JOIN users u ON u.id = ?
    WHERE t.id = ? AND LOWER(TRIM(t.department)) = LOWER(TRIM(u.department))`).bind(actorId, id).first<{ id: string }>();
  if (!access) return Response.json({ error: "Apenas integrantes do setor responsável podem alterar este chamado" }, { status: 403 });
  await database.batch([
    database.prepare("UPDATE tickets SET status = ?, updated_at = ? WHERE id = ?").bind(status, now, id),
    database.prepare("INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, detail, created_at) VALUES (?, ?, 'status_atualizado', 'chamado', ?, ?, ?)")
      .bind(crypto.randomUUID(), actorId, id, `Chamado movido para ${status}`, now),
  ]);
  return Response.json({ id, status, updatedAt: now });
}

async function sendMessage(payload: ActionPayload) {
  const actorId = String(payload.userId);
  const conversationType = String(payload.conversationType ?? "direct");
  const conversationId = String(payload.conversationId ?? "");
  const body = String(payload.body ?? "").trim();
  if (!conversationId || !body || !["direct", "group"].includes(conversationType)) return Response.json({ error: "Conversa e mensagem são obrigatórias" }, { status: 400 });
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const database = db();
  const actor = await database.prepare("SELECT full_name AS fullName FROM users WHERE id = ?").bind(actorId).first<{ fullName: string }>();
  if (!actor) return Response.json({ error: "Usuário não encontrado" }, { status: 404 });
  if (payload.ticketId) {
    const ticketAccess = await database.prepare(`SELECT t.id FROM tickets t JOIN users u ON u.id = ?
      WHERE t.id = ? AND LOWER(TRIM(t.department)) = LOWER(TRIM(u.department))`).bind(actorId, String(payload.ticketId)).first<{ id: string }>();
    if (!ticketAccess) return Response.json({ error: "Este chamado é privado para o setor responsável" }, { status: 403 });
  }
  if (conversationType === "direct" && !(`::${conversationId}::`).includes(`::${actorId}::`)) {
    return Response.json({ error: "Acesso negado à conversa" }, { status: 403 });
  }
  if (conversationType === "group") {
    const membership = await database.prepare("SELECT user_id AS userId FROM group_members WHERE group_id = ? AND user_id = ? AND invitation_status = 'aceito'")
      .bind(conversationId, actorId).first<{ userId: string }>();
    if (!membership) return Response.json({ error: "Apenas participantes podem enviar mensagens neste grupo" }, { status: 403 });
  }
  const recipients: string[] = [];
  const recipientId = String(payload.recipientId ?? "");
  if (conversationType === "direct" && recipientId && recipientId !== actorId) recipients.push(recipientId);
  if (conversationType === "group") {
    const members = await database.prepare("SELECT user_id AS userId FROM group_members WHERE group_id = ? AND invitation_status = 'aceito' AND user_id <> ?")
      .bind(conversationId, actorId).all<{ userId: string }>();
    recipients.push(...members.results.map((member) => member.userId));
  }
  await database.batch([
    database.prepare(`INSERT INTO messages (id, conversation_type, conversation_id, sender_id, body, attachment_name, attachment_key, ticket_id, created_at)
      VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?)`).bind(id, conversationType, conversationId, actorId, body, payload.ticketId ? String(payload.ticketId) : null, now),
    database.prepare("INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, detail, created_at) VALUES (?, ?, 'mensagem_enviada', 'mensagem', ?, ?, ?)")
      .bind(crypto.randomUUID(), actorId, id, `Mensagem enviada em ${conversationType === "group" ? "grupo" : "conversa direta"}`, now),
    ...recipients.map((userId) => database.prepare(`INSERT INTO notifications (id, user_id, actor_id, type, title, body, related_entity_id, read_at, created_at)
      VALUES (?, ?, ?, 'message', 'Nova mensagem', ?, ?, NULL, ?)`).bind(crypto.randomUUID(), userId, actorId, `${actor?.fullName ?? "Um usuário"} enviou uma nova mensagem.`, id, now)),
  ]);
  return Response.json({ id, createdAt: now }, { status: 201 });
}

async function createGroup(payload: ActionPayload) {
  const name = String(payload.name ?? "").trim();
  const memberIds = Array.isArray(payload.memberIds) ? payload.memberIds.map(String) : [];
  if (!name) return Response.json({ error: "Nome do grupo é obrigatório" }, { status: 400 });
  const actorId = String(payload.userId);
  const id = String(payload.id ?? crypto.randomUUID());
  const now = new Date().toISOString();
  const uniqueMembers = Array.from(new Set([actorId, ...memberIds]));
  const database = db();
  const statements = [
    database.prepare("INSERT INTO groups (id, name, description, created_by, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(id, name, String(payload.description ?? ""), actorId, now),
    ...uniqueMembers.map((userId) => database.prepare("INSERT INTO group_members (group_id, user_id, invitation_status, joined_at) VALUES (?, ?, ?, ?)")
      .bind(id, userId, userId === actorId ? "aceito" : "convidado", userId === actorId ? now : null)),
    ...memberIds.map((userId) => database.prepare(`INSERT INTO notifications (id, user_id, actor_id, type, title, body, related_entity_id, read_at, created_at)
      VALUES (?, ?, ?, 'group_invite', 'Novo convite para grupo', ?, ?, NULL, ?)`)
      .bind(crypto.randomUUID(), userId, actorId, `Você recebeu um convite para participar de ${name}.`, id, now)),
    database.prepare("INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, detail, created_at) VALUES (?, ?, 'grupo_criado', 'grupo', ?, ?, ?)")
      .bind(crypto.randomUUID(), actorId, id, `Grupo ${name} criado com ${memberIds.length} convites enviados`, now),
  ];
  await database.batch(statements);
  return Response.json({ id, name, memberCount: 1, invitedCount: memberIds.length, createdAt: now }, { status: 201 });
}

async function respondInvitation(payload: ActionPayload) {
  const groupId = String(payload.groupId ?? "");
  const userId = String(payload.userId);
  const response = String(payload.response ?? "");
  if (!groupId || !["aceito", "recusado"].includes(response)) return Response.json({ error: "Convite ou resposta inválida" }, { status: 400 });
  const now = new Date().toISOString();
  const database = db();
  await database.batch([
    database.prepare("UPDATE group_members SET invitation_status = ?, joined_at = ? WHERE group_id = ? AND user_id = ? AND invitation_status = 'convidado'")
      .bind(response, response === "aceito" ? now : null, groupId, userId),
    database.prepare("UPDATE notifications SET read_at = COALESCE(read_at, ?) WHERE user_id = ? AND related_entity_id = ? AND type = 'group_invite'")
      .bind(now, userId, groupId),
    database.prepare("INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, detail, created_at) VALUES (?, ?, ?, 'grupo', ?, ?, ?)")
      .bind(crypto.randomUUID(), userId, response === "aceito" ? "convite_aceito" : "convite_recusado", groupId, `Convite de grupo ${response}`, now),
  ]);
  const group = await database.prepare(`SELECT g.id, g.name, g.description, g.created_at AS createdAt, COUNT(gm.user_id) AS memberCount
    FROM groups g LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.invitation_status = 'aceito'
    WHERE g.id = ? GROUP BY g.id`).bind(groupId).first();
  return Response.json({ groupId, response, group });
}

async function markNotification(payload: ActionPayload) {
  const id = String(payload.id ?? "");
  const userId = String(payload.userId);
  if (!id) return Response.json({ error: "Notificação obrigatória" }, { status: 400 });
  const readAt = new Date().toISOString();
  await db().prepare("UPDATE notifications SET read_at = COALESCE(read_at, ?) WHERE id = ? AND user_id = ?").bind(readAt, id, userId).run();
  return Response.json({ id, readAt });
}

async function markAllNotifications(payload: ActionPayload) {
  const userId = String(payload.userId);
  const readAt = new Date().toISOString();
  await db().prepare("UPDATE notifications SET read_at = COALESCE(read_at, ?) WHERE user_id = ?").bind(readAt, userId).run();
  return Response.json({ userId, readAt });
}
