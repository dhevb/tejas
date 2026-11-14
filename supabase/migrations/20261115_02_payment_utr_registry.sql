-- NOT APPLIED by this pull request.
-- Creates the atomic UTR registry and backfills genuine historical references.
-- Owner-confirmed test identities are excluded only when category and owner reference
-- match tejas_test_record_classifications. A test UTR on any other identity aborts
-- the transaction. Any other duplicate normalized key aborts it as well.
-- Source rows, statuses, UTR text, proofs, and audit rows are not changed.

begin;

create table if not exists public.tejas_payment_utrs (
  utr_key text primary key,
  utr_text text not null,
  category text not null check (category in (
    'school-registration',
    'individual-registration',
    'school-book',
    'individual-book',
    'ebook'
  )),
  owner_reference text not null,
  extracted_utr text,
  bank_result text,
  review_reason text,
  proof_ext text check (proof_ext is null or proof_ext in ('jpg', 'png', 'webp')),
  amount_due integer,
  payment_status text,
  reported_at timestamptz,
  created_at timestamptz not null default pg_catalog.now()
);

create index if not exists tejas_payment_utrs_owner_idx on public.tejas_payment_utrs (owner_reference);

alter table public.tejas_payment_utrs enable row level security;
revoke all on table public.tejas_payment_utrs from public;

do $registry$
declare
  stray text;
  collision text;
  malformed text;
  classified integer;
begin
  if to_regclass('public.tejas_utr_key') is null and to_regprocedure('public.tejas_utr_key(text)') is null then
    raise exception 'tejas_utr_key is absent. Apply 20261115_01_test_record_classification.sql first.';
  end if;
  if to_regclass('public.tejas_test_record_classifications') is null then
    raise exception 'test classification table is absent. Apply 20261115_01_test_record_classification.sql first.';
  end if;
  if to_regclass('public.tejas_case_files') is null then
    raise exception 'tejas_case_files is absent. Absence is not treated as zero orders.';
  end if;
  if exists (select 1 from public.tejas_payment_utrs) then
    raise exception 'tejas_payment_utrs already has rows. Refusing to mix them with this backfill.';
  end if;

  lock table public.tejas_test_record_classifications in share row exclusive mode;
  lock table public.tejas_payments in share row exclusive mode;
  lock table public.tejas_registrations in share row exclusive mode;
  lock table public.tejas_learn_entitlements in share row exclusive mode;
  lock table public.tejas_case_files in share row exclusive mode;

  select count(*) into classified from public.tejas_test_record_classifications;
  if classified <> 3 then
    raise exception 'test classification must contain exactly three owner-confirmed identities, found %', classified;
  end if;
  if not exists (
    select 1 from public.tejas_test_record_classifications
    where category = 'school-registration'
      and owner_reference = 'school-registration:TEJAS-2026-NS553XMZZG2N8XE7DHV3'
      and source_reference = 'TEJAS-2026-NS553XMZZG2N8XE7DHV3'
      and utr_text = 'AXISCN1379239046'
      and payment_status = 'confirmed'
      and reason = 'owner-confirmed testing'
  ) or not exists (
    select 1 from public.tejas_test_record_classifications
    where category = 'ebook'
      and owner_reference = 'ebook:7e94efb3-2bd9-4646-91e6-eea7f3c15b44:ft-book-1'
      and source_reference = '7e94efb3-2bd9-4646-91e6-eea7f3c15b44:ft-book-1'
      and utr_text = 'AXISCN1379239046'
      and payment_status = 'verified'
      and reason = 'owner-confirmed testing'
  ) or not exists (
    select 1 from public.tejas_test_record_classifications
    where category = 'school-registration'
      and owner_reference = 'school-registration:TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ'
      and source_reference = 'TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ'
      and utr_text = 'AXISCN1379239048'
      and payment_status = 'reported'
      and reason = 'owner-confirmed testing'
  ) then
    raise exception 'test classification rows do not match the three owner-confirmed identities';
  end if;

  if exists (
    select 1
    from public.tejas_payments as payments
    left join public.tejas_registrations as registrations on registrations.id = payments.registration_id
    where payments.transaction_reference is not null
      and registrations.id is null
  ) then
    raise exception 'a payment reference has no registration row';
  end if;

  if exists (
    select 1
    from public.tejas_payments as payments
    join public.tejas_registrations as registrations on registrations.id = payments.registration_id
    where payments.transaction_reference is not null
      and coalesce(registrations.record_snapshot->'payment'->>'transactionReference', ''::text) <> ''
      and public.tejas_utr_key(payments.transaction_reference)
        is distinct from public.tejas_utr_key(registrations.record_snapshot->'payment'->>'transactionReference')
  ) then
    raise exception 'a registration snapshot UTR does not match its payment column';
  end if;

  create temporary table tejas_utr_candidates (
    category text not null,
    owner_reference text not null,
    utr_text text not null,
    utr_key text not null,
    payment_status text,
    amount_due integer,
    reported_at timestamptz,
    proof_ext text
  ) on commit drop;

  insert into tejas_utr_candidates (category, owner_reference, utr_text, utr_key, payment_status, amount_due)
  select 'school-registration',
         'school-registration:' || registrations.reference,
         payments.transaction_reference,
         public.tejas_utr_key(payments.transaction_reference),
         payments.status,
         payments.amount_due
  from public.tejas_payments as payments
  join public.tejas_registrations as registrations on registrations.id = payments.registration_id
  where payments.transaction_reference is not null;

  insert into tejas_utr_candidates (category, owner_reference, utr_text, utr_key, payment_status, amount_due, reported_at)
  select 'ebook',
         'ebook:' || entitlements.student_id::text || ':' || entitlements.book_id,
         entitlements.transaction_reference,
         public.tejas_utr_key(entitlements.transaction_reference),
         entitlements.status,
         entitlements.amount_inr,
         entitlements.reported_at
  from public.tejas_learn_entitlements as entitlements
  where entitlements.transaction_reference is not null;

  insert into tejas_utr_candidates (category, owner_reference, utr_text, utr_key, payment_status, amount_due, reported_at, proof_ext)
  select cases.channel,
         cases.channel || ':' || cases.reference,
         cases.record_snapshot->'payment'->>'transactionReference',
         public.tejas_utr_key(cases.record_snapshot->'payment'->>'transactionReference'),
         coalesce(cases.record_snapshot->'payment'->>'status', cases.status),
         case
           when coalesce(cases.record_snapshot->'charge'->>'payableToTejas', ''::text) ~ '^[0-9]+$'
             then (cases.record_snapshot->'charge'->>'payableToTejas')::integer
           when coalesce(cases.record_snapshot->'record'->'fee'->>'amountDue', ''::text) ~ '^[0-9]+$'
             then (cases.record_snapshot->'record'->'fee'->>'amountDue')::integer
           else null
         end,
         cases.created_at,
         case
           when cases.record_snapshot->>'proofExt' in ('jpg', 'png', 'webp') then cases.record_snapshot->>'proofExt'
           else null
         end
  from public.tejas_case_files as cases
  where coalesce(cases.record_snapshot->'payment'->>'transactionReference', ''::text) <> '';

  if exists (
    select 1
    from public.tejas_test_record_classifications as classified
    where not exists (
      select 1 from tejas_utr_candidates as candidates
      where candidates.category = classified.category
        and candidates.owner_reference = classified.owner_reference
        and candidates.utr_text = classified.utr_text
        and candidates.payment_status = classified.payment_status
    )
  ) then
    raise exception 'an owner-confirmed test identity is no longer present with its original UTR and status';
  end if;

  delete from tejas_utr_candidates as candidates
  using public.tejas_test_record_classifications as classified
  where candidates.category = classified.category
    and candidates.owner_reference = classified.owner_reference;

  select string_agg(category || ' ' || owner_reference || ' [' || coalesce(payment_status, ''::text) || '] ' || utr_text, ' | ')
    into stray
  from tejas_utr_candidates
  where utr_key in (
    select public.tejas_utr_key(utr_text) from public.tejas_test_record_classifications
  );
  if stray is not null then
    raise exception 'test UTR appears on an identity that was not owner-confirmed: %', stray;
  end if;

  select string_agg(category || ' ' || owner_reference || ' [' || coalesce(payment_status, ''::text) || '] key=' || utr_key || ' text=' || utr_text, ' | ')
    into malformed
  from tejas_utr_candidates
  where utr_key !~ '^[A-Z0-9-]{6,40}$';
  if malformed is not null then
    raise exception 'historical UTR cannot be claimed by the application: %', malformed;
  end if;

  select string_agg(category || ' ' || owner_reference || ' [' || coalesce(payment_status, ''::text) || '] ' || utr_text, ' | ' order by utr_key, category, owner_reference)
    into collision
  from tejas_utr_candidates
  where utr_key in (
    select grouped.utr_key
    from tejas_utr_candidates as grouped
    group by grouped.utr_key
    having count(*) > 1
  );
  if collision is not null then
    raise exception 'genuine UTR collision; no owner was selected: %', collision;
  end if;

  insert into public.tejas_payment_utrs (utr_key, utr_text, category, owner_reference, amount_due, payment_status, reported_at, proof_ext)
  select utr_key, utr_text, category, owner_reference, amount_due, payment_status, reported_at, proof_ext
  from tejas_utr_candidates;
end
$registry$;

do $registry_grants$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table public.tejas_payment_utrs from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on table public.tejas_payment_utrs from authenticated';
  end if;
end
$registry_grants$;

comment on table public.tejas_payment_utrs is
  'One normalized UTR for one genuine payment owner. The primary key is the atomic claim. Test identities are not stored here. Anonymous roles have no privileges.';

commit;
