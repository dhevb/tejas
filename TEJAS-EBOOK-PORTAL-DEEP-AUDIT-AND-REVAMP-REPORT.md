# TEJAS E-book & Student Learning Portal — Deep Audit and Revamp Report

**Branch:** `feat/ebook-portal-multi-stream-ft-syllabus-pdf-revamp`  
**Base:** latest `main` (`1dff4a8`)  
**Scope:** Preview-only. No Production merge, SQL, Auth, RLS, Storage, payment-record, or student-data changes.

---

## 1. Routes and components inspected

Student portal lives under `/learn/*` (not `/ebook/*`).

| Area | Paths |
|------|--------|
| Public entry | `/learn`, `/prepare/ebook` |
| Auth | `/learn/register`, `/learn/login`, `/api/learn/register`, `/api/learn/login`, `/api/learn/logout` |
| Library | `/learn/dashboard`, `/learn/account`, `/learn/pay`, `/api/learn/pay`, `/api/learn/streams` (new) |
| Reader | `/learn/books/[bookId]`, `/api/learn/books/[bookId]/file` |
| Mock tests | `/learn/tests/[testId]`, `/learn/attempts/[attemptId]` |
| Staff | `/learn/staff` |
| Core libs | `lib/portal/model.ts`, `store.ts`, `remote-store.ts`, `book-file.ts`, `catalog.server.ts`, `entitlement-access.ts` (new) |
| Content | `content/portal/catalog.json`, `content/portal/sources/*.pdf` |

---

## 2. Existing behaviour vs defects (before)

| Topic | Existing behaviour | Defect / gap |
|-------|--------------------|--------------|
| Multi-stream purchase | Single `streamId` on student; register UI was a single select | One email could not buy English + Mathematics + Future Tech in one flow |
| Fee quote | `quoteFee` for one stream only | UI did not surface ₹49 × N total |
| Future Tech syllabus | Class 9–10 saw only `ft-book-2` | Book 1 hidden from Book 2 applicants |
| Access control | Exact `streamId` + exact class match on book | Blocked FT Book 1 for class 9–10 even when FT paid |
| Dashboard | Flat single-stream book cards | No My Learning / Buy More structure |
| PDF delivery | Auth-gated same-origin fetch + pdf.js | Students reported open/render failures; limited retry/error UX |
| Duplicate purchase | Single entitlement per primary book | No clear skip of already-purchased streams in multi-select pay |

---

## 3. Account / email multi-stream purchase design

**Identity:** Unchanged. One student row per email (`An account with this email already exists.`). Students are not merged by shared email.

**Primary stream:** First selected stream is stored on `tejas_learn_students.stream_id` (existing column — no migration).

**Entitlements:** Still one row per **payable book** (₹49). Additional streams create additional unpaid/verified entitlement rows.

**Register:** Multi-select streams + class intersection. Creates unpaid entitlements for each selected stream’s payable book.

**Buy more:** Dashboard multi-select calls `POST /api/learn/streams` → `addStreamPurchases` (skips already verified streams).

**Pay:** Multi-select unpaid streams; OCR `expectedAmount = N × 49`. Secondary books store unique payment references as `UTR/bookId` to satisfy `tejas_learn_entitlements_one_reference` without a schema change.

**Remote Preview:** Extra unpaid rows via service-role REST insert (`remoteEnsureUnpaidEntitlements`). No Production schema change.

---

## 4. Future Tech Book 1 / Book 2 entitlement

| Class | Payable book (₹49) | Syllabus books after FT payment |
|-------|--------------------|----------------------------------|
| 6–8 | `ft-book-1` | Book 1 only |
| 9–10 | `ft-book-2` | Book 1 **and** Book 2 |

- Book 1 is marked `syllabusCompanion` with ₹0 (no second charge).
- Access uses enrolled-stream syllabus + paid check on the **payable** book.
- English / Mathematics remain locked for FT-only purchasers.

---

## 5. Inventory — 18 books / 90 mock tests

Reconciled from `content/portal/catalog.json` + `content/portal/sources`:

| Stream | Books | Mock tests |
|--------|-------|------------|
| English | 8 (`eng-class-03` … `eng-class-10`) | 40 |
| Mathematics | 8 (`mat-class-03` … `mat-class-10`) | 40 |
| Future Tech | 2 (`ft-book-1`, `ft-book-2`) | 10 |
| **Total** | **18** | **90** |

Script: `node scripts/audit-portal-pdfs.mjs`  
Result: **all 18 PDFs present**, valid `%PDF` signatures, **5 mock tests per book**, catalog SHA-256 matches on disk.

---

## 6. PDF-by-PDF validation (source files)

All published catalog books resolve to local sources under `content/portal/sources/`:

- Signature: `%PDF` OK for all 18
- Size: ~1.8 MB – ~8.3 MB (reasonable)
- SHA-256: matches `catalog.json` for all 18
- Page counts: as catalogued (e.g. FT Book 1 = 60, Book 2 = 67)

**Not done in this Preview pass (requires interactive browser on Preview with a verified student):** full visual page-by-page Unicode/Devanagari screenshot comparison for every title. Automated structural inventory is complete; Owner visual spot-check on Preview is recommended.

---

## 7. PDF rendering / delivery issues found and fixed

| Finding | Fix |
|---------|-----|
| Weak error messaging on 401/403/non-PDF | Clear session-expired / access / damaged-file messages + **Try again** |
| No fit-to-page | Added Fit page beside Fit width |
| No reading position | `sessionStorage` page restore per book |
| Toolbar lacked stream context | Stream · title header; download/print still blocked |
| Horizontal overflow on narrow screens | Reader page container uses `max-w-full` + controlled overflow |

**Unchanged policy:** one-device login; no download/print; private same-origin file route; `Content-Disposition: inline`; `Cache-Control: private, no-store`; buckets not made public.

---

## 8. Before / after UI (desktop & mobile)

**Before:** Single stream select; dashboard showed one stream’s class-exact book; FT class 9 saw only Book 2; pay page one fee line.

**After (this PR):**
- Register: multi-select streams, live ₹49 × N total, class = intersection of selected streams
- Dashboard: My Learning / My Books by stream / Mock Tests / Buy More Books
- Pay: selectable unpaid streams + dynamic total
- Reader: improved loading, retry, fit page, position restore

Screenshots: capture on Preview after deploy (desktop + mobile) during Owner QA. Automated CI does not attach image artefacts here.

---

## 9. Automated test results

| Check | Result |
|-------|--------|
| `lib/portal/multi-stream.test.ts` | PASS (multi-stream, FT syllabus, pending, no double charge, email uniqueness) |
| `lib/portal/portal.test.ts` | PASS (updated FT expectations) |
| `lib/portal/access-rules.test.ts` | PASS |
| `lib/portal/content-qa.test.ts` | PASS |
| `tsc --noEmit` | PASS |
| `next lint` | PASS (existing img warnings only) |
| `npm run build` | PASS |
| `scripts/audit-portal-pdfs.mjs` | PASS (18/18) |

---

## 10. Preview URL and deployment ID

Filled after Preview deploy in this session (see PR description / final chat note).

| Item | Value |
|------|--------|
| Preview URL | _pending deploy_ |
| Deployment ID | _pending deploy_ |

---

## 11. Unresolved / Owner decisions

1. **No Production migration applied.** Optional future Owner-approved RPC to register multiple book entitlements atomically (instead of REST inserts for extras) would harden remote multi-stream further.
2. **Unique payment reference workaround** (`UTR/bookId` for secondary lines) is Preview-safe; Owner may prefer a dedicated multi-line payment table later.
3. **Source PDF visual QA** for Devanagari/diagrams should be spot-checked on Preview with a verified content-QA or staff-published account.
4. Orphan local source copies (`VB_IOT_GUIDE_V06_Book-*.pdf`) are not in the published catalog; left untouched.

---

## 12. Production untouched — confirmation

- No Production deploy
- No Production SQL / migrations
- No Production Auth, RLS, Storage, or env changes
- No payment confirmation/rejection/refund on Production data
- No student account deletion or historical entitlement alteration on Production
- PR opened for Owner review only; **do not merge** without explicit approval
