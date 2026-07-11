import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config();
config({ path: ".env.local", override: true });

const tursoDatabaseUrl = process.env.TURSO_DATABASE_URL;

export default defineConfig(
  tursoDatabaseUrl
    ? {
        dialect: "turso",
        schema: "./lib/db/schema.ts",
        out: "./drizzle",
        dbCredentials: {
          url: tursoDatabaseUrl,
          authToken: process.env.TURSO_AUTH_TOKEN,
        },
      }
    : {
        dialect: "sqlite",
        schema: "./lib/db/schema.ts",
        out: "./drizzle",
        dbCredentials: {
          url: process.env.SQLITE_DB_PATH ?? "./data/dashboard.sqlite",
        },
      },
);
