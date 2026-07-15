import { NextResponse } from "next/server";

import { getSimpegIntegration } from "@/lib/integrations/upstream";
import { getDashboardData } from "@/lib/services/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getDashboardData({ integrate: false });
  return NextResponse.json(await getSimpegIntegration(data), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
