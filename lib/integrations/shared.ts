export function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export async function fetchJsonWithRetry(url: string, init: RequestInit, options: { timeoutMs: number; retries?: number }) {
  const retries = options.retries ?? 1;
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(options.timeoutMs) });
      if (!response.ok) throw new UpstreamError(`Upstream merespons HTTP ${response.status}.`, response.status);
      return await response.json() as unknown;
    } catch (error) {
      lastError = error;
      if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Upstream tidak dapat dihubungi.");
}

export class UpstreamError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "UpstreamError";
  }
}

export function sanitizedError(error: unknown) {
  const message = error instanceof Error ? error.message : "Upstream error";
  return message
    .replace(/bearer\s+[a-z0-9._-]+/gi, "Bearer [REDACTED]")
    .replace(/(password|private[_-]?key|token)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]")
    .slice(0, 500);
}
