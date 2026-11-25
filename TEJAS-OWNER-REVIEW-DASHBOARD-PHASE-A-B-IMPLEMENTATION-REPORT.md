# TEJAS — Owner Review Dashboard Phase A + B implementation report

**Date:** 2026-11-25  
**Branch:** `feat/owner-review-dashboard-phase-a-b` (from `origin/main` @ `df47eea`)  
**Scope:** Phase A (UI clarity) + Phase B (fee/overview hardening)  
**Production:** **NOT DEPLOYED** · **NOT MERGED**

---

## 1. Implemented UI changes

| Item | Status |
|------|--------|
| Four summary cards (Total / Verified / Rejected·Adjustment / Pending) | **Done** |
| Verified = confirmed count + ₹ only | **Done** |
| Pending splits awaiting vs proof-submitted (`reported`) | **Done** |
| Rejected ₹ + refund/adjustment ₹ separate | **Done** |
| Gross / share / all-listed TEJAS / eligible received strip | **Done** |
| Class-wise section + Class 3–10 filter (+ NI / other labels) | **Done** |
| State → District grouping preserved | **Done** |
| Filters: All, Verified, Rejected, Payment Pending, Proof Submitted, unfinished, State, District, School search, Class | **Done** |
| Parent contacts hidden by default (toggle in detail) | **Done** |
| OCR ≠ bank verification copy | **Done** |
| No student account create/disable; no portal entitlement changes | **Honored** |
| Owner-only auth unchanged | **Honored** |

---

## 2–8. Metrics (server formulas)

| Metric | Source |
|--------|--------|
| Class-wise totals | `classMetricsForRegistration` + `mergeClassMetricIntoBreakdown` |
| Unique students vs streams | Identity-deduped vs stream selections |
| Confirmed received | `payment.status === confirmed` → sum `amountDue` |
| Pending | awaiting (`pending_instructions`/`awaiting_payment`) + reported |
| Proof-submitted amount | `reportedAmount` |
| Rejected amount | `rejectedPayable` (rupees, not count-only) |

Filtered cards recompute via `summarizeFilterableRows` using the **same** bucket rules on server-authored row fields.

---

## 9. Test results

| Suite | Result |
|-------|--------|
| `staff-metrics.test.ts` (+ class/bucket/summarize) | **PASS** |
| `india-address.test.ts` | **PASS** |
| `pan-access.test.ts` | **PASS** |
| `payment-rules.test.ts` | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npm run lint` | **PASS** (existing emblem `<img>` warnings only) |
| `npm run build` | **PASS** |
| `git diff --check` (changed sources) | **PASS** |

---

## 10. Preview deployment

| Field | Value |
|-------|--------|
| Preview URL | https://tejas-g1l8gflsv-dhe-projects.vercel.app |
| Stable alias | https://tejas-git-feat-owner-review-dashboard-phase-a-b-dhe-projects.vercel.app |
| Deployment ID | `dpl_F4TN9eDc8mcz1x7dtiGWiyhRT2Yo` |
| Status | **Ready** (Preview) |
| Review path | `/schools/register/review` |
| Commit | `75bd5fd` |
| Preview Supabase hostname | Remains **UNVERIFIED** (Secret); no migration required for this UI |

Public GET of Preview review page returns 200 with updated hero copy. Owner token login required for data cards (same security model).

---

## 11. Held PRs

Unchanged: #10 / #63 / #54 / #12 remain **HOLD**. No SQL applied.

---

## 12. Production confirmation

**Production data and settings: UNCHANGED.**  
No merge to `main`, no Production promote, no SQL, no payment status mutations, no Auth/RLS/Storage/env changes, no student access flips.
