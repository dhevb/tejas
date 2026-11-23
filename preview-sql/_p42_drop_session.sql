-- Phase 42: exact DROP only. Session must clear read-only first for backup-dumper.
set default_transaction_read_only = off;
begin;
drop policy if exists tejas_storage_backup_objects_select on storage.objects;
commit;
