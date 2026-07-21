const LOCAL_AUTH_SECRET = "dashboard-man1-local-dev-secret-change-before-production";

export function validateAuthEnvironment() {
  if (process.env.NODE_ENV !== "production") return;

  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  const baseUrl = process.env.BETTER_AUTH_URL?.trim();
  const adminEmails = process.env.ADMIN_EMAILS?.trim();
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!secret || secret === LOCAL_AUTH_SECRET || secret.startsWith("replace-with")) {
    throw new Error("BETTER_AUTH_SECRET wajib menggunakan secret production yang kuat.");
  }
  if (!baseUrl || !isHttpUrl(baseUrl)) {
    throw new Error("BETTER_AUTH_URL wajib berupa URL production yang valid.");
  }
  if (!adminEmails) {
    throw new Error("ADMIN_EMAILS wajib diisi untuk membatasi akses administrator.");
  }
  if (!cronSecret || cronSecret.length < 32 || cronSecret.startsWith("replace-with")) {
    throw new Error("CRON_SECRET wajib menggunakan secret production minimal 32 karakter.");
  }
}

export function authSecret() {
  return process.env.BETTER_AUTH_SECRET ?? LOCAL_AUTH_SECRET;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
