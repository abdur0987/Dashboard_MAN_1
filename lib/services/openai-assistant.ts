import type { DashboardData, ExecutiveSchedule, Indicator } from "@/lib/types";
import { loadAssistantKnowledge } from "@/lib/services/assistant-knowledge";

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

type KnowledgeMatch = {
  datasetTitle: string;
  sheetName: string;
  tableTitle: string;
  rowText: string;
};

type OpenAiAssistantInput = {
  message: string;
  mode?: "chat" | "executive-summary";
  source?: "dashboard" | "slideshow";
  data: DashboardData;
  snapshot: DashboardSnapshot;
  knowledgeMatches: KnowledgeMatch[];
};

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

const defaultModel = process.env.OPENAI_MODEL || "gpt-4.1";
let openAiRetryAfter = 0;

export async function generateOpenAiAssistantAnswer({
  message,
  mode,
  source,
  data,
  snapshot,
  knowledgeMatches,
}: OpenAiAssistantInput) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || !message.trim()) {
    return null;
  }

  if (Date.now() < openAiRetryAfter) {
    return null;
  }

  const context = buildAssistantContext(data, snapshot, knowledgeMatches);
  const instruction = [
    "Kamu adalah AI data untuk Dashboard MAN 1 Lampung Selatan.",
    "Jawab dalam bahasa Indonesia yang jelas, ringkas, profesional, dan ramah.",
    "Gunakan hanya data yang diberikan dalam konteks dashboard. Jika data tidak tersedia, katakan dengan jujur.",
    "Fokus pada EMIS untuk profil sekolah dan siswa, serta SIMPEG untuk profil dan statistik ASN.",
    "Untuk pertanyaan pimpinan, prioritaskan poin penting, validitas data, risiko, dan rekomendasi tindak lanjut.",
    "Jangan mengarang angka, alamat, agenda, berita, atau statistik di luar konteks.",
    "Format jawaban dengan paragraf pendek dan bullet seperlunya.",
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: defaultModel,
        input: [
          {
            role: "developer",
            content: [
              {
                type: "input_text",
                text: instruction,
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: [
                  `Mode: ${mode ?? "chat"}`,
                  `Sumber tampilan: ${source ?? "dashboard"}`,
                  `Pertanyaan pengguna: ${message}`,
                  "",
                  "Konteks dashboard:",
                  context,
                ].join("\n"),
              },
            ],
          },
        ],
        max_output_tokens: 900,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error("OpenAI assistant request failed", response.status, errorBody);

      if (response.status === 429 || errorBody.includes("insufficient_quota")) {
        openAiRetryAfter = Date.now() + 5 * 60 * 1000;
      }

      return null;
    }

    const json = (await response.json()) as OpenAiResponse;
    const answer = extractResponseText(json);

    if (!answer) {
      return null;
    }

    return {
      answer,
      suggestions: [
        "Buat poin penting pimpinan",
        "Ringkas agenda terdekat",
        "Analisa kekurangan kinerja",
        "Apa berita terbaru?",
      ],
    };
  } catch (error) {
    console.error("OpenAI assistant request error", error);
    return null;
  }
}

function buildAssistantContext(
  data: DashboardData,
  snapshot: DashboardSnapshot,
  knowledgeMatches: KnowledgeMatch[],
) {
  const relevantKnowledge = knowledgeMatches.length
    ? knowledgeMatches
    : loadAssistantKnowledge().slice(0, 16);

  const indicators = data.indicators
    .slice()
    .sort((a, b) => b.year - a.year || b.value - a.value)
    .slice(0, 12)
    .map(
      (indicator) =>
        `- ${indicator.category}: ${indicator.name} = ${formatNumber(indicator.value)} ${indicator.unit}, tahun ${indicator.year}, sumber ${indicator.source}.`,
    );

  const agenda = data.executiveSchedules.slice(0, 8).map((schedule) => {
    const priority = schedule.priority === "utama" ? "Prioritas Utama" : "Agenda";
    return `- ${priority}: ${schedule.title}; ${schedule.date} ${schedule.time}; status ${schedule.status}; lokasi ${schedule.location}; kehadiran/unit ${schedule.unit}.`;
  });

  const news = data.latestNews
    .slice(0, 5)
    .map((item) => `- ${item.title}; kategori ${item.category}; tanggal ${item.date}.`);

  const datasets = data.datasetDetails.slice(0, 18).map((dataset) => {
    return `- ${dataset.module}: ${dataset.tableNumber} ${dataset.title}; tahun ${dataset.year}; ${dataset.rows.length} baris; ${dataset.headers.length} kolom.`;
  });

  const knowledge = relevantKnowledge.slice(0, 20).map((item) => {
    return `- ${item.datasetTitle} | ${item.tableTitle} | ${item.sheetName}: ${item.rowText}`;
  });

  const offices = data.officeLocations
    .slice(0, 16)
    .map((office) => `- ${office.name}: ${office.address}; telepon ${office.phone}.`);

  const awards = data.awardCollections.map(
    (collection) => `- ${collection.title}: ${collection.items.length} foto penghargaan.`,
  );

  return [
    "Ringkasan utama:",
    `- Tahun indikator terbaru: ${snapshot.latestYear}.`,
    `- Rata-rata indikator: ${formatNumber(snapshot.average)}%.`,
    snapshot.strongestIndicator
      ? `- Indikator tertinggi: ${snapshot.strongestIndicator.name} (${formatNumber(snapshot.strongestIndicator.value)} ${snapshot.strongestIndicator.unit}).`
      : "- Indikator tertinggi belum tersedia.",
    snapshot.weakestIndicator
      ? `- Indikator terendah/area pemantauan: ${snapshot.weakestIndicator.name} (${formatNumber(snapshot.weakestIndicator.value)} ${snapshot.weakestIndicator.unit}).`
      : "- Indikator terendah belum tersedia.",
    snapshot.focusAgenda
      ? `- Agenda prioritas: ${snapshot.focusAgenda.title}, ${snapshot.focusAgenda.date} pukul ${snapshot.focusAgenda.time}, ${snapshot.focusAgenda.location}.`
      : "- Agenda prioritas belum tersedia.",
    `- Jumlah berita terbaru: ${data.latestNews.length}.`,
    `- Jumlah dataset detail: ${data.datasetDetails.length}.`,
    `- Jumlah kantor/geotagging: ${data.officeLocations.length}.`,
    "",
    "Indikator strategis:",
    indicators.join("\n") || "- Tidak ada indikator.",
    "",
    "Agenda Madrasah:",
    agenda.join("\n") || "- Tidak ada agenda.",
    "",
    "Berita terbaru:",
    news.join("\n") || "- Tidak ada berita.",
    "",
    "Dataset statistik:",
    datasets.join("\n") || "- Tidak ada dataset.",
    "",
    "Cuplikan data training Excel:",
    knowledge.join("\n") || "- Belum ada data training.",
    "",
    "Penghargaan:",
    awards.join("\n") || "- Tidak ada penghargaan.",
    "",
    "Kontak resmi:",
    `- ${data.contact.institution}`,
    `- Alamat: ${data.contact.address}`,
    `- Telepon: ${data.contact.phone}`,
    `- Email: ${data.contact.email}`,
    `- Website: ${data.contact.website}`,
    "",
    "Geotagging kantor:",
    offices.join("\n") || "- Tidak ada data kantor.",
  ].join("\n");
}

function extractResponseText(response: OpenAiResponse) {
  if (response.output_text) {
    return response.output_text.trim();
  }

  const text = response.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text ?? "")
    .filter(Boolean)
    .join("\n")
    .trim();

  return text || "";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(value);
}
