-- PREVIEW ONLY — nbeslngnrsagarosuaab
-- Read-only checks after migration 001. Do not run on Production.

select 'tejas_learn_students' as obj, to_regclass('public.tejas_learn_students') is not null as present
union all select 'tejas_learn_audit', to_regclass('public.tejas_learn_audit') is not null
union all select 'tejas_learn_books', to_regclass('public.tejas_learn_books') is not null
union all select 'tejas_learn_book_classes', to_regclass('public.tejas_learn_book_classes') is not null
union all select 'tejas_learn_tests', to_regclass('public.tejas_learn_tests') is not null
union all select 'tejas_learn_questions', to_regclass('public.tejas_learn_questions') is not null
union all select 'tejas_learn_options', to_regclass('public.tejas_learn_options') is not null
union all select 'tejas_learn_entitlements', to_regclass('public.tejas_learn_entitlements') is not null
union all select 'tejas_learn_attempts', to_regclass('public.tejas_learn_attempts') is not null;

select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'tejas_learn_students','tejas_learn_audit','tejas_learn_books','tejas_learn_book_classes',
    'tejas_learn_tests','tejas_learn_questions','tejas_learn_options','tejas_learn_entitlements',
    'tejas_learn_attempts'
  )
order by 1;

-- Existing objects must still exist
select 'tejas_payment_utrs' as obj, to_regclass('public.tejas_payment_utrs') is not null as present
union all select 'tejas_staff_sessions', to_regclass('public.tejas_staff_sessions') is not null;
