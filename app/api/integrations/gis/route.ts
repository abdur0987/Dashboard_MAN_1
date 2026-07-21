import { NextResponse } from "next/server";

import { getDashboardData } from "@/lib/services/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getDashboardData();
  const source = data.integration?.sources.find((item) => item.code === "gis") ?? null;
  return NextResponse.json({ source }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
