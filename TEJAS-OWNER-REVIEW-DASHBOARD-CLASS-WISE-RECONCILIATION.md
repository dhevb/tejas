# TEJAS — Owner Review Dashboard class-wise reconciliation

**Branch:** `feat/owner-review-dashboard-phase-a-b`  
**Date:** 2026-11-25  
**Mode:** Implementation evidence (synthetic unit tests; no Production data mutation)

---

## Rules

1. Class comes only from stored `classNumber` / `classLabel` (`classKeyForStudent`).  
2. Unique students: identity key once per class (multi-stream rows do not inflate unique count).  
3. Student-streams: count of english/mathematics/technology selections in that class.  
4. Amounts: each registration’s **saved** `amountDue` is allocated to classes by stream weight; rounding adjusted so class amounts sum to registration `amountDue`.  
5. Confirmed / pending / rejected at class level follow the registration’s `payment.status`.  
6. Filtered dashboard class table uses the same `summarizeFilterableRows` formulas as the overall cards.

---

## Synthetic reconcile (unit test)

Registration A: 1 student Class 5, english, confirmed ₹120  
Registration B: 1 student Class 5, mathematics, reported ₹120  

| Metric | Expected | Observed in test |
|--------|----------|------------------|
| Class 5 unique students | 2 | 2 |
| Class 5 student-streams | 2 | 2 |
| Class 5 confirmed ₹ | 120 | 120 |
| Class 5 pending ₹ | 120 | 120 |
| Class 5 rejected ₹ | 0 | 0 |
| Sum class ₹ | 240 | 240 |
| Overview amountReceived | 120 | 120 |
| Overview pendingPayable | 120 | 120 |

Multi-stream allocation test: Ada Class 5 with 2 streams + Ben Class 6 with 1 stream on ₹360 → Class 5 ₹240, Class 6 ₹120.

---

## Overall filter reconcile invariants (same filter set)

For any filtered row set:

- `confirmedCount` + awaiting + reported + rejected + refund_pending = registration count  
- `amountReceived` = sum of confirmed `amountDue` only  
- `pendingPayable` = awaiting + reported amounts only  
- `rejectedPayable` excludes received  
- Sum of class `confirmedAmount + pendingAmount + rejectedAmount` equals sum of filtered `amountDue` (allocation identity)

---

## Production

No Production class data was read or changed in this implementation session for reconcile proof. Live class totals appear on Preview after owner login.
