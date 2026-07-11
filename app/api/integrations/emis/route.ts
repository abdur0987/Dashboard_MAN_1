import { NextResponse } from "next/server";

import { buildEmisFallback, fetchUpstream } from "@/lib/integrations/upstream";
import { getDashboardData } from "@/lib/services/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const upstream = await fetchUpstream<unknown>({
    url: process.env.EMIS_API_URL,
    token: process.env.EMIS_API_TOKEN,
  });

  if (upstream) return NextResponse.json({ source: "emis-api", status: "live", data: upstream });
  return NextResponse.json(buildEmisFallback(await getDashboardData()));
}
