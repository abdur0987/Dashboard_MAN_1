import { NextResponse } from "next/server";

import { getEmisIntegration } from "@/lib/integrations/upstream";
import { getDashboardData } from "@/lib/services/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getDashboardData({ integrate: false });
  return NextResponse.json(await getEmisIntegration(data), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
