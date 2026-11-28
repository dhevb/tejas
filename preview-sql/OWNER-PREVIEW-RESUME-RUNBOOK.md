# Owner Preview Resume Runbook — post 2026-11-28 decisions

**Only project:** `nbeslngnrsagarosuaab`  
**Never:** `zapccpipwxduzlnvjdmy`

Agent has no Dashboard session and no Preview Postgres URL. Run these packs **in order** in Supabase SQL Editor. Do not paste secrets into chat.

Confirm the project ref in the browser URL before **every** script.

---

## Step A — Schema migration 001

1. File: `preview-sql/phase242-owner-apply/01-tejas_learning_portal.sql`  
   SHA-256: `D9A6746E52C035DCBFC0B1F8B5A9D357C8C7F427008687536C377B80BEFB3290`
2. Verify: `preview-sql/phase242-owner-apply/03-verify-after-001.sql`  
3. **STOP** if any expected table is missing.

## Step B — Schema migration 002

1. File: `preview-sql/phase242-owner-apply/02-tejas_learning_portal_durable.sql`  
   SHA-256: `67A15470352809FC26A0DFE79EBE3E9898C8F86083A6569F4785336215C963B3`
2. Verify: `preview-sql/phase242-owner-apply/04-verify-after-002.sql`  
3. Expect FT books/tests seeded; primary-stream equality still present in payment RPCs.

## Step C — Option A RPC (only after A+B pass)

1. File: `preview-sql/phase25-option-a/01-option-a-multistream-payment.sql`  
   SHA-256: `6E5B1A6ABC36B51652E0B3094B6D08EA580FEA6B491DA5FAE329CB7202C35F86`
2. Confirm function bodies **no longer** contain `books.stream_id = students.stream_id` (except comments).  
3. Rollback if needed: `preview-sql/phase25-option-a/02-rollback-to-primary-stream-eq.sql`

## Step D — Eng/Math metadata seed (only after A+B)

1. File: `preview-sql/phase26-content-seed/01-eng-math-metadata-seed.sql`  
   SHA-256: `E22B8CDFB281B44A905E62981A89C63771D164FC382B9F5A660E0464947C808D`
2. Uses `ON CONFLICT DO NOTHING` — safe re-run.  
3. Leaves `publication_status = awaiting_approval`.

## Step E — Temporary restricted QA publication (Owner Decision 2)

1. Open: `preview-sql/phase28-restricted-qa/01-open-preview-qa-publication.sql`  
   SHA-256: `BF277923E03AD6F5F3297A919DE0F1DE3BFD6E4387C002FBEA01F05E2E1FBCB1`  
2. Sets 18 books + 90 tests to `published` **on Preview only**, with audit note identifying temporary QA.  
3. Does **not** create public Storage or permanent URLs.

## Step F — Close temporary QA publication (after testing)

1. Run: `preview-sql/phase28-restricted-qa/02-close-preview-qa-publication.sql`  
   SHA-256: `EB4F6599178585FD115F1FAA61F80AFEE880F155A1C9D93D77CCBE567D893542`  
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
