import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", quiet: true });

async function main() {
  const { syncGis } = await import("@/lib/integrations/sync-service");
  const result = await syncGis(undefined, "manual");
  console.log(JSON.stringify({
    status: result.status,
    students: result.students,
    studyGroups: result.studyGroups,
    employees: result.employees,
    warningCount: result.warnings.length,
  }, null, 2));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Sinkronisasi GIS gagal.";
  console.error(message.replace(
    /(password|token|private[_-]?key)\s*[:=]\s*[^\s,;]+/gi,
    "$1=[REDACTED]",
  ));
  process.exitCode = 1;
});
