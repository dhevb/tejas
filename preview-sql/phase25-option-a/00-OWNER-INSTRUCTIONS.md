# Phase 2.5 — Option A RPC (Preview only)

**Apply only after** Phase 2.4.2 migrations 001+002 are verified on `nbeslngnrsagarosuaab`.

**Never** run on Production `zapccpipwxduzlnvjdmy`.

## File

- `01-option-a-multistream-payment.sql`  
  Same content as `supabase/migrations/20261128000100_tejas_learn_option_a_multistream_payment.sql`

## Change

Removes **only** `and books.stream_id = students.stream_id` from:

- `tejas_learn_report_payment`
- `tejas_learn_review_payment`

All fee, class, ownership, status, and UTR uniqueness predicates remain.

## Rollback

Restore both functions from `supabase/migrations/20261118000200_tejas_learning_portal_durable.sql` (includes the primary-stream equality). See `02-rollback-to-primary-stream-eq.sql`.

## Agent note

Agent will apply this automatically once Preview Postgres/Dashboard executor is available and 001/002 are verified. Until then, Owner may run this pack manually after 2.4.2 success.
