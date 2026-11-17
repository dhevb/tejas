# PR #25 test-record reconciliation and registry plan

Inspection time: 15 November 2026, 12:29 AM to 12:34 AM IST.
Repository: `dhevb/tejas`
Production site: https://tejas.dhe.org.in
Pull request: https://github.com/dhevb/tejas/pull/25
Branch: `cursor/registration-payment-verification-2878`
HEAD at inspection: `110ae16015367c030fd91e4ddf605083c500e05f`

This document is a plan. No production row, proof, status, UTR, entitlement, or schema object was changed. No migration was applied. No form was submitted.

The earlier evidence in `docs/PR25_UTR_REGISTRY_FINAL_RECONCILIATION_PLAN.md` stays as written. This document does not replace that preflight. It changes the next-step recommendation after the owner confirmed that the two records in that collision are test data.

## 1. Owner confirmation

The owner confirmed that both complete production records below were created for testing. The confirmation covers the records, not only the UTR strings. No other production record is classified as test data.

| UTR | Confirmed record | Status at inspection |
| --- | --- | --- |
| `AXISCN1379239046` | School registration `TEJAS-2026-NS553XMZZG2N8XE7DHV3` | `confirmed` |
| `AXISCN1379239046` | E-book entitlement `ebook:7e94efb3-2bd9-4646-91e6-eea7f3c15b44:ft-book-1` | `verified` |
| `AXISCN1379239048` | School registration `TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ` | `reported` |

The shared value `AXISCN1379239046` is a collision between two owner-confirmed test records. It is not a collision between a test record and a genuine payment.

## 2. How this was checked

The session used the production pooler login `postgres.zapccpipwxduzlnvjdmy` on project `zapccpipwxduzlnvjdmy`, database `postgres`. `pg_is_in_recovery()` was false. PostgreSQL 17.11. Every batch was `BEGIN READ ONLY` and `transaction_read_only` was `on`.

Personal names, email addresses, phone numbers, PAN, dates of birth, passwords, and file contents were not selected. Proof files were not downloaded.

## 3. Record inventory

### Owner-confirmed test records

| Test UTR | Category | Record | Current status | Dependencies | Proof exists |
| --- | --- | --- | --- | --- | --- |
| `AXISCN1379239046` | School registration | `TEJAS-2026-NS553XMZZG2N8XE7DHV3`, registration `3a18b60e-cfd0-4329-a5b4-8833ca1d97ed` | `confirmed` | School `3147b3d0-bbb2-4972-96f3-60a0deacffa5`, one principal row, one coordinator row, one Olympiad student, one English stream, one zero-quantity book row, one inactive e-book-access row, one registration file, one idempotency row, nine audit rows, eight payment-history entries | Yes. Private PDF. See section 4. |
| `AXISCN1379239046` | E-book entitlement | `4326d3dc-91b1-4db2-aa42-69d6134e3e8a`, student `7e94efb3-2bd9-4646-91e6-eea7f3c15b44`, book `ft-book-1` | `verified` | Portal student row, two submitted attempts, three learning-audit rows. The book row is shared catalog and is not test data. | No e-book proof object. |
| `AXISCN1379239048` | School registration | `TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ`, registration `31be3f28-4a62-4f7e-b173-0f383701ccea` | `reported` | School `b1bb1be4-5912-4b80-a9f7-733ee9b8e24b`, one principal row, one coordinator row, one Olympiad student, one English stream, one zero-quantity book row, one inactive e-book-access row, one registration file, one idempotency row, two audit rows, two payment-history entries | Yes. Private JPEG. See section 4. |

Payment rows:

| Registration | Payment | Mode | Amount stored | Paid-on date | UTR |
| --- | --- | --- | --- | --- | --- |
| `TEJAS-2026-NS553XMZZG2N8XE7DHV3` | `5f9e1b28-f6c1-45f4-b17c-386d7b4cbde9` | UPI | ₹150 | 1 November 2026 | `AXISCN1379239046` |
| `TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ` | `c37d68d5-bd39-42ce-8abe-7c7ad1e3ddc4` | UPI | ₹150 | 7 November 2026 | `AXISCN1379239048` |

Both registration snapshots store the same UTR as the payment column. `enteredUtr` and `extractedUtr` are not columns, and the snapshot verification fields are empty. The saved fee snapshot for each registration says 1 student-stream, total fees ₹150, school share ₹0, `schoolShareApproved` false, payable to TEJAS ₹150, printed books 0, and e-book seats 0. The current application constant for a new approved school registration remains ₹30 retained and ₹120 remitted. These saved snapshots are older full-remittance records. This plan does not recalculate them.

The e-book row stores ₹49 and `mock_test_amount_inr` 0. It was reported at 1:04 AM IST on 14 November 2026 and marked verified at 9:54 AM IST on 14 November 2026. `verified_by` is the role `recovery`. The entitlement note does not contain the UTR. A verified entitlement is what the portal uses to open the book. This student has two submitted attempts on `ft-b1-mt01` and `ft-b1-mt02`.

Created times: the first registration at 10:06 AM IST on 1 November 2026, the second at 11:40 AM IST on 1 November 2026, and the portal student at 9:31 PM IST on 13 November 2026.

### Genuine catalog records

These rows are shared by the application and must not be treated as test data.

| Record | Count | Why it stays |
| --- | --- | --- |
| `tejas_learn_books`, tests, classes, and publication rows | 12 publication rows | `ft-book-1` is also referenced by unpaid entitlements of other students. |
| `tejas_learn_audit` rows with no student | 14 `set-publication` rows | Publication history, not a payment. |
| Storage buckets | 2 private buckets | The buckets are production configuration. Only their current objects belong to the test registrations. |

### Unknown records

These were read so they would not be swept into the cleanup. The owner has not called them test data.

| Record | Status | UTR | Why it is not in the cleanup |
| --- | --- | --- | --- |
| Portal student `200ae663-c374-4982-bea8-4e799c085059` | Registered, mathematics, class 8 | None | No entitlement and no attempt. |
| Portal student `bcc2245e-8dcf-41dd-8172-993a69a5fb00` | Registered, technology, class 6 | None | Unpaid `ft-book-1` entitlement `c3b92099-676f-4528-a63e-c7acca6e4d31`. Amount ₹49. No reference. |
| Portal student `5b672210-cdb7-4654-93fa-c5f6d5103cc0` | Registered, technology, class 6 | None | Unpaid `ft-book-1` entitlement `98600388-e4c1-400a-95ed-74d33f070dc8`. Amount ₹49. No reference. |
| `tejas_staff_sessions` | 1 row | None | Not tied to either registration by a foreign key. The row was not opened. |
| `tejas_learn_staff` and `tejas_admin_users` | 0 rows | None | No staff account row. |

There is no third payment row and no third registration row. Every current school registration is one of the two confirmed test records. That fact does not make the portal students above test records.

## 4. Proof files

Both proof buckets are private. `tejas-payment-proofs` allows JPEG, PNG, and PDF, with a 5 MB limit. `tejas-registration-files` allows spreadsheets and CSV, with a 10 MB limit.

| Bucket | Object | Type | Size | Linked record | Shared |
| --- | --- | --- | --- | --- | --- |
| `tejas-payment-proofs` | `TEJAS-2026-NS553XMZZG2N8XE7DHV3/receipt.pdf` | `application/pdf` | 205,575 bytes | Payment `5f9e1b28-f6c1-45f4-b17c-386d7b4cbde9` | No. The bucket has two objects, one for each test registration. |
| `tejas-payment-proofs` | `TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/receipt.jpg` | `image/jpeg` | 320,492 bytes | Payment `c37d68d5-bd39-42ce-8abe-7c7ad1e3ddc4` | No. |
| `tejas-registration-files` | `TEJAS-2026-NS553XMZZG2N8XE7DHV3/upload.xlsx` | spreadsheet | 11,160 bytes | The first registration | No. The bucket has two objects. |
| `tejas-registration-files` | `TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/upload.xlsx` | spreadsheet | 11,160 bytes | The second registration | No. |

No object name begins with `ebook/`. The verified e-book entitlement has no stored screenshot. Deleting either proof would not remove another payment's file. It would remove the only copy of that test proof. This plan does not delete any object.

## 5. Audit history

School audit, all 11 rows:

| Registration | Action | Actor | Note class | When (IST) |
| --- | --- | --- | --- | --- |
| `TEJAS-2026-NS553XMZZG2N8XE7DHV3` | `registration_submitted` | school | `pending_instructions` | 1 November 2026, 10:06 AM |
| `TEJAS-2026-NS553XMZZG2N8XE7DHV3` | `payment_status` | staff | `reported` | 1 November 2026, 10:08 AM |
| `TEJAS-2026-NS553XMZZG2N8XE7DHV3` | `payment_status` | staff | `confirmed` | 1 November 2026, 11:53 AM, seven rows within a few seconds |
| `TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ` | `registration_submitted` | school | `pending_instructions` | 1 November 2026, 11:40 AM |
| `TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ` | `payment_status` | staff | `reported` | 1 November 2026, 11:48 AM |

No audit note contains either UTR. No audit row lacks a registration. Payment-history notes also do not contain either UTR.

Learning audit for the confirmed portal student:

| Action | Actor | When (IST) |
| --- | --- | --- |
| `register` | student | 13 November 2026, 9:31 PM |
| `report-payment` | student | 14 November 2026, 1:04 AM |
| `review-payment` | recovery | 14 November 2026, 9:54 AM |

No learning-audit text contains either UTR. The 14 publication audit rows have no student and stay outside this cleanup.

Foreign keys do not cascade. A parent row cannot be removed while a child row points at it. The registration child tables are payments, proofs, students, streams, book rows, e-book-access rows, registration files, audit logs, and idempotency. The portal student is required by the entitlement, the two attempts, and the three learning-audit rows.

## 6. Recommended cleanup

Retain the test rows, their audit history, and their files. Do not delete them in the registry migration, and do not change their status or UTR.

The schema has no test flag. A UTR prefix such as `AXISCN` must not become an exclusion rule. The distinction has to be an explicit list of the three owner-confirmed identities.

Recommended later change, not executed here:

1. Add an append-only table `tejas_test_record_classifications`.
2. Insert exactly three rows, matched by category and owner reference:
   - `school-registration` / `TEJAS-2026-NS553XMZZG2N8XE7DHV3`
   - `school-registration` / `TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ`
   - `ebook` / `ebook:7e94efb3-2bd9-4646-91e6-eea7f3c15b44:ft-book-1`
3. Store the original UTR, the status observed above, and the classification time. Do not update the source row.
4. Give the table row-level security and revoke `public`, `anon`, and `authenticated`.

Policy that goes with retention:

- These three rows remain test records. Reports of genuine receipts must skip them once the classification table exists. Until that reporting change is approved, staff totals can still include the ₹150 confirmed registration and the verified ₹49 e-book.
- The UTR strings stay reserved by the existing unique indexes on `tejas_payments.transaction_reference` and `tejas_learn_entitlements.transaction_reference`. Excluding the rows from the new registry does not make either string reusable.
- A genuine payer who presents one of these two strings must be stopped and reviewed. The string must not be silently reassigned.
- The verified test entitlement still opens `ft-book-1`. Leaving that access in place is part of retention. Closing it would change a payment status and needs its own approval.

Deletion was considered and is not recommended. The files and audit rows are the evidence of the owner's classification. The book `ft-book-1` is shared with two unpaid entitlements that are not confirmed test data. A broad delete could remove those students or the catalog. Every foreign key is `NO ACTION`, so a delete also needs a child-before-parent order that this plan deliberately does not include.

Nulling the UTR was considered and is not recommended. It would change the stored reference, leave a confirmed or verified row without its reference, and make the test row look like an ordinary paid record with missing evidence.

## 7. Revised registry backfill

The current file `supabase/migrations/20261114_payment_utr_registry.sql` is still not safe to apply. Its `on conflict do nothing` can skip a genuine historical row. This proposal does not use that statement.

The backfill runs only after the classification table contains exactly the three identities in section 6. If the table is missing, empty, short one of those identities, or contains any other identity, the transaction raises and rolls back.

Candidate sources:

- Every non-null `tejas_payments.transaction_reference`, owned by the registration reference.
- Every non-null `tejas_learn_entitlements.transaction_reference`, including a rejected row if one exists, owned by `ebook:` plus student id plus book id.
- When `tejas_case_files` exists, every non-null `record_snapshot.payment.transactionReference`, owned by the case reference and mapped from `channel`.
- Registration snapshots are compared with the payment column. A different normalized key raises. The snapshot is not a second owner.

Normalization is the application rule: remove the JavaScript whitespace characters listed in the earlier plan, then uppercase. A key that does not match `^[A-Z0-9-]{6,40}$` raises unless its owner is one of the three classified test identities. Those three are not inserted either way.

Collision rule after the three identities are removed from the candidate set:

- If a remaining row normalizes to `AXISCN1379239046` or `AXISCN1379239048`, raise. Do not give that key to the new row, and do not change the test row.
- If any other key has more than one remaining owner, raise and list every remaining row. Do not pick a winner and do not change a status.
- Insert one registry row for each remaining unique key. Copy the original text and the current status.
- Do not update or delete a source row, a proof, or an audit row.

With the rows inspected on 15 November 2026, this leaves no registry row for either test UTR and no genuine historical reference waiting to be inserted. That result is valid only for the sources that exist today. It is not a prediction about case files.

The registry table still gets row-level security and a revoke from `public`, `anon`, and `authenticated`. The storage-bucket statement in the current migration file is not part of this backfill. The existing PDF proof must remain readable to staff. Do not apply that bucket change in the same step.

## 8. Case-file dependency

`tejas_case_files` and `tejas_payment_utrs` are absent. `to_regclass` returned null, and neither name is among the 26 public `tejas_` tables. Absence is not a count of zero individual registrations or zero printed-book payments.

`tejas_case_files` is created only by `supabase/migrations/20261114_payment_verification.sql`. That file is in this pull request and has not been applied. The deployed production application does not write that table. The pull request is the code that would.

No present table stores an individual-registration UTR or a printed-book-order UTR. `tejas_book_orders` has quantity and amount only. Both test registrations have one such row, with quantity 0 and amount 0. `tejas_ebook_access` stores a seat count, not a UTR. Both test rows have zero seats and `activated` false.

The case-file migration is still required before the new individual and printed-book flows can save an order. It does not have to precede the registry if it is applied in the same window, before any new order is saved, and the registry transaction scans case files when the table is present. Applying the case-file migration alone does not create historical UTRs. It creates an empty table.

Individual registration payments, school printed-book payments, and individual printed-book payments remain unverified as a population. They have no production table to count.

## 9. Read-only verification after a later apply

Do not run this until a separate approval applies the classification insert and the revised registry transaction. Then, in `BEGIN READ ONLY`:

- The two registration statuses are still `confirmed` and `reported`.
- Both payment UTR strings are unchanged.
- The e-book status is still `verified` and its UTR is unchanged.
- The classification table contains exactly the three identities.
- `tejas_payment_utrs` contains neither test UTR and neither test owner.
- The proof objects are still the four objects above, with the same sizes.
- The other three portal students and their two unpaid entitlements are still present.
- A repeated collision query over non-classified sources returns no rows.

## 10. Financial and security rules

This plan changes no fee, account, storage grant, or approval rule.

| Payment | Gross | School share | TEJAS share |
| --- | ---: | ---: | ---: |
| School registration per student-stream | ₹150 | ₹30 | ₹120 |
| Individual registration per stream | ₹150 | ₹0 | ₹150 |
| School printed book | ₹170 | ₹34 | ₹136 |
| Individual printed book | ₹170 | ₹0 | ₹170 |

PAN is required only when the gross printed-book total is greater than ₹2,000. Registration uses SBI `45726198627`, IFSC `SBIN0000628`. Printed books and e-books use UBI `535402010016278`, IFSC `UBIN0553549`.

Proof buckets stay private. Staff proof access, student sign-in, row-level security, and audit rows stay as they are. A screenshot match does not approve a payment. No bank source is configured, so a new payment remains pending staff review.

## 11. Risks and unresolved questions

- Staff and finance totals can still count the confirmed ₹150 registration and the verified ₹49 e-book until reporting is changed to read the classification table. That reporting change is not in this plan.
- The test portal account can still open `ft-book-1` and already has two submitted attempts.
- Both test UTR strings remain reserved by the current unique indexes.
- The three other portal students are unknown. They must not be classified or deleted under this confirmation.
- One staff session exists and was not attributed.
- Case-file categories still cannot be counted.
- The saved school-share flag on both test registrations is false. New registrations follow the current ₹30 / ₹120 constant. Neither figure should be rewritten.

## 12. Steps that need a separate approval

1. Create the classification table and insert exactly the three identities.
2. Replace the current registry migration with the transaction in section 7. Do not apply the file that is in the pull request now.
3. Apply the case-file migration in the same window, before any new individual or book order is saved.
4. Run the read-only checks in section 9.
5. Decide later, and separately, whether genuine-receipt reports should skip the classification table and whether the test e-book access should remain.
6. Merge and deploy pull request #25 only after the registry transaction has committed, if the first new payment must take the cross-category lock.

## 13. Verdict

**A. Both test records are fully identified, and the cleanup and revised registry proposal are ready for owner review.**

The two confirmed registrations, their payments, proofs, school rows, and audit rows were read. The confirmed e-book entitlement, its portal student, its attempts, and its audit rows were read. No other row is classified as test data. The recommended action is to retain the rows and exclude only those three exact identities from the registry, while any unexpected duplicate still stops the migration. Nothing in that recommendation has been applied.
