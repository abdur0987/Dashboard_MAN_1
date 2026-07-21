import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", quiet: true });

async function main() {
  const { closeMirrorPool, inspectMirrorSchema, verifyMirrorReadOnlyAccess } = await import(
    "@/lib/integrations/mirror/client"
  );

  try {
    const identity = await verifyMirrorReadOnlyAccess();
    const columns = await inspectMirrorSchema();
    const tables = Map.groupBy(columns, (column) => column.tableName);

    console.log(`Koneksi baca berhasil ke ${identity?.databaseName ?? "database mitra"}.`);
    console.log(`Akun server: ${identity?.accountName ?? "tidak diketahui"}.`);
    console.log(`Ditemukan ${tables.size} tabel/view dan ${columns.length} kolom.`);

    for (const [tableName, tableColumns] of tables) {
      console.log(`\n${tableName}`);
      console.log(tableColumns.map((column) => `  - ${column.columnName} (${column.dataType})`).join("\n"));
    }
  } finally {
    await closeMirrorPool();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Koneksi database mitra gagal.";
  console.error(message.replace(/(password|token|private[_-]?key)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]"));
  process.exitCode = 1;
});
