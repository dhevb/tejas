# TEJAS — Owner Review Dashboard Phase A + B implementation report

**Date:** 2026-11-25 (payment label / amount semantics correction)  
**Branch:** `feat/owner-review-dashboard-phase-a-b`  
**PR:** https://github.com/dhevb/tejas/pull/67 — **OPEN, NOT MERGED**  
**Production:** **NOT DEPLOYED** · **NOT MERGED**

---

## Audit finding (authoritative fields)

School registration fee helpers (`lib/registration/fee.ts`) save three independent parts per registration:

| Saved field | Policy (per student-stream) | Meaning |
|-------------|-----------------------------|---------|
| `grossTotal` / `totalStudentFees` | ₹150 | Calculated gross fee |
| `schoolShare` / `registrationSchoolShare` | ₹30 | School retention |
| `amountDue` / `registrationPayable` | ₹120 | TEJAS remittance (payment proof must equal this) |

Payment proof validation requires `amountPaid === amountDue` (TEJAS ₹120), **not** gross ₹150. Gross is independently stored; it is **not** invented by scaling TEJAS share.

**Prior bug:** Verified card labelled “Total payment received” using confirmed `amountDue` only, which is **TEJAS share**, not gross.

---

## Correction

Verified card now shows:

1. **Gross payment received (confirmed)** = sum of saved `grossTotal` for `confirmed` only  
2. **School share (confirmed)** = sum of saved `schoolShare` for `confirmed` only  
3. **TEJAS share (confirmed)** = sum of saved `amountDue` for `confirmed` only  

Pending / reported / rejected / refund-adjustment show **gross and TEJAS separately** from the same saved fields. None of those statuses enter confirmed received.

Class-wise columns:

- Confirmed gross received  
- Confirmed TEJAS share  
- Pending gross / TEJAS  
- Rejected (TEJAS)  
- Refund/adj. (TEJAS)  

Example for one confirmed school student-stream: Gross ₹150 · School ₹30 · TEJAS ₹120.

---

## Implemented UI (cumulative)

| Item | Status |
|------|--------|
| Desktop ~1200px + readable cards | Done |
| Classes 3–10 always visible | Done |
| Registration records ≠ unique students ≠ student-streams | Done |
| Gross / school share / TEJAS share for confirmed | **Done (this fix)** |
| Pending/rejected/refund never counted as received | Done |
| Owner-only auth; no student access flips; no fee-policy change | Honored |

---

## Test results

| Suite | Result |
|-------|--------|
| `staff-metrics.test.ts` (13 tests) | **PASS** |
| Gross ₹150 / school ₹30 / TEJAS ₹120 confirmed semantics | **PASS** |
| Confirmed vs pending vs reported vs rejected vs refund | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npm run lint` | **PASS** (existing `<img>` warnings only) |
| `npm run build` | **PASS** (this session) |
| `git diff --check` | **PASS** |

---

## Preview deployment

| Field | Value |
|-------|--------|
| Preview URL | *(filled after Vercel Ready)* |
| Stable alias | https://tejas-git-feat-owner-review-dashboard-phase-a-b-dhe-projects.vercel.app |
| Review path | `/schools/register/review` |
| Preview Supabase hostname | Remains **UNVERIFIED**; no migration |

---

## Held PRs / Production

#10 / #63 / #54 / #12 remain **HOLD**.  
**Production data and settings: UNCHANGED.** No merge, no promote, no SQL, no payment edits, no Auth/RLS/Storage/env changes.
