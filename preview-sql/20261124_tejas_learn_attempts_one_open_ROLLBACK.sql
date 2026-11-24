-- REVIEW-ONLY / OWNER-APPROVED APPLY ONLY.
-- Rollback for tejas_learn_attempts_one_open.
--
-- WARNING: Dropping this index REMOVES database-level protection against
-- concurrent duplicate open attempts. Application reconcile logic alone is
-- not an atomic substitute. Prefer leaving the index in place.
--
-- Precheck (2026-11-24): index was already present from durable portal migration
-- `20261118000200_tejas_learning_portal_durable.sql`. Rolling it back on
-- Production is generally NOT recommended.

begin;

drop index if exists public.tejas_learn_attempts_one_open;

commit;

-- Post-rollback verification (read-only):
-- select exists (
--   select 1 from pg_indexes
--   where schemaname = 'public' and indexname = 'tejas_learn_attempts_one_open'
-- ) as still_present;  -- expect false
