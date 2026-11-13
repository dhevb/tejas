# TEJAS portal — final security and migration readiness

Audit time: 13 November 2026, 6:22 PM IST.
This audit did not apply a migration, change production data, merge the pull request, deploy, or publish content.

## 1. Executive summary

The 6:22 PM IST finding was **B. READY AFTER SPECIFIC FIXES**. The follow-up later on 13 November 2026 fixes those two items. The current decision is in **Follow-up Security Fixes — 13 November 2026** at the end of this file.

**B. READY AFTER SPECIFIC FIXES**

Commit `6e65fad` closes the earlier hole that left seven security-definer functions executable by `anon` and `authenticated`. That result was reproduced on disposable PostgreSQL 17.12. Untrusted roles cannot call the functions, cannot create objects in `public`, and cannot change seeded book rows.

The functions are not yet safe against a same-session temporary table. With `search_path = public`, an unqualified table name resolves to `pg_temp` first. A local probe counted the temporary table (2) while `public.tejas_learn_students` still had 0 rows. A second probe that named `public.tejas_learn_students` and set `search_path = pg_catalog` ignored the temporary table. That correction is not in the migration file. It was tested only in the disposable database.

Production still has the 14 registration tables and no portal tables.

## 2. Exact commit and branch

| Item | Value |
| --- | --- |
| Repository | `dhevb/tejas` |
| Branch | `cursor/stream-class-portal-2878` |
| HEAD | `6e65fad8225e98ae3680791af16419b19cb6228a` |
| Commit time | 13 November 2026, 6:14 PM IST |
| Subject | Revoke portal function execute from anon and authenticated. |
| Files after `6e65fad` | No migration file differs from that commit. |

## 3. Migration file verification

| Check | Result | Evidence |
| --- | --- | --- |
| `supabase/migrations/20261113_tejas_learning_portal.sql` exists | PASS | Read from HEAD. |
| `supabase/migrations/20261113_tejas_learning_portal_durable.sql` exists | PASS | Read from HEAD. |
| Order | PASS | The durable file alters tables created by the first file. On PostgreSQL 17.12 the first file ran, then the second. |
| Migration 1 is additive | PASS | It creates nine empty `tejas_learn_*` tables. It does not name registration, payment, school, or printed-book tables. |
| Migration 2 is additive to portal objects | PASS | It adds columns, three tables, indexes, seven functions, and unpublished book and test identity rows. |
| Existing registration tables left in place | PASS | A disposable database held sentinel rows in `tejas_registrations`, `tejas_payments`, `tejas_schools`, `tejas_book_orders`, and `tejas_audit_logs`. After both migrations, rollback, and reinstall, each sentinel count was still 1. |
| Migration 2 can be applied twice | PASS | The second run completed. Existing columns and indexes were skipped. `anon` execute grants remained 0. |
| Migration 1 alone is enough for the portal | FAIL as a runtime target, PASS as a safe first step | The application selects `password_salt` and `session_version` and calls the seven functions. Those objects are only in the second file. |

Migration 1 enables row-level security on its nine tables and creates no functions, triggers, or policies. Migration 2 enables row-level security on `tejas_learn_publication`, `tejas_learn_staff`, and `tejas_staff_sessions`. There are no triggers and no policies in either file. Seed rows for `ft-book-1`, `ft-book-2`, and ten tests are `awaiting_approval`. The seed does not insert `tejas_learn_publication` rows and does not insert question text.

## 4. SECURITY DEFINER function audit

Migration 1 has no functions. Migration 2 has these seven. Each is owned by `postgres`, is security definer, and has `{search_path=public}`.

| Function | Returns | Dynamic SQL | Caller check inside the function |
| --- | --- | --- | --- |
| `tejas_staff_bump_session(text)` | integer | None | Subject must match `^[A-Za-z0-9-]{1,80}$`. No role check. |
| `tejas_learn_rotate_session(uuid)` | integer | None | Updates the supplied student id. |
| `tejas_learn_register_student(text, text, text, text, text, text, text, text, integer, text, integer, integer)` | uuid | None | Table checks enforce stream and class. Amount is whatever the caller sends. |
| `tejas_learn_correct_registration(uuid, text, integer, text, integer, integer, text, text)` | void | None | Supersedes entitlements for the supplied student. |
| `tejas_learn_report_payment(uuid, text, text, integer)` | void | None | Updates the matching entitlement. Does not require the amount to be 49. |
| `tejas_learn_review_payment(uuid, text, text, text, text)` | void | None | Sets verified or rejected for the supplied student and book. |
| `tejas_learn_set_publication(text, text, text, text, text)` | void | None | Writes `tejas_learn_publication`. |

None of the function bodies schema-qualify table names. None use `EXECUTE` or `format()` to build SQL. Values are passed as parameters. They cannot change a SQL identifier.

The functions do not read `auth.uid()` or a session cookie. Any caller who can execute them can pass another student's id. Today the only role that can execute them is `service_role`. The application is responsible for passing the student id from the signed session.

## 5. search_path and schema privilege findings

| Check | Result | Evidence |
| --- | --- | --- |
| Production `anon` can CREATE in `public` | PASS (denied) | `has_schema_privilege('anon','public','CREATE')` is false. ACL is `anon=U`, usage only. |
| Production `authenticated` can CREATE in `public` | PASS (denied) | Same check is false. |
| `public` role can CREATE in `public` | PASS (denied) | `has_schema_privilege('public','public','CREATE')` is false. |
| Local `anon` / `authenticated` CREATE in `public` | PASS (denied) | `permission denied for schema public`. |
| Either role can create a temporary table | WARNING | `anon` created `pg_temp.tejas_learn_students`. Temporary objects do not need CREATE on `public`. |
| Unqualified name follows the temporary table | WARNING | `probe_shadow()`, with `search_path = public`, returned 2. Those rows were only in the temporary table. |
| Schema-qualified name ignores the temporary table | PASS for the tested correction | `probe_qualified()` used `public.tejas_learn_students` and `search_path = pg_catalog`. It returned 0. |
| `anon` can use that temporary table to call a portal function | PASS (blocked) | The call returned `permission denied for function tejas_learn_register_student`. |
| Extensions or untrusted schemas referenced | PASS | Bodies use built-in operators, `now()`, and `jsonb_build_object`. No extension call. |

`search_path = public` is not a complete barrier. PostgreSQL still searches `pg_temp` before `public` for an unqualified table, even when `pg_temp` is not written in the setting. That was measured, not assumed.

Recommended correction, tested locally and not written into the migration file. On every function:

```sql
set search_path = pg_catalog
```

And qualify every portal table, for example `public.tejas_learn_students`, `public.tejas_learn_entitlements`, `public.tejas_learn_audit`, `public.tejas_learn_publication`, and `public.tejas_staff_sessions`. Keep the existing revoke and grant statements.

## 6. Function execution privileges

Measured after a fresh apply on PostgreSQL 17.12 with this project's default function grants, and again after running the durable file a second time.

| Function | anon | authenticated | public | service_role |
| --- | --- | --- | --- | --- |
| All seven `tejas_*` functions | false | false | false | true |

Actual calls:

| Caller | Call | Result |
| --- | --- | --- |
| `anon` | `tejas_learn_set_publication` and `tejas_learn_review_payment` | `permission denied for function` |
| `authenticated` | The same two calls | `permission denied for function` |
| `service_role` | `tejas_learn_register_student` | Returned a student id. The transaction was rolled back. Public student count returned to 0. |

No other function in the two files is callable. The only other function touched during the audit was the local probe pair, which was rolled back or dropped.

## 7. RLS, table, and sequence privileges

All 12 portal tables have row-level security enabled, force row-level security off, owner `postgres`, and zero policies. There is no portal sequence.

Default privileges still grant `anon`, `authenticated`, and `service_role` SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, and TRIGGER on all 12 tables.

| Action as `anon` | Result |
| --- | --- |
| SELECT students, staff, sessions | 0 rows |
| UPDATE every book to `published` | 0 rows changed. Books stayed `awaiting_approval`. |
| DELETE entitlements | 0 rows |
| INSERT a student | `new row violates row-level security policy` |
| UPDATE book fee as `authenticated` | 0 rows. Fees stayed 49. |

There is no database role per student. Student A cannot open Student B's row through `anon` or `authenticated`, because those roles see no portal rows. A `service_role` call can name another student id. The Next.js routes pass the id from the signed cookie (`lib/portal/current.ts` rejects a cookie whose generation does not match `session_version`).

Direct PostgREST access with the anon key would meet the same RLS result: no visible rows and no successful write. Revoking the table grants from `anon` and `authenticated` would make those calls fail as permission denied instead of returning an empty set. That is optional defense in depth. It is not required for the measured result, and it was not applied.

## 8. Service-role key security

| Check | Result | Evidence |
| --- | --- | --- |
| Key used only on the server | PASS | `SUPABASE_SERVICE_ROLE_KEY` appears in `lib/registration/durable.ts` and server tests. |
| `NEXT_PUBLIC_` exposure | PASS | No `NEXT_PUBLIC_` Supabase variable in the repository. |
| Client component imports a service-role client | PASS | No `createClient` usage in application code. |
| Responses print the key | PASS | `durable.ts` says the key is never logged or returned. Tests assert credential text is not returned. |
| Hard-coded key in git | PASS | Tests use repeated placeholder characters, not a live key. |

`service_role` has `rolbypassrls = true` on production. A leaked service-role key can read password hashes and change portal and registration rows. The key is not a browser secret. This audit did not print it.

## 9. Student authentication and session security

| Check | Result | Evidence |
| --- | --- | --- |
| Password hash | PASS | `hashPassword` uses scrypt, 32 bytes, and a random 16-byte hex salt. Comparison uses `timingSafeEqual`. |
| Unique salt stored | PASS | Remote registration sends `p_password_salt`. The column is nullable in SQL, so a direct service-role insert could omit it. Login then fails the comparison. |
| One active device | PASS | `rotateSession` advances `session_version`. `current.ts` rejects a mismatched cookie. Test “a second sign-in replaces the only active session” passed. |
| Expired session | PASS | The same test seals a cookie with an expiry in the past and `openSession` returns null. |
| Student cannot change stream or class | PASS | `updateProfile` rejects `streamId` or `classLevel`. The SQL correction path is a staff route that requires `staffIdentity()`. |
| Staff recovery token | PASS | Version 0 is accepted only for the subject `recovery`, and only while no numeric staff session version is stored. It does not insert `tejas_learn_staff`. |
| Named staff audit | PASS | `staffIdentity()` returns `recovery` or the account email. Payment, correction, and publication routes use that value. |

## 10. Payment and entitlement security

| Check | Result | Evidence |
| --- | --- | --- |
| ₹49 once, mock tests included | PASS in the application | `quoteFee` returns 49 only when the catalog book fee is 49 and the mock-test fee is 0. Catalog books are 49 and 0. |
| Database forces 49 | WARNING | `tejas_learn_register_student` stores `p_amount` as given. `tejas_learn_report_payment` matches that stored amount. A service-role caller can pass another number. A browser caller cannot, because the route uses `quoteFee`. |
| Unverified or rejected payment | PASS | Access requires entitlement status `verified`. Tests cover unpaid and rejected states. |
| Duplicate active entitlement | PASS | Partial unique index `tejas_learn_entitlements_one_active`. The application test refuses a second active row. |
| Class change does not transfer payment | PASS | `tejas_learn_correct_registration` sets old rows to `superseded` and inserts an unpaid row. |
| Student cannot set payment status | PASS | Profile and payment routes do not accept a status field from the student. The review route requires staff identity. |
| Olympiad registration and printed books | PASS | This audit did not change those tables. `npm test` ran the registration, fee, school-share, and payment-history tests: all passed. |

## 11. Content and mock test validation

The catalog at `content/portal/catalog.json` was counted, not edited.

| Check | Result | Evidence |
| --- | --- | --- |
| Book 1, classes 6–8 | PASS | `ft-book-1`, classes `[6, 7, 8]`, fee 49. |
| Book 2, classes 9–10 | PASS | `ft-book-2`, classes `[9, 10]`, fee 49. |
| Ten tests, five per book, 25 questions, 250 total | PASS | Counted in the catalog. |
| 30 minutes | PASS | Each test has `timeMinutes` 30. |
| No negative marking | PASS | `scoreAnswers` counts correct answers only. It does not subtract wrong answers. |
| Retakes closed by default | PASS | `retakesAllowed()` is true only when `TEJAS_PORTAL_RETAKES=allow`. |
| English and Mathematics books | PASS | No non-technology book is in the catalog. The application returns `fee_not_approved` for those streams. |
| Publication | PASS | Catalog status is `awaiting_approval`. SQL seeds use the same status. `tejas_learn_publication` is not seeded, so there is no published override. |
| Answer key hidden before submit | PASS | `toPublicQuestion` returns number, section, prompt, and options. The test “a submitted score is calculated by the server” asserts the packed public payload does not include `explanation`. |
| Book 1 cover | Not reviewed | Ignored, as instructed. |

## 12. Migration installation and rollback test

Database: disposable `tejas_audit_sec` on local PostgreSQL 17.12, port 5433. Not production.

1. Sentinel registration, payment, school, order, and audit rows were inserted.
2. Migration 1 and migration 2 applied.
3. Migration 2 applied again. Privileges stayed denied for `anon`.
4. Portal functions and tables were dropped with the statements below.
5. Sentinel counts stayed 1. Portal table count became 0.
6. Both migrations were applied again. The sentinel count stayed 1. Portal `tejas_learn_*` tables returned (11). `anon` execute count was 0.

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

Run the drops in that order. Do not drop `public`. Do not drop `tejas_registrations`, `tejas_payments`, `tejas_schools`, `tejas_book_orders`, `tejas_audit_logs`, or any other existing registration table. This rollback was not run on production.

## 13. Backup and restore evidence

| Item | Result | Evidence |
| --- | --- | --- |
| Encrypted file present | PASS | `/home/ubuntu/tejas-backups/tejas-public-20261113.dump.enc`, mode 600, 37,072 bytes. It was not modified. |
| Decrypt and archive list | PASS | Decrypted to a temporary file, listed, then deleted. Archive version 1.16-0, dumped from PostgreSQL 17.11 by pg_dump 17.12. Table-data entries exist for all 14 `tejas_*` registration tables. |
| Isolated restore | PASS | Local database `tejas_pg17_restore` on PostgreSQL 17 still has 2 registrations, 2 payments, and 0 portal tables. |
| Auth backup | NOT INCLUDED | The archive list has no `auth` schema. |
| Storage object backup | NOT INCLUDED | The archive list has no `storage` schema. The four private bucket objects are not in this dump. |

## 14. Vercel and CI status

| Check | Result | Evidence |
| --- | --- | --- |
| GitHub status for `6e65fad` | PASS | Vercel state `success`, description “Deployment has completed”. |
| Vercel Preview Comments | PASS | Conclusion `success`. |
| Supabase Preview | NOT RUN | Conclusion `skipped`. No Supabase branch is linked. |
| Latest preview deployment | PASS for creation | GitHub deployment sha `6e65fad`, created 13 November 2026, 6:16 PM IST. |
| Preview `/learn` without a Vercel session | PASS (protection holds) | HTTP 302 to `https://vercel.com/sso-api`. |
| Preview `/learn` after an authorised Vercel login | NOT VERIFIED | This audit has no Vercel session. Protection was not disabled. |
| Production `https://tejas.dhe.org.in/learn` | PASS as expected | HTTP 404, `x-matched-path: /404`. The portal is not on `main`. |

## 15. Regression test results

Run on 13 November 2026, 6:22 PM IST, from this commit.

| Command | Result |
| --- | --- |
| `npm test` | 43 passed, 0 failed, 0 skipped |
| `npx tsc --noEmit --incremental false` | Passed, no output |
| `npm run lint` | Passed, with two warnings |
| `npm run build` | Passed, 56 static pages |

The warnings are `@next/next/no-img-element` in `components/brand/TejasEmblem.tsx` and `react-hooks/exhaustive-deps` in `components/shared/Countdown.tsx`. Commit `6e65fad` does not change those files.

The test run includes school registration, fee splits, printed-book payment behaviour, staff recovery sign-in, one-device session replacement, payment status, server scoring, and the hosted-database refusal.

## 16. Production database status

Read-only checks on 13 November 2026, 6:22 PM IST. No `INSERT`, `UPDATE`, `DELETE`, or DDL was sent.

| Item | Value |
| --- | --- |
| Public tables | 14 |
| `tejas_learn_*` tables | 0 |
| Registrations | 2 |
| Payments | 2 |
| Schools | 2 |
| Printed-book orders | 2 |
| Migration history rows | 1 (`20261031` / `tejas_registration`) |
| `anon` / `authenticated` bypass RLS | false |
| `service_role` bypass RLS | true |

## 17. Unresolved risks

1. **search_path.** Unqualified portal table names plus `search_path = public` follow `pg_temp` in the same session. Untrusted roles cannot call the functions. The fix in section 5 should be added before production apply if the owner wants the functions safe even for a caller who can execute them.
2. **Service-role key.** It bypasses row-level security. Loss of that key exposes hashes and registration rows.
3. **₹49 is enforced by the application**, not by a database check on `p_amount`.
4. **`password_salt` is nullable.**
5. **Table grants to `anon` and `authenticated` remain.** Row-level security returns no rows and blocks inserts. Revoking those grants is optional.
6. **Question text stays in `content/portal/catalog.json`.** The database seeds identities only.
7. **Auth users and the four private storage files are not in the SQL backup.**
8. **Preview behaviour after Vercel login was not opened in this audit.**

## 18. Final recommendation

**B. READY AFTER SPECIFIC FIXES**

Apply the schema-qualified `search_path` correction in section 5 to `20261113_tejas_learning_portal_durable.sql`, then repeat the temporary-table probe. After that result is clean, both files are ready for a separate owner approval.

Do not apply either file to production as part of this audit. Do not merge pull request 14. Do not publish the books or tests.

NO PRODUCTION MIGRATION APPLIED. NO PRODUCTION DATA MODIFIED. NO PR MERGED. NO DEPLOYMENT OR CONTENT PUBLICATION PERFORMED.

## Follow-up Security Fixes — 13 November 2026

Follow-up time: 13 November 2026, 6:39 PM IST.
These results are from disposable PostgreSQL 17.12 database `tejas_fix_sec` on local port 5433. This follow-up did not open a production database connection.

### Decision

**A. READY FOR OWNER APPROVAL**

The two items that kept the 6:22 PM IST audit at B are fixed in the feature branch. Signed-in Preview browsing was not completed from this environment. That visit is recorded as not verified. It is not a code change.

### Exact changed files and commit

| Item | Value |
| --- | --- |
| Fix commit | `cefa39dbea2ae6fc38f97e19bde0cc764961a29d` |
| Commit time | 13 November 2026, 6:39 PM IST |
| Branch | `cursor/stream-class-portal-2878` |
| Migration | `supabase/migrations/20261113_tejas_learning_portal_durable.sql` |
| Report | `docs/PORTAL_FINAL_SECURITY_READINESS_REPORT.md` |
| Application code | Unchanged |

The durable file has never been applied to production. Editing it is the single correction. A later migration would have left the unsafe function bodies as the first apply. Migration 1 was not changed. No second fee migration was added.

### SECURITY DEFINER functions

All seven functions remain owned by `postgres`, security definer, and free of dynamic SQL. The configured search path changed from `public` to `pg_catalog`.

| Function | Old search_path | New search_path | Unqualified portal table in the body |
| --- | --- | --- | --- |
| `tejas_staff_bump_session(text)` | `public` | `pg_catalog` | none |
| `tejas_learn_rotate_session(uuid)` | `public` | `pg_catalog` | none |
| `tejas_learn_register_student(text, text, text, text, text, text, text, text, integer, text, integer, integer)` | `public` | `pg_catalog` | none |
| `tejas_learn_correct_registration(uuid, text, integer, text, integer, integer, text, text)` | `public` | `pg_catalog` | none |
| `tejas_learn_report_payment(uuid, text, text, integer)` | `public` | `pg_catalog` | none |
| `tejas_learn_review_payment(uuid, text, text, text, text)` | `public` | `pg_catalog` | none |
| `tejas_learn_set_publication(text, text, text, text, text)` | `public` | `pg_catalog` | none |

Every portal table reference in those bodies is `public.*`. `now()`, `jsonb_build_object()`, `regexp_like()`, `btrim()`, and `char_length()` are `pg_catalog.*`. There is no portal sequence. `COALESCE` is SQL syntax, not a `pg_catalog` function. The publication audit uses an assignment when the previous status is missing. A first draft that called `pg_catalog.coalesce` failed with "function does not exist" and was replaced before this result.

After install, and again after running the durable file a second time:

| Role | EXECUTE on the seven functions |
| --- | --- |
| `anon` | denied. A call returned `permission denied for function tejas_staff_bump_session`. |
| `authenticated` | denied. A call returned `permission denied for function tejas_learn_review_payment`. |
| `public` | denied. Privilege count 0. |
| `service_role` | allowed. Privilege count 7. The calls below ran as this role. |

### Temporary-table test

The session created temporary tables named `tejas_staff_sessions`, `tejas_learn_students`, `tejas_learn_entitlements`, `tejas_learn_audit`, `tejas_learn_publication`, `tejas_learn_books`, and `tejas_learn_book_classes`, and inserted marker rows. `service_role` then called each function.

| Function | Public result | Temporary table |
| --- | --- | --- |
| `tejas_staff_bump_session('temp-subject')` | Public version 1 | Stayed at 50 |
| `tejas_learn_rotate_session` of the temporary student id | `student not found` | Stayed at session version 50 |
| `tejas_learn_rotate_session` of the real student | Public version became 2 | Unchanged |
| `tejas_learn_register_student` | Public student created | Temporary email was not copied |
| `tejas_learn_report_payment` and `tejas_learn_review_payment` | Public entitlement changed | Temporary note stayed `TEMP`, status `verified`, amount 1 |
| `tejas_learn_correct_registration` | Public class became 9 | Temporary student stayed at version 50 |
| `tejas_learn_set_publication` | Public book and test stored `awaiting_approval` | Temporary publication stayed `published`. Temporary audit stayed at 1 row. |

A temporary book named `fake-book` did not satisfy registration. The function returned `book does not match the stream and class`.

### ₹49 enforcement

The constraint `tejas_learn_entitlements_fee_49` requires `amount_inr = 49` and `mock_test_amount_inr = 0`. A `reported`, `verified`, or `rejected` row also needs a payment reference of 6 to 80 characters. The partial unique index `tejas_learn_entitlements_one_reference` allows that reference on only one entitlement row. Registration and correction functions reject any other amount before insert, and they write the literal 49 only when the book matches the student's stream and class. Review does the same match before it changes status.

| Test | Result |
| --- | --- |
| Register class 7, book 1, amount 49 | PASS. Unpaid entitlement stored at 49. |
| Register at 48, 50, 0, or -1 | PASS (rejected). Error `ebook fee must be 49`. No student row was kept. |
| Direct insert of 48 or 0 | PASS (rejected). Check constraint `tejas_learn_entitlements_fee_49`. |
| Direct insert of -5 | PASS (rejected). Existing check `amount_inr >= 0`. |
| Direct insert of `verified` with no reference | PASS (rejected). Fee constraint. |
| Report amount 48 | PASS (rejected). `ebook fee must be 49`. |
| Report the matching book at 49 | PASS. Status became `reported`, not `verified`. |
| Report the other book | PASS (rejected). `payment report was not accepted`. |
| Same reference on a second student | PASS (rejected). `duplicate payment reference`. The second student then used a different reference. |
| Reject the first report | PASS. Content stays locked because the status is not `verified`. |
| Verify the second student | PASS. Only that student's book 1 row became `verified`. |
| Verify book 2 for the class 7 student | PASS (rejected). `no reported payment`. No book 2 row was created. |
| Correct class 7 to class 9 with amount 48 | PASS (rejected). `ebook fee must be 49`. |
| Correct class 7 to class 9 with amount 49 | PASS. Old book 1 row became `superseded`. New book 2 row was `unpaid`. |
| Reuse the old reference on the new row | PASS (rejected). `duplicate payment reference`. |
| New reference, then staff verification | PASS. Only the new row became `verified` at 49. The old row stayed `superseded`. |
| English registration with no book | PASS. No entitlement row. |
| Seeded books | PASS. Both remained `awaiting_approval` at fee 49 and mock-test fee 0. |

The application still quotes 49 before it calls these functions. The database now rejects a different amount even when the caller is `service_role` and uses the function or a direct insert.

### Migration install and rollback

On `tejas_fix_sec`, with sentinel rows in `tejas_registrations`, `tejas_payments`, `tejas_schools`, `tejas_book_orders`, and `tejas_audit_logs`:

1. Migration 1 and migration 2 applied.
2. Migration 2 applied again. Privileges stayed denied for `anon`, `authenticated`, and `public`.
3. Portal functions and tables were dropped with the statements in section 12. Sentinel counts stayed 1. Portal table count became 0.
4. Both migrations were applied again. Sentinel registration and payment counts stayed 1. Portal tables returned (12). `anon` execute count was 0. `service_role` execute count was 7. The fee constraint and the reference index were present.

### Preview

`NOT VERIFIED — AUTHENTICATED PREVIEW VISIT NOT COMPLETED`

This environment has no Vercel session. Preview protection was not changed. An unauthenticated response is not evidence that `/learn` works after login. Production `https://tejas.dhe.org.in/learn` is a different site and was not used as a substitute. The deployment URL and the per-route result are in **Authenticated Preview verification — 13 November 2026** below.

### Regression

| Command | Result |
| --- | --- |
| `npm test` | 43 passed, 0 failed, 0 skipped |
| `npx tsc --noEmit --incremental false` | Passed, no output, after the build had finished |
| `npm run lint` | Passed, with the same two warnings in `TejasEmblem.tsx` and `Countdown.tsx` |
| `npm run build` | Passed, 56 static pages, including `/learn`, `/learn/login`, `/learn/register`, `/learn/staff`, `/learn/dashboard`, `/learn/account`, and `/learn/pay` |

The registration, school-share, printed-book payment, one-device session, rejected-payment, and server-scoring tests passed in that `npm test` run. Those tests use the file store and registration doubles. They do not write to production.

### Remaining risks

1. The service-role key still bypasses row-level security. A holder of that key can insert a valid ₹49 row. A browser caller cannot set the amount or the status.
2. `password_salt` remains nullable.
3. `anon` and `authenticated` still have table grants. Row-level security blocks the rows. Revoking the grants is optional and was not done.
4. Question text stays in the catalog file. The database seeds identities only. Books and tests stay `awaiting_approval`.
5. Supabase Auth and Storage objects are not in the SQL backup recorded earlier.
6. The signed-in Preview visit is not verified. The exact deployment URL is in the preview section below.

These do not change the decision. Production migration, merge, deployment, and publication were not done.

ONLY FEATURE-BRANCH CODE/MIGRATION CHANGES WERE MADE. NO PRODUCTION MIGRATION APPLIED. NO PRODUCTION DATA MODIFIED. NO PR MERGED. NO PRODUCTION DEPLOYMENT OR CONTENT PUBLICATION PERFORMED.

## Authenticated Preview verification — 13 November 2026

Checked at 13 November 2026, 6:44 PM IST. No application source or migration file was changed. No Vercel protection setting was changed.

### Commit and deployment

| Item | Value |
| --- | --- |
| Security fix | `cefa39dbea2ae6fc38f97e19bde0cc764961a29d` (13 November 2026, 6:39 PM IST) |
| Deployment of `cefa39d` alone | None. GitHub reports that commit as pending, with no check runs and no Preview deployment. |
| Latest successful Preview that contains `cefa39d` | `45d8eaa307841fd6132ad8b06226f893dd413af7` |
| Deployment | GitHub deployment `7766086830`, state `success`, created 13 November 2026, 6:42 PM IST |
| Preview URL | https://tejas-gbvi64vui-dhe-projects.vercel.app |
| Difference from `cefa39d` | `45d8eaa` changes only `docs/PORTAL_FINAL_SECURITY_READINESS_REPORT.md`. The portal route files are the ones from `cefa39d`. |
| Vercel check | `Vercel` status success, “Deployment has completed”. `Vercel Preview Comments` success. `Supabase Preview` skipped. |

The deployed tree contains `app/learn/page.tsx`, `app/learn/login/page.tsx`, `app/learn/register/page.tsx`, `app/learn/staff/page.tsx`, `app/learn/dashboard/page.tsx`, `app/learn/account/page.tsx`, and `app/learn/pay/page.tsx`. That is source evidence that this deployment includes the routes. It is not a signed-in page view.

### What was reached without a Vercel session

Each of the seven paths returned HTTP 302 to `https://vercel.com/sso-api`. The query string was not recorded. `x-matched-path` was absent, so the request did not reach the Next.js app. This shows Preview protection is on. It is not a pass for any route.

No authorised browser session was available. No password or token was requested or stored.

### Route results

| Route | Result | Evidence |
| --- | --- | --- |
| `/learn` | NOT VERIFIED | Present in the deployed tree. Live response was the Vercel SSO redirect. |
| `/learn/login` | NOT VERIFIED | Present in the deployed tree. Live response was the Vercel SSO redirect. |
| `/learn/register` | NOT VERIFIED | Present in the deployed tree. Live response was the Vercel SSO redirect. |
| `/learn/staff` | NOT VERIFIED | Present in the deployed tree. Live response was the Vercel SSO redirect. |
| `/learn/dashboard` | NOT VERIFIED | Present in the deployed tree. Live response was the Vercel SSO redirect. |
| `/learn/account` | NOT VERIFIED | Present in the deployed tree. Live response was the Vercel SSO redirect. |
| `/learn/pay` | NOT VERIFIED | Present in the deployed tree. Live response was the Vercel SSO redirect. |

`NOT VERIFIED — AUTHENTICATED PREVIEW VISIT NOT COMPLETED`

### Manual check for the owner

Open https://tejas-gbvi64vui-dhe-projects.vercel.app while already signed in to the Vercel team. Leave deployment protection on. Do not create a student account, submit a payment, or publish a book or test.

1. `/learn` shows the heading “E-book and mock tests”, with links to create an account and to sign in.
2. `/learn/login` shows the heading “Sign in” and a link to create an account. Leave the form blank.
3. `/learn/register` shows the registration form. Leave it blank.
4. `/learn/staff` shows “E-book and mock-test inventory” and a staff sign-in form. The student list stays empty before staff sign-in. Do not publish.
5. `/learn/dashboard`, `/learn/account`, and `/learn/pay`, opened with no student session, redirect to `/learn/login`.

Production `https://tejas.dhe.org.in` was not used for this check.

NO PRODUCTION MIGRATION APPLIED. NO PRODUCTION DATA MODIFIED. NO PR MERGED. NO PRODUCTION DEPLOYMENT OR CONTENT PUBLICATION PERFORMED.
