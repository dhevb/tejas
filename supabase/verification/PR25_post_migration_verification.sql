-- Read-only checks after the owner applies the PR #25 package.
-- This script raises if a check fails. It does not update, delete, or insert business rows.
-- A raise inside a read-only transaction still changes nothing.

begin read only;

select current_setting('transaction_read_only') as transaction_read_only;

do $verify$
declare
  problems text;
begin
  if to_regclass('public.tejas_case_files') is null
     or to_regclass('public.tejas_payment_utrs') is null
     or to_regclass('public.tejas_test_record_classifications') is null then
    raise exception 'a required table is absent. Do not treat absence as an empty result.';
  end if;

  if (select count(*) from public.tejas_test_record_classifications) <> 3 then
    raise exception 'classification count is not exactly three';
  end if;

  if exists (
    select 1 from public.tejas_payment_utrs as registry
    join public.tejas_test_record_classifications as classified
      on classified.category = registry.category
     and classified.owner_reference = registry.owner_reference
  ) or exists (
    select 1 from public.tejas_payment_utrs
    where utr_key in (select public.tejas_utr_key(utr_text) from public.tejas_test_record_classifications)
  ) then
    raise exception 'a classified test identity or test UTR is present in the registry';
  end if;

  select string_agg(sources.category || ' ' || sources.owner_reference || ' ' || sources.utr_text, ' | ') into problems
  from (
    select 'school-registration' as category,
           'school-registration:' || registrations.reference as owner_reference,
           payments.transaction_reference as utr_text,
           public.tejas_utr_key(payments.transaction_reference) as utr_key,
           payments.status as payment_status
    from public.tejas_payments as payments
    join public.tejas_registrations as registrations on registrations.id = payments.registration_id
    where payments.transaction_reference is not null
    union all
    select 'ebook',
           'ebook:' || entitlements.student_id::text || ':' || entitlements.book_id,
           entitlements.transaction_reference,
           public.tejas_utr_key(entitlements.transaction_reference),
           entitlements.status
    from public.tejas_learn_entitlements as entitlements
    where entitlements.transaction_reference is not null
    union all
    select cases.channel,
           cases.channel || ':' || cases.reference,
           cases.record_snapshot->'payment'->>'transactionReference',
           public.tejas_utr_key(cases.record_snapshot->'payment'->>'transactionReference'),
           coalesce(cases.record_snapshot->'payment'->>'status', cases.status)
    from public.tejas_case_files as cases
    where coalesce(cases.record_snapshot->'payment'->>'transactionReference', '') <> ''
  ) as sources
  left join public.tejas_test_record_classifications as classified
    on classified.category = sources.category
   and classified.owner_reference = sources.owner_reference
  left join public.tejas_payment_utrs as registry
    on registry.utr_key = sources.utr_key
   and registry.owner_reference = sources.owner_reference
   and registry.utr_text = sources.utr_text
   and registry.payment_status = sources.payment_status
  where classified.owner_reference is null
    and registry.utr_key is null;
  if problems is not null then
    raise exception 'genuine historical reference is missing from the registry: %', problems;
  end if;

  if not exists (
    select 1 from public.tejas_payments as payments
    join public.tejas_registrations as registrations on registrations.id = payments.registration_id
    where registrations.reference = 'TEJAS-2026-NS553XMZZG2N8XE7DHV3'
      and payments.status = 'confirmed'
      and payments.transaction_reference = 'AXISCN1379239046'
  ) or not exists (
    select 1 from public.tejas_payments as payments
    join public.tejas_registrations as registrations on registrations.id = payments.registration_id
    where registrations.reference = 'TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ'
      and payments.status = 'reported'
      and payments.transaction_reference = 'AXISCN1379239048'
  ) or not exists (
    select 1 from public.tejas_learn_entitlements
    where student_id = '7e94efb3-2bd9-4646-91e6-eea7f3c15b44'
      and book_id = 'ft-book-1'
      and status = 'verified'
      and transaction_reference = 'AXISCN1379239046'
  ) then
    raise exception 'an owner-confirmed source row changed status or UTR text';
  end if;

  if exists (select 1 from pg_policies where tablename in ('tejas_payment_utrs', 'tejas_case_files', 'tejas_test_record_classifications')) then
    raise exception 'an anonymous policy exists on a payment table';
  end if;
end
$verify$;

commit;
