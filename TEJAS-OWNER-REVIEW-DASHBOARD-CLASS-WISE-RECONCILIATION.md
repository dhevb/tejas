# TEJAS — Owner Review Dashboard class-wise reconciliation

**Branch:** `feat/owner-review-dashboard-phase-a-b`  
**Date:** 2026-11-25 (updated after owner Preview review)  
**Mode:** Implementation evidence (synthetic unit tests; no Production data mutation)

---

## Rules

1. Class comes only from stored `classNumber` / `classLabel` (`classKeyForStudent`). Never inferred from school name or roll.
2. **Registration records (class column):** count of registration records that include ≥1 student in that class. A multi-class registration increments each touched class once. **Do not sum this column across classes and treat the sum as total registration records.** Authoritative total registration records = overview card value.
3. **Unique students:** identity key once per class within a registration (multi-stream rows do not inflate unique count).
4. **Student-streams:** count of english/mathematics/technology selections in that class.
5. Amounts: each registration’s **saved** `amountDue` is allocated to classes by stream weight; rounding adjusted so class amounts sum to registration `amountDue`.
6. Confirmed / pending / rejected / refund_pending at class level follow the registration’s `payment.status` and are **not** merged (refund is separate from rejected).
7. Classes **3–10 always appear**, including zero-count rows. Class Not Identified and other observed labels are kept when present.
8. Filtered dashboard class table uses the same `summarizeFilterableRows` formulas as the overall cards. When a class filter is selected, `scopeFilterableRowsToClass` scopes card totals to that class’s allocated metrics.

---

## Owner Preview observation (fixed)

| Observation | Cause | Fix |
|-------------|-------|-----|
| Narrow desktop column | `max-w-6xl` content shell | `max-w-[1200px]` + larger type/spacing |
| Classes missing when empty | Breakdown only emitted classes with data | `ensureStandardClassRows` pads 3–10 |
| “Registrations” column looked like student count | Label ambiguous; touch-count ≠ unique students | Explicit **Registration records** / **Unique students** / **Student-streams**; reconcile footer uses overview totals |
| Rejected vs refund mixed in class table | Class merge treated refund as rejected | Separate refund/adj. column + buckets |

---

## Synthetic reconcile (unit tests)

### A. Class 5 confirmed + reported

Registration A: 1 student Class 5, english, confirmed ₹120  
Registration B: 1 student Class 5, mathematics, reported ₹120  

| Metric | Expected | Observed |
|--------|----------|----------|
| Class 5 registration records | 2 | 2 |
| Class 5 unique students | 2 | 2 |
| Class 5 student-streams | 2 | 2 |
| Overview amountReceived | 120 | 120 |
| Overview pendingPayable | 120 | 120 |
| Classes 3–10 present | yes | yes |
| Sum class amounts | 240 | 240 |

### B. Multi-stream one registration

1 registration, Ada (2 streams Class 5) + Ben (1 stream Class 5) → registration records **1**, unique students **2**, student-streams **3**.

### C. Rejected vs refund_pending

Rejected ₹120 and refund_pending ₹120 on Class 7 → rejected and refund columns each show ₹120; confirmed remains ₹0; no double-count into received.

### D. Class filter scope

One registration: Class 5 (2 streams, ₹240) + Class 6 (1 stream, ₹120). Filter Class 5 → overview unique students **1**, streams **2**, received **₹240** matching the Class 5 row.

### E. Screenshot fee arithmetic (14 streams)

| Bucket | Amount | Streams @ ₹120 |
|--------|--------|----------------|
| Confirmed received | ₹120 | 1 |
| Pending (awaiting + reported) | ₹960 | 8 |
| Rejected | ₹240 | 2 |
| Refund/adjustment | ₹360 | 3 |
| TEJAS payable | ₹1,680 | 14 |
| Gross / school share | ₹2,100 / ₹420 | 14 @ ₹150 / ₹30 |

---

## Overall filter reconcile invariants

For any filtered row set (after optional class scope):

- `amountReceived` = sum of confirmed `amountDue` only  
- `pendingPayable` = awaiting + reported only  
- `rejectedPayable` and `refundPendingAmount` are separate; neither is received  
- `classBreakdownAmountTotal` = sum of class confirmed + pending + rejected + refund amounts = filtered `amountDue`  
- Overview unique students / student-streams match the reconcile footer under the same filters  

---

## Production

No Production class data was read or changed in this remediation. Live totals appear on Preview after owner login.
