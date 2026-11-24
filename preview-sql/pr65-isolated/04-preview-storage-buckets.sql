-- PR #65 isolated Preview ONLY. Do NOT run on Production.
-- Private buckets required by lib/registration/database.ts uploads/downloads.
-- No public policies: anon/authenticated stay denied; service_role used by Next.js server.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tejas-payment-proofs',
  'tejas-payment-proofs',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tejas-registration-files',
  'tejas-registration-files',
  false,
  10485760,
  array[
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

commit;
