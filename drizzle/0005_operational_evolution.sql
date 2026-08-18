CREATE TABLE `processes` (
  `id` text PRIMARY KEY NOT NULL,
  `protocol` text NOT NULL UNIQUE,
  `subject` text NOT NULL,
  `interested` text DEFAULT '' NOT NULL,
  `origin_department` text NOT NULL,
  `current_department` text NOT NULL,
  `current_owner_id` text,
  `status` text DEFAULT 'Autuação' NOT NULL,
  `access_level` text DEFAULT 'Interno' NOT NULL,
  `due_date` text,
  `created_by` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`current_owner_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);
CREATE INDEX `processes_department_idx` ON `processes` (`current_department`);
CREATE INDEX `processes_status_idx` ON `processes` (`status`);

CREATE TABLE `process_movements` (
  `id` text PRIMARY KEY NOT NULL,
  `process_id` text NOT NULL,
  `from_department` text,
  `to_department` text NOT NULL,
  `actor_id` text NOT NULL,
  `action` text NOT NULL,
  `note` text DEFAULT '' NOT NULL,
  `created_at` text NOT NULL,
  FOREIGN KEY (`process_id`) REFERENCES `processes`(`id`),
  FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`)
);
CREATE INDEX `process_movements_process_idx` ON `process_movements` (`process_id`, `created_at`);

CREATE TABLE `workflow_templates` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `department` text NOT NULL,
  `definition_json` text NOT NULL,
  `active` integer DEFAULT true NOT NULL,
  `created_by` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);
CREATE INDEX `workflow_templates_department_idx` ON `workflow_templates` (`department`);

CREATE TABLE `custom_forms` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `department` text NOT NULL,
  `schema_json` text NOT NULL,
  `submit_action` text DEFAULT 'create_ticket' NOT NULL,
  `active` integer DEFAULT true NOT NULL,
  `created_by` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);
CREATE INDEX `custom_forms_department_idx` ON `custom_forms` (`department`);

CREATE TABLE `document_versions` (
  `id` text PRIMARY KEY NOT NULL,
  `document_id` text NOT NULL,
  `version` integer NOT NULL,
  `storage_key` text NOT NULL,
  `note` text DEFAULT '' NOT NULL,
  `created_by` text NOT NULL,
  `created_at` text NOT NULL,
  FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);
CREATE INDEX `document_versions_document_idx` ON `document_versions` (`document_id`, `version`);

CREATE TABLE `permission_scopes` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `department` text NOT NULL,
  `scope` text DEFAULT 'department' NOT NULL,
  `allowed_departments_json` text DEFAULT '[]' NOT NULL,
  `starts_at` text,
  `ends_at` text,
  `created_by` text NOT NULL,
  `created_at` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);
CREATE INDEX `permission_scopes_user_idx` ON `permission_scopes` (`user_id`, `department`);
