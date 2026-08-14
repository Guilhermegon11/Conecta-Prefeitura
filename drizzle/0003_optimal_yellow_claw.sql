CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`department` text NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `events_department_starts_idx` ON `events` (`department`,`starts_at`);--> statement-breakpoint
DROP INDEX IF EXISTS `users_email_unique`;--> statement-breakpoint
ALTER TABLE `documents` ADD `department` text NOT NULL DEFAULT '';--> statement-breakpoint
UPDATE `documents` SET `department` = COALESCE((SELECT `department` FROM `users` WHERE `users`.`id` = `documents`.`owner_id`), '') WHERE `department` = '';--> statement-breakpoint
CREATE INDEX `documents_department_idx` ON `documents` (`department`);
