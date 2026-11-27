/**
 * Helpers for Owner-authenticated registration file downloads.
 * Does not weaken auth: only validates safe return paths after Owner login.
 */

const REFERENCE_RE = /^TEJAS-2026-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{20}$/;

/** True when the browser is navigating to the URL (Excel link / address bar), not an XHR/fetch. */
export function isBrowserNavigationRequest(request: Request): boolean {
  const mode = (request.headers.get("sec-fetch-mode") ?? "").toLowerCase();
  if (mode === "navigate") return true;
  const accept = (request.headers.get("accept") ?? "").toLowerCase();
  if (accept.includes("text/html")) return true;
  return false;
}

/**
 * Allow only same-app Owner file download paths as post-login return targets.
 * Rejects open redirects and unrelated APIs.
 */
export function parseOwnerFileDownloadPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let pathWithQuery = raw.trim();
  try {
    if (/^https?:\/\//i.test(pathWithQuery)) {
      const url = new URL(pathWithQuery);
      pathWithQuery = `${url.pathname}${url.search}`;
    }
  } catch {
    return null;
  }
  if (!pathWithQuery.startsWith("/")) return null;
  if (pathWithQuery.includes("\\") || pathWithQuery.includes("..")) return null;

  let url: URL;
  try {
    url = new URL(pathWithQuery, "https://tejas.invalid");
  } catch {
    return null;
  }
  const parts = url.pathname.split("/").filter(Boolean);
  // api / register / admin / registrations / {reference} / file
  if (
    parts.length !== 6 ||
    parts[0] !== "api" ||
    parts[1] !== "register" ||
    parts[2] !== "admin" ||
    parts[3] !== "registrations" ||
    parts[5] !== "file"
  ) {
    return null;
  }
  const reference = parts[4]!;
  if (!REFERENCE_RE.test(reference)) return null;

  const kind = url.searchParams.get("kind");
  if (kind == null) {
    return `/api/register/admin/registrations/${reference}/file`;
  }
  if (kind === "upload" || kind === "receipt" || kind === "consolidated") {
    return `/api/register/admin/registrations/${reference}/file?kind=${kind}`;
  }
  return null;
}

export function ownerFileAuthRequiredHtml(loginHref: string): string {
  const safeHref = loginHref.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>Owner sign-in required · TEJAS</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; background: #f5f5f4; color: #1c1917; }
    main { max-width: 36rem; margin: 3rem auto; padding: 1.5rem; background: #fff; border-radius: 1rem; border: 1px solid #e7e5e4; }
    h1 { font-size: 1.25rem; margin: 0 0 0.75rem; }
    p { line-height: 1.5; margin: 0 0 0.75rem; color: #44403c; }
    a { color: #1d4ed8; font-weight: 600; }
  </style>
</head>
<body>
  <main>
    <h1>Owner sign-in required</h1>
    <p>This file download is Owner-only. Opening a link from Excel or another app does not send your Owner session unless you are already signed in on this website in this browser.</p>
    <p>Sign in on the registration review page, then the download will continue automatically.</p>
    <p><a href="${safeHref}">Open Owner registration review and continue download</a></p>
  </main>
</body>
</html>`;
}
