# Owner Preview Resume Runbook — post 2026-11-28 decisions

**Only project:** `nbeslngnrsagarosuaab`  
**Never:** `zapccpipwxduzlnvjdmy`

Confirm the project ref in the browser URL before **every** script. Do not paste secrets into chat.

## Status (agent-verified 2026-11-28)

| Step | Status |
|------|--------|
| A — migration 001 | **DONE** (verified) |
| B — migration 002 | **DONE** (verified) |
| C — Option A RPC | **REMAINING — Owner SQL required** |
| D — Eng/Math seed | **DONE** (18 books / 90 tests present) |
| E — Open QA publication | **DONE** (via Preview RPC; 18+90 published) |
| F — Close QA publication | **PENDING** after Option A + remaining QA |

---

## Step A — Schema migration 001 — DONE

## Step B — Schema migration 002 — DONE

## Step C — Option A RPC — **DO THIS NEXT**

1. File: `preview-sql/phase25-option-a/01-option-a-multistream-payment.sql`  
   SHA-256: `6E5B1A6ABC36B51652E0B3094B6D08EA580FEA6B491DA5FAE329CB7202C35F86`
2. Confirm function bodies **no longer** contain `books.stream_id = students.stream_id` (except comments).  
3. Rollback if needed: `preview-sql/phase25-option-a/02-rollback-to-primary-stream-eq.sql`
4. Reply: `C Option A: success` (no secrets)

## Step D — Eng/Math metadata seed — DONE

## Step E — Temporary restricted QA publication — DONE (open)

## Step F — Close temporary QA publication (after testing)

1. Run: `preview-sql/phase28-restricted-qa/02-close-preview-qa-publication.sql`  
   SHA-256: `EB4F6599178585FD115F1FAA61F80AFEE880F155A1C9D93D77CCBE567D893542`  
   **or** agent `node .local-qa/phase28-open-qa-publication.mjs close` once authorized to close.  
2. Restores `awaiting_approval` for all learn books/tests.

---

## Reply to agent (no secrets)

```text
Preview ref confirmed: nbeslngnrsagarosuaab
A 001: success
B 002: success
C Option A: success | skipped
D Eng/Math seed: success | skipped
E QA publication open: success | skipped
```

Agent will then verify via Preview REST and continue automated QA.
