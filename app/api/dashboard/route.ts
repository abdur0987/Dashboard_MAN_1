import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { ensureDatabaseReady } from "@/lib/db/migrate";
import { getDashboardData, replaceDashboardData } from "@/lib/services/dashboard";
import type { DashboardData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getDashboardData();

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

export async function PUT(request: Request) {
  await ensureDatabaseReady();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as DashboardData;
  await replaceDashboardData(payload);

  return NextResponse.json(await getDashboardData());
}
