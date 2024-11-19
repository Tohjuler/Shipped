CREATE TABLE `keys` (
	`key` text PRIMARY KEY NOT NULL,
	`description` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `repositories` (
	`name` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`fetch_interval` text DEFAULT '15m',
	`revert_on_failure` integer DEFAULT false,
	`notification_url` text,
	`notification_provider` text,
	`clone_depth` integer DEFAULT 0,
	`compose_file` text,
	`branch` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text
);
