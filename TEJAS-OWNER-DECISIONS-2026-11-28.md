# TEJAS Owner Decisions — 28 November 2026

**Branch:** `fix/pr72-phase2-1-utr-recovery-preview-qa`  
**Tip at decision recording:** `c1493b31429de83a0dd15d46543ac03e87978a9f`  
**Preview Supabase:** `nbeslngnrsagarosuaab`  
**Production Supabase:** `zapccpipwxduzlnvjdmy` — not authorized

---

## Decision 1 — Five blank PDF pages

**Status:** **ACCEPTED AS INTENTIONALLY BLANK**

| Book | Pages |
|------|------:|
| English Class 7 (`eng-class-07-ebook.pdf`) | 6, 74, 76 |
| English Class 10 (`eng-class-10-ebook.pdf`) | 6, 80 |

### Binding actions

- Record as Owner-accepted intentional blanks.  
- Update PDF QA and Final Preview Acceptance reports.  
- **Do not** replace, edit, annotate, or fabricate these pages.  
- **Do not** treat them as unresolved content blockers.

Evidence of genuine blankness (prior probe): `TEJAS-PHASE2-7-BLANK-PDF-PAGE-INVESTIGATION.md` / `.local-qa/phase27-29-pdf-inventory.json`.

Companion record: `TEJAS-PHASE2-7-BLANK-PAGE-OWNER-ACCEPTANCE.md`.

---

## Decision 2 — Temporary restricted Preview content-QA publication

**Status:** **APPROVED** (Preview only)

### Permitted

- Preview-only QA publication on `nbeslngnrsagarosuaab`.  
- Restricted authenticated test access.  
- Necessary Preview-only test records and content metadata.  
- Verification of real student reading and PDF rendering flows.  
- Temporary QA content availability during testing.

### Mandatory safeguards

- Verify Preview project identity before every remote operation.  
- Keep Storage private.  
- Use authenticated access and existing authorization checks.  
- Preserve entitlement enforcement.  
- No permanent public PDF URLs.  
- Do not weaken RLS, grants, authentication, or session controls.  
- Do not use Production records or credentials.  
- Keep QA data clearly identifiable as test data.  
- Document publication scope and how temporary QA access is closed after testing.

### Explicitly not authorized

- Production publication  
- Public website release  
- Production database / deploy / PR merge  
- Public Storage buckets  
- Security or entitlement bypasses  

Companion execution report: `TEJAS-PHASE2-8-RESTRICTED-PREVIEW-CONTENT-QA-EXECUTION-REPORT.md`.

---

## Execution implication

Agent may proceed through authorized Preview phases without re-asking for these two decisions.  
**Hard stop remains** if Preview SQL executor / Dashboard session is unavailable for DDL (current state as of probe below).

### Migration / QA status update (UTC 2026-11-28T11:46Z)

| Check | Result |
|-------|--------|
| Target ref | `nbeslngnrsagarosuaab` |
| Migrations 001/002 | **Applied and verified** |
| Eng/Math inventory | **18 / 90 present** |
| Temporary QA publication | **OPEN** (close pending) |
| Option A RPC | **Not applied** — Owner Step C remaining |
| Preview DB URL / Dashboard session for agent | Still unavailable for DDL (Option A needs Owner SQL Editor) |
