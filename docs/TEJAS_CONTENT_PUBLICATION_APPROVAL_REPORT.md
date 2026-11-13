# TEJAS content publication approval report

Audit time: 13 November 2026, 8:09 PM IST.
Production site: https://tejas.dhe.org.in
Production project: `zapccpipwxduzlnvjdmy`
Live merge commit: `83724dba2d7899ef32f8ec6f4777939adb2943ec`

This audit did not publish a book or a mock test. It did not write a production publication row, student, entitlement, or payment.

## Publication workflow

A signed-in staff member saves a publication status from `/learn/staff`. The form posts to `/api/learn/staff/publication`. The route rejects a cross-origin request and a request without a staff session. The actor is the recovery subject or the email of a named staff account.

On production, that save calls `tejas_learn_set_publication`. The function writes one row in `tejas_learn_publication` and one row in `tejas_learn_audit`. The audit stores the staff identity, the reason, the previous status, and the new status. It does not deploy the website.

A student can open an item only when all of these are true: the account stream and class match the item, the ₹49 payment for that book is verified, and both the book and, for a mock test, the test are published. The catalog file itself stays `awaiting_approval`. The production overlay is what changes the live status.

The live staff page on commit `83724dba` said publication does not write production data. That sentence is wrong. The correction is in this branch and is not deployed.

## Local test

The publication test used a temporary file store. It did not open the production database.

| Check | Result |
| --- | --- |
| Unsigned publication request | 401 |
| Staff identity on the local audit row | `reviewer@example.test`, action `set-publication` |
| Unpublished mock test for a matching student | Refused, reason `unpublished` |
| Catalog file after the local save | Still `awaiting_approval` |
| `npm test` | 44 passed, 0 failed |

## Production status

Read back from production. No publication statement was executed.

| Item | Status |
| --- | --- |
| `ft-book-1` | `awaiting_approval`, fee 49 |
| `ft-book-2` | `awaiting_approval`, fee 49 |
| `ft-b1-mt01` through `ft-b1-mt05` | `awaiting_approval`, 25 questions each |
| `ft-b2-mt01` through `ft-b2-mt05` | `awaiting_approval`, 25 questions each |
| `tejas_learn_publication` rows | 0 |
| Portal students | 0 |
| Portal entitlements | 0 |
| Registrations, payments, schools, printed-book orders, audit logs | 2, 2, 2, 2, 11 |

Question text is not stored in `tejas_learn_questions`. The live questions are the catalog shipped with the application. The production tables store the book and test identities and the publication status.

## Book 1

| Item | Result |
| --- | --- |
| Title | Understanding IoT and IoT with Arduino |
| Classes | 6, 7, 8 |
| File | `VB_IOT_GUIDE_V06_Book-1-compressed (1).pdf` |
| Pages | 58, counted from the original PDF |
| SHA-256 | `620c948f80f10b27e2261081a461ad22cb570a9d582b59d66589296cb45251ac` |
| Catalog checksum | Matches the file |
| Fee | ₹49, mock-test fee 0 |
| Publication | `awaiting_approval` in the catalog and in production |

The original PDF was not edited. The earlier cover note was not reopened.

## Book 2

| Item | Result |
| --- | --- |
| Title | IoT with ESP32 and IoT with Raspberry Pi |
| Classes | 9, 10 |
| File | `VB_IOT_GUIDE_V06_Book-2.pdf` |
| Pages | 67, counted from the original PDF |
| SHA-256 | `94bf52831f1ab4ebe02c0f11409309f09948bcf957bd6988f891917447b99503` |
| Catalog checksum | Matches the file |
| Fee | ₹49, mock-test fee 0 |
| Publication | `awaiting_approval` in the catalog and in production |

## Mock tests

`python3 scripts/extract_portal_content.py --verify` compared the saved catalog with the Word booklets and with a fresh extraction. It reported 10 tests, 250 questions, and no wording or answer-key mismatch.

| Test | Book | Classes | Questions | Minutes | Negative marking | Key and explanation |
| --- | --- | --- | --- | --- | --- | --- |
| `TEJAS-FT-B1-MT01` | Book 1 | 6–8 | 25 | 30 | None | Match |
| `TEJAS-FT-B1-MT02` | Book 1 | 6–8 | 25 | 30 | None | Match |
| `TEJAS-FT-B1-MT03` | Book 1 | 6–8 | 25 | 30 | None | Match |
| `TEJAS-FT-B1-MT04` | Book 1 | 6–8 | 25 | 30 | None | Match |
| `TEJAS-FT-B1-MT05` | Book 1 | 6–8 | 25 | 30 | None | Match |
| `TEJAS-FT-B2-MT01` | Book 2 | 9–10 | 25 | 30 | None | Match |
| `TEJAS-FT-B2-MT02` | Book 2 | 9–10 | 25 | 30 | None | Match |
| `TEJAS-FT-B2-MT03` | Book 2 | 9–10 | 25 | 30 | None | Match |
| `TEJAS-FT-B2-MT04` | Book 2 | 9–10 | 25 | 30 | None | Match |
| `TEJAS-FT-B2-MT05` | Book 2 | 9–10 | 25 | 30 | None | Match |

Book 1 booklet SHA-256: `f7d42e931fa3437361f33d7a549a9c4dd6c07cb854128ccc84772d4d96250074`.
Book 2 booklet SHA-256: `d2faf1af717ce8280370ccfeb610195221ab5705f92d903bd6f4589739e537a5`.
Both match the catalog. Every question is numbered 1–25, has options A–D, and has one answer that agrees in the compact key and the explanation row. Total questions: 250.

English and Mathematics have no book and no mock test.

## Discrepancies

No new discrepancy was found in question wording, numbering, options, answers, explanations, test-to-book mapping, class lists, checksums, or page counts.

The live staff wording on the deployed site is still the old sentence. The corrected sentence is in this branch and has not been deployed.

## Remaining blocker

Owner approval is still required before any book or mock test is published, and before this wording correction is merged or deployed.

PRODUCTION PUBLICATION NOT PERFORMED. NO PRODUCTION STUDENT OR PAYMENT CREATED. NO PRIVILEGE OR REGISTRATION WORKFLOW CHANGED.
