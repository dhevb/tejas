# TEJAS Final Preview Acceptance Report

**Branch:** `fix/pr72-phase2-1-utr-recovery-preview-qa`  
**Tip SHA at acceptance drafting:** `36972a382c67727401c02de8b772fee8bdf75eb7` (phase docs pack; prior schema tip `a49d9771e0e8f88c3fece126fa18f6e6dccd9fa5`)  
**Preview Supabase:** `nbeslngnrsagarosuaab`  
**Production Supabase:** `zapccpipwxduzlnvjdmy` — **untouched**  
**Production site:** `https://tejas.dhe.org.in` — **untouched**

---

## Final verdict

# PREVIEW PARTIALLY ACCEPTED — OWNER BLOCKERS REMAIN

**Owner decisions 2026-11-28:** blanks **accepted intentional**; temporary Preview content-QA publication **approved and OPEN** on Preview (close pending). See `TEJAS-OWNER-DECISIONS-2026-11-28.md`.

---

## Phase status

| Phase | Status | Evidence |
|-------|--------|----------|
| 2.4.2 Preview migrations 001→002 | **PASS** | Both applied + REST verified |
| 2.5 Option A RPC | **BLOCKED** | SQL prepared; secondary-stream still refused live |
| 2.6 Content inventory | **PASS** | Preview DB 18 books / 90 mocks |
| 2.7 Blank PDF pages | **PASS — Owner accepted intentional** | Not a content blocker |
| 2.8 Restricted Preview QA | **PARTIAL PASS** | Publication OPEN; content-QA access PASS; close pending |
| 2.9 PDF QA (18) | **PARTIAL PASS** | Local integrity PASS; authenticated reader probe PASS; browser visual deferred |
| 3.0 Payment/entitlement E2E Preview | **PARTIAL** | Primary+FT companion PASS; multi-stream Option A blocked |
| 3.1 Security + regression | **PARTIAL PASS** | Units PASS; integration blocked only on Option A |
| 3.2 Final acceptance | this document | — |
| 3.3 Production readiness package | prepared docs only | No Production execution |

---

## Database project identity

- Active REST probe target: **Preview** `nbeslngnrsagarosuaab`  
- Learn schema: **absent** (`PGRST205`)  
- Preserved: `tejas_payment_utrs`, `tejas_staff_sessions`

## Migration history

| Migration | Applied on Preview? |
|-----------|---------------------|
| `20261118000100_tejas_learning_portal.sql` | **Yes** (verified) |
| `20261118000200_tejas_learning_portal_durable.sql` | **Yes** (verified) |
| `20261128000100_tejas_learn_option_a_multistream_payment.sql` | **No** — **Owner Step C remaining** |
| Eng/Math metadata | **Yes** (18/90 present; seed file prepared earlier) |

## Test evidence

- Unit: **170 pass / 0 fail** (`npm test`)  
- TypeScript: **PASS**  
- Lint: **PASS** (2 pre-existing img warnings)  
- Preview integration: designed to **fail closed** while schema missing  

## PDF QA matrix

See `TEJAS-PHASE2-9-PDF-DELIVERY-AND-VISUAL-QA.md` — 18/18 local integrity PASS; eng-07 pages 6/74/76 and eng-10 pages 6/80 documented as genuine blanks.

## Security findings

- No new public Storage / download/print bypass introduced.  
- Preview isolation allowlists reject Production ref.  
- Live Preview RLS/RPC grant verification pending schema apply.

## Known limitations

1. Preview learn schema not applied.  
2. Option A not live.  
3. Eng/Math DB metadata not seeded.  
4. Question rows not SQL-seeded (catalog remains source of truth for content packs).  
5. ~~Five blank English pages~~ → **Owner-accepted intentional (2026-11-28).**  
6. Authenticated Preview browser/PDF signed-delivery suite not completed (blocked on schema).  
7. Temporary QA publication approved but not opened/closed yet.

## Outstanding Owner actions

1. **Step C only:** apply Option A SQL from `preview-sql/OWNER-PREVIEW-RESUME-RUNBOOK.md` on Preview.  
2. After agent re-verifies payment matrix, authorize/run **Step F** to close temporary QA publication.  
3. Optional: Preview-only `PREVIEW_SUPABASE_DB_URL` in ignored `.env.preview` (never in chat).

## Production readiness recommendation

**Do not promote to Production** until blockers 1–3 are cleared, Option A matrix PASSes on Preview, and blank-page decision is recorded. See `TEJAS-PRODUCTION-READINESS-PACKAGE.md` for the frozen checklist (docs only).

---

**PREVIEW PARTIALLY ACCEPTED — OWNER BLOCKERS REMAIN**
