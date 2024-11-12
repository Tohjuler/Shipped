import { db } from "@/db/db";
import { Tables, type repository } from "@/db/schema";
import { getStatus } from "@/utils/dockerUtils";
import { safeAwait } from "@/utils/utils";
import Elysia, { t } from "elysia";

export type RepositoryStatus = "ACTIVE" | "INACTIVE";

const mainRoute = new Elysia().get(
	"/status",
	async ({ set }) => {
		const [repos, error] = await safeAwait(
			db.select().from(Tables.repositories),
		);
		if (error || !repos) {
			set.status = 400;
			return {
				message: "Failed to fetch repositories",
				error: error?.message ?? "Unknown error",
			};
		}

		set.status = 200;
		return {
			totalRepositories: repos.length,
			repositories: await Promise.all(
				repos.map(async (repo: repository) => {
					const status = await getStatus(repo);

					return {
						name: repo.name,
						url: repo.url,
						status: status.status,
						containers: status.containers,
					};
				}),
			),
		};
	},
	{
		response: {
			200: t.Object({
				totalRepositories: t.Number(),
				repositories: t.Array(
					t.Object({
						name: t.String({
							pattern: "^[a-z0-9_-]{3,30}$",
						}),
						url: t.String(),
						status: t.Union([t.Literal("ACTIVE"), t.Literal("INACTIVE")]),
						containers: t.Array(
							t.Object({
								name: t.String(),
								command: t.String(),
								state: t.String(),
								ports: t.Array(
									t.Object({
										mapped: t.Optional(
											t.Object({
												address: t.String(),
												port: t.Number(),
											}),
										),
										exposed: t.Object({
											port: t.Number(),
											protocol: t.String(),
										}),
									}),
								),
							}),
						),
					}),
				),
			}),
			400: t.Object({
				message: t.String(),
				error: t.String(),
			}),
		},
		details: {
			description: "Fetch information about the repositories",
		},
	},
);

export default mainRoute;
