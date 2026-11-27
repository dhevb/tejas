# TEJAS PR #72 — Phase 2.1 Owner QA Report

**Mode:** Preview-only. No merge of PR #71 / #72 / this correction PR. No Production deploy/SQL.

| Item | Value |
|------|--------|
| Parent PR | https://github.com/dhevb/tejas/pull/71 |
| Correction PR (Phase 2) | https://github.com/dhevb/tejas/pull/72 |
| Phase 2.1 branch | `fix/pr72-phase2-1-utr-recovery-preview-qa` |
| Phase 2.1 PR | https://github.com/dhevb/tejas/pull/73 |
| Base of this branch | PR #72 head `e856edce48e9f2416fc83cc016ce14fecc9b2d70` |
| Final commit SHA | `ad4a42044a639a5787b6c23036780064607f59bf` |
| Preview URL | https://tejas-8weocht3q-dhe-projects.vercel.app |
| Deployment ID | `dpl_Bx9PqKVPY1ZiCGRt48duAmNn5xcL` |
| Deployment status | READY (`target: null` — Preview only, not Production) |
| Inspector | https://vercel.com/dhe-projects/tejas/Bx9PqKVPY1ZiCGRt48duAmNn5xcL |

---

## 1. UTR reservation and failure recovery

### Behaviour

- Exact bank UTR preserved; no fabricated secondary UTRs.
- Valid claimed UTR is **never released** after claim (even if entitlement update fails).
- Malformed UTR rejected **before** registry write (`utrIsClaimableFormat`).
- Same student + same book + same UTR → idempotent retry (`shouldAcceptIdempotentRetry`).
- Different UTR cannot overwrite reported/verified payment.
- Concurrent same-UTR claims: only one wins (file-store + unit coverage).
- Verification still stream-scoped (unrelated stream not unlocked).

### Atomicity

Claim and payment report are **not** one DB transaction. Recovery is **idempotent same-owner retry** using existing schema — no new release path that would allow reuse.

Helpers: `lib/portal/utr-payment-recovery.ts` wired in `lib/portal/store.ts` (`heldFailure`).

### Tests (`lib/portal/utr-payment-recovery.test.ts` + multi-stream/portal)

| Case | Result |
|------|--------|
| Failure immediately after UTR claim | PASS (UTR held; retry message) |
| Failure after payment report | PASS |
| Failure during entitlement update | PASS |
| Retry same UTR | PASS (idempotent) |
| Retry different UTR | PASS (blocked) |
| Simultaneous same UTR | PASS (one claim wins) |
| Duplicate UTR other student | PASS (denied) |
| Transient DB failure recovery path | PASS (heldFailure transient) |

### Schema / RPC limitation (NOT applied)

Remote `tejas_learn_report_payment` still requires `books.stream_id = students.stream_id`, blocking secondary-stream report on Preview Supabase. Proposal documented in `docs/TEJAS-PR71-PHASE2-PAYMENT-GROUP-SCHEMA-PROPOSAL.md`. **No SQL executed.**

---

## 2. Preview Supabase integration

| Check | Result |
|-------|--------|
| Allowlist only `nbeslngnrsagarosuaab` | Enforced |
| Hard-deny Production `zapccpipwxduzlnvjdmy` | Enforced |
| Credentials present but suite skipped → PASS | **Fixed** — suite uses `assert.fail("BLOCKED:…")` when credentials missing/placeholder; never silent PASS |
| File-store substituted as remote proof | **No** |
| Remote mutations executed | **No** |

**Result: BLOCKED** — local Preview env pull yields `[SENSITIVE]` placeholders only. Command: `npm run test:preview-integration` → fail with BLOCKED message (not PASS).

Unblock: Owner-provided local ignored `.env.preview` / `.local-qa/.env.preview.supabase` with Preview URL + service role for `nbeslngnrsagarosuaab` only.

---

## 3. Multi-stream payment UI

Interim rule preserved: multi-stream enrol; ₹49 + one real UTR per unpaid stream; no grouped single-UTR presentation.

UI copy added on `/learn/pay` and dashboard buy-more section stating each unpaid stream needs its own ₹49 transfer and exact UTR.

---

## 4. PDF visual QA

### Preview authenticated reader

**BLOCKED** — Preview `/learn` shows all books **awaiting organisational approval**; unpaid/paid students cannot open unpublished PDFs in the portal reader.

### Browser rendering of source PDFs (local pdf.js canvas viewer)

Evidence: `.local-qa/pdf-visual-qa/evidence.json` (gitignored). Desktop Chromium rendered pages from `content/portal/sources`.

| File | Page | Rendered image | ops / textChars | Verdict |
|------|------|----------------|-----------------|---------|
| eng-class-07-ebook.pdf | 6 | Blank white | 0 / 0 | Empty source page — **Owner: confirm intentional blank or replace source** |
| eng-class-07-ebook.pdf | 74 | Blank white | 0 / 0 | Same |
| eng-class-07-ebook.pdf | 76 | Blank white | 0 / 0 | Same |
| eng-class-10-ebook.pdf | 6 | Blank white | 0 / 0 | Same |
| eng-class-10-ebook.pdf | 80 | Blank white | 0 / 0 | Same |
| eng-class-07-ebook.pdf | 7 (spot) | Nouns chapter OK | 538 / 1292 | PASS |
| math-class-07-ebook.pdf | 5 (spot) | Practice Qs OK | 5 / 0 | PASS (image/vector page) |
| ft-book-1-ebook.pdf | 8 fit-width | IoT intro OK | 534 / 1910 | PASS |
| ft-book-2-ebook.pdf | 10 fit-width | ESP32 section OK | 722 / 1797 | PASS |

Original sources preserved. No fabricated replacement content. Private delivery / no-download / no-print / one-device unchanged in code.

---

## 5. Regression

| Check | Result |
|-------|--------|
| Unit tests (`npm test`) | **170 pass / 0 fail** |
| UTR recovery tests | Included in unit suite |
| Preview integration | **BLOCKED** (credentials) |
| `tsc --noEmit` | PASS |
| Lint | PASS (existing img warnings only) |
| Production build | PASS |
| Payment/UTR / entitlement tests | PASS |
| Login / identity / attempt / one-device / no-download | Preserved |

---

## 6. Blocked items (Owner)

1. Preview Supabase service-role credentials for real remote integration.
2. RPC/schema change for secondary-stream `tejas_learn_report_payment` (proposal only).
3. Payment-group schema for true single-UTR multi-stream (proposal only).
4. Publish books on Preview (or content-QA publish) for authenticated portal PDF QA.
5. Decision on blank English pages (replace sources vs intentional blanks).

---

## 7. Production impact

**None.** No Production merge, deploy, SQL, Auth/RLS/Storage/env changes, or student/payment record mutation on Production.
