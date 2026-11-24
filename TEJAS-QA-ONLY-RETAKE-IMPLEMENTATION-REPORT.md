# TEJAS — QA-Account-Only Retake Implementation Report

**Date:** 24 November 2026 (IST)  
**Branch:** `feat/qa-account-only-retakes`  
**Owner authorization:** Option A (QA-account-only retake) — code, tests, docs, PR only  
**Verdict:** Implementation complete and reviewable — **not merged, not deployed**

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

---

## 1. Files changed

| File | Change |
|------|--------|
| `lib/portal/content-qa.ts` | `isContentQaStudent`, `retakesAllowedFor`, optional `TEJAS_CONTENT_QA_STUDENT_ID` |
| `lib/portal/remote-store.ts` | Retake gate uses `retakesAllowedFor(student)`; content-QA checks use student identity; stale open attempts expired before new insert |
| `lib/portal/store.ts` | Same retake + content-QA identity wiring for file store |
| `lib/portal/content-qa.test.ts` | Email fallback + retake helper coverage |
| `lib/portal/qa-retake.test.ts` | ID-wins / impersonation / global-flag unit tests |
| `lib/portal/portal.test.ts` | End-to-end QA retake vs ordinary student isolation |
| `package.json` | Include `qa-retake.test.ts` in `npm test` |
| `TEJAS-QA-ONLY-RETAKE-IMPLEMENTATION-REPORT.md` | This report |

---

## 2. Authentication method used to identify QA

### Server-side session chain (unchanged)

1. HttpOnly signed cookie `tejas_learn` → `openSession` (`lib/portal/session.ts`) yields `{ studentId, sessionVersion }` only.  
2. `currentStudent()` (`lib/portal/current.ts`) loads `readStudent(opened.studentId)` from the store/DB.  
3. Privilege checks use that **server-loaded** `PortalStudent` — never request body email, headers, query params, or client-editable profile email.

### QA allowlist (this change)

| Priority | Env | Match |
|----------|-----|-------|
| **Preferred** | `TEJAS_CONTENT_QA_STUDENT_ID` | Exact match to authenticated `student.id` (UUID) |
| Fallback | `TEJAS_CONTENT_QA_EMAIL` | Exact match to **server-loaded** `student.email` only when student ID env is unset |

`updateProfile` cannot change email (email is not in the profile patch). Forging `email` on an in-memory object does not grant QA when the student ID allowlist is set (covered by tests).

---

## 3. Server-side authorization flow (retake)

```
POST /api/learn/tests/[testId]
  → sameOrigin + currentStudent() (401 if missing)
  → startAttempt(student, testId)
      → accessFor / remoteAccessFor (published + paid/contentQa rules unchanged)
      → if valid open attempt → reuse
      → if !retakesAllowedFor(student) && prior attempts exist → deny
      → else expire stale open rows, INSERT new attempt (new UUID)
```

`retakesAllowedFor(student)`:

- `TEJAS_PORTAL_RETAKES === "allow"` → all students (existing behaviour; **not** used as the QA workaround), or  
- `isContentQaStudent(student)` → dedicated QA only.

Submit path unchanged: ownership via `student_id` filter; open-only PATCH; server-side `scoreAnswers`; replay on submitted attempt fails.

---

## 4. Security threat analysis

| Threat | Mitigation |
|--------|------------|
| Client sends QA email in body/header | Ignored; session → UUID → DB row |
| Ordinary student sets profile email to QA email | Profile API does not accept email changes |
| ID allowlist unset; email collision | Registration enforces unique email; QA email is organisation-controlled |
| Enabling global retakes for everyone | Not done; tests assert ordinary student still denied while flag unset |
| QA gains staff/payment powers | No staff/payment code paths changed |
| Overwrite historical scores | New attempt UUID; prior submitted rows unchanged |
| Cross-account attempt read | `readOwnAttempt` / submit filter by `student_id` |
| Concurrent duplicate opens | Stale `open` rows expired before insert on remote path; file store already expired stale open |

**Unresolved residual risk:** Without setting `TEJAS_CONTENT_QA_STUDENT_ID` in Production after deploy, fallback remains email-on-server-record (still not client-supplied). Recommend setting the UUID after merge/deploy.

---

## 5. Automated test results

| Suite | Result |
|-------|--------|
| `npm test` | **102/102 pass** (includes new QA retake tests) |
| Focused portal + QA tests | **23/23 pass** |

Covered requirements:

1. QA can retake after submit  
2. Ordinary student cannot retake when global flag off  
3. Email forgery / wrong ID cannot impersonate QA when ID allowlist set  
4. `isContentQaStudent(null)` false (unauthenticated has no student)  
5. Other students retain deny behaviour  
6. Cross-account `readOwnAttempt` returns null  
7. Prior scores unchanged after retake / replay  
8. Replay submit on closed attempt fails  
9. Class restriction (`wrong_class`) still enforced for ordinary learner  
10. QA `contentQa` flag does not appear on ordinary dashboard; staff overview path unchanged by this feature  

---

## 6. Build / lint / TypeScript

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Pass (exit 0) |
| `npm run lint` | Pass (exit 0; pre-existing `<img>` warnings only) |
| `npm run build` | Pass (exit 0) |

---

## 7. Post-deploy QA execution plan (do **not** run until separate owner approval)

Remaining Production tests (no attempts in this task):

`ft-b1-mt01`, `ft-b1-mt04`, `ft-b1-mt05`, `ft-b2-mt01`, `ft-b2-mt02`, `ft-b2-mt03`, `ft-b2-mt04`, `ft-b2-mt05`

After owner merge + deploy approval:

1. Confirm Production deploy ID / commit includes this change.  
2. Optionally set `TEJAS_CONTENT_QA_STUDENT_ID` to the QA account UUID (recommended). **Do not** set `TEJAS_PORTAL_RETAKES=allow`.  
3. Sign in as `tejas-content-qa@dhe.org.in` only.  
4. For each of the eight IDs: open test page → start → submit valid answers → record score / attempt id.  
5. Confirm a non-QA student still cannot retake a previously submitted mock.  
6. Update scored-submit evidence report (82→90 expected if all eight succeed).

---

## 8. Owner decisions still required (separate)

1. **Review and merge** PR for `feat/qa-account-only-retakes` (this PR).  
2. **Approve Production deploy** of the merged commit.  
3. **Optionally** set Production `TEJAS_CONTENT_QA_STUDENT_ID` (no global retake flag).  
4. **Approve Production scored-submit** run for the eight Future Tech mocks.

---

## 9. PR / commit

- Branch: `feat/qa-account-only-retakes`  
- Feature commit: `d33f0e3e3bbdf9304736dc95dd1430627cec1f65`  
- Branch HEAD: `1e37146` (report metadata)  
- PR URL: https://github.com/dhevb/tejas/pull/62  

