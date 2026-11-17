-- DO NOT RUN.
-- Live inspection on 1 November 2026 found every column and table below already
-- present, both private buckets already present, row level security enabled,
-- and zero rows. Running this file is unnecessary.
-- The encrypted backup has not yet been confirmed on the operator's computer.
-- Do not execute this file, and do not drop or recreate these tables.

begin;

alter table tejas_schools
  add column if not exists previous_participation boolean,
  add column if not exists previous_reference text,
  add column if not exists representative_name text,
  add column if not exists representative_designation text;

alter table tejas_registrations
  add column if not exists record_snapshot jsonb;

alter table tejas_payments
  add column if not exists review_note text,
  add column if not exists history jsonb not null default '[]'::jsonb;

create table if not exists tejas_idempotency (
  idempotency_key text primary key,
  payload_hash text not null,
  reference text not null references tejas_registrations(reference),
  created_at timestamptz not null default now()
);

create table if not exists tejas_registration_files (
  registration_id uuid primary key references tejas_registrations(id),
  storage_path text not null,
  content_type text not null,
  byte_size integer not null check (byte_size > 0 and byte_size <= 10485760)
);

alter table tejas_schools enable row level security;
alter table tejas_principals enable row level security;
alter table tejas_coordinators enable row level security;
alter table tejas_registrations enable row level security;
alter table tejas_students enable row level security;
alter table tejas_registration_streams enable row level security;
alter table tejas_payments enable row level security;
alter table tejas_payment_proofs enable row level security;
alter table tejas_book_orders enable row level security;
alter table tejas_ebook_access enable row level security;
alter table tejas_admin_users enable row level security;
alter table tejas_audit_logs enable row level security;
alter table tejas_idempotency enable row level security;
alter table tejas_registration_files enable row level security;

-- No policies are created. Anonymous and authenticated clients stay denied.
-- The Next.js server uses the service role after its own checks.

create index if not exists tejas_schools_pan_idx on tejas_schools (pan);
create index if not exists tejas_registrations_reference_idx on tejas_registrations (reference);
create index if not exists tejas_payments_status_idx on tejas_payments (status);

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
