import { drizzle, migrate } from "drizzle-orm/connect";
import { Tables } from "./schema";
import { spreads } from "./utils";

const db = await drizzle("bun:sqlite", {
	connection: process.env.DB_FILE_NAME ?? "db.sqlite",
	casing: "snake_case",
});

async function migrateDb() {
	await migrate(db, {
		migrationsFolder: "./drizzle",
	});
}

export { db, migrateDb as connect };
