import { sql } from "drizzle-orm";
import { sqliteTable as table } from "drizzle-orm/sqlite-core";
import * as t from "drizzle-orm/sqlite-core";

export type StackType = "git" | "file";

export const stacks = table("stacks", {
	name: t.text("name").primaryKey(),
	type: t.text("type").notNull().$type<StackType>(),

	// Git
	url: t.text("url"),
	cloneDepth: t.integer("clone_depth").default(0), // 0 = Use .env value, -1 = Full clone
	branch: t.text("branch"),
	fetchInterval: t.text("fetch_interval").default("15m"),
	revertOnFailure: t
		.integer("revert_on_failure", { mode: "boolean" })
		.default(false),
	composePath: t.text("compose_path"),

	// Notifications
	notificationUrl: t.text("notification_url"),
	notificationProvider: t.text("notification_provider"),

	createdAt: t.text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: t.text("updated_at").$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
});

export const keys = table("keys", {
	key: t.text("key").notNull().primaryKey(),
	description: t.text("description"),
	createdAt: t.text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const Tables = {
	stacks,
	// updates,
	keys,
} as const;

export type Tables = typeof Tables;

export type stack = typeof Tables.stacks.$inferSelect;
