/**
 * Helpers for keeping at most one time-valid open attempt per student/test.
 * Application-level reconciliation is best-effort; Production still needs a
 * partial unique index / RPC for true atomicity under concurrency.
 */

export type OpenAttemptRef = {
  id: string;
  startedAt: string;
  expiresAt: string;
  status: string;
};

/** Open rows that are still within the allowed timer window. */
export function timeValidOpenAttempts<T extends OpenAttemptRef>(attempts: T[], now = Date.now()): T[] {
  return attempts.filter((item) => item.status === "open" && new Date(item.expiresAt).getTime() > now);
}

/** Deterministic survivor when multiple time-valid opens exist. */
export function pickCanonicalOpenAttempt<T extends OpenAttemptRef>(opens: T[]): T | null {
  if (!opens.length) return null;
  return [...opens].sort((a, b) => {
    const byStart = a.startedAt.localeCompare(b.startedAt);
    if (byStart !== 0) return byStart;
    return a.id.localeCompare(b.id);
  })[0] ?? null;
}

/**
 * Interpret a PATCH ...&status=eq.open Prefer: return=representation response.
 * - expired: row updated to expired
 * - already_closed: filter matched no open row (another writer closed it)
 * - failed: HTTP error or unexpected body — callers must fail closed
 */
export function interpretExpireOpenPatch(status: number, json: unknown): "expired" | "already_closed" | "failed" {
  if (status !== 200 && status !== 204) return "failed";
  if (status === 204 || json === null) return "expired";
  if (!Array.isArray(json)) return "failed";
  if (json.length === 0) return "already_closed";
  const row = json[0];
  if (!row || typeof row !== "object") return "failed";
  const next = (row as { status?: unknown }).status;
  return next === "expired" ? "expired" : "failed";
}
