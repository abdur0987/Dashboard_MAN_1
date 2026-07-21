import type { SimpegEmployee } from "@/lib/integrations/simpeg/types";

export type EmployeeMatchReason = "nsm" | "npsn" | "satker_code" | "unit_name";

export function matchSchoolEmployee(employee: SimpegEmployee): EmployeeMatchReason | null {
  const nsm = process.env.SIMPEG_NSM || "131118010001";
  const npsn = process.env.SIMPEG_NPSN || "10816233";
  const satkerCode = process.env.SIMPEG_SATKER_CODE?.trim();
  const unitName = process.env.SIMPEG_UNIT_NAME || "MAN 1 Lampung Selatan";
  if (digits(employee.NSM) === digits(nsm)) return "nsm";
  if (digits(employee.NPSN) === digits(npsn)) return "npsn";
  if (satkerCode && normalize(employee.KODE_SATKER) === normalize(satkerCode)) return "satker_code";
  if (normalize(employee.SATUAN_KERJA).includes(normalize(unitName))) return "unit_name";
  return null;
}

function normalize(value?: string) {
  return (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function digits(value?: string) {
  return (value || "").replace(/\D/g, "");
}
