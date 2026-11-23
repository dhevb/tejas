-- Phase 42 — READ-ONLY postcheck (run in Dashboard SQL Editor after DROP).
-- Project: zapccpipwxduzlnvjdmy
-- Does NOT modify data, policies, grants, or Auth users.

-- A) Target policy must be ABSENT (expect 0 rows).
select
  policyname,
  cmd,
  roles::text as roles
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname = 'tejas_storage_backup_objects_select';

-- B) Remaining storage.objects policies (compare to precheck snapshot B).
-- Expect: every prior policy except tejas_storage_backup_objects_select.
select
  policyname,
  cmd,
  roles::text as roles
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;

-- C) RLS flags unchanged vs precheck C.
select
  n.nspname as schema,
  c.relname as table,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'storage'
  and c.relname = 'objects';

-- D) Backup-named policy count (expect 0).
select count(*) as tejas_storage_backup_policy_count
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like 'tejas_storage_backup%';

-- E) Buckets still present (names only; no object mutation).
select id, name, public
from storage.buckets
where id in ('tejas-registration-files', 'tejas-payment-proofs')
order by id;
