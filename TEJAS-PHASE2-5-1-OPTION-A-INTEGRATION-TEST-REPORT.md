# TEJAS Phase 2.5.1 — Option A Preview Integration Test Report

**Target:** Preview Supabase `nbeslngnrsagarosuaab` only  
**Production:** `zapccpipwxduzlnvjdmy` — **not accessed**  
**Option A SQL SHA-256:** `6E5B1A6ABC36B51652E0B3094B6D08EA580FEA6B491DA5FAE329CB7202C35F86`  
**Harness:** `.local-qa/phase251-option-a-integration.ts`  
**Evidence JSON:** `.local-qa/phase251-option-a-integration.json` (gitignored)  
**Run marker:** `p251_mx0g6yz3`  
**Fixture domain:** `@tejas-preview.test` (synthetic students + `SYN…` UTRs only)  
**RPC definitions during test:** **not modified**

---

## Final verdict

# OPTION A INTEGRATION PASS

**12 / 12 PASS · 0 FAIL · 0 BLOCKED**

Also: `npm run test:preview-integration` → **PASS** (after removing obsolete secondary-stream BLOCKED branch).

---

## Confirmed live Option A state (Owner + prior verify)

- Report/review RPCs: primary-stream equality **absent**
- Report RPC: ₹49 fee gate **present**
- Both RPCs: class eligibility + superseded checks **present**
- Report RPC: unique-violation handler **present**

---

## App-layer correction applied during this phase (not RPC SQL)

First full matrix run failed cases **4** and **5** because remote `reportPayment` skipped `shouldAcceptIdempotentRetry` (file-store already had the guard). Different UTR could overwrite a reported reference via RPC `UPDATE` (`status <> verified`), which then freed the old UTR for another student.

**Fix (Preview app code only):** `lib/portal/store.ts` + `remoteEntitlementDetail` in `lib/portal/remote-store.ts` — apply idempotent / different-UTR rejection **before** calling `tejas_learn_report_payment`.

Re-run after fix: **12/12 PASS**. RPCs unchanged.

---

## Test matrix

| # | Case | Status | DB / API evidence (summary) |
|---|------|--------|-----------------------------|
| 1 | Primary stream ₹49 + synthetic UTR | **PASS** | Entitlement `reported`, ref `SYN…ENG`, amount 49 |
| 2 | Secondary stream ₹49 separate UTR | **PASS** | Math entitlement `reported` while primary stream = english |
| 3 | Same student/book/UTR retry | **PASS** | Idempotent `ok: true` |
| 4 | Different UTR no overwrite | **PASS** | Rejected; reference unchanged (`SYN…ENG`) |
| 5 | Same UTR two students | **PASS** | Second student report rejected |
| 6 | Invalid fee | **PASS** | RPC HTTP 400 `ebook fee must be 49` |
| 7 | Ineligible class | **PASS** | Class-7 + eng-class-03 → `payment report was not accepted` |
| 8 | Superseded entitlement | **PASS** | Same reject message after fixture supersede |
| 9 | Concurrent duplicate UTR | **PASS** | wins=1 losses=1 |
| 10 | Existing purchased stream | **PASS** | Verify ok; rebuy rejected; single verified entitlement |
| 11 | Identity isolation | **PASS** | Other student `unpaid`; owner can read verified book |
| 12 | FT companion mocks locked | **PASS** | Book 1 readable; Book 1 mock locked; Book 2 mock open |

---

## Grants / Storage

| Check | Result |
|-------|--------|
| service_role can invoke report RPC (fee reject path) | **Yes** |
| Bogus/anon-style JWT invoke | HTTP **401** |
| Storage buckets listed | `tejas-payment-proofs`, `tejas-registration-files` |
| Any public bucket | **false** |

---

## Safety compliance

| Rule | Result |
|------|--------|
| Isolated labelled test students | Yes (`Phase Two Five One…`, `@tejas-preview.test`) |
| Synthetic UTRs only (`SYN…`) | Yes |
| No real payments / bank UTRs | Yes |
| Existing real records not targeted | Yes — only marker fixtures; cleaned after run |
| Valid UTR claims not released for reuse | Yes — registry rows not released |
| RLS / grants not weakened | Yes |
| RPC SQL not modified in test | Yes |
| Production not accessed | Yes |
| Browser QA / QA publication close | **Not started** (per instruction) |

Cleanup: deleted entitlements/audit/students for `email like *phase251*` IDs created in this run only.

---

## Not performed

- Browser / mobile visual QA  
- Closing temporary Preview QA publication  
- Production changes / PR merge  

---

**OPTION A INTEGRATION PASS**
