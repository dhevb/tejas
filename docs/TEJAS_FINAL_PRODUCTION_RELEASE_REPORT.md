# TEJAS final production release report

Release time: 13 November 2026, 7:49 PM IST.
Production site: https://tejas.dhe.org.in
Supabase project: `zapccpipwxduzlnvjdmy`, PostgreSQL 17.11.

## Pull request and deployment

| Item | Value |
| --- | --- |
| Pull request | https://github.com/dhevb/tejas/pull/14 |
| State | Merged at 13 November 2026, 7:46 PM IST |
| Head before merge | `93efa011bc9cf30cfe356cf67e75313ec3348ab9` |
| Merge commit | `83724dba2d7899ef32f8ec6f4777939adb2943ec` |
| GitHub production deployment | `7767503041` |
| Vercel deployment | `HqaWDn6VHwiBmxi4GXjyqicKtioA` |
| Vercel status | Deployment has completed. https://vercel.com/dhe-projects/tejas/HqaWDn6VHwiBmxi4GXjyqicKtioA |
| Production URL | https://tejas.dhe.org.in |

The required Vercel status on the merged commit was success. The Supabase Preview check was skipped because this repository is not using a Supabase preview branch. The portal migrations had already been applied to production and were not run again.

## Tests

| Check | Result |
| --- | --- |
| `npm test` | 43 passed, 0 failed |
| `tsc --noEmit --incremental false` | Passed |
| `npm run lint` | Passed, with the two existing warnings in `TejasEmblem.tsx` and `Countdown.tsx` |
| `npm run build` | Passed. Next.js 15.5.20 |

The automated tests cover registration validation, the unchanged school fee split, student registration locking, the ₹49 fee, payment review, a second payment report, class correction, one active session, scoring, anonymous refusal of the e-book file, and the rule that a hosted portal does not write a local student file. No student, payment, or registration row was created in production for this release.

## Security

Read back from production after the 7:30 PM IST revoke, and not changed by this release:

- 12 portal tables exist, all owned by `postgres`.
- `anon`, `authenticated`, and `public` have 0 table grants. `service_role` and `postgres` still have 84 each.
- Row-level security is enabled. Force row-level security is off. Policy count is 0.
- All seven functions use `search_path = pg_catalog`, have no unqualified portal table reference and no dynamic SQL, and can be executed only by `service_role`.
- The ₹49 check constraint and the payment-reference unique index are present.
- Both books and all 10 tests remain `awaiting_approval`.

The application has no browser Supabase client. Portal requests use the server key from `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`. Passwords are hashed with scrypt and a random salt. A second sign-in advances `session_version`, so the older cookie stops working. The live e-book file route returned 401 without a cookie. Starting a mock test without a cookie returned 401.

Default privileges in schema `public` still grant `anon` and `authenticated` rights on objects created later. They were inspected and not changed.

## Live site

| Route | Result |
| --- | --- |
| `/` | 200 |
| `/learn` | 200. Desktop and mobile layouts render the portal, the ₹49 statement, and the unpublished notice. |
| `/learn/login` | 200 |
| `/learn/register` | 200 |
| `/learn/staff` | 200 |
| `/learn/dashboard` | 307 to `/learn/login` |
| `/schools/register` | 200 |
| `/schools/register/review` | 200 |
| `/prepare/ebook` and `/prepare/mock-tests` | 200 |
| `/api/learn/books/ft-book-1/file` | 401 |
| `/api/register/storage-status` | Connected, using the service-role key. The key value was not read. |

Production storage is durable. The status endpoint reports the service-role key is present and the connection is accepted. Hosted mode does not fall back to a local student file.

## Content

Future Tech Book 1 is assigned to classes 6–8. Book 2 is assigned to classes 9–10. The catalog has 10 tests, 250 questions, 30 minutes each, and no negative marking. Every book and test is `awaiting_approval`. English and Mathematics have no book and no mock test. The Book 1 cover note was left unchanged.

Publication rows in production: 0. Student rows: 0.

## Existing registration data

| Table | Count |
| --- | --- |
| `tejas_registrations` | 2 |
| `tejas_payments` | 2 |
| `tejas_schools` | 2 |
| `tejas_book_orders` | 2 |
| `tejas_audit_logs` | 11 |
| `tejas_admin_users` | 0 |

These counts match the pre-release baseline. School registration still collects ₹150 per student-stream and ₹170 for a printed book. The school form does not collect the ₹49 e-book fee.

## Limitations

- The staff page says publishing does not write production data. On this deployment, a staff publication writes the publication overlay in the production database. It does not deploy the website. No item was published.
- A student session uses `TEJAS_PORTAL_SECRET` when that variable is set. If it is absent, the server creates a file secret. This release could not list the production variable names. Staff sign-in continues to use the existing `TEJAS_ADMIN_TOKEN`.
- Default privileges were not changed. A new table in `public` can still receive `anon` and `authenticated` grants.
- No production student account or payment was created, so the live sign-in, payment, and mock-test screens were not exercised with a real account. Those paths were covered by the automated tests and by the anonymous refusals above.
