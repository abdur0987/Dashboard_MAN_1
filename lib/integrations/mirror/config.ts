import { z } from "zod";

const mirrorConfigSchema = z.object({
  host: z.string().trim().min(1),
  port: z.coerce.number().int().min(1).max(65_535).default(3306),
  database: z.string().trim().min(1),
  user: z.string().trim().min(1),
  password: z.string().default(""),
  ssl: z.enum(["disabled", "preferred", "required"]).default("disabled"),
});

export type MirrorDatabaseConfig = z.infer<typeof mirrorConfigSchema>;

export function getMirrorDatabaseConfig(): MirrorDatabaseConfig {
  const result = mirrorConfigSchema.safeParse({
    host: process.env.MIRROR_DB_HOST,
    port: process.env.MIRROR_DB_PORT || 3306,
    database: process.env.MIRROR_DB_DATABASE,
    user: process.env.MIRROR_DB_USERNAME,
    password: process.env.MIRROR_DB_PASSWORD,
    ssl: process.env.MIRROR_DB_SSL || "disabled",
  });

  if (!result.success) {
    const missing = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Konfigurasi database mitra belum lengkap: ${missing}.`);
  }

  const isLoopback = ["127.0.0.1", "localhost", "::1"].includes(result.data.host);
  if (!result.data.password && (!isLoopback || process.env.NODE_ENV === "production")) {
    throw new Error("Password database mitra hanya boleh kosong untuk pengembangan lokal pada loopback.");
  }

  return result.data;
}
