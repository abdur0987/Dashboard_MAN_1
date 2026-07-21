import { NextResponse } from "next/server";

import { syncMirror, SyncServiceError } from "@/lib/integrations/sync-service";
import { writeAuditLog } from "@/lib/repositories/integration-repository";
import { authorizeAdmin } from "@/lib/security/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authorization = await authorizeAdmin();
  if (!authorization.ok) {
    return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  }
  try {
    const result = await syncMirror(authorization.session.user.id);
    await writeAuditLog({
      actorUserId: authorization.session.user.id,
      action: "sync.mirror",
      entityType: "integration",
      entityId: "mirror",
      afterSummary: `Sync ${result.status}`,
      ipAddress: clientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SyncServiceError) {
      return NextResponse.json({ error: error.message, runId: error.runId }, { status: 502 });
    }
    return NextResponse.json({ error: "Sinkronisasi database mitra lokal gagal." }, { status: 500 });
  }
}

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || undefined;
}
