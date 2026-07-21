import { fetchJsonWithRetry, joinUrl } from "@/lib/integrations/shared";
import type { SimpegEmployee, SimpegPage } from "@/lib/integrations/simpeg/types";

const MAX_PAGES = 50;
const MAX_RECORDS = 25_000;

export async function fetchAllSimpegEmployees(baseUrl: string, token: string) {
  const pageParam = process.env.SIMPEG_PAGE_PARAM || "page";
  const sizeParam = process.env.SIMPEG_SIZE_PARAM || "size";
  const requestedSize = Math.min(500, Number(process.env.SIMPEG_PAGE_SIZE) || 500);
  const records: SimpegEmployee[] = [];
  const fingerprints = new Set<string>();
  const warnings: string[] = [];
  let upstreamTotal: number | undefined;
  let pageCount = 0;
  let complete = false;

  for (let page = 1; page <= MAX_PAGES && records.length < MAX_RECORDS; page += 1) {
    const url = new URL(joinUrl(baseUrl, "pegawai"));
    url.searchParams.set(pageParam, String(page));
    url.searchParams.set(sizeParam, String(requestedSize));
    const payload = await fetchJsonWithRetry(url.toString(), {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    }, { timeoutMs: 20_000, retries: 1 }) as SimpegPage;
    const pageRecords = Array.isArray(payload.data) ? payload.data : [];
    upstreamTotal = typeof payload.total === "number" ? payload.total : upstreamTotal;
    pageCount += 1;

    const fingerprint = pageFingerprint(pageRecords);
    if (fingerprints.has(fingerprint) && pageRecords.length) {
      warnings.push("Endpoint SIMPEG mengembalikan halaman yang sama; pagination dihentikan untuk mencegah loop.");
      break;
    }
    fingerprints.add(fingerprint);
    records.push(...pageRecords);

    if (!pageRecords.length || (upstreamTotal != null && records.length >= upstreamTotal) || pageRecords.length < requestedSize) {
      complete = upstreamTotal == null || records.length >= upstreamTotal || pageRecords.length < requestedSize;
      break;
    }
  }

  const deduplicated = deduplicate(records).slice(0, MAX_RECORDS);
  if (upstreamTotal != null && deduplicated.length < upstreamTotal) warnings.push(`Hanya ${deduplicated.length} dari ${upstreamTotal} record upstream yang berhasil diambil.`);
  return { records: deduplicated, upstreamTotal, pageCount, complete, warnings };
}

function deduplicate(records: SimpegEmployee[]) {
  return Array.from(new Map(records.map((record) => [employeeKey(record), record])).values());
}

function employeeKey(record: SimpegEmployee) {
  return String(record.NIP || record.ID || [record.NAMA_LENGKAP || record.NAMA, record.SATUAN_KERJA, record.TAMPIL_JABATAN].join("|")).toLowerCase();
}

function pageFingerprint(records: SimpegEmployee[]) {
  return records.slice(0, 10).map(employeeKey).join(";") || "empty";
}
