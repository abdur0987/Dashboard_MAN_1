import { NextResponse } from "next/server";
import {
  answerAssistantKnowledgeQuestion,
  searchAssistantKnowledge,
} from "@/lib/services/assistant-knowledge";
import { generateOpenAiAssistantAnswer } from "@/lib/services/openai-assistant";

import { getDashboardData } from "@/lib/services/dashboard";
import type { DashboardData, ExecutiveSchedule, Indicator } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AssistantRequest = {
  message?: string;
  mode?: "chat" | "executive-summary";
  source?: "dashboard" | "slideshow";
};

type DashboardSnapshot = {
  latestYear: number | "-";
  average: number;
  strongestIndicator: Indicator | null;
  weakestIndicator: Indicator | null;
  focusAgenda: ExecutiveSchedule | null;
  runningAgendaCount: number;
  completedAgendaCount: number;
  awardCount: number;
};

const quickSuggestions = [
  "Buat poin penting pimpinan",
  "Ringkas agenda terdekat",
  "Tampilkan indikator tertinggi",
  "Apa berita terbaru hari ini?",
];

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as AssistantRequest;
  const message = (payload.message ?? "").trim();
  const preciseKnowledgeAnswer = answerAssistantKnowledgeQuestion(message);

  if (preciseKnowledgeAnswer) {
    return NextResponse.json(
      {
        answer: preciseKnowledgeAnswer.answer,
        points: preciseKnowledgeAnswer.points,
        suggestions: preciseKnowledgeAnswer.suggestions,
        source: "assistant-knowledge",
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  }

  const data = await getDashboardData();
  const snapshot = buildDashboardSnapshot(data);
  const knowledgeMatches = searchAssistantKnowledge(message, 12);

  const openAiAnswer = await generateOpenAiAssistantAnswer({
    message,
    mode: payload.mode,
    source: payload.source,
    data,
    snapshot,
    knowledgeMatches,
  });

  if (openAiAnswer) {
    return NextResponse.json(
      {
        answer: openAiAnswer.answer,
        points: openAiAnswer.answer
          .split("\n")
          .map((line) => line.replace(/^[-*]\s*/, "").trim())
          .filter(Boolean)
          .slice(0, 8),
        suggestions: openAiAnswer.suggestions,
        source: "openai-dashboard",
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  }

  const normalizedMessage = normalizeText(message);

  if (includesAny(normalizedMessage, ["lokasi", "alamat", "dimana", "letak", "kontak", "telepon", "email", "website"])) {
    const answer = buildContactAnswer(data, [
      "Agenda terdekat di mana?",
      "Tampilkan kontak resmi",
      "Buat ringkasan pimpinan",
    ]);

    return NextResponse.json(
      {
        answer: answer.text,
        points: answer.points,
        suggestions: answer.suggestions,
        source: "dashboard-data",
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  }

  if (message && knowledgeMatches.length) {
    const question = normalizeText(message);

    const isSpecificQuestion =
      question.includes("berapa") ||
      question.includes("jumlah") ||
      question.includes("total");

    const wilayahKeywords = [
      "lampung barat",
      "lampung selatan",
      "lampung tengah",
      "lampung timur",
      "lampung utara",
      "tanggamus",
      "tulang bawang",
      "way kanan",
      "pesawaran",
      "tulang bawang barat",
      "mesuji",
      "pringsewu",
      "pesisir barat",
      "bandar lampung",
      "metro",
    ];

    const matchedWilayah = wilayahKeywords.find((wilayah) =>
      question.includes(wilayah),
    );

    const filteredMatches = knowledgeMatches.filter((item) => {
      const rowText = normalizeText(item.rowText);
      const tableTitle = normalizeText(item.tableTitle);

      if (matchedWilayah && !rowText.includes(matchedWilayah)) {
        return false;
      }

      if (
        question.includes("penduduk") &&
        question.includes("islam") &&
        !(tableTitle.includes("penduduk") && tableTitle.includes("agama"))
      ) {
        return false;
      }

      return true;
    });

    const finalMatches = filteredMatches.length ? filteredMatches : knowledgeMatches;
    const bestMatch = finalMatches[0];

    if (isSpecificQuestion && bestMatch) {
      const islamMatch = bestMatch.rowText.match(/Islam:\s*([^;]+)/i);
      const jumlahMatch = bestMatch.rowText.match(/Jumlah:\s*([^;]+)/i);
      const satuanKerjaMatch = bestMatch.rowText.match(/Satuan Kerja:\s*([^;]+)/i);

      const satuanKerja =
        satuanKerjaMatch?.[1]?.trim() || matchedWilayah || "wilayah tersebut";
      const islamValue = islamMatch?.[1]?.trim();
      const jumlahValue = jumlahMatch?.[1]?.trim();

      let answerText = `Berdasarkan ${bestMatch.tableTitle}, ${satuanKerja}`;

      if (question.includes("islam") && islamValue) {
        answerText += ` memiliki jumlah penduduk beragama Islam sebanyak ${Number(
          islamValue,
        ).toLocaleString("id-ID")} jiwa.`;
      } else if (jumlahValue) {
        answerText += ` memiliki jumlah total sebanyak ${Number(jumlahValue).toLocaleString(
          "id-ID",
        )}.`;
      } else {
        answerText += ` memiliki data sebagai berikut: ${bestMatch.rowText}.`;
      }

      answerText += `\n\nSumber: ${bestMatch.datasetTitle}, ${bestMatch.tableTitle}, sheet ${bestMatch.sheetName}.`;

      return NextResponse.json(
        {
          answer: answerText,
          points: [
            bestMatch.rowText,
            `Sumber: ${bestMatch.datasetTitle}, ${bestMatch.tableTitle}, sheet ${bestMatch.sheetName}`,
          ],
          suggestions: [
            "Tampilkan data per kabupaten",
            "Ringkas dataset ini",
            "Buat poin penting pimpinan",
          ],
          source: "assistant-knowledge",
          generatedAt: new Date().toISOString(),
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        },
      );
    }

    const points = finalMatches.slice(0, 5).map((item) => {
      return `${item.rowText} | Sumber: ${item.datasetTitle}, ${item.tableTitle}, sheet ${item.sheetName}`;
    });

    return NextResponse.json(
      {
        answer: `Saya menemukan data yang relevan dari dataset Excel:\n${points
          .map((point) => `- ${point}`)
          .join("\n")}`,
        points,
        suggestions: [
          "Ringkas dataset ini",
          "Tampilkan data per kabupaten",
          "Buat poin penting pimpinan",
        ],
        source: "assistant-knowledge",
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  }
  const answer = buildAssistantAnswer(message, payload.mode, data, snapshot);

  return NextResponse.json(
    {
      answer: answer.text,
      points: answer.points,
      suggestions: answer.suggestions,
      source: "dashboard-data",
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}

function buildAssistantAnswer(
  message: string,
  mode: AssistantRequest["mode"],
  data: DashboardData,
  snapshot: DashboardSnapshot,
) {
  const intent = message.toLowerCase();
  const normalizedIntent = normalizeText(message);

  if (includesAny(normalizedIntent, ["lokasi", "alamat", "dimana", "letak"])) {
    return buildContactAnswer(data, [
      "Agenda terdekat di mana?",
      "Tampilkan kontak resmi",
      "Buat ringkasan pimpinan",
    ]);
  }

  if (includesAny(normalizedIntent, ["pandangan", "opini", "tanggapan", "respon", "masyarakat"])) {
    const points = buildPublicPerspectivePoints(data, snapshot);

    return {
      text: `Berdasarkan data dashboard, gambaran untuk masyarakat adalah:\n${points.map((point) => `- ${point}`).join("\n")}`,
      points,
      suggestions: ["Ringkas layanan publik", "Apa berita terbaru?", "Indikator terendah"],
    };
  }

  if (
    includesAny(normalizedIntent, ["profil", "tentang", "identitas", "kanwil", "kemenag lampung"]) &&
    !includesAny(normalizedIntent, ["berita", "agenda", "indikator", "penghargaan", "video"])
  ) {
    const points = buildInstitutionPoints(data, snapshot);

    return {
      text: `Profil singkat Kanwil:\n${points.map((point) => `- ${point}`).join("\n")}`,
      points,
      suggestions: ["Lokasi Kanwil", "Kontak resmi", "Buat poin pimpinan"],
    };
  }

  if (
    mode === "executive-summary" ||
    includesAny(intent, ["pimpinan", "ringkas", "poin", "point", "result", "hasil"])
  ) {
    const points = buildExecutivePoints(data, snapshot);

    return {
      text: `Berikut poin penting untuk pimpinan:\n${points.map((point) => `- ${point}`).join("\n")}`,
      points,
      suggestions: quickSuggestions,
    };
  }

  if (includesAny(intent, ["agenda", "jadwal", "simanda"])) {
    const points = buildAgendaPoints(data, snapshot);

    return {
      text: `Ringkasan agenda pimpinan:\n${points.map((point) => `- ${point}`).join("\n")}`,
      points,
      suggestions: ["Apa agenda prioritas?", "Status agenda hari ini", "Buat ringkasan pimpinan"],
    };
  }

  if (includesAny(intent, ["indikator", "kinerja", "grafik", "data", "nilai"])) {
    const points = buildIndicatorPoints(data, snapshot);

    return {
      text: `Ringkasan indikator dashboard:\n${points.map((point) => `- ${point}`).join("\n")}`,
      points,
      suggestions: ["Indikator tertinggi", "Indikator terendah", "Buat poin penting pimpinan"],
    };
  }

  if (includesAny(intent, ["berita", "news", "portal"])) {
    const points = data.latestNews.slice(0, 5).map((item) => `${item.title} (${item.date})`);

    return {
      text: `Top ${points.length} berita terbaru Kanwil:\n${points.map((point) => `- ${point}`).join("\n")}`,
      points,
      suggestions: ["Berita utama", "Ringkas dashboard", "Agenda terdekat"],
    };
  }

  if (includesAny(intent, ["penghargaan", "ppid", "award", "capaian"])) {
    const points = data.awardCollections.map(
      (collection) => `${collection.title}: ${collection.items.length} foto koleksi.`,
    );

    return {
      text: `Ringkasan penghargaan:\n${points.map((point) => `- ${point}`).join("\n")}`,
      points,
      suggestions: ["Apa itu PPID?", "Ringkas penghargaan", "Buat poin pimpinan"],
    };
  }

  if (includesAny(intent, ["video", "youtube", "kanal"])) {
    const video = data.videos[0];
    const points = video
      ? [`${video.title}: ${video.description}`, `Embed aktif: ${video.embedUrl}`]
      : ["Kanal video belum tersedia."];

    return {
      text: `Informasi kanal video:\n${points.map((point) => `- ${point}`).join("\n")}`,
      points,
      suggestions: ["Ringkas dashboard", "Berita terbaru", "Kontak Kanwil"],
    };
  }

  if (includesAny(intent, ["kontak", "alamat", "lokasi", "telepon", "email", "website"])) {
    return buildContactAnswer(data, ["Agenda terdekat", "Berita terbaru", "Ringkasan pimpinan"]);
  }

  const matchedPoints = buildRelevantSearchPoints(normalizedIntent, data, snapshot);

  if (matchedPoints.length) {
    return {
      text: `Saya menemukan data yang relevan di dashboard:\n${matchedPoints.map((point) => `- ${point}`).join("\n")}`,
      points: matchedPoints,
      suggestions: quickSuggestions,
    };
  }

  const points = buildExecutivePoints(data, snapshot);

  return {
    text: `Saya belum menemukan jawaban spesifik dari data dashboard untuk pertanyaan itu. Data yang bisa saya baca saat ini meliputi indikator EMIS dan SIMPEG, agenda madrasah, profil ASN, publikasi, dan kontak resmi.\n\nPoin cepat saat ini:\n${points.slice(0, 4).map((point) => `- ${point}`).join("\n")}`,
    points,
    suggestions: quickSuggestions,
  };
}

function buildDashboardSnapshot(data: DashboardData): DashboardSnapshot {
  const latestYear = data.indicators.length
    ? Math.max(...data.indicators.map((indicator) => indicator.year))
    : "-";
  const latestIndicators =
    latestYear === "-"
      ? data.indicators
      : data.indicators.filter((indicator) => indicator.year === latestYear);
  const values = latestIndicators.map((indicator) => indicator.value);
  const average = values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : 0;
  const strongestIndicator = latestIndicators.reduce<Indicator | null>(
    (selected, indicator) =>
      !selected || indicator.value > selected.value ? indicator : selected,
    null,
  );
  const weakestIndicator = latestIndicators.reduce<Indicator | null>(
    (selected, indicator) =>
      !selected || indicator.value < selected.value ? indicator : selected,
    null,
  );
  const focusAgenda =
    data.executiveSchedules.find((schedule) => schedule.priority === "utama") ??
    data.executiveSchedules[0] ??
    null;
  const runningAgendaCount = data.executiveSchedules.filter(
    (schedule) => schedule.status === "berjalan",
  ).length;
  const completedAgendaCount = data.executiveSchedules.filter(
    (schedule) => schedule.status === "selesai",
  ).length;
  const awardCount = data.awardCollections.reduce(
    (total, collection) => total + collection.items.length,
    0,
  );

  return {
    latestYear,
    average,
    strongestIndicator,
    weakestIndicator,
    focusAgenda,
    runningAgendaCount,
    completedAgendaCount,
    awardCount,
  };
}

function buildExecutivePoints(data: DashboardData, snapshot: DashboardSnapshot) {
  return [
    `Rata-rata indikator tahun ${snapshot.latestYear} berada di ${formatNumber(snapshot.average)}%.`,
    snapshot.strongestIndicator
      ? `Capaian tertinggi adalah ${snapshot.strongestIndicator.name} sebesar ${formatNumber(snapshot.strongestIndicator.value)}${snapshot.strongestIndicator.unit === "persen" ? "%" : ` ${snapshot.strongestIndicator.unit}`}.`
      : "Indikator utama belum tersedia.",
    snapshot.weakestIndicator
      ? `Area yang perlu dipantau adalah ${snapshot.weakestIndicator.name} dengan nilai ${formatNumber(snapshot.weakestIndicator.value)}${snapshot.weakestIndicator.unit === "persen" ? "%" : ` ${snapshot.weakestIndicator.unit}`}.`
      : "Area pemantauan belum tersedia.",
    snapshot.focusAgenda
      ? `Agenda prioritas terdekat: ${snapshot.focusAgenda.title}, ${snapshot.focusAgenda.date} pukul ${snapshot.focusAgenda.time} di ${snapshot.focusAgenda.location}.`
      : "Agenda madrasah belum tersedia.",
    `Terdapat ${data.latestNews.length} berita terbaru dari portal resmi dan ${snapshot.awardCount} foto penghargaan pada dashboard.`,
  ];
}

function buildAgendaPoints(data: DashboardData, snapshot: DashboardSnapshot) {
  const agendaPoints = data.executiveSchedules.slice(0, 4).map((schedule) => {
    const priority = schedule.priority === "utama" ? "Prioritas Utama" : "Agenda";
    return `${priority}: ${schedule.title}, ${schedule.date} pukul ${schedule.time}, status ${statusText(schedule.status)}, lokasi ${schedule.location}.`;
  });

  return [
    `Total agenda tampil: ${data.executiveSchedules.length}.`,
    `Agenda berjalan: ${snapshot.runningAgendaCount}, selesai: ${snapshot.completedAgendaCount}.`,
    ...agendaPoints,
  ];
}

function buildIndicatorPoints(data: DashboardData, snapshot: DashboardSnapshot) {
  const latestYear = snapshot.latestYear;
  const latestIndicators =
    latestYear === "-"
      ? data.indicators
      : data.indicators.filter((indicator) => indicator.year === latestYear);

  return [
    `Tahun data terbaru: ${latestYear}.`,
    `Rata-rata indikator terbaru: ${formatNumber(snapshot.average)}%.`,
    ...latestIndicators.map(
      (indicator) =>
        `${indicator.category}: ${indicator.name} bernilai ${formatNumber(indicator.value)}${indicator.unit === "persen" ? "%" : ` ${indicator.unit}`}.`,
    ),
  ];
}

function buildContactAnswer(data: DashboardData, suggestions: string[]) {
  const points = [
    `Lokasi MAN 1 Lampung Selatan berada di ${data.contact.address}.`,
    `Instansi: ${data.contact.institution}.`,
    `Telepon: ${data.contact.phone}.`,
    `Email: ${data.contact.email}.`,
    `Website: ${data.contact.website}.`,
  ];

  return {
    text: `Kontak dan lokasi resmi madrasah:\n${points.map((point) => `- ${point}`).join("\n")}`,
    points,
    suggestions,
  };
}

function buildInstitutionPoints(data: DashboardData, snapshot: DashboardSnapshot) {
  return [
    `${data.contact.institution} adalah Madrasah Aliyah Negeri di Kabupaten Lampung Selatan.`,
    `Dashboard menampilkan ringkasan EMIS dan SIMPEG tahun ${snapshot.latestYear}, agenda madrasah, profil ASN, publikasi, dan kontak resmi.`,
    `Rata-rata indikator terbaru berada di ${formatNumber(snapshot.average)}%.`,
    `Lokasi kantor: ${data.contact.address}.`,
    `Website resmi: ${data.contact.website}.`,
  ];
}

function buildPublicPerspectivePoints(data: DashboardData, snapshot: DashboardSnapshot) {
  const publicService = data.indicators.find((indicator) =>
    normalizeText(indicator.category).includes("layanan publik"),
  );
  const latestNews = data.latestNews.slice(0, 3).map((item) => item.title);
  const points = [
    "Dashboard belum memuat data survei opini masyarakat secara langsung, jadi saya tidak menyimpulkan sentimen publik di luar data yang tersedia.",
    publicService
      ? `Dari sisi layanan publik, ${publicService.name} bernilai ${formatNumber(publicService.value)}${publicService.unit === "persen" ? "%" : ` ${publicService.unit}`} pada tahun ${publicService.year}.`
      : "Indikator layanan publik belum tersedia.",
    snapshot.weakestIndicator
      ? `Area yang perlu terus diperhatikan agar persepsi masyarakat membaik adalah ${snapshot.weakestIndicator.name} dengan nilai ${formatNumber(snapshot.weakestIndicator.value)}${snapshot.weakestIndicator.unit === "persen" ? "%" : ` ${snapshot.weakestIndicator.unit}`}.`
      : "Area pemantauan belum tersedia.",
  ];

  if (latestNews.length) {
    points.push(`Berita terbaru yang dapat menjadi bahan membaca isu publik: ${latestNews.join("; ")}.`);
  }

  return points;
}

function buildRelevantSearchPoints(
  normalizedIntent: string,
  data: DashboardData,
  snapshot: DashboardSnapshot,
) {
  const keywords = getSearchKeywords(normalizedIntent);

  if (!keywords.length) return [];

  const points: string[] = [];

  for (const indicator of data.indicators) {
    if (matchesKeywords(keywords, [indicator.name, indicator.category, indicator.description, indicator.source])) {
      points.push(
        `${indicator.category}: ${indicator.name} bernilai ${formatNumber(indicator.value)}${indicator.unit === "persen" ? "%" : ` ${indicator.unit}`} pada tahun ${indicator.year}.`,
      );
    }
  }

  for (const schedule of data.executiveSchedules) {
    if (matchesKeywords(keywords, [schedule.title, schedule.unit, schedule.location, schedule.date, schedule.status])) {
      points.push(
        `Agenda: ${schedule.title}, ${schedule.date} pukul ${schedule.time}, lokasi ${schedule.location}, status ${statusText(schedule.status)}.`,
      );
    }
  }

  for (const news of data.latestNews) {
    if (matchesKeywords(keywords, [news.title, news.category, news.date])) {
      points.push(`Berita: ${news.title} (${news.date}).`);
    }
  }

  if (matchesKeywords(keywords, [data.contact.institution, data.contact.address, data.contact.website])) {
    points.push(`Kontak resmi: ${data.contact.institution}, ${data.contact.address}, website ${data.contact.website}.`);
  }

  if (!points.length && includesAny(normalizedIntent, ["terbaru", "sekarang", "hari ini"])) {
    return buildExecutivePoints(data, snapshot).slice(0, 4);
  }

  return points.slice(0, 6);
}

function includesAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSearchKeywords(value: string) {
  const stopwords = new Set([
    "apa",
    "yang",
    "dan",
    "di",
    "ke",
    "dari",
    "untuk",
    "dengan",
    "terhadap",
    "tentang",
    "saya",
    "ingin",
    "mau",
    "tolong",
    "kanwil",
    "kemenag",
    "provinsi",
    "lampung",
  ]);

  return value
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word.length > 3 && !stopwords.has(word));
}

function matchesKeywords(keywords: string[], values: string[]) {
  const haystack = normalizeText(values.filter(Boolean).join(" "));
  return keywords.some((keyword) => haystack.includes(keyword));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(value);
}

function statusText(status: ExecutiveSchedule["status"]) {
  const labels: Record<ExecutiveSchedule["status"], string> = {
    terjadwal: "terjadwal",
    berjalan: "berjalan",
    selesai: "selesai",
    belum: "belum",
  };

  return labels[status];
}
