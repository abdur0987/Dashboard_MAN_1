import { buildEmisAuthContext } from "@/lib/integrations/emis/auth";
import { emisEndpoints } from "@/lib/integrations/emis/endpoints";
import { normalizeEmisPayload } from "@/lib/integrations/emis/normalizer";
import { fetchJsonWithRetry, joinUrl, UpstreamError } from "@/lib/integrations/shared";

export async function fetchEmisSnapshot() {
  const baseUrl = process.env.EMIS_PUBLIC_URL_API?.trim();
  if (!baseUrl) throw new UpstreamError("EMIS_PUBLIC_URL_API belum dikonfigurasi.");
  const nsm = process.env.EMIS_NSM ?? "131118010001";
  const auth = await buildEmisAuthContext(baseUrl);
  const endpoints = emisEndpoints();
  const identityUrl = new URL(joinUrl(baseUrl, endpoints.institutionByNsm));
  identityUrl.searchParams.set("nsm", nsm);
  const identity = await fetchJsonWithRetry(identityUrl.toString(), { headers: auth.headers }, { timeoutMs: 15_000, retries: 1 });
  const summary = endpoints.studentSummary
    ? await fetchJsonWithRetry(joinUrl(baseUrl, endpoints.studentSummary), { headers: auth.headers }, { timeoutMs: 20_000, retries: 1 })
    : undefined;
  return normalizeEmisPayload(identity, summary);
}
