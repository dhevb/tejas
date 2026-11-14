# TEJAS website remediation report

Later pass, 14 November 2026, 3:38 PM IST: school and about copy no longer says the e-book is not for sale or calls the about page “this school form”. Unannounced subject pages no longer publish a class range, syllabus, or award. `/research` no longer labels an internal link as Shiksha Mahakumbh. The checks for that pass are in `docs/TEJAS_PRODUCTION_DEPLOYMENT_READINESS.md`.


Date: 14 November 2026 (Asia/Calcutta).
Branch: `cursor/website-remediation-2878`.
Base: `main` at `fb64ed3c910b`.
Production https://tejas.dhe.org.in was not modified and was not deployed.

This report covers the corrections made after `docs/TEJAS_COMPLETE_WEBSITE_AUDIT_REPORT.md`. A page returning HTTP 200 is not treated as a working workflow.

## Result

| | Count |
|---|---|
| Issues recorded in this pass | 28 |
| Critical | 3 |
| High | 6 |
| Medium | 10 |
| Low | 9 |
| Corrected in this branch | 19 |
| Left open or only partly checked | 8 |
| Not a defect | 1 |

Counting method: one row in the matrix below is one issue. Eighteen removed resource cards are one issue. Historical 2025 names are not issues.

## What was corrected

The header lockup is now:

```
तेजस
OLYMPIAD
```

The Hindi word stays `#C6530A`. The seal image was not replaced. On a local production server the word sits 2px under the Hindi line, does not wrap, and does not overflow at 1440px, 768px, or 390px.

Current stream copy uses TEJAS English Olympiad, TEJAS Mathematics Olympiad, and TEJAS Future Tech Olympiad. Registration is 3–20 November 2026. Examinations are Mathematics 9 December, English 10 December, and Future Tech 11 December 2026.

`/prepare` no longer shows learner progress, trending titles, recommendations, or counts such as 6+, 24+, 8+, or 500+.

Resource cards no longer use `href: "#"`. Remaining links go to `/prepare/mock-tests`, `/faq`, `/schools/register`, `/editions/dhe-english-2025`, and `https://www.shikshamahakumbh.com`.

`/prepare/ebook` calls `publicBookPublication()` on each request. The catalog seed remains `awaiting_approval`. The publication table is the overlay. A unit test publishes one book and one test in a local file store, reads them back as published, and restores them. No Production publication row was written.

`/api/register/schema-status` now requires the staff cookie. Unsigned and forged requests return 401 and do not include table metadata. A valid local staff session receives the diagnostic. With no database configured, that body is `ok: false`, `reason: "missing"`, and an empty count list.

## Historical references deliberately retained

- 1st DHE English Olympiad, 13–16 October 2025
- 10,040+ students and 25 schools
- `/editions/dhe-english-2025` and the previous-editions archive
- Hall of Fame 2025 names, including Kanav Goyal, now labelled as the 2025 English Olympiad rather than TEJAS Mathematics 2026–27
- The school-registration question about participation in the first English Olympiad
- FAQ answers that explain the first edition and Shiksha Mahakumbh 5th Edition
- Homepage caption that those first places are not TEJAS 2026–27 results

The first edition was not renamed to TEJAS.

## APJ Abdul Kalam and Olympiad 2.0

- Source search of `.ts` and `.tsx` files finds no `DHE English Olympiad 2.0`, no `DHE Maths Olympiad`, and no `DHE Tech Olympiad`.
- The local English page calendar shows the 2025 completed events, then registration on 3 November 2026, registration close on 20 November 2026, and the examination on 10 December 2026. July and September 2026 are absent.
- The current edition export is `tejas2026Edition`. Its public name remains TEJAS Olympiad 2026–27.
- `/editions/apj-abdul-kalam` still redirects to `/editions/tejas-2026-27`. The label is not rendered as an edition. The redirect is kept for old bookmarks.

## Security test evidence

`npm test`: 49 passed, 0 failed. The new cases are:

- `schema status requires a staff session and does not describe the database to visitors`
- `the public e-book summary follows publication status and does not include student records`

Local `GET /api/register/schema-status` without a cookie returned 401 and the body contained “Staff sign-in”.

`npx tsc --noEmit` still fails on four pre-existing assignments to `process.env.NODE_ENV` in `lib/portal/portal.test.ts` (TS2540). No new type error was reported. `next build` type-checks the application and completed successfully. `next lint` completed with the two existing warnings in `TejasEmblem.tsx` and `Countdown.tsx`.

## Production safety

No Production form was submitted. No student, payment, registration, entitlement, or publication row was created or changed. No migration, grant, RLS policy, secret, or environment variable was changed. Pull requests 16 and 17 were not modified. This branch was not merged and was not deployed.

The local `/prepare/ebook` page says the publication status could not be read, because that server has no Supabase connection and production mode refuses the file store. That sentence is intentional. The Production wording after a future deploy was not observed.

## Workflows not verified on Production

- School registration submit and payment proof
- Student registration, login, logout, one-device rejection, and session expiry
- Entitled e-book reading, zoom, and page turns
- Mock-test start, timer, submit, score, and retake
- Staff publication, payment review, correction, and CSV export
- Beta form delivery
- External footer links
- Every route at phone width. The header was checked at 390px. The other routes were not.

## Matrix

| No. | Severity | Route | File | Current behaviour before this change | Why it was wrong | Evidence | Correction | Fixed | Test | Limitation |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Critical | `/prepare` | `app/prepare/page.tsx`, `data/resources.ts` | 65% progress, trending and recommended titles, counts 6+, 24+, 8+, 500+ | Hardcoded. No learner record. | Audit plus source. Local page no longer contains “65%”. | Sections removed. Categories have no counts. | Yes | Local render | Not deployed |
| 2 | Critical | `/olympiads/english` | `content/olympiads/english.ts` | DHE English Olympiad 2.0 on 1 July and 1 September 2026 | Contradicts 3–20 November and 10 December | Local calendar text | Rows replaced with the verified dates | Yes | Local HTML | Not deployed |
| 3 | Critical | `/api/register/schema-status` | `app/api/register/schema-status/route.ts` | 200 without login, with schema and counts | Public operational metadata | Prior live 200. New test and local 401. | Staff cookie required | Yes | Unit test and local 401 | Authorised Production call not made |
| 4 | High | All headers | `components/layout/TejasNavbar.tsx` | तेजस with no OLYMPIAD under it | Brand lockup missing | Screenshots at 1440, 768, 390 | OLYMPIAD added. Seal unchanged. Colour unchanged. | Yes | Layout measurement, no overflow | Footer still uses English TEJAS and the tagline |
| 5 | High | `/olympiads/mathematics`, `/olympiads/technology` | `content/olympiads/mathematics.ts`, `technology.ts` | July and September TBA dates and DHE Maths / DHE Tech names | Same contradiction as English | Source and local HTML | Official dates and TEJAS names | Yes | Local HTML has no “2.0” | Not deployed |
| 6 | High | `/resources` | `content/resources/index.ts` | 18 cards with `href: "#"` and invented files | Looked like downloads | Source count | Cards without a destination removed. `#` renders as non-clickable if one returns. | Yes | Source search finds `#` only in unused roadmap data | Historical PDF is still not attached |
| 7 | High | `/prepare/ebook` | `app/prepare/ebook/page.tsx` | Said both Future Tech books await approval | Production overlay has 12 published rows | Audit SQL. New reader uses the overlay. | Dynamic read of publication status | Code yes | Unit test on a file store | Live Production sentence not seen |
| 8 | High | Olympiad pages | `content/olympiads/*.ts` | Fake mock tests, sample papers, and video lengths | No files exist | Source | Arrays emptied. Future Tech points to the portal. | Yes | Sections omitted when empty | Not a Production reading test |
| 9 | High | Olympiad and Hall of Fame | `components/shared/CertificatePreview.tsx` | “Official Certificate”, fake code, and a 2025 English winner shown under the Mathematics default | Looked issued | Component defaults | Marked as a layout preview. Hall of Fame names the 2025 English Olympiad. | Yes | Source | Not the issued certificate |
| 10 | Medium | Olympiad titles | `app/olympiads/[slug]/page.tsx` | “TEJAS English Olympiad — TEJAS \| TEJAS” | Duplicated site name | Live title from the audit | Title is now “TEJAS English Olympiad \| TEJAS” | Yes | Source | Not re-fetched from Production |
| 11 | Medium | `/sitemap.xml` | `app/sitemap.ts` | 33 URLs, no school registration | Primary form omitted | Local sitemap now has the URL, 34 locations | URL added | Yes | Local sitemap | |
| 12 | Medium | `/faq` | `data/faq.ts` | Said resources are free and that “DHE Sanskriti” is planned | Prepare hub did not have those files | Source | FAQ now says no public download library, and coming-soon subjects have no launch date | Yes | Source | |
| 13 | Medium | `/faq` and English FAQ | `data/faq.ts`, `english.ts` | “No negative marking” read as a current rule | Not in `content/current-cycle.ts` | Source | Attributed to the 2025 description. 2026–27 rule not invented. | Yes | Source | Brochure may still say more than this site |
| 14 | Medium | Coming-soon Olympiads | `content/olympiads/coming-soon.ts` | 40 + 10 question pattern | Invented | Source | Pattern removed from display and from the generator | Yes | Component no longer prints the table | Pages still say Coming Soon |
| 15 | Medium | Olympiad hero | `OlympiadPortal.tsx` | “50 questions” and a duration | Not in the approved cycle notes | Source | Hero shows the class range | Yes | Local English page | Pattern objects remain in some content files and are not rendered |
| 16 | Medium | Trust strip | `TrustBanner.tsx` | “DHE Olympiad Cell / Official platform” | DHE is the organiser, not the current Olympiad name | Source | “Department of Holistic Education / Organising institution” | Yes | Source | |
| 17 | Medium | Edition code | `content/editions/index.ts`, `next.config.ts` | Export named `apjAbdulKalam2026Edition` | Old label on the current object | Source | Renamed `tejas2026Edition`. Redirect kept. | Yes | Source search | Redirect remains on purpose |
| 18 | Medium | `/beta` | `app/beta/BetaPageClient.tsx` | Posts to formsubmit.co | Delivery unknown | Code inspection | Not changed | No | Not submitted | Pending owner confirmation |
| 19 | Medium | `/contact` | `app/contact/page.tsx` | Send is disabled | Form does not deliver mail | Audit and source | Left disabled. It already says submission is off. | No | Not a false success | Still not a working contact form |
| 20 | Low | Header search | `SearchBox.tsx` | Disabled, “coming soon” | Search is not built | Source | Left disabled | No | Visual only | |
| 21 | Low | SEO keywords | `config/seo.ts` | “DHE Olympiads” | Current programme name is TEJAS | Source | Replaced with “TEJAS Olympiad” | Yes | Source | |
| 22 | Low | Footer | `TejasFooter.tsx` | English TEJAS and the tagline | Hindi lockup is the header requirement | Screenshot | Not changed. The Hindi word is not in the footer. | N/A | | |
| 23 | Low | Unused roadmap | `config/navigation.ts` | `href: "#"` on unmounted cards | Would be dead links if mounted | No import of the section | Left unmounted | No | | Do not mount it as it stands |
| 24 | Low | Future named editions | `content/editions/index.ts` | Phule, Ramanujan, Chawla, Tagore objects | Not current editions | Redirects already return visitors to `/editions` | Left unlisted | No | Prior live 307 | |
| 25 | Low | Edition gallery and Hall of Fame gaps | Those pages | Coming Soon for empty groups | Intentional empty states | Audit | Kept | No | | |
| 26 | Low | Typecheck | `lib/portal/portal.test.ts` | Four TS2540 errors on `NODE_ENV` | Pre-existing. Tests still run. | `tsc --noEmit` | Not changed | No | `next build` succeeds | |
| 27 | Low | Docs | `docs/LAUNCH_AUDIT_REPORT.md`, `docs/BACKEND_ARCHITECTURE.md` | Kalam URL recorded as 200, and the old slug used as an example | Stale for a reader now | Source | Note and example updated | Yes | Source | |
| 28 | Low | Mobile coverage | Sitewide | Header checked. Other routes not opened at 390px | A full phone pass was not done | Screenshots of the header and `/prepare` | Header corrected | Partial | 390, 768, 1440 header | Full mobile pass incomplete |

## Files changed

Application and content:

- `components/layout/TejasNavbar.tsx`
- `components/olympiads/OlympiadPortal.tsx`
- `components/shared/ResourceCard.tsx`
- `components/shared/CertificatePreview.tsx`
- `components/shared/TrustBanner.tsx`
- `app/prepare/page.tsx`
- `app/prepare/ebook/page.tsx`
- `app/resources/page.tsx`
- `app/research/page.tsx`
- `app/olympiads/[slug]/page.tsx`
- `app/hall-of-fame/page.tsx`
- `app/sitemap.ts`
- `app/api/register/schema-status/route.ts`
- `config/seo.ts`
- `content/olympiads/english.ts`
- `content/olympiads/mathematics.ts`
- `content/olympiads/technology.ts`
- `content/olympiads/coming-soon.ts`
- `content/resources/index.ts`
- `content/editions/index.ts`
- `data/resources.ts`
- `data/faq.ts`
- `features/home/PrepareZoneSection.tsx`
- `types/index.ts`
- `next.config.ts`
- `lib/registration/staff.ts`
- `lib/portal/store.ts`
- `lib/portal/remote-store.ts`
- `lib/portal/portal.test.ts`
- `lib/registration/registration.test.ts`

Documentation:

- `docs/TEJAS_COMPLETE_WEBSITE_AUDIT_REPORT.md`
- `docs/TEJAS_WEBSITE_REMEDIATION_REPORT.md`
- `docs/BACKEND_ARCHITECTURE.md`
- `docs/LAUNCH_AUDIT_REPORT.md`

## Recommended next step

Review this pull request. Do not treat it as live until it is deployed, and then read `/prepare/ebook` and `/learn` on Production to confirm the two Future Tech books are described as published. Sign in with an existing student only after that deploy if a reading check is required. This change set does not do that sign-in.

## Second pass — 14 November 2026, afternoon IST

The first pass left the beta form on formsubmit.co, a stale “unpublished” sentence on `/learn`, a school-form sentence saying student logins were unavailable, a public roadmap that still called registration “planned”, and four TypeScript errors. Those are corrected on this same branch. `docs/TEJAS_WEBSITE_QA_REPORT.md` records the rendered checks.

`npm test`: 50 passed, 0 failed. `npx tsc --noEmit` exits 0. `npx next lint` and `npm run build` succeed, with the existing image warning in `TejasEmblem.tsx`. The countdown hook warning is gone.

A local production server, after the rebuild, returned 200 for the public routes that were opened, 307 from `/olympiads/future-tech` to `/olympiads/technology` and from `/editions/apj-abdul-kalam` to `/editions/tejas-2026-27`, and 401 from `/api/register/schema-status` with no cookie. Chrome recorded no page errors on those routes. At 1440, 768, and 390 pixels, the homepage, English page, school form, student portal, and about page did not scroll horizontally. The header showed तेजस and OLYMPIAD.

`/learn` and `/prepare/ebook` said the publication status could not be read, because this server has no Supabase connection. That is the intended fail-closed sentence. Production, read with GET only, still showed the pre-change pages. No form was submitted and no database row was written.
