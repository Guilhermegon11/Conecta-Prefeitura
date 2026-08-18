import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), fullName: text("full_name").notNull(), email: text("email").notNull(),
  department: text("department").notNull(), role: text("role").notNull().default("secretario"),
  initials: text("initials").notNull(), accountStatus: text("account_status").notNull().default("Ativo"),
  invitedBy: text("invited_by"), invitedAt: text("invited_at"), createdAt: text("created_at").notNull(),
});

export const tickets = sqliteTable("tickets", {
  id: text("id").primaryKey(), protocol: text("protocol").notNull().unique(), title: text("title").notNull(),
  description: text("description").notNull().default(""), requester: text("requester").notNull(),
  department: text("department").notNull(), priority: text("priority").notNull().default("Média"),
  status: text("status").notNull().default("Recebido"), assigneeId: text("assignee_id").references(() => users.id),
  neighborhood: text("neighborhood"), address: text("address"), latitude: text("latitude"), longitude: text("longitude"),
  dueDate: text("due_date"), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
}, (table) => [index("tickets_status_idx").on(table.status), index("tickets_department_idx").on(table.department)]);

export const groups = sqliteTable("groups", {
  id: text("id").primaryKey(), name: text("name").notNull(), description: text("description").notNull().default(""),
  createdBy: text("created_by").notNull().references(() => users.id), createdAt: text("created_at").notNull(),
});

export const groupMembers = sqliteTable("group_members", {
  groupId: text("group_id").notNull().references(() => groups.id), userId: text("user_id").notNull().references(() => users.id),
  invitationStatus: text("invitation_status").notNull().default("convidado"), joinedAt: text("joined_at"),
}, (table) => [primaryKey({ columns: [table.groupId, table.userId] })]);

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id),
  actorId: text("actor_id").references(() => users.id), type: text("type").notNull(),
  title: text("title").notNull(), body: text("body").notNull(), relatedEntityId: text("related_entity_id"),
  readAt: text("read_at"), createdAt: text("created_at").notNull(),
}, (table) => [index("notifications_user_created_idx").on(table.userId, table.createdAt), index("notifications_unread_idx").on(table.userId, table.readAt)]);

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(), conversationType: text("conversation_type").notNull(), conversationId: text("conversation_id").notNull(),
  senderId: text("sender_id").notNull().references(() => users.id), body: text("body").notNull().default(""),
  attachmentName: text("attachment_name"), attachmentKey: text("attachment_key"), ticketId: text("ticket_id").references(() => tickets.id),
  createdAt: text("created_at").notNull(),
}, (table) => [index("messages_conversation_idx").on(table.conversationType, table.conversationId)]);

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(), name: text("name").notNull(), category: text("category").notNull().default("Documento"),
  ownerId: text("owner_id").notNull().references(() => users.id), ticketId: text("ticket_id").references(() => tickets.id),
  department: text("department").notNull(),
  storageKey: text("storage_key").notNull(), contentType: text("content_type").notNull(), size: integer("size").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("documents_department_idx").on(table.department)]);

export const events = sqliteTable("events", {
  id: text("id").primaryKey(), title: text("title").notNull(), description: text("description").notNull().default(""),
  department: text("department").notNull(), location: text("location").notNull().default(""),
  startsAt: text("starts_at").notNull(), endsAt: text("ends_at"),
  createdBy: text("created_by").notNull().references(() => users.id), createdAt: text("created_at").notNull(),
}, (table) => [index("events_department_starts_idx").on(table.department, table.startsAt)]);

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(), actorId: text("actor_id").notNull().references(() => users.id), action: text("action").notNull(),
  entityType: text("entity_type").notNull(), entityId: text("entity_id").notNull(), detail: text("detail").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("audit_created_at_idx").on(table.createdAt)]);

// Estruturas da evolução operacional. Mantidas separadas dos dados de demonstração
// para permitir ativação gradual em produção sem quebrar o cenário atual.
export const processes = sqliteTable("processes", {
  id: text("id").primaryKey(),
  protocol: text("protocol").notNull().unique(),
  subject: text("subject").notNull(),
  interested: text("interested").notNull().default(""),
  originDepartment: text("origin_department").notNull(),
  currentDepartment: text("current_department").notNull(),
  currentOwnerId: text("current_owner_id").references(() => users.id),
  status: text("status").notNull().default("Autuação"),
  accessLevel: text("access_level").notNull().default("Interno"),
  dueDate: text("due_date"),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("processes_department_idx").on(table.currentDepartment), index("processes_status_idx").on(table.status)]);

export const processMovements = sqliteTable("process_movements", {
  id: text("id").primaryKey(),
  processId: text("process_id").notNull().references(() => processes.id),
  fromDepartment: text("from_department"),
  toDepartment: text("to_department").notNull(),
  actorId: text("actor_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull(),
}, (table) => [index("process_movements_process_idx").on(table.processId, table.createdAt)]);

export const workflowTemplates = sqliteTable("workflow_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  department: text("department").notNull(),
  definitionJson: text("definition_json").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("workflow_templates_department_idx").on(table.department)]);

export const customForms = sqliteTable("custom_forms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  department: text("department").notNull(),
  schemaJson: text("schema_json").notNull(),
  submitAction: text("submit_action").notNull().default("create_ticket"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("custom_forms_department_idx").on(table.department)]);

export const documentVersions = sqliteTable("document_versions", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull().references(() => documents.id),
  version: integer("version").notNull(),
  storageKey: text("storage_key").notNull(),
  note: text("note").notNull().default(""),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: text("created_at").notNull(),
}, (table) => [index("document_versions_document_idx").on(table.documentId, table.version)]);

export const permissionScopes = sqliteTable("permission_scopes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  department: text("department").notNull(),
  scope: text("scope").notNull().default("department"),
  allowedDepartmentsJson: text("allowed_departments_json").notNull().default("[]"),
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: text("created_at").notNull(),
}, (table) => [index("permission_scopes_user_idx").on(table.userId, table.department)]);
