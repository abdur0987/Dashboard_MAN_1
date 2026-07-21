import { createClient } from "@libsql/client";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { drizzle as drizzleBetterSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";

import * as schema from "@/lib/db/schema";

const databasePath =
  process.env.SQLITE_DB_PATH ?? path.join(process.cwd(), "data", "dashboard.sqlite");
const tursoDatabaseUrl = process.env.TURSO_DATABASE_URL;
const configuredMode = process.env.DATABASE_MODE?.trim().toLowerCase();
const useTurso = configuredMode === "turso" || (configuredMode !== "sqlite" && Boolean(tursoDatabaseUrl));

if (configuredMode === "turso" && !tursoDatabaseUrl) {
  throw new Error("DATABASE_MODE=turso memerlukan TURSO_DATABASE_URL.");
}

export const databaseDriver = useTurso ? "turso" : "sqlite";

export const libsql = useTurso
  ? createClient({
      url: tursoDatabaseUrl as string,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  : null;

export const sqlite = useTurso ? null : createLocalSqlite(databasePath);

export const db = libsql
  ? drizzleLibsql(libsql, { schema })
  : drizzleBetterSqlite(sqlite as Database.Database, { schema });

export async function executeSql(sql: string) {
  if (libsql) {
    await libsql.executeMultiple(sql);
    return;
  }

  sqlite?.exec(sql);
}

export { schema };

function createLocalSqlite(filePath: string) {
  mkdirSync(path.dirname(filePath), { recursive: true });

  const database = new Database(filePath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");

  return database;
}
