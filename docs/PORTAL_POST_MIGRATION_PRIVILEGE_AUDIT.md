# TEJAS portal post-migration privilege audit

Audit time: 13 November 2026, 7:21 PM IST.
Project: `zapccpipwxduzlnvjdmy`. Database `postgres`. PostgreSQL 17.11.
This session used a read-only transaction. It did not grant, revoke, or change any production object.

READ-ONLY PRIVILEGE AUDIT ONLY. NO PRODUCTION PRIVILEGES CHANGED. NO DATA MODIFIED. NO PR MERGED. NO DEPLOYMENT.

## 1. What was measured

All 12 portal tables are owned by `postgres`. Row-level security is enabled. Force row-level security is off. Each table has zero policies.

| Role | Bypasses row-level security |
| --- | --- |
| `anon` | false |
| `authenticated` | false |
| `service_role` | true |
| `postgres` | true |

`anon` and `authenticated` have USAGE on schema `public` and do not have CREATE. That schema privilege was not changed and is not part of the recommended SQL. Registration objects in `public` still need it.

There is no portal sequence. No column uses an identity or a `nextval` default. Generated ids use `gen_random_uuid()`. Sequence privilege rows for `tejas_learn%` and `tejas_staff%`: 0.

The pseudo-role `public` has 0 table grants on the 12 portal tables.

## 2. Current table privileges

Each of the 12 tables has the same seven privileges for `anon`, `authenticated`, `service_role`, and `postgres`: SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, and TRIGGER. That is 84 grants per role. These came from the project's default privileges when the tables were created. The migration files do not contain a table `GRANT`.

The 12 tables are:

`tejas_learn_students`, `tejas_learn_audit`, `tejas_learn_books`, `tejas_learn_book_classes`, `tejas_learn_tests`, `tejas_learn_questions`, `tejas_learn_options`, `tejas_learn_entitlements`, `tejas_learn_attempts`, `tejas_learn_publication`, `tejas_learn_staff`, `tejas_staff_sessions`.

Default privileges in schema `public`, for both `supabase_admin` and `postgres`, still grant the same table, function, and sequence rights to `anon`, `authenticated`, and `service_role` on objects created later. This audit does not recommend changing those defaults. A default-privilege change would apply to every future object in `public`, including a future registration table.

## 3. Function privileges

All seven functions are owned by `postgres`, security definer, with `search_path = pg_catalog`.

| Function | anon | authenticated | public | service_role |
| --- | --- | --- | --- | --- |
| `tejas_staff_bump_session` | false | false | false | true |
| `tejas_learn_rotate_session` | false | false | false | true |
| `tejas_learn_register_student` | false | false | false | true |
| `tejas_learn_correct_registration` | false | false | false | true |
| `tejas_learn_report_payment` | false | false | false | true |
| `tejas_learn_review_payment` | false | false | false | true |
| `tejas_learn_set_publication` | false | false | false | true |

The recommended SQL does not touch these functions.

## 4. How the application reaches the tables

There is no browser Supabase client and no `NEXT_PUBLIC` Supabase key. Every portal request is made by the Next.js server in `lib/portal/supabase-rest.ts`. That helper sends `apikey` and `authorization` from `serverKeyValue()` in `lib/registration/durable.ts`. The only accepted names are `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_SECRET_KEY`. The anon key is not used.

Books, questions, and options are read from `content/portal/catalog.json` by `loadCatalog()` in `lib/portal/catalog.server.ts`. The application does not query `tejas_learn_books`, `tejas_learn_book_classes`, `tejas_learn_tests`, `tejas_learn_questions`, or `tejas_learn_options`.

Direct table calls, all with the server key:

| Table | Methods used |
| --- | --- |
| `tejas_learn_students` | GET, PATCH |
| `tejas_learn_publication` | GET |
| `tejas_learn_entitlements` | GET |
| `tejas_learn_attempts` | GET, POST, PATCH |
| `tejas_learn_audit` | GET, POST |
| `tejas_learn_staff` | GET, POST |
| `tejas_staff_sessions` | GET |

The server also calls the seven functions through `/rest/v1/rpc/`. Those calls need EXECUTE on `service_role`. They do not need `anon` or `authenticated` table grants. The function body runs as the owner, `postgres`.

No student, staff, registration, payment, school, or printed-book page opens a portal table with the anon key. No workflow requires direct `anon` or `authenticated` access to these 12 tables.

## 5. Recommendation

It is safe to revoke every table privilege on the 12 portal tables from `anon`, `authenticated`, and `public`.

Reasons:

- The application uses the service role for every portal table call.
- `anon` and `authenticated` do not bypass row-level security, and there are no policies, so they already receive no rows. The grants are still present, so a later policy or a disabled row-level security setting would expose the tables to the anon key. Revoking the grants makes that exposure fail as permission denied.
- `public` currently has no grant. Including it in the revoke changes nothing today and blocks a later grant to that pseudo-role from being forgotten.
- There is no portal sequence, so no sequence revoke is required.
- The statement names the 12 tables. It does not name `tejas_registrations`, `tejas_payments`, `tejas_schools`, `tejas_book_orders`, `tejas_audit_logs`, or `tejas_admin_users`.
- It does not revoke from `service_role` or `postgres`, does not change function EXECUTE, does not change policies, and does not enable force row-level security.

Force row-level security stays off. Turning it on would not change `service_role`, because that role bypasses row-level security by attribute. It is not part of this recommendation.

## 6. SQL awaiting approval

Do not run this until the owner approves it. It was not run during this audit.

```sql
begin;
revoke all privileges on table
  public.tejas_learn_students,
  public.tejas_learn_audit,
  public.tejas_learn_books,
  public.tejas_learn_book_classes,
  public.tejas_learn_tests,
  public.tejas_learn_questions,
  public.tejas_learn_options,
  public.tejas_learn_entitlements,
  public.tejas_learn_attempts,
  public.tejas_learn_publication,
  public.tejas_learn_staff,
  public.tejas_staff_sessions
from anon, authenticated, public;
commit;
```

## 7. Verification queries

Run these after an approved change. They are also safe to run before the change. The expected result after the change is `anon_grants = 0`, `auth_grants = 0`, `public_grants = 0`, and `service_grants = 84`.

```sql
begin read only;
select count(*) filter (where grantee = 'anon') as anon_grants,
       count(*) filter (where grantee = 'authenticated') as auth_grants,
       count(*) filter (where grantee in ('PUBLIC', 'public')) as public_grants,
       count(*) filter (where grantee = 'service_role') as service_grants
from information_schema.role_table_grants
where table_schema = 'public'
  and (table_name like 'tejas_learn%' or table_name = 'tejas_staff_sessions');

select c.relname, pg_get_userbyid(c.relowner) as owner, c.relrowsecurity, c.relforcerowsecurity,
       (select count(*) from pg_policy p where p.polrelid = c.oid) as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and (c.relname like 'tejas_learn%' or c.relname = 'tejas_staff_sessions')
order by 1;

select p.proname,
       has_function_privilege('anon', p.oid, 'execute') as anon_exec,
       has_function_privilege('authenticated', p.oid, 'execute') as auth_exec,
       has_function_privilege('public', p.oid, 'execute') as public_exec,
       has_function_privilege('service_role', p.oid, 'execute') as service_exec
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname like 'tejas_%'
order by 1;

select 'tejas_registrations' as t, count(*) from public.tejas_registrations
union all select 'tejas_payments', count(*) from public.tejas_payments
union all select 'tejas_schools', count(*) from public.tejas_schools
union all select 'tejas_book_orders', count(*) from public.tejas_book_orders
union all select 'tejas_audit_logs', count(*) from public.tejas_audit_logs
union all select 'tejas_admin_users', count(*) from public.tejas_admin_users;
commit;
```

Expected function result: `service_exec` true and the other three false, for all seven functions. Expected existing counts: registrations 2, payments 2, schools 2, printed-book orders 2, audit logs 11, admin users 0. Those counts are the production baseline and were not rewritten by this audit.

## 8. What this audit does not do

- It does not revoke `service_role` table privileges. The server needs SELECT, INSERT, UPDATE, and DELETE on the tables it calls.
- It does not change default privileges. A table created later in `public` would still receive `anon` and `authenticated` grants. That is a separate decision.
- It does not add policies, enable force row-level security, or publish books and tests.
- It does not merge pull request 14 or deploy the portal.

Owner approval is required before the SQL in section 6 is run.

READ-ONLY PRIVILEGE AUDIT ONLY. NO PRODUCTION PRIVILEGES CHANGED. NO DATA MODIFIED. NO PR MERGED. NO DEPLOYMENT.
