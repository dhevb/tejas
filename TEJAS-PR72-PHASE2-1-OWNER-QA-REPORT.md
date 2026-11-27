# TEJAS PR #72 — Phase 2.1 Owner QA Report

**Mode:** Preview-only. No merge of PR #71 / #72 / #73. No Production deploy/SQL.  
**Phase 2.2 follow-up:** see `TEJAS-PHASE2-2-OWNER-DECISION-AND-REMAINING-BLOCKERS.md`.

### Metadata (corrected Phase 2.2 — do not trust older rows)

| Item | Value | Evidence class |
|------|--------|----------------|
| Parent PR | https://github.com/dhevb/tejas/pull/71 | Verified |
| Correction PR (Phase 2) | https://github.com/dhevb/tejas/pull/72 | Verified |
| Phase 2.1 / 2.2 branch | `fix/pr72-phase2-1-utr-recovery-preview-qa` | Verified |
| Phase 2.1 PR | https://github.com/dhevb/tejas/pull/73 | Verified |
| Base of this branch | PR #72 head `e856edce48e9f2416fc83cc016ce14fecc9b2d70` | Verified |
| PR #73 head at Phase 2.2 start | `d173d261f65f5c485e347a69679221acdb14d8bf` | Verified (`gh pr view 73`) |
| PR #73 tip after Phase 2.2 docs push | `5ba010c5557577d7af618b248cf7fe600994071f` | Verified after push (SHA-align commit may advance tip by one) |
| Preview URL (for `d173d26`) | https://tejas-7edcw033y-dhe-projects.vercel.app | Verified — GitHub Deployments + `vercel inspect` |
| Deployment ID | `dpl_6UZievvEvDRZnLgdkPjDT6SKspRJ` | Verified |
| Deployment status | READY | Verified |
| Vercel `target` | **`preview`** (not null) | Verified — `npx vercel inspect` |
| Inspector | https://vercel.com/dhe-projects/tejas/6UZievvEvDRZnLgdkPjDT6SKspRJ | Verified |
| Superseded CLI Preview (86103b6-era) | https://tejas-8weocht3q-dhe-projects.vercel.app / `dpl_Bx9PqKVPY1ZiCGRt48duAmNn5xcL` | Historical only |

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

| Check | Result | Evidence class |
|-------|--------|----------------|
| Allowlist only `nbeslngnrsagarosuaab` | Enforced | Code |
| Hard-deny Production `zapccpipwxduzlnvjdmy` | Enforced | Code |
| Credentials present but suite skipped → PASS | **Fixed** — `assert.fail("BLOCKED:…")`; never silent PASS | Code |
| Windows CRLF `.env.preview` parse | **Fixed** in Phase 2.2 (`\r` broke `NAME=value` match) | Code |
| File-store substituted as remote proof | **No** | Policy |
| `vercel env pull` placeholders | Still `[SENSITIVE]` in pulled file | Local FS |
| Local `.env.preview` host | Preview allowlist host present | Local FS (no secret printed) |
| Read-only `tejas_learn_students` | HTTP **404** | Cursor-run probe |
| Remote mutations executed | **None** (aborted before writes) | Cursor-run |

**Result: BLOCKED** — `npm run test:preview-integration` fails with BLOCKED (learn tables not readable). **Not PASS.**

Unblock: Owner ensures Preview project has portal learn schema + usable Preview-only service_role in ignored `.env.preview`. Never paste secrets into chat.

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
| Preview integration | **BLOCKED** (learn tables HTTP 404 after host verify; no mutations) |
| `tsc --noEmit` | PASS |
| Lint | PASS (existing img warnings only) |
| Production build | PASS |
| Payment/UTR / entitlement tests | PASS |
| Login / identity / attempt / one-device / no-download | Preserved |

---

## 6. Blocked items (Owner)

See **`TEJAS-PHASE2-2-OWNER-DECISION-AND-REMAINING-BLOCKERS.md`** for the authoritative Owner checklist.

1. Preview learn schema readable (`tejas_learn_students` 404) + usable Preview-only credentials in ignored `.env.preview`.
2. RPC/schema Option A (interim secondary-stream) vs B (grouped payment) — proposals only; no SQL applied.
3. Authenticated Preview PDF QA — temporary Preview publication / content-QA authorization required.
4. Five blank English pages — confirm intentional blank or provide approved replacement sources.
5. Do not merge #71/#72/#73 or deploy Production without explicit Owner approval.

---

## 7. Production impact

**None.** No Production merge, deploy, SQL, Auth/RLS/Storage/env changes, or student/payment record mutation on Production.
