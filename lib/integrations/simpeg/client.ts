import { loginSimpeg } from "@/lib/integrations/simpeg/auth";
import { normalizeSimpegEmployees } from "@/lib/integrations/simpeg/normalizer";
import { fetchAllSimpegEmployees } from "@/lib/integrations/simpeg/pagination";
import { UpstreamError } from "@/lib/integrations/shared";

export async function fetchSimpegSnapshot() {
  const baseUrl = process.env.SIMPEG_PUBLIC_URL_API?.trim();
  if (!baseUrl) throw new UpstreamError("SIMPEG_PUBLIC_URL_API belum dikonfigurasi.");
  const token = await loginSimpeg(baseUrl);
  return normalizeSimpegEmployees(await fetchAllSimpegEmployees(baseUrl, token));
}
