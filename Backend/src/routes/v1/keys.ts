import { db } from "@/db/db";
import { Tables } from "@/db/schema";
import { randomString, safeAwait } from "@/utils/utils";
import { eq } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import Elysia, { t } from "elysia";

const _createKey = createInsertSchema(Tables.keys);
const _selectKey = createSelectSchema(Tables.keys);

const keysRoute = new Elysia({
	prefix: "keys",
	tags: ["keys"],
})
	.post(
		"/",
		async ({ body, set }) => {
			const [insKey, error] = await safeAwait(
				db
					.insert(Tables.keys)
					.values({
						key: body.key ?? randomString(32),
						description: body.description,
					})
					.returning(),
			);
			if (error || !insKey || insKey.length === 0) {
				set.status = 400;
				return {
					message: "Failed to create key",
					error: error?.message ?? "Unknown error",
				};
			}

			set.status = 201;
			return insKey[0];
		},
		{
			body: t.Object({
				key: t.Optional(t.String()),
				description: t.Optional(t.String()),
			}),
			response: {
				201: _selectKey,
				400: t.Object({
					message: t.String(),
					error: t.Optional(t.String()),
				}),
			},
			details: {
				description: "Create a new key",
			},
		},
	)
	.get(
		"/",
		async ({ set }) => {
			const [keys, error] = await safeAwait(db.select().from(Tables.keys));
			if (error || !keys) {
				set.status = 400;
				return {
					message: "Failed to fetch keys",
					error: error?.message ?? "Unknown error",
				};
			}
			return keys;
		},
		{
			response: {
				200: t.Array(_selectKey),
				400: t.Object({
					message: t.String(),
					error: t.String(),
				}),
			},
			details: {
				description: "Fetch all keys",
			},
		},
	)
	.delete(
		"/:key",
		async ({ params, set }) => {
			const [_, error] = await safeAwait(
				db.delete(Tables.keys).where(eq(Tables.keys.key, params.key)),
			);
			if (error) {
				set.status = 400;
				return {
					message: "Failed to delete key",
					error: error?.message,
				};
			}
			return {
				message: "Key deleted successfully",
			};
		},
		{
			params: t.Object({
				key: t.String(),
			}),
			response: {
				200: t.Object({
					message: t.String(),
				}),
				400: t.Object({
					message: t.String(),
					error: t.String(),
				}),
			},
			details: {
				description: "Delete a key",
			},
		},
	);

export default keysRoute;
