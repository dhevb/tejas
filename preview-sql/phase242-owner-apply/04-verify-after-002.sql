-- PREVIEW ONLY — nbeslngnrsagarosuaab
-- Read-only checks after migration 002. Do not run on Production.

select 'tejas_learn_publication' as obj, to_regclass('public.tejas_learn_publication') is not null as present
union all select 'tejas_learn_staff', to_regclass('public.tejas_learn_staff') is not null
union all select 'tejas_staff_sessions', to_regclass('public.tejas_staff_sessions') is not null;

select p.proname,
       pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'tejas_staff_bump_session',
    'tejas_learn_rotate_session',
    'tejas_learn_register_student',
    'tejas_learn_correct_registration',
    'tejas_learn_report_payment',
    'tejas_learn_review_payment',
    'tejas_learn_set_publication'
  )
order by 1, 2;

-- EXECUTE should be service_role only (expect no anon/authenticated EXECUTE)
select p.proname, r.rolname, has_function_privilege(r.oid, p.oid, 'EXECUTE') as can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join pg_roles r
where n.nspname = 'public'
  and p.proname in (
    'tejas_learn_report_payment','tejas_learn_review_payment','tejas_staff_bump_session'
  )
  and r.rolname in ('anon','authenticated','service_role','public')
order by 1, 2;

-- FT seed only (Eng/Math not invented here)
select id, stream_id, publication_status, fee_inr
from public.tejas_learn_books
order by id;

select count(*) as book_class_rows from public.tejas_learn_book_classes;
select count(*) as test_rows from public.tejas_learn_tests;

-- Preservation
select count(*) as utr_rows from public.tejas_payment_utrs;
select count(*) as staff_session_rows from public.tejas_staff_sessions;

-- Option A not yet applied: primary-stream equality still present
select p.proname,
       pg_get_functiondef(p.oid) like '%books.stream_id = students.stream_id%' as still_has_primary_stream_eq
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('tejas_learn_report_payment','tejas_learn_review_payment');
