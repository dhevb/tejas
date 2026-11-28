# TEJAS Phase 3.0 — End-to-End Payment and Entitlement Tests

**Objective:** Preview-only payment/UTR/entitlement matrix including Option A secondary stream.  
**Target:** Preview `nbeslngnrsagarosuaab`.  
**Safety:** Isolated test records only; no Production payment mutation; never release valid UTRs.

---

## Verdict

# BLOCKED — PREVIEW LEARN SCHEMA + OPTION A NOT APPLIED

## Local (file-store / unit) evidence — PASS

Covered in `npm test` (170 pass), including:

- Multi-stream ₹49 quotes  
- Same email distinct identities  
- FT companion access  
- Mock entitlement rules  
- Same-UTR retry / different-UTR overwrite / concurrent claim  
- UTR recovery never releases valid claim  

## Preview remote matrix

| Case | Status |
|------|--------|
| One stream purchase | BLOCKED (PGRST205) |
| Multiple stream purchases (Option A) | BLOCKED |
| Same email distinct identities | BLOCKED remote |
| Existing purchased stream retry | BLOCKED |
| Same UTR retry | BLOCKED |
| Different UTR overwrite | BLOCKED |
| Duplicate UTR across students | BLOCKED |
| Concurrent submissions | BLOCKED |
| Invalid amount / class | BLOCKED |
| Unverified / verified / rejected | BLOCKED |
| Entitlement preservation | BLOCKED |
| FT companion + mocks | BLOCKED remote |

Integration harness: `npm run test:preview-integration` remains assert-fail BLOCKED until schema exists (by design — does not silent-skip).

## Not performed

- Preview synthetic payment writes  
- Production anything  

**Next:** After 2.4.2 + 2.5 + seed, run `test:preview-integration` and manual matrix; attach results here.
