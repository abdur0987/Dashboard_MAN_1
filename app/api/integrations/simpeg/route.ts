import { NextResponse } from "next/server";

import { getDashboardData } from "@/lib/services/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getDashboardData();
  const sourceCode = data.integration?.simpeg?.sourceCode;
  const operationalCode = sourceCode === "mirror" ? "database"
    : sourceCode === "gis" || sourceCode === "website" ? sourceCode
      : null;
  const source = operationalCode
    ? data.integration?.sources.find((item) => item.code === operationalCode) ?? null
    : null;
  return NextResponse.json({ source, snapshot: data.integration?.simpeg ?? null }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
