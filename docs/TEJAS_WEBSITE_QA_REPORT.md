# TEJAS website QA report

Date: 14 November 2026, afternoon (Asia/Calcutta).
Branch: `cursor/website-remediation-2878`.
Pull request: https://github.com/dhevb/tejas/pull/20
Production https://tejas.dhe.org.in was compared with GET requests only. It was not deployed, and no Production record was created or changed.

This report does not say the live website is free of defects. The live site was still serving the earlier pages when it was read.

## Fixed and checked on a local production server

| Finding | Root cause | Change | Check |
|---|---|---|---|
| `/learn` said both Future Tech books stay unpublished | Static sentence, ignoring the publication table | `PublicationStatus` reads `publicBookPublication()` on `/learn` and `/prepare/ebook` | Local HTML says the status could not be read. No database was configured, so the page did not invent “published”. |
| School form said student logins are not available | Copy written before the student portal existed | The form says it does not create a login and does not charge ₹49, and links to the publication page | Rendered `/schools/register` contains “does not create a student login” |
| `/beta` posted to formsubmit.co and could show a false “sent” state | Unknown third-party endpoint | The page no longer has a submit action. It gives the existing address tejas@dhe.org.in | Rendered text says the page does not send a form. Source search finds no `formsubmit.co` |
| Contact form said “Phase 0” and “Coming Soon” | Internal phase label on a control that does not send | The form says it does not send, and names the same email | Rendered `/contact` |
| Search looked like a working field | Placeholder promised a search | Disabled field reads “Search is not available” | Homepage HTML contains that phrase. No search index was added |
| Unused roadmap cards used `href: "#"` | Placeholder destinations | Those four entries no longer have a hash href. The section is still not mounted | Source test |
| `/about` called registration and authentication “planned” and linked to `github.com/dheWeb/tejas` | An internal phase table and a wrong repository URL | The table lists what the public site actually does. The GitHub link was removed. The school and student lists use the approved fees and the 2025 Hall of Fame label | Rendered `/about` keeps “1st DHE English Olympiad” |
| `/olympiads/future-tech` was a 404 | The canonical slug is `technology` | Temporary redirect to `/olympiads/technology` | Browser ended on `/olympiads/technology` |
| Sanskrit page used “DHE Sanskriti Olympiad” as a current name | Coming-soon copy named an unopened programme | The page says Sanskrit is not open for 2026–27 and has no launch date | Rendered page does not contain that name |
| Olympiad pages threw React hydration error 418 | The countdown rendered a different second on the server and in the browser, and dates used `toLocaleDateString` | The countdown paints after load. Dates use a fixed “10 December 2026” format | Chrome recorded no page error on English, Mathematics, or Future Tech |
| `/editions/previous` threw a hydration error | `EditionCard` is already a link and was wrapped in another link | The card receives the edition href. “View edition” is a separate link | Chrome recorded no page error |
| `tsc` failed on four `NODE_ENV` assignments | `next/types/global.d.ts` marks `NODE_ENV` readonly. Node still allows the write | Tests assign it with `Reflect.set` and restore it the same way | `npx tsc --noEmit` exits 0. The production-secret tests still pass |
| Header lockup, 2026 dates, prepare-page fiction, dead resource cards, schema-status, and the Kalam redirect | Recorded in the remediation report | Kept from the first pass | Local header shows तेजस and OLYMPIAD. `/editions/apj-abdul-kalam` ends on `/editions/tejas-2026-27` without the Kalam name in the visible text. Unsigned schema-status returns 401 |

At 1440, 768, and 390 pixels, `/`, `/olympiads/english`, `/schools/register`, `/learn`, and `/about` did not overflow horizontally.

Historical lines that remain on the rendered pages: “1st DHE English Olympiad” and “10,040”.

## Fixed in code, not yet visible on Production

A read-only GET on 14 November 2026 found:

- https://tejas.dhe.org.in/prepare still contained “65%”.
- https://tejas.dhe.org.in/olympiads/english still contained “2.0”.
- https://tejas.dhe.org.in/learn still said the books stay unpublished.
- The homepage HTML did not contain “OLYMPIAD”.

Those sentences change only after this pull request is deployed. The local `/prepare/ebook` sentence was the fail-closed sentence, not the Production publication sentence. The 12 Future Tech publication rows were not counted again. No publication action was saved.

## Blocked pending an owner decision

| Item | What is missing |
|---|---|
| Contact form delivery | A mail transport. The page now tells people to write to tejas@dhe.org.in. It does not pretend to send. |
| Beta feedback delivery | The same. formsubmit.co was removed rather than treated as an approved inbox. |
| Search | An index and a result page. The control stays disabled. |
| English and Mathematics files, videos, and the 2025 brief-report PDF | The files themselves. Cards and sections do not offer a download that is not attached. |
| Phule, Ramanujan, Chawla, and Tagore editions | Approval to list them. Their old URLs still redirect to `/editions`. |
| Empty edition gallery and Hall of Fame groups | Photographs or additional winner records. They stay marked coming soon. |

## Checks

| Check | Result |
|---|---|
| `npm test` | 50 passed, 0 failed |
| `npx next lint` | Completed. One existing warning in `components/brand/TejasEmblem.tsx` |
| `npx tsc --noEmit` | Exit 0 |
| `npm run build` | Succeeded. `/learn` and `/prepare/ebook` are dynamic |

## Safety

No pull request was merged. Nothing was pushed to `main`. Production was not deployed. No registration, payment, student, staff, or publication row was created or changed. No secret, migration, grant, or RLS policy was changed. Preview was not used for sign-in.
