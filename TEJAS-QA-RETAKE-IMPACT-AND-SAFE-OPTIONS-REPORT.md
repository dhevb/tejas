# TEJAS — QA Retake Capability Impact Analysis (Read-Only)

**Date:** 24 November 2026 (IST)  
**Mode:** READ-ONLY investigation — no Production changes, no new attempts, no deploys, no merges  
**Production deployment (reference, unchanged):** `dpl_5rKcZW5JNbd3PNfcJBzsdiZAYLci` @ `90e70c5`  
**Gap:** 8 Future Tech mocks still lack scored-submit evidence (overall **82/90**)

Remaining test IDs:

`ft-b1-mt01`, `ft-b1-mt04`, `ft-b1-mt05`, `ft-b2-mt01`, `ft-b2-mt02`, `ft-b2-mt03`, `ft-b2-mt04`, `ft-b2-mt05`

---

## Recommendation (executive)

| Classification | Value |
|----------------|-------|
| **Primary recommendation** | **REQUIRES OWNER APPROVAL** — implement **Option A (QA-account-only retake)** via a small code change + review/deploy, then run the 8 submits |
| **Immediately available without Production change** | **Option D (partial)** — offline/unit validation of scoring for the 8 catalog tests using `scoreAnswers` — does **not** produce Production scored-submit evidence |
| **Global retake flag (Option C)** | **NOT RECOMMENDED** for Production as a standing or casual toggle |
| **Isolated QA environment (Option B)** | **REQUIRES OWNER APPROVAL** — safest long-term isolation, but **not** supported as a ready-made facility today |

**QA-only retakes are not technically supported by the current architecture** without a code change. `TEJAS_PORTAL_RETAKES` is a **global** env flag only.

**This investigation:** no attempts created; no Production configuration changed; no deployment or migration; student/payment records untouched.

---

## 1. Current implementation findings

### 1.1 What `TEJAS_PORTAL_RETAKES` controls

| Property | Finding |
|----------|---------|
| Shape | Environment variable compared to the literal string `"allow"` |
| Scope | **Global** for the entire portal process (all learners) |
| Account-specific? | **No** — no email, role, or `contentQa` check |
| Default | Closed / denied when unset or any value other than `allow` |

Remote (Production) path:

```379:396:lib/portal/remote-store.ts
export function retakesAllowed(): boolean {
  return process.env.TEJAS_PORTAL_RETAKES === "allow";
}

export async function remoteStartAttempt(student: PortalStudent, testId: string) {
  // ...
  const open = attempts.find((item) => item.status === "open" && new Date(item.expiresAt).getTime() > Date.now());
  if (open) return { ok: true as const, attemptId: open.id, /* ... */ };
  if (!retakesAllowed() && attempts.some((item) => item.status === "submitted" || item.status === "expired" || item.status === "open")) {
    return { ok: false as const, error: "Another attempt is not open. A retake has not been approved." };
  }
  // else INSERT new attempt
}
```

Local/file-store path (tests / non-remote):

```925:932:lib/portal/store.ts
    const open = mine.find((attempt) => attempt.status === "open");
    if (open && new Date(open.expiresAt).getTime() > now) {
      return { ok: true as const, attemptId: open.id, /* ... */ };
    }
    if (open) open.status = "expired";
    if (process.env.TEJAS_PORTAL_RETAKES !== "allow" && mine.length > 0) {
      // deny retake
```

### 1.2 Content-QA vs retakes

`isContentQaAccount` (`lib/portal/content-qa.ts`) only affects:

- Visibility of all published books/tests
- Payment / stream / class skip for published content

It does **not** alter retake rules. QA is subject to the same attempt-limit logic as any student.

### 1.3 Attempt lifecycle and expiry

| State | Behaviour |
|-------|-----------|
| `open` and `expires_at` in future | Start **reuses** that attempt (no new row) |
| `open` but `expires_at` in past | **Not** reused; still counted as a blocking prior attempt when retakes are off |
| Submit after expiry | PATCH status → `expired`; return error (no score written) |
| `submitted` | Closed; second submit on same id fails (`status !== "open"`) |
| New attempt when retakes off | Denied if any prior row exists for `(student_id, test_id)` with status `submitted`, `expired`, or `open` |

There is **no** staff “approve retake” API or table in the current codebase. Docs (`docs/PORTAL_FINAL_SECURITY_READINESS_REPORT.md`) state retakes stay closed unless `TEJAS_PORTAL_RETAKES=allow`.

### 1.4 Enforcement: server-side vs UI

| Layer | Enforcement |
|-------|-------------|
| API `POST /api/learn/tests/[testId]` | Calls `startAttempt` → remote/file store (`app/api/learn/tests/[testId]/route.ts`) |
| API submit | Calls `submitAttempt` / `remoteSubmitAttempt` |
| UI | Cannot bypass; denial is server-side |

### 1.5 Overwrite / duplicate risks

| Topic | Finding |
|-------|---------|
| Overwrite prior score | Submit only updates rows with `status=eq.open`. Submitted scores are **not** overwritten by a later submit on the same attempt. |
| New retake when allowed | Creates a **new** attempt row (`uuid` PK). Prior submitted rows remain. Dashboard/history can show multiple attempts; “latest” semantics are app-defined. |
| Unique `(student_id, test_id)` | **No** unique DB constraint in `supabase/migrations/20261118000100_tejas_learning_portal.sql` — uniqueness is **application-enforced**. Concurrent starts while retakes are allowed could insert multiple `open` rows (race). Local file store uses `withLock`; remote path does not use an advisory lock. |
| Payments / entitlements | Retake flag does not touch payment or entitlement tables. |

### 1.6 Unit-test evidence of closed retakes

`lib/portal/portal.test.ts` asserts that after a successful submit, a second `startAttempt` fails when retakes are not allowed (uses Future Tech `ft-b2-mt01`).

---

## 2. Remaining eight tests — catalog check (no attempts created)

| Test ID | Exists | Book | Stream | Classes | Qs | Keys | 4 options | Time |
|---------|:------:|------|--------|---------|---:|-----:|:---------:|-----:|
| `ft-b1-mt01` | Yes | `ft-book-1` | TEJAS Future Tech | 6–8 | 25 | 25 | Yes | 30m |
| `ft-b1-mt04` | Yes | `ft-book-1` | TEJAS Future Tech | 6–8 | 25 | 25 | Yes | 30m |
| `ft-b1-mt05` | Yes | `ft-book-1` | TEJAS Future Tech | 6–8 | 25 | 25 | Yes | 30m |
| `ft-b2-mt01` | Yes | `ft-book-2` | TEJAS Future Tech | 9–10 | 25 | 25 | Yes | 30m |
| `ft-b2-mt02` | Yes | `ft-book-2` | TEJAS Future Tech | 9–10 | 25 | 25 | Yes | 30m |
| `ft-b2-mt03` | Yes | `ft-book-2` | TEJAS Future Tech | 9–10 | 25 | 25 | Yes | 30m |
| `ft-b2-mt04` | Yes | `ft-book-2` | TEJAS Future Tech | 9–10 | 25 | 25 | Yes | 30m |
| `ft-b2-mt05` | Yes | `ft-book-2` | TEJAS Future Tech | 9–10 | 25 | 25 | Yes | 30m |

- Live publication of FT books/tests was previously verified (staff + `/learn`); catalog default `publicationStatus` field may still say awaiting — **overrides** come from `tejas_learn_publication`.
- **No** scored-submit evidence found for these eight in prior QA evidence files.
- Expired / stale `open` QA attempts **cannot** be safely reused under current rules (past `expires_at` → submit expires without score; start refuses retake).

---

## 3. Option comparison

### Option A — QA-account-only retake permission

| Aspect | Assessment |
|--------|------------|
| Supported today? | **No** — would require a code change |
| Required changes | Extend `retakesAllowed()` (or the start gate) to also allow when `isContentQaAccount(student.email)`; keep global env default closed; add unit tests; PR + Production deploy |
| Affected accounts | Only email matching `TEJAS_CONTENT_QA_EMAIL` |
| Security | Low blast radius if limited to content-QA identity; must not grant staff/payment powers (already separate) |
| Data integrity | New attempt rows for QA only; prior QA/student scores untouched; concurrent QA starts still theoretically racy (same as global allow) |
| Rollback | Revert deploy / remove QA exception; leave env unset |
| Testing evidence | Unit test: QA may start after expired/submitted; ordinary student still denied; then Production QA scored-submit for the 8 IDs |
| Owner approval | **Required** (code + Production deploy) |

**Fit:** Preferred if owner wants Production scored-submit evidence for the 8 without opening retakes to all students.

### Option B — Dedicated isolated QA environment

| Aspect | Assessment |
|--------|------------|
| Supported today? | **Not as a turnkey facility** — would need Preview/staging with portal store + catalog, ideally separate Supabase (or file store), and QA credentials |
| Required changes | Provision env; configure secrets; publish content; run full submit suite; document parity |
| Affected accounts | Isolated DB only (if separate project) |
| Security | Best isolation from real students/payments |
| Data integrity | No Production attempt writes |
| Rollback | Tear down preview; Production untouched |
| Testing evidence | Full 90 scored-submits in that env; still **not** Production evidence unless separately accepted |
| Owner approval | **Required** (infra + cost + acceptance of “prod-equivalent” definition) |

**Fit:** Best long-term QA hygiene; heavier than needed for eight leftover Production submits.

### Option C — Temporary global `TEJAS_PORTAL_RETAKES=allow`

| Aspect | Assessment |
|--------|------------|
| Supported today? | **Yes** (env only; no code change) |
| Required changes | Set Production env `TEJAS_PORTAL_RETAKES=allow`; optionally redeploy/restart so runtime picks it up; run 8 QA submits; **unset** immediately |
| Affected accounts | **All students** who already have an attempt on a test could start another while the flag is on |
| Security | Window of policy weakening; exam integrity risk if students discover retakes |
| Data integrity | Extra attempt rows for any student who starts during the window; does not overwrite submitted scores |
| Rollback | Remove/unset env; confirm deny behaviour with a probe start on a known submitted test |
| Testing evidence | Time-boxed QA run + post-disable regression |
| Owner approval | **Required**; treat as emergency-only |

**Fit:** **NOT RECOMMENDED** except as a tightly time-boxed last resort with active monitoring.

### Option D — No-retake validation without student attempts

| Aspect | Assessment |
|--------|------------|
| Supported today? | **Yes** for scoring logic |
| Method | Call `scoreAnswers` (`lib/portal/model.ts`) against catalog questions for the 8 IDs (local unit/script); existing portal tests already prove server-side scoring ignores client-supplied fake scores |
| Affected accounts | None |
| Security | None (offline) |
| Data integrity | None |
| Rollback | N/A |
| Testing evidence | Proves answer-key scoring math; **does not** prove Production start/submit/API/DB write path for those 8 |
| Owner approval | Not required for offline scoring checks; **does** require owner acceptance if offline evidence is allowed to close the 8-gap |

**Fit:** **SAFE WITHOUT PRODUCTION CHANGE** for partial assurance only; does not complete Production scored-submit QA.

---

## 4. Recommended safest path

1. **Do not** enable global Production retakes casually (**Option C — NOT RECOMMENDED**).
2. Prefer **Option A** if Production scored-submit for the eight IDs is mandatory: small, reviewable code change so only `isContentQaAccount` may retake; keep `TEJAS_PORTAL_RETAKES` unset for everyone else; deploy; run the eight submits; optional follow-up to keep or remove the exception per policy.
3. Use **Option D** immediately (no Production change) if the owner accepts catalog-level scoring verification as interim evidence — explicitly **not** a substitute for end-to-end Production submit evidence.
4. Pursue **Option B** if the organisation wants a durable isolated QA stack; plan separately.

---

## 5. Exact changes if Option A is approved (do not execute now)

Illustrative only — **not applied** in this investigation:

1. In `lib/portal/remote-store.ts` and the file-store branch in `lib/portal/store.ts`, allow a new attempt when:
   - `process.env.TEJAS_PORTAL_RETAKES === "allow"` **OR**
   - `isContentQaAccount(student.email)`  
   (prefer passing `student` into a renamed helper, e.g. `retakesAllowedFor(student)`).
2. Add/adjust tests in `lib/portal/content-qa.test.ts` / `lib/portal/portal.test.ts`.
3. Open a feature PR; pass lint/typecheck/tests/build.
4. Owner-approve merge + Production deploy.
5. With QA account only, start+submit the eight IDs; record evidence.
6. Confirm ordinary student still cannot retake (probe on a known submitted non-QA account or unit coverage).

**Not required for Option A:** SQL, RLS changes, payment changes, new registrations.

---

## 6. Risks and rollback (Option A)

| Risk | Mitigation / rollback |
|------|------------------------|
| QA can take unlimited retakes forever | Document policy; optionally time-box or remove exception after the eight closes |
| Bug accidentally broadens retakes | Code review + tests that ordinary students remain blocked; feature-flag review |
| Duplicate open attempts under concurrency | Sequential QA harness; optional later unique partial index (separate migration — out of scope) |
| Rollback | Revert the deploy commit; Production returns to global deny |

---

## 7. Owner decisions required

1. Is **Production scored-submit** mandatory for the remaining eight FT mocks, or is **Option D** offline scoring acceptable to close the gap?
2. If Production evidence is mandatory, approve **Option A** (QA-only retake code + deploy) — **recommended**.
3. Explicitly reject or tightly constrain **Option C** (global env allow).
4. Decide whether to fund **Option B** (isolated env) as a follow-on programme.
5. Confirm no SQL deletion of QA attempt rows (would also complete the eight but is a data mutation and is **out of policy** unless separately authorised).

---

## 8. Safety attestation (this investigation)

| Action | Status |
|--------|--------|
| Attempts created | **None** |
| `TEJAS_PORTAL_RETAKES` / any Production env changed | **No** |
| Code/config changed in Production | **No** |
| Deploy / merge | **No** |
| Migrations / SQL mutations | **No** |
| Auth / RLS / Storage / API permissions | **Untouched** |
| Student / payment / historical attempt records | **Untouched** |
| Credentials exposed | **No** |
