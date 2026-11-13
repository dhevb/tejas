# TEJAS Future Tech publication final verification

Verification time: 13 November 2026, 8:55 PM IST.
Production site: https://tejas.dhe.org.in
Production project: `zapccpipwxduzlnvjdmy`, PostgreSQL 17.11, reached through the `ap-northeast-1` pooler.

This check only read production. No publication form was submitted. No student, payment, entitlement, privilege, function, or migration was changed. No deployment was made and no pull request was merged.

## Effective publication status

The staff save writes `tejas_learn_publication`. That table’s primary key is `(kind, item_id)`, so each item can have one row. The application uses that row as the effective status. The catalog file and the seed columns on `tejas_learn_books` and `tejas_learn_tests` stay `awaiting_approval`. That is the existing design, and both are still `awaiting_approval`.

All 12 approved items have one publication row, and that row is `published`. There is no second row and no row left at `awaiting_approval`.

| Item | Kind | Stream | Classes | Effective status | Publication rows |
| --- | --- | --- | --- | --- | --- |
| `ft-book-1` | Book | Future Tech | 6, 7, 8 | `published` | 1 |
| `ft-book-2` | Book | Future Tech | 9, 10 | `published` | 1 |
| `ft-b1-mt01` | Mock test | Future Tech | 6, 7, 8 | `published` | 1 |
| `ft-b1-mt02` | Mock test | Future Tech | 6, 7, 8 | `published` | 1 |
| `ft-b1-mt03` | Mock test | Future Tech | 6, 7, 8 | `published` | 1 |
| `ft-b1-mt04` | Mock test | Future Tech | 6, 7, 8 | `published` | 1 |
| `ft-b1-mt05` | Mock test | Future Tech | 6, 7, 8 | `published` | 1 |
| `ft-b2-mt01` | Mock test | Future Tech | 9, 10 | `published` | 1 |
| `ft-b2-mt02` | Mock test | Future Tech | 9, 10 | `published` | 1 |
| `ft-b2-mt03` | Mock test | Future Tech | 9, 10 | `published` | 1 |
| `ft-b2-mt04` | Mock test | Future Tech | 9, 10 | `published` | 1 |
| `ft-b2-mt05` | Mock test | Future Tech | 9, 10 | `published` | 1 |

Publication rows: 12. Duplicate groups: 0. Other publication ids: none. Fees remain ₹49 for each book and ₹0 for mock tests.

## Audit

`tejas_learn_audit` has 14 rows. Every row is `set-publication`. The actor on every row is `recovery`. The reason on every row is:

`Owner approved publication of Future Tech Book 1 for Classes 6-8, Book 2 for Classes 9-10, and all ten mock tests on 13 November 2026. English and Mathematics are not included.`

Each of the 12 items has one audit row that moves it from `awaiting_approval` to `published`. The first save was Book 1 at 8:47 PM IST. The last saves were at 8:50 PM IST.

Book 1 has two further audit rows, at 8:47:37 PM IST and 8:47:39 PM IST. Both start from `published` and save `published` again. They do not add a second publication row and they do not change the status. No audit row records a conflicting status.

## Access

Unsigned production requests at 8:55 PM IST:

| Request | Result |
| --- | --- |
| `GET /api/learn/books/ft-book-1/file` | 401, “Sign in to continue.” |
| `GET /api/learn/books/ft-book-2/file` | 401, “Sign in to continue.” |
| `POST /api/learn/tests/ft-b1-mt01` | 401, “Sign in to continue.” |
| `POST /api/learn/tests/ft-b2-mt01` | 401, “Sign in to continue.” |

Production has 0 portal students and 0 entitlements. Live access by an entitled student was **not tested**. No test account or payment was created.

The deployed access rule still requires the student’s stream, the student’s class, a published book, a published test when a test is opened, and a verified ₹49 entitlement. A Class 9–10 student does not match Book 1. A Class 6–8 student does not match Book 2. That live cross-class check was **not tested** because there is no production student.

`tejas_learn_rotate_session(p_student uuid)` is present, security definer, with `search_path=pg_catalog`. A new sign-in advances `session_version`, so an older cookie no longer matches. Live one-device behaviour was **not tested** because there is no production student.

## English and Mathematics

No English or Mathematics book exists in production. No catalog item is `published`. Their fee remains unapproved. They are unpublished and unavailable.

## Existing data

| Record | Count | Expected |
| --- | --- | --- |
| `tejas_registrations` | 2 | 2 |
| `tejas_payments` | 2 | 2 |
| `tejas_schools` | 2 | 2 |
| `tejas_book_orders` | 2 | 2 |
| `tejas_audit_logs` | 11 | 11 |
| `tejas_admin_users` | 0 | 0 |
| `tejas_learn_students` | 0 | 0 |
| `tejas_learn_entitlements` | 0 | 0 |
| `tejas_learn_attempts` | 0 | 0 |
| `tejas_learn_staff` | 0 | 0 |
| `tejas_learn_questions` | 0 | 0 |

Questions remain in the catalog shipped with the site, not in `tejas_learn_questions`.

On the 12 portal tables, `anon`, `authenticated`, and `public` have 0 grants. `postgres` and `service_role` have 84 each. Row-level security is on for each portal table, force row-level security is off, and the policy count is 0. The migration history is still the registration migration and the two portal migrations. `tejas_learn_set_publication` is unchanged.

## Result

All 12 approved Future Tech items are published, each with one publication row and an audit record for the recovery actor and the owner-approval reason. Book 1 was saved twice more after it was already published. No item is missing, duplicated, or left unpublished. Unauthenticated content requests stay denied. Entitled-student, cross-class, and one-device behaviour were not tested on production because no student account exists.
