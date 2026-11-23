# TEJAS — PR #25 / PR #13 owner-decision implementation report

Branch: `feature/pr25-pr13-ebook-payment-ocr`  
Base: `origin/main` @ `fa1b15e`  
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
| Bank confirmation | Explicitly labelled screenshot OCR match — not bank-statement confirmation |
| Production DB | Migration file prepared only; not applied |

## 2. Old vs new payment flows

### Before
- School registration remits ₹120 / stream; payment proof uploaded → status `reported` until staff confirms.
- Learn portal e-book payment reported by UTR text; staff verifies.
- Printed-book extras existed in fee helpers / messaging.
- English/Mathematics portal fees closed (`PORTAL_FEE_APPROVED=false`).

### After
- School + individual registration use screenshot OCR auto-approval when UTR, beneficiary, amount, success status, confidence, and UTR uniqueness all pass; otherwise exception/`reported`.
- E-book purchase remains ₹49/stream server-side via `calculateEbookPurchase` / portal `quoteFee`.
- Printed-book request extras are ignored (`PRINTED_BOOKS_AVAILABLE=false`).
- English/Mathematics content staged; payable only when exactly five mocks exist for that class.

## 3. Fee examples

| Case | Amount due to TEJAS |
|---|---|
| School, 1 stream | ₹120 (of ₹150; school keeps ₹30) |
| School, 3 streams | ₹360 |
| Individual, 1 stream | ₹150 |
| Individual, 2 streams | ₹300 |
| E-book, 1 stream | ₹49 (1 book + 5 mocks) |
| E-book, 2 streams | ₹98 (2 books + 10 mocks) |
| E-book, 3 streams | ₹147 (3 books + 15 mocks) |

## 4. Beneficiary matching

Official name for e-book matching allowlist:

`Vidya Bharti Institute of Training and Research Trust`

Also accepted (normalised): Trust omitted, short truncations, and published `V.B. EDUCATIONAL TRUST`.  
Registration channel matches published `TEJAS OLYMPIAD`.  
No unrestricted fuzzy match. Ambiguous/unrelated names → exception.

Published bank account numbers / IFSC were not changed.

## 5. Content availability

Owner pack: `C:\Users\Admin\Downloads\drive-download-20261123T081458Z-1-001`

- Large Mathematics PDFs compressed (rasterized where needed) into `content/portal/sources/`.
- English Classes 3–10 ebooks + 5 mocks each: extracted into catalog.
- Mathematics Classes 3–9 ebooks + 5 mocks each: extracted.
- Future Tech Book 1/2 ebooks + 5 mocks: present (existing + refreshed sources).
- **BLOCKER:** Mathematics Class 10 mock booklet missing from the pack (`TEJAS Mathematics – Class 10.docx` absent). Class 10 Mathematics purchase stays closed.

Catalog: 18 books, 85 mock tests after merge.

## 6. Migration impact (unapplied)

File: `supabase/migrations/20261123_payment_utr_registry_and_ocr.sql`

- Creates `tejas_payment_utrs` (atomic UTR registry for school / individual / ebook).
- Adds OCR/approval columns on `tejas_payments`.
- Does not delete historical book-order or payment rows.
- **Must not be applied to Production until owner authorises.**

Local durable path already uses filesystem O_EXCL UTR claims for development/tests.

## 7. Security notes covered by tests

- Exact UTR match / mismatch / missing
- Duplicate UTR across channels
- Concurrent duplicate UTR race (one winner)
- Beneficiary full / truncated / Trust omitted / ambiguous / unrelated
- Low OCR confidence, wrong amount, pending/failed status
- Successful auto-approve labelled as screenshot OCR (not bank-verified)
- Printed-book extras ignored

## 8. Remaining blockers / owner decisions

1. Supply Mathematics Class 10 five-mock booklet, then re-run `scripts/extract_subject_mocks.py`.
2. Owner review + authorise Production migration apply (separate from this PR).
3. Tesseract must be available on the runtime host for real screenshot OCR (fixture PNG path covered in tests without tesseract).
4. Staff console still shows historical printed-book fields for old records; new orders are not offered.
5. Original PR #25 still required a bank lookup for auto-approve; this implementation follows the newer owner policy (screenshot-only auto-approve). Confirm that supersedes PR #25’s bank-lookup gate.
6. Do not merge original PR #25 / #13 as-is (conflicting bases; printed-book surfaces).
