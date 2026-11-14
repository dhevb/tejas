# TEJAS production deployment readiness

Recorded: 14 November 2026, 3:38 PM IST.
This record does not merge pull request #20 and does not deploy Production.

## 1. Pull request status

| Item | Result |
|---|---|
| Pull request | [#20](https://github.com/dhevb/tejas/pull/20) |
| State | Open. `mergedAt` is null. There is no merge commit. |
| Target | `main` |
| Branch | `cursor/website-remediation-2878` |
| `main` | `fb64ed3c910b0d582648d176523ed4407cee34ed` |
| Earlier application commit | `11ce4e964daa3b9bcc2e4a83ccb2cf9d594f533b` |
| This pass | Application copy corrections after that review. The commit SHA is the one that contains this file. |

Owner merge is still required. The changes are not on `main` and are not in Production.

## 2. What this pass changed

The earlier review left two wording notes and several pages that described unannounced subjects as if a syllabus and class range existed. Those are corrected on the feature branch.

- The school form, its confirmation, the staff review screen, the homepage, and the about page say the school registration does not charge the ₹49 e-book. They no longer say the e-book is not for sale, and the about page no longer calls itself the school form.
- Science, Hindi, Sanskrit, General Knowledge, AI, Coding, and Innovation pages say the stream has not been announced. They do not publish a class range, syllabus, award, or sample certificate.
- Navigation labels for those subjects say they are not part of 2026–27.
- `/innovation` points to TEJAS Future Tech and says an Innovation Olympiad has not been announced.
- `/hall-of-fame` says the published names are from the 1st DHE English Olympiad in 2025.
- `/research` links the words “Shiksha Mahakumbh” to https://www.shikshamahakumbh.com.
- `/schools` no longer describes dashboards or recognition tiers in its page description.
- The contact address is a mailto link. The form still does not send a message.
- The about page matches the rest of the site: the examinations are offline, at the participating schools.

No fee, date, class range for the three open streams, or payment rule was changed. No database file was added.

## 3. Checks run on this machine

| Check | Result |
|---|---|
| `npm test` | 50 passed, 0 failed, 0 skipped |
| `npx tsc --noEmit` | Exit 0 |
| `npx next lint` | Exit 0. The existing warning is `<img>` in `components/brand/TejasEmblem.tsx`. |
| `npm run build` | Succeeded. Next.js 15.5.20. |

A local production server of this build was read with GET only. `/olympiads/future-tech` returned 307 to `/olympiads/technology`. `/editions/apj-abdul-kalam` returned 307 to `/editions/tejas-2026-27`. `/api/register/schema-status` returned 401 without a staff cookie. `/learn` said the publication status could not be read, because this machine has no database connection.

Chrome at 390px, 768px, and 1440px reported no horizontal overflow on `/`, `/about`, `/prepare`, `/olympiads/english`, `/olympiads/science`, `/schools/register`, `/innovation`, `/hall-of-fame`, and `/contact`. The same browser session reported no console error on `/`, `/olympiads/english`, `/olympiads/science`, `/schools/register`, and `/innovation`.

## 4. Production, still the previous release

The latest Production deployment recorded by GitHub remains `fb64ed3c910b0d582648d176523ed4407cee34ed`, created at 1:27 PM IST on 14 November 2026. A read-only check of https://tejas.dhe.org.in at 3:21 PM IST still showed the old prepare-page progress, the English “2.0” calendar, the unpublished Future Tech sentence, and a 404 for `/olympiads/future-tech`. That check was not repeated after this pass, and Production was not changed.

Environment-variable values were not read. This pull request does not add a secret name.

## 5. Supabase

No migration, grant, RLS policy, student row, registration, payment, or publication row was read or written in this pass. The 12 Future Tech publication rows were not re-counted. That is not evidence that they changed, and it is not evidence that they are unchanged.

## 6. Still unresolved

- Pull request #20 is open. Merge and Production deployment need separate owner instructions.
- Contact and beta do not deliver mail. They say so.
- Search is disabled. English and Mathematics book files are not on the website. Phule, Ramanujan, Chawla, and Tagore stay unlisted.
- `features/home/HowTejasWorksSection.tsx`, `WhatIsTejasSection.tsx`, `ResearchInnovationSection.tsx`, `FutureVisionSection.tsx`, and `WhyTejasSection.tsx` are not mounted on the homepage. Their older marketing sentences are not public.
- The public publication sentence on `/learn` and `/prepare/ebook` can be confirmed only after a later deploy that can read the database. Do not use the staff Save control for that check.

## 7. Final status

`READY FOR MERGE`

The feature branch is ready for the owner to merge. It is not in Production. A merge is not a Production deployment. Production deployment needs a separate, explicit owner instruction after the merge.
