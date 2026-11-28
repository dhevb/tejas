# TEJAS Production Readiness Package

**Status:** DOCUMENTATION ONLY — **NO Production execution**  
**Independent audit verdict:** **READY WITH DOCUMENTED LIMITATIONS** — see `TEJAS-FINAL-INDEPENDENT-RELEASE-AUDIT.md`  
**Prerequisite:** Preview browser QA PASS, restricted QA publication closed, PDF.js fix committed and tested (2026-11-28). Separate Owner authorization still required before any Production window.

Production ref: `zapccpipwxduzlnvjdmy`  
Preview ref (QA only): `nbeslngnrsagarosuaab`  
Preview tip exercised: `627bf3a7cf8885721f8a28d74c4f4cebf02cff73`  
Branch: `fix/pr72-phase2-1-utr-recovery-preview-qa` (**ahead 1** of origin — PDF.js commit local until Owner push)

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
- Preview certification: **12/12 PASS** retained in `.local-qa/phase251-option-a-integration.json`  
- Limitation: no fresh `pg_get_functiondef` verification this cycle

## 3. Production preflight checklist (Owner-executed later)

- [ ] Explicit separate Production authorization received  
- [ ] Backup / snapshot of Production DB completed and verified restorable  
- [ ] Confirm operator connected to `zapccpipwxduzlnvjdmy` only for that window  
- [ ] Confirm hashes match this package  
- [ ] Confirm Preview matrix already PASS for Option A + inventory  
- [ ] Confirm PDF.js commit `627bf3a` is on the merge tip / PR #73  
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
6. App deploy of reviewed branch/PRs **only after** separate merge authorization (#71→#72→#73 including PDF.js)  
7. Restricted publication decisions are **separate** from schema apply  

## 7. Security review summary

- RLS enable + service_role RPC EXECUTE pattern  
- No public Storage in these migrations  
- UTR uniqueness and no-release rules must remain  
- Never weaken Production env isolation  
- Preview Storage private re-verified (`publicBuckets: []`); unauth PDF **401**

## 8. Payment / UTR integrity checks

- Unique entitlement payment reference  
- App `claimUtr` + recovery path never releases valid claim  
- Concurrent duplicate claim: one winner  
- Fee gate ₹49 per stream

## 9. Student entitlement preservation

- Migrations are additive (`IF NOT EXISTS` / `ON CONFLICT DO NOTHING`)  
- Option A does not rewrite entitlement rows  
- No email-merge of identities  

## 10. Final test evidence required before Production

- Preview: both base migrations applied + verified — **done**  
- Preview: Option A full matrix PASS — **done** (12/12 evidence file; SQL hash re-verified; **no fresh pg_get_functiondef**)  
- Preview: 18 books / 90 mocks metadata present — **done** (live REST; fees ₹49)  
- Unit/integration/security gates green — unit **170/170**; Storage private; unauth PDF 401  
- Blank-page Owner decision recorded (**accepted intentional, 2026-11-28**) — **done**  
- Temporary Preview QA publication opened **and closed** with evidence — **done**  
- Authenticated browser PDF + mock QA — **done** (Phase 2.8–2.9)  
- PDF.js public-load fix — **done** (commit `627bf3a`; hashes match `pdfjs-dist@5.4.296`; reader/browser/build PASS)  
- Independent release audit — **done** (`TEJAS-FINAL-INDEPENDENT-RELEASE-AUDIT.md`)  
- Still required before Production: explicit Owner Production authorization, Production backup, hash re-verify, ordered PR merge (#71→#72→#73), push of local tip if needed, and separate deploy approvals

## 10.1 Documented limitations

1. Option A certified by Preview behavioral 12/12 evidence; live `pg_get_functiondef` not re-read this cycle.  
2. Publication close used REST PATCH after RPC returned 2xx without column mutation.  
3. Tip is on stacked PR #73, not yet on `main`; PDF.js commit may still need Owner push (`ahead 1`).  
4. School CSV/XLSX exports remain uncommitted pending PII review.

## 11. Outstanding risks

- Applying Production before Preview validation  
- Publishing books while blanks unresolved / without Owner publication decision  
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
8. Commit of school registration exports (PII)  

## 13. Exact Git status at package freeze (pre-docs-commit)

Recorded after PDF.js commit and report rewrite; final SHA after any docs commit is stated in the independent audit / acceptance report footer when committed.

```
Branch: fix/pr72-phase2-1-utr-recovery-preview-qa [ahead 1]
Tip:    627bf3a7cf8885721f8a28d74c4f4cebf02cff73
        Load pdf.js from public assets to avoid Next webpack eval breakage.
PRs:    #71 OPEN/MERGEABLE, #72 OPEN/MERGEABLE, #73 OPEN/MERGEABLE
Not staged for commit (excluded): TEJAS-PRODUCTION-SCHOOLS-REGISTERED.csv,
  TEJAS-PRODUCTION-REGISTERED-SCHOOLS-STATE-DISTRICT-WISE.xlsx, .env*, .local-qa/, public/pdfjs/
```

---

**This package does not authorize or perform Production work.**
