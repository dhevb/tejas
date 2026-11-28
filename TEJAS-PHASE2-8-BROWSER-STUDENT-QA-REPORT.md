# TEJAS Phase 2.8 — Browser Student Learning QA Report

**Branch:** `fix/pr72-phase2-1-utr-recovery-preview-qa`  
**Tip SHA:** `efeadface3fdc7a481fe8405102233bdb28fede4`  
**Preview Supabase:** `nbeslngnrsagarosuaab` only  
**Production:** `zapccpipwxduzlnvjdmy` / `https://tejas.dhe.org.in` — **untouched**  
**App under test:** local Next `http://localhost:3001` bound to Preview env + `TEJAS_CONTENT_QA_EMAIL`  
**Temporary restricted QA publication:** OPEN during QA → **CLOSED** after QA  

---

## Final verdict

# BROWSER QA PASS — RESTRICTED PUBLICATION CLOSED

---

## A. Preview identity

| Check | Result |
|-------|--------|
| Supabase ref | `nbeslngnrsagarosuaab` |
| Production ref absent from runtime probes | PASS |
| Restricted authenticated content-QA access | PASS (`tejas-content-qa@dhe.org.in`, credentials private / not printed) |
| No secrets in this report | PASS |

---

## B. Books (18/18)

Access matrix: **18/18 PASS** (`.local-qa/phase289-access-matrix.json`).  
Authenticated PDF fetch: **18/18 PASS** (`.local-qa/phase289-pdf-fetch-qa.json`) — SHA match, page counts, `private, no-store`, inline disposition, no public Storage URL.  
Browser reader: English Class 7 opened as **Page 1 of 125** with Next enabled after pdfjs public-asset load fix (see notes).

Per-book matrix: `TEJAS-PHASE2-9-PDF-AND-MOCK-TEST-QA-MATRIX.md`.

---

## C. Owner-accepted blank pages

Verified blank (0 operators / 0 text) and **not** defected:

| Book | Pages |
|------|------:|
| English Class 7 | 6, 74, 76 |
| English Class 10 | 6, 80 |

No PDF edits.

---

## D. Mock tests (90/90)

Access matrix: **90/90 PASS** (authorized + unauthorized denial).  
Lifecycle samples (content-QA only; no real-student attempt mutation): **4/4 PASS** — start, submit/score, result page, QA retake, foreign attempt denied, unauth 401, wrong-origin 403  
(`.local-qa/phase289-mock-lifecycle-qa.json`).

---

## E. Future Tech entitlement

| Rule | Result |
|------|--------|
| Classes 6–8: Book 1 readable + 5 mocks | PASS |
| Classes 9–10: Book 1 companion readable; Book 2 readable; Book 2 mocks open; Book 1 mocks locked; no second fee | PASS |

---

## F. Responsive / browser

| Check | Result |
|-------|--------|
| Desktop Chrome login + dashboard | PASS |
| Desktop Chrome / IDE browser reader navigation | PASS (after pdfjs load-path fix) |
| Mobile viewport (device metrics) | Exercised on reader |
| Refresh / session | Logout → PDF 401; invalid session dashboard redirect |
| Network / PDF reload | Reader “Try again” path present; authenticated fetch reload PASS |
| Long document | eng-class-07 125 pages navigable |

---

## G. Security

| Check | Result |
|-------|--------|
| Storage public buckets | **none** |
| PDF route without session | **401** |
| Non-reader fetch (`sec-fetch-dest` ≠ empty) | **403** |
| Cache-Control | `private, no-store` |
| CORP / robots | `same-origin` / `noindex, nofollow` |
| Entitlement server-side | PASS (access matrix) |
| Production endpoints/credentials | not used |
| Cross-student attempt | foreign attempt denied |

PDF delivery uses authenticated same-origin reader fetch (not permanent public URL). Session expiry after logout enforced.

---

## H. Close temporary publication

| Step | Result |
|------|--------|
| Close SQL file | `preview-sql/phase28-restricted-qa/02-close-preview-qa-publication.sql` |
| SHA-256 | `EB4F6599178585FD115F1FAA61F80AFEE880F155A1C9D93D77CCBE567D893542` (verified) |
| Preview target | `nbeslngnrsagarosuaab` |
| Execution | REST service-role PATCH equivalent of close SQL (RPC helper returned HTTP 2xx without mutating columns; REST close mutated Preview only) |
| After | books **18 awaiting_approval**; tests **90 awaiting_approval** |
| Post-close unauth PDF | **401** |
| Post-close content-QA PDF while unpublished | **403** (publication enforced) |
| Storage still private | PASS |

Evidence: `.local-qa/phase28-publication-close-rest.json`, `.local-qa/phase289-postclose-verify.json`.

---

## Local code note (not merged / not Production)

During browser QA, `next dev` + webpack eval source maps broke bundled `pdfjs-dist` (`Object.defineProperty called on non-object`). Fixed locally by loading `/pdfjs/pdf.min.mjs` from `public/` (`app/learn/books/[bookId]/reader.tsx`, `scripts/copy-pdfjs-assets.mjs`). **Uncommitted on tip `efeadfa`.** Required for local browser reader; does not change Production and was not deployed.

---

## Failed tests / blockers

**None remaining for Phase 2.8–2.9 browser QA closeout.**

Do **not** merge or deploy to Production from this report.
