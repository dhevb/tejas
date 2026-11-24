# TEJAS — QA-Account-Only Retake Implementation Report

**Date:** 24 November 2026 (IST)  
**Branch:** `feat/qa-account-only-retakes`  
**PR:** https://github.com/dhevb/tejas/pull/62  
**Owner authorization:** Option A (QA-account-only retake) — code, tests, docs, PR only  

### Verdict: **PASS WITH OWNER-APPROVED DATABASE REQUIREMENT**

App-level concurrency hardening and fail-closed stale expiration are implemented and tested. **True atomic “one open attempt per student/test” on Supabase still requires an owner-approved partial unique index (or equivalent RPC)** — not applied in this PR.

---

## Explicit Production safety confirmation

| Action | Status |
|--------|--------|
| Production deployment | **Not performed** |
| Production env var change (`TEJAS_PORTAL_RETAKES` or otherwise) | **Not performed** |
| Database migration / SQL mutation | **Not performed** |
| RLS / Storage / Auth policy change | **Not performed** |
| Production QA / student attempts created | **Not performed** |
| Merge of this PR | **Not performed** |
| Global retake flag enabled | **No** |

Production remains on the pre-existing deploy (`dpl_5rKcZW5JNbd3PNfcJBzsdiZAYLci` / `90e70c5` at last verification before this feature branch).

---

## 1. Files changed

| File | Change |
|------|--------|
| `lib/portal/content-qa.ts` | `isContentQaStudent`, `retakesAllowedFor`, optional `TEJAS_CONTENT_QA_STUDENT_ID` |
| `lib/portal/attempt-open-integrity.ts` | Canonical open picker + expire PATCH interpretation |
| `lib/portal/attempt-open-integrity.test.ts` | Unit tests for integrity helpers |
| `lib/portal/remote-store.ts` | QA retake gate; **fail-closed** expire; post-insert / duplicate **reconcile** |
| `lib/portal/store.ts` | File-store retake + canonical open under `withLock` |
| `lib/portal/content-qa.test.ts` | Email fallback + retake helper coverage |
| `lib/portal/qa-retake.test.ts` | ID-wins / impersonation / global-flag unit tests |
| `lib/portal/portal.test.ts` | QA retake E2E + **concurrent** start/submit/replay/isolation |
| `package.json` | Include new test files in `npm test` |
| `TEJAS-QA-ONLY-RETAKE-IMPLEMENTATION-REPORT.md` | This report |

---

## 2. Concurrency and data-integrity review (PR #62 follow-up)

### 2.1 Concurrent attempt creation — confirmed race (remote)

`remoteStartAttempt` historically: GET → decide → INSERT without a DB unique constraint on `(student_id, test_id) WHERE status = 'open'`.

Two simultaneous starts for the same QA student/test can both pass the GET check and both INSERT → **multiple time-valid `open` rows**.

| Layer | Protection |
|-------|------------|
| File store (`startAttempt` + `withLock`) | Serializes writers — concurrent starts return **one** open id (automated test) |
| Remote (Supabase REST) | **No** transactional lock in app; **no** unique open index in schema |

**App hardening added (not a substitute for DB atomicity):**

1. Expire stale opens with `Prefer: return=representation` and `interpretExpireOpenPatch` — **fail closed** on unexpected HTTP/body.  
2. After insert (and when duplicates already exist), `reconcileRemoteOpenAttempts` keeps the canonical earliest open and expires extras; fails closed if expire of an extra fails.  
3. Clients may still briefly observe a race window before reconcile; without a unique index, two inserts can both succeed.

### 2.2 Owner-approved database requirement (not implemented)

Recommended separate migration (illustrative — **do not apply without owner approval**):

```sql
CREATE UNIQUE INDEX tejas_learn_attempts_one_open_per_student_test
  ON public.tejas_learn_attempts (student_id, test_id)
  WHERE status = 'open';
```

Optionally wrap start in an RPC with `INSERT … ON CONFLICT` / advisory lock. App would then treat `23505` as “re-fetch canonical open”.

### 2.3 Stale attempt expiration

| Check | Result |
|-------|--------|
| PATCH scoped to `id` + `student_id` + `status=eq.open` | Yes |
| Response verified | Yes — representation body; `expired` / `already_closed` / `failed` |
| Silent continue on failure | **No** — start returns error |
| Submitted rows | Untouched (filter requires `status=eq.open`) |

### 2.4 Identity and session (reconfirmed)

| Control | Status |
|---------|--------|
| HMAC session signature (`openSession`) | Pass |
| HttpOnly `tejas_learn` cookie | Pass |
| Session expiry in sealed payload | Pass |
| DB `sessionVersion` match in `currentStudent` | Pass |
| QA UUID allowlist (`TEJAS_CONTENT_QA_STUDENT_ID`) | Pass — preferred |
| Client-supplied identity cannot grant QA | Pass (tests) |
| Ordinary students cannot retake when global flag off | Pass (tests) |

---

## 3. Authentication method used to identify QA

1. HttpOnly signed cookie → `{ studentId, sessionVersion }`.  
2. `readStudent(studentId)` loads the account.  
3. `isContentQaStudent(student)`: UUID env wins; else server-loaded email vs `TEJAS_CONTENT_QA_EMAIL`.

---

## 4. Automated test results

| Check | Result |
|-------|--------|
| `npm test` | **106/106 pass** |
| Concurrent QA starts (file store) | One shared open attempt id |
| Ordinary concurrent retakes | All denied; prior score preserved |
| Replay submit | Denied; score unchanged |
| Spoof email / wrong id | No QA retake |
| Cross-account `readOwnAttempt` | null |
| Expire PATCH interpretation | Unit-tested fail-closed |
| `npx tsc --noEmit` | Pass |
| `npm run lint` | Pass (pre-existing `<img>` warnings only) |
| `npm run build` | Pass |

---

## 5. Post-deploy QA plan (still blocked on separate owner approvals)

Eight FT mocks: `ft-b1-mt01`, `ft-b1-mt04`, `ft-b1-mt05`, `ft-b2-mt01`–`ft-b2-mt05`.

Do **not** run until: merge → deploy → optional `TEJAS_CONTENT_QA_STUDENT_ID` → explicit Production scored-submit approval. Never set `TEJAS_PORTAL_RETAKES=allow` for this purpose.

---

## 6. Owner decisions still required

1. Review/merge PR #62.  
2. Approve Production deploy.  
3. **Separately approve** partial unique index (or RPC) migration for atomic one-open-attempt enforcement.  
4. Optional: set `TEJAS_CONTENT_QA_STUDENT_ID` after deploy.  
5. Approve Production scored-submit of the eight FT mocks.

---

## 7. PR / commits

- Branch: `feat/qa-account-only-retakes`  
- PR: https://github.com/dhevb/tejas/pull/62  
- Feature (retake): `d33f0e3`  
- Concurrency/integrity hardening: `7edf6ad123d0952bc424b802d6cc92b18f2ea9b5`  

