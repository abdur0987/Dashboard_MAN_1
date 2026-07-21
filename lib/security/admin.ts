import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export type AdminAuthorization =
  | { ok: true; session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>> }
  | { ok: false; status: 401 | 403; error: string };

export async function authorizeAdmin(): Promise<AdminAuthorization> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, status: 401, error: "Unauthorized" };

  if (!isAdminEmail(session.user.email)) {
    return { ok: false, status: 403, error: "Akun ini tidak memiliki akses administrator." };
  }

  return { ok: true, session };
}

export function isAdminEmail(email: string) {
  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (!allowlist.length) return process.env.NODE_ENV !== "production";
  return allowlist.includes(email.trim().toLowerCase());
}
