import { NextResponse } from "next/server";

import { syncGis, syncWebsite } from "@/lib/integrations/sync-service";
import { websiteSyncEnabled } from "@/lib/integrations/website/client";
import { getIntegrationReadState } from "@/lib/repositories/integration-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = await getIntegrationReadState();
  const jobs: { code: "gis" | "website"; promise: Promise<unknown> }[] = [];
  const gisSource = state.sources.find((source) => source.code === "gis");
  if (isDue(gisSource?.lastSuccessAt ?? null, 24 * 60)) {
    jobs.push({ code: "gis", promise: syncGis(undefined, "scheduled") });
  }
  const websiteSource = state.sources.find((source) => source.code === "website");
  if (
    websiteSyncEnabled()
    && process.env.MAN1_WEBSITE_API_URL
    && isDue(websiteSource?.lastSuccessAt ?? null, 6 * 60)
  ) {
    jobs.push({ code: "website", promise: syncWebsite(undefined, "scheduled") });
  }
  if (!jobs.length) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      message: "Belum ada sumber otomatis yang jatuh tempo.",
    });
  }
  const settled = await Promise.allSettled(jobs.map((job) => job.promise));
  const result = Object.fromEntries(
    jobs.map((job, index) => [job.code, settledResult(settled[index])]),
  );
  const successful = settled.filter((item) => item.status === "fulfilled").length;
  return NextResponse.json(result, {
    status: successful === settled.length ? 200 : successful > 0 ? 207 : 502,
  });
}

function isDue(lastSuccessAt: string | null, intervalMinutes: number) {
  if (!lastSuccessAt) return true;
  return Date.now() - new Date(lastSuccessAt).getTime() >= intervalMinutes * 60_000;
}

function settledResult(result: PromiseSettledResult<unknown>) {
  if (result.status === "fulfilled") return { ok: true, result: result.value };
  return { ok: false, error: result.reason instanceof Error ? result.reason.message : "Sinkronisasi gagal." };
}
