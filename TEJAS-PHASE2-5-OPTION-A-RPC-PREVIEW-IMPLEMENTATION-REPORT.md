# TEJAS Phase 2.5 — Option A RPC Preview Implementation Report

**Objective:** Remove only the primary-stream equality predicate from Preview payment report/review RPCs so secondary unpaid streams can be paid at ₹49 + one UTR each.  
**Target:** Preview `nbeslngnrsagarosuaab` only.  
**Safety boundary:** No Production SQL; no Option B; no UTR release; no fee/class/ownership weakening.

---

## Verdict

# BLOCKED — SCHEMA PREREQUISITE (2.4.2 NOT APPLIED)

Option A SQL is **prepared and hash-locked** in-repo. It was **not applied** because Preview learn schema (migrations 001+002) is still absent (`PGRST205`). Applying Option A before 001/002 would fail (`CREATE OR REPLACE` against missing entitlement/student/book relations used in function bodies is fine for OR REPLACE of functions that reference tables — actually CREATE OR REPLACE FUNCTION can succeed even if tables missing until call time... but we must not apply Option A before verifying baseline 002 functions exist per Owner order).

Per master plan: apply Option A **after** learn schema is verified.

---

## Prepared artifacts

| Artifact | Path | SHA-256 |
|----------|------|---------|
| Option A migration | `supabase/migrations/20261128000100_tejas_learn_option_a_multistream_payment.sql` | `6E5B1A6ABC36B51652E0B3094B6D08EA580FEA6B491DA5FAE329CB7202C35F86` |
| Owner pack copy | `preview-sql/phase25-option-a/01-option-a-multistream-payment.sql` | same |
| Rollback | `preview-sql/phase25-option-a/02-rollback-to-primary-stream-eq.sql` | `8BB3B28F3482780EFD319C053E41BBAA70DD6C9DE41041D7A770E1FC9A91B0A1` |
| Instructions | `preview-sql/phase25-option-a/00-OWNER-INSTRUCTIONS.md` | — |

## Exact change

Removes **only**:

```sql
and books.stream_id = students.stream_id
```

from `tejas_learn_report_payment` and `tejas_learn_review_payment`.

**Retained:** fee = 49, class eligibility via `tejas_learn_book_classes`, student/book ownership, status gates, reference length, unique payment reference, `SECURITY DEFINER` + `search_path = pg_catalog`, EXECUTE `service_role` only.

## Live Preview comparison

| Check | Result |
|-------|--------|
| Live function defs readable via SQL | **Blocked** — no Preview Postgres executor |
| REST learn schema | Still `PGRST205` |
| Design vs Phase 2.3 review | Matches |

## Test matrix (not run on Preview)

All Option A remote cases remain **BLOCKED** until 2.4.2 + this SQL apply. Local unit coverage for multi-stream / UTR / companion rules: **PASS** (see Phase 3.1).

## Not performed

- Preview/Production RPC apply  
- Option B  
- Data mutation  
- Secret exposure  

**Next:** Complete 2.4.2 Owner Dashboard apply → verify schema → apply Option A on Preview → run payment matrix.
