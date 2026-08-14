CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_created_at_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT 'Documento' NOT NULL,
	`owner_id` text NOT NULL,
	`ticket_id` text,
	`storage_key` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `group_members` (
	`group_id` text NOT NULL,
	`user_id` text NOT NULL,
	`invitation_status` text DEFAULT 'convidado' NOT NULL,
	`joined_at` text,
	PRIMARY KEY(`group_id`, `user_id`),
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_type` text NOT NULL,
	`conversation_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`attachment_name` text,
	`attachment_key` text,
	`ticket_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `messages_conversation_idx` ON `messages` (`conversation_type`,`conversation_id`);--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`protocol` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`requester` text NOT NULL,
	`department` text NOT NULL,
	`priority` text DEFAULT 'Média' NOT NULL,
	`status` text DEFAULT 'Recebido' NOT NULL,
	`assignee_id` text,
	`due_date` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tickets_protocol_unique` ON `tickets` (`protocol`);--> statement-breakpoint
CREATE INDEX `tickets_status_idx` ON `tickets` (`status`);--> statement-breakpoint
CREATE INDEX `tickets_department_idx` ON `tickets` (`department`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`department` text NOT NULL,
	`role` text DEFAULT 'secretario' NOT NULL,
	`initials` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
--> statement-breakpoint
INSERT INTO `users` (`id`,`full_name`,`email`,`department`,`role`,`initials`,`created_at`) VALUES
('u-ana','Ana Martins','ana.martins@prefeitura.gov.br','Secretaria de Governo','administrador','AM','2026-08-01T09:00:00.000Z'),
('u-rafael','Rafael Costa','rafael.costa@prefeitura.gov.br','Infraestrutura','secretario','RC','2026-08-01T09:00:00.000Z'),
('u-lucas','Lucas Mendes','lucas.mendes@prefeitura.gov.br','Saúde','secretario','LM','2026-08-01T09:00:00.000Z'),
('u-amanda','Amanda Silva','amanda.silva@prefeitura.gov.br','Educação','secretario','AS','2026-08-01T09:00:00.000Z'),
('u-carla','Carla Prado','carla.prado@prefeitura.gov.br','Procuradoria','secretario','CP','2026-08-01T09:00:00.000Z'),
('u-felipe','Felipe Barros','felipe.barros@prefeitura.gov.br','Meio Ambiente','secretario','FB','2026-08-01T09:00:00.000Z');
--> statement-breakpoint
INSERT INTO `tickets` (`id`,`protocol`,`title`,`description`,`requester`,`department`,`priority`,`status`,`assignee_id`,`due_date`,`created_at`,`updated_at`) VALUES
('t-187','CH-2026-0187','Manutenção da iluminação na Praça Central','Substituição de luminárias e revisão do quadro elétrico.','Ouvidoria Municipal','Infraestrutura','Alta','Em produção','u-rafael','2026-08-13T19:00:00.000Z','2026-08-13T10:00:00.000Z','2026-08-13T14:36:00.000Z'),
('t-186','CH-2026-0186','Revisão do calendário de vacinação','Validar datas, locais e comunicação da campanha.','Gabinete do Prefeito','Saúde','Média','Aguardando aprovação','u-lucas','2026-08-14T18:00:00.000Z','2026-08-12T13:00:00.000Z','2026-08-13T14:52:00.000Z'),
('t-185','CH-2026-0185','Atualização do transporte escolar — Zona Norte','Revisar itinerários antes da volta às aulas.','Secretaria de Educação','Mobilidade','Alta','Recebido','u-amanda','2026-08-15T18:00:00.000Z','2026-08-12T11:00:00.000Z','2026-08-12T11:00:00.000Z'),
('t-184','CH-2026-0184','Parecer sobre contratação emergencial','Análise jurídica concluída.','Secretaria de Administração','Procuradoria','Baixa','Finalizado','u-carla','2026-08-12T18:00:00.000Z','2026-08-10T09:00:00.000Z','2026-08-13T12:00:00.000Z'),
('t-183','CH-2026-0183','Liberação de área para feira de produtores','Avaliação ambiental e autorização de uso.','Desenvolvimento Econômico','Meio Ambiente','Média','Em produção','u-felipe','2026-08-16T18:00:00.000Z','2026-08-11T15:00:00.000Z','2026-08-13T11:00:00.000Z');
--> statement-breakpoint
INSERT INTO `groups` (`id`,`name`,`description`,`created_by`,`created_at`) VALUES
('g-volta-aulas','Operação Volta às Aulas 2026','Coordenação entre Educação, Mobilidade e Governo.','u-amanda','2026-08-13T14:00:00.000Z'),
('g-centro','Revitalização do Centro','Acompanhamento das obras e comunicação institucional.','u-ana','2026-08-11T10:00:00.000Z');
--> statement-breakpoint
INSERT INTO `group_members` (`group_id`,`user_id`,`invitation_status`,`joined_at`) VALUES
('g-volta-aulas','u-ana','aceito','2026-08-13T14:05:00.000Z'),('g-volta-aulas','u-amanda','aceito','2026-08-13T14:00:00.000Z'),
('g-volta-aulas','u-rafael','convidado',NULL),('g-centro','u-ana','aceito','2026-08-11T10:00:00.000Z'),
('g-centro','u-rafael','aceito','2026-08-11T10:10:00.000Z'),('g-centro','u-carla','aceito','2026-08-11T10:12:00.000Z');
--> statement-breakpoint
INSERT INTO `messages` (`id`,`conversation_type`,`conversation_id`,`sender_id`,`body`,`attachment_name`,`attachment_key`,`ticket_id`,`created_at`) VALUES
('m-1','direct','u-rafael','u-rafael','Bom dia, Ana. A equipe já iniciou a vistoria na Praça Central.',NULL,NULL,'t-187','2026-08-13T14:20:00.000Z'),
('m-2','direct','u-rafael','u-ana','Ótimo. Por favor, envie o relatório técnico assim que estiver pronto.',NULL,NULL,'t-187','2026-08-13T14:24:00.000Z'),
('m-3','direct','u-rafael','u-rafael','Segue a primeira versão para conferência.','Relatório técnico — Iluminação.pdf',NULL,'t-187','2026-08-13T14:36:00.000Z'),
('m-4','group','g-volta-aulas','u-amanda','Incluí a planilha com os novos itinerários. Precisamos da validação até amanhã.',NULL,NULL,'t-185','2026-08-13T14:10:00.000Z');
--> statement-breakpoint
INSERT INTO `audit_logs` (`id`,`actor_id`,`action`,`entity_type`,`entity_id`,`detail`,`created_at`) VALUES
('a-1','u-lucas','status_atualizado','chamado','t-186','Calendário de vacinação movido para Aguardando aprovação','2026-08-13T14:52:00.000Z'),
('a-2','u-rafael','documento_enviado','mensagem','m-3','Relatório técnico — Iluminação.pdf enviado no chat','2026-08-13T14:36:00.000Z'),
('a-3','u-amanda','grupo_criado','grupo','g-volta-aulas','Grupo Operação Volta às Aulas 2026 criado','2026-08-13T14:00:00.000Z'),
('a-4','u-carla','chamado_finalizado','chamado','t-184','Parecer sobre contratação emergencial finalizado','2026-08-13T12:00:00.000Z');
