-- REVIEW-ONLY / OWNER-APPROVED APPLY ONLY.
-- Purpose: Idempotently ensure at most one open attempt per (student_id, test_id).
-- Production precheck (2026-11-24, read-only): index tejas_learn_attempts_one_open
-- was ALREADY PRESENT. Running this on Production is a no-op if the index exists.
--
-- Does NOT:
--   - modify or delete attempt rows
--   - change RLS / Auth / Storage / payment
--   - expire timer-elapsed open rows (that would be a separate owner-approved mutation)
--
-- Compatibility: PostgreSQL partial unique indexes (supported on Supabase Postgres).
-- Safe with existing submitted/expired rows (excluded by WHERE status = 'open').

begin;

create unique index if not exists tejas_learn_attempts_one_open
  on public.tejas_learn_attempts (student_id, test_id)
  where status = 'open';

commit;

-- Post-apply verification (read-only):
-- select indexname, indexdef
-- from pg_indexes
-- where schemaname = 'public' and indexname = 'tejas_learn_attempts_one_open';
