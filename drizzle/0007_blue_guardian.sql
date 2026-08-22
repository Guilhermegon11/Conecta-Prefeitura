CREATE TABLE `fleet_audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`actor_id` text NOT NULL,
	`actor_name` text NOT NULL,
	`detail_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `fleet_audit_entity_idx` ON `fleet_audit_logs` (`entity_type`,`entity_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `fleet_audit_created_at_idx` ON `fleet_audit_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `fleet_mileage_records` (
	`id` text PRIMARY KEY NOT NULL,
	`vehicle_id` text NOT NULL,
	`work_date` text NOT NULL,
	`department` text NOT NULL,
	`responsible_id` text NOT NULL,
	`responsible_name` text NOT NULL,
	`start_km` real NOT NULL,
	`start_at` text NOT NULL,
	`start_notes` text DEFAULT '' NOT NULL,
	`end_km` real,
	`end_at` text,
	`end_notes` text DEFAULT '' NOT NULL,
	`distance_km` real,
	`status` text DEFAULT 'open' NOT NULL,
	`created_by` text NOT NULL,
	`closed_by` text,
	`closed_by_name` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `fleet_vehicles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fleet_mileage_vehicle_date_uq` ON `fleet_mileage_records` (`vehicle_id`,`work_date`);--> statement-breakpoint
CREATE INDEX `fleet_mileage_department_date_idx` ON `fleet_mileage_records` (`department`,`work_date`);--> statement-breakpoint
CREATE INDEX `fleet_mileage_vehicle_status_idx` ON `fleet_mileage_records` (`vehicle_id`,`status`);--> statement-breakpoint
CREATE TABLE `fleet_vehicles` (
	`id` text PRIMARY KEY NOT NULL,
	`plate` text NOT NULL,
	`name` text NOT NULL,
	`brand_model` text DEFAULT '' NOT NULL,
	`department` text NOT NULL,
	`current_odometer` real DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fleet_vehicles_department_plate_uq` ON `fleet_vehicles` (`department`,`plate`);--> statement-breakpoint
CREATE INDEX `fleet_vehicles_department_active_idx` ON `fleet_vehicles` (`department`,`active`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_workflow_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`department` text NOT NULL,
	`definition_json` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_workflow_templates`("id", "name", "department", "definition_json", "active", "created_by", "created_at", "updated_at") SELECT "id", "name", "department", "definition_json", "active", "created_by", "created_at", "updated_at" FROM `workflow_templates`;--> statement-breakpoint
DROP TABLE `workflow_templates`;--> statement-breakpoint
ALTER TABLE `__new_workflow_templates` RENAME TO `workflow_templates`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `workflow_templates_department_idx` ON `workflow_templates` (`department`);--> statement-breakpoint
CREATE TABLE `__new_custom_forms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`department` text NOT NULL,
	`schema_json` text NOT NULL,
	`submit_action` text DEFAULT 'create_ticket' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_custom_forms`("id", "name", "department", "schema_json", "submit_action", "active", "created_by", "created_at", "updated_at") SELECT "id", "name", "department", "schema_json", "submit_action", "active", "created_by", "created_at", "updated_at" FROM `custom_forms`;--> statement-breakpoint
DROP TABLE `custom_forms`;--> statement-breakpoint
ALTER TABLE `__new_custom_forms` RENAME TO `custom_forms`;--> statement-breakpoint
CREATE INDEX `custom_forms_department_idx` ON `custom_forms` (`department`);