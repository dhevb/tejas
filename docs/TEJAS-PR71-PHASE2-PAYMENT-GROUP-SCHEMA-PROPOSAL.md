# TEJAS PR #71 Phase 2 — Payment-group schema proposal (NOT APPLIED)

**Status:** Proposal only. **Not applied** to Preview or Production.  
**Reason:** Existing `tejas_learn_entitlements` cannot safely represent one real bank UTR covering multiple ₹49 stream line items.

## Current constraints (blocking)

| Constraint | Effect |
|------------|--------|
| `tejas_learn_entitlements_one_reference` unique on `transaction_reference` WHERE NOT NULL | One UTR string can appear on **only one** entitlement row |
| `tejas_learn_entitlements_fee_49` | Each entitlement row must be **amount_inr = 49** |
| `tejas_learn_report_payment` RPC | Updates **one** student/book entitlement with one reference |

Therefore a single ₹147 bank transfer with one UTR cannot lawfully be stored as three entitlement rows without fabricating secondary references (forbidden) or changing schema.

## Interim Preview-safe behaviour (implemented without migration)

- Students may still **select / enrol** multiple streams.
- Payment submission accepts **exactly one unpaid stream per UTR**.
- The UTR is stored **exactly** as entered (no suffix/prefix/fabrication).
- Additional streams require separate ₹49 transfers and UTRs.
- Same UTR + same student/book retries are idempotent; a different UTR cannot overwrite a reported row.

## Proposed schema (Owner approval required before any SQL)

### Tables

1. `tejas_learn_payment_transactions`
   - `id uuid pk`
   - `student_id uuid not null references tejas_learn_students`
   - `transaction_reference text not null` — **exact bank UTR**
   - `amount_inr integer not null` — sum of lines (49 × N)
   - `status text not null` — `reported` | `verified` | `rejected`
   - `reported_at`, `verified_at`, `verified_by`, `note`
   - unique (`transaction_reference`) where not null

2. `tejas_learn_payment_lines`
   - `id uuid pk`
   - `transaction_id uuid not null references tejas_learn_payment_transactions`
   - `book_id text not null`
   - `stream_id text not null`
   - `amount_inr integer not null check (amount_inr = 49)`
   - `entitlement_id uuid null references tejas_learn_entitlements`
   - unique (`transaction_id`, `book_id`)

### Atomic verify RPC sketch

`tejas_learn_verify_payment_group(p_transaction uuid, p_decision, p_actor, p_note)`:

1. Lock transaction row.
2. If decision = verified: for each line, set matching entitlement to `verified` in one transaction; if any line fails, roll back entire group.
3. If decision = rejected: mark transaction rejected; leave entitlements unpaid/reported consistently (no partial grant).

### Entitlement rows

Keep per-book entitlements for access control, but **move UTR uniqueness** from entitlement.transaction_reference to payment_transactions.transaction_reference. Entitlement may store `payment_transaction_id` instead of (or in addition to) a denormalised reference.

## Additional Phase 2.1 finding — secondary-stream report RPC

Existing `tejas_learn_report_payment` requires:

`books.stream_id = students.stream_id`

So a student whose primary `stream_id` is English cannot report payment for a Mathematics entitlement row through this RPC, even if an unpaid entitlement was inserted via REST. That blocks true multi-stream remote payments until the RPC (or payment-group schema above) is Owner-approved.

Proposed Preview-first RPC change (NOT applied): allow report when an active unpaid entitlement exists for `(student_id, book_id)` and the book is class-eligible and fee=49, without requiring `students.stream_id = books.stream_id`.

## Explicit non-actions

- No Production SQL
- No Preview SQL until Owner authorises a Preview-only migration
- No weakening of UTR registry uniqueness
