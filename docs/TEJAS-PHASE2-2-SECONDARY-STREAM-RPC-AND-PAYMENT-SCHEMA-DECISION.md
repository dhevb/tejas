# TEJAS Phase 2.2 — Secondary-stream RPC & payment schema decision (NOT APPLIED)

**Status:** Documentation / Owner decision only.  
**No SQL, migrations, RPC alterations, or Preview/Production schema changes in this phase.**

---

## 1. Existing schema and RPC limitation

Source of truth (repo migration, not live-applied here):  
`supabase/migrations/20261118000200_tejas_learning_portal_durable.sql` → `tejas_learn_report_payment`.

The RPC updates an entitlement only when **all** of the following hold:

- `amount_inr = 49`
- entitlement not `verified` / `superseded`
- book fee constraints
- class eligibility via `tejas_learn_book_classes`
- **`books.stream_id = students.stream_id`** (primary registered stream only)

Additional constraints:

| Constraint | Effect |
|------------|--------|
| `tejas_learn_entitlements_one_reference` | One UTR string on **at most one** entitlement row |
| `tejas_learn_entitlements_fee_49` | Each entitlement row is ₹49 |
| UTR registry (`tejas_payment_utrs`) | Claim uniqueness; valid claims must not be released for reuse |

---

## 2. Why secondary-stream payment reporting fails today

Application layer allows multi-stream **enrolment** (unpaid entitlements per stream).  
Payment UI (interim) requires one unpaid stream + one exact UTR.

On **remote** Preview/Production, `reportPayment` calls `tejas_learn_report_payment`. For a student whose `students.stream_id` is English, reporting a Mathematics or Future Tech unpaid entitlement fails the `books.stream_id = students.stream_id` predicate → `payment report was not accepted`.

File-store mode does not use this RPC and can exercise multi-stream payments in unit tests only.

---

## 3. Option A — Interim model (recommended until grouped payments exist)

**Product rule (already implemented in Preview app code):**

- Student may enrol in multiple streams.
- **One ₹49 transfer and one genuine UTR per unpaid stream.**
- Already purchased streams are not charged again.
- No fabricated UTRs; no release of a valid claim after success.
- Same student + book + UTR retry is idempotent.

**Minimum schema/RPC change (Preview-first, Owner-approved SQL only):**

Relax `tejas_learn_report_payment` (and matching review path if needed) so a report is accepted when:

1. An active unpaid entitlement exists for `(student_id, book_id)`, and  
2. Book is class-eligible and fee=49, and  
3. Exact UTR uniqueness / registry claim rules still hold,  

**without** requiring `students.stream_id = books.stream_id`.

**UTR uniqueness / concurrency:** keep entitlement reference uniqueness + UTR registry claim (same-owner reuse only).  
**Idempotency:** same student/book/UTR → noop/success; different UTR after report → refuse.  
**Rollback:** restore previous RPC definition; no data rewrite required if only the predicate changes.  
**Compatibility:** existing primary-stream verified rows unchanged.  
**Risks:** must still prevent cross-student UTR reuse and cross-stream entitlement overwrite.  
**Test plan:** Preview integration — 1/2/3 stream enrol; primary + secondary report; duplicate UTR; concurrent claim; FT companion mocks rules.

---

## 4. Option B — Future grouped-payment model

**Product rule:** one bank transfer covering N streams (₹49×N), **one genuine UTR**, atomic verification.

**Minimum schema (proposal only — see also `docs/TEJAS-PR71-PHASE2-PAYMENT-GROUP-SCHEMA-PROPOSAL.md`):**

- `tejas_learn_payment_transactions` — holds the **exact** UTR + total amount + status  
- `tejas_learn_payment_lines` — one ₹49 line per book/stream  
- Move UTR uniqueness to transaction table  
- Atomic verify RPC for the whole group (all-or-nothing entitlement verify)

**UTR uniqueness / concurrency:** unique on transaction.reference; registry claim owner scoped to transaction or student.  
**Idempotency:** retry same UTR resumes same transaction.  
**Rollback:** drop new objects; entitlement rows remain; do not backfill Production until Preview proven.  
**Compatibility:** migrate carefully — existing single-stream reported/verified rows need a backfill strategy.  
**Risks:** higher migration complexity; partial verify bugs; reporting UI/OCR changes.  
**Test plan:** group create, verify, reject, concurrent duplicate UTR, mixed already-paid streams.

---

## 5. Explicit non-actions this phase

- No SQL on Preview or Production  
- No RPC replace/create  
- No weakening of UTR uniqueness  
- No Production credential use  

**Owner must choose A, B, A-then-B, or defer.** Implementation requires a separate explicit authorization.
