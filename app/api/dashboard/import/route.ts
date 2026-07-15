import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import type { DashboardRow, Indicator } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ImportedRecord = { label: string; value: number };

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });

  const category = normalizeCategory(String(formData.get("category") || "EMIS"));
  const year = normalizeYear(Number(formData.get("year")));
  const source = String(formData.get("source") || `Upload ${file.name}`).trim();
  const unit = String(formData.get("unit") || (category === "EMIS" ? "siswa" : "orang")).trim();
  const defaultIndicator = String(formData.get("indicator") || (category === "EMIS" ? "Rekap Peserta Didik" : "Rekap Pegawai")).trim();

  try {
    const records = await extractRecords(file);
    if (!records.length) return NextResponse.json({ error: "Tabel belum terbaca. Gunakan baris berisi label dan angka." }, { status: 422 });

    const rows: DashboardRow[] = records.map((record, index) => ({
      id: index + 1,
      indicator: record.label || defaultIndicator,
      category,
      region: "MAN 1 Lampung Selatan",
      period: "Tahunan",
      year,
      value: record.value,
      unit,
      source,
    }));
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    const indicator: Omit<Indicator, "id"> = {
      name: defaultIndicator,
      description: `Ringkasan ${category} hasil impor ${file.name}.`,
      category,
      unit,
      source,
      year,
      value: total,
      trend: 0,
      status: "perlu-validasi",
    };

    return NextResponse.json({ rows, indicator, meta: { fileName: file.name, records: rows.length } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "File gagal diproses." }, { status: 422 });
  }
}

async function extractRecords(file: File): Promise<ImportedRecord[]> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const buffer = Buffer.from(await file.arrayBuffer());

  if (["xlsx", "xls", "csv"].includes(extension)) {
    const xlsx = await import("xlsx");
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return recordsFromCells(xlsx.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1 }));
  }

  let text = "";
  if (extension === "docx") {
    const mammoth = await import("mammoth");
    text = (await mammoth.extractRawText({ buffer })).value;
  } else if (extension === "doc") {
    const { createRequire } = await import("node:module");
    const require = createRequire(import.meta.url);
    const WordExtractor = require("word-extractor") as new () => { extract(input: Buffer): Promise<{ getBody(): string }> };
    text = (await new WordExtractor().extract(buffer)).getBody();
  } else if (extension === "pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try { text = (await parser.getText()).text; } finally { await parser.destroy(); }
  } else {
    throw new Error("Format file belum didukung.");
  }

  return recordsFromText(text);
}

function recordsFromCells(rows: (string | number)[][]) {
  const records: ImportedRecord[] = [];
  for (const row of rows) {
    const cells = row.map((cell) => String(cell ?? "").trim()).filter(Boolean);
    if (cells.length < 2) continue;
    const label = cells.find((cell) => /[a-z]/i.test(cell) && !/^(label|indikator|jumlah|nilai|total)$/i.test(cell));
    const numeric = [...cells].reverse().map(parseNumber).find((value) => value !== null);
    if (label && numeric !== undefined && numeric !== null) records.push({ label, value: numeric });
  }
  return unique(records);
}

function recordsFromText(text: string) {
  return unique(text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).flatMap((line) => {
    const match = line.match(/^(.+?)[\s:;,-]+([0-9]+(?:[.,][0-9]+)?)\s*$/);
    if (!match) return [];
    const value = parseNumber(match[2]);
    return value === null ? [] : [{ label: match[1].trim(), value }];
  }));
}

function parseNumber(value: string) {
  const cleaned = value.replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

function unique(records: ImportedRecord[]) {
  return Array.from(new Map(records.map((record) => [record.label.toLowerCase(), record])).values());
}

function normalizeCategory(value: string) {
  return value.toUpperCase() === "SIMPEG" ? "SIMPEG" : "EMIS";
}

function normalizeYear(value: number) {
  return Number.isFinite(value) && value >= 2000 && value <= 2200 ? Math.trunc(value) : 2026;
}
