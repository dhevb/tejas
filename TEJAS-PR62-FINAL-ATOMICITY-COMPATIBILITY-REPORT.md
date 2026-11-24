# TEJAS — PR #62 Final Database Atomicity Compatibility Review

**Date:** 2026-11-24  
**PR under review:** https://github.com/dhevb/tejas/pull/62 (`feat/qa-account-only-retakes`)  
**Companion docs PR (not merged):** https://github.com/dhevb/tejas/pull/63  
**Review scope:** Compatibility of PR #62 with Production partial unique index `tejas_learn_attempts_one_open`  
**Production mutations:** **None** (no SQL apply, no expire/update/delete of attempts, no env changes, no merge, no deploy)

---

## Verdict

### PASS — ready for separate owner merge decision

PR #62 is technically compatible with the existing Production unique partial index. Concurrent open-attempt creation cannot produce a second `status = 'open'` row for the same `(student_id, test_id)`. The losing insert path now maps PostgreSQL `23505` to reuse of the canonical time-valid open attempt. Submitted and expired rows remain unaffected by the index and by the start path’s open-only filters.

**This review does not approve merge or deploy.** Owner merge of PR #62 remains a separate decision.

---

## Evidence classes (keep distinct)

| Class | Source | Used for |
|-------|--------|----------|
| **Code / test evidence** | Branch `feat/qa-account-only-retakes`, local `npm test` / `lint` / `build` | Behaviour of PR #62 |
| **Production database evidence** | Prior read-only precheck (PR #63 / proposal) | Index presence + duplicate counts |

No Production writes were performed in this review.

---

## 1. Attempt-creation paths inspected

| Path | Role |
|------|------|
| `startAttempt` → `remoteStartAttempt` when `portalPersistence() === "remote"` | Production path |
| `startAttempt` file-store + `withLock` | Local/test path |
| `remoteSubmitAttempt` / `submitAttempt` | Close path only (not create) |

No other open-attempt INSERT sites were found for learner starts.

### `remoteStartAttempt` behaviour (Production path)

1. Access check (`remoteAccessFor`).
2. Load attempts for `(student_id, test_id)`.
3. If a **time-valid** open exists → return that attempt (heal extras if any).
4. If retakes not allowed and any prior attempt exists (submitted / expired / open) → deny (no mutate).
5. If retakes allowed → expire **timer-elapsed** opens for that student/test (fail-closed on PATCH failure), then INSERT new open.
6. On INSERT success → reconcile to canonical open.
7. On INSERT conflict (`23505`) → **re-SELECT**, reuse canonical time-valid open (or fail closed if none).

---

## 2. Unique-index / `23505` handling

Production index (from read-only precheck / durable migration `20261118000200`):

```sql
UNIQUE (student_id, test_id) WHERE status = 'open'
-- name: tejas_learn_attempts_one_open
```

**Code evidence (this review):**

- Added `isPostgresUniqueViolation` and `decideOpenAttemptInsertConflict` in `lib/portal/attempt-open-integrity.ts`.
- `remoteStartAttempt` on non-2xx INSERT:
  - reloads attempts for the student/test;
  - if `23505` **and** a time-valid open exists → returns that canonical attempt (via reconcile);
  - otherwise fail closed: `"This mock test could not be started."`

Loser concurrent request therefore returns the winner’s open attempt when the index rejects the duplicate insert — **no second open is created**.

---

## 3. Concurrent / duplicate guarantees

| Scenario | Outcome |
|----------|---------|
| Two concurrent INSERTs, no prior open | Index allows one; loser gets `23505` → reuses winner’s open |
| Time-valid open already present | Early return of canonical open; no INSERT |
| File-store concurrent QA starts | `withLock` + tests collapse to one open id |
| Ordinary learner after submitted | Retake denied; no new open |

**No duplicate open is returned as a new creation.** Reconcile may expire *extra time-valid* opens if they somehow exist; with the Production index that set size is expected to be ≤ 1.

---

## 4. Submitted and expired attempts

- Partial unique index **excludes** `submitted` and `expired` (predicate `status = 'open'` only).
- Retake deny path for ordinary students does not PATCH submitted/expired rows.
- Submit path PATCHes only `status=eq.open` for the owned attempt id.
- **Conclusion:** submitted and expired behaviour is unaffected by the index and by open-reuse logic.

---

## 5. Timer-elapsed opens still marked `open` (Production evidence)

From read-only precheck (unchanged this review):

| Metric | Value |
|--------|------:|
| Attempts | 93 |
| Submitted | 84 |
| Open | 9 |
| Expired status | 0 |
| Duplicate open groups | **0** |
| Open still within timer | 0 |
| Open timer-elapsed | 9 |

**This review did not expire or modify those 9 rows.**

### Code safety vs those rows

| Actor | On start |
|-------|----------|
| Ordinary learner | Denied if any prior attempt exists (including stale open). **No expire PATCH.** |
| Content-QA (`retakesAllowedFor`) | Explicit fail-closed expire of stale opens **only when starting that student/test**, then INSERT. Not silent; not a background sweeper. |

Owner awareness (not a review failure): after merge/deploy, a QA retake start on a test that still has one of those 9 stale opens will expire that row as part of retake hygiene. Separate owner-approved hygiene is optional if bulk expire is preferred before QA work.

---

## 6. Security / session / authorization

| Check | Result |
|-------|--------|
| QA identity | Server-loaded student; prefer `TEJAS_CONTENT_QA_STUDENT_ID`, else exact email |
| Client-forged email | Denied when ID allowlist set (tests) |
| Ordinary retakes | Denied without global `TEJAS_PORTAL_RETAKES=allow` |
| Global retake flag | **Not** required / not recommended for Production |
| Auth / RLS / Storage / payment | Unchanged by this review and by the atomicity fix |
| Expire / conflict errors | Fail closed; no inventing attempt ids |

---

## 7. Automated tests and verification

### Focused atomicity tests (`lib/portal/attempt-open-integrity.test.ts`)

- `timeValidOpenAttempts` drops timer-elapsed opens  
- `pickCanonicalOpenAttempt` deterministic survivor  
- `interpretExpireOpenPatch` fail-closed  
- **`isPostgresUniqueViolation` matches PostgREST `23505`**  
- **`decideOpenAttemptInsertConflict` reuses canonical open on loser path**  

### Concurrent / isolation (file-store)

- `file-store concurrent QA starts collapse to one open attempt under withLock`  
- QA retake + ordinary deny + score isolation  

### Full suite / quality gates (code evidence)

| Gate | Result |
|------|--------|
| `npm test` | **108 pass / 0 fail** |
| `npm run lint` | **exit 0** (existing `<img>` warnings only) |
| `npm run build` | **exit 0** (Next.js 15.5.20; includes lint + type validity) |
| Standalone `npx tsc --noEmit` | Passes **after** `next build` regenerates `.next/types` (stale types previously caused TS6053 noise) |

---

## 8. Commit SHAs

| Item | SHA |
|------|-----|
| Prior concurrency harden (on PR #62) | `7edf6ad123d0952bc424b802d6cc92b18f2ea9b5` |
| Head before this review | `665182cb24010cdc782902fb9febad0e509cb70b` |
| This review fix + report (push to PR #62) | 3bd32311857bb151d1957251b5b2831c873d6b44 |

---

## 9. Owner merge checklist (separate decision)

Ready from a **technical atomicity** perspective when owner chooses to merge PR #62:

1. **No Production migration required** — `tejas_learn_attempts_one_open` already present; do not drop it.  
2. Do **not** set Production `TEJAS_PORTAL_RETAKES=allow`.  
3. Optional: set `TEJAS_CONTENT_QA_STUDENT_ID` to the content-QA UUID.  
4. Expect: QA start on a test with a timer-elapsed open may expire that one row (explicit start path).  
5. Leave PR #63 as docs reference; do not treat ENSURE SQL as required on Production.  
6. Do not merge/deploy from this review alone.

---

## 10. Production unchanged (explicit)

Confirmed for this work unit:

- No SQL mutations  
- No expire/update/delete of the 9 stale opens  
- No index change / migration apply  
- No Production env var changes  
- PR #62 and PR #63 **not merged**  
- **Not deployed**  
- Auth, RLS, Storage, registration, payment logic untouched aside from the reviewed attempt-start conflict handling on the feature branch  

---

## Summary table

| Required check | Status |
|----------------|--------|
| Inspect creation paths | Pass |
| Handle `23505` / `tejas_learn_attempts_one_open` | Pass (fixed + tested this review) |
| Loser returns canonical open | Pass |
| No duplicate open created/returned as new | Pass |
| Submitted / expired unaffected | Pass |
| Focused + full tests | Pass (108) |
| Timer-elapsed opens safe without silent Production mutate | Pass (review read-only; code fail-closed / deny for ordinary) |
| Lint / build | Pass |
| Security / identity | Pass |
| Production unchanged | Pass |
