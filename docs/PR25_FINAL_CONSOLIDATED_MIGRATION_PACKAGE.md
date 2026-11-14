# PR #25 final consolidated migration package

Package date: 15 November 2026, 1:10 AM IST.
Repository: `dhevb/tejas`
Pull request: https://github.com/dhevb/tejas/pull/25
Branch: `cursor/registration-payment-verification-2878`
Production: https://tejas.dhe.org.in

This package is implemented on the pull-request branch. It has not been applied to production. No production row, proof, status, or UTR was changed while it was prepared.

The earlier documents stay as evidence:

- `docs/PR25_UTR_REGISTRY_FINAL_RECONCILIATION_PLAN.md`
- `docs/PR25_TEST_RECORD_RECONCILIATION_AND_REGISTRY_PLAN.md`

## 1. Branch state

The previous plan commit `110ae16015367c030fd91e4ddf605083c500e05f` is still in the branch history. The branch head moved when the test-record plan was added, and it moves again with this package. Inspect `git rev-parse HEAD` on the branch before applying anything.

Pull request #25 was open when this package was written. It is not merged and it is not a production deployment.

## 2. Owner-confirmed test identities

These are the only three identities. Classification matches category plus the application's owner string, not the UTR text.

| Category | Owner reference | Source | UTR | Status |
| --- | --- | --- | --- | --- |
| `school-registration` | `school-registration:TEJAS-2026-NS553XMZZG2N8XE7DHV3` | `TEJAS-2026-NS553XMZZG2N8XE7DHV3` | `AXISCN1379239046` | `confirmed` |
| `ebook` | `ebook:7e94efb3-2bd9-4646-91e6-eea7f3c15b44:ft-book-1` | `7e94efb3-2bd9-4646-91e6-eea7f3c15b44:ft-book-1` | `AXISCN1379239046` | `verified` |
| `school-registration` | `school-registration:TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ` | `TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ` | `AXISCN1379239048` | `reported` |

The owner strings are the ones `utrOwner()` writes. A different record that merely contains one of these UTR strings is not classified, and the migration aborts.

The rows, proofs, audit history, registration links, idempotency rows, and `ft-book-1` catalog item are not deleted or rewritten.

## 3. Classification design

`supabase/migrations/20261115_01_test_record_classification.sql` creates `tejas_test_record_classifications`.

Columns: `category`, `owner_reference`, `source_reference`, `utr_text`, `payment_status`, `reason`, `classified_at`. The primary key is `(category, owner_reference)`.

A check constraint allows only the three tuples above, and only the reason `owner-confirmed testing`. A trigger rejects update and delete, so the rows are append-only. Row-level security is enabled. There is no policy. `public`, `anon`, and `authenticated` have no privileges. The server's service role is the audit path, which is the same path the staff routes already use for payment tables. No anonymous page lists the table.

Before the insert, the migration reads the live source rows. It aborts unless each identity is present exactly once with the UTR and status above. It also aborts if either normalized test UTR appears on any other school payment, e-book entitlement, or case file. That check uses `tejas_utr_key()`, the same whitespace removal and uppercase rule as `utrKey()` in `lib/registration/utr-claim.ts`.

The insert does not update a source table.

## 4. Case-file schema

`supabase/migrations/20261114_payment_verification.sql` creates `tejas_case_files` to match `insertCaseFile`, `readCaseFile`, and `updateCaseFile`.

| Column | Use |
| --- | --- |
| `reference` | Primary key. The order or individual-registration reference. |
| `channel` | `individual-registration`, `school-book`, or `individual-book`. |
| `status` | Copied from the payment status on the snapshot. |
| `record_snapshot` | The full JSON object the application reads back. |
| `idempotency_key` | Unique, nullable. |
| `payload_hash` | Stored with the idempotency key. |
| `created_at` | Staff list order. |

Screenshots are not stored in the table. The application writes them to the private `tejas-payment-proofs` bucket at `{reference}/proof.{ext}`. The migration enables row-level security, adds indexes on `created_at` and `channel`, and revokes `public`, `anon`, and `authenticated`. It adds unused verification columns on `tejas_payments`. Current application writes do not fill those columns. They do not replace `transaction_reference`.

School registrations continue to use `tejas_registrations` and `tejas_payments`. They are not copied into `tejas_case_files`.

## 5. Registry design

`supabase/migrations/20261115_02_payment_utr_registry.sql` creates `tejas_payment_utrs`. The primary key is `utr_key`. The application claims a UTR by inserting that key. A second insert with the same key fails. The application treats a conflicting row with the same `owner_reference` as a retry and deletes only the row whose key and owner match when a save fails.

The backfill locks the source tables in `share row exclusive` mode, builds every non-null reference from school payments, e-book entitlements, and case files, and then:

1. Requires the classification table to contain exactly the three identities.
2. Removes only candidates whose category and owner reference match a classification row.
3. Aborts if a remaining candidate normalizes to either test UTR.
4. Aborts if a remaining key is not `^[A-Z0-9-]{6,40}$`.
5. Aborts if any remaining key has more than one owner, and lists those rows. It does not pick a winner.
6. Inserts the remaining rows, copying the original UTR text and the current status.

`ON CONFLICT DO NOTHING` is not used. The earlier file `20261114_payment_utr_registry.sql` is now an empty transaction so filename order cannot apply that unsafe draft.

`20261115_03_payment_proof_bucket.sql` keeps the proof bucket private, keeps the 5 MB limit, and sets the allowed upload types to JPEG, PNG, WebP, and PDF. PDF stays because the confirmed test proof is a PDF. Existing objects are not deleted. The file aborts if the bucket is missing or public.

## 6. Migration order

Supabase applies these filenames in this order:

1. `20261114_payment_utr_registry.sql` — withdrawn empty transaction.
2. `20261114_payment_verification.sql` — case-file table. It must exist before classification scans it. An absent table is not treated as zero orders.
3. `20261115_01_test_record_classification.sql` — function, checks, and the three classification rows.
4. `20261115_02_payment_utr_registry.sql` — registry and backfill.
5. `20261115_03_payment_proof_bucket.sql` — private bucket types.

Apply them in one maintenance window, in that order, before deploying this pull request. Pause new payment-proof submissions during the window. The registry transaction blocks new writes to the source tables until it commits or rolls back.

Until the registry exists, individual and book proofs already fail closed. School payments and e-book payments still have their existing exact-reference unique indexes, which are narrower than the normalized key. Do not deploy the new payment routes before step 4 has committed. After step 4, all five categories use the same registry key.

Each file is its own transaction. The five files together are not one transaction.

## 7. Backfill coverage

| Category | Source | Included |
| --- | --- | --- |
| School registration | `tejas_payments.transaction_reference` | Yes, except the two classified registration owners. |
| E-book | `tejas_learn_entitlements.transaction_reference`, every status | Yes, except the one classified entitlement. |
| Individual registration | `tejas_case_files` where `channel` is `individual-registration` | Yes. The table is empty until new orders are saved. |
| School printed book | `tejas_case_files` where `channel` is `school-book` | Yes. |
| Individual printed book | `tejas_case_files` where `channel` is `individual-book` | Yes. |

Registration snapshots are compared with the payment column. A different normalized key aborts the backfill. The snapshot is not inserted as a second owner.

## 8. Read-only preflight

Do not run these against production until the owner chooses to. They were executed only on a local disposable database.

- `supabase/verification/PR25_preflight.sql` reads table presence, payment columns, school UTRs, and e-book UTRs. It does not query `tejas_case_files`.
- `supabase/verification/PR25_preflight_case_files.sql` reads case-file UTRs. Run it only when the first script shows `tejas_case_files` is not null.

Both scripts start with `begin read only`. A null `to_regclass` result means the table is absent, not that it has zero rows. An empty collision list from the payment script does not include case files unless the second script was run.

The normalization expression in those scripts is the same character list as `tejas_utr_key()`.

## 9. Post-migration verification

`supabase/verification/PR25_post_migration_verification.sql` is read-only. It raises, and still changes nothing, when:

- any of the three new tables is absent
- the classification count is not three
- a classified owner or either test UTR is in the registry
- a non-classified historical reference is missing, or its stored text or status differs
- one of the three source rows no longer has its confirmed status and UTR
- a policy exists on the new tables

## 10. Rollback and recovery

A collision or a missing identity raises inside the open transaction. PostgreSQL rolls that file back. Source rows are untouched because those statements do not update them. A registry failure after classification has committed leaves the three classification rows and the empty or populated case-file table, and it does not leave a partial registry table.

If case-file creation commits and a later file fails, the new table is empty unless an application has already written to it. The current production application does not write that table. Dropping it is safe only while it has zero rows and this pull request is not deployed. Dropping a table that has rows would delete orders. That drop is not included as a command to run. Take a restorable backup first and confirm the row count is zero before any later drop is even considered.

Classification rows cannot be deleted through the table because of the trigger. Recovery from a bad classification is to restore the backup, or to drop the whole classification table in a separately reviewed change. Dropping it does not change payment rows. Do not drop it after the registry has been relied on by new payments without first copying `tejas_payment_utrs`.

The proof bucket change does not delete objects. Reversing it would put the previous MIME list back and would still not delete the PDF.

The backup that must exist before the owner applies the package is a restorable copy of project `zapccpipwxduzlnvjdmy`. This package does not create that backup and does not claim one was verified in this session. After any restore, run the post-migration script, or the preflight if the restore returned to the pre-migration state, and compare registration, payment, entitlement, and storage object counts with the backup's counts. The three test UTR values and statuses must match the table in section 2.

## 11. Security

New tables enable row-level security and grant nothing to `public`, `anon`, or `authenticated`. No policy is created. Proofs stay in the private bucket. The bucket change does not make it public and does not remove PDF. Staff proof routes, student sessions, and audit tables are unchanged. OCR still cannot approve a payment. `lookupTrustedTransaction` still returns no bank source.

Fees and accounts are unchanged: school registration ₹150 / ₹30 / ₹120, individual registration ₹150 / ₹0 / ₹150, school book ₹170 / ₹34 / ₹136, individual book ₹170 / ₹0 / ₹170. PAN is required only when the gross book total is greater than ₹2,000. Registration uses SBI `45726198627`, IFSC `SBIN0000628`. Books and e-books use UBI `535402010016278`, IFSC `UBIN0553549`.

## 12. Tests

Local PostgreSQL 17, database `tejas_pr25_mig_pkg`, created and dropped by `lib/registration/migration-package.test.ts`. Production credentials were not used.

| Check | Result |
| --- | --- |
| Exactly three classified identities | Passed |
| Another identity cannot be inserted or deleted | Passed. Check constraint and append-only trigger. |
| Test UTR on a case file aborts classification | Passed. Source status and UTR unchanged. |
| Genuine normalized duplicate aborts the registry | Passed. Registry table rolled back. Both original texts remained. |
| School, e-book, individual, school-book, and individual-book backfill | Passed. Original spaced text `upi 654321` stored beside key `UPI654321`. |
| Same-key retry | Passed. Second insert fails and the original text remains. |
| Concurrent duplicate | Passed. The waiting insert failed. One row remained. |
| Release | Passed. A delete for another owner removed nothing. A delete for the owner removed that row. |
| Status and UTR preservation | Passed |
| Privileges and row-level security | Passed. `anon` cannot select or execute the key function. Policy count is zero. |
| Read-only preflight and post-migration scripts | Passed on the local database after the package. |
| Financial constants and both bank accounts | Passed |

The full `npm test` run is 71 passed and 0 failed. `npx tsc --noEmit` passed. `npx next lint` passed with the existing emblem image warning. `npm run build` passed. Missing-registry behaviour for individual and book proofs remains the existing application tests: those routes return an error and do not mark a payment verified when the claim is unavailable. School and e-book payments still have their older unique indexes until this registry is applied. That is why the deployment order in section 6 matters.

## 13. Unresolved risks

- The three other portal students found on 15 November 2026 are not test data and are not touched.
- The verified test entitlement can still open `ft-book-1` until a separate decision changes that access.
- Staff totals can still count the confirmed ₹150 test registration and the verified ₹49 e-book until reports learn to skip the classification table. This package does not change those reports.
- Both test UTR strings remain reserved by the existing unique indexes.
- Case files are empty in production until this migration is applied and new orders are saved. That emptiness is not evidence about a period before the table existed.
- A restorable production backup has not been verified in this session.
- School and e-book submissions are not fail-closed if the new application is deployed before the registry exists.

## 14. Owner approvals still required

1. Confirm a restorable backup of project `zapccpipwxduzlnvjdmy`.
2. Pause new payment-proof submissions.
3. Apply the five migration files in the order in section 6. This package does not do that.
4. Run `supabase/verification/PR25_post_migration_verification.sql` in a read-only transaction.
5. Deploy pull request #25 only after step 4 passes.
6. Decide later whether receipt reports should skip classified rows and whether the test e-book should remain open.

## 15. Verdict

**A. The consolidated migration package is ready for owner approval.**

The case-file table, the three-identity classification, and the registry backfill are consistent with the application. A test UTR on any other identity aborts the migration. Any other duplicate aborts it. No production migration has been applied.
