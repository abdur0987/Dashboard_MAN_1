import { emisEndpoints } from "@/lib/integrations/emis/endpoints";
import { fetchJsonWithRetry, joinUrl, UpstreamError } from "@/lib/integrations/shared";

export type EmisAuthContext = {
  method: string;
  headers: Record<string, string>;
  query?: Record<string, string>;
};

type AuthMode = "none" | "headers" | "partner-login" | "custom";

export async function buildEmisAuthContext(baseUrl: string): Promise<EmisAuthContext> {
  const mode = (process.env.EMIS_AUTH_MODE ?? "none") as AuthMode;
  if (mode === "none") return { method: "none", headers: { Accept: "application/json" } };

  const publicKey = process.env.EMIS_PUBLIC_KEY?.trim();
  const privateKey = process.env.EMIS_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) throw new UpstreamError("EMIS public/private key belum dikonfigurasi.");

  if (mode === "headers") {
    const publicHeader = process.env.EMIS_AUTH_PUBLIC_HEADER?.trim();
    const privateHeader = process.env.EMIS_AUTH_PRIVATE_HEADER?.trim();
    if (!publicHeader || !privateHeader) {
      throw new UpstreamError("Nama header EMIS belum dikonfigurasi; adapter tidak akan menebaknya.");
    }
    return {
      method: "headers",
      headers: { Accept: "application/json", [publicHeader]: publicKey, [privateHeader]: privateKey },
    };
  }

  if (mode === "partner-login") {
    const format = process.env.EMIS_PARTNER_LOGIN_FORMAT ?? "json";
    if (format !== "json" && format !== "form") {
      throw new UpstreamError("EMIS_PARTNER_LOGIN_FORMAT harus diisi json atau form sesuai kontrak resmi.");
    }
    const publicField = process.env.EMIS_PARTNER_PUBLIC_FIELD?.trim() || "public_key";
    const privateField = process.env.EMIS_PARTNER_PRIVATE_FIELD?.trim() || "private_key";
    const values = { [publicField]: publicKey, [privateField]: privateKey };
    const payload = await fetchJsonWithRetry(joinUrl(baseUrl, emisEndpoints().partnerLogin), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": format === "json" ? "application/json" : "application/x-www-form-urlencoded",
      },
      body: format === "json" ? JSON.stringify(values) : new URLSearchParams(values),
    }, { timeoutMs: 15_000, retries: 1 });
    const tokenPath = process.env.EMIS_PARTNER_TOKEN_PATH?.trim() || "results.token";
    const token = readPath(payload, tokenPath);
    if (typeof token !== "string" || !token) throw new UpstreamError("Partner login EMIS tidak menghasilkan token pada path yang dikonfigurasi.");
    return { method: "partner-login", headers: { Accept: "application/json", Authorization: `Bearer ${token}` } };
  }

  throw new UpstreamError("EMIS custom auth belum diimplementasikan tanpa dokumentasi kontrak resmi.");
}

function readPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}
