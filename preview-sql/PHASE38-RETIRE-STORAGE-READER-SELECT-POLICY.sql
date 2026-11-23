-- HELD — apply only after owner review in Dashboard SQL Editor
-- (project-owner / relation-owner context for storage.objects).
-- Retires the temporary Phase 38 Storage backup SELECT policy.
--
-- Project ref: zapccpipwxduzlnvjdmy
-- Exact operation: ONE drop policy on storage.objects
--   policy name: tejas_storage_backup_objects_select
--
-- Prerequisites:
--   1. Phase 38 sealed archive verified and retained offline.
--   2. Local CM session retired (already done 2026-11-23T05:21:43Z):
--        powershell -NoProfile -File .\preview-sql\retire-tejas-storage-reader-session.ps1 Retire
--   3. Run read-only precheck first:
--        preview-sql/PHASE42-OWNER-POLICY-DROP-PRECHECK.sql
--   4. No further production Storage downloads planned for this DR line.
--
-- Does NOT:
--   - CREATE / ALTER / GRANT / REVOKE
--   - Drop buckets or objects
--   - Alter other policies
--   - Touch Phase 37/38 sealed archives
--   - Modify Auth users or tejas_schema_reader / backup-dumper roles
--
-- After apply, run:
--   preview-sql/PHASE42-OWNER-POLICY-DROP-POSTCHECK.sql
-- Then ask the agent to independently re-verify (do not claim Phase 42 PASS until then).

begin;

drop policy if exists tejas_storage_backup_objects_select on storage.objects;

commit;
