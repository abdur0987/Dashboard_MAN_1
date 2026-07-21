import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/repositories/integration-repository";
import { authorizeAdmin } from "@/lib/security/admin";
import { getDashboardData, updateDashboardPresentation } from "@/lib/services/dashboard";
import { presentationSettingsSchema } from "@/lib/validation/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const authorization = await authorizeAdmin();
  if (!authorization.ok) {
    return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  }

  const parsed = presentationSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Pengaturan tampilan tidak valid." }, { status: 422 });
  }

  await updateDashboardPresentation(parsed.data);
  await writeAuditLog({
    actorUserId: authorization.session.user.id,
    action: "dashboard.presentation.update",
    entityType: "site_settings",
    entityId: "1",
    afterSummary: "Teks header/footer serta kontak dan lokasi kantor diperbarui.",
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  const data = await getDashboardData();
  return NextResponse.json({ contact: data.contact, siteSettings: data.siteSettings });
}
