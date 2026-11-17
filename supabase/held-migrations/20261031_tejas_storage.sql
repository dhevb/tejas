-- NOT APPLIED. Run only after 20261031_tejas_registration.sql has been compared with the
-- live schema and a backup of any existing tejas_* rows has been stored outside the database.
-- This file creates a private bucket and indexes. It does not delete objects or rows.

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

-- storage.objects already has row level security. No public policy is added.
-- The server uses the service role after its own staff check. Anonymous and
-- authenticated clients have no policy granting select, insert, or update.

create index if not exists tejas_schools_pan_idx on tejas_schools (pan);
create index if not exists tejas_registrations_reference_idx on tejas_registrations (reference);
create index if not exists tejas_payments_status_idx on tejas_payments (status);

-- Reverse, only while the bucket is empty and these indexes are unused:
-- drop index if exists tejas_payments_status_idx, tejas_registrations_reference_idx, tejas_schools_pan_idx;
-- delete from storage.buckets where id = 'tejas-payment-proofs';
