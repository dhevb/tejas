# TEJAS Phase 2.8 — Restricted Preview Content-QA Execution Report

**Objective:** Temporary Preview-only publication for authenticated content-QA, then close after verification.  
**Target:** Preview `nbeslngnrsagarosuaab` only.  
**Authority:** Owner Decision 2 — `TEJAS-OWNER-DECISIONS-2026-11-28.md`  
**Branch tip at report:** `c1493b31429de83a0dd15d46543ac03e87978a9f` (+ subsequent decision commits)

---

## Verdict

# BLOCKED — PREVIEW LEARN SCHEMA NOT APPLIED (PUBLICATION NOT OPENED)

Owner publication approval is recorded and open/close SQL packs are prepared. Execution stopped because migrations 001/002 are still unapplied (`PGRST205` on all `tejas_learn_*`). Opening publication without schema would fail and is not attempted.

---

## 1. Target identity

| Check | Result |
|-------|--------|
| Preview ref | `nbeslngnrsagarosuaab` |
| Production | not selected |
| REST probe (2026-11-28T10:58Z) | Preview OK; learn tables missing |
| Dashboard SQL for agent | Sign-in wall |

## 2. Publication scope (prepared, not executed)

| Item | Value |
|------|-------|
| Open SQL | `preview-sql/phase28-restricted-qa/01-open-preview-qa-publication.sql` |
| Open SHA-256 | `BF277923E03AD6F5F3297A919DE0F1DE3BFD6E4387C002FBEA01F05E2E1FBCB1` |
| Close SQL | `preview-sql/phase28-restricted-qa/02-close-preview-qa-publication.sql` |
| Close SHA-256 | `EB4F6599178585FD115F1FAA61F80AFEE880F155A1C9D93D77CCBE567D893542` |
| Books / tests | 18 / 90 from `content/portal/catalog.json` |
| Storage | **unchanged / private** — scripts do not create buckets or public URLs |
| Auth model | Existing app session + `TEJAS_CONTENT_QA_*` allowlist; entitlements preserved for ordinary students |

## 3. How temporary QA access will be closed

After Preview QA finishes, Owner/agent runs **Step F** in `preview-sql/OWNER-PREVIEW-RESUME-RUNBOOK.md`:

1. Confirm Preview ref.  
2. Execute `02-close-preview-qa-publication.sql`.  
3. Verify books/tests / publication rows are `awaiting_approval`.  
4. Record close evidence in this report (append).

## 4. Test evidence (this turn)

| Area | Status |
|------|--------|
| Schema prerequisite | **FAIL / BLOCKED** |
| Option A / Eng-Math seed | Not reached |
| Open QA publication | **Not executed** |
| PDF / student / mobile / security QA on Preview | **Not executed** |
| Close QA publication | **Not executed** (nothing opened) |
| Local unit gates (prior) | 170/170 PASS at earlier tip |

## 5. Safeguards compliance (design)

- No Production publication/deploy/merge.  
- No public Storage.  
- No RLS/grant weakening in prepared SQL.  
- QA audit actor `owner-preview-qa` with explicit TEMP / Closed reasons.  

## 6. Resume path

Owner completes `preview-sql/OWNER-PREVIEW-RESUME-RUNBOOK.md` Steps A→E (or A→D then notify agent to open E via REST if preferred). Agent will verify publication rows and continue PDF/student/security QA, then run close (Step F) or instruct Owner to run close SQL.

---

**Production untouched. Publication not opened.**
