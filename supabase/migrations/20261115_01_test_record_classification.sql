-- NOT APPLIED by this pull request.
-- Classifies exactly three owner-confirmed test identities.
-- It inserts classification rows only. It does not update payments, entitlements,
-- registrations, proofs, audit rows, or UTR text.

begin;

create or replace function public.tejas_utr_key(raw text)
returns text
language sql
immutable
parallel safe
set search_path = pg_catalog
as $$
  select pg_catalog.upper(pg_catalog.regexp_replace(
    coalesce(raw, ''::text),
    '[' || pg_catalog.chr(9) || pg_catalog.chr(10) || pg_catalog.chr(11) || pg_catalog.chr(12) || pg_catalog.chr(13) || pg_catalog.chr(32)
       || pg_catalog.chr(160) || pg_catalog.chr(5760)
       || pg_catalog.chr(8192) || pg_catalog.chr(8193) || pg_catalog.chr(8194) || pg_catalog.chr(8195) || pg_catalog.chr(8196)
       || pg_catalog.chr(8197) || pg_catalog.chr(8198) || pg_catalog.chr(8199) || pg_catalog.chr(8200) || pg_catalog.chr(8201) || pg_catalog.chr(8202)
       || pg_catalog.chr(8232) || pg_catalog.chr(8233) || pg_catalog.chr(8239) || pg_catalog.chr(8287) || pg_catalog.chr(12288) || pg_catalog.chr(65279)
       || ']',
    '',
    'g'
  ));
$$;

revoke all on function public.tejas_utr_key(text) from public;

create table if not exists public.tejas_test_record_classifications (
  category text not null check (category in (
    'school-registration',
    'individual-registration',
    'school-book',
    'individual-book',
    'ebook'
  )),
  owner_reference text not null,
  source_reference text not null,
  utr_text text not null,
  payment_status text not null,
  reason text not null check (reason = 'owner-confirmed testing'),
  classified_at timestamptz not null default pg_catalog.now(),
  primary key (category, owner_reference),
  constraint tejas_test_record_classifications_exact check (
    (category, owner_reference, source_reference, utr_text, payment_status) in (
      ('school-registration', 'school-registration:TEJAS-2026-NS553XMZZG2N8XE7DHV3', 'TEJAS-2026-NS553XMZZG2N8XE7DHV3', 'AXISCN1379239046', 'confirmed'),
      ('ebook', 'ebook:7e94efb3-2bd9-4646-91e6-eea7f3c15b44:ft-book-1', '7e94efb3-2bd9-4646-91e6-eea7f3c15b44:ft-book-1', 'AXISCN1379239046', 'verified'),
      ('school-registration', 'school-registration:TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ', 'TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ', 'AXISCN1379239048', 'reported')
    )
  )
);

alter table public.tejas_test_record_classifications enable row level security;
revoke all on table public.tejas_test_record_classifications from public;

create or replace function public.tejas_test_classification_frozen()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception 'test classification rows are append-only';
end;
$$;

revoke all on function public.tejas_test_classification_frozen() from public;

drop trigger if exists tejas_test_classification_no_change on public.tejas_test_record_classifications;
create trigger tejas_test_classification_no_change
before update or delete on public.tejas_test_record_classifications
for each row execute function public.tejas_test_classification_frozen();

do $classify$
declare
  found_count integer;
  stray text;
begin
  if to_regclass('public.tejas_case_files') is null then
    raise exception 'tejas_case_files is absent. Apply 20261114_payment_verification.sql before classification. Absence is not a count of zero orders.';
  end if;
  if to_regclass('public.tejas_payments') is null or to_regclass('public.tejas_registrations') is null or to_regclass('public.tejas_learn_entitlements') is null then
    raise exception 'payment source tables are absent. Classification was not inserted.';
  end if;

  select count(*) into found_count
  from public.tejas_payments as payments
  join public.tejas_registrations as registrations on registrations.id = payments.registration_id
  where registrations.reference = 'TEJAS-2026-NS553XMZZG2N8XE7DHV3'
    and registrations.status = 'confirmed'
    and payments.status = 'confirmed'
    and payments.transaction_reference = 'AXISCN1379239046';
  if found_count <> 1 then
    raise exception 'owner-confirmed school registration TEJAS-2026-NS553XMZZG2N8XE7DHV3 was not found exactly once with status confirmed and UTR AXISCN1379239046';
  end if;

  select count(*) into found_count
  from public.tejas_payments as payments
  join public.tejas_registrations as registrations on registrations.id = payments.registration_id
  where registrations.reference = 'TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ'
    and registrations.status = 'reported'
    and payments.status = 'reported'
    and payments.transaction_reference = 'AXISCN1379239048';
  if found_count <> 1 then
    raise exception 'owner-confirmed school registration TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ was not found exactly once with status reported and UTR AXISCN1379239048';
  end if;

  select count(*) into found_count
  from public.tejas_learn_entitlements as entitlements
  where entitlements.student_id = '7e94efb3-2bd9-4646-91e6-eea7f3c15b44'
    and entitlements.book_id = 'ft-book-1'
    and entitlements.status = 'verified'
    and entitlements.transaction_reference = 'AXISCN1379239046';
  if found_count <> 1 then
    raise exception 'owner-confirmed e-book entitlement was not found exactly once with status verified and UTR AXISCN1379239046';
  end if;

  select string_agg(label, ' | ') into stray
  from (
    select 'school-registration ' || registrations.reference || ' [' || payments.status || '] ' || payments.transaction_reference as label
    from public.tejas_payments as payments
    join public.tejas_registrations as registrations on registrations.id = payments.registration_id
    where payments.transaction_reference is not null
      and public.tejas_utr_key(payments.transaction_reference) in (public.tejas_utr_key('AXISCN1379239046'), public.tejas_utr_key('AXISCN1379239048'))
      and registrations.reference not in ('TEJAS-2026-NS553XMZZG2N8XE7DHV3', 'TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ')
    union all
    select 'ebook ' || entitlements.student_id::text || ':' || entitlements.book_id || ' [' || entitlements.status || '] ' || entitlements.transaction_reference
    from public.tejas_learn_entitlements as entitlements
    where entitlements.transaction_reference is not null
      and public.tejas_utr_key(entitlements.transaction_reference) in (public.tejas_utr_key('AXISCN1379239046'), public.tejas_utr_key('AXISCN1379239048'))
      and not (
        entitlements.student_id = '7e94efb3-2bd9-4646-91e6-eea7f3c15b44'
        and entitlements.book_id = 'ft-book-1'
        and public.tejas_utr_key(entitlements.transaction_reference) = public.tejas_utr_key('AXISCN1379239046')
      )
    union all
    select cases.channel || ' ' || cases.reference || ' [' || cases.status || '] ' || (cases.record_snapshot->'payment'->>'transactionReference')
    from public.tejas_case_files as cases
    where coalesce(cases.record_snapshot->'payment'->>'transactionReference', ''::text) <> ''
      and public.tejas_utr_key(cases.record_snapshot->'payment'->>'transactionReference') in (public.tejas_utr_key('AXISCN1379239046'), public.tejas_utr_key('AXISCN1379239048'))
  ) as conflicts;
  if stray is not null then
    raise exception 'test UTR appears on an identity that was not owner-confirmed: %', stray;
  end if;

  insert into public.tejas_test_record_classifications
    (category, owner_reference, source_reference, utr_text, payment_status, reason)
  values
    ('school-registration', 'school-registration:TEJAS-2026-NS553XMZZG2N8XE7DHV3', 'TEJAS-2026-NS553XMZZG2N8XE7DHV3', 'AXISCN1379239046', 'confirmed', 'owner-confirmed testing'),
    ('ebook', 'ebook:7e94efb3-2bd9-4646-91e6-eea7f3c15b44:ft-book-1', '7e94efb3-2bd9-4646-91e6-eea7f3c15b44:ft-book-1', 'AXISCN1379239046', 'verified', 'owner-confirmed testing'),
    ('school-registration', 'school-registration:TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ', 'TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ', 'AXISCN1379239048', 'reported', 'owner-confirmed testing');
end
$classify$;

do $classify_grants$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table public.tejas_test_record_classifications from anon';
    execute 'revoke all on function public.tejas_utr_key(text) from anon';
    execute 'revoke all on function public.tejas_test_classification_frozen() from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on table public.tejas_test_record_classifications from authenticated';
    execute 'revoke all on function public.tejas_utr_key(text) from authenticated';
    execute 'revoke all on function public.tejas_test_classification_frozen() from authenticated';
  end if;
end
$classify_grants$;

comment on table public.tejas_test_record_classifications is
  'Exactly three owner-confirmed test identities, matched by category and owner reference. A matching UTR on any other record is rejected. Anonymous roles have no privileges. Rows cannot be updated or deleted.';

commit;
