# TEJAS Future Tech content publication report

Check time: 13 November 2026, 8:31 PM IST.
Production site: https://tejas.dhe.org.in
Production project: `zapccpipwxduzlnvjdmy`, PostgreSQL 17.11, reached through the `ap-northeast-1` pooler.

Publication was not performed. This agent has no authorised staff session, and the production staff table has no named account. The publication form was not submitted. No publication row, student, entitlement, or payment was created.

## Pre-publication verification

| Check | Result |
| --- | --- |
| Production identity | Pooler user contains `zapccpipwxduzlnvjdmy`. Server version 17.11. |
| Books present | `ft-book-1`, `ft-book-2` |
| Tests present | `ft-b1-mt01` through `ft-b1-mt05`, `ft-b2-mt01` through `ft-b2-mt05` |
| Current status | All 12 items `awaiting_approval` |
| Publication rows | 0 |
| Stream | `technology` on both books and all ten tests |
| Class eligibility | Book 1 and its tests: 6, 7, 8. Book 2 and its tests: 9, 10. |
| Source checksums | All four source files match the approved inventory and the catalog |
| Questions and answer keys | 250 questions. Options A–D. Every key agrees with its explanation. Word verification reported no mismatch. |
| Deployed staff workflow | Pull request 15 wording is live. An unsigned publication request returned 401, “Staff sign-in is required.” |
| Database function | `tejas_learn_set_publication(p_kind text, p_item text, p_status text, p_actor text, p_reason text)` is present, security definer, `search_path=pg_catalog`. Execute is granted to `service_role` and `postgres`. |

The catalog file remains `awaiting_approval`. The production overlay is what a staff save would change. The deployed route is `POST /api/learn/staff/publication`, which requires a same-origin staff session and then calls `setPublication`. On production that calls `tejas_learn_set_publication`.

| Source | SHA-256 |
| --- | --- |
| `VB_IOT_GUIDE_V06_Book-1-compressed (1).pdf` | `620c948f80f10b27e2261081a461ad22cb570a9d582b59d66589296cb45251ac` |
| `VB_IOT_GUIDE_V06_Book-2.pdf` | `94bf52831f1ab4ebe02c0f11409309f09948bcf957bd6988f891917447b99503` |
| Book 1 mock-test booklet | `f7d42e931fa3437361f33d7a549a9c4dd6c07cb854128ccc84772d4d96250074` |
| Book 2 mock-test booklet | `d2faf1af717ce8280370ccfeb610195221ab5705f92d903bd6f4589739e537a5` |

Book 1’s cover still says the book is for both class groups. The stored eligibility, which matches this approval, is Classes 6–8 only. The PDF was not edited.

## Why publication stopped

No staff cookie is available here. `TEJAS_ADMIN_TOKEN` is not set in this environment, so a recovery session cannot be opened. `tejas_learn_staff` has 0 rows, so no named staff account exists to sign in. Creating a session, calling the database function directly, or inserting publication rows would bypass the staff page. That was not done.

An unsigned `POST` to `/api/learn/staff/publication` returned 401. Read back afterwards: publication rows 0, portal audit rows 0.

## Publication status of the 12 items

| Item | Kind | Status |
| --- | --- | --- |
| `ft-book-1` | Book 1, Classes 6–8 | `awaiting_approval` |
| `ft-book-2` | Book 2, Classes 9–10 | `awaiting_approval` |
| `ft-b1-mt01` | Mock test | `awaiting_approval` |
| `ft-b1-mt02` | Mock test | `awaiting_approval` |
| `ft-b1-mt03` | Mock test | `awaiting_approval` |
| `ft-b1-mt04` | Mock test | `awaiting_approval` |
| `ft-b1-mt05` | Mock test | `awaiting_approval` |
| `ft-b2-mt01` | Mock test | `awaiting_approval` |
| `ft-b2-mt02` | Mock test | `awaiting_approval` |
| `ft-b2-mt03` | Mock test | `awaiting_approval` |
| `ft-b2-mt04` | Mock test | `awaiting_approval` |
| `ft-b2-mt05` | Mock test | `awaiting_approval` |

Staff identity: none. No publication reason was saved.

## Staff steps that complete publication

Open https://tejas.dhe.org.in/learn/staff.

1. Sign in with the recovery token in the “Recovery token” field. Leave email and password empty. There is no named staff account, so this is the authorised sign-in. The audit actor will be `recovery`.
2. In Publication, save one item at a time. Kind `Book` or `Mock test`, status `Published`, and this reason:

`Owner approved publication of Future Tech Book 1 for Classes 6-8, Book 2 for Classes 9-10, and all ten mock tests on 13 November 2026. English and Mathematics are not included.`

3. Save these ids, in this order, and wait until that row shows published before the next save:

`ft-book-1`, `ft-book-2`, `ft-b1-mt01`, `ft-b1-mt02`, `ft-b1-mt03`, `ft-b1-mt04`, `ft-b1-mt05`, `ft-b2-mt01`, `ft-b2-mt02`, `ft-b2-mt03`, `ft-b2-mt04`, `ft-b2-mt05`.

4. If a save fails, stop. Do not submit that id again. Report which ids already show published.
5. Do not create a student, a payment, or an entitlement. Do not change English or Mathematics.

## Access control

Production, without a student cookie:

| Route | Result |
| --- | --- |
| `GET /api/learn/books/ft-book-1/file` | 401, “Sign in to continue.” |
| `POST /api/learn/tests/ft-b1-mt01` | 401, “Sign in to continue.” |

No production student or payment was created, so a live entitled student was not tested. The local file-store tests, which do not open production, passed 44 of 44. They show:

- A Class 9 technology student is refused Book 1 with `wrong_class`.
- A Class 7 technology student is refused Book 2 with `wrong_class`.
- A matching student is refused with `unpublished` before publication and `unpaid` after publication until the ₹49 payment is verified.
- English and Mathematics quotes return `fee_not_approved`. The catalog has no English or Mathematics book or test.

## English and Mathematics

Unpublished and unavailable. No catalog item and no production book or test uses those streams. Their fee is not approved.

## Existing registration data

| Record | Count |
| --- | --- |
| `tejas_registrations` | 2 |
| `tejas_payments` | 2 |
| `tejas_schools` | 2 |
| `tejas_book_orders` | 2 |
| `tejas_audit_logs` | 11 |
| `tejas_learn_students` | 0 |
| `tejas_learn_entitlements` | 0 |
| `tejas_learn_publication` | 0 |
| `tejas_learn_audit` | 0 |

Privileges, row-level security, functions, migrations, and the registration workflow were not changed. Fees were not changed. PDFs, questions, answer keys, and explanations were not changed.

## Limitation

The 12 approved items stay `awaiting_approval` until a person who holds the recovery token completes the 12 saves above. After that, a read-back can confirm the audit actor, the reason, and that each item has one publication row.
