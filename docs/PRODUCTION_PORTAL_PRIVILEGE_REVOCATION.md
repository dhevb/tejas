# TEJAS production portal privilege revocation

Production project: `zapccpipwxduzlnvjdmy`.
Database: `postgres`.
PostgreSQL: 17.11.
Executed: 13 November 2026, 7:30 PM IST.
Result: the approved revoke committed. The read-back passed.

## 1. Exact SQL

This is the statement that ran. It matches the statement in `docs/PORTAL_POST_MIGRATION_PRIVILEGE_AUDIT.md`.

```sql
BEGIN;

REVOKE ALL PRIVILEGES ON TABLE
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
FROM anon, authenticated, public;

COMMIT;
```

The server returned `BEGIN`, `REVOKE`, `COMMIT`. No other SQL was run.

## 2. Pre-execution snapshot

Read at 13 November 2026, before 7:30 PM IST, in a read-only transaction. The connection was the production pooler for `zapccpipwxduzlnvjdmy`. Server version was 17.11.

All 12 named tables existed in `public`, owned by `postgres`. Row-level security was enabled. Force row-level security was off. Each table had zero policies.

| Role | Grants | Tables | Privilege kinds |
| --- | --- | --- | --- |
| `anon` | 84 | 12 | 7 |
| `authenticated` | 84 | 12 | 7 |
| `postgres` | 84 | 12 | 7 |
| `service_role` | 84 | 12 | 7 |
| `public` | 0 | 0 | 0 |

The seven kinds were SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, and TRIGGER, on every table, for `anon`, `authenticated`, `postgres`, and `service_role`.

All seven functions were executable by `service_role` only. `anon`, `authenticated`, and `public` were false.

Existing counts: registrations 2, payments 2, schools 2, printed-book orders 2, audit logs 11, admin users 0.

## 3. Post-execution snapshot

Read back from the same production database after the commit.

| Role | Grants | Tables | Privilege kinds |
| --- | --- | --- | --- |
| `anon` | 0 | 0 | 0 |
| `authenticated` | 0 | 0 | 0 |
| `public` | 0 | 0 | 0 |
| `postgres` | 84 | 12 | 7 |
| `service_role` | 84 | 12 | 7 |

`postgres` and `service_role` still hold SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, and TRIGGER on all 12 tables. Ownership remains `postgres`.

## 4. RLS and functions

All 12 tables still exist. Row-level security is still enabled. Force row-level security is still off. Policy count is still 0 on each table.

| Function | anon | authenticated | public | service_role |
| --- | --- | --- | --- | --- |
| `tejas_staff_bump_session` | false | false | false | true |
| `tejas_learn_rotate_session` | false | false | false | true |
| `tejas_learn_register_student` | false | false | false | true |
| `tejas_learn_correct_registration` | false | false | false | true |
| `tejas_learn_report_payment` | false | false | false | true |
| `tejas_learn_review_payment` | false | false | false | true |
| `tejas_learn_set_publication` | false | false | false | true |

## 5. Existing data

| Table | Before | After |
| --- | --- | --- |
| `tejas_registrations` | 2 | 2 |
| `tejas_payments` | 2 | 2 |
| `tejas_schools` | 2 | 2 |
| `tejas_book_orders` | 2 | 2 |
| `tejas_audit_logs` | 11 | 11 |
| `tejas_admin_users` | 0 | 0 |

Portal rows read after the revoke: students 0, entitlements 0, attempts 0, questions 0. No application write was used to test the change.

## 6. Warnings

Default privileges in schema `public` were not changed. A table created later in `public` can still receive grants for `anon` and `authenticated`. That was outside this approval.

`public` already had no grant before the statement. The revoke from `public` changed nothing and remains in the approved statement.

Pull request 14 was not merged. The portal was not deployed. No book or test was published.

## 7. Git commit

The commit that adds this report is recorded below after the commit is created.

Commit: pending
