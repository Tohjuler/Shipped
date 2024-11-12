/**
 * @lastModified 2024-10-10
 * @see https://elysiajs.com/recipe/drizzle.html#utility
 */

import { Kind, type TObject } from "@sinclair/typebox";
import {
	type BuildInsertSchema,
	type BuildSelectSchema,
	createInsertSchema,
	createSelectSchema,
} from "drizzle-typebox";

import type { Table } from "drizzle-orm";

type Spread<
	T extends TObject | Table,
	Mode extends "select" | "insert" | undefined,
> = T extends TObject<infer Fields>
	? {
			[K in keyof Fields]: Fields[K];
		}
	: T extends Table
		? Mode extends "select"
			? // biome-ignore lint/complexity/noBannedTypes: Utility created by elysiajs, just use as-is
				BuildSelectSchema<T, {}>
			: Mode extends "insert"
				? // biome-ignore lint/complexity/noBannedTypes: Utility created by elysiajs, just use as-is
					BuildInsertSchema<T, {}>
				: // biome-ignore lint/complexity/noBannedTypes: Utility created by elysiajs, just use as-is
					{}
		: // biome-ignore lint/complexity/noBannedTypes: Utility created by elysiajs, just use as-is
			{};

/**
 * Spread a Drizzle schema into a plain object
 */
export const spread = <
	T extends TObject | Table,
	Mode extends "select" | "insert" | undefined,
>(
	schema: T,
	mode?: Mode,
): Spread<T, Mode> => {
	const newSchema: Record<string, unknown> = {};
	// biome-ignore lint/suspicious/noImplicitAnyLet: Utility created by elysiajs, just use as-is
	let table;

	switch (mode) {
		case "insert":
		case "select":
			if (Kind in schema) {
				table = schema;
				break;
			}

			table =
				mode === "insert"
					? createInsertSchema(schema)
					: createSelectSchema(schema);

			break;

		default:
			if (!(Kind in schema)) throw new Error("Expect a schema");
			table = schema;
	}

	for (const key of Object.keys(table.properties))
		newSchema[key] = table.properties[key];

	// biome-ignore lint/suspicious/noExplicitAny: Utility created by elysiajs, just use as-is
	return newSchema as any;
};

/**
 * Spread a Drizzle Table into a plain object
 *
 * If `mode` is 'insert', the schema will be refined for insert
 * If `mode` is 'select', the schema will be refined for select
 * If `mode` is undefined, the schema will be spread as is, models will need to be refined manually
 */
export const spreads = <
	T extends Record<string, TObject | Table>,
	Mode extends "select" | "insert" | undefined,
>(
	models: T,
	mode?: Mode,
): {
	[K in keyof T]: Spread<T[K], Mode>;
} => {
	const newSchema: Record<string, unknown> = {};
	const keys = Object.keys(models);

	for (const key of keys) newSchema[key] = spread(models[key], mode);

	// biome-ignore lint/suspicious/noExplicitAny: Utility created by elysiajs, just use as-is
	return newSchema as any;
};
