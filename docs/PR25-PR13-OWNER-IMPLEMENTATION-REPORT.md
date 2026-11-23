# TEJAS — PR #25 / PR #13 owner-decision implementation report

Branch: `feature/pr25-pr13-ebook-payment-ocr`  
Review PR: https://github.com/dhevb/tejas/pull/56  
Base: `origin/main`  
Original PRs kept open and unmerged: #25, #13  
Production: unchanged (no deploy, no Production migration)

## 1. Decision summary

| Topic | Decision implemented |
|---|---|
| School registration | ₹150 / student-stream; school ₹30; TEJAS ₹120 |
| Individual registration | ₹150 / stream; no school share; full amount to TEJAS |
| Printed books | Removed from current-release UX/pricing; historical rows preserved |
| E-book + mocks | ₹49 per selected stream = 1 e-book + 5 mocks |
| Payment proof | Screenshot + entered UTR mandatory; OCR auto-approve when all checks pass |
| Bank confirmation | Explicitly labelled screenshot OCR match — **not** bank-statement confirmation |
| Production DB | Migration file prepared only; not applied |

## 2. Class 10 Mathematics booklet

| Field | Value |
|---|---|
| Owner path | `C:\Users\Admin\Downloads\TEJAS Mathematics – Class 10.docx` |
| Portal filename | `content/portal/sources/math-class-10-mocks.docx` |
| Size | 57,988 bytes |
| SHA-256 | `3ccb324af04cede26e6f511caaeb1ffb240e4ccf93489b4960a5bac8c1d3c3bb` |
| Subject / class | TEJAS Mathematics Olympiad 2026–27 · CLASS 10 |
| Mock headers | Mock Test 1–5 present |
| Answer keys | Answer Key Class 10 Mock Test 1–5 present |
| Extracted tests | 5 × 25 questions, answer keys available |
| English / other-class markers | None found |
| Purchase enabled | **Yes** — `quoteFee(mathematics, 10) === payable` |

## 3. Stream-wise E-book / Mock Test mapping

| Stream | Classes / books | Mocks per book | Purchase |
|---|---|---|---|
| English | Classes 3–10 (`eng-class-XX`) | 5 | Enabled |
| Mathematics | Classes 3–10 (`mat-class-XX`) | 5 | Enabled (Class 10 now included) |
| Future Tech | Book 1 (6–8), Book 2 (9–10) | 5 each | Enabled |

Catalog totals after Class 10 Math ingest: **18 books**, **90 mock tests**.

Fee examples (server-side only):

| Case | Amount due |
|---|---|
| School, 1 stream | ₹120 |
| Individual, 1 stream | ₹150 |
| E-book, 1 / 2 / 3 streams | ₹49 / ₹98 / ₹147 |

## 4. OCR / Tesseract runtime verification

| Check | Result |
|---|---|
| `tesseract` on PATH (this Windows agent host) | **Not installed / not found** |
| `probeTesseractRuntime()` | `available: false` — executable not found |
| Fixture PNG UTR extraction | Passes without tesseract |
| Payment text parser (UTR/beneficiary/amount/status) | Passes |
| Real screenshot OCR on this host | **Not possible until tesseract + eng data are installed** |
| Production readiness claim | **Not claimed** — runtime dependency remains a blocker for live screenshot OCR |

Safe failure behaviour when OCR cannot read a screenshot: confidence `low` → exception / pending status → no auto-approval.

School registration (`/api/register/[reference]/payment`) and e-book pay (`/api/learn/pay`) both require screenshot + UTR and use `decideScreenshotPayment` (no mandatory bank-lookup gate).

## 5. Payment verification policy status

Implemented:

- Entered UTR vs OCR UTR exact match after normalisation
- Beneficiary allowlist for `Vidya Bharti Institute of Training and Research Trust` (+ verified truncations / published `V.B. EDUCATIONAL TRUST`) and registration `TEJAS OLYMPIAD`
- Amount match against server-calculated due amount
- Successful payment status required
- Atomic UTR claim across school / individual / ebook channels
- Transparent labelling: screenshot OCR match, not bank-verified

## 6. Security review findings

| Area | Status |
|---|---|
| Server-side fee calculation | Enforced (`calculateFee`, `calculateIndividualRegistration`, `calculateEbookPurchase`, `quoteFee`) |
| UTR uniqueness / race | Filesystem `O_EXCL` claims; DB migration prepared for Production later |
| Paid-stream-only access | `decideAccess` enforces stream/class/paid/publication |
| Cross-student leakage | Book/test file routes require session + entitlement checks (existing portal model) |
| Upload validation | MIME/signature + 5 MB limit; JPG/PNG for OCR path |
| Secrets in logs | No account secrets logged; payment routes log status only |
| Printed-book historical rows | Not deleted; new printed-book extras ignored |
| Learn pay previously UTR-only | **Fixed in this follow-up** — now requires screenshot + UTR with OCR auto-approve |

## 7. Test / TypeScript / lint / build

Recorded on the follow-up commit (see section 8):

- `npm test`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`

## 8. Commit / PR status

- Review PR: https://github.com/dhevb/tejas/pull/56 — **OPEN, unmerged**
- Tip commit after Class 10 Math follow-up: 9fb5d79039603e97b0f30e94b5922b09cd163b2c
- PR #25 / #13: remain OPEN, unmerged

## 9. Production / migration

- Production deploy: **not performed**
- Production migration apply: **not performed**
- Review-only file: `supabase/migrations/20261123_payment_utr_registry_and_ocr.sql`

## 10. Remaining blockers

1. **Install Tesseract OCR + `eng` traineddata** on the runtime that will process live payment screenshots (local agent currently lacks it). Until then, real screenshots fail closed to pending/exception; fixture/parser paths still work.
2. Owner review of PR #56 before any merge/deploy.
3. Separate owner authorisation required before applying the UTR-registry migration to Production.
