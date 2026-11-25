/**
 * Canonical / allowlisted origins for Owner Complete Excel file hyperlinks.
 * Do not trust arbitrary x-forwarded-host / x-forwarded-proto to pick the link host.
 */

export const TEJAS_PRODUCTION_HOST = "tejas.dhe.org.in";

/** Hostnames allowed as hyperlink bases in exported workbooks. */
export function isAllowedTejasExportHost(hostWithOptionalPort: string): boolean {
  const host = hostWithOptionalPort.trim().toLowerCase().split("/")[0] ?? "";
  const hostname = host.split(":")[0] ?? "";
  if (!hostname) return false;
  if (hostname === TEJAS_PRODUCTION_HOST) return true;
  // Project Preview deployments and git-branch aliases (Vercel).
  if (/^tejas(?:-[a-z0-9]+)?-dhe-projects\.vercel\.app$/.test(hostname)) return true;
  if (/^tejas-git-[a-z0-9-]+-dhe-projects\.vercel\.app$/.test(hostname)) return true;
  // Local owner QA only.
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  return false;
}

function stripToHost(raw: string): string {
  return raw.trim().replace(/^https?:\/\//i, "").split("/")[0] ?? "";
}

function originForHost(hostWithOptionalPort: string): string {
  const host = stripToHost(hostWithOptionalPort);
  const hostname = host.split(":")[0] ?? "";
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  // Force https for Production/Preview; ignore attacker-controlled x-forwarded-proto.
  const proto = isLocal ? "http" : "https";
  return `${proto}://${host}`;
}

export type ExportOriginResult =
  | { ok: true; origin: string; source: string }
  | { ok: false; error: string };

/**
 * Resolve a verified absolute origin for Owner file hyperlinks.
 * Preference order (first allowlisted wins):
 * 1. Request `Host` header (what the browser used)
 * 2. `request.url` host
 * 3. `TEJAS_PUBLIC_ORIGIN` env (must itself be allowlisted)
 * 4. `VERCEL_URL` env (Preview) if allowlisted
 *
 * Explicitly ignores `x-forwarded-host` and `x-forwarded-proto` so an injected
 * forwarded header cannot redirect workbook links to an attacker domain.
 */
export function resolveOwnerExportOrigin(request: Request): ExportOriginResult {
  const candidates: Array<{ raw: string; source: string }> = [];
  const hostHeader = request.headers.get("host");
  if (hostHeader) candidates.push({ raw: hostHeader, source: "host-header" });
  try {
    candidates.push({ raw: new URL(request.url).host, source: "request-url" });
  } catch {
    // ignore invalid request URL
  }
  const publicOrigin = process.env.TEJAS_PUBLIC_ORIGIN?.trim();
  if (publicOrigin) candidates.push({ raw: publicOrigin, source: "TEJAS_PUBLIC_ORIGIN" });
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) candidates.push({ raw: vercelUrl, source: "VERCEL_URL" });

  for (const candidate of candidates) {
    const host = stripToHost(candidate.raw);
    if (!isAllowedTejasExportHost(host)) continue;
    return { ok: true, origin: originForHost(host), source: candidate.source };
  }

  return {
    ok: false,
    error: "Export origin is not an allowlisted TEJAS host.",
  };
}
