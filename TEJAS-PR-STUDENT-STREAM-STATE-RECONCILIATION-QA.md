# TEJAS PR — Student-Stream Reconciliation + State-wise Rejected Exclusion (QA)

| Field | Value |
|---|---|
| **PR** | https://github.com/dhevb/tejas/pull/70 |
| **Branch** | `feat/owner-student-stream-state-reconciliation` |
| **HEAD** | `48400aa910494d7b539a47365c981c3489dc90bd` |
| **Preview URL** | https://tejas-6gb0gwdub-dhe-projects.vercel.app |
| **Deployment ID** | `dpl_GzSEAWy3HDtZHDVqkQVQzZtCRopF` |
| **Production** | **Untouched** (no merge, no deploy, no SQL, no env changes) |
| **QA time (UTC)** | 2026-11-27 |

---

## Counting definitions (after change)

| Term | Definition |
|---|---|
| **Unique students** | Distinct children by stable identity key `fullName\|DOB\|parentName\|parentMobile` (opaque SHA-256 token on Owner list). Same name alone does **not** merge. |
| **Student-streams** | Distinct **student × stream** enrollments under Confirmed + Pending. Eng+Math = two. Duplicate registrations for the same child+stream count **once**. |
| **Olympiad stream cards** | Same distinct student×stream rule, split by English / Mathematics / Future Tech. |
| **Registration records (class row)** | Registration **touches** for that class. Summing across classes ≠ distinct registration count. |
| **Reconcile registration count** | Distinct Confirmed + Pending registrations under current filters. |
| **State-wise (filtered)** | Count of Confirmed + Pending registrations per state (includes Proof Submitted / `reported`). **Excludes** `rejected` and `refund_pending`. |

**Identity limitation:** If two real children share identical name+DOB+parent name+parent mobile, they would share one identity key. Name-only collisions are not merged. No guessing / no schema change.

**Fee allocation unchanged:** Class fee allocation still uses per-registration stream weights from `classMetrics`. Only the **displayed** Student-streams column / reconcile total uses distinct enrollments.

---

## Before / after figures

### Production (observed before this PR; unchanged on Production)

| Metric | Before (Production UI) | Expected after deploy (same data) |
|---|---:|---:|
| Class-wise Student-streams sum | 4,301 | **4,269** |
| Eng + Math + FT cards | 1,679 + 2,146 + 444 = **4,269** | **4,269** (equal) |
| Δ | 32 | **0** |
| State-wise total | 88 (all statuses) | **54** (Confirmed+Pending) |
| Rejected in State-wise | 34 contributed | **0** |
| Overview rejected card | 34 | **34** (unchanged) |

### Preview seed (this PR QA)

| Metric | Result |
|---|---|
| Student-streams total | **9** |
| Eng / Math / FT | **4 / 3 / 2** (sum **9**) |
| Reconcile | **PASS** (exact) |
| Future Tech Class 3 | **N/A** |
| State-wise total | **3** (= Confirmed+Pending main count) |
| Rejected rows | **1** (excluded from State-wise; overview still **1**) |
| Refund rows | **1** (excluded from State-wise) |

---

## Automated tests

| Suite | Result |
|---|---|
| `stream-state-reconciliation.test.ts` | **PASS** (cases 1–11) |
| `stream-class-matrix.test.ts` | **PASS** |
| `owner-file-download.test.ts` | **PASS** |
| `tsc --noEmit` | **PASS** |
| `next lint` | **PASS** (existing img warnings only) |
| `npm run build` | **PASS** |
| PR CI guard / validate / Vercel | **PASS** |

Covered: multi-stream once each; duplicate reg no inflate; same-name separate IDs; class stream sum = card sum; FT N/A 3–5; State-wise exclude rejected/refund; include confirmed/pending/reported; Not Identified bucket; filter update behavior (Delhi-only subset).

---

## Preview functional checks

| Check | Result |
|---|---|
| Student-streams = Eng+Math+FT | **PASS** |
| State-wise = main-scope count; rejected/refund contribute 0 | **PASS** |
| Overview rejected count still present | **PASS** |
| Unauthenticated file download still `401 owner_auth_required` | **PASS** |
| Complete Excel / overview rejected semantics unchanged in code | **PASS** (no export/payment code paths modified) |
| Production untouched | **Confirmed** |

Evidence: `.local-qa/pr70-preview-stream-state-qa-results.json`

---

## Files changed

- `lib/registration/staff-metrics.ts` — `studentStreamsByClass` / `studentStreamsTotal`; `countStateGroupsForMainScope`
- `app/schools/register/review/review-dashboard.tsx` — display reconcile + State-wise scope + tooltips
- `lib/registration/stream-state-reconciliation.test.ts` — new tests

---

## STOP

PR **#70** is **OPEN**. **Do not merge. Do not deploy to Production.** Waiting for explicit Owner approval.
