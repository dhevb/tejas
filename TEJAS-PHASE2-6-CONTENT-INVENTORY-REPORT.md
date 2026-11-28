# TEJAS Phase 2.6 — Seed and Content Inventory

**Objective:** Verify 18 books / 90 mocks inventory and FT companion rules; prepare Eng/Math DB metadata seed from approved catalog.  
**Target:** Repo catalog + Preview DB (when available).  
**Safety:** No invented PDFs/questions; no publication; Preview-only seed when applied.

---

## Verdict

# PARTIAL PASS — REPO INVENTORY VERIFIED; PREVIEW DB SEED NOT APPLIED

## Repository inventory (PASS)

| Stream | Books | Mock tests | Evidence |
|--------|------:|-----------:|----------|
| English | 8 | 40 | `content/portal/catalog.json` |
| Mathematics | 8 | 40 | same |
| Future Tech | 2 | 10 | same |
| **Total** | **18** | **90** | exact |

- Catalog `publicationStatus`: `awaiting_approval` (not public).  
- PDF sources present for all 18 catalog books; integrity SHA-256 match (Phase 2.9).  
- Extra source PDFs (2 FT originals) present but not additional catalog books.

## Future Tech rules (app-layer, unit-tested)

| Rule | Status |
|------|--------|
| Book 1 classes 6–8 | PASS (`assignedClasses`) |
| Book 2 classes 9–10 | PASS |
| Class 9–10 Book 2 purchase allows Book 1 companion reading | PASS (`lib/portal/multi-stream.test.ts`) |
| Companion does not unlock Book 1 mocks | PASS (same suite) |
| Book 2 does not create second FT fee | PASS |

## Preview database inventory

| Object | Status |
|--------|--------|
| `tejas_learn_books` / tests | **Missing** (`PGRST205`) — blocked on 2.4.2 |
| FT seed from migration 002 | **Not applied** |
| Eng/Math DB metadata | **Prepared, not applied** |

### Prepared Eng/Math metadata seed (from catalog only)

| File | SHA-256 | Rows |
|------|---------|------|
| `supabase/migrations/20261128000200_tejas_learn_eng_math_metadata_seed.sql` | `E22B8CDFB281B44A905E62981A89C63771D164FC382B9F5A660E0464947C808D` | 16 books, 16 class rows, 80 tests |
| `preview-sql/phase26-content-seed/01-eng-math-metadata-seed.sql` | same | same |

Questions/options remain in `catalog.json` (90 × 25). Migration 002 historically seeds **test metadata only**, not question rows — same pattern followed here. Full question SQL seed is a separate optional follow-up if remote scoring requires DB rows.

## Not performed

- Preview/Production seed apply  
- Book publication  
- Fabricated content  

**Next:** After 2.4.2, apply FT seed (via 002) then Eng/Math metadata seed on Preview; verify counts via SQL/REST.
