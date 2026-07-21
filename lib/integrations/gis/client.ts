import { z } from "zod";

import { fetchJsonWithRetry, joinUrl } from "@/lib/integrations/shared";

const nullableNumber = z.preprocess(
  (value) => value === "" || value == null ? null : Number(value),
  z.number().int().nonnegative().nullable(),
);

const gisMadrasahSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  statistic_num: z.string(),
  npsn: z.string(),
  name: z.string(),
  type: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  akreditasi: z.string().nullable().optional(),
  academic_year: z.string().nullable().optional(),
  siswa: nullableNumber,
  student_male: nullableNumber,
  student_female: nullableNumber,
  rombel_count: nullableNumber,
  personnel_teacher: nullableNumber,
  personnel_education_staff: nullableNumber,
  class_total: nullableNumber,
  class_good: nullableNumber,
  class_lightly_damaged: nullableNumber,
  class_moderately_damaged: nullableNumber,
  class_heavily_damaged: nullableNumber,
  library_total: nullableNumber,
  computer_lab_total: nullableNumber,
  lat: z.string().nullable().optional(),
  lng: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export async function fetchGisMadrasahSnapshot() {
  const baseUrl = process.env.GIS_MADRASAH_API_URL?.trim()
    || "https://madrasah.kemenag.go.id/api-gis/api";
  const madrasahId = process.env.GIS_MADRASAH_ID?.trim() || "14343";
  const payload = await fetchJsonWithRetry(
    joinUrl(baseUrl, `madrasah/${encodeURIComponent(madrasahId)}`),
    { headers: { Accept: "application/json" } },
    { timeoutMs: 15_000, retries: 1 },
  );
  return normalizeGisMadrasahSnapshot(payload);
}

export function normalizeGisMadrasahSnapshot(payload: unknown) {
  const value = gisMadrasahSchema.parse(payload);
  validateIdentity(value.statistic_num, value.npsn);

  const warnings: string[] = [];
  const genderTotal = (value.student_male ?? 0) + (value.student_female ?? 0);
  const genderComplete = value.siswa != null
    && value.student_male != null
    && value.student_female != null
    && genderTotal === value.siswa;
  if (!genderComplete) {
    warnings.push("Agregat gender GIS tidak sama dengan total siswa dan tidak digunakan.");
  }

  return {
    institution: {
      id: value.id,
      nsm: value.statistic_num,
      npsn: value.npsn,
      name: value.name,
      type: value.type ?? null,
      status: value.status ?? null,
      accreditation: value.akreditasi ?? null,
      latitude: numericCoordinate(value.lat),
      longitude: numericCoordinate(value.lng),
    },
    academicYear: value.academic_year ?? null,
    students: {
      total: value.siswa,
      male: genderComplete ? value.student_male : null,
      female: genderComplete ? value.student_female : null,
      studyGroups: value.rombel_count,
    },
    employees: {
      teachers: value.personnel_teacher,
      educationStaff: value.personnel_education_staff,
      total: sumNullable(value.personnel_teacher, value.personnel_education_staff),
    },
    facilities: {
      classrooms: value.class_total,
      classroomsGood: value.class_good,
      classroomsLightlyDamaged: value.class_lightly_damaged,
      classroomsModeratelyDamaged: value.class_moderately_damaged,
      classroomsHeavilyDamaged: value.class_heavily_damaged,
      libraries: value.library_total,
      computerLabs: value.computer_lab_total,
    },
    sourceUpdatedAt: parseJakartaTimestamp(value.updated_at),
    warnings,
  };
}

function validateIdentity(nsm: string, npsn: string) {
  const expectedNsm = process.env.MIRROR_DB_NSM || process.env.EMIS_NSM || "131118010001";
  const expectedNpsn = process.env.MIRROR_DB_NPSN || process.env.SIMPEG_NPSN || "10816233";
  if (nsm !== expectedNsm || npsn !== expectedNpsn) {
    throw new Error("Identitas pada GIS Madrasah tidak cocok dengan MAN 1 Lampung Selatan.");
  }
}

function sumNullable(left: number | null, right: number | null) {
  return left == null || right == null ? null : left + right;
}

function numericCoordinate(value?: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseJakartaTimestamp(value?: string | null) {
  if (!value) return null;
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const withZone = /(?:Z|[+-]\d{2}:\d{2})$/.test(normalized)
    ? normalized
    : `${normalized}+07:00`;
  const date = new Date(withZone);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
