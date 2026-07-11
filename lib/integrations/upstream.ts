import type { DashboardData } from "@/lib/types";

type UpstreamConfig = {
  url?: string;
  token?: string;
};

export async function fetchUpstream<T>({ url, token }: UpstreamConfig): Promise<T | null> {
  if (!url) return null;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function buildEmisFallback(data: DashboardData) {
  const indicator = (name: string) => data.indicators.find((item) => item.name === name)?.value ?? 0;
  return {
    source: "database",
    status: "fallback",
    updatedAt: new Date().toISOString(),
    school: {
      name: "MAN 1 Bandar Lampung",
      npsn: "10648360",
      nsm: "131118710001",
      accreditation: "A",
      status: "Negeri",
      address: data.contact.address,
    },
    totals: {
      students: indicator("Peserta Didik"),
      studyGroups: indicator("Rombongan Belajar"),
    },
    rows: data.rows.filter((row) => row.category === "EMIS"),
  };
}

export function buildSimpegFallback(data: DashboardData) {
  const indicator = (name: string) => data.indicators.find((item) => item.name === name)?.value ?? 0;
  return {
    source: "database",
    status: "fallback",
    updatedAt: new Date().toISOString(),
    totals: {
      gtk: indicator("Guru dan Tenaga Kependidikan"),
      asn: indicator("Aparatur Sipil Negara"),
      certified: indicator("ASN Tersertifikasi"),
    },
    rows: data.rows.filter((row) => row.category === "SIMPEG"),
    profiles: data.activities,
  };
}
