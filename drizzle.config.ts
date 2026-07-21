import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config();
config({ path: ".env.local" });

const tursoDatabaseUrl = process.env.TURSO_DATABASE_URL;
const configuredMode = process.env.DATABASE_MODE?.trim().toLowerCase();
const useTurso = configuredMode === "turso" || (configuredMode !== "sqlite" && Boolean(tursoDatabaseUrl));

export default defineConfig(
  useTurso
    ? {
        dialect: "turso",
        schema: "./lib/db/schema.ts",
        out: "./drizzle",
        dbCredentials: {
          url: tursoDatabaseUrl as string,
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
