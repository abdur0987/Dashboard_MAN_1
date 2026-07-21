export type EmisNormalizedSnapshot = {
  institution: {
    name: string;
    nsm: string;
    npsn: string;
    status?: string;
    accreditation?: string;
  };
  students: {
    total?: number;
    grade10?: number;
    grade11?: number;
    grade12?: number;
    male?: number;
    female?: number;
  };
  studyGroups: { total?: number; grade10?: number; grade11?: number; grade12?: number };
  period: string;
  schoolYear: string;
  semester: string;
  coverage: number;
  warnings: string[];
};

export function normalizeEmisPayload(identityPayload: unknown, summaryPayload?: unknown): EmisNormalizedSnapshot {
  const identity = unwrap(identityPayload);
  const expectedNsm = process.env.EMIS_NSM ?? "131118010001";
  const expectedNpsn = "10816233";
  const nsm = textAt(identity, process.env.EMIS_FIELD_NSM || "statistic_num") || expectedNsm;
  const npsn = textAt(identity, process.env.EMIS_FIELD_NPSN || "npsn") || expectedNpsn;
  if (nsm !== expectedNsm) throw new Error("NSM pada respons EMIS tidak cocok dengan konfigurasi.");
  if (npsn && npsn !== expectedNpsn) throw new Error("NPSN pada respons EMIS tidak cocok dengan MAN 1 Lampung Selatan.");

  const warnings: string[] = [];
  const students = {
    total: configuredNumber(summaryPayload, "EMIS_FIELD_STUDENTS_TOTAL"),
    grade10: configuredNumber(summaryPayload, "EMIS_FIELD_GRADE_10"),
    grade11: configuredNumber(summaryPayload, "EMIS_FIELD_GRADE_11"),
    grade12: configuredNumber(summaryPayload, "EMIS_FIELD_GRADE_12"),
    male: configuredNumber(summaryPayload, "EMIS_FIELD_MALE"),
    female: configuredNumber(summaryPayload, "EMIS_FIELD_FEMALE"),
  };
  const studyGroups = { total: configuredNumber(summaryPayload, "EMIS_FIELD_STUDY_GROUPS_TOTAL") };
  validateNonNegative([...Object.values(students), studyGroups.total]);
  if (students.total != null && sumDefined(students.grade10, students.grade11, students.grade12) > students.total) warnings.push("Total per tingkat melebihi total siswa.");
  if (students.total != null && sumDefined(students.male, students.female) > students.total) warnings.push("Total gender melebihi total siswa.");
  if (students.male == null || students.female == null) warnings.push("Data gender belum tersedia dari endpoint yang diizinkan.");

  const available = [...Object.values(students), studyGroups.total].filter((value) => value != null).length;
  return {
    institution: {
      name: textAt(identity, process.env.EMIS_FIELD_INSTITUTION_NAME || "name") || "MAN 1 Lampung Selatan",
      nsm,
      npsn,
      status: textAt(identity, process.env.EMIS_FIELD_STATUS || "status"),
      accreditation: textAt(identity, process.env.EMIS_FIELD_ACCREDITATION || "accreditation"),
    },
    students,
    studyGroups,
    period: process.env.EMIS_SYNC_PERIOD || "Periode belum dikonfigurasi",
    schoolYear: process.env.EMIS_SYNC_SCHOOL_YEAR || "",
    semester: process.env.EMIS_SYNC_SEMESTER || "",
    coverage: Math.round((available / 7) * 100),
    warnings,
  };
}

function unwrap(payload: unknown) {
  if (!payload || typeof payload !== "object") return {};
  const value = payload as Record<string, unknown>;
  return value.results && typeof value.results === "object" ? value.results as Record<string, unknown> : value;
}

function configuredNumber(payload: unknown, environmentName: string) {
  const path = process.env[environmentName]?.trim();
  if (!path) return undefined;
  const value = readPath(payload, path);
  if (value == null || value === "") return undefined;
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`Field ${environmentName} bukan angka valid.`);
  return number;
}

function textAt(payload: unknown, path: string) {
  const value = readPath(payload, path);
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : undefined;
}

function readPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

function validateNonNegative(values: (number | undefined)[]) {
  if (values.some((value) => value != null && value < 0)) throw new Error("Respons EMIS memiliki agregat negatif.");
}

function sumDefined(...values: (number | undefined)[]) {
  return values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
}
