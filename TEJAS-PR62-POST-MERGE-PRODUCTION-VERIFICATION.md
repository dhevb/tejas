# TEJAS — PR #62 Post-Merge Production Deployment & QA Verification

**Date:** 2026-11-24 (IST)  
**Merge commit:** `2fdeca059e3015e4ca78eb41b2d6eae7f43c77e3`  
**Production domain:** https://tejas.dhe.org.in  

---

## Verdict

### CONDITIONAL PASS — deployment successful; specific live checks remain blocked or intentionally not executed

Production deployment of the merge commit is **READY** and serves `tejas.dhe.org.in`. Permitted public and QA-authenticated checks that were actually run passed. Two verification items were **not** fully executed live (documented below) and must not be counted as passed.

No database mutations, env changes, migrations, additional deploys, rollbacks, FT scored-submits, or stale-open expires were performed.

---

## 1. Deployment verification (verified)

| Field | Value |
|-------|--------|
| Deployment ID | `dpl_7nVYbTgNu5yChu66nJ9ZR9FWkczh` |
| Vercel URL | https://tejas-oedv013x0-dhe-projects.vercel.app |
| Inspect | https://vercel.com/dhe-projects/tejas/7nVYbTgNu5yChu66nJ9ZR9FWkczh |
| Target | **production** |
| Status | **● Ready** |
| Created | 2026-11-24 10:51:16 IST |
| Build duration | ~1m 25s (+ post-build) |
| GitHub deployment | `8019437062` |
| GitHub status | `success` — “Deployment has completed” |
| Build log commit | `Cloning github.com/dhevb/tejas (Branch: main, Commit: 2fdeca0)` |
| Domain alias | **https://tejas.dhe.org.in** listed on this deployment |
| Live `Link` header on `/learn` | `...?dpl=dpl_7nVYbTgNu5yChu66nJ9ZR9FWkczh` |

### Build log highlights (verified)

- Clone of `main` @ `2fdeca0`
- Restored cache from prior Production `dpl_5rKcZW5JNbd3PNfcJBzsdiZAYLci`
- Next.js build completed; routes include `/learn`, `/learn/dashboard`, `/api/learn/tests/[testId]`
- `Deployment completed` → status Ready

**No additional deployment or rollback was triggered by this verification.**

---

## 2. Environment verification (read-only name presence)

Checked via `vercel env ls` **name listing only** (values not retrieved or printed).

| Variable | Production listing |
|----------|-------------------|
| `TEJAS_CONTENT_QA_EMAIL` | **Present** (Hidden / Secret) |
| `TEJAS_CONTENT_QA_STUDENT_ID` | **Absent** |
| `TEJAS_PORTAL_RETAKES` | **Absent** (not enabled / not changed) |

### Consequence of missing `TEJAS_CONTENT_QA_STUDENT_ID`

Per merged `lib/portal/content-qa.ts`: when the student-ID allowlist is unset, QA privilege falls back to **exact match of server-loaded student email** against `TEJAS_CONTENT_QA_EMAIL`.

**Live confirmation:** QA login response included `contentQa: true` for the dedicated QA account. Ordinary forged-email paths remain code-tested; live ordinary-student identity check was not available (see blocked).

**Recommendation (owner, separate change):** set Production `TEJAS_CONTENT_QA_STUDENT_ID` to the content-QA account UUID so privilege is UUID-bound. **Not changed in this verification.**

**Confirmed:** `TEJAS_PORTAL_RETAKES` was not listed and therefore is not set to `allow` on Production.

---

## 3. Safe live verification

### Verified facts (actually executed)

| Check | Result | Evidence |
|-------|--------|----------|
| `GET https://tejas.dhe.org.in/learn` | **Pass** | HTTP 200; title “E-book and mock tests \| TEJAS”; assets tagged `dpl_7nVYbTgNu5yChu66nJ9ZR9FWkczh` |
| Public publication copy | **Pass** | `/learn` PublicationStatus text shows Eng / Math / Future Tech books published with 5/5 mocks each (sampled) |
| Unauthenticated `POST /api/learn/tests/...` | **Pass** | HTTP **401** `"Sign in to continue."` |
| Spoofed Origin start | **Pass** | HTTP **403** `"Open this form on the TEJAS website."` |
| Spoofed session cookie start | **Pass** | HTTP **401** `"Sign in to continue."` |
| QA account login | **Pass** | HTTP 200; session cookie set; `contentQa: true` on login payload (no credentials printed) |
| QA dashboard catalog | **Pass** | 18 unique book ids, 90 unique test ids; Eng + Math + Future Tech visible (cross-stream) |
| Existing attempt read | **Pass** | Dashboard exposes attempt links (count **82**); one attempt page HTTP 200 with score/submitted signals — **read-only** |
| No FT scored-submit of remaining eight | **Pass (constraint held)** | No submit/score API calls to the eight remaining Future Tech mocks |
| No mutate of nine stale opens | **Pass (constraint held)** | No expire/update SQL or PATCH expire of stale opens |

### Blocked / not executed (must not be claimed as pass)

| Check | Status | Why |
|-------|--------|-----|
| Ordinary learner live retake denial | **Blocked** | No ordinary Production student credentials in the authorized private store. Pre-merge automated tests on the feature cover this; **not re-run as a signed-in Production ordinary learner**. |
| QA `POST startAttempt` retake (create new open) | **Not executed** | Intentionally skipped to honour “do not create unnecessary Production attempts.” Authorization inferred from `contentQa: true` + full cross-stream catalog, not from a new open insert. |
| Time-valid open reuse race live | **Not executed** | Precheck showed **0** time-valid opens; exercising reuse would require creating an open first. |

---

## 4. Security notes from executed checks

- Unauthenticated and cross-origin attempt starts are denied.
- Forged session cookie does not authorize starts.
- QA privilege is active via email allowlist fallback (`contentQa: true`).
- Global retake flag is not present on Production.
- Auth / RLS / Storage / payment / registration were not modified by this work unit.

---

## 5. Recommendations (owner; not applied)

1. Optionally set `TEJAS_CONTENT_QA_STUDENT_ID` (UUID) — tighter than email-only allowlist.  
2. Keep `TEJAS_PORTAL_RETAKES` unset / not `allow`.  
3. If live ordinary-learner denial must be signed off on Production, provide a dedicated non-QA test student credential (or owner-run check).  
4. Optional separate hygiene for the nine timer-elapsed opens — **not** done here.  
5. Remaining eight Future Tech scored-submits remain owner/QA follow-up after retake path is deliberately used — **not** done here.

---

## 6. Restrictions confirmation

| Restriction | Held |
|-------------|------|
| No DB mutations / migrations | Yes |
| No expire/modify of nine stale attempts | Yes |
| No payment / registration / Auth / RLS / Storage changes | Yes |
| No additional deploy / rollback | Yes |
| No fake payments / FT test submissions | Yes |
| No credential or student PII in this report | Yes |

---

## 7. Evidence index

| Kind | Reference |
|------|-----------|
| Merge SHA | `2fdeca059e3015e4ca78eb41b2d6eae7f43c77e3` |
| Vercel Production dpl | `dpl_7nVYbTgNu5yChu66nJ9ZR9FWkczh` |
| GitHub Production deployment | `8019437062` |
| Domain proof | Alias + `/learn` CSS `?dpl=dpl_7nVYbTgNu5yChu66nJ9ZR9FWkczh` |
| Local verify artefacts (not committed) | `.local-qa/pr62-post-merge-verify-results.json`, `.local-qa/pr62-post-merge-verify-phase2-results.json` |

---

## Summary

**Deployment:** PASS (exact commit Ready on Production domain).  
**Overall:** **CONDITIONAL PASS** because ordinary-learner live retake denial and live `startAttempt` retake/open-reuse were not executed under the stated Production-safety constraints.
