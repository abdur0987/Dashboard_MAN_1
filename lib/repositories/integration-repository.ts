import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { ensureDatabaseReady } from "@/lib/db/migrate";
import {
  auditLogs,
  employeeAggregateSnapshots,
  institutionSnapshots,
  integrationSources,
  studentAggregateSnapshots,
  syncRuns,
} from "@/lib/db/schema";
import type { IntegrationSourceCode } from "@/lib/integrations/types";

const VERIFIED_AT = "2026-07-15T00:00:00+07:00";
let foundationPromise: Promise<void> | null = null;

type SourceSnapshotBundle = {
  institution: typeof institutionSnapshots.$inferSelect | null;
  students: typeof studentAggregateSnapshots.$inferSelect | null;
  employees: typeof employeeAggregateSnapshots.$inferSelect | null;
};

export async function ensureIntegrationFoundation() {
  await ensureDatabaseReady();
  if (!foundationPromise) foundationPromise = seedIntegrationFoundation();
  await foundationPromise;
}

export async function getIntegrationReadState() {
  await ensureIntegrationFoundation();
  const [sources, institutions, studentSnapshots, employeeSnapshots, allRuns] = await Promise.all([
    db.select().from(integrationSources),
    db.select().from(institutionSnapshots).orderBy(desc(institutionSnapshots.capturedAt)),
    db.select().from(studentAggregateSnapshots).orderBy(desc(studentAggregateSnapshots.capturedAt)),
    db.select().from(employeeAggregateSnapshots).orderBy(desc(employeeAggregateSnapshots.capturedAt)),
    db.select().from(syncRuns).orderBy(desc(syncRuns.startedAt)),
  ]);
  const recentRuns = allRuns.slice(0, 20);
  const runSourceById = new Map(
    allRuns.map((run) => [run.id, asSourceCode(run.sourceCode)]),
  );
  const sourceSnapshots = emptySourceSnapshots();
  populateLatestSnapshot(sourceSnapshots, institutions, runSourceById, "institution");
  populateLatestSnapshot(sourceSnapshots, studentSnapshots, runSourceById, "students");
  populateLatestSnapshot(sourceSnapshots, employeeSnapshots, runSourceById, "employees");

  const institutionSelection = preferredSnapshot(sourceSnapshots, "institution", [
    "gis",
    "mirror",
    "website",
    "emis",
  ]);
  const studentSelection = preferredSnapshot(sourceSnapshots, "students", [
    "gis",
    "mirror",
    "website",
    "emis",
  ]);
  const employeeSelection = preferredSnapshot(sourceSnapshots, "employees", [
    "mirror",
    "gis",
    "website",
    "simpeg",
  ]);

  return {
    sources,
    institution: institutionSelection.snapshot,
    students: studentSelection.snapshot,
    employees: employeeSelection.snapshot,
    recentRuns,
    sourceSnapshots,
    institutionSourceCode: institutionSelection.sourceCode,
    studentSourceCode: studentSelection.sourceCode,
    employeeSourceCode: employeeSelection.sourceCode,
  };
}

export async function createSyncRun(
  sourceCode: IntegrationSourceCode,
  createdBy?: string,
  triggerType: "manual" | "scheduled" = "manual",
) {
  await ensureIntegrationFoundation();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await db.insert(syncRuns).values({
    id,
    sourceCode,
    triggerType,
    startedAt: now,
    status: "running",
    recordsReceived: 0,
    recordsMatched: 0,
    recordsRejected: 0,
    pageCount: 0,
    createdBy: createdBy ?? null,
    createdAt: now,
  });
  await db.update(integrationSources).set({ lastAttemptAt: now, lastStatus: "syncing", updatedAt: now }).where(eq(integrationSources.code, sourceCode));
  return { id, startedAt: now };
}

export async function finishSyncRun(input: {
  id: string;
  sourceCode: IntegrationSourceCode;
  startedAt: string;
  status: "success" | "partial" | "failed";
  recordsReceived?: number;
  recordsMatched?: number;
  recordsRejected?: number;
  pageCount?: number;
  errorCode?: string;
  errorSummary?: string;
}) {
  const finishedAt = new Date().toISOString();
  await db.update(syncRuns).set({
    finishedAt,
    status: input.status,
    recordsReceived: input.recordsReceived ?? 0,
    recordsMatched: input.recordsMatched ?? 0,
    recordsRejected: input.recordsRejected ?? 0,
    pageCount: input.pageCount ?? 0,
    durationMs: Date.now() - new Date(input.startedAt).getTime(),
    errorCode: input.errorCode ?? null,
    errorSummary: sanitizeSummary(input.errorSummary),
  }).where(eq(syncRuns.id, input.id));

  await db.update(integrationSources).set({
    lastAttemptAt: finishedAt,
    lastSuccessAt: input.status === "success" ? finishedAt : undefined,
    lastStatus: input.status,
    updatedAt: finishedAt,
  }).where(eq(integrationSources.code, input.sourceCode));
}

export async function insertInstitutionSnapshot(value: typeof institutionSnapshots.$inferInsert) {
  await db.insert(institutionSnapshots).values(value);
}

export async function insertStudentSnapshot(value: typeof studentAggregateSnapshots.$inferInsert) {
  await db.insert(studentAggregateSnapshots).values(value);
}

export async function insertEmployeeSnapshot(value: typeof employeeAggregateSnapshots.$inferInsert) {
  await db.insert(employeeAggregateSnapshots).values(value);
}

export async function writeAuditLog(input: {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  afterSummary?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  await ensureDatabaseReady();
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    beforeSummary: null,
    afterSummary: sanitizeSummary(input.afterSummary),
    ipAddress: input.ipAddress?.slice(0, 120) ?? null,
    userAgent: input.userAgent?.slice(0, 300) ?? null,
    createdAt: new Date().toISOString(),
  });
}

async function seedIntegrationFoundation() {
  const now = new Date().toISOString();
  await db.insert(integrationSources).values([
    {
      code: "emis",
      name: "EMIS",
      baseUrlMasked: maskBaseUrl(process.env.EMIS_PUBLIC_URL_API),
      enabled: true,
      syncFrequency: "4 kali sehari",
      freshnessThresholdMinutes: 360,
      lastSuccessAt: VERIFIED_AT,
      lastAttemptAt: VERIFIED_AT,
      lastStatus: "success",
      createdAt: now,
      updatedAt: now,
    },
    {
      code: "simpeg",
      name: "SIMPEG",
      baseUrlMasked: maskBaseUrl(process.env.SIMPEG_PUBLIC_URL_API),
      enabled: true,
      syncFrequency: "1 kali sehari",
      freshnessThresholdMinutes: 1_440,
      lastSuccessAt: null,
      lastAttemptAt: VERIFIED_AT,
      lastStatus: "partial",
      createdAt: now,
      updatedAt: now,
    },
    {
      code: "mirror",
      name: "Database lokal",
      baseUrlMasked: process.env.MIRROR_DB_HOST ? "mysql://local/aggregates" : "not-configured",
      enabled: Boolean(process.env.MIRROR_DB_HOST),
      syncFrequency: "Manual setelah dump diperbarui",
      freshnessThresholdMinutes: 10_080,
      lastSuccessAt: null,
      lastAttemptAt: null,
      lastStatus: "not_configured",
      createdAt: now,
      updatedAt: now,
    },
    {
      code: "gis",
      name: "GIS Madrasah Kemenag",
      baseUrlMasked: maskBaseUrl(
        process.env.GIS_MADRASAH_API_URL
          || "https://madrasah.kemenag.go.id/api-gis/api",
      ),
      enabled: true,
      syncFrequency: "Otomatis setiap 24 jam",
      freshnessThresholdMinutes: 1_800,
      lastSuccessAt: null,
      lastAttemptAt: null,
      lastStatus: "not_configured",
      createdAt: now,
      updatedAt: now,
    },
    {
      code: "website",
      name: "Website MAN 1",
      baseUrlMasked: maskBaseUrl(process.env.MAN1_WEBSITE_API_URL),
      enabled: websiteSyncEnabled(),
      syncFrequency: "Otomatis setiap 6 jam",
      freshnessThresholdMinutes: 720,
      lastSuccessAt: null,
      lastAttemptAt: null,
      lastStatus: "not_configured",
      createdAt: now,
      updatedAt: now,
    },
  ]).onConflictDoNothing();
  await Promise.all([
    db.update(integrationSources).set({
      name: "Database lokal",
      baseUrlMasked: process.env.MIRROR_DB_HOST ? "mysql://local/aggregates" : "not-configured",
      enabled: Boolean(process.env.MIRROR_DB_HOST),
      syncFrequency: "Manual setelah dump diperbarui",
      freshnessThresholdMinutes: 10_080,
      updatedAt: now,
    }).where(eq(integrationSources.code, "mirror")),
    db.update(integrationSources).set({
      name: "GIS Madrasah Kemenag",
      baseUrlMasked: maskBaseUrl(
        process.env.GIS_MADRASAH_API_URL
          || "https://madrasah.kemenag.go.id/api-gis/api",
      ),
      enabled: true,
      syncFrequency: "Otomatis setiap 24 jam",
      freshnessThresholdMinutes: 1_800,
      updatedAt: now,
    }).where(eq(integrationSources.code, "gis")),
    db.update(integrationSources).set({
      name: "Website MAN 1",
      baseUrlMasked: maskBaseUrl(process.env.MAN1_WEBSITE_API_URL),
      enabled: websiteSyncEnabled(),
      syncFrequency: "Otomatis setiap 6 jam",
      freshnessThresholdMinutes: 720,
      updatedAt: now,
    }).where(eq(integrationSources.code, "website")),
  ]);

  const existingStudents = await db.select().from(studentAggregateSnapshots);
  if (!existingStudents.length) await seedVerifiedEmisSnapshot();

  const existingEmployees = await db.select().from(employeeAggregateSnapshots);
  if (!existingEmployees.length) await seedVerifiedSimpegSnapshot();
}

async function seedVerifiedEmisSnapshot() {
  const runId = crypto.randomUUID();
  await db.insert(syncRuns).values({
    id: runId,
    sourceCode: "emis",
    triggerType: "verified-reference",
    startedAt: VERIFIED_AT,
    finishedAt: VERIFIED_AT,
    status: "success",
    recordsReceived: 301,
    recordsMatched: 301,
    recordsRejected: 0,
    pageCount: 1,
    durationMs: 0,
    createdBy: null,
    createdAt: VERIFIED_AT,
  });
  await db.insert(institutionSnapshots).values({
    id: crypto.randomUUID(),
    syncRunId: runId,
    period: "2025/2026 Genap",
    name: "MAN 1 Lampung Selatan",
    nsm: "131118010001",
    npsn: "10816233",
    status: "Negeri",
    accreditation: "B",
    registeredStatus: "Terdaftar",
    sourceUpdatedAt: null,
    capturedAt: VERIFIED_AT,
  });
  await db.insert(studentAggregateSnapshots).values({
    id: crypto.randomUUID(),
    syncRunId: runId,
    period: "2025/2026 Genap",
    schoolYear: "2025/2026",
    semester: "Genap",
    studentsTotal: 301,
    grade10: 92,
    grade11: 121,
    grade12: 88,
    male: null,
    female: null,
    studyGroupsTotal: 13,
    studyGroups10: null,
    studyGroups11: null,
    studyGroups12: null,
    coverage: 70,
    qualityScore: 80,
    warningsJson: JSON.stringify([
      "Gender belum tersedia karena endpoint detail rombel menolak partner token.",
      "Rombel per tingkat belum tersedia; hanya total rombel yang tervalidasi.",
    ]),
    capturedAt: VERIFIED_AT,
  });
}

async function seedVerifiedSimpegSnapshot() {
  const runId = crypto.randomUUID();
  await db.insert(syncRuns).values({
    id: runId,
    sourceCode: "simpeg",
    triggerType: "verified-reference",
    startedAt: VERIFIED_AT,
    finishedAt: VERIFIED_AT,
    status: "partial",
    recordsReceived: 500,
    recordsMatched: 3,
    recordsRejected: 497,
    pageCount: 1,
    durationMs: 0,
    errorCode: "PAGINATION_UNAVAILABLE",
    errorSummary: "Endpoint mengembalikan halaman yang sama untuk parameter pagination yang diuji.",
    createdBy: null,
    createdAt: VERIFIED_AT,
  });
  await db.insert(employeeAggregateSnapshots).values({
    id: crypto.randomUUID(),
    syncRunId: runId,
    period: "Snapshot 500 record pertama • 15 Juli 2026",
    employeesTotal: null,
    teachersTotal: null,
    staffTotal: null,
    pnsTotal: 3,
    pppkTotal: 0,
    nonAsnTotal: null,
    educationS3: 0,
    educationS2: 1,
    educationS1d4: 2,
    educationDiploma: 0,
    educationSecondary: 0,
    educationUnknown: 0,
    certifiedTotal: null,
    uncertifiedTotal: null,
    certificationUnknown: 3,
    upstreamTotal: 8_384,
    recordsReceived: 500,
    filteredTotal: 3,
    pageCount: 1,
    coverage: 5.96,
    qualityScore: 35,
    warningsJson: JSON.stringify([
      "Tiga profil ditemukan pada snapshot 500 record pertama; angka ini bukan total GTK.",
      "Pagination penuh dan filter upstream per NPSN/NSM belum tersedia.",
    ]),
    capturedAt: VERIFIED_AT,
  });
}

function maskBaseUrl(value?: string) {
  if (!value) return "not-configured";
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}/…`;
  } catch {
    return "invalid-url";
  }
}

function sanitizeSummary(value?: string) {
  if (!value) return null;
  return value
    .replace(/bearer\s+[a-z0-9._-]+/gi, "Bearer [REDACTED]")
    .replace(/(password|private[_-]?key|token)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]")
    .slice(0, 1_000);
}

function emptySourceSnapshots(): Record<IntegrationSourceCode, SourceSnapshotBundle> {
  const empty = () => ({ institution: null, students: null, employees: null });
  return {
    emis: empty(),
    simpeg: empty(),
    mirror: empty(),
    gis: empty(),
    website: empty(),
  };
}

function populateLatestSnapshot<T extends { syncRunId: string | null }>(
  target: Record<IntegrationSourceCode, SourceSnapshotBundle>,
  rows: T[],
  runSourceById: Map<string, IntegrationSourceCode | null>,
  key: keyof SourceSnapshotBundle,
) {
  for (const row of rows) {
    if (!row.syncRunId) continue;
    const sourceCode = runSourceById.get(row.syncRunId);
    if (!sourceCode || target[sourceCode][key]) continue;
    target[sourceCode][key] = row as never;
  }
}

function preferredSnapshot<K extends keyof SourceSnapshotBundle>(
  sourceSnapshots: Record<IntegrationSourceCode, SourceSnapshotBundle>,
  key: K,
  priority: IntegrationSourceCode[],
): { sourceCode: IntegrationSourceCode | null; snapshot: SourceSnapshotBundle[K] } {
  for (const sourceCode of priority) {
    const snapshot = sourceSnapshots[sourceCode][key];
    if (snapshot) return { sourceCode, snapshot };
  }
  return { sourceCode: null, snapshot: null };
}

function asSourceCode(value: string): IntegrationSourceCode | null {
  return ["emis", "simpeg", "mirror", "gis", "website"].includes(value)
    ? value as IntegrationSourceCode
    : null;
}

function websiteSyncEnabled() {
  return process.env.MAN1_WEBSITE_SYNC_ENABLED?.trim().toLowerCase() === "true"
    && Boolean(process.env.MAN1_WEBSITE_API_URL?.trim());
}
