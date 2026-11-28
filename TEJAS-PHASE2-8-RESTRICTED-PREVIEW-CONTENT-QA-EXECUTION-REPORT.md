# TEJAS Phase 2.8 — Restricted Preview Content-QA Execution Report

**Authority:** Owner Decision 2 — `TEJAS-OWNER-DECISIONS-2026-11-28.md`  
**Target:** Preview `nbeslngnrsagarosuaab` only  
**Branch:** `fix/pr72-phase2-1-utr-recovery-preview-qa`

---

## Verdict

# PARTIAL PASS — QA PUBLICATION OPEN; ACCESS VERIFIED; CLOSE PENDING FULL MATRIX

## Target identity

| Check | Result |
|-------|--------|
| Preview ref | `nbeslngnrsagarosuaab` |
| Production used | **No** |

## Publication scope (executed)

| Action | Result |
|--------|--------|
| Open via `tejas_learn_set_publication` RPC (service_role) | **108/108 OK** (18 books + 90 tests) |
| `tejas_learn_publication` counts | `book:published` 18, `test:published` 90 |
| Sync `tejas_learn_books` / `tejas_learn_tests` columns | **108/108 OK** |
| Storage buckets / public URLs | **Not created** |
| Auth / RLS / grants | **Unchanged** |

Open reason actor: `owner-preview-qa` (TEMP Preview restricted content-QA).

Close SQL remains: `preview-sql/phase28-restricted-qa/02-close-preview-qa-publication.sql`  
Close helper: `node .local-qa/phase28-open-qa-publication.mjs close`

**Close status:** **NOT YET RUN** — deferred until Option A SQL + remaining browser/PDF matrix complete (temporary access still required for testing).

## Access evidence

Evidence file: `.local-qa/phase28-content-qa-access.json`

| Check | Result |
|-------|--------|
| Content-QA dashboard books | 18 |
| Published readable | 18 |
| eng-class-07 book + mock | PASS |
| mat-class-07 book + mock | PASS |
| ft-book-1 book + mock | PASS |
| ft-book-2 book | PASS |

Ordinary FT companion (non-QA): `.local-qa/phase-ft-companion-remote.json` — Book 2 pay unlocks Book 1 reading; Book 1 mocks stay locked; Book 2 mocks open — **PASS**.

## How temporary QA access will be closed

1. Confirm URL/ref `nbeslngnrsagarosuaab`.  
2. Run close script/SQL (Step F in resume runbook) **or** `node .local-qa/phase28-open-qa-publication.mjs close` with Preview env.  
3. Verify publication counts return to `awaiting_approval`.  
4. Append close evidence to this report.

## Remaining blockers for full Phase 2.8/3.0 closeout

1. **Option A RPC** not applied (secondary-stream payments still refused). Owner: run `preview-sql/phase25-option-a/01-option-a-multistream-payment.sql` on Preview only.  
2. Browser mobile/desktop visual PDF pass not completed this session.  
3. Close temporary publication after those complete.

## Not performed

- Production publication  
- Public Storage  
- Security weakening  
- PR merge / Production deploy  

---

**Production untouched. Preview QA publication currently OPEN (temporary).**
