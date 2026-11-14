-- NOT APPLIED.
-- Follow-up to 20261114_payment_verification.sql.
-- Adds an atomic UTR registry and aligns the private screenshot bucket with JPEG, PNG, and WebP.
-- It does not update or delete historical payment rows. Existing references stay as they were stored.
-- If the same normalized UTR already appears twice, the first backfill row is kept and the later
-- insert is skipped. Those historical rows are not rewritten.
-- Do not run this against production until the owner has reviewed it.

begin;

create table if not exists tejas_payment_utrs (
  utr_key text primary key,
  utr_text text not null,
  category text not null check (category in ('school-registration', 'individual-registration', 'school-book', 'individual-book', 'ebook')),
  owner_reference text not null,
  extracted_utr text,
  bank_result text,
  review_reason text,
  proof_ext text check (proof_ext is null or proof_ext in ('jpg', 'png', 'webp')),
  amount_due integer,
  payment_status text,
  reported_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tejas_payment_utrs_owner_idx on tejas_payment_utrs (owner_reference);

alter table tejas_payment_utrs enable row level security;

revoke all on table tejas_payment_utrs from public, anon, authenticated;

insert into tejas_payment_utrs (utr_key, utr_text, category, owner_reference, amount_due, payment_status)
select
  upper(regexp_replace(payments.transaction_reference, '[[:space:]]', '', 'g')),
  payments.transaction_reference,
  'school-registration',
  registrations.reference,
  payments.amount_due,
  payments.status
from tejas_payments as payments
join tejas_registrations as registrations on registrations.id = payments.registration_id
where payments.transaction_reference is not null
  and length(upper(regexp_replace(payments.transaction_reference, '[[:space:]]', '', 'g'))) between 6 and 40
on conflict (utr_key) do nothing;

insert into tejas_payment_utrs (utr_key, utr_text, category, owner_reference, amount_due, payment_status, reported_at)
select
  upper(regexp_replace(entitlements.transaction_reference, '[[:space:]]', '', 'g')),
  entitlements.transaction_reference,
  'ebook',
  'ebook:' || entitlements.student_id::text || ':' || entitlements.book_id,
  entitlements.amount_inr,
  entitlements.status,
  entitlements.reported_at
from tejas_learn_entitlements as entitlements
where entitlements.transaction_reference is not null
  and entitlements.status <> 'rejected'
  and length(upper(regexp_replace(entitlements.transaction_reference, '[[:space:]]', '', 'g'))) between 6 and 40
on conflict (utr_key) do nothing;

update storage.buckets
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'tejas-payment-proofs';

commit;

-- Reverse, only if no new claims should be kept:
-- begin;
-- update storage.buckets
-- set allowed_mime_types = array['image/jpeg', 'image/png', 'application/pdf']
-- where id = 'tejas-payment-proofs';
-- drop table if exists tejas_payment_utrs;
-- commit;
-- Historical payment rows and stored files are not removed by either direction.
