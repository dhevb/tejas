-- Read-only Production preflight for the PR #25 migration package.
-- Do not remove the read-only transaction. This script selects and does not change rows.
-- Run the case-file script only when the catalog result shows tejas_case_files.
-- An empty collision result is complete only for the tables this script actually read.

begin read only;

select current_setting('transaction_read_only') as transaction_read_only,
       current_database() as database_name;

select c.relname as table_name,
       c.relrowsecurity as rls_enabled
from pg_class as c
join pg_namespace as n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'tejas_payments',
    'tejas_registrations',
    'tejas_learn_entitlements',
    'tejas_case_files',
    'tejas_payment_utrs',
    'tejas_test_record_classifications'
  )
order by c.relname;

select to_regclass('public.tejas_case_files') as case_files,
       to_regclass('public.tejas_payment_utrs') as registry,
       to_regclass('public.tejas_test_record_classifications') as classifications;

select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'tejas_payments' and column_name in ('status', 'transaction_reference', 'amount_due', 'registration_id'))
    or (table_name = 'tejas_registrations' and column_name in ('reference', 'status', 'record_snapshot'))
    or (table_name = 'tejas_learn_entitlements' and column_name in ('student_id', 'book_id', 'status', 'transaction_reference', 'amount_inr'))
  )
order by table_name, column_name;

select 'school-registration' as category,
       registrations.reference as owner_reference,
       payments.status as payment_status,
       payments.transaction_reference as utr_text,
       upper(regexp_replace(coalesce(payments.transaction_reference, ''::text), '[' || chr(9) || chr(10) || chr(11) || chr(12) || chr(13) || chr(32) || chr(160) || chr(5760) || chr(8192) || chr(8193) || chr(8194) || chr(8195) || chr(8196) || chr(8197) || chr(8198) || chr(8199) || chr(8200) || chr(8201) || chr(8202) || chr(8232) || chr(8233) || chr(8239) || chr(8287) || chr(12288) || chr(65279) || ']', '', 'g')) as utr_key
from tejas_payments as payments
join tejas_registrations as registrations on registrations.id = payments.registration_id
where payments.transaction_reference is not null
order by registrations.reference;

select 'ebook' as category,
       'ebook:' || student_id::text || ':' || book_id as owner_reference,
       status as payment_status,
       transaction_reference as utr_text,
       upper(regexp_replace(coalesce(transaction_reference, ''::text), '[' || chr(9) || chr(10) || chr(11) || chr(12) || chr(13) || chr(32) || chr(160) || chr(5760) || chr(8192) || chr(8193) || chr(8194) || chr(8195) || chr(8196) || chr(8197) || chr(8198) || chr(8199) || chr(8200) || chr(8201) || chr(8202) || chr(8232) || chr(8233) || chr(8239) || chr(8287) || chr(12288) || chr(65279) || ']', '', 'g')) as utr_key
from tejas_learn_entitlements
where transaction_reference is not null
order by book_id, student_id;

commit;
