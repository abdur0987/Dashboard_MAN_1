import type { ActivitySlide, DashboardData, DashboardRow, Indicator } from "@/lib/types";

const SCHOOL = {
  name: "MAN 1 Lampung Selatan",
  npsn: "10816233",
  nsm: "131118010001",
  accreditation: "B",
  status: "Negeri",
  address: "Jl. Soekarno Hatta, Jati, Wayurang, Kalianda, Lampung Selatan",
};

const CACHE_TTL_MS = 5 * 60 * 1000;

type EmisIdentity = {
  id?: number;
  statistic_num?: string;
  npsn?: string;
  name?: string;
  institution_category_id?: number;
  is_registered?: number;
};

type EmisResponse = {
  success?: boolean;
  results?: EmisIdentity | null;
};

type SimpegEmployee = {
  NAMA?: string;
  NAMA_LENGKAP?: string;
  PENDIDIKAN?: string;
  TAMPIL_JABATAN?: string;
  LEVEL_JABATAN?: string;
  SATUAN_KERJA?: string;
  STATUS_PEGAWAI?: string;
  NSM?: string;
  NPSN?: string;
};

type SimpegLoginResponse = {
  status?: boolean;
  token?: string;
};

type SimpegEmployeeResponse = {
  total?: number;
  size?: number;
  data?: SimpegEmployee[];
};

export type EmisIntegration = Omit<ReturnType<typeof buildEmisFallback>, "source" | "status"> & {
  source: "emis-api" | "database";
  status: "live" | "fallback";
  identity?: EmisIdentity;
};

export type SimpegProfile = {
  name: string;
  role: string;
  status: string;
  education: string;
};

export type SimpegIntegration = Omit<ReturnType<typeof buildSimpegFallback>, "source" | "status"> & {
  source: "simpeg-api" | "database";
  status: "live" | "fallback";
  profiles: SimpegProfile[];
  employment: { pns: number; pppk: number };
  education: { s2: number; s1: number; diploma: number; other: number };
  upstreamTotal?: number;
  upstreamPageSize?: number;
};

type IntegrationCache = {
  expiresAt: number;
  value: Promise<{ emis: EmisIntegration; simpeg: SimpegIntegration }>;
};

let integrationCache: IntegrationCache | null = null;

export async function getIntegratedDashboardData(data: DashboardData): Promise<DashboardData> {
  const { emis, simpeg } = await getIntegrations(data);
  const indicators = patchIndicators(data.indicators, emis, simpeg);
  const rows = patchRows(data.rows, simpeg);

  return {
    ...data,
    indicators,
    rows,
    chartSeries: data.chartSeries.map((point) => ({
      ...point,
      EMIS: indicatorValue(indicators, "Peserta Didik"),
      SIMPEG: indicatorValue(indicators, "Guru dan Tenaga Kependidikan"),
    })),
    activities: patchActivities(data.activities, simpeg.profiles),
  };
}

export async function getEmisIntegration(data: DashboardData) {
  return fetchEmis(data);
}

export async function getSimpegIntegration(data: DashboardData) {
  return fetchSimpeg(data);
}

export function clearIntegrationCache() {
  integrationCache = null;
}

export function buildEmisFallback(data: DashboardData) {
  const indicator = (name: string) => indicatorValue(data.indicators, name);
  return {
    source: "database" as const,
    status: "fallback" as const,
    updatedAt: new Date().toISOString(),
    school: SCHOOL,
    totals: {
      students: indicator("Peserta Didik"),
      studyGroups: indicator("Rombongan Belajar"),
    },
    rows: data.rows.filter((row) => row.category === "EMIS"),
  };
}

export function buildSimpegFallback(data: DashboardData) {
  const indicator = (name: string) => indicatorValue(data.indicators, name);
  return {
    source: "database" as const,
    status: "fallback" as const,
    updatedAt: new Date().toISOString(),
    totals: {
      gtk: indicator("Guru dan Tenaga Kependidikan"),
      asn: indicator("Aparatur Sipil Negara"),
      certified: indicator("ASN Tersertifikasi"),
    },
    rows: data.rows.filter((row) => row.category === "SIMPEG"),
    profiles: [] as SimpegProfile[],
    employment: {
      pns: rowValue(data.rows, "PNS"),
      pppk: rowValue(data.rows, "PPPK"),
    },
    education: {
      s2: rowValue(data.rows, "Pendidikan S2"),
      s1: rowValue(data.rows, "Pendidikan S1 / D4"),
      diploma: rowValue(data.rows, "Pendidikan Diploma"),
      other: 0,
    },
  };
}

async function getIntegrations(data: DashboardData) {
  if (integrationCache && integrationCache.expiresAt > Date.now()) return integrationCache.value;

  const value = Promise.all([fetchEmis(data), fetchSimpeg(data)]).then(([emis, simpeg]) => ({ emis, simpeg }));
  integrationCache = { expiresAt: Date.now() + CACHE_TTL_MS, value };
  return value;
}

async function fetchEmis(data: DashboardData): Promise<EmisIntegration> {
  const fallback = buildEmisFallback(data);
  const baseUrl = firstValue(process.env.EMIS_PUBLIC_URL_API, process.env.EMIS_API_URL);
  if (!baseUrl) return fallback;

  try {
    const endpoint = joinUrl(baseUrl, "institutions/list-by-nsm");
    const response = await fetch(`${endpoint}?nsm=${encodeURIComponent(SCHOOL.nsm)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return fallback;

    const payload = (await response.json()) as EmisResponse;
    if (!payload.success || !payload.results) return fallback;

    return {
      ...fallback,
      source: "emis-api",
      status: "live",
      identity: payload.results,
      school: {
        ...SCHOOL,
        name: payload.results.name || SCHOOL.name,
        npsn: payload.results.npsn || SCHOOL.npsn,
        nsm: payload.results.statistic_num || SCHOOL.nsm,
      },
    };
  } catch {
    return fallback;
  }
}

async function fetchSimpeg(data: DashboardData): Promise<SimpegIntegration> {
  const fallback = buildSimpegFallback(data);
  const baseUrl = firstValue(process.env.SIMPEG_PUBLIC_URL_API, process.env.SIMPEG_API_URL);
  const email = firstValue(process.env.SIMPEG_PUBLIC_EMAIL, process.env.SIMPEG_API_EMAIL);
  const password = firstValue(process.env.SIMPEG_PUBLIC_PASSWORD, process.env.SIMPEG_API_PASSWORD);
  if (!baseUrl || !email || !password) return fallback;

  try {
    const loginResponse = await fetch(joinUrl(baseUrl, "auth/login"), {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ email, password }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!loginResponse.ok) return fallback;

    const login = (await loginResponse.json()) as SimpegLoginResponse;
    if (!login.status || !login.token) return fallback;

    const employeesResponse = await fetch(joinUrl(baseUrl, "pegawai"), {
      headers: { Accept: "application/json", Authorization: `Bearer ${login.token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!employeesResponse.ok) return fallback;

    const payload = (await employeesResponse.json()) as SimpegEmployeeResponse;
    const employees = (payload.data || []).filter(isSchoolEmployee);
    if (!employees.length) return fallback;

    const profiles = employees.slice(0, 3).map(toSafeProfile);
    const pns = countBy(employees, (employee) => normalize(employee.STATUS_PEGAWAI) === "pns");
    const pppk = countBy(employees, (employee) => normalize(employee.STATUS_PEGAWAI).includes("pppk"));
    const education = {
      s2: countBy(employees, (employee) => /(^|\W)s[ -]?2(\W|$)|magister/i.test(employee.PENDIDIKAN || "")),
      s1: countBy(employees, (employee) => /(^|\W)s[ -]?1(\W|$)|sarjana/i.test(employee.PENDIDIKAN || "")),
      diploma: countBy(employees, (employee) => /(^|\W)d[ -]?[1-4](\W|$)|diploma/i.test(employee.PENDIDIKAN || "")),
      other: 0,
    };
    education.other = Math.max(0, employees.length - education.s2 - education.s1 - education.diploma);

    return {
      ...fallback,
      source: "simpeg-api",
      status: "live",
      updatedAt: new Date().toISOString(),
      totals: { gtk: employees.length, asn: employees.length, certified: fallback.totals.certified },
      profiles,
      employment: { pns, pppk },
      education,
      upstreamTotal: payload.total,
      upstreamPageSize: payload.size,
    };
  } catch {
    return fallback;
  }
}

function patchIndicators(indicators: Indicator[], emis: EmisIntegration, simpeg: SimpegIntegration) {
  return indicators.map((indicator) => {
    if (indicator.name === "Peserta Didik" && emis.status === "live") {
      return { ...indicator, source: "EMIS / identitas madrasah terverifikasi", status: "aktif" as const };
    }
    if (indicator.name === "Guru dan Tenaga Kependidikan" && simpeg.status === "live") {
      return { ...indicator, value: simpeg.totals.gtk, source: "SIMPEG API / profil yang cocok dengan NPSN atau NSM", status: "perlu-validasi" as const };
    }
    if (indicator.name === "Aparatur Sipil Negara" && simpeg.status === "live") {
      return { ...indicator, value: simpeg.totals.asn, source: "SIMPEG API / profil yang cocok dengan NPSN atau NSM", status: "perlu-validasi" as const };
    }
    return indicator;
  });
}

function patchRows(rows: DashboardRow[], simpeg: SimpegIntegration) {
  if (simpeg.status !== "live") return rows;
  const values = new Map<string, number>([
    ["PNS", simpeg.employment.pns],
    ["PPPK", simpeg.employment.pppk],
    ["Pendidikan S2", simpeg.education.s2],
    ["Pendidikan S1 / D4", simpeg.education.s1],
    ["Pendidikan Diploma", simpeg.education.diploma],
  ]);

  return rows.map((row) => values.has(row.indicator)
    ? { ...row, value: values.get(row.indicator) || 0, source: "SIMPEG API / data aman yang telah dinormalisasi" }
    : row);
}

function patchActivities(activities: ActivitySlide[], profiles: SimpegProfile[]) {
  const head: ActivitySlide = {
    id: 1,
    title: "Dr. H. Yayuk Dwi Wahyuni, S.Pd.I., M.Ag.",
    caption: "Kepala MAN 1 Lampung Selatan",
    imageUrl: "/brand/man1/kepala-yayuk-dwi-wahyuni.jpeg",
  };
  if (!profiles.length) return [head, ...activities.filter((item) => item.id !== 1)].slice(0, 4);

  return [
    head,
    ...profiles.map((profile, index) => ({
      id: index + 2,
      title: titleCase(profile.name),
      caption: `${profile.role} • ${profile.status}`,
      imageUrl: "/brand/man1/logo.png",
    })),
  ].slice(0, 4);
}

function isSchoolEmployee(employee: SimpegEmployee) {
  return employee.NPSN === SCHOOL.npsn
    || employee.NSM === SCHOOL.nsm
    || normalize(employee.SATUAN_KERJA).includes("man 1 lampung selatan");
}

function toSafeProfile(employee: SimpegEmployee): SimpegProfile {
  return {
    name: employee.NAMA_LENGKAP || employee.NAMA || "ASN MAN 1 Lampung Selatan",
    role: employee.TAMPIL_JABATAN || employee.LEVEL_JABATAN || "ASN",
    status: employee.STATUS_PEGAWAI || "ASN",
    education: employee.PENDIDIKAN || "Belum tersedia",
  };
}

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function firstValue(...values: (string | undefined)[]) {
  return values.find((value) => value?.trim())?.trim();
}

function normalize(value: string | undefined) {
  return (value || "").trim().toLowerCase();
}

function countBy<T>(items: T[], predicate: (item: T) => boolean) {
  return items.reduce((total, item) => total + (predicate(item) ? 1 : 0), 0);
}

function titleCase(value: string) {
  return value
    .toLocaleLowerCase("id-ID")
    .replace(/(^|[\s.,'-])([a-zà-ÿ])/g, (_, separator: string, letter: string) => `${separator}${letter.toLocaleUpperCase("id-ID")}`)
    .replace(/\bMm\b/g, "M.M.");
}

function indicatorValue(indicators: Indicator[], name: string) {
  return indicators.find((item) => item.name === name)?.value ?? 0;
}

function rowValue(rows: DashboardRow[], name: string) {
  return rows.find((item) => item.indicator === name)?.value ?? 0;
}
