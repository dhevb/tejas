# TEJAS production deployment readiness

Recorded: 14 November 2026, 3:21 PM IST.
This record does not merge pull request #20 and does not deploy Production.

## 1. Pull request status

| Item | Result |
|---|---|
| Pull request | [#20](https://github.com/dhevb/tejas/pull/20) |
| State | Open. `mergedAt` is null. There is no merge commit. |
| Target | `main` |
| Branch | `cursor/website-remediation-2878` |
| Current HEAD | `aadc775788841a4668b7ef5871da7654b81024ce` |
| Application commit | `11ce4e964daa3b9bcc2e4a83ccb2cf9d594f533b` |
| Documentation after that commit | `aadc775` adds only `docs/TEJAS_PR20_FINAL_OWNER_REVIEW.md` |
| `main` | `fb64ed3c910b0d582648d176523ed4407cee34ed` |
| Merge state | MERGEABLE, CLEAN |

No commit has been added after the owner-review document. Owner approval and merge are still pending. The changes are not on `main` and are not in Production.

## 2. Merged commit

Not applicable. Pull request #20 has not been merged.

## 3. Application diff, not yet on main

Compared `origin/main` (`fb64ed3`) with the application commit `11ce4e9`. The later commit `aadc775` changes only the owner-review document.

The application diff is 45 files outside `docs`. It covers branding, current-cycle copy, publication wording, the staff check on schema-status, and tests. It contains:

- No `.env` file.
- No SQL file.
- No migration.
- No grant, RLS policy, or permission change.
- No student, registration, or payment data.

## 4. GitHub checks on the open pull request

| Check | Result |
|---|---|
| Vercel | Passed. Deployment `DxVoLQFNVaD3GSbtCwC3rbAB6khG` completed. |
| Vercel Preview Comments | Passed |
| Supabase Preview | Skipped. GitHub still reports the pull request as clean, so this skip is not a required failure. |

The passing Vercel check is a Preview deployment of `aadc775`, created at 3:19 PM IST. It is not a Production deployment.

## 5. Vercel readiness

GitHub deployment records, read without starting a deployment:

| Environment | Latest recorded commit | Created |
|---|---|---|
| Production | `fb64ed3c910b0d582648d176523ed4407cee34ed` | 1:27 PM IST, 14 November 2026 |
| Preview | `aadc775788841a4668b7ef5871da7654b81024ce` | 3:19 PM IST, 14 November 2026 |

Production is still the e-book reader merge, pull request #19. The remediation commit is not eligible for Production until it is on `main` and the owner asks for that deployment. Environment-variable values were not read and are not listed here. This pull request does not add a new secret name.

## 6. Production route checklist

GET and HEAD only, against https://tejas.dhe.org.in at 3:21 PM IST. These are the pages now in Production, not the pull request.

| Route | Production now | After a future deploy of this pull request, check |
|---|---|---|
| `/` | 200. “10 December 2026” is present. “OLYMPIAD” is absent. | Header shows तेजस and OLYMPIAD. No overflow at 390px. |
| `/about` | 200. The roadmap still says “Phase 0”. | Registration and the student portal are not described as only planned. |
| `/learn` | 200. The page says the Future Tech books “stay unpublished”. | The sentence comes from the publication table, or says the status could not be read. It does not hard-code “unpublished”. |
| `/prepare` | 200. “65%” is present. | “65%”, trending titles, and invented counts are absent. |
| `/prepare/ebook` | 200. “awaiting organisational approval” is hard-coded for both books. | The same publication read as `/learn`. |
| `/olympiads/english` | 200. “2.0” is present, and “10 December 2026” is also present. | “DHE English Olympiad 2.0” is absent. 3–20 November and 10 December 2026 remain. The 2025 name remains. |
| `/olympiads/mathematics` | 200. The description still says “DHE Maths Olympiad”. | The title and description say TEJAS Mathematics, Classes III–X, 9 December 2026. |
| `/olympiads/technology` | 200. | TEJAS Future Tech, Classes VI–X, 11 December 2026. |
| `/olympiads/future-tech` | 404. | 307 to `/olympiads/technology`. |
| `/schools/register` | 200. A “2.0” match is an SVG path, not programme copy. | The form says it does not create a student login and does not charge ₹49. Do not submit it. |
| `/contact` | 200. “Form submission is disabled in Phase 0.” | The page says the form does not send a message. Do not submit it. |
| `/beta` | 200. The heading is still “Help Shape”. | The page says it does not send a form. Do not submit it. |
| `/editions` | 200. | TEJAS Olympiad 2026–27, with the approved dates and ₹150 fee. |
| `/editions/apj-abdul-kalam` | 307 to `/editions/tejas-2026-27`. The followed page does not contain “Kalam”. | The same 307. The destination is not labelled as an APJ Abdul Kalam edition. |

Fees and class ranges to confirm after deploy, without inventing new ones: English and Mathematics Classes III–X; Future Tech Classes VI–X; registration 3–20 November 2026; examinations 9, 10, and 11 December 2026; ₹150 registration; ₹170 printed book; ₹49 e-book portal.

## 7. Supabase safety

The pull request contains no migration and no privilege change. Production rows were not queried in this check. Student, registration, payment, and publication records were not read and were not changed. Whether the 12 Future Tech publication rows are still unchanged was not re-counted. That is not evidence that they changed, and it is not evidence that they are unchanged.

When this code is later deployed, `/learn` and `/prepare/ebook` only read publication status. They do not write it. Confirming the public sentence still requires a GET after deploy, not a staff save.

## 8. Outstanding issues

- The pull request is open.
- Production still serves `fb64ed3`.
- The Vercel preview hostname requires a Vercel login, so preview HTML was not read in this check.
- Contact and beta will not deliver mail after deploy. That is intentional until a mail transport is approved.
- Search will remain disabled.
- The printed-book hint “E-book access is not for sale” and the about-page words “this school form” remain low wording notes from the owner review.

## 9. Deployment risks

- Deploying before merge is not possible from this branch without a separate production promotion. That promotion was not requested and was not started.
- The first public check after a future deploy is the publication sentence on `/learn` and `/prepare/ebook`. If the database cannot be read, those pages should say so rather than claim the books are unpublished.
- School registration, student login, and payment must not be used as the deployment test.

## 10. Final status

`WAITING FOR PR MERGE`

Owner approval, merge, and Production deployment have not happened. Production deployment needs a separate, explicit owner instruction after the merge.
