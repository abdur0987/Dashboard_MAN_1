import { fetchJsonWithRetry, joinUrl, UpstreamError } from "@/lib/integrations/shared";

export async function loginSimpeg(baseUrl: string) {
  const email = process.env.SIMPEG_PUBLIC_EMAIL?.trim();
  const password = process.env.SIMPEG_PUBLIC_PASSWORD?.trim();
  if (!email || !password) throw new UpstreamError("Credential SIMPEG belum dikonfigurasi.");
  const payload = await fetchJsonWithRetry(joinUrl(baseUrl, "auth/login"), {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ email, password }),
  }, { timeoutMs: 15_000, retries: 1 });
  const value = payload as { status?: boolean; token?: string };
  if (!value.status || !value.token) throw new UpstreamError("Login SIMPEG tidak menghasilkan token.");
  return value.token;
}
