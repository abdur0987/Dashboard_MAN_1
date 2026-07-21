CREATE TABLE IF NOT EXISTS `account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `dashboard_activities` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`caption` text NOT NULL,
	`image_url` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`before_summary` text,
	`after_summary` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `dashboard_award_collections` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `dashboard_award_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`collection_id` text NOT NULL,
	`item_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`year` integer NOT NULL,
	`image_url` text NOT NULL,
	`alt` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`collection_id`) REFERENCES `dashboard_award_collections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `dashboard_chart_series` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year` integer NOT NULL,
	`category` text NOT NULL,
	`value` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `dashboard_contact_info` (
	`id` integer PRIMARY KEY NOT NULL,
	`institution` text NOT NULL,
	`address` text NOT NULL,
	`phone` text NOT NULL,
	`whatsapp` text NOT NULL,
	`email` text NOT NULL,
	`instagram` text NOT NULL,
	`youtube` text NOT NULL,
	`website` text NOT NULL,
	`map_embed_url` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `dashboard_rows` (
	`id` integer PRIMARY KEY NOT NULL,
	`indicator` text NOT NULL,
	`category` text NOT NULL,
	`region` text NOT NULL,
	`period` text NOT NULL,
	`year` integer NOT NULL,
	`value` real NOT NULL,
	`unit` text NOT NULL,
	`source` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `dashboard_datasets` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`year` integer NOT NULL,
	`producer` text NOT NULL,
	`frequency` text NOT NULL,
	`format` text NOT NULL,
	`source_url` text NOT NULL,
	`excel_url` text NOT NULL,
	`pdf_url` text NOT NULL,
	`standard_data` text NOT NULL,
	`metadata` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `employee_aggregate_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`sync_run_id` text,
	`period` text NOT NULL,
	`employees_total` integer,
	`teachers_total` integer,
	`staff_total` integer,
	`pns_total` integer,
	`pppk_total` integer,
	`non_asn_total` integer,
	`education_s3` integer,
	`education_s2` integer,
	`education_s1d4` integer,
	`education_diploma` integer,
	`education_secondary` integer,
	`education_unknown` integer,
	`certified_total` integer,
	`uncertified_total` integer,
	`certification_unknown` integer,
	`upstream_total` integer,
	`records_received` integer NOT NULL,
	`filtered_total` integer,
	`page_count` integer NOT NULL,
	`coverage` real NOT NULL,
	`quality_score` real NOT NULL,
	`warnings_json` text NOT NULL,
	`captured_at` text NOT NULL,
	FOREIGN KEY (`sync_run_id`) REFERENCES `sync_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `dashboard_executive_schedules` (
	`id` integer PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`title` text NOT NULL,
	`unit` text NOT NULL,
	`location` text NOT NULL,
	`priority` text NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `dashboard_filters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`value` text NOT NULL,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `dashboard_indicators` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`unit` text NOT NULL,
	`source` text NOT NULL,
	`year` integer NOT NULL,
	`value` real NOT NULL,
	`trend` real NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `institution_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`sync_run_id` text,
	`period` text NOT NULL,
	`name` text NOT NULL,
	`nsm` text NOT NULL,
	`npsn` text NOT NULL,
	`status` text,
	`accreditation` text,
	`registered_status` text,
	`source_updated_at` text,
	`captured_at` text NOT NULL,
	FOREIGN KEY (`sync_run_id`) REFERENCES `sync_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `integration_sources` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`base_url_masked` text NOT NULL,
	`enabled` integer NOT NULL,
	`sync_frequency` text NOT NULL,
	`freshness_threshold_minutes` integer NOT NULL,
	`last_success_at` text,
	`last_attempt_at` text,
	`last_status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `dashboard_office_locations` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`address` text NOT NULL,
	`phone` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`maps_url` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `dashboard_publications` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`date` text NOT NULL,
	`category` text NOT NULL,
	`file_label` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `dashboard_release_schedules` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`period` text NOT NULL,
	`language` text NOT NULL,
	`scheduled_date` text NOT NULL,
	`realized_date` text NOT NULL,
	`status` text NOT NULL,
	`document_url` text NOT NULL,
	`format` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `student_aggregate_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`sync_run_id` text,
	`period` text NOT NULL,
	`school_year` text NOT NULL,
	`semester` text NOT NULL,
	`students_total` integer,
	`grade_10` integer,
	`grade_11` integer,
	`grade_12` integer,
	`male` integer,
	`female` integer,
	`study_groups_total` integer,
	`study_groups_10` integer,
	`study_groups_11` integer,
	`study_groups_12` integer,
	`coverage` real NOT NULL,
	`quality_score` real NOT NULL,
	`warnings_json` text NOT NULL,
	`captured_at` text NOT NULL,
	FOREIGN KEY (`sync_run_id`) REFERENCES `sync_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sync_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`source_code` text NOT NULL,
	`trigger_type` text NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`status` text NOT NULL,
	`records_received` integer NOT NULL,
	`records_matched` integer NOT NULL,
	`records_rejected` integer NOT NULL,
	`page_count` integer NOT NULL,
	`duration_ms` integer,
	`error_code` text,
	`error_summary` text,
	`created_by` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`source_code`) REFERENCES `integration_sources`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer NOT NULL,
	`image` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `dashboard_videos` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`embed_url` text NOT NULL
);
