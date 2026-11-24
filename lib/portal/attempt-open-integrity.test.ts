import assert from "node:assert/strict";
import test from "node:test";
import {
  interpretExpireOpenPatch,
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
