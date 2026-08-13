import { getRuntimeBindings } from "../../../db/runtime";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const db = getRuntimeBindings().DB;
    const currentUserId = new URL(request.url).searchParams.get("userId") || "u-ana";
    const viewer = await db.prepare("SELECT id, department FROM users WHERE id = ?").bind(currentUserId).first<{ id: string; department: string }>();
    if (!viewer) return Response.json({ error: "Usuário não encontrado" }, { status: 404 });
    const directPattern = `%::${currentUserId}::%`;
    const [users, tickets, groups, groupMemberships, messages, documents, audit, notifications, invitations] = await db.batch([
      db.prepare("SELECT id, full_name AS fullName, email, department, role, initials FROM users ORDER BY full_name"),
      db.prepare(`SELECT t.id, t.protocol, t.title, t.description, t.requester, t.department, t.priority, t.status,
        t.assignee_id AS assigneeId, t.due_date AS dueDate, t.created_at AS createdAt, t.updated_at AS updatedAt,
        u.full_name AS assigneeName, u.initials AS assigneeInitials
        FROM tickets t LEFT JOIN users u ON u.id = t.assignee_id
        WHERE LOWER(TRIM(t.department)) = LOWER(TRIM(?)) ORDER BY t.created_at DESC`).bind(viewer.department),
      db.prepare(`SELECT g.id, g.name, g.description, g.created_by AS createdBy, g.created_at AS createdAt,
        COUNT(all_members.user_id) AS memberCount FROM groups g
        JOIN group_members current_member ON current_member.group_id = g.id AND current_member.user_id = ? AND current_member.invitation_status = 'aceito'
        LEFT JOIN group_members all_members ON all_members.group_id = g.id AND all_members.invitation_status = 'aceito'
        GROUP BY g.id ORDER BY g.created_at DESC`).bind(currentUserId),
      db.prepare(`SELECT gm.group_id AS groupId, gm.user_id AS userId, gm.invitation_status AS status
        FROM group_members gm WHERE EXISTS (
          SELECT 1 FROM group_members viewer_member
          WHERE viewer_member.group_id = gm.group_id AND viewer_member.user_id = ? AND viewer_member.invitation_status = 'aceito'
        ) ORDER BY gm.group_id, gm.joined_at`).bind(currentUserId),
      db.prepare(`SELECT m.id, m.conversation_type AS conversationType, m.conversation_id AS conversationId,
        m.sender_id AS senderId, m.body, m.attachment_name AS attachmentName, d.id AS attachmentId,
        d.size AS attachmentSize, d.content_type AS attachmentContentType, m.ticket_id AS ticketId,
        m.created_at AS createdAt, u.full_name AS senderName, u.initials AS senderInitials
        FROM messages m JOIN users u ON u.id = m.sender_id LEFT JOIN documents d ON d.storage_key = m.attachment_key
        WHERE (
          (m.conversation_type = 'direct' AND ('::' || m.conversation_id || '::') LIKE ?)
          OR (m.conversation_type = 'group' AND EXISTS (
            SELECT 1 FROM group_members viewer_member
            WHERE viewer_member.group_id = m.conversation_id AND viewer_member.user_id = ? AND viewer_member.invitation_status = 'aceito'
          ))
        ) AND (m.ticket_id IS NULL OR EXISTS (
          SELECT 1 FROM tickets message_ticket
          WHERE message_ticket.id = m.ticket_id AND LOWER(TRIM(message_ticket.department)) = LOWER(TRIM(?))
        )) ORDER BY m.created_at ASC`).bind(directPattern, currentUserId, viewer.department),
      db.prepare(`SELECT d.id, d.name, d.category, d.owner_id AS ownerId, d.ticket_id AS ticketId, d.content_type AS contentType,
        d.size, d.created_at AS createdAt, u.full_name AS ownerName FROM documents d JOIN users u ON u.id = d.owner_id
        WHERE (d.ticket_id IS NULL OR EXISTS (
          SELECT 1 FROM tickets document_ticket
          WHERE document_ticket.id = d.ticket_id AND LOWER(TRIM(document_ticket.department)) = LOWER(TRIM(?))
        )) AND (
          NOT EXISTS (SELECT 1 FROM messages linked_message WHERE linked_message.attachment_key = d.storage_key)
          OR EXISTS (
            SELECT 1 FROM messages linked_message WHERE linked_message.attachment_key = d.storage_key AND (
              (linked_message.conversation_type = 'direct' AND ('::' || linked_message.conversation_id || '::') LIKE ?)
              OR (linked_message.conversation_type = 'group' AND EXISTS (
                SELECT 1 FROM group_members viewer_member
                WHERE viewer_member.group_id = linked_message.conversation_id AND viewer_member.user_id = ? AND viewer_member.invitation_status = 'aceito'
              ))
            )
          )
        ) ORDER BY d.created_at DESC`).bind(viewer.department, directPattern, currentUserId),
      db.prepare(`SELECT a.id, a.action, a.entity_type AS entityType, a.entity_id AS entityId, a.detail,
        a.created_at AS createdAt, u.full_name AS actorName, u.initials AS actorInitials
        FROM audit_logs a JOIN users u ON u.id = a.actor_id
        WHERE (a.entity_type = 'chamado' AND EXISTS (
            SELECT 1 FROM tickets audit_ticket
            WHERE audit_ticket.id = a.entity_id AND LOWER(TRIM(audit_ticket.department)) = LOWER(TRIM(?))
          )) OR (a.entity_type = 'mensagem' AND EXISTS (
            SELECT 1 FROM messages audit_message WHERE audit_message.id = a.entity_id
            AND ((audit_message.conversation_type = 'direct' AND ('::' || audit_message.conversation_id || '::') LIKE ?)
              OR (audit_message.conversation_type = 'group' AND EXISTS (
                SELECT 1 FROM group_members viewer_member
                WHERE viewer_member.group_id = audit_message.conversation_id AND viewer_member.user_id = ? AND viewer_member.invitation_status = 'aceito'
              )))
            AND (audit_message.ticket_id IS NULL OR EXISTS (
              SELECT 1 FROM tickets audit_message_ticket WHERE audit_message_ticket.id = audit_message.ticket_id
              AND LOWER(TRIM(audit_message_ticket.department)) = LOWER(TRIM(?))
            ))
          )) OR (a.entity_type = 'grupo' AND EXISTS (
            SELECT 1 FROM group_members viewer_member
            WHERE viewer_member.group_id = a.entity_id AND viewer_member.user_id = ? AND viewer_member.invitation_status = 'aceito'
          )) OR a.entity_type NOT IN ('chamado', 'mensagem', 'grupo')
        ORDER BY a.created_at DESC LIMIT 80`).bind(viewer.department, directPattern, currentUserId, viewer.department, currentUserId),
      db.prepare(`SELECT n.id, n.user_id AS userId, n.type, n.title, n.body, n.related_entity_id AS relatedEntityId,
        n.read_at AS readAt, n.created_at AS createdAt, actor.full_name AS actorName, actor.initials AS actorInitials
        FROM notifications n LEFT JOIN users actor ON actor.id = n.actor_id
        WHERE n.user_id = ? AND (
          (n.type = 'ticket' AND EXISTS (
            SELECT 1 FROM tickets notification_ticket
            WHERE notification_ticket.id = n.related_entity_id AND LOWER(TRIM(notification_ticket.department)) = LOWER(TRIM(?))
          )) OR (n.type = 'message' AND EXISTS (
            SELECT 1 FROM messages notification_message WHERE notification_message.id = n.related_entity_id
            AND ((notification_message.conversation_type = 'direct' AND ('::' || notification_message.conversation_id || '::') LIKE ?)
              OR (notification_message.conversation_type = 'group' AND EXISTS (
                SELECT 1 FROM group_members viewer_member
                WHERE viewer_member.group_id = notification_message.conversation_id AND viewer_member.user_id = ? AND viewer_member.invitation_status = 'aceito'
              )))
            AND (notification_message.ticket_id IS NULL OR EXISTS (
              SELECT 1 FROM tickets notification_message_ticket WHERE notification_message_ticket.id = notification_message.ticket_id
              AND LOWER(TRIM(notification_message_ticket.department)) = LOWER(TRIM(?))
            ))
          )) OR n.type NOT IN ('ticket', 'message')
        ) ORDER BY n.created_at DESC LIMIT 80`).bind(currentUserId, viewer.department, directPattern, currentUserId, viewer.department),
      db.prepare(`SELECT gm.group_id AS groupId, gm.user_id AS userId, gm.invitation_status AS status,
        g.name AS groupName, g.description, g.created_at AS createdAt,
        creator.full_name AS invitedByName, creator.initials AS invitedByInitials,
        (SELECT COUNT(*) FROM group_members accepted WHERE accepted.group_id = g.id AND accepted.invitation_status = 'aceito') AS memberCount
        FROM group_members gm JOIN groups g ON g.id = gm.group_id JOIN users creator ON creator.id = g.created_by
        WHERE gm.user_id = ? AND gm.invitation_status = 'convidado' ORDER BY g.created_at DESC`).bind(currentUserId),
    ]);

    return Response.json({ users: users.results, tickets: tickets.results, groups: groups.results, groupMemberships: groupMemberships.results, messages: messages.results, documents: documents.results, audit: audit.results, notifications: notifications.results, invitations: invitations.results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao carregar dados" }, { status: 503 });
  }
}
