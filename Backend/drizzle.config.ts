import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.DB_FILE_NAME ?? process.env.NODE_ENV === "test" ? "./database/db.test.sqlite" : "./database/db.sqlite",
  },
});