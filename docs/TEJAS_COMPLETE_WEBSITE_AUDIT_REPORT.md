# TEJAS complete website audit

Audit date: 14 November 2026, afternoon (Asia/Calcutta).
Production: https://tejas.dhe.org.in
Deployed commit observed from the public schema-status response: `fb64ed3c910b` (e-book reader merge on `main`).
Repository inspected: `dhevb/tejas` at that commit.
Mode: audit only. No application source, content, database row, migration, permission, environment variable, authentication flow, payment, registration, publication, pull request, or deployment was changed by this audit. No live form was submitted. No student, staff, or payment account was created or signed in.

This file is the audit record. It is not a change to the website.

---

## 1. Executive summary

The public site correctly names the current programme **TEJAS Olympiad 2026–27** on the homepage, the current edition page, and the student portal shell. The organiser line (Department of Holistic Education, VBITR, Kurukshetra) and the three streams and class ranges are present on the homepage. The 2025 event is still labelled as the **1st DHE English Olympiad** in the archive, the hall of fame, and the school-registration question. That historical wording should stay.

The header does not do what the brand rule requires. The Hindi word **तेजस** is shown in saffron, and the English word **OLYMPIAD** is not placed under it on the homepage, desktop header, mobile header, footer, login, registration, or portal pages. On a 1440px desktop the tagline under तेजस is hidden. On a 390px phone the tagline “Find your spark...” sits there instead.

Two public pages are actively misleading:

- `/olympiads/english` still lists **DHE English Olympiad 2.0** registration on 1 July 2026 and the examination on 1 September 2026, both marked TBA. The official cycle is registration 3–20 November 2026 and the English examination on 10 December 2026.
- `/prepare` shows a “Continue Learning” block at **65% complete** for Mathematics Mock, Science Practice, and English Comprehension, plus invented trending and recommended titles and category counters (6+ mock tests, 24+ practice sets, 8+ videos, 500+ question-bank items). None of these are live learner records.

`/prepare/ebook` still says Future Tech Book 1 and Book 2 are awaiting organisational approval. A read-only production count shows 12 publication rows, all published. The sentence is stale.

Eighteen resource cards link to `href: "#"`. They look like downloads and do not open a file. Several titles still say DHE English Olympiad Workbook or DHE Maths Olympiad Workbook.

`/api/register/schema-status` answers without a login and returns table names, column metadata, storage-bucket settings, boolean presence of server environment-variable names, and row counts. The response reviewed for this audit did not include names, emails, payment proofs, or secret values. The counts themselves should not be public.

Authenticated student reading, mock-test submission, payment, one-device login, and staff publication were **not** exercised on production. Unsigned gates were checked: the book file route returns 401, and the book, test, account, and pay pages redirect to `/learn/login`. Staff overview returns 401.

---

## 2. Audit scope and methodology

Inspected:

- All 33 `app/**/page.tsx` templates and all 27 `app/**/route.ts` files by path.
- Public HTTP GET of every static page, every Olympiad slug, both registered edition slugs, five legacy edition redirects, the student portal shell, one book route, one test route, sitemap, robots, the book-file API, the registration template, schema-status, and staff overview.
- Source search of the repository excluding `node_modules`, `.next`, and `package-lock.json`.
- Read-only production SQL (`BEGIN READ ONLY`) for counts and one privilege check. No row contents, emails, names, or secrets were selected.
- Screenshots of the production homepage at 1440×900 and 390×844, and of `/prepare/ebook`.

Not done, because the assignment forbids it:

- No form submit, login, logout, payment, registration, publication change, or test submission.
- No preview-environment write test. Preview isolation from production was not established.
- No change to RLS, grants, functions, or secrets.

A page returning HTTP 200 is recorded as reachable. It is not recorded as functionally complete unless the behaviour itself was observed.

### Counting method

Counts below are unique and not added together across categories.

- **Source line:** one matching line in a `.ts`, `.tsx`, `.md`, or `.json` file. A line that contains both “DHE English Olympiad” and “2.0” is counted once in each list and the overlap is stated.
- **Public page:** one URL that returned HTML containing the phrase in the document, including client payload. SVG path data that happens to contain the characters `2.0` is excluded.
- **Issue:** one defect in the final table. Eighteen dead resource links are one issue, not eighteen issues. The link count is stated inside that issue.
- **Historical:** a 2025 reference that names the first event correctly. These are listed for retention and are not defects.

---

## 3. Complete website route inventory

Page templates: 33. API route files: 27. Sitemap URLs: 33. The sitemap does not include `/schools/register`.

| Route | Title observed | Purpose | Branding | Dummy data | Old DHE name | Broken links | Working | Not working | Mobile | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | TEJAS — Talent Exploration for Junior Aspiring Scholars | Home | Header missing OLYMPIAD | No in hero; roadmap component is unused | Historical caption only | None in the header | Hero, stream dates, registration links | Header lockup | Pass at 390px for layout; lockup still wrong | Warning |
| `/about` | About TEJAS \| TEJAS | About | Header missing OLYMPIAD | Not verified in body | No in title | Not fully clicked | Page loads | — | Not verified | Warning |
| `/olympiads` | Olympiads \| TEJAS | Stream index | Header missing OLYMPIAD | Coming Soon subjects | Yes, English card | Not fully clicked | Page loads | Coming-soon subjects | Not verified | Warning |
| `/olympiads/english` | TEJAS English Olympiad — TEJAS \| TEJAS | English stream | Title duplicated; body still “DHE English Olympiad” | 2.0 calendar | Yes, current | Resource links inside the page use `#` | Page loads; Dec 10 is also stated | July/September 2.0 dates | Not verified | Fail |
| `/olympiads/mathematics` | TEJAS Mathematics Olympiad — TEJAS \| TEJAS | Mathematics | Same title pattern | Calendar uses old name | Yes, current | Same pattern | Page loads | Old product name | Not verified | Fail |
| `/olympiads/technology` | TEJAS Future Tech Olympiad — TEJAS \| TEJAS | Future Tech | Same title pattern | Calendar uses old name | Yes, current | Same pattern | Page loads | Old product name | Not verified | Fail |
| `/olympiads/science` | Science Olympiad — TEJAS \| TEJAS | Future subject | Coming Soon | Invented pattern | No | — | Honest coming-soon shell | Not a live Olympiad | Not verified | Warning |
| `/olympiads/hindi` | Hindi Olympiad — TEJAS \| TEJAS | Future subject | Coming Soon | Invented pattern | No | — | Shell loads | Not a live Olympiad | Not verified | Warning |
| `/olympiads/sanskrit` | Sanskrit Olympiad — TEJAS \| TEJAS | Future subject | Coming Soon | Invented pattern | No | — | Shell loads | Not a live Olympiad | Not verified | Warning |
| `/olympiads/general-knowledge` | General Knowledge Olympiad — TEJAS \| TEJAS | Future subject | Coming Soon | Invented pattern | No | — | Shell loads | Not a live Olympiad | Not verified | Warning |
| `/olympiads/ai` | AI & Data Science Olympiad — TEJAS \| TEJAS | Future subject | Coming Soon | Invented pattern | No | — | Shell loads | Not a live Olympiad | Not verified | Warning |
| `/olympiads/coding` | Coding Olympiad — TEJAS \| TEJAS | Future subject | Coming Soon | Invented pattern | No | — | Shell loads | Not a live Olympiad | Not verified | Warning |
| `/olympiads/innovation` | Innovation Olympiad — TEJAS \| TEJAS | Future subject | Coming Soon | Invented pattern | No | — | Shell loads | Not a live Olympiad | Not verified | Warning |
| `/editions` | Current Editions \| TEJAS | Current edition | Current card is TEJAS 2026–27 | Gallery “Coming Soon” | Historical 2025 card | None found | Current edition text | Gallery placeholder | Not verified | Warning |
| `/editions/previous` | Previous Editions \| TEJAS | Archive | Historical wording | No | Yes, correctly historical | — | Page loads | — | Not verified | Pass |
| `/editions/tejas-2026-27` | TEJAS Olympiad 2026–27 \| TEJAS | Current edition detail | Correct public name | No | Historical comparison only | — | Page loads | Code object is still named Kalam | Not verified | Warning |
| `/editions/dhe-english-2025` | 1st DHE English Olympiad \| TEJAS | 2025 archive | Correct historical name | No | Yes, retain | Report download may be `#` | Page loads | — | Not verified | Pass |
| `/editions/apj-abdul-kalam` | — | Legacy URL | Redirect | — | — | — | 307 to `/editions/tejas-2026-27` | Old slug still resolves | — | Warning |
| `/editions/savitribai-phule` | — | Unused future slug | 307 to `/editions` | Source object exists, not shown | No | — | Redirect works | — | — | Pass |
| `/editions/srinivasa-ramanujan` | — | Unused future slug | 307 to `/editions` | Source object exists, not shown | No | — | Redirect works | — | — | Pass |
| `/editions/kalpana-chawla` | — | Unused future slug | 307 to `/editions` | Source object exists, not shown | No | — | Redirect works | — | — | Pass |
| `/editions/rabindranath-tagore` | — | Unused future slug | 307 to `/editions` | Source object exists, not shown | No | — | Redirect works | — | — | Pass |
| `/prepare` | Prepare Hub \| TEJAS | Preparation marketing | “Netflix for Learning” | Yes, 65% and fake lists | Linked resources | Category links exist; resources do not | Page loads | Progress and counts are fabricated | Not verified beyond screenshot | Fail |
| `/prepare/mock-tests` | Mock Tests \| TEJAS | Points to the portal | Does not start a test | Subject cards include Coming Soon | English card | — | Honest “does not start a test” | Does not list the 10 published tests | Not verified | Warning |
| `/prepare/ebook` | E-book access \| TEJAS | Public explanation | Stale approval sentence | No | No | — | Link to `/learn` and school registration | Says books await approval | Desktop screenshot | Fail |
| `/resources` | Resources \| TEJAS | Resource list | Old workbook titles | Placeholder links | Yes | 18 cards use `#` | Page loads | No file opens | Not verified | Fail |
| `/schools` | For Schools \| TEJAS | School information | Current programme | Not flagged | No | — | Page loads | — | Not verified | Pass |
| `/schools/register` | School registration \| TEJAS | School form | Historical participation question, correctly | No | Historical question only | — | Form renders | Not submitted; persistence not re-tested | Not verified | Not verified |
| `/schools/register/review` | Registration review \| TEJAS | Staff review gate | Public sign-in form | No | No | — | Form renders, no records shown | Not signed in | Not verified | Not verified |
| `/schools/register/confirmation/[reference]` | — | Confirmation | — | — | — | — | Template exists | No reference was opened | — | Not verified |
| `/rankings` | Rankings \| TEJAS | Rankings | Honest unpublished state | No | No | — | Says 2026–27 ranks are not published | — | Not verified | Pass |
| `/scholarships` | Scholarships \| TEJAS | Scholarships | Honest unpublished amounts | No | No | — | Says amounts are not published | — | Not verified | Pass |
| `/hall-of-fame` | Hall of Fame \| TEJAS | 2025 winners | Historical names | Empty categories say Coming Soon | Historical | — | 2025 section loads | Future categories empty | Not verified | Warning |
| `/research` | Research \| TEJAS | Research | — | Not flagged as lorem | No | — | Page loads | Depth not reviewed line by line | Not verified | Not verified |
| `/innovation` | Innovation \| TEJAS | Innovation | Coming Soon path | Yes | No | Link to coming-soon Olympiad | Page loads | Not a live programme | Not verified | Warning |
| `/faq` | FAQ \| TEJAS | FAQ | Mix of current and 2025 | No | Historical answers, plus one current-looking “no negative marking” line | — | Page loads | — | Not verified | Warning |
| `/contact` | Contact \| TEJAS | Contact | Form disabled | “Coming Soon” is intentional Phase 0 | No visible 2.0 | — | Address block renders | Send is disabled | Not verified | Warning |
| `/beta` | Beta Feedback \| TEJAS | Feedback | Third-party form | No | No | — | Form is present | Delivery not tested; not submitted | Not verified | Not verified |
| `/learn` | E-book and mock tests \| TEJAS | Portal entry | तेजस without OLYMPIAD | No | No | — | 200, sign-in path | Catalogue behind login not opened | Not verified | Not verified |
| `/learn/login` | Student sign in \| TEJAS | Student login | Same header | No | No | — | Form renders | Not submitted | Not verified | Not verified |
| `/learn/register` | Student registration \| TEJAS | Student registration | Same header | No | No | — | Form renders | Not submitted | Not verified | Not verified |
| `/learn/dashboard` | — | Student home | — | — | — | — | 307 to `/learn/login` | Session not tested | — | Not verified |
| `/learn/account` | — | Account | — | — | — | — | 307 to `/learn/login` | — | — | Not verified |
| `/learn/pay` | — | Payment | — | — | — | — | 307 to `/learn/login` | — | — | Not verified |
| `/learn/books/ft-book-1` | — | Reader | — | — | — | — | 307 to `/learn/login` | Authorised reading not tested | — | Not verified |
| `/learn/tests/ft-b1-mt01` | — | Mock test | — | — | — | — | 307 to `/learn/login` | Attempt not tested | — | Not verified |
| `/learn/attempts/[attemptId]` | — | Result | — | — | — | — | Template exists | No attempt opened | — | Not verified |
| `/learn/staff` | E-book inventory \| TEJAS | Staff gate | Public sign-in form | No | No | — | Form renders, no inventory rows | Not signed in | Not verified | Not verified |
| `/sitemap.xml` | — | Sitemap | 33 URLs | — | Includes 2025 edition URL | Omits `/schools/register` | 200 | Incomplete | — | Warning |
| `/robots.txt` | — | Robots | Allows all, points at sitemap | — | — | — | 200 | — | — | Pass |
| `/api/learn/books/ft-book-1/file` | — | PDF bytes | — | — | — | — | 401 “Sign in to continue.” Body is not a PDF | Authorised fetch not tested | — | Pass for the unsigned gate |
| `/api/learn/staff/overview` | — | Staff data | — | — | — | — | 401 “Staff sign-in is required.” | — | — | Pass for the unsigned gate |
| `/api/register/schema-status` | — | Diagnostic | — | — | — | — | 200 without login | Discloses counts and schema | — | Fail |
| `/api/register/template` | — | School spreadsheet template | — | — | — | — | 200, xlsx content type | Contents not opened | — | Not verified |
| Other `/api/register/*` and `/api/learn/*` | — | Writes | — | — | — | — | Code reviewed only | Not called | — | Not verified |
| `/not-a-real-page` | Site default title | Unknown URL | — | — | — | — | 404 | — | — | Pass |

---

## 4. Current TEJAS branding audit

Official identity to check: TEJAS Olympiad 2026–27, Talent Exploration for Junior Aspiring Scholars. Streams: English III–X, Mathematics III–X, Future Tech VI–X. Organiser: Department of Holistic Education (DHE), Vidya Bharti Institute of Training & Research Trust (VBITR), Kurukshetra.

| Surface | Result |
|---|---|
| Homepage hero | Correct. Eyebrow reads TEJAS OLYMPIAD 2026–27. Body states the full form, the three streams, the class ranges, and DHE / VBITR / Kurukshetra. |
| Current edition `/editions/tejas-2026-27` | Public name is TEJAS Olympiad 2026–27. |
| Stream page titles | Browser titles start with TEJAS English, TEJAS Mathematics, and TEJAS Future Tech, then append “Olympiad — TEJAS \| TEJAS”. |
| Stream page body | Taglines still say DHE English Olympiad, DHE Maths Olympiad, and DHE Tech Olympiad. |
| Student and staff shells | Header uses तेजस. Page titles say student sign-in, registration, and e-book inventory. |
| Footer | English “TEJAS”, tagline “Find your spark...”, and the organiser address. Not the Hindi-plus-OLYMPIAD lockup. |
| Favicon and apple icon | `config/seo.ts` points both at `/brand/tejas-logo.jpg`. The seal image was not redesigned and was not replaced. |
| Colour tokens | `design-system/tokens.ts` matches the requested palette: navy `#1A2B5D`, navy dark `#101C40`, copper `#A3531C`, copper hover `#7C3A12`, gold `#DE9A26`, dark gold `#8A5A10`, background `#FBF8F3`, surface `#FFFFFF`, text `#1C1917`, muted `#57534E`, border `#E6E0D8`. |
| Header Hindi colour | Hardcoded `#C6530A` in `components/layout/TejasNavbar.tsx` line 64. That is not the copper token. |

---

## 5. Hindi “तेजस” + English “OLYMPIAD” header audit

Required lockup, wherever the official header shows the Hindi word:

```
तेजस
OLYMPIAD
```

A search for the exact capital word `OLYMPIAD` in source, excluding `package-lock.json`, returned **0 lines**.

| Location | What is shown | Source |
|---|---|---|
| Desktop header, 1440px homepage | Seal, then तेजस in saffron. Nothing underneath. | `components/layout/TejasNavbar.tsx` lines 64–65. The tagline span has `xl:hidden 2xl:block`, so it is hidden from 1280px until 1536px. |
| Mobile header, 390px homepage | Seal, तेजस, then “Find your spark...” | Same lines. `brand.tagline` is “Find your spark...”, not “OLYMPIAD”. |
| Footer | English TEJAS and the tagline. | `components/layout/TejasFooter.tsx` |
| Login, registration, student portal, staff portal | Same navbar component. | Shared layout |
| Homepage hero | “TEJAS OLYMPIAD 2026–27” appears in the page body, not under the Hindi word. | Home landing eyebrow |

Required correction, not applied: under `brand.nameHi` in `TejasNavbar.tsx`, render the word OLYMPIAD. Keep the seal file `public/brand/tejas-logo.jpg` and `components/brand/TejasEmblem.tsx` unchanged. Do not replace the logo image. The tagline can remain elsewhere on the page. The footer lockup should be decided in the same change so desktop, mobile, and footer match.

---

## 6. All DHE English Olympiad occurrences

36 source lines contain “DHE English Olympiad”. Two of those lines are the 2.0 calendar entries and are also listed in section 8. Public HTML of `/`, `/olympiads`, `/olympiads/english`, `/editions`, `/editions/previous`, `/editions/tejas-2026-27`, `/editions/dhe-english-2025`, `/prepare`, `/prepare/mock-tests`, `/resources`, `/schools/register`, and `/faq` contains the phrase. `/about`, portal pages, rankings, scholarships, research, innovation, contact, and beta did not contain it in the fetched HTML.

| Line | Exact text (shortened where the line is long) | Visible? | Class | Action |
|---|---|---|---|---|
| `features/home/HomeLanding.tsx:297` | Overall first places in the 1st DHE English Olympiad. These are not results for TEJAS 2026–27. | Yes, `/` | Historical, labelled | Retain |
| `app/editions/page.tsx:11` | metadata: record of the 1st DHE English Olympiad | Yes, description | Historical | Retain |
| `app/editions/previous/page.tsx:10` | Archive … including the 1st DHE English Olympiad (2025) | Yes | Historical | Retain |
| `app/editions/previous/page.tsx:20` | maiden DHE English Olympiad (10,040 students, 25 schools) | Yes | Historical | Retain |
| `content/current-cycle.ts:61` | comment: 1st DHE English Olympiad — past cycle | No | Historical | Retain |
| `content/current-cycle.ts:64` | “1st DHE English Olympiad” | Yes, where the past cycle is rendered | Historical | Retain |
| `content/editions/index.ts:13` | The first-ever DHE English Olympiad … 13–16 October 2025 | Yes, 2025 edition | Historical | Retain |
| `content/editions/index.ts:62` | resource title “DHE English Olympiad” | Yes, 2025 edition | Historical | Retain |
| `content/editions/index.ts:75` | Who organised the 1st DHE English Olympiad? | Yes, 2025 FAQ | Historical | Retain |
| `content/editions/index.ts:88` | 1st DHE English Olympiad — Brief Report | Yes, 2025 edition | Historical | Retain |
| `content/editions/index.ts:181` | The 1st DHE English Olympiad (2025) was under Shiksha Mahakumbh 5th Edition | Yes, current edition comparison | Historical | Retain |
| `content/hall-of-fame/index.ts:3` | comment: Real winners from 1st DHE English Olympiad | No | Historical | Retain |
| `content/olympiads/english.ts:152` | Partner resource for the 1st DHE English Olympiad | Yes, `/olympiads/english` | Historical | Retain |
| `content/olympiads/english.ts:157` | 1st DHE English Olympiad — Previous Year Collection | Yes | Historical | Retain |
| `content/olympiads/english.ts:204` | 1st DHE English Olympiad — All Levels | Yes | Historical | Retain |
| `content/olympiads/english.ts:257` | What was the 1st DHE English Olympiad? | Yes | Historical | Retain |
| `content/olympiads/english.ts:261` | The first-ever DHE English Olympiad was conducted 13–16 October 2025 | Yes | Historical | Retain |
| `content/olympiads/english.ts:346` | 1st DHE English Olympiad (Past) | Yes | Historical | Retain |
| `data/faq.ts:14` | The 1st DHE English Olympiad (2025) was conducted under Shiksha Mahakumbh 5th Edition | Yes, `/faq` | Historical | Retain |
| `data/faq.ts:18` | What was the 1st DHE English Olympiad? | Yes | Historical | Retain |
| `data/metrics.ts:3` | comment: Real metrics from 1st DHE English Olympiad | No | Historical | Retain |
| `data/resources.ts:57` | 1st DHE English Olympiad 2025 collection | Yes, `/prepare` category | Historical | Retain |
| `lib/registration/schema.ts:46` | PREVIOUS_OLYMPIAD_NAME = "1st DHE English Olympiad" | Yes, via the form | Historical | Retain |
| `lib/registration/school.ts:123` | validation: Say whether the school took part in the 1st DHE English Olympiad | On error only | Historical | Retain |
| `app/schools/register/school-registration-form.tsx:226` | Did the school take part in the 1st DHE English Olympiad (13–16 October 2025)? | Yes | Historical | Retain |
| `content/resources/index.ts:33` | 1st DHE English Olympiad — Brief Report, href `#` | Yes, `/resources` | Historical title, dead link | Retain the title; replace the link when a real file is approved |
| `content/olympiads/english.ts:8` | tagline: DHE English Olympiad — strengthening language fundamentals | Yes, current English page | Outdated for the current stream | Rename to TEJAS English Olympiad |
| `content/olympiads/english.ts:12` | The DHE English Olympiad strengthens vocabulary… | Yes | Outdated | Rename |
| `content/olympiads/english.ts:16` | TEJAS English is examined on 10 December 2026 … follows the 1st DHE English Olympiad | Yes | Mixed: first sentence current, second historical | Keep the 2025 clause; the December date is the one to trust |
| `content/olympiads/english.ts:139` | DHE English Olympiad Workbook — Level-wise | Yes | Current-looking product, old name | Rename when the product is confirmed; do not invent a file |
| `content/olympiads/english.ts:267` | When is the next DHE English Olympiad? | Yes | Current question, old name | Rename the question to TEJAS English |
| `content/olympiads/english.ts:361` | DHE English Olympiad 2.0 — Registration Opens | Yes | Outdated and contradicted | Remove from the current calendar |
| `content/olympiads/english.ts:366` | DHE English Olympiad 2.0 — Examination | Yes | Outdated and contradicted | Remove from the current calendar |
| `content/resources/index.ts:9` | DHE English Olympiad Workbook — All Levels, href `#` | Yes, `/resources` | Outdated name and dead link | Rename or remove until a real file exists |
| `data/faq.ts:38` | No negative marking in DHE English Olympiad | Yes, `/faq` | Ambiguous: sounds current | Investigate against the 2026–27 brochure before renaming |
| `content/editions/index.ts:56` | Established DHE Olympiad Cell's maiden school outreach | Yes, 2025 edition | Historical organisation | Retain |

Related current-stream lines that do not contain “DHE English Olympiad” are in sections 7 and 8.

---

## 7. All Dr APJ Abdul Kalam Edition occurrences

No crawled public HTML document contained “Kalam”. The current edition card and `/editions/tejas-2026-27` display **TEJAS Olympiad 2026–27**. The old edition is not a visible current card.

| Location | What remains | Visible? | Action |
|---|---|---|---|
| `content/editions/index.ts:105` | export `apjAbdulKalam2026Edition`; `name.en` is “TEJAS Olympiad 2026–27”; slug `tejas-2026-27` | The name is visible; the export name is not | Rename the identifier in a later code change. Do not change the public title. |
| `content/editions/index.ts:308` | registry entry uses that export | No | Same |
| `content/editions/index.ts:313` | slug `apj-abdul-kalam` is mapped to `tejas-2026-27` | No | Keep until old links are no longer needed |
| `content/editions/index.ts:322` | `getCurrentEditionContent` returns that object | Indirect | Same as the identifier |
| `next.config.ts:10` | temporary redirect `/editions/apj-abdul-kalam` → `/editions/tejas-2026-27` | The URL responds 307 | Keep the redirect so old links do not 404. Do not present Kalam as the current edition. |
| `docs/BACKEND_ARCHITECTURE.md:11` | example `apj-abdul-kalam-2026` | Docs only | Update when docs are next revised |
| `docs/LAUNCH_AUDIT_REPORT.md:44` | claims the Kalam URL returned 200 | Docs only, now false | The live check is 307. Update that old audit note later |

There is no remaining public string “Dr APJ Abdul Kalam Edition” or “Dr. APJ Abdul Kalam Edition” in the source files searched. The earlier instruction to take that edition off the current list is already true for visitors. Residual code and one redirect remain. Do not delete the 2025 historical edition while renaming this identifier.

---

## 8. All DHE English Olympiad 2.0 occurrences

Exact public phrase: **two lines**, both visible on `/olympiads/english`.

| Line | Text | Date in the same entry | Status in source | Action |
|---|---|---|---|---|
| `content/olympiads/english.ts:361` | DHE English Olympiad 2.0 — Registration Opens | 1 July 2026 | tba | Remove from the current calendar |
| `content/olympiads/english.ts:366` | DHE English Olympiad 2.0 — Examination | 1 September 2026 | tba | Remove from the current calendar |

`OlympiadPortal` renders `olympiad.calendar`, so both rows are on the public English page. The same page also says TEJAS English is examined on 10 December 2026. `content/current-cycle.ts` is the brochure source: registration 3–20 November 2026, Mathematics 9 December, English 10 December, Future Tech 11 December 2026.

No source line “DHE Olympiad 2.0” or “English Olympiad 2.0” was found apart from those two labels. A raw-HTML search hit on `/schools/register` was an SVG path (`1-2.06`), not page copy. `/contact` does not show 2.0; its visible phrase is “Phase 0”.

Other old product names on current pages:

| Line | Text | Route | Action |
|---|---|---|---|
| `content/olympiads/mathematics.ts:8` | DHE Maths Olympiad — logical reasoning… | `/olympiads/mathematics` | Rename to TEJAS Mathematics |
| `content/olympiads/mathematics.ts:16` | The DHE Maths Olympiad identifies… | same | Rename |
| `content/olympiads/mathematics.ts:130` | DHE Maths Olympiad Workbook | same | Rename or remove until a file exists |
| `content/olympiads/mathematics.ts:204` | When is the DHE Maths Olympiad? | same | Rename |
| `content/olympiads/mathematics.ts:260` | DHE Maths Olympiad — Examination | same | Rename; keep the official date if that entry is the December exam |
| `content/olympiads/technology.ts:8` | DHE Tech Olympiad — digital literacy… | `/olympiads/technology` | Rename to TEJAS Future Tech |
| `content/olympiads/technology.ts:119` | DHE Tech Olympiad Guide | same | Rename |
| `content/olympiads/technology.ts:195` | When is the DHE Tech Olympiad? | same | Rename |
| `content/olympiads/technology.ts:236` | DHE Tech Olympiad — Examination | same | Rename |
| `content/resources/index.ts:10` | DHE Maths Olympiad Workbook, href `#` | `/resources` | Dead link and old name |
| `content/resources/index.ts:27` | Teacher's Guide — DHE Olympiads, href `#` | `/resources` | Dead link; “DHE Olympiads” is the old umbrella |
| `components/shared/TrustBanner.tsx:9` | DHE Olympiad Cell / Official platform | Shared | Investigate. The cell is the historical organiser of 2025. “Official platform” should name TEJAS. |
| `config/seo.ts:66` | keyword “DHE Olympiads” | Metadata | Replace with TEJAS Olympiad for current SEO |

---

## 9. Historical 2025 content that must be retained

Do not rewrite these as if the 2025 event had been called TEJAS.

- Name: **1st DHE English Olympiad**.
- Dates: 13–16 October 2025.
- Figures already published on the site: 10,040+ students, 25 schools, Punjab, Haryana, and Chandigarh, Classes I–X, Shiksha Mahakumbh 5th Edition.
- Edition page `/editions/dhe-english-2025` and the previous-editions archive.
- Hall of Fame 2025 names. The source comment says they come from the PDF report. This audit did not re-open that PDF, so the names are treated as historical records, not as dummy text.
- Homepage caption that those first places are not TEJAS 2026–27 results.
- School registration question: whether the school took part in the 1st DHE English Olympiad on 13–16 October 2025.
- FAQ answers that distinguish the 5th Edition (2025) from TEJAS 2026–27 in the 6th Edition.
- Previous-year collection titles that are explicitly “1st” or “Past”.

The homepage “TEJAS at a glance” caption says the figures are published programme facts for 2026–27 and that a count of schools or students for this cycle has not been published. That sentence is honest and should stay.

---

## 10. Dummy data and placeholder audit

| Finding | Where | Visible | Genuine or dummy | Risk | Action |
|---|---|---|---|---|---|
| “65% complete” for Mathematics Mock, Science Practice, English Comprehension | `app/prepare/page.tsx` lines 17–40; live text on `/prepare` | Yes | Dummy. No learner progress is loaded. | High. Looks like a real dashboard. | Remove the block until a signed-in learner has real progress. |
| “Netflix for Learning” | `app/prepare/page.tsx` | Yes | Marketing metaphor, not a product fact | Medium | Replace with a plain description of what the portal actually offers. |
| Trending and Recommended titles (Grade 10 Full Test, Innovation Track, Coding Logic Set, and the trending list) | `app/prepare/page.tsx` | Yes | Fabricated | High | Remove until real items exist. |
| Category counts 6+, 24+, 8+, 500+, 5+, 6+ | `data/resources.ts` lines 21–68, rendered on `/prepare` | Yes | The 5+ previous papers point at a real 2025 edition. The other counts do not match the portal (10 published Future Tech tests, 0 question rows). | High | Delete the counts or replace them with counts taken from published items. |
| 18 resource cards with `href: "#"` | `content/resources/index.ts` | Yes, `/resources` and Olympiad resource blocks | Placeholder links, including “500+ MCQs” and “Sample Participation Certificate” | High | Do not present a card as a download until a file exists. |
| Seven coming-soon Olympiads generated with a 50-question pattern | `content/olympiads/coming-soon.ts`, routes under `/olympiads/` | Yes | Intentional future subjects, but the pattern is invented | Medium | Keep Coming Soon. Remove invented paper structure. |
| Edition gallery “Coming Soon” | `/editions` | Yes | Intentional empty gallery | Low | Leave, or hide the card. |
| Contact form disabled, “Send Message — Coming Soon”, “Phase 0” | `app/contact/page.tsx` | Yes | Intentional | Medium | Keep it disabled. Say that messages are not received, which it already does. |
| Search box disabled, “Search coming soon” | `components/shared/SearchBox.tsx` | On viewports that show it | Intentional | Low | Leave disabled. |
| Innovation “Coming Soon” | `/innovation` | Yes | Intentional | Low | Do not imply a live innovation Olympiad. |
| Hall of Fame empty categories | `/hall-of-fame` | Yes | Intentional empty state | Low | Keep. |
| Rankings and scholarships | `/rankings`, `/scholarships` | Yes | Honest unpublished state, not dummy winners | None | Keep. |
| Homepage roadmap “Coming Soon” cards, including Student Dashboard | `features/home/FutureModulesSection.tsx` | **Not mounted.** No import of this component was found. | Unused | Low | Do not mount it. Student Dashboard, rankings, and scholarships already have pages. |
| Certificate preview for a 2025 name | Hall of Fame | Yes | Generated card for a historical winner, not a fake person | Low | Keep the name as history. Label the card as a preview if it is not the original certificate. |
| Lorem ipsum | Repository search | No public lorem found in the pages crawled | — | — | None. |

---

## 11. Broken links and navigation issues

- **18 resource cards** use `href: "#"`. `ResourceCard` renders a Next.js `Link`, so the control looks active and stays on the same page. Confirmed in `content/resources/index.ts` (18 matches) and on the live `/resources` HTML, which contains the old workbook titles.
- **Sitemap** (`app/sitemap.ts`) emits 33 URLs and omits `/schools/register`, which is a primary conversion page. Footer and header do link to it. Confirmed by fetching `/sitemap.xml`.
- **Legacy edition URLs** redirect as configured in `next.config.ts`: Kalam to the current edition (307, not permanent), and four named future slugs to `/editions`. These are intentional, not broken.
- **External** DHE and Shiksha Mahakumbh links in the footer were not opened in this audit. Status: Not verified.
- **Student Dashboard** is not in the header. The header “E-book” control goes to `/learn`, and the account icon goes to `/learn/login`. That part works as a link. The unused roadmap still describes a student dashboard as future work.

---

## 12. Non-working buttons and actions

| Control | Result |
|---|---|
| Register Now, Register Your School, Explore Olympiads | Navigate. School form was not submitted. |
| Header E-book and account icon | Go to `/learn` and `/learn/login`. |
| Resource cards and in-page resource links with `#` | Do not download. |
| Search | Disabled. |
| Contact “Send Message” | Disabled. |
| Coming-soon Olympiad actions | Pages load and announce Coming Soon. They do not open registration. |
| Prepare “Start Mock Test” | Goes to the mock-test information page, which states that it does not start a test and links to `/learn`. |
| Beta feedback submit | The client posts to `https://formsubmit.co/ajax/tejas@dhe.org.in` (`app/beta/BetaPageClient.tsx`). Not submitted. Delivery is Not verified. |
| Student sign-in, student registration, staff recovery, registration review | Forms render. None were submitted. |

---

## 13. Registration system audit

Code path, not executed in this audit:

- School form: `app/schools/register/school-registration-form.tsx`.
- Validation: `lib/registration/school.ts` and `lib/registration/schema.ts`.
- Submit route: `app/api/register/submit/route.ts`.
- The historical participation question is required and correctly named.
- Fee figures in `content/current-cycle.ts` remain the approved brochure figures (school registration and optional printed books). This audit did not recalculate them and did not submit a registration.

Production already contains data from earlier real use. Read-only counts at audit time: `tejas_registrations` 2, `tejas_schools` 2, `tejas_payments` 2, `tejas_book_orders` 2, `tejas_principals` 2, `tejas_coordinators` 2. This audit did not insert or update any of those rows. Whether a new submission today would persist was **not** re-tested.

The review page `/schools/register/review` is public and shows a staff sign-in form. It did not show registration records while signed out.

---

## 14. Student portal audit

| Check | Result |
|---|---|
| `/learn`, `/learn/login`, `/learn/register` | HTTP 200 |
| `/learn/dashboard`, `/learn/account`, `/learn/pay` | 307 to `/learn/login` |
| Login, registration, logout, session cookie, one-device rule, session expiry | Code exists from the deployed login fix. **Not verified** in this audit because signing in was forbidden. |
| Wrong-class and unpaid gates | Enforced in `decideAccess` in code. Not re-run against production with a student. |
| Production students | Read-only count: 3 students, 2 entitlements, 1 of those entitlements verified. No names or emails were read. Counts were not changed. |
| One-device session versions | Not read in this audit, to avoid touching session rows. |

---

## 15. E-book reader audit

| Check | Result |
|---|---|
| Public copy on `/prepare/ebook` | Says Book 1 and Book 2 are awaiting organisational approval. **This is false against the publication table.** English and Mathematics files are still described as not supplied, which matches the catalog. |
| `/learn/books/ft-book-1` unsigned | 307 to `/learn/login`. No PDF in the response. |
| `/api/learn/books/ft-book-1/file` unsigned | 401 JSON “Sign in to continue.” Body does not start with `%PDF`. |
| Reader implementation on the deployed commit | In-app PDF.js canvas, no iframe, no blob URL, toolbar is previous, next, and zoom. Download, print, and Google Drive controls are not part of that toolbar. |
| Authorised production reading, page turns, zoom, and mobile reader | **Not verified.** No student was signed in. |
| Direct URL protection | Unsigned requests are rejected. An entitled browser still receives PDF bytes so pages can be drawn. Screenshots and a saved authenticated response cannot be prevented. That limitation stands. |
| Publication | 12 rows, all `published`. Catalog ids remain the two Future Tech books and ten mock tests. |

---

## 16. Mock test audit

| Check | Result |
|---|---|
| Public `/prepare/mock-tests` | Says the page does not start a test and points to `/learn`. It lists Olympiad subjects, including Coming Soon subjects. It does not list the 10 Future Tech tests. |
| `/learn/tests/ft-b1-mt01` unsigned | 307 to `/learn/login`. |
| Questions | `tejas_learn_questions` count is 0. `tejas_learn_options` count is 0. Questions used by the portal are in `content/portal/catalog.json`, not in those tables. |
| Tests | `tejas_learn_tests` count is 10. `tejas_learn_books` count is 2. `tejas_learn_book_classes` count is 5. |
| Attempts | `tejas_learn_attempts` count is 1. This audit did not open or submit an attempt. |
| Submit route | `app/api/learn/tests/[testId]/submit/route.ts` exists. Not called. |
| Class mapping and scoring | Code-reviewed in earlier work. **Not verified** on production in this audit. |

The prepare hub’s “6+ mock tests” does not match the 10 published Future Tech tests, and it also does not match the public mock-test page, which starts nothing.

---

## 17. Staff portal audit

`/learn/staff` returns 200 and shows the sign-in form, including a recovery-token field. The page text says a recovery token still opens the page while individual staff accounts do not exist. It does not reveal the token. No inventory, student, or payment row was shown while signed out.

`/api/learn/staff/overview` returns 401 “Staff sign-in is required.”

Read-only counts: `tejas_learn_staff` 0, `tejas_staff_sessions` 1, `tejas_admin_users` 0. The session count means a staff session row exists. This audit did not read who it belongs to and did not use it.

Publication, payment verification, correction, export, and audit-log screens were **not** opened.

---

## 18. API and database integration audit

Read-only SQL (`BEGIN READ ONLY` / `COMMIT`) and the public schema-status response agree on the main counts.

| Object | Count | Note |
|---|---|---|
| tejas_learn_students | 3 | No personal columns were selected |
| tejas_learn_entitlements | 2 | 1 verified, from SQL |
| tejas_learn_publication | 12 | All 12 published |
| tejas_payments | 2 | |
| tejas_registrations | 2 | |
| tejas_schools | 2 | |
| tejas_learn_questions | 0 | Portal questions are in the catalog file |
| tejas_learn_staff | 0 | |
| tejas_learn_attempts | 1 | Not opened |
| tejas_audit_logs | 11 | Not opened |
| tejas_learn_audit | 19 | Not opened |

`has_table_privilege('anon','tejas_learn_students','SELECT')` is false.

Schema-status client probes report REST 200 with row count 0 for the anon and publishable keys, and OpenAPI 401. That is consistent with anon not being able to read school rows. Storage buckets `tejas-payment-proofs` and `tejas-registration-files` are reported `public: false`.

Write APIs (register submit, payment, learn register, learn login, test submit, staff publication) were not called. Their existence in `app/api` is confirmed. Success responses were not observed in this audit.

---

## 19. Security and access-control observations

- Unsigned book file, staff overview, and portal interiors fail closed (401 or redirect to login).
- Anon has no SELECT on `tejas_learn_students`.
- **`/api/register/schema-status` is unauthenticated** and returns table inventory, some column lists, bucket ids and size limits, which server environment-variable names are present (booleans only), and row counts for students, payments, coordinators, principals, audit logs, and attempts. No secret value, email, or student name was present in the fields reviewed. The endpoint is still an information disclosure and should not be public.
- The registration template xlsx is public. That is consistent with a school download. The file was not opened.
- Staff and registration-review pages disclose that a recovery token can open them. They do not disclose the token.
- This audit did not change grants, RLS, policies, or functions. It did not re-read policy definitions.

---

## 20. Mobile and responsive design audit

Checked in a browser at 1440×900 and 390×844 on the homepage, and at 1280px on `/prepare/ebook`.

| Check | 1440px | 390px |
|---|---|---|
| Header shows तेजस | Yes | Yes |
| OLYMPIAD under तेजस | No | No |
| Tagline under तेजस | Hidden, because of `xl:hidden 2xl:block` | “Find your spark...” is visible and readable |
| Navigation | Full links fit | Collapses to a menu button. The menu was not opened, so item overflow inside the drawer is Not verified. |
| Hero and stream cards | Fit | Stack. English, Mathematics, and Future Tech cards remain readable. |
| Footer on the e-book page | Columns fit at 1280px | Not separately captured |
| Forms, tables, reader, mock test | Not verified on a phone | Not verified |

No overlapping header text was seen at these two widths. The branding failure is missing text, not a collision.

---

## 21. SEO and metadata audit

- Default title and description in `config/seo.ts` describe TEJAS and the full form. That part is current.
- Keywords include “DHE Olympiads” (`config/seo.ts` line 66). That is outdated for the current programme.
- Olympiad titles are built as `` `${name.en} Olympiad — TEJAS` `` and `createMetadata` appends ` | TEJAS`. Live title: “TEJAS English Olympiad — TEJAS | TEJAS”. Same pattern for Mathematics and Future Tech. Source: `app/olympiads/[slug]/page.tsx` lines 21–22.
- Edition metadata on `/editions` still mentions the 1st DHE English Olympiad. That is appropriate.
- `/editions/apj-abdul-kalam` redirects. A temporary redirect can remain in search indexes until it is replaced with a permanent one after the team is sure no Kalam branding should return.
- Sitemap omits `/schools/register` and the portal. Omitting the portal is reasonable. Omitting school registration is not.
- `app/robots.ts` allows all and points at the sitemap.
- Structured data is emitted on Olympiad pages (`courseJsonLd`, `faqJsonLd`). The English FAQ JSON-LD will include the old “next DHE English Olympiad” question and the 2.0 calendar is separate from FAQ. The visible calendar is the larger problem.
- No Kalam text was found in the fetched page titles.

---

## 22. Performance and error observations

- The crawled public pages returned in one pass without a 5xx.
- Unknown path `/not-a-real-page` returns 404 with the site title.
- Schema-status reports `"ok": true` and commit `fb64ed3c910b`, which matches the deployed reader merge.
- No performance budget was measured. No Core Web Vitals run was done.
- `npx tsc --noEmit` was not re-run for this audit. A previous check on this commit family still failed only on four existing `NODE_ENV` assignments in `lib/portal/portal.test.ts`. `next build` was already succeeding. Those type errors are not a production outage.

---

## 23. Critical issues

1. **AUD-01.** `/prepare` presents fabricated learner progress, trending items, recommendations, and category counts.
2. **AUD-02.** `/olympiads/english` publishes DHE English Olympiad 2.0 dates in July and September 2026 that contradict the official November registration and 10 December examination.

---

## 24. High-priority issues

3. **AUD-03.** Header never shows OLYMPIAD under तेजस.
4. **AUD-04.** Current English, Mathematics, and Future Tech pages still describe the live streams with DHE English, DHE Maths, and DHE Tech names.
5. **AUD-05.** Eighteen resource cards are dead `#` links, several with old product names.
6. **AUD-06.** `/prepare/ebook` says the Future Tech books await approval while all 12 publication rows are published.
7. **AUD-07.** `/api/register/schema-status` is public and discloses operational counts and schema.

---

## 25. Medium-priority issues

8. **AUD-08.** Hindi word colour is `#C6530A`, not copper `#A3531C`, and the tagline is hidden on typical desktop widths.
9. **AUD-09.** Search is disabled.
10. **AUD-10.** Contact form is disabled.
11. **AUD-11.** Seven coming-soon subjects expose an invented 50-question pattern.
12. **AUD-12.** Sitemap omits `/schools/register`.
13. **AUD-13.** Stream page titles duplicate “TEJAS”.
14. **AUD-14.** Beta feedback depends on formsubmit.co. Delivery was not tested.
15. **AUD-15.** Kalam remains as a code identifier and a 307 redirect, not as a visible edition.

---

## 26. Low-priority issues

16. **AUD-16.** SEO keyword “DHE Olympiads”.
17. **AUD-17.** Footer lockup is English TEJAS plus tagline.
18. **AUD-18.** Trust banner says “DHE Olympiad Cell / Official platform”.
19. **AUD-19.** Four unused future edition objects remain in source; their URLs redirect away.
20. **AUD-20.** Unused `FutureModulesSection` would mark the student dashboard, rankings, and scholarships as Coming Soon if it were mounted.
21. **AUD-21.** `docs/LAUNCH_AUDIT_REPORT.md` still says the Kalam URL returned 200.
22. **AUD-22.** Edition gallery and Hall of Fame empty states say Coming Soon. These are intentional.
23. **AUD-23.** FAQ line “No negative marking in DHE English Olympiad” needs a brochure check before it is rewritten.
24. **AUD-24.** Staff and review pages mention a recovery token. They do not reveal it.

---

## 27. Not verified / blocked items

Blocked because a production write or a sign-in was not allowed, and preview isolation was not proven:

- School registration submit, payment proof upload, and confirmation page for a new reference.
- Student registration, login, logout, one-device rejection, and session expiry.
- Entitled e-book reading, zoom, page turns, and mobile reader on production.
- Mock-test load, answer selection, submit, score, and retake on production.
- Staff publication, payment verification, correction, CSV export, and audit log screens.
- Beta form delivery.
- External footer links.
- Full mobile pass of every page and the opened mobile menu.
- Whether the single existing mock attempt and staff session are healthy. They were counted only.

Code for those flows exists and unsigned visitors are turned away. That is not evidence that a signed-in visitor succeeds.

---

## 28. Recommended correction plan

Do not start this plan from the audit. Each phase needs its own approval.

1. **Stop the contradictions.** Remove the two 2.0 calendar rows. Remove the prepare-hub progress, trending, recommended, and invented counts. Rewrite `/prepare/ebook` so it matches the published Future Tech items and still says English and Mathematics files are not supplied.
2. **Header.** Put OLYMPIAD under तेजस in `TejasNavbar.tsx` on desktop and mobile. Use the copper token or an explicit approved saffron. Do not replace the seal. Align the footer in the same change.
3. **Current names.** Rename live stream taglines, FAQs, and calendars from DHE English / Maths / Tech to TEJAS English, TEJAS Mathematics, and TEJAS Future Tech. Leave every “1st DHE English Olympiad (2025)” line as it is.
4. **Resources.** Remove or disable cards whose `href` is `#`. Keep historical report titles only when a real file is attached.
5. **Access.** Require a staff session for `/api/register/schema-status`, or remove the public route. Do not change RLS while doing that until a separate review.
6. **SEO.** Fix the double “TEJAS” title, add `/schools/register` to the sitemap, and replace the “DHE Olympiads” keyword.
7. **Owner verification.** After those content fixes, the owner signs in with an existing student and confirms reading and a mock test. This audit must not create that session.

---

## 29. Final audit statistics

| Measure | Count | How it was counted |
|---|---|---|
| Page templates | 33 | `app/**/page.tsx` |
| API route files | 27 | `app/**/route.ts` |
| Public URL checks | 52 | The inventory rows that were fetched, including redirects, sitemap, robots, three APIs, and one 404 |
| Routes returning a normal page (200 HTML) | 36 | Fetched pages, not counting redirects |
| Redirects confirmed | 10 | Five legacy edition URLs, plus `/learn/dashboard`, `/learn/account`, `/learn/pay`, `/learn/books/ft-book-1`, and `/learn/tests/ft-b1-mt01` |
| Sitemap URLs | 33 | `<loc>` count |
| Routes with outdated current branding | 6 | English, Mathematics, Future Tech, resources, prepare (via linked copy), and the shared header on every page. Header is one shared defect, not 36 page defects. |
| DHE English Olympiad source lines | 36 | One line each, listed in section 6 |
| Of those, historical lines to retain | 27 | Including the 2025 report card whose link is `#` |
| Of those, current lines to rename | 7 | Tagline, description, workbook, “next” FAQ, two 2.0 rows, and the resources workbook |
| Mixed current-and-historical line | 1 | `content/olympiads/english.ts:16` states 10 December 2026 and then the 2025 event |
| Ambiguous FAQ line | 1 | `data/faq.ts:38` |
| Dr APJ Abdul Kalam source hits | 7 | Identifier, registry, slug map, getter, redirect, two docs. Zero visible “Dr APJ Abdul Kalam Edition” strings. |
| DHE English Olympiad 2.0 lines | 2 | Both public |
| DHE Maths Olympiad lines | 6 | Five in `mathematics.ts`, one resource |
| DHE Tech Olympiad lines | 4 | All in `technology.ts` |
| Broader “DHE Olympiad” lines | 5 | Cell contribution, trust banner, SEO keyword, previous-editions metadata, teacher-guide title |
| Legitimate historical references | 27 | The retain rows in section 6. Hall of Fame winner records sit under that heading and are not extra copies of the phrase. |
| Dummy or placeholder groups | 9 | Prepare progress, prepare lists, prepare counts, 18 dead resources, 7 coming-soon patterns, edition gallery, contact, search, innovation |
| Dead resource links | 18 | `href: "#"` in `content/resources/index.ts` |
| Non-working buttons | 4 groups | Resource links, search, contact send, coming-soon actions. Navigation buttons that only route were not counted as broken. |
| Non-working forms | 1 confirmed | Contact form, intentionally disabled. School, student, staff, and beta forms were not submitted and are Not verified, not failed. |
| API issues confirmed | 1 | Public schema-status. Unsigned portal APIs that return 401 are working gates, not issues. |
| Database concerns | 2 | Questions not in `tejas_learn_questions` (by design of the catalog), and schema-status exposing counts. Grants for anon on students are off. |
| Confirmed working | 8 | Homepage identity text; 2025 archive still named correctly; unsigned book and staff gates; portal interiors redirect to login; rankings and scholarships say results are unpublished; Kalam URL redirects and is not a visible edition; anon cannot select students; publication count 12 published. |
| Not verified feature groups | 8 | School submit, student auth, entitled reader, mock attempt, staff actions, beta delivery, external links, full mobile pass |
| Critical issues | 2 | AUD-01, AUD-02 |
| High | 5 | AUD-03 through AUD-07 |
| Medium | 8 | AUD-08 through AUD-15 |
| Low | 9 | AUD-16 through AUD-24 |

Redirect arithmetic used in the table: 10 confirmed 307 responses (5 legacy editions, `/learn/dashboard`, `/learn/account`, `/learn/pay`, `/learn/books/ft-book-1`, `/learn/tests/ft-b1-mt01`).

---

## Final issue table

| ID | Severity | Category | Page/Route | Exact issue | File and line | Evidence | Recommended action |
|---|---|---|---|---|---|---|---|
| AUD-01 | Critical | Dummy data | `/prepare` | Progress at 65%, trending list, recommended list, and category counts are hardcoded | `app/prepare/page.tsx` 17–40; `data/resources.ts` 21–68 | Live text contains “65% complete” and “Netflix for Learning” | Remove until real data exists |
| AUD-02 | Critical | Outdated branding | `/olympiads/english` | Calendar shows DHE English Olympiad 2.0 on 1 July and 1 September 2026 | `content/olympiads/english.ts` 361 and 366 | Live text shows both rows as TBA; official cycle is November and 10 December | Delete these two calendar rows |
| AUD-03 | High | Branding | Every page using the navbar | तेजस has no OLYMPIAD underneath | `components/layout/TejasNavbar.tsx` 64–65 | Desktop and mobile screenshots; zero source matches for OLYMPIAD | Add the word under the Hindi name. Do not change the seal |
| AUD-04 | High | Outdated branding | `/olympiads/english`, `/olympiads/mathematics`, `/olympiads/technology` | Live streams are still introduced as DHE English, DHE Maths, and DHE Tech Olympiad | `content/olympiads/english.ts` 8, 12; `mathematics.ts` 8, 16; `technology.ts` 8 | Those strings are in the public HTML | Rename current copy. Keep 2025 lines |
| AUD-05 | High | Broken links | `/resources` | 18 cards use `href: "#"` and several use old workbook names | `content/resources/index.ts` 9, 10, 27, 33 and 14 other `#` lines | Live HTML contains the workbook titles | Remove the cards or attach real files |
| AUD-06 | High | Contradiction | `/prepare/ebook` | Says Future Tech books await approval | `app/prepare/ebook/page.tsx` 22 | Screenshot; publication table has 12 published rows | State that published Future Tech items open from the portal |
| AUD-07 | High | Security | `/api/register/schema-status` | Unauthenticated schema, bucket, env-name presence, and row counts | Route under `app/api/register/schema-status` | HTTP 200 JSON with counts and no personal rows in the fields reviewed | Require staff auth or remove the route |
| AUD-08 | Medium | Branding | Header | Hindi colour `#C6530A`; tagline hidden from `xl` to `2xl` | `TejasNavbar.tsx` 64–65 | Token copper is `#A3531C`; desktop screenshot has no tagline | Use the approved colour and show the lockup at desktop width |
| AUD-09 | Medium | Placeholder | Header search | Search is disabled | `components/shared/SearchBox.tsx` | Control is disabled | Leave disabled until search exists |
| AUD-10 | Medium | Placeholder | `/contact` | Send is disabled and labelled Coming Soon | `app/contact/page.tsx` | Live text “Form submission is disabled in Phase 0” | Keep disabled; do not imply messages are delivered |
| AUD-11 | Medium | Dummy data | `/olympiads/science` and six sibling slugs | Coming-soon subjects include an invented 50-question pattern | `content/olympiads/coming-soon.ts` | Pages return 200 and contain Coming Soon | Keep the status; remove invented paper details |
| AUD-12 | Medium | SEO | `/sitemap.xml` | School registration is absent | `app/sitemap.ts` | 33 locs, string `/schools/register` absent | Add the URL |
| AUD-13 | Medium | SEO | Olympiad detail pages | Title becomes “TEJAS English Olympiad — TEJAS \| TEJAS” | `app/olympiads/[slug]/page.tsx` 21 | Live `<title>` | Pass a title that does not already end in TEJAS |
| AUD-14 | Medium | Form | `/beta` | Submit posts to formsubmit.co | `app/beta/BetaPageClient.tsx` | Code path; not submitted | Confirm the owner wants this third party, then test |
| AUD-15 | Medium | Branding | `/editions/apj-abdul-kalam` | Old slug and `apjAbdulKalam2026Edition` remain; public name is already TEJAS | `next.config.ts` 10; `content/editions/index.ts` 105 | 307; no “Kalam” in page HTML | Keep the redirect; rename the identifier later |
| AUD-16 | Low | SEO | Sitewide metadata | Keyword “DHE Olympiads” | `config/seo.ts` 66 | Source | Replace for current pages |
| AUD-17 | Low | Branding | Footer | English TEJAS and tagline, not तेजस / OLYMPIAD | `components/layout/TejasFooter.tsx` | Screenshot | Match the header lockup when the header is fixed |
| AUD-18 | Low | Branding | Trust strip | “DHE Olympiad Cell / Official platform” | `components/shared/TrustBanner.tsx` 9 | Source, rendered on pages that include it | Name TEJAS as the platform; keep the cell only as history |
| AUD-19 | Low | Unused content | Edition source | Phule, Ramanujan, Chawla, and Tagore objects exist and their URLs redirect | `content/editions/index.ts`; `next.config.ts` | Each URL 307 to `/editions` | Leave unlisted |
| AUD-20 | Low | Unused code | Not routed | Future modules mark a student dashboard as coming soon | `features/home/FutureModulesSection.tsx` 21–31 | No component import | Do not mount it |
| AUD-21 | Low | Docs | Not a public page | Launch audit claims Kalam URL returned 200 | `docs/LAUNCH_AUDIT_REPORT.md` 44 | Live response is 307 | Correct the old note later |
| AUD-22 | Low | Placeholder | `/editions`, `/hall-of-fame` | Intentional Coming Soon for an empty gallery and empty winner groups | Page source | Live text | Keep |
| AUD-23 | Low | Content | `/faq` | “No negative marking in DHE English Olympiad” may be read as a current rule | `data/faq.ts` 38 | Live FAQ HTML contains the phrase | Check the 2026–27 brochure before editing |
| AUD-24 | Low | Security copy | `/learn/staff`, `/schools/register/review` | Pages say a recovery token opens them | Staff and review page source | Live text; token value not present | Acceptable only while the token stays secret |

---

## What this audit did not change

The audit itself did not change the application, the database, or Production. The later remediation is recorded below and in `docs/TEJAS_WEBSITE_REMEDIATION_REPORT.md`.

## Remediation update — 14 November 2026

The findings in this report were rechecked on `main` at `fb64ed3c910b` and were still present. Corrections were made on branch `cursor/website-remediation-2878`. Production was not deployed and no Production database row was written.

Corrected in code, and confirmed on a local production build:

- The header now shows तेजस in `#C6530A` with `OLYMPIAD` directly underneath at 1440px, 768px, and 390px. The seal file was not changed.
- The English, Mathematics, and Future Tech calendars use 3–20 November 2026 and the examinations on 10, 9, and 11 December 2026. The two “DHE English Olympiad 2.0” rows are gone. 2025 history remains under its original name.
- `/prepare` no longer shows 65% progress, trending items, recommendations, or invented counts.
- The 18 `href: "#"` resource cards were removed. The resources page links only to pages that exist, plus the Shiksha Mahakumbh site.
- `/prepare/ebook` reads publication status through the existing portal store on each request. It does not hard-code “awaiting approval”.
- `/api/register/schema-status` returns 401 without a valid staff session. A local staff session receives the diagnostic. Tests cover unsigned, forged, and signed requests.
- The current edition identifier is `tejas2026Edition`. `/editions/apj-abdul-kalam` still redirects to `/editions/tejas-2026-27` and is not listed as an edition.

Still unresolved, and not marked as working:

- No Production student, payment, registration, or staff action was performed. Login, one-device restriction, entitled reading, mock submission, and staff publication remain unverified on Production.
- The local server used for layout checks has no Supabase connection, so `/prepare/ebook` says the publication status could not be read. That is the fail-closed message. The live Production sentence was not observed because this branch was not deployed.
- Contact send and search remain intentionally disabled. The beta form still posts to a third party and was not submitted.
- A phone-width check was completed for the header at 390px. Every other route was not opened at mobile width.
- `features/home/FutureModulesSection.tsx` is still unused and its data still contains `href: "#"`. It is not mounted.
- Numeric exam-pattern objects remain in the Olympiad content files and are not rendered.

## Further correction — 14 November 2026, afternoon IST

A second pass on the same branch corrected the items that were still safe to change. The evidence is in `docs/TEJAS_WEBSITE_QA_REPORT.md`. Production was still serving the earlier pages at the time of a read-only comparison: `/prepare` contained “65%”, `/olympiads/english` contained “2.0”, and `/learn` said the Future Tech books stay unpublished. This branch was not deployed.

Corrected and checked on a local production server:

- `/learn` reads the same publication summary as `/prepare/ebook`. With no database configured, both say the status could not be read.
- `/beta` no longer posts to formsubmit.co. It tells the visitor to write to tejas@dhe.org.in.
- `/contact` no longer says “Phase 0” or “Coming Soon” on the send button. The form still does not send mail.
- Search is disabled and its label says “Search is not available”.
- The unused roadmap data no longer uses `href: "#"`. The section stays unmounted.
- `/about` no longer lists authentication and registration as planned, and it no longer links to a GitHub document in another account.
- `/olympiads/future-tech` redirects to `/olympiads/technology`.
- The Sanskrit page no longer uses the name “DHE Sanskriti Olympiad”.
- Olympiad pages no longer hydrate a countdown or a locale-dependent date. The previous-editions page no longer nests one link inside another.
- `npx tsc --noEmit` completes with no errors. The four `NODE_ENV` assignments use `Reflect.set`, which matches the writable runtime property.

Still not a working feature, and not marked fixed:

- The contact form and the beta page do not deliver a message. A mail transport has not been supplied.
- Search has no index.
- English and Mathematics files, videos, and the 2025 brief-report PDF are still not attached.
- Future named editions stay unlisted.
- Empty galleries stay empty.
- The 12 Production publication rows were not counted again in this pass. No Production row was written.
