import { mkdir } from "node:fs/promises";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

await mkdir(
	(process.env.DB_FILE_NAME ?? "./database/db.sqlite")
		.split("/")
		.slice(0, -1)
		.join("/"),
	{ recursive: true },
);

const db = drizzle(process.env.DB_FILE_NAME ?? "./database/db.sqlite", {
	casing: "snake_case",
});

async function migrateDb() {
	migrate(db, {
		migrationsFolder: "./drizzle",
	});
}

export { db, migrateDb as connect };
