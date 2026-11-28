# TEJAS Final Independent Pre-Production Readiness Audit

**Audit mode:** Preview-only verification + local tests + documentation  
**Not authorized / not performed:** Production deploy, Production SQL, PR merge, public publication, Production env changes, force-push  

| Item | Value |
|------|--------|
| Repository | `dhevb/tejas` |
| Branch | `fix/pr72-phase2-1-utr-recovery-preview-qa` |
| Verified tip SHA | `627bf3a7cf8885721f8a28d74c4f4cebf02cff73` |
| Prior audited tip | `efeadface3fdc7a481fe8405102233bdb28fede4` |
| Preview Supabase | `nbeslngnrsagarosuaab` |
| Production Supabase | `zapccpipwxduzlnvjdmy` — **untouched this audit** |
| Production site | `https://tejas.dhe.org.in` — **untouched** |
| Closure time (UTC) | 2026-11-28T14:40Z |

---

## Final verdict

# READY WITH DOCUMENTED LIMITATIONS

Preview technical gates for learn schema, Option A integration evidence, inventory, browser/PDF QA, restricted QA closure, private Storage, unauthenticated PDF 401, and the PDF.js public-load fix are closed with evidence. Production remains blocked until Owner production authorization and ordered PR merge. Limitations below are real but are **not** Preview blockers that reverse Phase 2.8–2.10 closeout.

---

## Evidence legend

| Tag | Meaning |
|-----|---------|
| **VERIFIED** | Re-checked in this closure (files, hashes, REST, tests, browser, or git/gh) |
| **EVIDENCE-FILE** | Local gitignored JSON / prior report present and consistent; not fully re-executed |
| **CLAIM** | Prior report statement without fresh independent re-run |

---

## 1. Completed phases — independent check

| Gate | Status | How verified |
|------|--------|----------------|
| Migrations 001 + 002 on Preview | **VERIFIED present** | REST 200 on `tejas_learn_books` / `tejas_learn_tests`; hashes match readiness package |
| Option A SQL hash | **VERIFIED** | File SHA-256 `6E5B1A6A…5F86` |
| Option A 12/12 integration | **EVIDENCE-FILE** | `.local-qa/phase251-option-a-integration.json` → pass 12 / fail 0 / blocked 0; `targetRef` Preview; synthetic fixtures cleaned (8) |
| Live `pg_get_functiondef` Option A | **CLAIM / prior gap** | Post-apply report was BLOCKED on defs; integration PASS is behavioral evidence, not SQL body re-read |
| Inventory 18 books / 90 tests | **VERIFIED** | Live REST post-close: 18 books / 90 tests `awaiting_approval`; fees ₹49 / mock fee 0 |
| PDF browser QA | **EVIDENCE-FILE + prior session** | Access 18/18, PDF fetch 18/18, mock lifecycle 4/4, security PASS |
| FT companion rules | **EVIDENCE-FILE** | Access matrix `futureTech` both bands PASS |
| Restricted QA closed | **VERIFIED** | Live: books/tests all `awaiting_approval`; unauth PDF **401** |
| Private Storage | **VERIFIED** | `/storage/v1/bucket` → `publicBuckets: []` |
| Unauthenticated PDF HTTP 401 | **VERIFIED** | Post-close + PDF.js reader check on `next start :3001` → `unauthStatus: 401` |
| Unit tests | **VERIFIED** | `npm test` → **170 pass / 0 fail** (Phase A / prior independent audit) |
| PDF.js public-load fix | **VERIFIED + COMMITTED** | Commit `627bf3a`; hashes match `pdfjs-dist@5.4.296`; reader/browser/build PASS |

### Migration file hashes (re-measured)

| Order | File | SHA-256 | Preview |
|------:|------|---------|---------|
| 1 | `supabase/migrations/20261118000100_tejas_learning_portal.sql` | `D9A6746E52C035DCBFC0B1F8B5A9D357C8C7F427008687536C377B80BEFB3290` | Applied (REST tables live) |
| 2 | `supabase/migrations/20261118000200_tejas_learning_portal_durable.sql` | `67A15470352809FC26A0DFE79EBE3E9898C8F86083A6569F4785336215C963B3` | Applied |
| 3 | `supabase/migrations/20261128000100_tejas_learn_option_a_multistream_payment.sql` | `6E5B1A6ABC36B51652E0B3094B6D08EA580FEA6B491DA5FAE329CB7202C35F86` | Applied (behavioral via 12/12) |
| 4 | `supabase/migrations/20261128000200_tejas_learn_eng_math_metadata_seed.sql` | `E22B8CDFB281B44A905E62981A89C63771D164FC382B9F5A660E0464947C808D` | Applied (18/90 present) |

---

## 2. PDF.js fix — Phase A closure

### Commit

| Field | Value |
|-------|--------|
| SHA | `627bf3a7cf8885721f8a28d74c4f4cebf02cff73` |
| Message | Load pdf.js from public assets to avoid Next webpack eval breakage. |
| Files | `app/learn/books/[bookId]/reader.tsx`, `scripts/copy-pdfjs-assets.mjs`, `types/pdfjs-public.d.ts` |

### Integrity **VERIFIED** (2026-11-28T14:35Z)

| Asset | SHA-256 | Match `node_modules/pdfjs-dist@5.4.296` |
|-------|---------|----------------------------------------|
| `public/pdfjs/pdf.min.mjs` | `343B4166…BAF4A` | **YES** |
| `public/pdfjs/pdf.worker.min.mjs` | `DBCAE78A…B75D5` | **YES** |

### Configuration

| Check | Result |
|-------|--------|
| Reader load | `import(/* webpackIgnore: true */ "/pdfjs/pdf.min.mjs")` |
| Worker src | `/pdfjs/pdf.worker.min.mjs` |
| wasm / standard fonts | copied to `/public/pdfjs/` by `scripts/copy-pdfjs-assets.mjs` |
| `isEvalSupported: false` | retained |
| `/public/pdfjs` gitignored | **YES** (`.gitignore` line `/public/pdfjs`) |
| Generated at `dev`/`build` | copy script supplies assets; not committed |

### Test evidence

| Test | Result | Evidence |
|------|--------|----------|
| Unit suite | **170/170 PASS** | prior Phase A / independent audit `npm test` |
| Hash match vs package | **PASS** | `.local-qa/phase-final-pdfjs-reader-check.json` `shaPublicMatchesPackage: true` |
| Reader HTTP check (`next start :3001`) | **PASS** | login 200, pdf.min 200, worker 200, unauth 401, authed unpublished 403 |
| Browser `getDocument` (`next start`) | **PASS** | Runtime.evaluate → `{ ok: true, pages: 1 }`; `.local-qa/phase-final-pdfjs-browser-import-prod.json` |
| Browser import (`next dev`, earlier) | **PASS** | `.local-qa/phase-final-pdfjs-browser-import.json` |
| Production `next build` | **PASS** | `.local-qa/phase-final-next-build.log` `BUILD_EXIT=0` |
| Post-close inventory/security | **PASS** | `.local-qa` post-close verify: 18/90 closed, `publicBuckets: []`, unauth 401 |

### Regression

- Only student book reader uses this path.
- Publication remains closed: authenticated file fetch correctly returns **403** for unpublished books (not a regression).
- No second PDF reader surface found under learn routes.

---

## 3. Git hygiene and PII review (Phase B)

### Tip and tracking **VERIFIED**

- HEAD = `627bf3a…` (PDF.js commit on top of `efeadfa`).
- Branch: `fix/pr72-phase2-1-utr-recovery-preview-qa` — **ahead 1** of origin (PDF.js commit not pushed; no force-push).
- No history rewrite performed.

### File categorization

| Class | Items | Commit disposition |
|-------|-------|--------------------|
| Application code | PDF.js fix (reader, copy script, ambient types) | **Committed** as `627bf3a` |
| Approved TEJAS documentation | Final audit / acceptance / readiness + Phase 2.8–2.10 reports | Eligible for docs commit; no secrets |
| Generated assets | `/public/pdfjs/*`, `.next/`, `.local-qa/*` | **gitignored** — not staged |
| Secrets / env | `.env*`, `.env.preview` | **gitignored** — not staged |
| Sensitive exports / personal data | `TEJAS-PRODUCTION-SCHOOLS-REGISTERED.csv`, `TEJAS-PRODUCTION-REGISTERED-SCHOOLS-STATE-DISTRICT-WISE.xlsx`, `.local-qa/**/*.csv|xlsx` | **NOT committed** — no PII clearance documented |

### Staging safety

- No secrets, tokens, environment files, student details, payment proofs, or UTRs staged.
- `git check-ignore` confirms `.env.preview`, `/public/pdfjs`, `.local-qa/` ignored.

### PR stack **VERIFIED** via `gh` (2026-11-28T14:35Z)

| PR | State | Mergeable | Notes |
|----|-------|-----------|-------|
| [#71](https://github.com/dhevb/tejas/pull/71) | OPEN | MERGEABLE | Base of stack |
| [#72](https://github.com/dhevb/tejas/pull/72) | OPEN | MERGEABLE | Payment / UTR |
| [#73](https://github.com/dhevb/tejas/pull/73) | OPEN | MERGEABLE | Tip lineage; PDF.js commit still local until push |

Merge order required: **#71 → #72 → #73**. **No merge performed.**

---

## 4. Payment and student security (recheck)

| Control | Status | Basis |
|---------|--------|-------|
| ₹49 fee | **VERIFIED** live metadata; RPC SQL `p_amount is distinct from 49` |
| Multi-stream (Option A) | **EVIDENCE-FILE** 12/12 Preview integration |
| UTR uniqueness / no free overwrite | **EVIDENCE-FILE** + unit suite; app-layer idempotent guard before RPC |
| Idempotency / concurrency | **EVIDENCE-FILE** (cases in 12/12) + unit **170** PASS |
| Entitlement preservation | Migrations additive; Option A does not rewrite rows (**CLAIM**/design review) |
| Student identity isolation | Attempts scoped by `studentId`; foreign attempt denied in mock lifecycle |
| FT companion / no second charge | **EVIDENCE-FILE** access matrix |
| One-device login | Code: `session_version` + `tejas_learn_rotate_session` (**VERIFIED** in migrations/grants) |
| Session expiration | Logout → PDF 401 **VERIFIED** |
| Storage privacy | **VERIFIED** no public buckets |

No real payments or student-row edits in this closure.

---

## 5. Production migration readiness inventory

**Do not execute on Production.**

| # | Filename | SHA-256 | Preview | Prod compatibility | Dependencies | Data impact | Rollback | Preflight |
|---|----------|---------|---------|-------------------|--------------|-------------|----------|-----------|
| 1 | `20261118000100_tejas_learning_portal.sql` | `D9A6746E…B3290` | Applied | Additive learn tables | None | Creates empty learn schema; no Olympiad/UTR drop | Drop learn objects only with Owner approval; never drop `tejas_payment_utrs` | Confirm target `zapccpipwxduzlnvjdmy`; backup; hash match |
| 2 | `20261118000200_tejas_learning_portal_durable.sql` | `67A15470…C963B3` | Applied | Additive + FT seed + RPCs | After 001 | FT book/test seed; service_role grants | Restore RPC bodies / delete seeded FT rows if required | 001 verified; staff/UTR tables intact |
| 3 | `20261128000100_tejas_learn_option_a_multistream_payment.sql` | `6E5B1A6A…5F86` | Applied | Replaces report/review RPC bodies only | After 001+002 | No row rewrite; changes eligibility predicate | `preview-sql/phase25-option-a/02-rollback-to-primary-stream-eq.sql` (adapt for Prod only when authorized) | Preview 12/12 PASS; fee 49 gate present |
| 4 | `20261128000200_tejas_learn_eng_math_metadata_seed.sql` | `E22B8CDF…C808D` | Applied | Metadata seed eng/math | After 001+002 | Inserts awaiting_approval eng/math books/tests | Delete seeded eng/math learn metadata only | Catalog alignment; no PDF replace |

**App deploy** of reviewed tip is separate from SQL and requires merge of stacked PRs + Owner Production deploy authorization.

---

## 6. Documented limitations (why not unqualified READY)

1. **Option A live SQL body** not re-read via `pg_get_functiondef` this cycle — reliance on behavioral 12/12 evidence file.  
2. **`tejas_learn_set_publication` RPC** returned 2xx without column mutation during close; Preview closed via REST PATCH matching approved SQL — process limitation for future publication ops.  
3. **Stacked PRs #71–#73** must merge in order; tip alone is not on `main`. PDF.js commit `627bf3a` is local (**ahead 1**) until Owner authorizes push.  
4. **Production window** still requires explicit Owner auth, backup, hash re-verify, and no public publication by default.  
5. Large **untracked** school export artifacts remain on disk — treat as sensitive; not committed.

PDF.js public-load fix is **no longer** a limitation (committed + tested).

---

## 7. Deliverables in this closure

| File | Action |
|------|--------|
| `TEJAS-FINAL-INDEPENDENT-RELEASE-AUDIT.md` | **Updated** to tip `627bf3a` + Phase A–D evidence |
| `TEJAS-FINAL-PREVIEW-ACCEPTANCE-REPORT.md` | **Updated** |
| `TEJAS-PRODUCTION-READINESS-PACKAGE.md` | **Updated** |

---

## 8. Owner next steps (no execution here)

1. Authorize push of PDF.js commit `627bf3a` (and any approved docs commit) to update PR #73.  
2. Merge stack **#71 → #72 → #73** only after review.  
3. Separate Production authorization before any SQL/deploy on `zapccpipwxduzlnvjdmy`.  
4. Keep temporary publication closed until intentional Owner publication decision.  
5. Decide disposition of school CSV/XLSX exports (PII review) — do not commit until cleared.

---

**READY WITH DOCUMENTED LIMITATIONS** — Production untouched; no merge; no deployment.
