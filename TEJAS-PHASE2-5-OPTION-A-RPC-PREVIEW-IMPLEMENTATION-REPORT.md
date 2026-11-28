# TEJAS Phase 2.5 — Option A RPC Preview Implementation Report

**Target:** Preview `nbeslngnrsagarosuaab` only  
**Safety:** No Production; no Option B; fee/class/UTR rules retained

---

## Verdict

# BLOCKED — OWNER SQL APPLY STILL REQUIRED

Live Preview probe (2026-11-28): secondary-stream `tejas_learn_report_payment` returns `payment report was not accepted` / app message “The payment reference could not be saved.” → primary-stream equality **still present**.

Schema 001/002 are applied; Option A file is prepared and hash-locked.

## Prepared artifact

| File | SHA-256 |
|------|---------|
| `supabase/migrations/20261128000100_tejas_learn_option_a_multistream_payment.sql` | `6E5B1A6ABC36B51652E0B3094B6D08EA580FEA6B491DA5FAE329CB7202C35F86` |
| Owner pack | `preview-sql/phase25-option-a/01-option-a-multistream-payment.sql` (same hash) |

## Evidence

| Case | Result |
|------|--------|
| Primary stream report | PASS |
| Secondary stream report | **FAIL** (predicate still active) |
| Invalid fee 48 | PASS (rejected) |
| Integration suite | BLOCKED at secondary stream (after enrolment fix) |

## Next

Owner runs Step C in `preview-sql/OWNER-PREVIEW-RESUME-RUNBOOK.md` on Preview SQL Editor. Agent will re-probe and re-run `npm run test:preview-integration`.
