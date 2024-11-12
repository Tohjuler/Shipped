import { desc, not, relations, sql } from "drizzle-orm";
import { sqliteTable as table } from "drizzle-orm/sqlite-core";
import * as t from "drizzle-orm/sqlite-core";

export type UpdateStatus = "UPDATING" | "SUCCESS" | "FAILURE";

export const repositories = table("repositories", {
	name: t.text("name").primaryKey(),
	url: t.text("url").notNull(),
	fetchInterval: t.text("fetch_interval").default("15m"),
	revertOnFailure: t
		.integer("revert_on_failure", { mode: "boolean" })
		.default(false),
	notificationUrl: t.text("notification_url"),
	notificationProvider: t.text("notification_provider"),
	cloneDepth: t.integer("clone_depth").default(0), // 0 = Use .env value, -1 = Full clone
	composeFile: t.text("compose_file"),
	branch: t.text("branch"),
	createdAt: t.text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: t.text("updated_at").$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
});

// export const updates = table("updates", {
// 	id: t.int("id").primaryKey({ autoIncrement: true }),
// 	repositoryId: t
// 		.int("repository_id")
// 		.notNull()
// 		.references(() => repositories.id, { onDelete: "cascade" }),
// 	from: t.text("from").notNull(),
// 	to: t.text("to").notNull(),
// 	status: t.text("status").notNull().$type<UpdateStatus>(),
// 	createdAt: t.text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
// 	updatedAt: t.text("updated_at").$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
// 	error: t.text("error"),
// });

export const keys = table("keys", {
	key: t.text("key").notNull().primaryKey(),
	description: t.text("description"),
	createdAt: t.text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const Tables = {
	repositories,
	// updates,
	keys,
} as const;

export type Tables = typeof Tables;

export type repository = typeof Tables.repositories.$inferSelect;
// export type update = typeof Tables.updates.$inferSelect;
