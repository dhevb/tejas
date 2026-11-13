# TEJAS student portal — final review

Review date: 13 November 2026, afternoon IST.

This review did not merge the pull request, did not deploy to production, did not apply the new migration to production, did not publish a book or a mock test, and did not change School Olympiad registration or printed-book order rules.

**Recommendation: ready for the owner to approve the database step. Not merged, not deployed, and not published.**

The Future Tech question bank matches the supplied Word booklets. Stream, class, payment and publication are enforced on the server. Staff sign-in now sets the session cookie on the response itself, and a hosted deploy will not store students in a local file. The portal migration was applied and rolled back only on an empty local PostgreSQL database. It has not been applied to production because the configured Supabase host does not resolve, so a backup could not be taken.

The Book 1 cover note is deferred by the owner. The launch mapping stays Book 1 for Classes 6–8 and Book 2 for Classes 9–10. It is not a technical blocker.

## 1. Pull request and branch

| Item | Value |
| --- | --- |
| Repository | `dhevb/tejas` |
| Pull request | [#14](https://github.com/dhevb/tejas/pull/14) |
| Branch | `cursor/stream-class-portal-2878` |
| Base | `main` |
| Earlier CI | The three checks on `df5af42` had passed before this review |
| Preview URL | `https://tejas-git-cursor-stream-class-portal-2878-dhe-projects.vercel.app` |

The preview URL responds with HTTP 302 to `https://vercel.com/login`. The application was not reachable there.

## 2. Files and modules inspected

- Student routes under `app/learn/` and `app/api/learn/`, including register, login, logout, profile, pay, the book file route, test start, test submit, and the staff routes.
- Access rules in `lib/portal/model.ts`, `lib/portal/store.ts`, `lib/portal/session.ts` and `lib/portal/current.ts`.
- Catalog `content/portal/catalog.json`, extractor `scripts/extract_portal_content.py`, and `docs/PORTAL_CONTENT_INVENTORY.md`.
- The four supplied sources in `content/portal/sources/`: both PDFs and both Word booklets.
- Migration `supabase/migrations/20261113_tejas_learning_portal.sql`.
- School registration fee code in `lib/registration/fee.ts` and the existing registration tests. The fee constants `FEE_TOTAL` 150, `FEE_SCHOOL` 30 and `FEE_TEJAS` 120 are unchanged. `EBOOK_SALE_OPEN` remains false, so the school form still does not collect ₹49.
- Automated tests in `lib/portal/portal.test.ts` and the registration test files named in `package.json`.

## 3. Registration and stream/class validation

Enforced on the server, not only in the form.

| Rule | Result |
| --- | --- |
| English and Mathematics accept classes 3–10 | Passed in `classesForStream` |
| Future Tech accepts classes 6–10 | Passed. HTTP registration with class 5 returned 400, “Select a class offered for this stream.” |
| Exactly one stream and one class are stored | Passed. A Future Tech Class 7 registration stored `technology` and `7` |
| Student profile, including a direct API body, cannot change stream or class | Passed. `POST /api/learn/profile` with `classLevel: 10` and `streamId: "english"` returned 403 |
| A registration body cannot set `paid` or `status` | Passed. The body was rejected with “Stream, class and payment are set by the server.” |
| URL query parameters do not change the assigned book | Passed. `GET /api/learn/books/ft-book-2/file?classLevel=9` for a Class 7 account returned 403 `wrong_class` |
| Staff correction is the only change path | Passed in the store test. A student cookie calling `/api/learn/staff/correction` returned 401 |
| Each staff correction writes an audit row | Passed in the store test: action `correct-registration`, actor, reason, old stream/class, new stream/class, and timestamp |

The audit actor is the string `staff`. The existing staff login is one shared token. It does not carry a named staff email or user id, so the log cannot yet name which person made the correction.

Local browser check on 13 November 2026: Future Tech’s class list showed Classes 6, 7, 8, 9 and 10. A Class 9 test account, `nia.layout@example.test`, saw only Book 2.

## 4. Payment and entitlement security

The Future Tech price is ₹49 for the one applicable e-book. The five included mock tests add ₹0. There is no separate mock-test charge.

| Rule | Result |
| --- | --- |
| Verified ₹49 is required | Passed. Access checks `status === "verified"` and the quoted amount |
| Reported payment does not open the book | Passed over HTTP. After a reference was submitted, the file route still returned 403 |
| Rejected payment does not open the book | Passed in the store test. After the book was marked published inside the test data directory, access reason was `unpaid` |
| The student cannot set payment status | Passed. Extra `status` and `paid` fields on the profile update did not verify the entitlement |
| A payment stays on one book | Passed. Correcting the class marks the old entitlement `superseded` and creates a new unpaid row for the new book |
| A second payment report does not add a second active entitlement | Passed. Two references left one non-superseded row, with the later reference |
| Dashboard shows payment and publication | Passed in the browser. Class 9 showed Payment `unpaid`, Publication `Awaiting approval`, Reading `Locked` |

Payment workflow that exists: the student enters a transaction reference, the row becomes `reported`, and a staff member marks it `verified` or `rejected`. There is no payment gateway and no proof-file upload on this portal. Staff still have to match the reference to the bank credit by hand. That is the current process. Nothing in this review invented a gateway.

## 5. E-book access security

Every file request goes through the signed-in student, the stored stream, the stored class, a verified payment and publication. The PDFs are not in `public/`.

| Attempt | Result |
| --- | --- |
| Direct path `/content/portal/sources/...pdf` | 404. The response was HTML, not a PDF |
| No cookie | 401 |
| Cookie after logout | 401 |
| Reported but not verified payment | 403, not a PDF |
| Another class’s book, including a rewritten query string | 403 `wrong_class` |
| Unpublished book | 403 `unpublished` |
| English account | No book is created, so there is nothing to open |

The reader loads the file through `/api/learn/books/[bookId]/file` and shows the bytes in the page. The response is `Content-Disposition: inline`, `Cache-Control: private, no-store`, and it no longer sends a download filename. A person who is allowed to read the file can still save the bytes the browser has already received, and screenshots cannot be prevented. No published file was opened in the browser during this review, because publication stayed off.

## 6. Mock-test access and scoring

| Rule | Result |
| --- | --- |
| Class 7 cannot open a Book 2 test | Passed over HTTP: 403 `wrong_class` |
| Class 9 library lists only Book 2 tests MT01–MT05 | Passed in the browser. All five were “Not published” and “Not open” |
| An unpublished test does not start | Passed over HTTP: 403 `unpublished` |
| Answers and explanations are removed before a test is sent | Passed in the store test for the started attempt |
| The server scores from the stored key | Passed. A body that included `score: "25"` was scored as one question, not 25 |
| Another student’s attempt id is refused | Passed over HTTP: “This attempt was not found.” |
| A second submit of the same attempt is refused | Passed in the store test |

Settings that are present and still need an organisational decision:

- Time limit: 30 minutes, taken from the booklet line “Time Allowed: 30 Minutes”, and enforced with `expiresAt`.
- Negative marking: the booklet says “None”. The scorer gives one mark per correct option and does not subtract.
- Passing score: not set.
- Attempt limit and retake: not set. After an attempt is submitted or expired, the code can open another attempt. That behaviour is not an approved exam rule.

All ten tests were checked as stored records against the Word files. They were not each sat as a full 25-question paper in the browser, because they are unpublished and this review did not publish them.

## 7. One active device

Before this review, the cookie was only an account id and an expiry. A second sign-in did not cancel the first cookie. That was a defect. It is now fixed in this branch.

The cookie is `v2.<student id>.<session generation>.<expiry>.<signature>`. Each sign-in and each logout increases that generation in the student record. The server accepts the cookie only when the generation still matches. The check does not use the IP address or browser script.

| Step | Result |
| --- | --- |
| Sign in on device A, then sign in on device B | Passed over HTTP. The cookies were different |
| Device A requests the book file | 401 |
| Device B opens the library | The Class 7 library loaded for that account |
| Logout | 303 to `/learn`, and the same cookie then received 401 on the file route |
| Expired cookie | Passed in the unit test. A cookie sealed with a past expiry does not open |

This works for the local file store used by the app. It will not hold across separate server instances until student records live in one shared database. See section 11.

## 8. Content inventory verification

The saved catalog was compared again with the Word paragraphs, not only with a second run of the same extractor. For every question, the prompt, each option and the explanation had to equal a source paragraph. The compact answer key had to equal the explanation-row answer. Question numbers had to be 1–25 in order, with no duplicate source id.

| Book | Tests | Questions each | Total | Mismatches |
| --- | ---: | ---: | ---: | ---: |
| Book 1 | 5 | 25 | 125 | 0 |
| Book 2 | 5 | 25 | 125 | 0 |
| Total | 10 | — | 250 | 0 |

Both PDFs were counted with a PDF reader: Book 1 has 58 pages and Book 2 has 67 pages. No question text was rewritten during this review. Practice questions and model papers inside the PDFs were not copied into the mock-test bank.

`python3 scripts/extract_portal_content.py --verify` printed: `verified 10 tests, 250 questions, no wording or answer-key mismatches`.

## 9. Book 1 cover discrepancy

Unresolved. The original PDF was not edited.

The Book 1 cover says the book is for Classes 6–8 and 9–10, and that Book 1 is for both groups. The model-test footer in the same PDF says Group-1 (Classes 6–8). The Book 2 cover says Classes 9–10 only.

The launch mapping was left as it is:

- Book 1 → Classes 6, 7 and 8.
- Book 2 → Classes 9 and 10.

A Class 9 account in the browser received Book 2 only. A Class 7 HTTP request for Book 2 was refused. The cover needs clarification or correction before Book 1 is published. The same note is in `docs/PORTAL_CONTENT_INVENTORY.md`.

## 10. English and Mathematics

Both streams can be selected at registration, for Classes 3–10. No book, test, question or ₹49 price is created for them. An English registration in the store test had an empty library and a fee status of `fee_not_approved`. No placeholder content was added.

## 11. Database migration and RLS

The migration was not applied to production. It was applied only to a new local PostgreSQL 16 database named `tejas_portal_review`, which had no other tables. That database was dropped after the check.

| Check | Result |
| --- | --- |
| Migration applies | Passed on the empty local database. Nine tables were created |
| Future Tech class 5 | Rejected by `tejas_learn_students_check` |
| English class 5 | Inserted, then removed when the database was dropped |
| Mock-test fee other than 0 | Rejected by `tejas_learn_books_mock_test_fee_inr_check` |
| Row level security | Enabled on all nine tables |
| Policies | None. With no policy, Supabase `anon` and `authenticated` roles would be denied. The table owner and a role with bypass rights still skip row level security, because the migration does not use `FORCE ROW LEVEL SECURITY` |
| Indexes | Primary keys, unique email, unique paper code, and the book/test uniqueness constraints. No extra index on entitlement or attempt student id |
| Rollback | Passed on a second empty local database: the statements were run inside a transaction and rolled back, leaving 0 tables. A committed copy was then dropped with `DROP TABLE` of only the nine new tables |
| Existing Olympiad tables | Not present in those empty databases, and the migration text does not name them |

The running portal does not read or write these tables. Accounts, entitlements, attempts and the session generation are stored in a JSON file under the portal data directory. The SQL also has no password salt and no session generation column, so it does not match the running record. Wiring the app to Supabase would be a larger change and was not done.

On a serverless host, that JSON file is not a shared durable database. Accounts and the one-active-device generation should not be treated as production-ready until a shared database is approved and connected. This review did not enable any paid Supabase feature.

## 12. Regression results

Executed on 13 November 2026 against this branch:

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | Passed, no output |
| `npm test` | 42 passed, 0 failed, 0 skipped. This includes the registration, fee, payment and portal tests |
| `npm run lint` | Not completed. `next lint` has no ESLint configuration and opened an interactive prompt. No ESLint config was added |
| `npx next build` | Passed, including its type check. 55 static pages generated |

School fee maths, duplicate-registration handling, payment-history behaviour and the hosted-database refusal tests passed in that same `npm test` run. Production registration rows were not read or modified.

## 13. Preview and local interface testing

**Vercel preview: not tested as an application.** Opening `/learn` in the browser showed “Log in to Vercel”. Unauthenticated HTTP requests for `/learn`, a source PDF path and the book file API each returned 302 to the Vercel login. No account was created there.

Local checks against `http://127.0.0.1:3001` used test accounts only (`example.test` addresses) in a temporary data directory:

| Check | Result |
| --- | --- |
| Registration and Future Tech class list | Passed |
| Class 9 library shows Book 2 only | Passed at a 390px device width and again at the normal desktop width |
| Payment `unpaid`, publication `Awaiting approval`, reading `Locked` | Passed |
| Five Book 2 tests listed as not open | Passed |
| Direct book and test URLs without the right entitlement | Passed over HTTP, as recorded in sections 5 and 6 |
| Reading an open PDF, completing a mock test, and seeing the explanation page | Not tested in the browser. Those actions require publication, which was left off |
| Logout control | Present on the library page. Cookie invalidation was tested over HTTP, not by clicking Sign out in the browser |

## 14. Security issues and unresolved risks

1. The Book 1 cover still needs clarification or correction before publication.
2. Student records and the one-active-device generation live in a local JSON file. The new SQL migration is unused. This is not safe to treat as the production store.
3. The shared staff token is recorded as `staff`, not as a named person.
4. An entitled browser can still save PDF bytes. There is no public file URL. Copying the screen cannot be fully prevented.
5. Exam retakes and a passing score are not approved. The 30-minute limit and the absence of negative marking come from the booklets.
6. Payment verification is a manual reference check. A student can submit any reference string. Access starts only after staff mark it verified.
7. Row level security on the unused tables has no policies and is not forced for the table owner.
8. ESLint is not configured, so `npm run lint` could not produce a lint result.
9. The Vercel preview is behind Vercel authentication, so this review could not repeat the checks on that deployment.

No book or mock test was published. Default publication for both books and all ten tests remains `awaiting_approval`. A test-only publication flag was used inside the automated test data directory to prove that one published book does not publish the other book’s tests, and that a rejected payment still cannot open a published book. The catalog file and the browser session stayed unpublished. Publishing one row does not publish the others: Book 2 stayed `awaiting_approval` while a Book 1 publication flag was set in that test directory.

## 15. Changes made during this review

- One active session per student. Sign-in and logout advance a server-side generation, and older cookies stop working.
- Book responses no longer include a download filename. They stay `inline` and `no-store`.
- Tests for the second sign-in, a rejected payment, a duplicate payment report, and a client-supplied score.
- The extractor can verify the saved catalog against the Word paragraphs with `--verify`.
- The Book 1 cover note in the content inventory now says the cover needs clarification or correction before publication, and that the PDF was not edited.
- This report.

No question, option, answer or explanation was edited. The class mapping was not changed. School registration and printed-book pricing were not changed.

## 16. Recommendation

**Ready for owner approval of the production database step. Do not merge or publish yet.**

The pull request is ready for a person to review. Content stays unpublished. The production database step is waiting on a working Supabase connection and an explicit approval.

## 17. Follow-up implementation on 13 November 2026

Staff login was failing as a normal sign-in because the only credential was a shared server token, and the session cookie was not written on the HTTP response the browser stores. A valid token with accidental surrounding whitespace was also rejected. The route now writes an HttpOnly, SameSite=Lax cookie on the response. The recovery token still opens the school review page and the portal inventory, including when the new staff table is absent, so the owner is not locked out. After the portal migration is applied, an authorised person can create individual reviewer accounts from the inventory page. Those accounts use scrypt password hashes. Corrections, payment reviews and publication changes record that identity. The recovery path is recorded as `recovery`, which is a role, not a person's name. No staff password was invented.

Student accounts, entitlements, attempts, publication flags and session generations use Supabase when `SUPABASE_URL` and a server key are configured. On Vercel, or when `NODE_ENV` is production, the portal refuses to write a local JSON file. Local tests still use the file store. Retakes stay closed unless `TEJAS_PORTAL_RETAKES=allow`. The 30-minute limit and the lack of negative marking remain. No passing score was added.

The migration `supabase/migrations/20261113_tejas_learning_portal_durable.sql` adds the missing columns, staff tables, session functions, indexes and unpublished book and test identity rows. A local PostgreSQL test registered a Class 7 student, verified a ₹49 payment, corrected the class to 10, and confirmed the old entitlement became `superseded` while the new Book 2 entitlement stayed `unpaid`. A Future Tech Class 5 registration was rejected. Rolling the migration back left zero tables. A pre-existing local table row was still present after the portal migration. No local `portal.json` student file existed, so there was nothing to import. Nothing was published: the seeded book and test rows are `awaiting_approval`.

Production was not changed. `db.zapccpipwxduzlnvjdmy.supabase.co` does not resolve, and the pooler reports that the tenant was not found. The production schema-status endpoint also reports the database as unreachable. Without a backup that can be restored, the production migration was not applied.

ESLint is configured with `next/core-web-vitals`. `npm run lint` completes with two existing warnings and no errors. `npm test` passed 43 tests. `tsc --noEmit` and `next build` passed.

The Vercel preview still redirects to a Vercel login. Preview protection was not turned off.

Safe to keep in review:

- The 250 questions match the Word booklets.
- Stream, class, payment and publication are enforced on the server for the local store.
- One active device is now enforced on that same store.
- Books and tests remain unpublished.
- Production data and the production database were not changed.

Still required before students can be admitted:

- Restore the Supabase project, or provide a working free-plan connection. The configured host does not resolve, so no production backup or migration was possible.
- Approve applying `20261113_tejas_learning_portal.sql` and `20261113_tejas_learning_portal_durable.sql` after that backup succeeds.
- Create the first named staff account from the inventory page after the migration. Until then, the recovery token remains the way in.
- Leave retakes disabled, or set `TEJAS_PORTAL_RETAKES=allow` only after that policy is approved.
- Leave books and tests unpublished until a separate publication approval.
