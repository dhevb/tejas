-- HELD — apply only after owner authorization.
-- Phase 38 least-privilege Storage backup access (SELECT-only).
--
-- Grants exactly one privilege shape:
--   CREATE POLICY ... FOR SELECT ... ON storage.objects
--   TO authenticated
--   USING (bucket_id IN (two TEJAS buckets) AND auth.uid() = <dedicated backup reader>)
--
-- Does NOT create INSERT, UPDATE, or DELETE policies.
-- Does NOT alter storage.buckets, public flags, MIME limits, or other policies.
--
-- Owner edit rule:
--   Replace the REAL reader UUID only in:
--     (1) declare reader uuid := '...';
--     (2) auth.uid() = '...'::uuid
--   Do NOT replace the all-zero PLACEHOLDER sentinel used by the guard below.

begin;

do $$
declare
  reader uuid := 'cf49f328-d5d6-4eb4-9aaf-bc0cbefa3355'::uuid;
  placeholder uuid := '00000000-0000-0000-0000-000000000000'::uuid;
begin
  -- Fail closed only when the reader UUID was left as the all-zero sentinel.
  if reader = placeholder then
    raise exception 'HELD SQL: replace reader UUID (not the all-zero placeholder sentinel) before apply';
  end if;
end $$;

create policy tejas_storage_backup_objects_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id in ('tejas-registration-files', 'tejas-payment-proofs')
    and auth.uid() = 'cf49f328-d5d6-4eb4-9aaf-bc0cbefa3355'::uuid
  );

commit;

-- Reverse (owner-only, after backup credentials retired):
-- drop policy if exists tejas_storage_backup_objects_select on storage.objects;
