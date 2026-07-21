import { NextResponse } from "next/server";

import { getIntegrationReadState } from "@/lib/repositories/integration-repository";
import { authorizeAdmin } from "@/lib/security/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authorization = await authorizeAdmin();
  if (!authorization.ok) return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  const state = await getIntegrationReadState();
  return NextResponse.json({ runs: state.recentRuns }, { headers: { "Cache-Control": "private, no-store" } });
}
