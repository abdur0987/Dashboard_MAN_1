import type { DashboardData } from "@/lib/types";

type OpenAiAssistantInput = {
  message: string;
  mode?: "chat" | "executive-summary";
  source?: "dashboard" | "slideshow";
  data: DashboardData;
};

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{ content?: Array<{ text?: string }> }>;
};

let openAiRetryAfter = 0;

export async function generateOpenAiAssistantAnswer({ message, mode, source, data }: OpenAiAssistantInput) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || !message.trim() || Date.now() < openAiRetryAfter) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1",
        input: [
          {
            role: "developer",
            content: [{
              type: "input_text",
              text: [
                "Anda adalah asisten data publik MAN 1 Lampung Selatan.",
                "Gunakan hanya agregat aman dalam konteks yang diberikan.",
                "Semua pengunjung mendapat konteks yang sama; mode hanya mengatur gaya ringkasan.",
                "Jika complete=false, jangan menyebut profil teridentifikasi SIMPEG sebagai total GTK atau total ASN.",
                "Jika complete=true, total GTK boleh disebut sesuai konteks dan sumber aktif.",
                "Jika nilai null atau tidak tersedia, katakan data belum tersedia. Jangan menggantinya dengan nol.",
                "Jangan menghitung rata-rata atau peringkat antarindikator dengan unit berbeda.",
              ].join("\n"),
            }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: `Mode tampilan: ${mode ?? "chat"}\nSumber UI: ${source ?? "dashboard"}\nPertanyaan: ${message}\n\nKonteks agregat:\n${safeContext(data)}` }],
          },
        ],
        max_output_tokens: 700,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      if (response.status === 429) openAiRetryAfter = Date.now() + 5 * 60 * 1000;
      return null;
    }
    const payload = await response.json() as OpenAiResponse;
    const answer = extractText(payload);
    return answer ? {
      answer,
      points: answer.split("\n").map((line) => line.replace(/^[-*]\s*/, "").trim()).filter(Boolean).slice(0, 8),
      suggestions: ["Berapa jumlah siswa per tingkat?", "Bagaimana status tiga sumber data?", "Apakah ada data yang berbeda?"],
    } : null;
  } catch {
    return null;
  }
}

function safeContext(data: DashboardData) {
  const emis = data.integration?.emis;
  const simpeg = data.integration?.simpeg;
  const sources = (data.integration?.sources ?? []).map((item) => `${item.name}: status=${item.status}, periode=${item.period ?? "null"}, lastUpdated=${item.lastUpdated ?? "null"}, coverage=${item.coverage ?? "null"}`).join("\n");
  return [
    `Madrasah: ${data.integration?.profile.name ?? data.contact.institution}`,
    `NPSN: ${data.integration?.profile.npsn ?? "10816233"}`,
    `NSM: ${data.integration?.profile.nsm ?? "131118010001"}`,
    emis ? `Peserta didik: source=${emis.sourceName}, periode=${emis.period}, total=${emis.students.total ?? "null"}, kelasX=${emis.students.grade10 ?? "null"}, kelasXI=${emis.students.grade11 ?? "null"}, kelasXII=${emis.students.grade12 ?? "null"}, rombel=${emis.studyGroups.total ?? "null"}, male=${emis.students.male ?? "null"}, female=${emis.students.female ?? "null"}` : "Peserta didik: null",
    simpeg ? `GTK: source=${simpeg.sourceName}, complete=${simpeg.complete}, identifiedProfiles=${simpeg.identifiedProfiles ?? "null"}, employeesTotal=${simpeg.employeesTotal ?? "null"}, teachers=${simpeg.teachersTotal ?? "null"}, staff=${simpeg.staffTotal ?? "null"}, received=${simpeg.recordsReceived}, upstreamTotal=${simpeg.upstreamTotal ?? "null"}, coverage=${simpeg.coverage}, certificationAvailable=${simpeg.certificationAvailable}` : "GTK: null",
    "Status sumber:",
    sources || "belum tersedia",
    `Peringatan data: ${(data.integration?.alerts ?? []).map((alert) => `${alert.title}: ${alert.message}`).join(" | ") || "tidak ada"}`,
    `Agenda agregat: ${data.executiveSchedules.length}`,
    `Publikasi: ${data.publications.length}`,
  ].join("\n");
}

function extractText(response: OpenAiResponse) {
  if (response.output_text) return response.output_text.trim();
  return response.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").filter(Boolean).join("\n").trim() || "";
}
