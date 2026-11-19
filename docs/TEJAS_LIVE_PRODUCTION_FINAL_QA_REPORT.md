# TEJAS live Production final QA

Audit time: 14 November 2026, 4:03 PM IST.
Method: read-only. No form was submitted. No database row was written. No deployment was started. Pull request #21 was not merged.

## 1. Deployment

| Item | Result |
|---|---|
| Domain | https://tejas.dhe.org.in returned HTTP 200. Server: Vercel. |
| Production deployment | `7786134620` |
| Deployment reference | `AtAyPG8yZJEcFnZajPsTx3dPL8vb` |
| Commit | `24355920c970cfd54d7457dd00ae6b4dcc3dcca6` |
| State | success, “Deployment has completed” |
| Created | 3:48 PM IST, 14 November 2026 |
| Previous Production commit | `fb64ed3c910b0d582648d176523ed4407cee34ed` |
| Later deployment | Preview `7786178333` at 3:52 PM IST for documentation commit `141f7a0`. It is not Production. |

`main` is still `24355920c970cfd54d7457dd00ae6b4dcc3dcca6`. The live pages contain the merged copy, including the ₹49 school-form sentence and the removal of the 65% progress block. The sitemap `lastmod` is 3:48 PM IST, the build time of this release. Pull request #21 does not change application files, and its commit is not the Production commit.

Response headers on `/` include `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`. No `Content-Security-Policy` header was present. No `Set-Cookie` was sent on the public pages that were read.

## 2. Final status

`PRODUCTION QA PASSED WITH MINOR ISSUES`

The public site matches the merged release and the approved 2026–27 facts that were checked. One public diagnostic endpoint discloses server-key status. Signed-in student use was not tested.

## 3. Public routes

Each row is a GET of https://tejas.dhe.org.in. Titles are the document titles. Every listed 200 page had one `h1`.

| Route | Result |
|---|---|
| `/` | 200. `TEJAS — Talent Exploration for Junior Aspiring Scholars`. Tagline, ₹150, ₹49, and 9 December 2026 are present. |
| `/about` | 200. `About TEJAS`. Says the school registration form does not charge the ₹49 e-book, and that examinations are offline at the participating schools. |
| `/learn` | 200. `E-book and mock tests`. Publication sentences are in section 7. |
| `/prepare` | 200. `Prepare Hub`. “65%” is absent. |
| `/prepare/ebook` | 200. `E-book access`. Same publication sentences as `/learn`. |
| `/prepare/mock-tests` | 200. `Mock Tests`. |
| `/olympiads` | 200. `Olympiads`. |
| `/olympiads/english` | 200. `TEJAS English Olympiad`. 10 December 2026, Classes III–X, registration 3 November 2026. “DHE English Olympiad 2.0” is absent. |
| `/olympiads/mathematics` | 200. `TEJAS Mathematics Olympiad`. 9 December 2026. “DHE Maths Olympiad” is absent. |
| `/olympiads/technology` | 200. `TEJAS Future Tech Olympiad`. 11 December 2026, Classes VI–X. |
| `/olympiads/future-tech` | 307 to `/olympiads/technology`. |
| `/olympiads/science`, `/hindi`, `/sanskrit`, `/general-knowledge`, `/ai`, `/coding`, `/innovation` | 200. Each says the stream has not been announced, no syllabus has been published, and no certificate is shown. “Classes I–XII” and “NCERT-aligned” are absent. |
| `/schools` | 200. `For Schools`. |
| `/schools/register` | 200. `School registration`. ₹150, ₹170, and “does not charge the ₹49”. “not for sale” is absent. The form was not submitted. |
| `/contact` | 200. `Contact`. Says the form does not send a message and names tejas@dhe.org.in. |
| `/beta` | 200. `Feedback`. Says the page does not send a form. “Help Shape” and `formsubmit` are absent. |
| `/editions` | 200. `Current Editions`. |
| `/editions/tejas-2026-27` | 200. `TEJAS Olympiad 2026–27`. Registration from 3 November 2026 and ₹150 are present. |
| `/editions/apj-abdul-kalam` | 307 to `/editions/tejas-2026-27`. |
| `/editions/savitribai-phule`, `/editions/kalpana-chawla` | 307 to `/editions`. |
| `/editions/previous` | 200. `Previous Editions`. |
| `/editions/dhe-english-2025` | 200. `1st DHE English Olympiad`. “10,040” and “13–16 October 2025” are present. |
| `/hall-of-fame` | 200. `Hall of Fame`. Says the names are from the 1st DHE English Olympiad and are not results for TEJAS Olympiad 2026–27. |
| `/innovation` | 200. `Innovation`. Says an Innovation Olympiad has not been announced and links to `/olympiads/technology`. |
| `/research` | 200. `Research`. |
| `/resources`, `/faq`, `/rankings`, `/scholarships` | 200. Rankings and scholarships say 2026–27 results and scholarship amounts have not been published. |
| `/learn/login` | 200. `Student sign in`. |
| `/learn/register` | 200. `Student registration`. Not submitted. |
| `/learn/dashboard`, `/learn/account`, `/learn/pay` | 307 to `/learn/login` when no session is sent. |
| `/learn/books/ft-book-1`, `/learn/tests/ft-b1-mt01` | 307 to `/learn/login`. |
| `/learn/staff` | 200. Staff sign-in form. The only email in the HTML is tejas@dhe.org.in. No student record is in the first response. |
| `/schools/register/review` | 200. Staff sign-in form. No registration list is in the first response. |

Also checked and absent on these pages: “Phase 0”, “stay unpublished”, “This school form”, and “DHE Tech Olympiad”.

## 4. Official information

Rendered Production copy agrees with the approved record on the pages above:

- Full form: Talent Exploration for Junior Aspiring Scholars.
- Tagline: Find your spark...
- Session: TEJAS Olympiad 2026–27.
- English and Mathematics: Classes III–X. Future Tech: Classes VI–X.
- Mathematics 9 December 2026, English 10 December 2026, Future Tech 11 December 2026.
- Registration 3 November 2026 to 20 November 2026.
- ₹150 per student per stream. Printed book ₹170 when selected. E-book portal ₹49, and the school form says it does not charge that fee.

The header shows तेजस in saffron with OLYMPIAD beneath it. The 2025 English Olympiad page keeps its historical name, date, and 10,040 students.

## 5. Future Tech publication

Visible on both `/learn` and `/prepare/ebook`:

- Future Tech Book 1, Understanding IoT and IoT with Arduino, Classes VI–VIII, is published. 5 of 5 included mock tests are published.
- Future Tech Book 2, IoT with ESP32 and IoT with Raspberry Pi, Classes IX–X, is published. 5 of 5 included mock tests are published.
- English and Mathematics files have not been supplied.

The publication table was not queried. These sentences are the public page, not a row count. No Save control was used.

## 6. Student portal

| Check | Result |
|---|---|
| Login page | Loads. |
| Protected pages without a session | Redirect to `/learn/login`. |
| Book file without a session | `GET /api/learn/books/ft-book-1/file` returns 401, “Sign in to continue.” |
| Staff overview without a session | 401, “Staff sign-in is required.” |
| Signed-in reading, mock tests, payment, and session renewal | NOT TESTED. No authorised student account was supplied. |

## 7. Security

Unauthenticated GET:

| Endpoint | Result |
|---|---|
| `/api/register/schema-status` | 401. No schema description. |
| `/api/register/admin/registrations`, `/export`, `/payment` | 401. |
| `/api/learn/staff/overview` | 401. |
| `/api/learn/books/ft-book-1/file` | 401. |
| `/api/register/TEJAS-2026-AAAAAAAAAAAAAAAAAAAA` | 404. No record body. |
| `/api/register/payment` | 200. Returns the account the site is authorised to publish for school transfers. The number is not repeated here. `proofsAccepted` is true, so the site says a proof upload can be stored and does not by itself confirm payment. No proof was uploaded. |
| `/api/register/storage-status` | 200 without a staff session. See the finding below. |

No service-role secret, JWT, or student record was present in the public HTML that was scanned. Homepage images returned 200.

### Finding: public storage diagnostic

- Severity: Medium
- Route: `GET /api/register/storage-status`
- Evidence: An anonymous request receives `connected: true`, the server key name, key format `jwt`, and boolean flags that the service-role and secret key variables are present. The probe result is the word `accepted`. The response does not contain the key.
- Cause: `app/api/register/storage-status/route.ts` calls `testSupabaseConnection()` and `probeNamedServerKey()` for every caller. It has no staff-session check. The probe requests Supabase `/auth/v1/admin/users?per_page=1` with the server key and discards that response body.
- Correction: Require the same staff session as `/api/register/schema-status` before returning the probe. Do not deploy that change without a separate owner instruction.

## 8. Responsive layout and browser

Chrome checked the required routes plus `/prepare/ebook`, `/olympiads/science`, `/innovation`, `/research`, and `/hall-of-fame` at 390px, 768px, and 1440px.

- Horizontal overflow was 0 on every combination.
- Each page had one `h1`.
- No broken images were reported.
- No console error, including no hydration error, was reported.

Homepage screenshots were captured at 390px and 1440px during this audit. They are not part of the repository.

This is not a formal WCAG assessment. Contact fields that were inspected have labels. The header search field is disabled and its placeholder says search is not available.

## 9. Local tests

`npm test` on the merged application: 50 passed, 0 failed, 0 skipped.

## 10. Pull request #21

| Item | Result |
|---|---|
| State | Open. Not merged. |
| Head | `141f7a0de1fef8d28d34f2a72f5bd6331fb2dce1` |
| Diff | `docs/TEJAS_PRODUCTION_DEPLOYMENT_READINESS.md` only. 44 insertions, 45 deletions. |
| Checks | Vercel passed. Vercel Preview Comments passed. Supabase Preview skipped. |
| Production | Not this commit. |

## 11. Unresolved items

| Severity | Item |
|---|---|
| Medium | Public storage-status diagnostic, above. |
| Low | `/contact` and `/beta` do not deliver mail. The pages say so. |
| Informational | Search is disabled and says so. |
| Informational | No Content-Security-Policy header. |
| Informational | Signed-in portal behaviour is NOT TESTED. |

No critical or high defect was observed in the read-only checks.

## 12. Not tested

- Signing in as a student, opening a book, turning reader pages, or starting a mock test.
- A failed login attempt. No password was sent.
- School registration submit, payment proof upload, and staff review actions.
- Publication Save. Database rows were not counted.
- A full contrast or keyboard audit.

An owner-assisted test needs an existing student whose stream, class, and ₹49 payment are already verified, used only to open that student’s own book and one included test, with no new account and no payment change.
