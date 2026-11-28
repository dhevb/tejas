# Phase 2.4.2 — Owner Preview SQL apply (manual)

**Target project (only):** `nbeslngnrsagarosuaab`  
**Production (never):** `zapccpipwxduzlnvjdmy`

Agent cannot sign into the Supabase Dashboard from this environment. Use this pack to apply the already-reviewed migrations.

## Hashes (must match before run)

| File in this folder | SHA-256 |
|---------------------|---------|
| `01-tejas_learning_portal.sql` | `D9A6746E52C035DCBFC0B1F8B5A9D357C8C7F427008687536C377B80BEFB3290` |
| `02-tejas_learning_portal_durable.sql` | `67A15470352809FC26A0DFE79EBE3E9898C8F86083A6569F4785336215C963B3` |

Same hashes as `supabase/migrations/20261118000100_*.sql` / `20261118000200_*.sql` and Phase 2.4.1 review.

## Steps

1. Open https://supabase.com/dashboard/project/nbeslngnrsagarosuaab  
2. Confirm the project ref in the URL is exactly `nbeslngnrsagarosuaab` (not Production).  
3. SQL Editor → New query.  
4. Paste **entire** contents of `01-tejas_learning_portal.sql` → Run.  
5. Run `03-verify-after-001.sql`. All checks should return expected `ok` / true.  
6. Only then paste **entire** `02-tejas_learning_portal_durable.sql` → Run.  
7. Run `04-verify-after-002.sql`.  
8. Optional local REST check: agent can re-probe Preview after you reply that both succeeded (do not send secrets).

## Do not

- Run against Production.  
- Skip 001.  
- Edit the SQL.  
- Paste DB passwords or service-role keys into chat.  
- Apply Option A in the same window (separate phase after schema verification).

## After success

Reply in Cursor with only:

- Preview ref confirmed: `nbeslngnrsagarosuaab`  
- 001 result: success  
- 002 result: success  

Agent will then run post-apply verification and continue Phase 2.5+.
