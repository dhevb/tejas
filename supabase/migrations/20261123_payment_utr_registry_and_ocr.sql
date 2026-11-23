-- NOT APPLIED by this pull request.
-- Review-only migration for screenshot OCR auto-approval and cross-channel UTR uniqueness.
-- Do not run against Production until the owner explicitly authorises it.
-- Does not delete historical payment, registration, or book-order rows.

begin;

create table if not exists public.tejas_payment_utrs (
  utr_key text primary key,
  utr_text text not null,
  category text not null check (category in (
    'school-registration',
    'individual-registration',
    'ebook'
  )),
  owner_reference text not null,
  extracted_utr text,
  review_reason text,
  proof_ext text check (proof_ext is null or proof_ext in ('jpg', 'png', 'webp')),
  amount_due integer,
  payment_status text,
  approval_method text,
  verification_label text,
  reported_at timestamptz,
  created_at timestamptz not null default pg_catalog.now()
);

create index if not exists tejas_payment_utrs_owner_idx
  on public.tejas_payment_utrs (owner_reference);

alter table public.tejas_payment_utrs enable row level security;
revoke all on table public.tejas_payment_utrs from public;
-- Server-only access via the service role (PostgREST). Anon/authenticated get nothing.
grant select, insert, update, delete on table public.tejas_payment_utrs to service_role;

alter table public.tejas_payments
  add column if not exists entered_utr text,
  add column if not exists extracted_utr text,
  add column if not exists review_reason text,
  add column if not exists verification_label text,
  add column if not exists approval_method text,
  add column if not exists beneficiary_match text,
  add column if not exists amount_match boolean;

comment on table public.tejas_payment_utrs is
  'Atomic UTR registry across school, individual, and e-book payments. Screenshot proofs stay private.';

commit;

-- Reverse only if unused:
-- begin;
-- alter table public.tejas_payments
--   drop column if exists entered_utr,
--   drop column if exists extracted_utr,
--   drop column if exists review_reason,
--   drop column if exists verification_label,
--   drop column if exists approval_method,
--   drop column if exists beneficiary_match,
--   drop column if exists amount_match;
-- drop table if exists public.tejas_payment_utrs;
-- commit;
