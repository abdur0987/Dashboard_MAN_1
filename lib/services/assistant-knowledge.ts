import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { getDashboardData } from "@/lib/services/dashboard";

type KnowledgeRow = {
    id: string;
    datasetId: number | string;
    datasetTitle: string;
    sheetName: string;
    tableTitle: string;
    rowText: string;
    searchableText: string;
};

type ParsedKnowledgeRow = KnowledgeRow & {
    cells: Record<string, string>;
};

type KnowledgeAnswer = {
    answer: string;
    points: string[];
    suggestions: string[];
    matches: KnowledgeRow[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const KNOWLEDGE_FILE = path.join(DATA_DIR, "assistant-knowledge.json");

function normalizeText(value: string) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function cellToText(value: unknown) {
    if (value === null || value === undefined) return "";
    return String(value).trim();
}

function getKeywords(message: string) {
    const stopwords = new Set([
        "apa",
        "berapa",
        "yang",
        "dan",
        "atau",
        "di",
        "ke",
        "dari",
        "untuk",
        "dengan",
        "tahun",
        "data",
        "jumlah",
        "kemenag",
        "kanwil",
        "provinsi",
        "lampung",
        "tolong",
        "tampilkan",
        "ringkas",
    ]);

    return normalizeText(message)
        .split(" ")
        .filter((word) => word.length > 2 && !stopwords.has(word));
}

function resolvePublicFile(fileUrl: string) {
    if (!fileUrl) return null;
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) return null;

    const cleanUrl = fileUrl.replace(/^\/+/, "");
    const fullPath = path.join(process.cwd(), "public", cleanUrl);

    return fs.existsSync(fullPath) ? fullPath : null;
}

function isTableTitleRow(row: unknown[]) {
    const firstCell = cellToText(row[0]).toLowerCase();
    return firstCell.startsWith("table ") || firstCell.startsWith("tabel ");
}

function isEmptyRow(row: unknown[]) {
    return row.map(cellToText).every((cell) => !cell);
}

function isTotalRow(row: unknown[]) {
    return cellToText(row[0]).toLowerCase() === "total";
}

function rowHasUsefulHeader(row: unknown[]) {
    const filled = row.map(cellToText).filter(Boolean);
    return filled.length >= 2;
}

function rowsFromWorkbook(
    filePath: string,
    datasetId: number | string,
    datasetTitle: string,
) {
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const knowledgeRows: KnowledgeRow[] = [];

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
            header: 1,
            defval: "",
            blankrows: false,
        });

        let currentTableTitle = sheetName;
        let headers: string[] = [];
        let waitingForHeader = false;

        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            const row = rows[rowIndex];

            if (isEmptyRow(row)) {
                continue;
            }

            if (isTableTitleRow(row)) {
                currentTableTitle = row.map(cellToText).filter(Boolean).join(" ");
                headers = [];
                waitingForHeader = true;
                continue;
            }

            if (waitingForHeader && rowHasUsefulHeader(row)) {
                headers = row.map(cellToText).map((header, index) => {
                    return header || `Kolom ${index + 1}`;
                });
                waitingForHeader = false;
                continue;
            }

            if (!headers.length) {
                continue;
            }

            const values = row.map(cellToText);

            if (!values.some(Boolean)) {
                continue;
            }

            const pairs = headers
                .map((header, index) => {
                    const value = values[index];
                    if (!value) return "";
                    return `${header}: ${value}`;
                })
                .filter(Boolean);

            if (!pairs.length) {
                continue;
            }

            const rowText = pairs.join("; ");
            const combinedText = [
                datasetTitle,
                sheetName,
                currentTableTitle,
                rowText,
            ].join(" ");

            knowledgeRows.push({
                id: `${datasetId}-${sheetName}-${rowIndex}`,
                datasetId,
                datasetTitle,
                sheetName,
                tableTitle: currentTableTitle,
                rowText,
                searchableText: normalizeText(combinedText),
            });

            if (isTotalRow(row)) {
                headers = [];
                waitingForHeader = false;
            }
        }
    }

    return knowledgeRows;
}

export async function trainAssistantKnowledge() {
    const dashboard = await getDashboardData();
    const knowledgeRows: KnowledgeRow[] = [];
    const errors: string[] = [];

    for (const dataset of dashboard.datasets) {
        const filePath = resolvePublicFile(dataset.excelUrl);

        if (!filePath) {
            errors.push(`${dataset.title}: file Excel tidak ditemukan di ${dataset.excelUrl}`);
            continue;
        }

        try {
            const rows = rowsFromWorkbook(filePath, dataset.id, dataset.title);
            knowledgeRows.push(...rows);
        } catch (error) {
            errors.push(
                `${dataset.title}: gagal dibaca - ${error instanceof Error ? error.message : "unknown error"
                }`,
            );
        }
    }

    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(
        KNOWLEDGE_FILE,
        JSON.stringify(knowledgeRows, null, 2),
        "utf-8",
    );

    return {
        datasets: dashboard.datasets.length,
        knowledgeRows: knowledgeRows.length,
        errors,
    };
}

export function loadAssistantKnowledge() {
    if (!fs.existsSync(KNOWLEDGE_FILE)) return [] as KnowledgeRow[];

    try {
        return JSON.parse(fs.readFileSync(KNOWLEDGE_FILE, "utf-8")) as KnowledgeRow[];
    } catch {
        return [] as KnowledgeRow[];
    }
}

const regionAliases = [
    {
        label: "MAN 1 Lampung Selatan",
        aliases: ["man 1", "man 1 bandar lampung", "madrasah", "sukarame"],
    },
];

const metricAliases = [
    { label: "S3", aliases: ["s3", "strata 3", "doktor"], unit: "orang" },
    { label: "S2", aliases: ["s2", "strata 2", "magister"], unit: "orang" },
    { label: "S1", aliases: ["s1", "strata 1", "sarjana"], unit: "orang" },
    { label: "< S1", aliases: ["dibawah s1", "di bawah s1", "kurang dari s1"], unit: "orang" },
    { label: "Islam", aliases: ["islam", "muslim"], unit: "jiwa" },
    { label: "Kristen", aliases: ["kristen"], unit: "jiwa" },
    { label: "Katolik", aliases: ["katolik"], unit: "jiwa" },
    { label: "Hindu", aliases: ["hindu"], unit: "jiwa" },
    { label: "Budha", aliases: ["budha", "buddha"], unit: "jiwa" },
    { label: "Khonghucu", aliases: ["khonghucu", "konghucu"], unit: "jiwa" },
    { label: "Jumlah", aliases: ["jumlah", "total", "semua"], unit: "" },
];

function parseRowCells(rowText: string) {
    const cells: Record<string, string> = {};

    for (const part of rowText.split(";")) {
        const separatorIndex = part.indexOf(":");

        if (separatorIndex === -1) continue;

        const key = part.slice(0, separatorIndex).trim();
        const value = part.slice(separatorIndex + 1).trim();

        if (key && value) {
            cells[key] = value;
        }
    }

    return cells;
}

function parseNumericValue(value: string) {
    const normalized = value.replace(/\./g, "").replace(",", ".");
    const numeric = Number(normalized);

    return Number.isFinite(numeric) ? numeric : null;
}

function formatValue(value: string) {
    const numeric = parseNumericValue(value);

    if (numeric === null) return value;

    return new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 2,
    }).format(numeric);
}

function detectRegion(normalizedMessage: string) {
    return regionAliases.find((region) =>
        region.aliases.some((alias) => normalizedMessage.includes(alias)),
    );
}

function detectMetric(normalizedMessage: string) {
    return metricAliases.find((metric) =>
        metric.aliases.some((alias) => normalizedMessage.includes(alias)),
    );
}

function cellValue(cells: Record<string, string>, label: string) {
    const exact = Object.entries(cells).find(
        ([key]) => key.trim().toLowerCase() === label.toLowerCase(),
    );

    if (exact) return exact;

    return Object.entries(cells).find(
        ([key]) => normalizeText(key) === normalizeText(label),
    );
}

function regionMatchesRow(row: KnowledgeRow, region: (typeof regionAliases)[number]) {
    const rowText = normalizeText(row.rowText);

    return region.aliases.some((alias) => rowText.includes(alias));
}

function tableIntentScore(row: KnowledgeRow, normalizedMessage: string) {
    const tableTitle = normalizeText(row.tableTitle);
    const datasetTitle = normalizeText(row.datasetTitle);
    let score = 0;

    for (const keyword of getKeywords(normalizedMessage)) {
        if (tableTitle.includes(keyword)) score += 4;
        if (datasetTitle.includes(keyword)) score += 1;
        if (row.searchableText.includes(keyword)) score += 1;
    }

    const wantsPns = normalizedMessage.includes("pns");
    const wantsPppk = normalizedMessage.includes("pppk");
    const wantsEducation =
        normalizedMessage.includes("pendidikan") ||
        normalizedMessage.includes("lulusan") ||
        normalizedMessage.includes("kualifikasi") ||
        /\bs[123]\b/.test(normalizedMessage);

    if (wantsPns && tableTitle.includes("pns")) score += 30;
    if (wantsPns && tableTitle.includes("pppk")) score -= 20;
    if (wantsPppk && tableTitle.includes("pppk")) score += 30;
    if (wantsPppk && tableTitle.includes("pns") && !tableTitle.includes("pppk")) {
        score -= 15;
    }
    if (wantsEducation && tableTitle.includes("kualifikasi pendidikan")) {
        score += 35;
    }
    if (
        normalizedMessage.includes("penduduk") &&
        normalizedMessage.includes("agama") &&
        tableTitle.includes("penduduk") &&
        tableTitle.includes("agama")
    ) {
        score += 35;
    }
    if (normalizedMessage.includes("rumah ibadah") && tableTitle.includes("rumah ibadah")) {
        score += 35;
    }
    if (normalizedMessage.includes("ips") && datasetTitle.includes("indeks pembangunan statistik")) {
        score += 35;
    }

    return score;
}

export function answerAssistantKnowledgeQuestion(message: string): KnowledgeAnswer | null {
    const normalizedMessage = normalizeText(message);

    if (!normalizedMessage) return null;

    const isQuestion =
        normalizedMessage.includes("berapa") ||
        normalizedMessage.includes("jumlah") ||
        normalizedMessage.includes("total") ||
        normalizedMessage.includes("tampilkan") ||
        normalizedMessage.includes("berapa banyak");
    const region = detectRegion(normalizedMessage);
    const metric = detectMetric(normalizedMessage);

    if (!isQuestion || (!region && !metric)) return null;

    const rows = loadAssistantKnowledge().map<ParsedKnowledgeRow>((row) => ({
        ...row,
        cells: parseRowCells(row.rowText),
    }));

    const candidates = rows
        .map((row) => {
            let score = tableIntentScore(row, normalizedMessage);

            if (region && regionMatchesRow(row, region)) score += 45;

            if (metric && cellValue(row.cells, metric.label)) {
                score += 35;
            }

            if (normalizeText(row.rowText).includes("total")) score -= 8;

            return { ...row, score };
        })
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score);

    const best = candidates[0];

    if (!best) return null;

    const requestedMetric = metric ?? { label: "Jumlah", aliases: ["jumlah"], unit: "" };
    const metricCell = cellValue(best.cells, requestedMetric.label) ?? cellValue(best.cells, "Jumlah");
    const regionName =
        cellValue(best.cells, "Satuan Kerja")?.[1] ??
        cellValue(best.cells, "Kabupaten/Kota")?.[1] ??
        cellValue(best.cells, "Kabupaten")?.[1] ??
        cellValue(best.cells, "Wilayah")?.[1] ??
        region?.label ??
        "wilayah tersebut";

    if (!metricCell) {
        return {
            answer: `Saya menemukan baris data yang relevan, tetapi kolom ${requestedMetric.label} tidak tersedia pada ${best.tableTitle}.\n\nSumber: ${best.datasetTitle}, ${best.tableTitle}, sheet ${best.sheetName}.`,
            points: [
                `Wilayah: ${regionName}`,
                `Kolom diminta: ${requestedMetric.label}`,
                `Sumber: ${best.datasetTitle}, ${best.tableTitle}`,
            ],
            suggestions: [
                "Tampilkan data per kabupaten",
                "Ringkas dataset ini",
                "Buat poin penting pimpinan",
            ],
            matches: [best],
        };
    }

    const [metricLabel, metricValue] = metricCell;
    const unit = requestedMetric.unit ? ` ${requestedMetric.unit}` : "";
    const answer = [
        `Berdasarkan ${best.tableTitle}, ${regionName} memiliki ${metricLabel} sebanyak ${formatValue(metricValue)}${unit}.`,
        "",
        `Sumber: ${best.datasetTitle}, ${best.tableTitle}, sheet ${best.sheetName}.`,
    ].join("\n");

    return {
        answer,
        points: [
            `${metricLabel}: ${formatValue(metricValue)}${unit}`,
            `Wilayah: ${regionName}`,
            `Sumber: ${best.datasetTitle}, ${best.tableTitle}`,
        ],
        suggestions: [
            "Tampilkan data per kabupaten",
            "Ringkas dataset ini",
            "Buat poin penting pimpinan",
        ],
        matches: [best, ...candidates.slice(1, 4)],
    };
}

export function searchAssistantKnowledge(message: string, limit = 6) {
    const keywords = getKeywords(message);
    if (!keywords.length) return [];

    const normalizedMessage = normalizeText(message);
    const rows = loadAssistantKnowledge();

    return rows
        .map((row) => {
            let score = 0;

            for (const keyword of keywords) {
                if (row.searchableText.includes(keyword)) {
                    score += 1;
                }
            }

            const tableTitle = normalizeText(row.tableTitle);
            const rowText = normalizeText(row.rowText);
            const datasetTitle = normalizeText(row.datasetTitle);

            if (
                normalizedMessage.includes("penduduk") &&
                normalizedMessage.includes("islam") &&
                tableTitle.includes("penduduk") &&
                tableTitle.includes("agama")
            ) {
                score += 30;
            }

            if (
                normalizedMessage.includes("penduduk") &&
                normalizedMessage.includes("agama") &&
                tableTitle.includes("penduduk") &&
                tableTitle.includes("agama")
            ) {
                score += 25;
            }

            if (
                normalizedMessage.includes("rumah ibadah") &&
                tableTitle.includes("rumah ibadah")
            ) {
                score += 25;
            }

            if (
                normalizedMessage.includes("masjid") &&
                tableTitle.includes("masjid")
            ) {
                score += 25;
            }

            if (
                normalizedMessage.includes("lampung selatan") &&
                rowText.includes("lampung selatan")
            ) {
                score += 20;
            }

            if (
                normalizedMessage.includes("lampung barat") &&
                rowText.includes("lampung barat")
            ) {
                score += 20;
            }

            if (
                normalizedMessage.includes("pelayanan keagamaan") &&
                datasetTitle.includes("pelayanan keagamaan")
            ) {
                score += 10;
            }

            return { ...row, score };
        })
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}
