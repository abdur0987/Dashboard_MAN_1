import { NextResponse } from "next/server";
import { z } from "zod";

import { checkRateLimit, requestIdentity } from "@/lib/security/rate-limit";
import { getDashboardData } from "@/lib/services/dashboard";
import { generateOpenAiAssistantAnswer } from "@/lib/services/openai-assistant";
import type { DashboardData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  message: z.string().trim().min(1).max(1_000),
  mode: z.enum(["chat", "executive-summary"]).optional(),
  source: z.enum(["dashboard", "slideshow"]).optional(),
});

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`assistant:${requestIdentity(request)}`, { limit: 30, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Silakan coba kembali sebentar lagi." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Pertanyaan tidak valid." }, { status: 422 });
  const data = await getDashboardData();
  const ruleAnswer = buildRuleAnswer(parsed.data.message, data);
  if (ruleAnswer) return assistantResponse(ruleAnswer);

  const openAiAnswer = await generateOpenAiAssistantAnswer({
    message: parsed.data.message,
    mode: parsed.data.mode,
    source: parsed.data.source,
    data,
  });
  if (openAiAnswer) return assistantResponse({ ...openAiAnswer, source: "openai-dashboard" });

  return assistantResponse({
    answer: `Data yang tersedia saat ini:\n${summaryPoints(data).map((point) => `- ${point}`).join("\n")}`,
    points: summaryPoints(data),
    suggestions: defaultSuggestions,
    source: "dashboard-rules",
  });
}

const defaultSuggestions = [
  "Berapa jumlah siswa per tingkat?",
  "Bagaimana status tiga sumber data?",
  "Kapan data terakhir diperbarui?",
  "Apakah ada data yang berbeda?",
];

function buildRuleAnswer(message: string, data: DashboardData) {
  const intent = normalize(message);
  const emis = data.integration?.emis;
  const simpeg = data.integration?.simpeg;

  if (includesAny(intent, ["siswa", "peserta didik", "kelas x", "kelas xi", "kelas xii", "rombel"])) {
    if (!emis) return unavailable("Data agregat EMIS belum tersedia.");
    const points = [
      `Sumber aktif: ${emis.sourceName}, periode ${emis.period}.`,
      `Total peserta didik: ${format(emis.students.total)} siswa.`,
      `Kelas X: ${format(emis.students.grade10)}, kelas XI: ${format(emis.students.grade11)}, kelas XII: ${format(emis.students.grade12)} siswa.`,
      `Total rombongan belajar: ${format(emis.studyGroups.total)} rombel.`,
      emis.students.male == null || emis.students.female == null
        ? "Data gender belum tersedia dari endpoint resmi dan tidak ditampilkan sebagai angka nol."
        : `Gender tersedia: ${format(emis.students.male)} laki-laki dan ${format(emis.students.female)} perempuan.`,
    ];
    return answer("Ringkasan EMIS", points);
  }

  if (includesAny(intent, ["pegawai", "gtk", "asn", "simpeg", "guru", "tendik", "sertifikasi"])) {
    if (!simpeg) return unavailable("Snapshot SIMPEG belum tersedia.");
    const points = simpeg.complete ? [
      `Sumber aktif: ${simpeg.sourceName}.`,
      `Total GTK: ${format(simpeg.employeesTotal)} orang.`,
      `Klasifikasi publik GIS: ${format(simpeg.teachersTotal)} guru dan ${format(simpeg.staffTotal)} tenaga kependidikan.`,
      simpeg.certificationAvailable ? "Agregat sertifikasi tersedia dari database lokal." : "Agregat sertifikasi belum tersedia.",
      ...simpeg.warnings.slice(0, 2),
    ] : [
      `${format(simpeg.identifiedProfiles)} profil teridentifikasi pada snapshot yang diterima.`,
      `Cakupan pengambilan: ${format(simpeg.recordsReceived)} dari ${format(simpeg.upstreamTotal)} record upstream (${format(simpeg.coverage)}%).`,
      "Angka profil teridentifikasi bukan total GTK atau total ASN MAN 1 Lampung Selatan.",
      ...simpeg.warnings.slice(0, 2),
    ];
    return answer("Status GTK", points);
  }

  if (includesAny(intent, ["beda", "berbeda", "selisih", "cocok", "peringatan"])) {
    const alerts = data.integration?.alerts ?? [];
    const points = alerts.length
      ? alerts.map((alert) => `${alert.title}: ${alert.message}`)
      : ["Tidak ada selisih pada indikator yang dapat dibandingkan."];
    return answer("Perbandingan sumber data", points);
  }

  if (includesAny(intent, ["status", "sinkron", "update", "fresh", "stale", "sumber", "terakhir"])) {
    const points = (data.integration?.sources ?? []).map((source) =>
      `${source.name}: ${source.status}, periode ${source.period ?? "-"}, diperbarui ${formatDate(source.lastUpdated)}.`,
    );
    return points.length ? answer("Status sumber data", points) : unavailable("Status sinkronisasi belum tersedia.");
  }

  if (includesAny(intent, ["alamat", "lokasi", "kontak", "telepon", "email", "website"])) {
    return answer("Kontak MAN 1 Lampung Selatan", [
      `Alamat: ${data.contact.address}.`,
      `Telepon: ${data.contact.phone}.`,
      `Email: ${data.contact.email}.`,
      `Website: ${data.contact.website}.`,
    ]);
  }

  if (includesAny(intent, ["agenda", "jadwal", "kegiatan"])) {
    const points = data.executiveSchedules.slice(0, 5).map((item) => `${item.title}, ${item.date} pukul ${item.time}, status ${item.status}.`);
    return points.length ? answer("Agenda madrasah", points) : unavailable("Agenda madrasah belum tersedia.");
  }

  if (includesAny(intent, ["ringkas", "ringkasan", "dashboard", "kondisi madrasah"])) {
    return answer("Ringkasan dashboard", summaryPoints(data));
  }

  return null;
}

function summaryPoints(data: DashboardData) {
  const emis = data.integration?.emis;
  const simpeg = data.integration?.simpeg;
  return [
    emis ? `${format(emis.students.total)} peserta didik dan ${format(emis.studyGroups.total)} rombel pada periode ${emis.period}.` : "Agregat EMIS belum tersedia.",
    simpeg?.complete ? `${format(simpeg.employeesTotal)} GTK, terdiri dari ${format(simpeg.teachersTotal)} guru dan ${format(simpeg.staffTotal)} tenaga kependidikan.` : simpeg ? `${format(simpeg.identifiedProfiles)} profil SIMPEG teridentifikasi pada snapshot parsial; bukan total GTK.` : "Snapshot GTK belum tersedia.",
    emis?.students.male != null && emis.students.female != null
      ? `Komposisi gender: ${format(emis.students.male)} laki-laki dan ${format(emis.students.female)} perempuan.`
      : "Data gender belum tersedia.",
    `${data.integration?.alerts.filter((alert) => alert.severity !== "info").length ?? 0} peringatan selisih atau kesegaran data perlu ditinjau admin.`,
    `Dashboard memiliki ${data.executiveSchedules.length} agenda dan ${data.awardCollections.reduce((total, collection) => total + collection.items.length, 0)} item kegiatan/prestasi.`,
  ];
}

function answer(title: string, points: string[]) {
  return {
    answer: `${title}:\n${points.map((point) => `- ${point}`).join("\n")}`,
    points,
    suggestions: defaultSuggestions,
    source: "dashboard-rules",
  };
}

function unavailable(message: string) {
  return answer("Data belum tersedia", [message]);
}

function assistantResponse(payload: { answer: string; points?: string[]; suggestions?: string[]; source: string }) {
  return NextResponse.json({
    answer: payload.answer,
    points: payload.points ?? payload.answer.split("\n").filter((line) => line.startsWith("- ")).map((line) => line.slice(2)),
    suggestions: payload.suggestions ?? defaultSuggestions,
    source: payload.source,
    generatedAt: new Date().toISOString(),
  }, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
}

function includesAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function format(value: number | null | undefined) {
  return value == null ? "belum tersedia" : new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "belum tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(date);
}
