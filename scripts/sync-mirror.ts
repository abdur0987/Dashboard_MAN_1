import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", quiet: true });

async function main() {
  const [{ closeMirrorPool }, { syncMirror }] = await Promise.all([
    import("@/lib/integrations/mirror/client"),
    import("@/lib/integrations/sync-service"),
  ]);
  try {
    const result = await syncMirror(undefined, "manual");
    console.log(JSON.stringify({
      status: result.status,
      students: result.students,
      studyGroups: result.studyGroups,
      employees: result.employees,
      warningCount: result.warnings.length,
    }, null, 2));
  } finally {
    await closeMirrorPool();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Sinkronisasi database mitra gagal.";
  console.error(message.replace(
    /(password|token|private[_-]?key)\s*[:=]\s*[^\s,;]+/gi,
    "$1=[REDACTED]",
  ));
  process.exitCode = 1;
});
