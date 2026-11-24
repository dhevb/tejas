/**
 * Helpers for keeping at most one time-valid open attempt per student/test.
 * Production enforces atomicity via partial unique index
 * `tejas_learn_attempts_one_open` (UNIQUE (student_id, test_id) WHERE status = 'open').
 * Application reconciliation complements that index (reuse / heal / map 23505).
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
 * Detect PostgreSQL unique_violation (23505) from PostgREST insert responses.
 * Matches `tejas_learn_attempts_one_open` races and other unique conflicts.
 */
export function isPostgresUniqueViolation(status: number, json: unknown): boolean {
  if (status !== 409 && status !== 400) return false;
  if (!json || typeof json !== "object") return false;
  const code = (json as { code?: unknown }).code;
  return code === "23505";
}

/**
 * After a failed open-attempt INSERT, decide whether the loser may safely
 * adopt an existing time-valid open (unique-index conflict) or must fail closed.
 * - reuse: HTTP indicates unique violation AND a time-valid open exists
 * - fail: any other insert failure, or unique violation with no recoverable open
 */
export function decideOpenAttemptInsertConflict(
  status: number,
  json: unknown,
  attempts: OpenAttemptRef[],
  now = Date.now(),
): "reuse" | "fail" {
  if (!isPostgresUniqueViolation(status, json)) return "fail";
  return pickCanonicalOpenAttempt(timeValidOpenAttempts(attempts, now)) ? "reuse" : "fail";
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
