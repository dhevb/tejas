-- PREVIEW ONLY — nbeslngnrsagarosuaab
-- READ-ONLY Option A live RPC verification. Do NOT run on Production.
-- Safe: SELECT only. No CREATE/REPLACE/UPDATE/DELETE.

-- 1) Confirm project (manual: URL must show nbeslngnrsagarosuaab)

-- 2) Function bodies must NOT contain primary-stream equality (except comments)
select p.proname,
       pg_get_function_identity_arguments(p.oid) as args,
       (pg_get_functiondef(p.oid) like '%books.stream_id = students.stream_id%') as still_has_primary_stream_eq,
       (pg_get_functiondef(p.oid) like '%p_amount is distinct from 49%') as has_fee_49_gate,
       (pg_get_functiondef(p.oid) like '%classes.class_level = students.class_level%') as has_class_eligibility,
       (pg_get_functiondef(p.oid) like '%status <> ''superseded''%'
         or pg_get_functiondef(p.oid) like '%entitlements.status <> ''superseded''%') as has_superseded_gate,
       (pg_get_functiondef(p.oid) like '%unique_violation%') as has_unique_violation_handler
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('tejas_learn_report_payment', 'tejas_learn_review_payment')
order by 1;

-- Expected after Option A:
-- still_has_primary_stream_eq = false for BOTH functions
-- has_fee_49_gate = true for report_payment
-- has_class_eligibility = true for BOTH
-- has_superseded_gate = true for BOTH
-- has_unique_violation_handler = true for report_payment

-- 3) EXECUTE privileges (service_role only)
select p.proname, r.rolname, has_function_privilege(r.oid, p.oid, 'EXECUTE') as can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join pg_roles r
where n.nspname = 'public'
  and p.proname in ('tejas_learn_report_payment', 'tejas_learn_review_payment')
  and r.rolname in ('anon', 'authenticated', 'service_role', 'public')
order by 1, 2;

-- Expected: service_role true; anon/authenticated/public false
