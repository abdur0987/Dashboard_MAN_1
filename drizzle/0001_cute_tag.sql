CREATE TABLE `dashboard_site_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`header_institution_name` text NOT NULL,
	`header_subtitle` text NOT NULL,
	`hero_title` text NOT NULL,
	`hero_highlight` text NOT NULL,
	`hero_description` text NOT NULL,
	`footer_title` text NOT NULL,
	`footer_subtitle` text NOT NULL,
	`footer_description` text NOT NULL,
	`updated_at` text NOT NULL
);
