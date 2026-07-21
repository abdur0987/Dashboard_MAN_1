import { z } from "zod";

import { fetchJsonWithRetry } from "@/lib/integrations/shared";

const nullableCount = z.preprocess(
  (value) => value === "" || value == null ? null : Number(value),
  z.number().int().nonnegative().nullable(),
);

const websiteSummarySchema = z.object({
  success: z.boolean().optional(),
  data: z.object({
    school: z.object({
      name: z.string(),
      nsm: z.string(),
      npsn: z.string(),
      status: z.string().nullable().optional(),
      accreditation: z.string().nullable().optional(),
    }),
    period: z.object({
      school_year: z.string(),
      semester: z.string().nullable().optional(),
      label: z.string().nullable().optional(),
    }).optional(),
    students: z.object({
      total: nullableCount,
      male: nullableCount.optional(),
      female: nullableCount.optional(),
      study_groups: nullableCount.optional(),
      by_grade: z.object({
        X: nullableCount.optional(),
        XI: nullableCount.optional(),
        XII: nullableCount.optional(),
      }).optional(),
    }).optional(),
    employees: z.object({
      total: nullableCount,
      teachers: nullableCount.optional(),
      education_staff: nullableCount.optional(),
      pns: nullableCount.optional(),
      pppk: nullableCount.optional(),
      non_asn: nullableCount.optional(),
    }).optional(),
    updated_at: z.string().nullable().optional(),
  }),
});

export type WebsiteSummarySnapshot = ReturnType<typeof normalizeWebsiteSummary>;

export async function fetchWebsiteSummary() {
  const endpoint = process.env.MAN1_WEBSITE_API_URL?.trim();
  if (!websiteSyncEnabled() || !endpoint) {
    throw new Error("API website MAN 1 belum diaktifkan pada konfigurasi server.");
  }
  const apiKey = process.env.MAN1_WEBSITE_API_KEY?.trim();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["X-Dashboard-Key"] = apiKey;
  const payload = await fetchJsonWithRetry(
    endpoint,
    { headers },
    { timeoutMs: 15_000, retries: 1 },
  );
  return normalizeWebsiteSummary(payload);
}

export function normalizeWebsiteSummary(payload: unknown) {
  const parsed = websiteSummarySchema.parse(payload);
  if (parsed.success === false) {
    throw new Error("API website MAN 1 melaporkan respons tidak berhasil.");
  }
  const value = parsed.data;
  validateIdentity(value.school.nsm, value.school.npsn);
  const warnings: string[] = [];
  const students = value.students;
  const employee = value.employees;
  const genderTotal = (students?.male ?? 0) + (students?.female ?? 0);
  const genderComplete = students?.total != null
    && students.male != null
    && students.female != null
    && genderTotal === students.total;
  if (students && !genderComplete) {
    warnings.push("Agregat gender website belum lengkap atau tidak sama dengan total siswa.");
  }
  const employeeSplit = (employee?.teachers ?? 0) + (employee?.education_staff ?? 0);
  if (
    employee?.total != null
    && employee.teachers != null
    && employee.education_staff != null
    && employeeSplit !== employee.total
  ) {
    warnings.push("Jumlah guru dan tenaga kependidikan website tidak sama dengan total GTK.");
  }
  const schoolYear = value.period?.school_year ?? "Belum dipetakan";
  const semester = value.period?.semester ?? "Belum dipetakan";

  return {
    institution: {
      name: value.school.name,
      nsm: value.school.nsm,
      npsn: value.school.npsn,
      status: value.school.status ?? null,
      accreditation: value.school.accreditation ?? null,
    },
    period: value.period?.label || [schoolYear, value.period?.semester].filter(Boolean).join(" "),
    schoolYear,
    semester,
    students: students ? {
      total: students.total,
      grade10: students.by_grade?.X ?? null,
      grade11: students.by_grade?.XI ?? null,
      grade12: students.by_grade?.XII ?? null,
      male: genderComplete ? students.male ?? null : null,
      female: genderComplete ? students.female ?? null : null,
      studyGroups: students.study_groups ?? null,
    } : null,
    employees: employee ? {
      total: employee.total,
      teachers: employee.teachers ?? null,
      educationStaff: employee.education_staff ?? null,
      pns: employee.pns ?? null,
      pppk: employee.pppk ?? null,
      nonAsn: employee.non_asn ?? null,
    } : null,
    sourceUpdatedAt: parseTimestamp(value.updated_at),
    warnings,
  };
}

export function websiteSyncEnabled() {
  return process.env.MAN1_WEBSITE_SYNC_ENABLED?.trim().toLowerCase() === "true";
}

function validateIdentity(nsm: string, npsn: string) {
  const expectedNsm = process.env.MIRROR_DB_NSM || process.env.EMIS_NSM || "131118010001";
  const expectedNpsn = process.env.MIRROR_DB_NPSN || process.env.SIMPEG_NPSN || "10816233";
  if (nsm !== expectedNsm || npsn !== expectedNpsn) {
    throw new Error("Identitas pada API website tidak cocok dengan MAN 1 Lampung Selatan.");
  }
}

function parseTimestamp(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
