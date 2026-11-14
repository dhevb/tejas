-- NOT APPLIED.
-- Additive tables and columns for individual registrations, printed-book orders,
-- and payment-verification notes. Do not run this against production until the
-- owner has reviewed it. It does not update or delete existing rows.
-- Existing school-registration writes continue to use the current tables.
-- The new flows write tejas_case_files only after this migration exists.

begin;

create table if not exists tejas_case_files (
  reference text primary key,
  channel text not null check (channel in ('individual-registration', 'school-book', 'individual-book')),
  status text not null,
  record_snapshot jsonb not null,
  idempotency_key text unique,
  payload_hash text,
  created_at timestamptz not null default now()
);

alter table tejas_case_files enable row level security;

alter table tejas_payments
  add column if not exists entered_utr text,
  add column if not exists extracted_utr text,
  add column if not exists review_reason text,
  add column if not exists verification_source text,
  add column if not exists receiving_account text,
  add column if not exists approval_method text;

commit;

-- Reverse, only if these new objects are still unused:
-- begin;
-- alter table tejas_payments
--   drop column if exists entered_utr,
--   drop column if exists extracted_utr,
--   drop column if exists review_reason,
--   drop column if exists verification_source,
--   drop column if exists receiving_account,
--   drop column if exists approval_method;
-- drop table if exists tejas_case_files;
-- commit;
