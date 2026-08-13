import { getRuntimeBindings } from "../../../db/runtime";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const db = getRuntimeBindings().DB;
    const currentUserId = new URL(request.url).searchParams.get("userId") || "u-ana";
    const [users, tickets, groups, messages, documents, audit, notifications, invitations] = await db.batch([
      db.prepare("SELECT id, full_name AS fullName, email, department, role, initials FROM users ORDER BY full_name"),
      db.prepare(`SELECT t.id, t.protocol, t.title, t.description, t.requester, t.department, t.priority, t.status,
        t.assignee_id AS assigneeId, t.due_date AS dueDate, t.created_at AS createdAt, t.updated_at AS updatedAt,
        u.full_name AS assigneeName, u.initials AS assigneeInitials
        FROM tickets t LEFT JOIN users u ON u.id = t.assignee_id ORDER BY t.created_at DESC`),
      db.prepare(`SELECT g.id, g.name, g.description, g.created_by AS createdBy, g.created_at AS createdAt,
        COUNT(all_members.user_id) AS memberCount FROM groups g
        JOIN group_members current_member ON current_member.group_id = g.id AND current_member.user_id = ? AND current_member.invitation_status = 'aceito'
        LEFT JOIN group_members all_members ON all_members.group_id = g.id AND all_members.invitation_status = 'aceito'
        GROUP BY g.id ORDER BY g.created_at DESC`).bind(currentUserId),
      db.prepare(`SELECT m.id, m.conversation_type AS conversationType, m.conversation_id AS conversationId,
        m.sender_id AS senderId, m.body, m.attachment_name AS attachmentName, m.ticket_id AS ticketId,
        m.created_at AS createdAt, u.full_name AS senderName, u.initials AS senderInitials
        FROM messages m JOIN users u ON u.id = m.sender_id ORDER BY m.created_at ASC`),
      db.prepare(`SELECT d.id, d.name, d.category, d.owner_id AS ownerId, d.ticket_id AS ticketId, d.content_type AS contentType,
        d.size, d.created_at AS createdAt, u.full_name AS ownerName FROM documents d JOIN users u ON u.id = d.owner_id ORDER BY d.created_at DESC`),
      db.prepare(`SELECT a.id, a.action, a.entity_type AS entityType, a.entity_id AS entityId, a.detail,
        a.created_at AS createdAt, u.full_name AS actorName, u.initials AS actorInitials
        FROM audit_logs a JOIN users u ON u.id = a.actor_id ORDER BY a.created_at DESC LIMIT 80`),
      db.prepare(`SELECT n.id, n.user_id AS userId, n.type, n.title, n.body, n.related_entity_id AS relatedEntityId,
        n.read_at AS readAt, n.created_at AS createdAt, actor.full_name AS actorName, actor.initials AS actorInitials
        FROM notifications n LEFT JOIN users actor ON actor.id = n.actor_id
        WHERE n.user_id = ? ORDER BY n.created_at DESC LIMIT 80`).bind(currentUserId),
      db.prepare(`SELECT gm.group_id AS groupId, gm.user_id AS userId, gm.invitation_status AS status,
        g.name AS groupName, g.description, g.created_at AS createdAt,
        creator.full_name AS invitedByName, creator.initials AS invitedByInitials,
        (SELECT COUNT(*) FROM group_members accepted WHERE accepted.group_id = g.id AND accepted.invitation_status = 'aceito') AS memberCount
        FROM group_members gm JOIN groups g ON g.id = gm.group_id JOIN users creator ON creator.id = g.created_by
        WHERE gm.user_id = ? AND gm.invitation_status = 'convidado' ORDER BY g.created_at DESC`).bind(currentUserId),
    ]);

    return Response.json({ users: users.results, tickets: tickets.results, groups: groups.results, messages: messages.results, documents: documents.results, audit: audit.results, notifications: notifications.results, invitations: invitations.results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao carregar dados" }, { status: 503 });
  }
}
