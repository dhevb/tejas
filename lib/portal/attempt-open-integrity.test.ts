import assert from "node:assert/strict";
import test from "node:test";
import {
  decideOpenAttemptInsertConflict,
  interpretExpireOpenPatch,
  isPostgresUniqueViolation,
  pickCanonicalOpenAttempt,
  timeValidOpenAttempts,
} from "@/lib/portal/attempt-open-integrity";

test("timeValidOpenAttempts drops timer-elapsed open rows", () => {
  const now = Date.parse("2026-11-24T10:00:00.000Z");
  const rows = [
    { id: "a", status: "open", startedAt: "2026-11-24T09:50:00.000Z", expiresAt: "2026-11-24T10:20:00.000Z" },
    { id: "b", status: "open", startedAt: "2026-11-24T09:40:00.000Z", expiresAt: "2026-11-24T09:55:00.000Z" },
    { id: "c", status: "submitted", startedAt: "2026-11-24T09:00:00.000Z", expiresAt: "2026-11-24T10:20:00.000Z" },
  ];
  assert.deepEqual(
    timeValidOpenAttempts(rows, now).map((item) => item.id),
    ["a"],
  );
});

test("pickCanonicalOpenAttempt prefers earliest startedAt then id", () => {
  const opens = [
    { id: "z", status: "open", startedAt: "2026-11-24T09:50:00.000Z", expiresAt: "2026-11-24T10:20:00.000Z" },
    { id: "a", status: "open", startedAt: "2026-11-24T09:50:00.000Z", expiresAt: "2026-11-24T10:20:00.000Z" },
    { id: "m", status: "open", startedAt: "2026-11-24T09:40:00.000Z", expiresAt: "2026-11-24T10:20:00.000Z" },
  ];
  assert.equal(pickCanonicalOpenAttempt(opens)?.id, "m");
  assert.equal(pickCanonicalOpenAttempt([]), null);
});

test("interpretExpireOpenPatch fails closed on unexpected responses", () => {
  assert.equal(interpretExpireOpenPatch(200, [{ status: "expired" }]), "expired");
  assert.equal(interpretExpireOpenPatch(200, []), "already_closed");
  assert.equal(interpretExpireOpenPatch(204, null), "expired");
  assert.equal(interpretExpireOpenPatch(500, [{ status: "expired" }]), "failed");
  assert.equal(interpretExpireOpenPatch(200, [{ status: "open" }]), "failed");
  assert.equal(interpretExpireOpenPatch(200, { status: "expired" }), "failed");
});

test("isPostgresUniqueViolation matches PostgREST 23505 for one_open races", () => {
  assert.equal(isPostgresUniqueViolation(409, { code: "23505", message: "duplicate key value violates unique constraint" }), true);
  assert.equal(isPostgresUniqueViolation(400, { code: "23505" }), true);
  assert.equal(isPostgresUniqueViolation(409, { code: "23503" }), false);
  assert.equal(isPostgresUniqueViolation(500, { code: "23505" }), false);
  assert.equal(isPostgresUniqueViolation(409, null), false);
  assert.equal(isPostgresUniqueViolation(201, { code: "23505" }), false);
});

test("decideOpenAttemptInsertConflict reuses canonical open on 23505 loser path", () => {
  const now = Date.parse("2026-11-24T10:00:00.000Z");
  const winnerOpen = {
    id: "winner",
    status: "open",
    startedAt: "2026-11-24T09:59:00.000Z",
    expiresAt: "2026-11-24T10:30:00.000Z",
  };
  const staleOnly = {
    id: "stale",
    status: "open",
    startedAt: "2026-11-24T09:00:00.000Z",
    expiresAt: "2026-11-24T09:30:00.000Z",
  };
  const submitted = {
    id: "done",
    status: "submitted",
    startedAt: "2026-11-24T08:00:00.000Z",
    expiresAt: "2026-11-24T08:30:00.000Z",
  };

  assert.equal(
    decideOpenAttemptInsertConflict(409, { code: "23505" }, [winnerOpen, submitted], now),
    "reuse",
  );
  assert.equal(
    decideOpenAttemptInsertConflict(409, { code: "23505" }, [staleOnly, submitted], now),
    "fail",
  );
  assert.equal(
    decideOpenAttemptInsertConflict(500, { code: "23505" }, [winnerOpen], now),
    "fail",
  );
  assert.equal(
    decideOpenAttemptInsertConflict(409, { code: "PGRST116" }, [winnerOpen], now),
    "fail",
  );
  assert.equal(pickCanonicalOpenAttempt(timeValidOpenAttempts([winnerOpen, staleOnly], now))?.id, "winner");
});
