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

create index if not exists tejas_case_files_created_idx on tejas_case_files (created_at desc);
create index if not exists tejas_case_files_channel_idx on tejas_case_files (channel);

revoke all on table tejas_case_files from public;

do $case_grants$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table public.tejas_case_files from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on table public.tejas_case_files from authenticated';
  end if;
end
$case_grants$;

comment on table tejas_case_files is
  'Individual registrations and printed-book orders. Payment screenshots stay in the private tejas-payment-proofs bucket. No anonymous policy is defined.';

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
