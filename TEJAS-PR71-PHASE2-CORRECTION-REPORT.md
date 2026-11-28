# TEJAS PR #71 — Phase 2 Payment, Entitlement & PDF Correction Report

**Correction branch:** `fix/pr71-phase2-payment-entitlement-pdf`  
**Parent PR:** https://github.com/dhevb/tejas/pull/71  
**Mode:** Preview-only. No Production merge/deploy/SQL.

---

## 1. Root cause of each Owner issue

| Issue | Root cause |
|-------|------------|
| Multi-stream single-UTR integrity | `tejas_learn_entitlements_one_reference` allows one UTR on **one** entitlement row; fee constraint forces ₹49 per row. Phase 1 stored `UTR/bookId` for secondary lines. |
| Fabricated secondary UTR | Application workaround `entitlementPaymentReference()` to bypass unique index. |
| Partial group verification risk | Looping report/verify per book could leave partial grants if a middle call failed. |
| Future Tech mocks vs companion | Phase 1 treated companion Book 1 as fully paid for **tests** as well as reading. |
| PDF “fixed” claim incomplete | Phase 1 verified signatures/SHA/inventory only; did not parse every page via pdf.js. |
| Remote Supabase proof missing | File-store unit tests only; Preview service-role secrets pull as `[SENSITIVE]` placeholders locally. |

---

## 2. Files changed and reason

| File | Reason |
|------|--------|
| `lib/portal/entitlement-access.ts` | Remove UTR fabrication helper; add `isMockTestPaidByStreamEntitlement` |
| `lib/portal/model.ts` | `decideAccess` separates book `paid` vs `mocksPaid`; companion mocks denied |
| `lib/portal/store.ts` | One-stream-per-UTR payments; exact UTR; idempotent retry; no UTR release on entitlement failure |
| `lib/portal/remote-store.ts` | Mirror mocksPaid in access + dashboard |
| `app/learn/pay/pay-form.tsx` / `page.tsx` | Radio: one stream per payment; exact UTR messaging |
| `app/learn/dashboard/page.tsx` | Companion reading vs mock-test copy |
| `lib/portal/portal.test.ts` / `multi-stream.test.ts` | Align tests with exact UTR + companion mock rules |
| `scripts/audit-portal-pdf-render.mjs` | Page-level pdf.js parse audit for all 18 books |
| `docs/TEJAS-PR71-PHASE2-PAYMENT-GROUP-SCHEMA-PROPOSAL.md` | Schema proposal (**not applied**) |
| `lib/portal/preview-supabase.integration.test.ts` | Preview-only gate; Production host denied |
| `TEJAS-PR71-PHASE2-CORRECTION-REPORT.md` | This report |

---

## 3. Payment architecture before / after

**Before (PR #71 Phase 1):** Multi-select pay → N entitlement rows → primary UTR + fabricated `UTR/bookId` on secondary rows → sequential remote report/verify.

**After (Phase 2 Preview-safe):**  
- Multi-stream **enrolment** still allowed (unpaid entitlements per stream).  
- **Payment** accepts exactly **one unpaid stream** with the **exact** bank UTR and expected amount ₹49.  
- Grouped ₹147 single-UTR payment is **refused** until Owner-approved schema (proposal linked above).  
- Idempotent same-UTR retry; different UTR cannot overwrite a reported entitlement.

---

## 4. UTR handling before / after

| | Before | After |
|--|--------|-------|
| Storage | Exact UTR on first book; `UTR/bookId` on others | Exact UTR only |
| Uniqueness | Registry + fabricated refs | Registry + one entitlement reference = real UTR |
| On entitlement failure after claim | Could `releaseUtr` | **Does not release** claimed UTR; same owner retries |

---

## 5. Multi-stream transaction test evidence (file-store)

Automated (`lib/portal/multi-stream.test.ts`, `portal.test.ts`):

- Register 3 streams → 3 unpaid entitlements visible.
- Grouped `reportPayment(..., [eng,mat,ft])` → **rejected** with schema message.
- Sequential UTR1/UTR2/UTR3 → reported → staff verified → access per stream only.
- Duplicate purchased stream payment refused.
- Pending remains unpaid for access.
- Same UTR retry idempotent; alternate UTR blocked once reported.

---

## 6. Preview Supabase integration evidence

**Result: BLOCKED**

- `vercel env pull --environment=preview` wrote placeholders (`[SENSITIVE]`) for Preview secrets.
- Integration gate (`preview-supabase.integration.test.ts`) allowlists only `nbeslngnrsagarosuaab.supabase.co` and **denies** Production `zapccpipwxduzlnvjdmy.supabase.co`.
- No remote payment/entitlement mutations were executed.
- File-store tests were **not** substituted as remote proof.

**Unblock requirement:** Owner-provided local-only Preview service role + URL for `nbeslngnrsagarosuaab` (never Production).

---

## 7. Future Tech entitlement matrix

| Class | Payable book (₹49) | Readable books after verify | Mock tests after verify |
|-------|--------------------|-----------------------------|-------------------------|
| 6–8 | `ft-book-1` | Book 1 | `ft-b1-mt01`…`ft-b1-mt05` (5) |
| 9–10 | `ft-book-2` | Book 1 **+** Book 2 | `ft-b2-mt01`…`ft-b2-mt05` (5) only |

Book 1 companion reading does **not** grant Book 1 mocks. English/Mathematics remain locked unless purchased.

---

## 8. Exact mock-test entitlement mapping

Per purchased stream: **five** catalog tests on the **payable** book only.

- English class N → `eng-class-NN` → 5 tests  
- Mathematics class N → `mat-class-NN` → 5 tests  
- Future Tech 6–8 → Book 1 → `ft-b1-mt01`…`05`  
- Future Tech 9–10 → Book 2 → `ft-b2-mt01`…`05`  

Total catalog: 90 tests (18×5).

---

## 9. All 18 PDF audit results

Script: `node scripts/audit-portal-pdf-render.mjs`  
Evidence: `.local-qa/portal-pdf-render-audit.json`

| Check | Result |
|-------|--------|
| 18 files exist + `%PDF` | PASS |
| pdf.js parse all pages | PASS |
| Page count vs catalog | PASS (all 18) |
| SHA-256 vs catalog | PASS (prior inventory) |
| Empty operator-list pages | **2 books flagged for Owner visual review:** `eng-class-07` pages 6,74,76; `eng-class-10` pages 6,80 (may be intentional blanks/diagram-only; not auto-replaced) |
| Devanagari text extraction sample | No Devanagari in first-page text layer for these packs (fonts may be outlined/images — browser visual check still required) |

**Delivery pipeline:** Authenticated `/api/learn/books/[bookId]/file` from `content/portal/sources` (not public Storage). `Content-Type: application/pdf`, `Content-Disposition: inline`, `Cache-Control: private, no-store`. Reader uses full-byte fetch (`disableRange/disableStream`) by design — no permanent public URL, no download/print.

---

## 10. PDF browser rendering evidence

- Automated structural parse: PASS for 18/18.  
- Live Preview browser pixel screenshots for every page: **not completed in this pass** (requires authenticated student session + published books on Preview).  
- Do **not** treat the original student render complaint as fully closed until Owner completes Preview visual QA on the flagged English pages and a mobile/desktop spot-check of FT/Math packs.

---

## 11. Security and regression results

| Check | Result |
|-------|--------|
| Portal unit tests (multi-stream, portal, access-rules, content-qa) | PASS |
| Preview Supabase integration | BLOCKED (credentials) |
| `tsc --noEmit` | PASS |
| Lint / production build | Run in this phase before Preview deploy |
| Cross-student / cross-stream denial | Covered by existing portal tests |
| Companion Book 1 without Book 1 mocks | Covered by updated tests |
| No download/print / one-device | Preserved |

---

## 12. Known limitations / blocked checks

1. Single bank transfer covering multiple streams — **blocked pending schema approval**.  
2. Preview remote integration suite — **BLOCKED** (secret placeholders).  
3. Full interactive browser PDF pixel QA — pending Owner Preview session.  
4. `eng-class-07` / `eng-class-10` sparse operator pages — Owner visual confirmation before any source replacement.

---

## 13. Schema changes proposed but NOT applied

See `docs/TEJAS-PR71-PHASE2-PAYMENT-GROUP-SCHEMA-PROPOSAL.md`.

**No SQL executed** on Preview or Production.

---

## 14. Production impact statement

**Production was untouched.** No merge, no Production deploy, no Production Supabase/Auth/RLS/Storage/env/SQL, no payment-record or student-data mutation on Production.

---

## Preview / PR (Phase 2 — PR #72)

| Item | Value |
|------|--------|
| Correction PR | https://github.com/dhevb/tejas/pull/72 |
| Base branch | `feat/ebook-portal-multi-stream-ft-syllabus-pdf-revamp` (PR #71) |
| Commit SHA (PR #72 head at Phase 2.1 branch cut) | `e856edce48e9f2416fc83cc016ce14fecc9b2d70` |
| Preview URL (Phase 2) | https://tejas-jt4k6b4qv-dhe-projects.vercel.app |
| Deployment ID (Phase 2) | `dpl_VCF3L3uyatwFidKwL6rTKLjGq9V9` (READY, `target: null` — not Production) |
| Inspector | https://vercel.com/dhe-projects/tejas/VCF3L3uyatwFidKwL6rTKLjGq9V9 |
| Parent PR | https://github.com/dhevb/tejas/pull/71 |

---

## 15. Phase 2.1 / 2.2 follow-up

Authoritative documents:

- `TEJAS-PR72-PHASE2-1-OWNER-QA-REPORT.md` (metadata corrected in Phase 2.2)
- `TEJAS-PHASE2-2-OWNER-DECISION-AND-REMAINING-BLOCKERS.md` (**Owner decisions**)
- `docs/TEJAS-PHASE2-2-SECONDARY-STREAM-RPC-AND-PAYMENT-SCHEMA-DECISION.md` (Options A/B; **no SQL**)

Phase 2.2 verified Preview for PR #73 tip `d173d26`:  
https://tejas-7edcw033y-dhe-projects.vercel.app — `dpl_6UZievvEvDRZnLgdkPjDT6SKspRJ` — READY — Vercel **`target: preview`**.

Remote integration remains **BLOCKED** (Preview learn tables HTTP 404 after host-verified probe; no mutations). Blank English pages remain Owner blank-vs-replace. Authenticated Preview PDF QA remains blocked on approval gate.

**PREVIEW ONLY — WAITING FOR OWNER APPROVAL.** No merge / Production / SQL.
