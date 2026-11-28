# TEJAS Production Readiness Package

**Status:** DOCUMENTATION ONLY — **NO Production execution**  
**Prerequisite:** Preview acceptance must advance beyond current Owner blockers.

Production ref: `zapccpipwxduzlnvjdmy`  
Preview ref (QA only): `nbeslngnrsagarosuaab`

---

## 1. Exact migration files and hashes (Preview-reviewed)

| Order | File | SHA-256 |
|------:|------|---------|
| 1 | `supabase/migrations/20261118000100_tejas_learning_portal.sql` | `D9A6746E52C035DCBFC0B1F8B5A9D357C8C7F427008687536C377B80BEFB3290` |
| 2 | `supabase/migrations/20261118000200_tejas_learning_portal_durable.sql` | `67A15470352809FC26A0DFE79EBE3E9898C8F86083A6569F4785336215C963B3` |
| 3 | `supabase/migrations/20261128000100_tejas_learn_option_a_multistream_payment.sql` | `6E5B1A6ABC36B51652E0B3094B6D08EA580FEA6B491DA5FAE329CB7202C35F86` |
| 4 | `supabase/migrations/20261128000200_tejas_learn_eng_math_metadata_seed.sql` | `E22B8CDFB281B44A905E62981A89C63771D164FC382B9F5A660E0464947C808D` |

Re-hash immediately before any future Production window. If drift → new safety review.

## 2. Option A RPC

- SQL: item 3 above  
- Rollback: `preview-sql/phase25-option-a/02-rollback-to-primary-stream-eq.sql`  
- Change: remove only `books.stream_id = students.stream_id` from report/review RPCs

## 3. Production preflight checklist (Owner-executed later)

- [ ] Explicit separate Production authorization received  
- [ ] Backup / snapshot of Production DB completed and verified restorable  
- [ ] Confirm operator connected to `zapccpipwxduzlnvjdmy` only for that window  
- [ ] Confirm hashes match this package  
- [ ] Confirm Preview matrix already PASS for Option A + inventory  
- [ ] Confirm no public Storage / publication side effects in SQL  
- [ ] Staff available for rollback  

## 4. Backup and recovery

- Require point-in-time / snapshot before DDL  
- Retain ability to restore `tejas_payment_utrs`, student, entitlement, and staff session tables  
- Learn-schema rollback sketch exists in Phase 2.4.1 review (destructive to post-apply learn data only)

## 5. Rollback plan

1. Option A → restore primary-stream equality functions from 002 bodies.  
2. Eng/Math seed → delete only seeded eng/math learn metadata rows if required (not UTR/payment).  
3. Full learn drop only with Owner approval (see 2.4.1 Section 7) — never drop `tejas_payment_utrs` casually.

## 6. Deployment sequence (future authorization)

1. Backup Production  
2. Apply 001 → verify  
3. Apply 002 → verify  
4. Apply Option A → verify matrix  
5. Apply Eng/Math metadata seed → verify counts  
6. App deploy of reviewed branch/PRs **only after** separate merge authorization  
7. Restricted publication decisions are **separate** from schema apply  

## 7. Security review summary

- RLS enable + service_role RPC EXECUTE pattern  
- No public Storage in these migrations  
- UTR uniqueness and no-release rules must remain  
- Never weaken Production env isolation  

## 8. Payment / UTR integrity checks

- Unique entitlement payment reference  
- App `claimUtr` + recovery path never releases valid claim  
- Concurrent duplicate claim: one winner  

## 9. Student entitlement preservation

- Migrations are additive (`IF NOT EXISTS` / `ON CONFLICT DO NOTHING`)  
- Option A does not rewrite entitlement rows  
- No email-merge of identities  

## 10. Final test evidence required before Production

- Preview: both base migrations applied + verified  
- Preview: Option A full matrix PASS  
- Preview: 18 books / 90 mocks metadata present  
- Unit/integration/security gates green  
- Blank-page Owner decision recorded (**accepted intentional, 2026-11-28**)  
- Temporary Preview QA publication opened **and closed** with evidence  

## 11. Outstanding risks

- Applying Production before Preview validation  
- Publishing books while blanks unresolved  
- Missing question SQL seed if Production remote scoring requires DB questions  
- Operator targeting wrong Supabase project  

## 12. Production actions requiring Owner approval (explicit list)

1. Any SQL on `zapccpipwxduzlnvjdmy`  
2. Any Production env/credential change  
3. PR merge (#71/#72/#73 or successors)  
4. Production deploy / release  
5. Book/PDF publication  
6. Public Storage policy changes  
7. Destructive rollback SQL  

---

**This package does not authorize or perform Production work.**
