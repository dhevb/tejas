-- REVIEW-ONLY / OWNER-APPROVED APPLY ONLY.
-- Purpose: Idempotently ensure at most one open attempt per (student_id, test_id).
-- Production precheck (2026-11-24, read-only, re-verified): index
-- tejas_learn_attempts_one_open was ALREADY PRESENT with exact definition match;
-- duplicate_open_groups = 0. Running this on Production is a no-op create when
-- the index name already exists, then asserts the live definition.
--
-- Does NOT:
--   - modify or delete attempt rows
--   - drop or replace an existing index
--   - change RLS / Auth / Storage / payment
--   - expire timer-elapsed open rows (that would be a separate owner-approved mutation)
--
-- Compatibility: PostgreSQL partial unique indexes (supported on Supabase Postgres).
-- Safe with existing submitted/expired rows (excluded by WHERE status = 'open').
--
-- Idempotency note:
--   CREATE UNIQUE INDEX IF NOT EXISTS is name-based only. A same-named index with a
--   wrong definition would not be recreated. The DO block below fails closed unless
--   pg_indexes.indexdef matches the canonical Production definition exactly.

begin;

create unique index if not exists tejas_learn_attempts_one_open
  on public.tejas_learn_attempts (student_id, test_id)
  where status = 'open';

do $assert$
declare
  def text;
  expected constant text :=
    'CREATE UNIQUE INDEX tejas_learn_attempts_one_open ON public.tejas_learn_attempts USING btree (student_id, test_id) WHERE (status = ''open''::text)';
begin
  select i.indexdef
    into def
  from pg_indexes i
  where i.schemaname = 'public'
    and i.indexname = 'tejas_learn_attempts_one_open';

  if def is null then
    raise exception 'tejas_learn_attempts_one_open missing after ENSURE';
  end if;

  if def is distinct from expected then
    raise exception
      'tejas_learn_attempts_one_open exists with unexpected definition (refusing silent accept). live=% expected=%',
      def,
      expected;
  end if;
end
$assert$;

commit;

-- Post-apply verification (read-only):
-- select indexname, indexdef
-- from pg_indexes
-- where schemaname = 'public' and indexname = 'tejas_learn_attempts_one_open';
