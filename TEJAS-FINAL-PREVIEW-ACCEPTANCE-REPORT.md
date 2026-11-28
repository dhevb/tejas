# TEJAS Final Preview Acceptance Report

**Branch:** `fix/pr72-phase2-1-utr-recovery-preview-qa`  
**Tip SHA at acceptance drafting:** `36972a382c67727401c02de8b772fee8bdf75eb7` (phase docs pack; prior schema tip `a49d9771e0e8f88c3fece126fa18f6e6dccd9fa5`)  
**Preview Supabase:** `nbeslngnrsagarosuaab`  
**Production Supabase:** `zapccpipwxduzlnvjdmy` — **untouched**  
**Production site:** `https://tejas.dhe.org.in` — **untouched**

---

## Final verdict

# PREVIEW PARTIALLY ACCEPTED — OWNER BLOCKERS REMAIN

---

## Phase status

| Phase | Status | Evidence |
|-------|--------|----------|
| 2.4.2 Preview migrations 001→002 | **BLOCKED** | No Dashboard session / Preview DB URL; Owner pack ready |
| 2.5 Option A RPC | **BLOCKED** (SQL prepared) | Migration hash-locked; not applied |
| 2.6 Content inventory | **PARTIAL PASS** | Repo 18/90 verified; DB seed prepared, not applied |
| 2.7 Blank PDF pages | **PASS (Owner decision)** | 5 pages genuinely blank in source |
| 2.8 Restricted Preview QA | **DESIGN READY / BLOCKED exec** | Content-QA path exists; needs schema + Owner Preview publication decision |
| 2.9 PDF QA (18) | **PARTIAL PASS** | Local integrity PASS; remote delivery deferred |
| 3.0 Payment/entitlement E2E Preview | **BLOCKED** | Schema missing |
| 3.1 Security + regression | **PARTIAL PASS** | 170 unit tests PASS; tsc PASS; lint PASS |
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
| `20261118000100_tejas_learning_portal.sql` | **No** |
| `20261118000200_tejas_learning_portal_durable.sql` | **No** |
| `20261128000100_tejas_learn_option_a_multistream_payment.sql` | **No** (prepared) |
| `20261128000200_tejas_learn_eng_math_metadata_seed.sql` | **No** (prepared) |

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
5. Five blank English pages await Owner accept-or-replace.  
6. Authenticated Preview browser/PDF signed-delivery suite not completed.

## Outstanding Owner decisions

1. Run `preview-sql/phase242-owner-apply/` on Preview SQL Editor (confirm ref in URL).  
2. After verify: Option A pack `preview-sql/phase25-option-a/`.  
3. Eng/Math seed `preview-sql/phase26-content-seed/`.  
4. Blank pages: accept intentional **or** supply replacement PDFs.  
5. Temporary Preview-only publication for restricted QA (no Production publish).  
6. Optional: place Preview-only `PREVIEW_SUPABASE_DB_URL` in ignored `.env.preview` (never in chat) for agent resume.

## Production readiness recommendation

**Do not promote to Production** until blockers 1–3 are cleared, Option A matrix PASSes on Preview, and blank-page decision is recorded. See `TEJAS-PRODUCTION-READINESS-PACKAGE.md` for the frozen checklist (docs only).

---

**PREVIEW PARTIALLY ACCEPTED — OWNER BLOCKERS REMAIN**
