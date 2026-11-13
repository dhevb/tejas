# TEJAS production migration preflight

Preflight time: 13 November 2026, 6:57 PM IST.
The owner later authorised both files. The execution record is at the end of this document. Pull request 14 was not merged, and the portal was not deployed or published.

The production session was a read-only transaction. It ended with `commit` of that read-only transaction. No row or schema object was changed.

## 1. Exact branch and commit

| Item | Value |
| --- | --- |
| Repository | `dhevb/tejas` |
| Branch | `cursor/stream-class-portal-2878` |
| HEAD | `f86189a90ccbaebf122406ee5129d29a20a294de` |
| Security-fix commit | `cefa39dbea2ae6fc38f97e19bde0cc764961a29d` (13 November 2026, 6:39 PM IST) |
| Pull request | https://github.com/dhevb/tejas/pull/14 |
| PR state | Open. `mergedAt` is null. Mergeable. Base `main`. |
| Production site | https://tejas.dhe.org.in |
| Supabase project | `zapccpipwxduzlnvjdmy` |

Commits after `cefa39d` are documentation only:

| Commit | Change |
| --- | --- |
| `45d8eaa` | `docs/PORTAL_FINAL_SECURITY_READINESS_REPORT.md` |
| `f86189a` | The same report, adding the Preview URL section |

`git diff cefa39d HEAD -- supabase/migrations` is empty. No application file changed after the security fix.

Preview deployments that contain this portal code:

| Commit | Deployment | Created | URL | Vercel |
| --- | --- | --- | --- | --- |
| `45d8eaa` | `7766086830` | 13 November 2026, 6:42 PM IST | https://tejas-gbvi64vui-dhe-projects.vercel.app | success |
| `f86189a` | `7766192913` | 13 November 2026, 6:47 PM IST | https://tejas-4f13cws67-dhe-projects.vercel.app | success |

The owner confirmed the authenticated Preview. The deployment named for that check was `45d8eaa`. The later `f86189a` deployment contains the same portal routes and the same two migration files. It adds only the report text. Protection was not changed.

## 2. Migration filenames and checksums

Order:

1. `supabase/migrations/20261113_tejas_learning_portal.sql`
2. `supabase/migrations/20261113_tejas_learning_portal_durable.sql`

| File | SHA-256 |
| --- | --- |
| `20261113_tejas_learning_portal.sql` | `4d68d0578ee5c578115f8c03e42b3953b3054f3493c2188e7581b96cac71c628` |
| `20261113_tejas_learning_portal_durable.sql` | `65f370b086e3f0a35fbfc58c41c3216fcb3262beba054f57529386f2e04916d5` |

These checksums are the files at HEAD. They are the same bytes as `cefa39d`. Neither file differs from the reviewed security fix. The preflight does not stop for a file mismatch.

The two SQL files do not insert a row into `supabase_migrations.schema_migrations`. Running them records objects. It does not, by itself, add a migration-history row.

## 3. Production database baseline

Connected through the configured pooler `aws-0-ap-northeast-1.pooler.supabase.com` port 5432, database `postgres`, SSL required. The login identifies project `zapccpipwxduzlnvjdmy`. The session reported `transaction_read_only = on`.

| Check | Expected | Measured |
| --- | --- | --- |
| Server version | PostgreSQL 17 | 17.11 |
| Migration history | `20261031` / `tejas_registration` | One row: `20261031` / `tejas_registration` |
| Public tables | 14 | 14 |
| Portal tables (`tejas_learn_*` or `tejas_staff_sessions`) | 0 | 0 |
| `tejas_registrations` | 2 | 2 |
| `tejas_payments` | 2 | 2 |
| `tejas_schools` | 2 | 2 |
| `tejas_book_orders` | 2 | 2 |
| `tejas_audit_logs` | 11 | 11 |
| `tejas_admin_users` | 0 | 0 |

All 14 existing public tables have row-level security enabled, force row-level security off, and zero policies. The tables are `tejas_admin_users`, `tejas_audit_logs`, `tejas_book_orders`, `tejas_coordinators`, `tejas_ebook_access`, `tejas_idempotency`, `tejas_payment_proofs`, `tejas_payments`, `tejas_principals`, `tejas_registration_files`, `tejas_registration_streams`, `tejas_registrations`, `tejas_schools`, and `tejas_students`.

Storage, read only:

| Bucket | Public | File size limit | Objects |
| --- | --- | --- | --- |
| `tejas-payment-proofs` | false | 5,242,880 bytes | 2 |
| `tejas-registration-files` | false | 10,485,760 bytes | 2 |

The baseline matches the previously verified counts. The preflight does not stop for a baseline difference.

## 4. Backup verification

| Item | Result |
| --- | --- |
| File | `/home/ubuntu/tejas-backups/tejas-public-20261113.dump.enc` |
| Mode and size | `600`, 37,072 bytes. Unchanged after this check. |
| Decrypt | Succeeded with the configured passphrase. The passphrase was not printed. The plaintext was removed after the archive list. |
| Archive | Dump version 1.16-0. Dumped from PostgreSQL 17.11 by pg_dump 17.12. |
| Table data | All 14 `public.tejas_*` registration tables are present. |
| Isolated restore | Local database `tejas_pg17_restore` on PostgreSQL 17.12. It has 14 public tables, 0 portal tables, 2 registrations, 2 payments, 2 schools, 2 book orders, 11 audit logs, and 0 admin users. |
| Database backup | Verified. |
| Supabase Auth backup | Not included. |
| Storage object backup | Not included. Bucket configuration was read from production. The object bytes are not in this dump. |

The backup is present and readable. The preflight does not stop for backup failure.

## 5. Security verification

Checked against the current migration files and the follow-up section of `docs/PORTAL_FINAL_SECURITY_READINESS_REPORT.md` (13 November 2026, 6:39 PM IST). That section is the current finding. Earlier sections in the same report describe the audit from before `cefa39d`.

| Check | Current file | Report follow-up |
| --- | --- | --- |
| Seven functions, `search_path = pg_catalog` | 7 settings. Zero `search_path = public`. | Matches |
| Portal tables schema-qualified inside functions | No unqualified `insert into tejas_`, `update tejas_`, or `from tejas_` | Matches |
| Dynamic SQL | No `EXECUTE` statement in a function body | Matches |
| EXECUTE revoked from `public`, `anon`, `authenticated` | 7 revoke statements | Matches |
| EXECUTE granted to `service_role` | 7 grant statements | Matches |
| ₹49 check | Constraint `tejas_learn_entitlements_fee_49` requires `amount_inr = 49` and `mock_test_amount_inr = 0` | Matches |
| One payment reference | Partial unique index `tejas_learn_entitlements_one_reference` | Matches |
| RLS | Migration 1 enables it on 9 tables. Migration 2 enables it on 3 more. Total 12. | Matches |
| Policies | Neither file contains `create policy` | Matches |
| Seeds | `ft-book-1`, `ft-book-2`, and ten tests, all `awaiting_approval`, fee 49, mock-test fee 0 | Matches |
| English or Mathematics content | No book, test, or question insert for those streams. The student check still allows those streams and classes. | Matches |

No discrepancy with the follow-up. The preflight does not stop.

## 6. Migration 1 execution plan

Do not run this until a separate owner instruction names project `zapccpipwxduzlnvjdmy` and both files.

File: `supabase/migrations/20261113_tejas_learning_portal.sql`.

Run this file once, as its own script. It already contains `begin` and `commit`. If it errors, do not run it again until the database state is inspected.

It creates nine empty tables:

1. `tejas_learn_students`
2. `tejas_learn_audit`
3. `tejas_learn_books`
4. `tejas_learn_book_classes`
5. `tejas_learn_tests`
6. `tejas_learn_questions`
7. `tejas_learn_options`
8. `tejas_learn_entitlements`
9. `tejas_learn_attempts`

It enables row-level security on those nine tables. It creates no policies, functions, triggers, or seed rows. `tejas_learn_entitlements.mock_test_amount_inr` must be 0. `amount_inr` must be at least 0 until migration 2 tightens it to 49.

It does not name `tejas_registrations`, `tejas_payments`, `tejas_schools`, `tejas_book_orders`, `tejas_audit_logs`, or any storage object.

The file has no `GRANT`. On this Supabase project, default privileges grant table privileges to `anon`, `authenticated`, and `service_role` when a table is created. Row-level security with zero policies still returns no rows and blocks writes for roles that do not bypass row-level security. That is the state measured on the disposable database. It is not a change to the 14 existing tables.

Migration 1 alone does not give the application `password_salt`, `session_version`, or the seven functions. Do not point production traffic at the portal after migration 1 only.

### Verification after migration 1

Run only these selects:

```sql
select version, name from supabase_migrations.schema_migrations order by version;
select count(*) as public_tables
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r';
select c.relname, c.relrowsecurity,
       (select count(*) from pg_policy p where p.polrelid = c.oid) as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'tejas_learn%'
order by 1;
select count(*) as regs from public.tejas_registrations;
select count(*) as pays from public.tejas_payments;
select count(*) as schools from public.tejas_schools;
select count(*) as orders from public.tejas_book_orders;
select count(*) as audit from public.tejas_audit_logs;
```

Expected: history still one row, `20261031` / `tejas_registration`. Public tables 23. Nine `tejas_learn_*` tables, each with row-level security on and zero policies. Registration counts unchanged: 2, 2, 2, 2, 11.

If any existing count changed, stop. Do not start migration 2. Use the rollback in section 9 for the nine tables.

## 7. Migration 2 execution plan

File: `supabase/migrations/20261113_tejas_learning_portal_durable.sql`.

Run it once, after migration 1 has verified. It already contains `begin` and `commit`. If it errors, the transaction rolls back. Do not run it a second time until the error is understood. A clean failure leaves the migration 1 tables in place and does not leave a half-applied function.

It adds:

- Columns `password_salt` and `session_version` on `tejas_learn_students`.
- Payment columns on `tejas_learn_entitlements`: `transaction_reference`, `reported_at`, `verified_at`, `verified_by`, `note`.
- Columns `book_id` and `expires_at` on `tejas_learn_attempts`.
- Tables `tejas_learn_publication`, `tejas_learn_staff`, and `tejas_staff_sessions`.
- Indexes, including one active entitlement per student and book, one open attempt per student and test, and one non-null payment reference (`tejas_learn_entitlements_one_reference`).
- Check constraint `tejas_learn_entitlements_fee_49`: amount 49, mock-test fee 0, and a 6–80 character reference when the status is `reported`, `verified`, or `rejected`.
- Seven security-definer functions, owned by the migration role, `search_path = pg_catalog`, tables named `public.*`:
  - `tejas_staff_bump_session(text)`
  - `tejas_learn_rotate_session(uuid)`
  - `tejas_learn_register_student(text, text, text, text, text, text, text, text, integer, text, integer, integer)`
  - `tejas_learn_correct_registration(uuid, text, integer, text, integer, integer, text, text)`
  - `tejas_learn_report_payment(uuid, text, text, integer)`
  - `tejas_learn_review_payment(uuid, text, text, text, text)`
  - `tejas_learn_set_publication(text, text, text, text, text)`
- `REVOKE ALL` on each function from `public`, `anon`, and `authenticated`.
- `GRANT EXECUTE` on each function to `service_role`.
- Seed identities for `ft-book-1` (classes 6–8) and `ft-book-2` (classes 9–10), fee 49, mock-test fee 0, `awaiting_approval`.
- Ten test identities, five per book, 25 questions each, `awaiting_approval`.
- Row-level security on the three new tables.

It does not insert question text, publication overrides, students, or payments. It does not update the 14 registration tables or the storage buckets.

After both files, the portal has 12 tables.

### Verification after migration 2

```sql
select count(*) as portal_tables
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
  and (c.relname like 'tejas_learn%' or c.relname = 'tejas_staff_sessions');
select p.proname, pg_get_userbyid(p.proowner) as owner, p.prosecdef, p.proconfig,
       has_function_privilege('anon', p.oid, 'execute') as anon_exec,
       has_function_privilege('authenticated', p.oid, 'execute') as auth_exec,
       has_function_privilege('public', p.oid, 'execute') as public_exec,
       has_function_privilege('service_role', p.oid, 'execute') as service_exec
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname like 'tejas_%'
order by 1;
select conname from pg_constraint where conname = 'tejas_learn_entitlements_fee_49';
select indexname from pg_indexes where indexname = 'tejas_learn_entitlements_one_reference';
select id, publication_status, fee_inr, mock_test_fee_inr from public.tejas_learn_books order by 1;
select id, publication_status from public.tejas_learn_tests order by 1;
select count(*) as publication_rows from public.tejas_learn_publication;
select count(*) as students from public.tejas_learn_students;
select count(*) as regs from public.tejas_registrations;
select count(*) as pays from public.tejas_payments;
select count(*) as schools from public.tejas_schools;
select count(*) as orders from public.tejas_book_orders;
select count(*) as audit from public.tejas_audit_logs;
select id, public from storage.buckets order by 1;
```

Expected:

- 12 portal tables.
- Seven functions. Owner is the migration role. `prosecdef` true. `proconfig` is `{search_path=pg_catalog}`. `anon`, `authenticated`, and `public` are false. `service_role` is true.
- The fee constraint and the reference index exist.
- Both books are `awaiting_approval`, fee 49, mock-test fee 0.
- All ten tests are `awaiting_approval`.
- Publication override rows 0. Student rows 0.
- Registration counts still 2, 2, 2, 2, and 11.
- Both storage buckets still private. Object counts still 2 and 2.

## 8. Verification SQL

Use the selects in sections 6 and 7. They do not insert, update, or delete. Run migration 1, verify, then run migration 2, then verify again. Do not combine the two files into one unplanned script.

Before either file, repeat the baseline counts in section 3. Stop if they are no longer 14 public tables, 0 portal tables, 2 registrations, 2 payments, 2 schools, 2 book orders, 11 audit logs, and 0 admin users.

## 9. Rollback SQL

This statement list dropped only portal objects on disposable PostgreSQL 17.12 database `tejas_fix_sec`. Sentinel registration, payment, school, book-order, and audit rows stayed at 1. Reinstalling both files restored 12 portal tables and the execute denials. It was not run on production.

Run the drops in this order. Do not drop schema `public`. Do not drop any `tejas_registrations`, `tejas_payments`, `tejas_schools`, `tejas_book_orders`, `tejas_audit_logs`, or storage object.

```sql
drop function if exists public.tejas_staff_bump_session(text);
drop function if exists public.tejas_learn_rotate_session(uuid);
drop function if exists public.tejas_learn_register_student(text, text, text, text, text, text, text, text, integer, text, integer, integer);
drop function if exists public.tejas_learn_correct_registration(uuid, text, integer, text, integer, integer, text, text);
drop function if exists public.tejas_learn_report_payment(uuid, text, text, integer);
drop function if exists public.tejas_learn_review_payment(uuid, text, text, text, text);
drop function if exists public.tejas_learn_set_publication(text, text, text, text, text);
drop table if exists public.tejas_learn_options;
drop table if exists public.tejas_learn_questions;
drop table if exists public.tejas_learn_attempts;
drop table if exists public.tejas_learn_entitlements;
drop table if exists public.tejas_learn_book_classes;
drop table if exists public.tejas_learn_tests;
drop table if exists public.tejas_learn_books;
drop table if exists public.tejas_learn_audit;
drop table if exists public.tejas_learn_publication;
drop table if exists public.tejas_learn_staff;
drop table if exists public.tejas_staff_sessions;
drop table if exists public.tejas_learn_students;
```

If migration 2 never committed, the function drops are harmless and the table drops remove the nine migration 1 tables. If students have been created after a later go-live, this rollback deletes those portal rows. It still does not delete Olympiad registration rows.

## 10. Expected final production state

After both files, and before any student uses the portal:

- 26 public tables: the original 14 plus 12 portal tables.
- Portal tables empty except two unpublished books, five class mappings, and ten unpublished test identities.
- No publication override. No student. No entitlement. No staff account.
- Seven functions executable only by `service_role`.
- Registration counts unchanged.
- Storage buckets unchanged. No new objects.
- Migration history still the single `20261031` row, unless the owner separately records these files.
- Books and tests remain awaiting approval. Nothing is published by the SQL.

## 11. Remaining risks and limitations

1. The service-role key bypasses row-level security. Loss of that key exposes registration rows and password hashes once students exist.
2. `anon` and `authenticated` receive table privileges from Supabase default privileges. Row-level security blocks their rows. The functions do not grant them EXECUTE.
3. `password_salt` is nullable. The application stores a salt. A direct service-role insert could omit it.
4. Question text stays in `content/portal/catalog.json`. The database seeds identities only.
5. The SQL backup does not include Supabase Auth users or the four private storage objects.
6. These two files do not update `supabase_migrations.schema_migrations`.
7. Production `/learn` stays absent until a separate production deploy. This preflight does not deploy it.
8. Applying the SQL does not publish books or tests. A later staff action can change publication. Do not do that as part of the migration.

## 12. Owner approval requirement

This document is a plan. It is not approval to run it.

Stop, and do not run either file, if any of these are true:

- The baseline counts differ from section 3.
- The backup file is missing, not mode 600, or does not decrypt to the 17.11 archive.
- Either checksum differs from section 2.
- `schema_migrations` already contains either portal filename, or any `tejas_learn_*` table exists.
- The connection is not project `zapccpipwxduzlnvjdmy`.
- A statement would update the 14 existing registration tables.
- Any error appears. Do not retry automatically.

A later instruction must name project `zapccpipwxduzlnvjdmy` and authorise both files, in the order in section 2, before either file is applied.

## Approval summary

- Project: `zapccpipwxduzlnvjdmy`, PostgreSQL 17.11.
- File 1: `supabase/migrations/20261113_tejas_learning_portal.sql`.
- File 2: `supabase/migrations/20261113_tejas_learning_portal_durable.sql`.
- Order: file 1, verify, file 2, verify.
- New objects: 12 portal tables, seven security-definer functions, the ₹49 check, the payment-reference index, and unpublished book and test identities.
- Existing registrations, payments, schools, printed-book orders, and audit logs are not modified by either file. Current counts are 2, 2, 2, 2, and 11.
- Database backup: verified. Auth backup: not included. Storage object backup: not included.
- Rollback SQL is in section 9 and was tested on disposable PostgreSQL 17.12.

Stopped here. Neither migration was applied.

PRODUCTION PREFLIGHT ONLY. NO MIGRATION APPLIED. NO PRODUCTION DATA OR SCHEMA MODIFIED. NO PR MERGED. NO PRODUCTION DEPLOYMENT OR CONTENT PUBLICATION PERFORMED.

## Production Execution Record — 13 November 2026

The owner authorised both reviewed files on project `zapccpipwxduzlnvjdmy`. This section is the production result. Earlier sections are the preflight plan and the local tests.

| Item | Result |
| --- | --- |
| Project | `zapccpipwxduzlnvjdmy` |
| Connection | Production pooler `aws-0-ap-northeast-1.pooler.supabase.com`, database `postgres`. Server version 17.11. The local restore is 17.12 and was not used. |
| Migration 1 | SUCCESS. Committed 13 November 2026, 7:16 PM IST. |
| Migration 2 | SUCCESS. Committed 13 November 2026, 7:17 PM IST. |
| File 1 checksum | `4d68d0578ee5c578115f8c03e42b3953b3054f3493c2188e7581b96cac71c628` |
| File 2 checksum | `65f370b086e3f0a35fbfc58c41c3216fcb3262beba054f57529386f2e04916d5` |
| Portal tables | 12 |
| Students, entitlements, publication overrides, questions | 0 |

Migration history, read back from production:

| version | name |
| --- | --- |
| `20261031` | `tejas_registration` |
| `20261113_tejas_learning_portal` | `tejas_learning_portal` |
| `20261113_tejas_learning_portal_durable` | `tejas_learning_portal_durable` |

Each new history row stores the SHA-256 of the applied file. The history rows were inserted only after that file's transaction committed and the read-only checks passed.

### Functions

All seven functions are owned by `postgres`, security definer, with `{search_path=pg_catalog}`. Function bodies have no unqualified portal table reference and no dynamic `EXECUTE`.

| Function | anon | authenticated | public | service_role |
| --- | --- | --- | --- | --- |
| `tejas_staff_bump_session` | false | false | false | true |
| `tejas_learn_rotate_session` | false | false | false | true |
| `tejas_learn_register_student` | false | false | false | true |
| `tejas_learn_correct_registration` | false | false | false | true |
| `tejas_learn_report_payment` | false | false | false | true |
| `tejas_learn_review_payment` | false | false | false | true |
| `tejas_learn_set_publication` | false | false | false | true |

### RLS, fee, and publication

All 12 portal tables have row-level security enabled and zero policies. Owner is `postgres`.

`tejas_learn_entitlements_fee_49` is present: amount must be 49, mock-test amount must be 0, and a reported, verified, or rejected row needs a reference of 6 to 80 characters. `tejas_learn_entitlements_one_reference` is present.

| Item | Status |
| --- | --- |
| `ft-book-1` | technology, classes 6–8, `awaiting_approval`, fee 49, mock-test fee 0 |
| `ft-book-2` | technology, classes 9–10, `awaiting_approval`, fee 49, mock-test fee 0 |
| Tests | 10, all `awaiting_approval`, question count 25 |
| Non-technology books | 0 |
| Question rows | 0 |

### Existing data

| Table | Before | After |
| --- | --- | --- |
| `tejas_registrations` | 2 | 2 |
| `tejas_payments` | 2 | 2 |
| `tejas_schools` | 2 | 2 |
| `tejas_book_orders` | 2 | 2 |
| `tejas_audit_logs` | 11 | 11 |
| `tejas_admin_users` | 0 | 0 |

Both storage buckets remain private. Each still has 2 objects.

### Warnings

Supabase default privileges granted `anon`, `authenticated`, and `service_role` table privileges on the new portal tables. There are no policies. Row-level security still hides the rows from `anon` and `authenticated`. The function EXECUTE grants were not given to those roles. No grant was revoked, because that was not part of the authorised files.

The portal application is not deployed to https://tejas.dhe.org.in. Pull request 14 remains open. No student account was created and no payment was submitted.

BOTH AUTHORISED MIGRATIONS APPLIED AND VERIFIED. NO EXISTING REGISTRATION DATA MODIFIED. NO PR MERGED. NO PRODUCTION DEPLOYMENT OR CONTENT PUBLICATION PERFORMED.
