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
| Payment routes | `/api/register/[reference]/payment`, `/api/learn/pay` → `extractPaymentScreenshotAsync` |
| Preview acceptance route | `/api/register/ocr-probe` (Preview/dev only; **404 on Production**; `writesData: false`) |
| Engine | **`tesseract.js` v5** WASM + `tesseract.js-core` |
| Not the OCR host | Cursor agent Windows host |

### 4.2 Installation method (deployment-compatible)

| Component | Method |
|---|---|
| OCR engine | npm `tesseract.js@^5.1.1` + `tesseract.js-core` (`serverExternalPackages`) |
| English data | Committed `vendor/tessdata/eng.traineddata.gz` (~10.9 MB) |
| WASM cores | Traced into functions via `outputFileTracingIncludes` → `./node_modules/tesseract.js-core/**/*` |
| Tessdata path on Preview | `/var/task/vendor/tessdata` |
| Timeouts | Worker start + recognize each **45s** (route `maxDuration` 60s on probe) |
| Permissions | Image bytes only — no shell / no filename command injection |

### 4.3 Local Node OCR (pre-Preview)

Synthetic fixtures in `lib/registration/fixtures/` passed locally (UTR/amount/beneficiary/status + fail-closed cases).

### 4.4 Vercel Preview serverless OCR acceptance (completed)

| Field | Value |
|---|---|
| Preview URL | https://tejas-227wv130d-dhe-projects.vercel.app |
| Deployment ID | `dpl_7Kts76rypFvHMCiaZVwXkVkZBE4G` |
| Inspect | https://vercel.com/dhe-projects/tejas/7Kts76rypFvHMCiaZVwXkVkZBE4G |
| Environment | **Preview** (`target: preview` / `VERCEL_ENV=preview`) |
| Commit deployed | working tree at `cfd807fdf1cc0fff05fa4298047f9cdcd679f7a5` (OCR probe + WASM tracing) |
| Access | Vercel Deployment Protection; exercised via `vercel curl` |

**Runtime evidence (GET `/api/register/ocr-probe`):**

```json
{
  "ok": true,
  "vercelEnv": "preview",
  "executionEnvironment": "vercel-node-serverless",
  "ocr": {
    "available": true,
    "engine": "tesseractjs",
    "engDataPresent": true,
    "tessdataPath": "/var/task/vendor/tessdata",
    "detail": "Bundled tesseract.js with local eng.traineddata.gz is ready for Node/Vercel OCR."
  }
}
```

**Synthetic screenshot POST results** (no DB/UTR/proof writes — probe only):

| Case | Outcome | Notes |
|---|---|---|
| Success ₹49 Trust full name | **automatic** / `screenshot_ocr_match` | UTR `AXISCN777001`, amt 49, success; ~388–986 ms |
| Truncated beneficiary ₹120 | **automatic** / `screenshot_ocr_match` | UTR `AXISCN777002` |
| Wrong entered UTR | **exception** | Fail-safe held |
| Wrong expected amount | **exception** | Fail-safe held |
| Pending screenshot | **exception** | status pending |
| Unreadable screenshot | **exception** | low confidence / no fields |
| Duplicate UTR flag | **exception** | `utrAlreadyUsed=true` |
| Registration purpose vs ebook beneficiary | **exception** | allowlist mismatch |

**First Preview attempt** (`dpl_D3s4bW7AbmyxteHjNCKTYPbAm5R4`): OCR timed out; logs showed missing `tesseract-core-simd.wasm`. Fail-safe returned **exception** (never auto-approved). Fixed by tracing `tesseract.js-core` WASM into the function bundle; redeployed.

**Limitation (documented, intentional):** Full `/api/learn/pay` and registration payment routes were **not** exercised on Preview against live Durable/Supabase, because Preview may share Production credentials and must not write Production payment data. Acceptance used the isolated Preview-only probe that runs the same OCR + `decideScreenshotPayment` path with `writesData: false`.

### 4.5 Production readiness claim

**Serverless OCR on Vercel Preview is verified operational** for synthetic screenshots via the probe.  
**Production deploy of this branch was not performed.** Owner merge + Production deploy + migration remain separate decisions.

## 5. Payment verification policy status

Implemented:

- Entered UTR vs OCR UTR exact match after normalisation
- Beneficiary allowlist for `Vidya Bharti Institute of Training and Research Trust` (+ verified truncations / published `V.B. EDUCATIONAL TRUST`) and registration `TEJAS OLYMPIAD`
- Amount match against server-calculated due amount
- Successful payment status required
- Atomic UTR claim across school / individual / ebook channels
- Transparent labelling: screenshot OCR match, not bank-verified
- **`ocrSource` gate:** `fixture` and `none` can never auto-approve
- Preview probe hard-disabled when `VERCEL_ENV=production`

## 6. Security review findings

| Area | Status |
|---|---|
| Server-side fee calculation | Enforced |
| UTR uniqueness / race | Filesystem `O_EXCL` claims; DB migration prepared for Production later |
| Paid-stream-only access | `decideAccess` enforces stream/class/paid/publication |
| Upload validation | MIME/signature + 5 MB; JPG/PNG for OCR |
| Command injection | Bytes-only OCR |
| Timeouts / resources | 45s OCR timeouts; Preview logs clean after WASM fix |
| Secrets in logs | No UTRs/screenshot text logged by probe responses beyond structured OCR fields needed for acceptance |
| Preview isolation | Probe does not write registrations, entitlements, UTR claims, or proofs |
| Production | Unchanged — Production deployment remains `dpl_EWNdXmoAQYdS9HdcU4oviWAnZg8n` (created ~2h before Preview OCR work) |

## 7. Test / TypeScript / lint / build

- Local: OCR runtime tests + probe Production-disable test pass; prior suite green
- Preview build: Next.js 15.5.20 build succeeded; `/api/register/ocr-probe` present as Node function
- Preview acceptance: 2 automatic + 6 exception cases as tabulated above

## 8. Commit / PR status

- Review PR: https://github.com/dhevb/tejas/pull/56 — **OPEN, unmerged**
- Tip commit: `6cbe58a7a934db0fd5d44bf507f4aa7bee0bd31e`
- Key commits: `ef83dc7` (tesseract.js + eng data), `963acf6` (preview OCR probe), `cfd807f` (WASM tracing + 45s timeout)
- PR #25 / #13: remain OPEN, unmerged
- Production: **unchanged**

## 9. Production / migration

- Production deploy: **not performed**
- Production migration apply: **not performed**
- Review-only file: `supabase/migrations/20261123_payment_utr_registry_and_ocr.sql`

## 10. Remaining owner-only steps

1. **Owner review of PR #56** — Preview serverless OCR acceptance is complete; ready for final merge decision.
2. After merge, **Production deploy** is a separate owner action (do not promote Preview casually without reviewing env).
3. Separate owner authorisation before applying the UTR-registry migration to Production.
4. Optionally remove or further lock down `/api/register/ocr-probe` after acceptance (already 404 on Production).
5. Optional: end-to-end Preview payment with an isolated non-Production Supabase project (not done here to avoid shared Production credentials).
