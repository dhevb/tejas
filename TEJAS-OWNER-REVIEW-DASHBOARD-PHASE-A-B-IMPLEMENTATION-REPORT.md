# TEJAS — Owner Review Dashboard Phase A + B implementation report

**Date:** 2026-11-25 (updated after owner Preview visual / class-wise fixes)  
**Branch:** `feat/owner-review-dashboard-phase-a-b`  
**PR:** https://github.com/dhevb/tejas/pull/67 — **NOT MERGED**  
**Scope:** Phase A + B + owner Preview remediation (layout, Classes 3–10 always visible, count definitions, amount clarity)  
**Production:** **NOT DEPLOYED** · **NOT MERGED**

---

## 1. Implemented UI changes

| Item | Status |
|------|--------|
| Desktop content width ~1200px (`max-w-[1200px]`) | **Done** |
| Larger summary cards with prominent primary amounts | **Done** |
| Clearer spacing between cards / financial strip / class table / school list | **Done** |
| Mobile responsive layout preserved | **Done** |
| Site header/nav unchanged | **Honored** |
| Four summary cards (Total / Verified / Rejected·Adjustment / Pending) | **Done** |
| Labels: Registration records · Unique students · Student-streams (separate) | **Done** |
| Total payment received = confirmed only | **Done** |
| Pending splits awaiting vs proof-submitted (`reported`) | **Done** |
| Rejected ₹ + refund/adjustment ₹ separate (cards + class table) | **Done** |
| Classes 3–10 always visible (zeros when empty) | **Done** |
| Class Not Identified retained when present | **Done** |
| Class filter scopes overview cards to that class (reconcile) | **Done** |
| State → District grouping preserved | **Done** |
| Parent contacts hidden by default | **Done** |
| OCR ≠ bank verification copy | **Done** |
| No student account / entitlement / fee-policy changes | **Honored** |
| Owner-only auth unchanged | **Honored** |

---

## 2–8. Metrics (server formulas)

| Metric | Definition |
|--------|------------|
| Registration records | Count of registration rows under current filters (`overview.schools`) |
| Unique students | Identity-deduped students per registration, summed |
| Student-streams | Selected english/mathematics/technology combinations |
| Class registration records | Count of registrations that **touch** that class (do **not** sum across classes as total records) |
| Confirmed received | `payment.status === confirmed` → sum saved `amountDue` |
| Pending | awaiting + reported only |
| Proof-submitted | `reportedAmount` (not confirmed) |
| Rejected | `rejectedPayable` only (not refund_pending) |
| Refund/adjustment | `refundPendingAmount` separate; never in received |

Screenshot amounts (5 regs / 14 streams) rechecked against fee policy: Gross ₹2,100 · Share ₹420 · TEJAS ₹1,680 · Confirmed ₹120 · Pending ₹960 · Rejected ₹240 · Refund ₹360 — arithmetic consistent; no fee-policy change.

Filtered cards recompute via `summarizeFilterableRows` + `scopeFilterableRowsToClass` on server-authored fields.

---

## 9. Test results (this remediation)

| Suite | Result |
|-------|--------|
| `staff-metrics.test.ts` (12 tests) | **PASS** |
| Classes 3–10 always visible incl. zeros | **PASS** |
| Registration records ≠ unique students ≠ student-streams | **PASS** |
| Multi-stream one student | **PASS** |
| Class totals reconcile with overview amounts | **PASS** |
| Confirmed vs pending vs reported vs rejected vs refund_pending | **PASS** |
| No double-count rejected + refund_pending | **PASS** |
| Class filter scopes cards to class row | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npm run lint` | **PASS** (existing emblem `<img>` warnings only) |
| `npm run build` | **PASS** |
| `git diff --check` | **PASS** |

---

## 10. Preview deployment

| Field | Value |
|-------|--------|
| Preview URL | *(updated after this commit’s Vercel Preview deploy)* |
| Review path | `/schools/register/review` |
| Preview Supabase hostname | Remains **UNVERIFIED** (Secret); no migration required |
| Production | Unchanged |

---

## 11. Held PRs

Unchanged: #10 / #63 / #54 / #12 remain **HOLD**. No SQL applied.

---

## 12. Production confirmation

**Production data and settings: UNCHANGED.**  
No merge to `main`, no Production promote, no SQL, no payment status mutations, no Auth/RLS/Storage/env changes, no student access flips.
