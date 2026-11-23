-- Phase 42 — READ-ONLY precheck (run in Dashboard SQL Editor before DROP).
-- Project: zapccpipwxduzlnvjdmy
-- Does NOT modify data, policies, grants, or Auth users.

-- A) Target policy must match approved identity (expect exactly 1 row).
select
  policyname,
  schemaname,
  tablename,
  cmd,
  roles::text as roles,
  (qual ilike '%tejas-registration-files%' and qual ilike '%tejas-payment-proofs%') as two_bucket_scope,
  (qual ilike '%cf49f328-d5d6-4eb4-9aaf-bc0cbefa3355%') as uuid_match,
  (with_check is null) as no_with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname = 'tejas_storage_backup_objects_select';

-- B) Snapshot all storage.objects policies (preserve for post-DROP compare).
select
  policyname,
  cmd,
  roles::text as roles
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;

-- C) RLS enabled flag on storage.objects (should remain unchanged after DROP).
select
  n.nspname as schema,
  c.relname as table,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'storage'
  and c.relname = 'objects';

-- D) Count backup-named policies (expect 1 before DROP).
select count(*) as tejas_storage_backup_policy_count
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like 'tejas_storage_backup%';
