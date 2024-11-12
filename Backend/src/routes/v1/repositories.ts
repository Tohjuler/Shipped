import { db } from "@/db/db";
import { Tables } from "@/db/schema";
import * as compose from "@/utils/dockerUtils";
import * as git from "@/utils/gitUtils";
import { handleUpdateCheck, safeAwait } from "@/utils/utils";
import { eq } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { Elysia, t } from "elysia";
import containers from "./subroutes/containers";

const _createRepo = createInsertSchema(Tables.repositories);
const _selectRepo = createSelectSchema(Tables.repositories);

const repositories = new Elysia({
	prefix: "repositories",
	tags: ["repositories"],
})
	.post(
		"/",
		async ({ body, set }) => {
			if (
				await db
					.select()
					.from(Tables.repositories)
					.where(eq(Tables.repositories.name, body.name))
			) {
				set.status = 400;
				return {
					message: "Repository with the same name already exists",
				};
			}

			const [insRepo, error] = await safeAwait(
				db.insert(Tables.repositories).values(body).returning(),
			);
			if (error || !insRepo || insRepo.length === 0) {
				set.status = 400;
				return {
					message: "Failed to create repository",
					error: error?.message,
				};
			}
			const repo = insRepo[0];

			try {
				await git.clone(repo);
			} catch (error) {
				console.error(error);

				set.status = 400;
				return {
					message: "Failed to clone repository",
					error: (error as Error).message,
				};
			}

			// ---

			const [_pullRes, pullError] = await safeAwait(compose.pull(repo));

			if (pullError) {
				set.status = 400;
				return {
					message: "Failed to pull docker images",
					error: pullError.message,
				};
			}

			const [_upRes, upError] = await safeAwait(compose.up(repo));
			if (upError) {
				set.status = 400;
				return {
					message: "Failed to start docker containers",
					error: upError.message,
				};
			}

			set.status = 201;
			return repo;
		},
		{
			body: t.Intersect([
				t.Omit(_createRepo, ["name", "createdAt", "updatedAt"]),
				t.Object({
					name: t.String({
						pattern: "^[a-z0-9_-]{3,30}$",
					}),
				}),
			]),
			response: {
				400: t.Object({
					message: t.String(),
					error: t.Optional(t.String()),
				}),
				201: _selectRepo,
			},
			details: {
				description: "Create a new repository",
			},
		},
	)
	.get(
		"/",
		async ({ set }) => {
			const [repos, error] = await safeAwait(
				db.select().from(Tables.repositories),
			);
			if (error) {
				set.status = 400;
				return {
					message: "Failed to fetch repositories",
					error: error.message,
				};
			}

			set.status = 200;
			return repos ?? [];
		},
		{
			response: {
				200: t.Array(_selectRepo),
				400: t.Object({
					message: t.String(),
					error: t.String(),
				}),
			},
			details: {
				description: "Fetch all repositories",
			},
		},
	)
	.get(
		"/:name",
		async ({ params, set }) => {
			const [repos, error] = await safeAwait(
				db
					.select()
					.from(Tables.repositories)
					.where(eq(Tables.repositories.name, params.name)),
			);
			if (error || !repos) {
				set.status = 400;
				return {
					message: "Failed to fetch repositories",
					error: error?.message ?? "Unknown error",
				};
			}
			const repo = repos[0];

			set.status = 200;
			const status = await compose.getStatus(repo);
			return {
				name: repo.name,
				url: repo.url,
				status: status.status,
				containers: status.containers,
			};
		},
		{
			params: t.Object({
				name: t.String(),
			}),
			response: {
				200: t.Object({
					name: t.String(),
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
				400: t.Object({
					message: t.String(),
					error: t.String(),
				}),
			},
			details: {
				description: "Get the satatus of repository",
			},
		},
	)
	.put(
		"/:name",
		async ({ params, body, set }) => {
			const [repo, error] = await safeAwait(
				db
					.update(Tables.repositories)
					.set(body)
					.where(eq(Tables.repositories.name, params.name))
					.returning(),
			);
			if (error || !repo || repo.length === 0) {
				set.status = 400;
				return {
					message: "Failed to update repository",
					error: error?.message,
				};
			}

			set.status = 200;
			return {
				message: "Repository updated successfully",
			};
		},
		{
			params: t.Object({
				name: t.String(),
			}),
			body: t.Omit(_createRepo, ["id", "createdAt", "updatedAt"]),
			response: t.Object({
				message: t.String(),
				error: t.Optional(t.String()),
			}),
			details: {
				description: "Update a repository",
			},
		},
	)
	.delete(
		"/:name",
		async ({ params, set }) => {
			const [repo, error] = await safeAwait(
				db
					.delete(Tables.repositories)
					.where(eq(Tables.repositories.name, params.name))
					.returning(),
			);
			if (error || !repo || repo.length === 0) {
				set.status = 400;
				return {
					message: "Failed to delete repository",
					error: error?.message,
				};
			}

			// Delete repo
			const [_, delRepoError] = await safeAwait(git.deleteRepo(params.name));
			if (delRepoError) {
				set.status = 400;
				return {
					message: "Failed to delete repository",
					error: delRepoError.message,
				};
			}

			set.status = 200;
			return {
				message: "Repository deleted successfully",
			};
		},
		{
			params: t.Object({
				name: t.String(),
			}),
			response: t.Object({
				message: t.String(),
				error: t.Optional(t.String()),
			}),
			details: {
				description: "Delete a repository",
			},
		},
	)
	.get(
		"/:name/run-check",
		async ({ params, set }) => {
			const [repo, error] = await safeAwait(
				db
					.select()
					.from(Tables.repositories)
					.where(eq(Tables.repositories.name, params.name)),
			);
			if (error || !repo || repo.length === 0) {
				set.status = 400;
				return {
					message: "Failed to fetch repository",
					error: error?.message,
				};
			}

			const [checkRes, checkError] = await safeAwait(
				handleUpdateCheck(repo[0]),
			);
			if (checkError || !checkRes) {
				if (checkError) console.error(checkError);
				set.status = 400;
				return {
					message: "Failed to run check",
					error: checkError?.message,
				};
			}
			if (!checkRes.updated) {
				set.status = 200;
				return {
					message: "No updates found",
				};
			}

			set.status = 200;
			return {
				message: "Check ran successfully",
				...checkRes,
			};
		},
		{
			timeout: 300000,
			params: t.Object({
				name: t.String(),
			}),
			response: {
				200: t.Object({
					message: t.String(),
					from: t.Optional(t.String()),
					to: t.Optional(t.String()),
				}),
				400: t.Object({
					message: t.String(),
					error: t.Optional(t.String()),
				}),
			},
			details: {
				description: "Run check for a repository",
			},
		},
	)
	.get(
		"/:name/start",
		async ({ params, set }) => {
			const [repo, error] = await safeAwait(
				db
					.select()
					.from(Tables.repositories)
					.where(eq(Tables.repositories.name, params.name)),
			);
			if (error || !repo || repo.length === 0) {
				set.status = 400;
				return {
					message: "Failed to fetch repository",
					error: error?.message ?? "Unknown error",
				};
			}

			const [upRes, upError] = await safeAwait(compose.up(repo[0]));
			if (upError || !upRes) {
				set.status = 400;
				return {
					message: "Failed to start docker containers",
					error: upError?.message ?? "Unknown error",
				};
			}

			set.status = 200;
			return {
				message: "Repository started successfully",
				log: {
					out: upRes.out,
					err: upRes.err,
				},
			};
		},
		{
			params: t.Object({
				name: t.String(),
			}),
			response: {
				200: t.Object({
					message: t.String(),
					log: t.Object({
						out: t.Optional(t.String()),
						err: t.Optional(t.String()),
					}),
				}),
				400: t.Object({
					message: t.String(),
					error: t.String(),
				}),
			},
			details: {
				description: "Start a repository",
			},
		},
	)
	.get(
		"/:name/stop",
		async ({ params, set }) => {
			const [repo, error] = await safeAwait(
				db
					.select()
					.from(Tables.repositories)
					.where(eq(Tables.repositories.name, params.name)),
			);
			if (error || !repo || repo.length === 0) {
				set.status = 400;
				return {
					message: "Failed to fetch repository",
					error: error?.message ?? "Unknown error",
				};
			}

			const [downRes, downError] = await safeAwait(compose.down(repo[0]));
			if (downError || !downRes) {
				set.status = 400;
				return {
					message: "Failed to stop docker containers",
					error: downError?.message ?? "Unknown error",
				};
			}

			set.status = 200;
			return {
				message: "Repository stopped successfully",
				log: {
					out: downRes.out,
					err: downRes.err,
				},
			};
		},
		{
			params: t.Object({
				name: t.String(),
			}),
			response: {
				200: t.Object({
					message: t.String(),
					log: t.Object({
						out: t.Optional(t.String()),
						err: t.Optional(t.String()),
					}),
				}),
				400: t.Object({
					message: t.String(),
					error: t.String(),
				}),
			},
			details: {
				description: "Stop a repository",
			},
		},
	)
	.get(
		"/:name/restart",
		async ({ params, set }) => {
			const [repo, error] = await safeAwait(
				db
					.select()
					.from(Tables.repositories)
					.where(eq(Tables.repositories.name, params.name)),
			);
			if (error || !repo || repo.length === 0) {
				set.status = 400;
				return {
					message: "Failed to fetch repository",
					error: error?.message ?? "Unknown error",
				};
			}

			const [restartRes, downError] = await safeAwait(compose.restart(repo[0]));
			if (downError || !restartRes) {
				set.status = 400;
				return {
					message: "Failed to stop docker containers",
					error: downError?.message ?? "Unknown error",
				};
			}

			set.status = 200;
			return {
				message: "Repository restarted successfully",
				log: {
					out: restartRes.out,
					err: restartRes.err,
				},
			};
		},
		{
			params: t.Object({
				name: t.String(),
			}),
			response: {
				200: t.Object({
					message: t.String(),
					log: t.Object({
						out: t.Optional(t.String()),
						err: t.Optional(t.String()),
					}),
				}),
				400: t.Object({
					message: t.String(),
					error: t.String(),
				}),
			},
			details: {
				description: "Restart a repository",
			},
		},
	)
	.get(
		"/:name/update",
		async ({ params, set }) => {
			const [repo, error] = await safeAwait(
				db
					.select()
					.from(Tables.repositories)
					.where(eq(Tables.repositories.name, params.name)),
			);
			if (error || !repo || repo.length === 0) {
				set.status = 400;
				return {
					message: "Failed to fetch repository",
					error: error?.message ?? "Unknown error",
				};
			}

			const [pullRes, pullError] = await safeAwait(compose.pull(repo[0]));
			if (pullError || !pullRes) {
				set.status = 400;
				return {
					message: "Failed to pull docker images",
					error: pullError?.message ?? "Unknown error",
				};
			}

			const [upRes, upError] = await safeAwait(compose.up(repo[0]));
			if (upError || !upRes) {
				set.status = 400;
				return {
					message: "Failed to start docker containers",
					error: upError?.message ?? "Unknown error",
				};
			}

			set.status = 200;
			return {
				message: "Repository updated successfully",
				log: {
					pull: {
						out: pullRes.out,
						err: pullRes.err,
					},
					up: {
						out: upRes.out,
						err: upRes.err,
					},
				},
			};
		},
		{
			params: t.Object({
				name: t.String(),
			}),
			response: {
				200: t.Object({
					message: t.String(),
					log: t.Object({
						pull: t.Object({
							out: t.Optional(t.String()),
							err: t.Optional(t.String()),
						}),
						up: t.Object({
							out: t.Optional(t.String()),
							err: t.Optional(t.String()),
						}),
					}),
				}),
				400: t.Object({
					message: t.String(),
					error: t.String(),
				}),
			},
			details: {
				description: "Update a repository",
			},
		},
	)
	.group("/:name/containers", (app) => app.use(containers));

export default repositories;
