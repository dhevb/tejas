# TEJAS Phase 2.4.2 — Preview Migration Execution Report

**Report update (UTC):** 2026-11-28T11:46Z  
**Branch:** `fix/pr72-phase2-1-utr-recovery-preview-qa`  
**Verification tip (pre-commit):** see latest commit after this update  
**Target:** Preview `nbeslngnrsagarosuaab`  
**Production:** `zapccpipwxduzlnvjdmy` — untouched

---

## Final verdict

# BOTH PREVIEW MIGRATIONS APPLIED AND VERIFIED

Owner applied schema outside the agent Dashboard session. Agent verified via Preview REST (service_role) on exact ref `nbeslngnrsagarosuaab`.

---

## 1. Authorization and target

| Item | Evidence |
|------|----------|
| Preview ref | `nbeslngnrsagarosuaab` (`isExactPreview: true`) |
| Production selected | **No** |
| Agent Dashboard | Still sign-in wall; apply was Owner-side |

## 2. Hashes (unchanged vs 2.4.1 review)

| File | SHA-256 | Match |
|------|---------|-------|
| `20261118000100_tejas_learning_portal.sql` | `D9A6746E52C035DCBFC0B1F8B5A9D357C8C7F427008687536C377B80BEFB3290` | YES |
| `20261118000200_tejas_learning_portal_durable.sql` | `67A15470352809FC26A0DFE79EBE3E9898C8F86083A6569F4785336215C963B3` | YES |

## 3. History before / after

| When | State |
|------|-------|
| Before (prior probe) | All `tejas_learn_*` → `PGRST205` |
| After (2026-11-28T11:38Z+) | All probed learn tables HTTP **200** |

## 4. Execution results

| Migration | Result |
|-----------|--------|
| 001 tables | **PASS** — students, audit, books, book_classes, tests, questions, options, entitlements, attempts present |
| 002 durable | **PASS** — publication, staff, staff_sessions; FT seed present; RPCs callable (`register`, `report_payment`, `review_payment`, `set_publication`) |

## 5. Schema / RPC evidence

- Books: **18** (english 8, mathematics 8, technology 2)  
- Tests: **90**  
- Book-class rows: **21**  
- `tejas_payment_utrs`: HTTP 200 (intact)  
- `tejas_staff_sessions`: HTTP 200 (intact)  
- Primary-stream payment report: **204 success**  
- Bad fee 48: **rejected**  
- Secondary-stream report: still rejected → Option A **not** in live RPC (separate phase)

## 6. Preservation

UTR registry and staff sessions remain selectable; no Production changes.

## 7. Integration

Preview integration progresses past enrolment after name-validation fix; blocked only on Option A secondary-stream predicate (expected until Step C).

## 8. Production / merge / publication

Production untouched. Temporary Preview QA publication handled under Phase 2.8 (Decision 2) — not a Production publish.

---

**BOTH PREVIEW MIGRATIONS APPLIED AND VERIFIED**
