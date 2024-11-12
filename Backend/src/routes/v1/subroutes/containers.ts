import { db } from "@/db/db";
import { Tables } from "@/db/schema";
import * as compose from "@/utils/dockerUtils";
import { safeAwait } from "@/utils/utils";
import { DockerComposePsResultService } from "docker-compose";
import { eq } from "drizzle-orm";
import Elysia, { t } from "elysia";

const containers = new Elysia({
	prefix: "containers",
	tags: ["containers"],
})
	.derive(({ request }) => {
		return {
			repoName: request.url.split("/")[3], // /v1/repositories/:repo/containers
		};
	})
	.get(
		"/",
		async ({ set, repoName }) => {
			const [repo, error] = await safeAwait(
				db
					.select()
					.from(Tables.repositories)
					.where(eq(Tables.repositories.name, repoName)),
			);
			if (error || !repo) {
				set.status = 400;
				return {
					message: "Failed to fetch repository",
					error: error?.message ?? "Unknown error",
				};
			}

			const status = await compose.getStatus(repo[0]);
			set.status = 200;
			return status.containers;
		},
		{
			response: {
				200: t.Array(
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
				400: t.Object({
					message: t.String(),
					error: t.String(),
				}),
			},
			details: {
				description: "Fetch all containers",
			},
		},
	)
	.get(
		"/:container",
		async ({ set, repoName, params }) => {
			const [repo, error] = await safeAwait(
				db
					.select()
					.from(Tables.repositories)
					.where(eq(Tables.repositories.name, repoName)),
			);
			if (error || !repo) {
				set.status = 400;
				return {
					message: "Failed to fetch repository",
					error: error?.message ?? "Unknown error",
				};
			}

			const status = await compose.getStatus(repo[0]);
			const container = status.containers.find(
				(container) => container.name === params.container,
			);
			if (!container) {
				set.status = 400;
				return {
					message: "Failed to fetch container",
					error: "Container not found",
				};
			}

			const [logs, err] = await safeAwait(
				compose.getLogs(repo[0], container.name),
			);

			if (err || !logs) {
				set.status = 400;
				return {
					message: "Failed to fetch container logs",
					error: err?.message ?? "No logs found",
				};
			}

			set.status = 200;
			return {
				...container,
				logs: logs,
			};
		},
		{
			params: t.Object({
				container: t.String(),
			}),
			response: {
				200: t.Object({
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
					logs: t.String(),
				}),
				400: t.Object({
					message: t.String(),
					error: t.String(),
				}),
			},
			details: {
				description: "Fetch a container",
			},
		},
	);

export default containers;
