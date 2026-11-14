# TEJAS PR #20 final owner review

Reviewed: 14 November 2026, 3:16 PM IST.
Reviewer action: read-only. No application code was changed in this review. No merge, no push to `main`, and no Production write occurred.

## 1. Identity

| Item | Result |
|---|---|
| Pull request | [#20](https://github.com/dhevb/tejas/pull/20), open, not draft |
| Branch | `cursor/website-remediation-2878` |
| HEAD reviewed | `11ce4e964daa3b9bcc2e4a83ccb2cf9d594f533b` |
| Base | `main` at `fb64ed3c910b0d582648d176523ed4407cee34ed` |
| Commits on the branch | `dbff908`, `70bc75b`, `11ce4e9` |
| Merge state | MERGEABLE, CLEAN |
| Production deploy of this PR | Has not happened |

The three commits are the branding correction, the Kalam-redirect note, and the second content pass. The diff against `main` is 50 files. None are environment files, SQL, migrations, grants, or policy files.

## 2. Diff review

The changes stay inside branding, current-cycle copy, public empty states, publication wording, the staff check on schema-status, two tests, and the audit documents.

Kept on purpose:

- 1st DHE English Olympiad, 13–16 October 2025, 10,040+ students, 25 schools.
- Hall of Fame names labelled as 2025, including Kanav Goyal.
- The school-registration question about that 2025 examination.
- The seal image and the saffron `#C6530A` on तेजस.
- The staff publication control. Its warning still says a save writes the production database. This review did not save a status.

Not found in the diff:

- A secret, token, or personal record.
- A weaker student login or one-device rule.
- A fee, class range, or examination date that disagrees with the approved 2026–27 facts.
- A current-programme title “DHE English Olympiad 2.0”, “DHE Maths Olympiad”, or “DHE Tech Olympiad”.

`/editions/apj-abdul-kalam` is a 307 redirect to `/editions/tejas-2026-27` in `next.config.ts`. `getEditionContent` also maps that old slug onto the TEJAS 2026–27 record, whose public name is TEJAS Olympiad 2026–27. The old label is not an edition page.

## 3. Official programme information

Checked in `content/current-cycle.ts`, the three Olympiad content files, the homepage, the edition page, and the school form.

| Fact | In this commit |
|---|---|
| TEJAS = Talent Exploration for Junior Aspiring Scholars | Yes |
| Tagline: Find your spark... | Yes |
| English, Classes III–X, 10 December 2026 | Yes |
| Mathematics, Classes III–X, 9 December 2026 | Yes |
| Future Tech, Classes VI–X, 11 December 2026 | Yes |
| Registration 3–20 November 2026 | Yes |
| Registration ₹150; school ₹30; TEJAS ₹120 | Yes |
| Printed book ₹170; school ₹34; TEJAS ₹136 | Yes |
| E-book and mock tests ₹49, separate from school registration | Yes |

No new examination pattern, negative-marking rule, result date, endorsement, or statistic was added. The 2025 “no negative marking” sentence stays attached to the 2025 description.

## 4. Reported fixes

Evidence below is from the source at `11ce4e9` and from a local production server already running that build. The Vercel Preview URL itself was not readable. See section 6.

| Claim | Evidence |
|---|---|
| `/learn` and `/prepare/ebook` read the publication table | Both render `PublicationStatus`, which calls `publicBookPublication()`. The local server has no database, and both pages say the status could not be read. They do not say the books stay unpublished. A unit test publishes one local book and test, reads them back, and restores them. |
| `/beta` does not post to a third party | `app/beta/BetaPageClient.tsx` is deleted. The page has no submit handler. Local HTML says “does not send a form”. |
| `/contact` does not claim delivery | Local HTML says “does not send a message”. The button is disabled. |
| Search does not pretend to search | The disabled field’s label is “Search is not available”. The homepage HTML contains that phrase. |
| `/schools/register` explains its limit | The new paragraph says the form does not create a login and does not charge ₹49. |
| `/about` does not call registration “planned” | The roadmap lists school registration and the student portal as available, and results as not yet declared. |
| `/olympiads/future-tech` redirects | Local response: 307 to `/olympiads/technology`. |
| Sanskrit naming | The coming-soon copy no longer says “DHE Sanskriti Olympiad”. |
| Countdown and dates | The countdown renders a fixed sentence on the server and starts the clock after load. Dates use `formatDisplayDate`, which returns “10 December 2026” for `2026-12-10`. Local English HTML contains both the fixed countdown sentence and “10 December 2026”, and does not contain “2.0”. |
| Previous-edition links | `EditionCard` receives the edition href. “View edition” is a separate link, not a link inside that card. |
| `NODE_ENV` type errors | `tsconfig.json` is unchanged. Tests assign the property with `Reflect.set`. `npx tsc --noEmit` exits 0. |

`/api/register/schema-status` returns 401 without a staff cookie. The local body is `{"ok":false,"error":"Staff sign-in is required."}`. The handler checks the staff cookie before it can describe the database.

## 5. Technical checks run in this review

| Check | Result |
|---|---|
| `npm test` | 50 passed, 0 failed, 0 skipped, 0 cancelled |
| `npx tsc --noEmit` | Exit 0. No error output. |
| `npx next lint` | Completed. One existing warning: `<img>` in `components/brand/TejasEmblem.tsx`. |
| `npm run build` | Succeeded. `/learn` and `/prepare/ebook` are dynamic. |

No test was deleted or skipped to obtain that result. The production-secret tests still require the hosted branch to refuse a file secret.

## 6. Vercel

| Check | Status | Evidence |
|---|---|---|
| Vercel | Success | Deployment `F7ok5G26ZVrQF5i1KMLRydwa7duM`, updated 3:08 PM IST on 14 November 2026 |
| Vercel Preview Comments | Success | GitHub check |
| Supabase Preview | Skipped | GitHub check. Merge state remains CLEAN, so GitHub is not treating this skip as a required failure. |

The preview hostname responds with a redirect to `https://vercel.com/login`. The TEJAS pages on that hostname were not read. A “2.0” match on that response belongs to the Vercel login page, not to the TEJAS preview. Preview content is therefore not verified from the public URL.

## 7. Production comparison

Read-only GET and HEAD on 14 November 2026. `main` is still `fb64ed3`.

| Issue | Production | This commit, local server | Preview URL |
|---|---|---|---|
| `/prepare` contains “65%” | Still present | Absent. The page says “Preparation”. | Not readable |
| `/olympiads/english` contains “2.0” | Still present | Absent | Not readable |
| `/learn` says the books stay unpublished | Still present | Absent. The page says the status could not be read. | Not readable |
| Header “OLYMPIAD” | Absent from the homepage HTML | Present in the source lockup | Not readable |
| `/editions/apj-abdul-kalam` | 307 to `/editions/tejas-2026-27`. The followed page does not contain “Kalam”. | 307 to the same path | Not readable |
| `/olympiads/future-tech` | 404 | 307 to `/olympiads/technology` | Not readable |
| `/beta` | HTML still contains “Help Shape” and does not contain the new “does not send a form” sentence | New sentence is present | Not readable |

Production already redirects the old Kalam address. It does not yet contain this pull request’s other corrections.

## 8. Security and database safety

- Schema-status fails closed for a visitor.
- `publicBookPublication()` returns book titles, class ranges, and published counts. The unit test checks that the summary does not include a student record.
- Staff publication, payment review, registration submit, and student sign-in were not used.
- No Production row was written. No migration, grant, RLS policy, secret, or environment variable was changed.
- The staff console text still warns that saving a publication status writes the production database.

## 9. Unresolved items

### Printed-book hint still says the e-book is not for sale

- Severity: Low
- File or route: `app/schools/register/school-registration-form.tsx`, printed-book section hint
- Evidence: The hint reads “E-book access is not for sale, so it is not charged.” That line is older than this pull request. The new paragraph under it says the form does not charge ₹49 and that Future Tech e-books are a separate portal.
- Expected behaviour: A school reader can tell that this form does not sell the e-book, and that the student portal does sell it for ₹49 when the book is published.
- Actual behaviour: The hint can be read as saying the e-book is not sold anywhere. The following paragraph corrects that.
- Impact: A coordinator may miss the separate ₹49 portal.
- Required action: Owner decision. A later edit can change the hint to “This form does not charge the ₹49 e-book.” This review did not edit it.

### About page says “this school form”

- Severity: Low
- File or route: `app/about/page.tsx`
- Evidence: The schools list says “The ₹49 e-book is a separate student portal. This school form does not charge it.”
- Expected behaviour: The about page does not refer to itself as the school form.
- Actual behaviour: The fee facts are right. The words “this school form” point at a different page.
- Impact: Small wording slip. The fees and the separate portal are still stated.
- Required action: Optional copy edit. Not done in this review.

### Preview pages were not opened

- Severity: Medium
- File or route: Vercel preview hostname
- Evidence: Each preview GET ended at `https://vercel.com/login`.
- Expected behaviour: A reviewer can read the preview HTML.
- Actual behaviour: Vercel authentication stands in front of the preview. This review did not sign in.
- Impact: The rendered preview was not compared with Production. Local HTML from this commit was compared instead.
- Required action: The owner can open the preview while signed in to Vercel. Do not register or sign in as a student there unless that preview is shown to use a separate database.

### Live publication sentence was not seen

- Severity: Medium
- File or route: `/learn`, `/prepare/ebook`
- Evidence: The local server has no Supabase connection, so both pages say the status could not be read. The 12 Production publication rows were not counted in this review.
- Expected behaviour: After a deploy, those pages name each Future Tech book as published or awaiting approval from the publication table.
- Actual behaviour: That Production sentence has not been observed. The code refuses to guess.
- Impact: A deploy is still required before the public sentence can be confirmed.
- Required action: After an owner-approved deploy, read those two pages. Do not click Save on the staff publication form.

### Contact and beta do not deliver mail

- Severity: Low
- File or route: `/contact`, `/beta`
- Evidence: Both pages say a message typed there is not sent and name tejas@dhe.org.in.
- Expected behaviour: No false “message sent” state.
- Actual behaviour: That is what the pages do. They are not inboxes.
- Impact: Feedback depends on the visitor’s own email.
- Required action: Owner decision if a mail transport should be added later.

### Search, missing files, and unlisted editions

- Severity: Low
- File or route: header search; resources; future edition names
- Evidence: Search is disabled. English and Mathematics files are described as not supplied. Phule, Ramanujan, Chawla, and Tagore stay unlisted, and their old URLs redirect to `/editions`.
- Expected behaviour: The site does not invent a search index, a PDF, or an unapproved edition.
- Actual behaviour: Matches that limit.
- Impact: Those features remain absent on purpose.
- Required action: Owner approval and the missing material, in a later change.

## 10. Recommendation

READY FOR OWNER APPROVAL.

The commit `11ce4e964daa3b9bcc2e4a83ccb2cf9d594f533b` matches the requested head. Its programme facts agree with the approved 2026–27 record. Tests, typecheck, lint, and build passed in this review. The two low wording notes do not contradict the fees or the dates.

This is not a statement that the live website is free of defects. Production still shows the old prepare-page progress, the English “2.0” calendar, the unpublished Future Tech sentence, and a 404 for `/olympiads/future-tech`. Those change only if the owner merges and deploys this pull request.

The decision to approve, merge, and deploy belongs to the owner. This review did not merge or deploy.
