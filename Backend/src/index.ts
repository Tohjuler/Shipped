import { connect, db } from "@/db/db";
import bearer from "@elysiajs/bearer";
import cors from "@elysiajs/cors";
import cron from "@elysiajs/cron";
import serverTiming from "@elysiajs/server-timing";
import { swagger } from "@elysiajs/swagger";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { Tables } from "./db/schema";
import keysRoute from "./routes/v1/keys";
import mainRoute from "./routes/v1/mainRoute";
import repositories from "./routes/v1/repositories";
import logger from "./utils/logger";
import { sendNotification } from "./utils/notifications";
import {
	handleUpdateCheck,
	randomString,
	stringTimeToMinuttes,
} from "./utils/utils";

let starting = true;
const lastCheck: { [key: string]: number } = {};

const app = new Elysia({
	serve: {
		port: process.env.PORT ?? 5055,
	},
})
	.use(
		swagger({
			documentation: {
				components: {
					securitySchemes: {
						bearer: {
							type: "http",
							scheme: "bearer",
						},
					},
				},
			},
		}),
	)
	.use(cors())
	.use(serverTiming())
	.use(bearer())
	.onBeforeHandle(async ({ path, bearer, set }) => {
		const notStarted = () => {
			set.status = 503;

			return "Service Unavailable";
		};

		if (starting) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			if (starting) return notStarted();
		}
		if (path.startsWith("/swagger")) return;

		if (!bearer) {
			set.status = 400;
			set.headers["WWW-Authenticate"] =
				`Bearer realm='sign', error="invalid_request"`;

			return "Unauthorized";
		}
		if (
			(process.env.NODE_ENV !== "test" ||
				bearer !== process.env.TEST_API_KEY) &&
			(await db.select().from(Tables.keys).where(eq(Tables.keys.key, bearer)))
				.length === 0
		) {
			set.status = 401;
			set.headers["WWW-Authenticate"] =
				`Bearer realm='sign', error="invalid_token"`;

			return "Unauthorized";
		}
	})
	.get("/", () => "API is running!")
	.group("/v1", (app) =>
		app
			.use(repositories)
			// .use(updates)
			.use(mainRoute)
			.use(keysRoute),
	)
	.use(
		cron({
			name: "update-checker",
			pattern: "*/1 * * * *",
			run() {
				for (const repo of db.select().from(Tables.repositories).all()) {
					// Check for updates
					const checkTime = stringTimeToMinuttes(repo.fetchInterval ?? "15m");
					if (
						lastCheck[repo.name] &&
						Date.now() - lastCheck[repo.name] < checkTime * 60 * 1000
					)
						continue;
					logger.debug(`Checking for updates for ${repo.name} (${repo.url})`);

					lastCheck[repo.name] = Date.now();
					handleUpdateCheck(repo)
						.then(() =>
							logger.debug(
								`Finished for updates for ${repo.name} (${repo.url})`,
							),
						)
						.catch((err) => {
							logger.error("Failed to check for updates", err);
							sendNotification(
								repo,
								"Failed to check for updates",
								err.message,
							);
						});
				}
			},
		}),
	);

async function main() {
	await connect();

	if ((await db.select().from(Tables.keys)).length === 0) {
		const key = randomString(32);
		await db.insert(Tables.keys).values({
			key: key,
			description: "Default key",
		});

		console.log("", `No keys found, created a default key: ${key}`, "");
	}

	starting = false;

	console.log(`API is running at 0.0.0.0:${process.env.PORT ?? 5055}`);
}
main();

export default app;