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

## 4. OCR execution environment and Tesseract installation

### 4.1 Actual OCR execution environment

| Item | Finding |
|---|---|
| Application host | **Vercel Node.js serverless** (Next.js `runtime = "nodejs"` API routes) |
| Routes | `/api/register/[reference]/payment`, `/api/learn/pay` → `extractPaymentScreenshotAsync` |
| Not the OCR host | Cursor agent Windows host (system `tesseract` binary is irrelevant for Production) |
| Engine chosen | **`tesseract.js` v5** (WASM), not a system Tesseract executable |

System Tesseract cannot be installed persistently on Vercel serverless. OCR therefore uses the Node-compatible WASM engine bundled with the app.

### 4.2 Installation method (deployment-compatible)

| Component | Method |
|---|---|
| OCR engine | npm dependency `tesseract.js@^5.1.1` (`serverExternalPackages`) |
| English data | Committed `vendor/tessdata/eng.traineddata.gz` (~10.9 MB) |
| Uncompressed extract | Gitignored (`eng.traineddata`) — not required at runtime (`gzip: true`) |
| Path | Plain filesystem `vendor/tessdata` (not `file://`; Node adapter uses `fs`) |
| Serverless tracing | `outputFileTracingIncludes` for payment API routes includes `./vendor/tessdata/**/*` |
| Permissions | No shell; image bytes only — no filename-based command execution |

### 4.3 Real screenshot OCR test results (local Node, bundled engine)

Synthetic Arial-font payment screenshots (fake UTRs, no real account secrets) in `lib/registration/fixtures/`:

| Fixture | Result |
|---|---|
| `payment-success-49.png` | UTR `AXISCN777001`, beneficiary Trust full name, amount ₹49, status success → **auto-approve** |
| `payment-success-120-truncated.png` | UTR + truncated beneficiary allowlist + ₹120 → **auto-approve** on match; wrong entered UTR → **exception** |
| `payment-pending-49.png` | Status pending → **exception** (no auto-approve) |
| `payment-unreadable.png` | Low confidence → **exception** |
| Glyph-only `renderUtrPng` | `source=fixture` → **never auto-approves** |
| Corrupt/tiny bytes | `source=none` / low confidence → **exception** |

Timeouts: worker start and recognize each capped at **20s**; failures reset the worker and return pending/exception.

### 4.4 Production readiness claim

**Not claimed.** Local Node verification of bundled `tesseract.js` + `eng.traineddata.gz` passed. Live Vercel serverless OCR has **not** been exercised against Production or a preview deploy of this branch. Fail-closed behaviour remains until that runtime is verified.

## 5. Payment verification policy status

Implemented:

- Entered UTR vs OCR UTR exact match after normalisation
- Beneficiary allowlist for `Vidya Bharti Institute of Training and Research Trust` (+ verified truncations / published `V.B. EDUCATIONAL TRUST`) and registration `TEJAS OLYMPIAD`
- Amount match against server-calculated due amount
- Successful payment status required
- Atomic UTR claim across school / individual / ebook channels
- Transparent labelling: screenshot OCR match, not bank-verified
- **`ocrSource` gate:** `fixture` and `none` can never auto-approve (even if other fields look perfect)

## 6. Security review findings

| Area | Status |
|---|---|
| Server-side fee calculation | Enforced (`calculateFee`, `calculateIndividualRegistration`, `calculateEbookPurchase`, `quoteFee`) |
| UTR uniqueness / race | Filesystem `O_EXCL` claims; DB migration prepared for Production later |
| Paid-stream-only access | `decideAccess` enforces stream/class/paid/publication |
| Cross-student leakage | Book/test file routes require session + entitlement checks (existing portal model) |
| Upload validation | MIME/signature + 5 MB limit; JPG/PNG for OCR path |
| Command injection | OCR receives image **bytes only**; no shell, no filename interpolation into commands |
| Timeouts / resources | 20s OCR startup + recognize timeouts; worker reset on failure |
| Secrets in logs | No UTRs/account details/screenshot text logged; routes log generic failures only |
| Package size | ~10.9 MB tessdata.gz + tesseract.js WASM — within typical Vercel function limits; confirm on first preview deploy |
| Printed-book historical rows | Not deleted; new printed-book extras ignored |
| Learn pay previously UTR-only | Fixed — requires screenshot + UTR with OCR auto-approve |

## 7. Test / TypeScript / lint / build

Recorded for this OCR-runtime follow-up:

- `npm test` — **84/84 pass** (includes real bundled OCR fixture tests)
- `npx tsc --noEmit` — pass
- `npm run lint` — pass (existing `<img>` warnings only)
- `npm run build` — pass

## 8. Commit / PR status

- Review PR: https://github.com/dhevb/tejas/pull/56 — **OPEN, unmerged**
- Tip commit: `52c0c98be30fb40f39e214bacb6395eb6856c322`
- OCR feature commit: `ef83dc7ddc143013ae5afd1d7aac4b3c3d61a107`
- PR #25 / #13: remain OPEN, unmerged
- Production: **unchanged**

## 9. Production / migration

- Production deploy: **not performed**
- Production migration apply: **not performed**
- Review-only file: `supabase/migrations/20261123_payment_utr_registry_and_ocr.sql`

## 10. Remaining owner-only steps

1. **Preview-deploy verification (recommended before merge):** Deploy this branch to a non-Production Vercel preview and submit a synthetic JPG/PNG payment screenshot through `/api/learn/pay` or registration payment to confirm serverless OCR loads `eng.traineddata.gz` and completes within limits.
2. Owner review of PR #56 before any merge/deploy to Production.
3. Separate owner authorisation required before applying the UTR-registry migration to Production.
4. No Production-only OS package install is required if the bundled `tesseract.js` path is accepted after preview verification.
