CREATE TABLE `keys` (
	`key` text PRIMARY KEY NOT NULL,
	`description` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `stacks` (
	`name` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`url` text,
	`clone_depth` integer DEFAULT 0,
	`branch` text,
	`fetch_interval` text DEFAULT '15m',
	`revert_on_failure` integer DEFAULT false,
	`compose_path` text,
	`notification_url` text,
	`notification_provider` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text
);
