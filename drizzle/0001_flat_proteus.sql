CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`actor_id` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`related_entity_id` text,
	`read_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `notifications_user_created_idx` ON `notifications` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `notifications_unread_idx` ON `notifications` (`user_id`,`read_at`);--> statement-breakpoint
INSERT OR IGNORE INTO `groups` (`id`,`name`,`description`,`created_by`,`created_at`) VALUES
('g-saude-digital','Comitê de Saúde Digital','Integração dos atendimentos e sistemas da rede municipal.','u-lucas','2026-08-13T14:45:00.000Z');--> statement-breakpoint
INSERT OR IGNORE INTO `group_members` (`group_id`,`user_id`,`invitation_status`,`joined_at`) VALUES
('g-saude-digital','u-lucas','aceito','2026-08-13T14:45:00.000Z'),
('g-saude-digital','u-ana','convidado',NULL);--> statement-breakpoint
INSERT OR IGNORE INTO `notifications` (`id`,`user_id`,`actor_id`,`type`,`title`,`body`,`related_entity_id`,`read_at`,`created_at`) VALUES
('n-convite-saude','u-ana','u-lucas','group_invite','Novo convite para grupo','Lucas Mendes convidou você para o Comitê de Saúde Digital.','g-saude-digital',NULL,'2026-08-13T14:45:00.000Z'),
('n-convite-volta-aulas','u-rafael','u-amanda','group_invite','Novo convite para grupo','Amanda Silva convidou você para Operação Volta às Aulas 2026.','g-volta-aulas',NULL,'2026-08-13T14:00:00.000Z'),
('n-aprovacao','u-ana','u-lucas','ticket','Chamado aguardando aprovação','O chamado CH-2026-0186 está pronto para sua análise.','t-186',NULL,'2026-08-13T14:52:00.000Z'),
('n-documento','u-ana','u-rafael','message','Documento recebido','Rafael Costa enviou o Relatório técnico — Iluminação.pdf.','m-3','2026-08-13T14:40:00.000Z','2026-08-13T14:36:00.000Z');
