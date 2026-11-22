const requestTimeoutMs = 12_000;
const responseCache = new Map<string, { expiresAt: number; value: unknown }>();
const inFlight = new Map<string, Promise<unknown>>();
const rateQueues = new Map<string, Promise<unknown>>();
const nextAllowedAt = new Map<string, number>();

const baseHeaders = {
  "User-Agent": "ScholarGate/1.0 (academic search interface; metadata and source links)",
  Accept: "application/json, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
};

export async function fetchText(url: string, headers: Record<string, string> = {}) {
  const response = await fetch(url, {
    headers: { ...baseHeaders, ...headers },
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  if (!response.ok) throw new Error(`Research provider returned ${response.status}`);
  return response.text();
}

export async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const response = await fetch(url, {
    headers: { ...baseHeaders, ...headers, Accept: "application/json" },
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  if (!response.ok) throw new Error(`Research provider returned ${response.status}`);
  return response.json() as Promise<T>;
}

export async function rateLimited<T>(key: string, minimumIntervalMs: number, action: () => Promise<T>): Promise<T> {
  const prior = rateQueues.get(key) ?? Promise.resolve();
  const current = prior.then(async () => {
    const delay = Math.max(0, (nextAllowedAt.get(key) ?? 0) - Date.now());
    if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
    nextAllowedAt.set(key, Date.now() + minimumIntervalMs);
    return action();
  });
  rateQueues.set(key, current.then(() => undefined, () => undefined));
  return current;
}

export async function cached<T>(key: string, ttlMs: number, action: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const existing = responseCache.get(key);
  if (existing && existing.expiresAt > now) return existing.value as T;
  if (existing) responseCache.delete(key);
  const active = inFlight.get(key);
  if (active) return active as Promise<T>;

  const pending = action().then(value => {
    responseCache.set(key, { expiresAt: Date.now() + ttlMs, value });
    return value;
  }).finally(() => inFlight.delete(key));
  inFlight.set(key, pending);
  return pending;
}

export function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function isReusableOpenLicense(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const license = value.toLowerCase();
  if (/cc[-_ ]?by[-_ ]?(nc|nd)/.test(license)) return false;
  return license.includes("creativecommons.org/licenses/by/")
    || license.includes("creativecommons.org/licenses/by-sa/")
    || license.includes("creativecommons.org/publicdomain/zero/")
    || /public[ -]domain/.test(license)
    || /^(cc[-_ ]?by|cc[-_ ]?by[-_ ]?sa|cc0)([-_ ]|$)/.test(license);
}

export function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const decoded = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
  return decoded || null;
}

export function yearFrom(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value !== "string") return null;
  const match = value.match(/\b(18\d{2}|19\d{2}|20\d{2}|21\d{2})\b/);
  return match ? Number(match[1]) : null;
}

export function normalizeDoi(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const doi = value.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");
  return /^10\.\d{4,9}\/\S+$/i.test(doi) ? doi : null;
}

export function doiUrl(doi: string): string {
  // Keep "/" inside the DOI readable; encode only characters that are unsafe in a URL path.
  return `https://doi.org/${doi.split("/").map(encodeURIComponent).join("/")}`;
}

// License values from Crossref/DOAJ are often plain http:// Creative Commons URLs or short names
// like "CC BY". They are only inspected as text here, never fetched, so http is fine.
export function licenseText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text : null;
}
