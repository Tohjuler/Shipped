import { db } from "@/db/db";
import { Tables } from "@/db/schema";
import * as compose from "@/utils/dockerUtils";
import * as git from "@/utils/gitUtils";
import { sendNotification } from "@/utils/notifications";
import { handleUpdateCheck, safeAwait } from "@/utils/utils";
import { eq } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { Elysia, t } from "elysia";
import containers from "./subroutes/containers";

const containerType = t.Array(
	t.Object({
		name: t.String(),
		image: t.String(),
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
);

const _createStack = createInsertSchema(Tables.stacks);
const _selectStack = createSelectSchema(Tables.stacks);

const baseDir = process.env.STACKS_DIR ?? "/stacks";

const stacks = new Elysia({
	prefix: "stacks",
	tags: ["stacks"],
})
	.post(
		"/git",
		async ({ body, set }) => {
			if (
				(
					await db
						.select()
						.from(Tables.stacks)
						.where(eq(Tables.stacks.name, body.name))
				).length > 0
			) {
				set.status = 400;
				return {
					message: "A stack with the same name already exists",
				};
			}

			const [insStack, error] = await safeAwait(
				db
					.insert(Tables.stacks)
					.values({
						...body,
						type: "git",
					})
					.returning(),
			);
			if (error || !insStack || insStack.length === 0) {
				set.status = 400;
				return {
					message: "Failed to create the stack",
					error: error?.message,
				};
			}
			const stack = insStack[0];

			try {
				await git.clone(stack);
			} catch (error) {
				console.error(error);

				set.status = 400;
				return {
					message: "Failed to clone repository",
					error: (error as Error).message,
				};
			}

			const pullAndUpError = await compose.pullAndUp(stack);
			if (pullAndUpError) {
				set.status = 400;
				return pullAndUpError;
			}

			sendNotification(
				undefined,
				"global:stack-created",
				"Stack created",
				`Stack ${stack.name} created from ${stack.url}\nBranch: ${stack.branch}`,
			);

			set.status = 201;
			return stack;
		},
		{
			body: t.Intersect([
				t.Omit(_createStack, [
					"name",
					"createdAt",
					"updatedAt",
					"envFile",
					"type",
				]),
				t.Object({
					name: t.String({
						pattern: "^[a-z0-9_-]{3,30}$",
					}),
				}),
			]),
			response: {
				201: _selectStack,
				400: t.Object({
					message: t.String(),
					error: t.Optional(t.String()),
				}),
			},
			details: {
				description: "Create a new stack from a git repository",
			},
		},
	)
	.post(
		"/file",
		async ({ body, set }) => {
			if (
				await db
					.select()
					.from(Tables.stacks)
					.where(eq(Tables.stacks.name, body.name))
			) {
				set.status = 400;
				return {
					message: "A stack with the same name already exists",
				};
			}

			const { composeFile, envFile, ...rest } = body;
			const [insStack, error] = await safeAwait(
				db
					.insert(Tables.stacks)
					.values({
						...rest,
						type: "file",
					})
					.returning(),
			);
			if (error || !insStack || insStack.length === 0) {
				set.status = 400;
				return {
					message: "Failed to create the stack",
					error: error?.message,
				};
			}
			const stack = insStack[0];

			// Save files
			// ---

			Bun.write(`${baseDir}/${stack.name}/docker-compose.yml`, composeFile);
			Bun.write(`${baseDir}/${stack.name}/.env`, envFile);

			const res = compose.pullAndUp(stack);
			if (res) {
				set.status = 400;
				return res;
			}

			sendNotification(
				undefined,
				"global:stack-created",
				"Stack created",
				`Stack ${stack.name} created from file`,
			);

			set.status = 201;
			return stack;
		},
		{
			body: t.Intersect([
				t.Omit(_createStack, [
					"name",
					"createdAt",
					"updatedAt",
					"branch",
					"cloneDepth",
					"fetchInterval",
					"revertOnFailure",
					"type",
				]),
				t.Object({
					name: t.String({
						pattern: "^[a-z0-9_-]{3,30}$",
					}),
					composeFile: t.String(),
					envFile: t.String(),
				}),
			]),
			response: {
				400: t.Object({
					message: t.String(),
					error: t.Optional(t.String()),
				}),
				201: t.Omit(_selectStack, [
					"branch",
					"cloneDepth",
					"fetchInterval",
					"revertOnFailure",
					"composePath",
				]),
			},
			details: {
				description: "Create a new stack from a file",
			},
		},
	)
	.get(
		"/",
		async ({ set }) => {
			const [stacks, error] = await safeAwait(
				db
					.select({
						name: Tables.stacks.name,
						type: Tables.stacks.type,
						url: Tables.stacks.url,
						branch: Tables.stacks.branch,
						composePath: Tables.stacks.composePath,
					})
					.from(Tables.stacks),
			);
			if (error) {
				set.status = 400;
				return {
					message: "Failed to fetch stacks",
					error: error.message,
				};
			}

			set.status = 200;
			if (!stacks || stacks.length === 0) return [];

			return await Promise.all(
				stacks.map(async (stack) => ({
					name: stack.name,
					type: stack.type,
					url: stack.url ?? undefined,
					branch: stack.branch ?? undefined,
					composePath: stack.composePath ?? undefined,

					status: (await compose.getStatus(stack)).status,
					commit: await git.currentCommit(stack),
				})),
			);
		},
		{
			response: {
				200: t.Array(
					t.Object({
						name: t.String(),
						type: t.Union([t.Literal("git"), t.Literal("file")]),
						url: t.Optional(t.String()),
						branch: t.Optional(t.String()),
						commit: t.Optional(t.String()),
						status: t.Union([
							t.Literal("ACTIVE"),
							t.Literal("INACTIVE"),
							t.Literal("DOWN"),
						]),
					}),
				),
				400: t.Object({
					message: t.String(),
					error: t.String(),
				}),
			},
			details: {
				description: "Fetch all stacks",
			},
		},
	)
	.get(
		"/:name",
		async ({ params, set }) => {
			const [stacks, error] = await safeAwait(
				db
					.select()
					.from(Tables.stacks)
					.where(eq(Tables.stacks.name, params.name)),
			);
			if (error || !stacks || stacks.length === 0) {
				set.status = 400;
				return {
					message: "Failed to fetch stacks",
					error: error?.message ?? "Unknown error",
				};
			}
			const stack = stacks[0];

			const files =
				stack.type === "file"
					? {
							composeFile: await Bun.file(
								`${baseDir}/${stack.name}/docker-compose.yml`,
							).text(),
							envFile: await Bun.file(`${baseDir}/${stack.name}/.env`).text(),
						}
					: {};

			set.status = 200;
			const status = await compose.getStatus(stack);
			return {
				...stack,
				...files,
				status: status.status,
				containers: status.containers,
				currentCommit:
					stack.type === "git" ? await git.currentCommit(stack) : undefined,
			};
		},
		{
			params: t.Object({
				name: t.String(),
			}),
			response: {
				200: t.Intersect([
					_selectStack,
					t.Object({
						composeFile: t.Optional(t.String()),
						envFile: t.Optional(t.String()),
						currentCommit: t.Optional(t.String()),
						status: t.Union([
							t.Literal("ACTIVE"),
							t.Literal("INACTIVE"),
							t.Literal("DOWN"),
						]),
						containers: containerType,
					}),
				]),
				400: t.Object({
					message: t.String(),
					error: t.String(),
				}),
			},
			details: {
				description: "Get all information about a stack",
			},
		},
	)
	.get(
		"/:name/status",
		async ({ params, set }) => {
			const [stacks, error] = await safeAwait(
				db
					.select()
					.from(Tables.stacks)
					.where(eq(Tables.stacks.name, params.name)),
			);
			if (error || !stacks) {
				set.status = 400;
				return {
					message: "Failed to fetch stacks",
					error: error?.message ?? "Unknown error",
				};
			}
			const stack = stacks[0];

			const status = await compose.getStatus(stack);

			set.status = 200;
			return {
				status: status.status,
				containers: status.containers
			};
		}, 
		{
			params: t.Object({
				name: t.String(),
			}),
			response: {
				200: t.Object({
					status: t.Union([
						t.Literal("ACTIVE"),
						t.Literal("INACTIVE"),
						t.Literal("DOWN"),
					]),
					containers: containerType,
				}),
				400: t.Object({
					message: t.String(),
					error: t.String(),
				}),
			},
			details: {
				description: "Get the status of a stack",
			},
		}
	)
	.patch(
		"/:name",
		async ({ params, body, set }) => {
			const { composeFile, envFile, ...rest } = body;
			const [stack, error] = await safeAwait(
				db
					.update(Tables.stacks)
					.set(rest)
					.where(eq(Tables.stacks.name, params.name))
					.returning(),
			);
			if (error || !stack || stack.length === 0) {
				set.status = 400;
				return {
					message: "Failed to update stack",
					error: error?.message,
				};
			}

			if (composeFile)
				Bun.write(`${baseDir}/${params.name}/docker-compose.yml`, composeFile);
			if (envFile) Bun.write(`${baseDir}/${params.name}/.env`, envFile);

			set.status = 200;
			return {
				message: "Stack updated successfully",
			};
		},
		{
			params: t.Object({
				name: t.String(),
			}),
			body: t.Intersect([
				t.Omit(_createStack, ["name", "type", "createdAt", "updatedAt"]),
				t.Object({
					composeFile: t.Optional(t.String()),
					envFile: t.Optional(t.String()),
				}),
			]),
			response: t.Object({
				message: t.String(),
				error: t.Optional(t.String()),
			}),
			details: {
				description:
					"Update a stack, this will work for both git and file type stacks, but only the fields that are relevant to the stack type will be updated. The stack will not be restarted automaticly.",
			},
		},
	)
	.delete(
		"/:name",
		async ({ params, set }) => {
			const [stack, error] = await safeAwait(
				db
					.delete(Tables.stacks)
					.where(eq(Tables.stacks.name, params.name))
					.returning(),
			);
			if (error || !stack || stack.length === 0) {
				set.status = 400;
				return {
					message: "Failed to delete stack",
					error: error?.message,
				};
			}

			// Stop stack
			const [_, downError] = await safeAwait(compose.down(stack[0], true));
			if (downError) {
				set.status = 400;
				return {
					message: "Failed to stop containers",
					error: downError.message,
				};
			}

			// Delete stack
			const [__, delStackError] = await safeAwait(git.deleteRepo(params.name)); // Handles both git and file type stacks
			if (delStackError) {
				set.status = 400;
				return {
					message: "Failed to delete stack",
					error: delStackError.message,
				};
			}

			sendNotification(
				stack[0],
				"global:stack-deleted",
				"Stack deleted",
				`Stack ${params.name} deleted\nType: ${stack[0].type}`,
			);

			set.status = 200;
			return {
				message: "Stack deleted successfully",
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
				description: "Delete a stack",
			},
		},
	)
	.get(
		"/:name/run-check",
		async ({ params, set }) => {
			const [stack, error] = await safeAwait(
				db
					.select()
					.from(Tables.stacks)
					.where(eq(Tables.stacks.name, params.name)),
			);
			if (error || !stack || stack.length === 0) {
				set.status = 500;
				return {
					message: "Failed to fetch stack",
					error: error?.message,
				};
			}

			if (stack[0].type !== "git") {
				set.status = 500;
				return {
					message: "Check only works on git type stacks",
				};
			}

			const [checkRes, checkError] = await safeAwait(
				handleUpdateCheck(stack[0]),
			);
			if (checkError || !checkRes) {
				if (checkError) console.error(checkError);
				set.status = 500;
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

			sendNotification(
				stack[0],
				"stack:updated",
				"Stack updated",
				`Updated from ${checkRes.from} to ${checkRes.to}`,
			);

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
				500: t.Object({
					message: t.String(),
					error: t.Optional(t.String()),
				}),
			},
			details: {
				description: "Run check for a git type stack",
			},
		},
	)
	// Control routes
	.get(
		"/:name/start",
		async ({ params, set }) => {
			const [stack, error] = await safeAwait(
				db
					.select()
					.from(Tables.stacks)
					.where(eq(Tables.stacks.name, params.name)),
			);
			if (error || !stack || stack.length === 0) {
				set.status = 500;
				return {
					message: "Failed to fetch the stack",
					error: error?.message ?? "Unknown error",
				};
			}

			const [upRes, upError] = await safeAwait(compose.up(stack[0]));
			if (upError || !upRes) {
				set.status = 500;
				return {
					message: "Failed to start docker containers",
					error: upError?.message ?? "Unknown error",
				};
			}

			set.status = upRes.exitCode === 0 ? 200 : 500;
			return {
				message:
					upRes.exitCode === 0
						? "Stack started successfully"
						: "Failed to start stack, check log.err",
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
						exitCode: t.Number(),
						out: t.String(),
						err: t.String(),
					}),
				}),
				500: t.Object({
					message: t.String(),
					error: t.Optional(t.String()),
				}),
			},
			details: {
				description: "Start a stack",
			},
		},
	)
	.get(
		"/:name/stop",
		async ({ params, set }) => {
			const [stack, error] = await safeAwait(
				db
					.select()
					.from(Tables.stacks)
					.where(eq(Tables.stacks.name, params.name)),
			);
			if (error || !stack || stack.length === 0) {
				set.status = 500;
				return {
					message: "Failed to fetch the stack",
					error: error?.message ?? "Unknown error",
				};
			}

			const [downRes, downError] = await safeAwait(compose.down(stack[0]));
			if (downError || !downRes) {
				set.status = 500;
				return {
					message: "Failed to stop docker containers",
					error: downError?.message ?? "Unknown error",
				};
			}

			set.status = downRes.exitCode === 0 ? 200 : 500;
			return {
				message:
					downRes.exitCode === 0
						? "Stack stopped successfully"
						: "Failed to stop stack, check log.err",
				log: downRes,
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
						exitCode: t.Number(),
						out: t.String(),
						err: t.String(),
					}),
				}),
				500: t.Object({
					message: t.String(),
					error: t.Optional(t.String()),
				}),
			},
			details: {
				description: "Stop a stack",
			},
		},
	)
	.get(
		"/:name/restart",
		async ({ params, set }) => {
			const [stack, error] = await safeAwait(
				db
					.select()
					.from(Tables.stacks)
					.where(eq(Tables.stacks.name, params.name)),
			);
			if (error || !stack || stack.length === 0) {
				set.status = 500;
				return {
					message: "Failed to fetch the stack",
					error: error?.message ?? "Unknown error",
				};
			}

			const [restartRes, downError] = await safeAwait(
				compose.restart(stack[0]),
			);
			if (downError || !restartRes) {
				set.status = 500;
				return {
					message: "Failed to stop docker containers",
					error: downError?.message ?? "Unknown error",
				};
			}

			set.status = restartRes.exitCode === 0 ? 200 : 500;
			return {
				message:
					restartRes.exitCode === 0
						? "Stack restarted successfully"
						: "Failed to restart stack, check log.err",
				log: restartRes,
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
						exitCode: t.Number(),
						out: t.String(),
						err: t.String(),
					}),
				}),
				500: t.Object({
					message: t.String(),
					error: t.Optional(t.String()),
				}),
			},
			details: {
				description: "Restart a stack",
			},
		},
	)
	.get(
		"/:name/update",
		async ({ params, set }) => {
			const [stack, error] = await safeAwait(
				db
					.select()
					.from(Tables.stacks)
					.where(eq(Tables.stacks.name, params.name)),
			);
			if (error || !stack || stack.length === 0) {
				set.status = 500;
				return {
					message: error ? "Failed to fetch the stack" : "Stack not found",
					error: error?.message,
				};
			}

			const failed = (message: string, error: Error | null) => {
				sendNotification(
					stack[0],
					"stack:containers-update-failed",
					"Failed to update containers",
					`Error: ${error?.message ?? "Something went wrong..."}`,
				);
				set.status = 500;
				return {
					message: message,
					error: error?.message,
				};
			};

			const [pullRes, pullError] = await safeAwait(compose.pull(stack[0]));
			if (pullError || !pullRes)
				return failed("Failed to pull images", pullError);

			const [upRes, upError] = await safeAwait(compose.up(stack[0]));
			if (upError || !upRes)
				return failed("Failed to start containers", upError);

			const success = pullRes.exitCode === 0 && upRes.exitCode === 0;

			if (success)
				sendNotification(
					stack[0],
					"stack:containers-updated",
					"Stack updated",
					"Containers updated",
				);
			else
				sendNotification(
					stack[0],
					"stack:containers-update-failed",
					"Failed to update containers",
					`Error: up status: ${upRes.exitCode}, pull status: ${pullRes.exitCode}`,
				);

			set.status = success ? 200 : 500;
			return {
				message: success
					? "Stack updated successfully"
					: "Failed to update stack",
				log: {
					pull: pullRes,
					up: upRes,
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
							exitCode: t.Number(),
							out: t.String(),
							err: t.String(),
						}),
						up: t.Object({
							exitCode: t.Number(),
							out: t.String(),
							err: t.String(),
						}),
					}),
				}),
				500: t.Object({
					message: t.String(),
					error: t.Optional(t.String()),
				}),
			},
			details: {
				description: "Update a stack",
			},
		},
	)
	.group("/:name/containers", (app) => app.use(containers));

export default stacks;
