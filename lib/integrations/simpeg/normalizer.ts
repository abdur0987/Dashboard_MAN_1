import { matchSchoolEmployee } from "@/lib/integrations/simpeg/filter";
import type { SimpegEmployee } from "@/lib/integrations/simpeg/types";

export function normalizeSimpegEmployees(input: {
  records: SimpegEmployee[];
  upstreamTotal?: number;
  pageCount: number;
  complete: boolean;
  warnings: string[];
}) {
  const matched = input.records.filter((record) => matchSchoolEmployee(record));
  const warnings = [...input.warnings];
  if (!input.complete) warnings.push("Total pegawai definitif tidak ditetapkan karena pagination belum lengkap.");
  const certification = matched.map(classifyCertification);
  const certificationAvailable = certification.some((value) => value !== "unknown");
  return {
    period: new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }),
    employeesTotal: input.complete ? matched.length : undefined,
    pnsTotal: count(matched, (record) => normalize(record.STATUS_PEGAWAI) === "pns"),
    pppkTotal: count(matched, (record) => normalize(record.STATUS_PEGAWAI).includes("pppk")),
    nonAsnTotal: input.complete ? count(matched, (record) => normalize(record.STATUS_PEGAWAI).includes("nonasn")) : undefined,
    educationS3: count(matched, (record) => /s\s*3|doktor/i.test(record.PENDIDIKAN || "")),
    educationS2: count(matched, (record) => /s\s*2|magister/i.test(record.PENDIDIKAN || "")),
    educationS1d4: count(matched, (record) => /s\s*1|sarjana|d\s*4/i.test(record.PENDIDIKAN || "")),
    educationDiploma: count(matched, (record) => /d\s*[1-3]|diploma/i.test(record.PENDIDIKAN || "")),
    educationUnknown: count(matched, (record) => !record.PENDIDIKAN?.trim()),
    certifiedTotal: certificationAvailable ? certification.filter((value) => value === "certified").length : undefined,
    uncertifiedTotal: certificationAvailable ? certification.filter((value) => value === "uncertified").length : undefined,
    certificationUnknown: certification.filter((value) => value === "unknown").length,
    upstreamTotal: input.upstreamTotal,
    recordsReceived: input.records.length,
    filteredTotal: matched.length,
    pageCount: input.pageCount,
    coverage: input.upstreamTotal ? Math.min(100, Number(((input.records.length / input.upstreamTotal) * 100).toFixed(2))) : 0,
    qualityScore: input.complete ? 80 : 35,
    warnings,
    complete: input.complete,
  };
}

function classifyCertification(record: SimpegEmployee): "certified" | "uncertified" | "unknown" {
  const value = record.SERTIFIKASI;
  if (value == null || value === "") return "unknown";
  if (value === true || value === 1 || /^(ya|sudah|certified)$/i.test(String(value))) return "certified";
  if (value === false || value === 0 || /^(tidak|belum|uncertified)$/i.test(String(value))) return "uncertified";
  return "unknown";
}

function normalize(value?: string) {
  return (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function count(records: SimpegEmployee[], predicate: (record: SimpegEmployee) => boolean) {
  return records.filter(predicate).length;
}
