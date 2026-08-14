ALTER TABLE `users` ADD `account_status` text DEFAULT 'Ativo' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `invited_by` text;--> statement-breakpoint
ALTER TABLE `users` ADD `invited_at` text;