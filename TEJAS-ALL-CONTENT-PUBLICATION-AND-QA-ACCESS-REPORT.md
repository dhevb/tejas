# TEJAS — Complete Autonomous Publication, QA Security & Acceptance Report

**Date:** 24 November 2026 (IST)  
**Production URL:** https://tejas.dhe.org.in  
**Learn interface:** https://tejas.dhe.org.in/learn  
**QA dashboard:** https://tejas.dhe.org.in/learn/dashboard  
**Production deployment ID:** `dpl_5rKcZW5JNbd3PNfcJBzsdiZAYLci`  
**Production deployment URL:** https://tejas-k2g2ze441-dhe-projects.vercel.app  
**Git commit (main / Production):** `90e70c55bb253628f4188de537ca2645f70cd83b` (`Add content-QA allowlist and stream-correct publication labels. (#58)`)  
**Publication / acceptance verdict:** **PASS**  
**Final post-publication audit verdict:** **PASS** (with documented submit-sample coverage limit)

**Production unchanged by final audit:** Yes — read-only audit only; no deploy, migration, SQL mutation, Auth/RLS/Storage/payment/registration/credential change.

---

## Executive summary table

| Item | Expected | Verified result |
|---|---:|---|
| English books | 8 | **8** published |
| English mocks | 40 | **40** published |
| Mathematics books | 8 | **8** published |
| Mathematics mocks | 40 | **40** published |
| Future Tech books | 2 | **2** published (not republished) |
| Future Tech mocks | 10 | **10** published |
| Total books | 18 | **18** |
| Total mocks | 90 | **90** |
| QA login security rotation | Complete | **Complete** — password in private agent store only; not printed |
| PDF access + SHA-256 | Pass | **Pass** — final audit re-executed 18/18 |
| Mock test acceptance | Pass | **Pass** — pages/starts inherited; 3-stream submit sample inherited |
| Class restrictions | Pass | **Pass** |
| Cross-student isolation | Pass | **Pass** — final audit re-executed |
| Payment data isolation | Pass | **Pass** — final audit re-executed |
| Production deployment | Verified | **`dpl_5rKcZW5JNbd3PNfcJBzsdiZAYLci`** unchanged |
| QA credential secure handoff | Complete | **Not complete** — no approved vault/share path available |

---

## A. Final post-publication audit (24 Nov 2026 ~09:47–10:00 IST)

**Mode:** READ-ONLY (`tejas-final-audit.mjs`)  
**Evidence file:** `%TEMP%\tejas-final-audit-evidence.json`  
**Audit timestamp:** `2026-11-24T04:17:58Z`–`04:24:31Z`

Legend:

- **Re-executed** — run during this final audit.
- **Inherited** — taken from prior acceptance evidence (`tejas-qa-acceptance-evidence.json`, `at` ≈ `2026-11-24T04:10:41Z`); not re-run (to avoid altering attempt history).

### A1. Live publication counts — Re-executed — PASS

Source: `GET https://tejas.dhe.org.in/learn`

| Stream | Books published | Mock markers (5 of 5) | Implied mocks |
|--------|----------------:|----------------------:|--------------:|
| TEJAS English | 8 | (in 18 total markers) | 40 |
| TEJAS Mathematics | 8 | | 40 |
| TEJAS Future Tech | 2 | | 10 |
| **Total** | **18** | **18** | **90** |

Also verified on re-execution:

- Stream labels present: TEJAS English, TEJAS Mathematics, TEJAS Future Tech.
- All 18 catalog book titles present on `/learn`.
- QA dashboard lists 18 titles and 90 `/learn/tests/{id}` open links.
- Catalog class map: FT Book 1 → `[6,7,8]`; FT Book 2 → `[9,10]`.

### A2. PDF integrity — Re-executed — PASS

Authorized QA session + reader fetch headers only. Anonymous/unauthorized download not used.

| Metric | Result |
|--------|--------|
| Open as `%PDF-` | **18 / 18** |
| SHA-256 vs catalog `sourceSha256` | **18 / 18** |
| SHA-256 vs on-disk `content/portal/sources/*` | **18 / 18** |
| Mismatches | **0** |

| Book ID | Bytes | Pages (live `/Count`) | SHA match |
|---------|------:|----------------------:|:---------:|
| ft-book-1 | 8,022,365 | 60 | Yes |
| ft-book-2 | 8,300,647 | 67 | Yes |
| eng-class-03 | 2,014,301 | 25 | Yes |
| eng-class-04 | 1,799,030 | 25 | Yes |
| eng-class-05 | 1,882,236 | 25 | Yes |
| eng-class-06 | 1,873,653 | 25 | Yes |
| eng-class-07 | 5,834,815 | 25 | Yes |
| eng-class-08 | 6,587,107 | 25 | Yes |
| eng-class-09 | 6,592,026 | 25 | Yes |
| eng-class-10 | 6,123,024 | 25 | Yes |
| mat-class-03 | 3,257,969 | 89 | Yes |
| mat-class-04 | 3,044,995 | 87 | Yes |
| mat-class-05 | 5,892,430 | 104 | Yes |
| mat-class-06 | 5,009,725 | 100 | Yes |
| mat-class-07 | 7,345,933 | 168 | Yes |
| mat-class-08 | 5,381,944 | 139 | Yes |
| mat-class-09 | 6,321,551 | 147 | Yes |
| mat-class-10 | 5,473,792 | 187 | Yes |

Full hashes are omitted from this report (integrity confirmed by match); truncated prefixes are in the local evidence JSON.

### A3. Mock test reconciliation

#### Catalog reconcile — Re-executed — PASS

| Check | Result |
|-------|--------|
| Catalog tests | 90 |
| Eng / Math / FT | 40 / 40 / 10 |
| 5 mocks per book | 18 × 5 |
| Orphan tests | 0 |
| Duplicate test IDs | 0 |
| FT class mappings | Book1 `[6,7,8]`; Book2 `[9,10]` |

#### Execution evidence — Inherited (not re-started/submitted)

| Evidence | Coverage | Status |
|----------|----------|--------|
| All 90 test pages open | 90/90 | **PASS (inherited)** |
| All 90 tests start (or prior open / retake-blocked) | `startOk: 90`, `failCount: 0`, `retakeBlocked: 1` | **PASS (inherited)** |
| Submit + score display | Samples only: `ft-b1-mt03`, `eng-c05-mt03`, `mat-c05-mt03` (each `ok`, score 6/25) | **PASS for samples (inherited)** |

**Lacking full submit evidence:** **87** of 90 tests have page + start evidence but **no** scored submit evidence. This is intentional under read-only audit rules (no new attempts / no alteration of historical attempts). Not marked as a publication failure.

### A4. Security audit — Re-executed — PASS

| Probe | Result |
|-------|--------|
| Anon book file | 401/403 denied |
| Anon staff overview | 401/403 denied |
| Anon test start | 401/403 denied |
| QA login | 200; `contentQa: true` |
| QA → staff overview | 401/403; no student list leak |
| QA → staff payment | 401/403 |
| QA dashboard banner | Present |
| QA `/learn/pay` link | Hidden |
| QA account page | Self only |
| Auth/RLS/Storage weakened | **No** (not modified) |

### A5. QA credential secure handoff — NOT COMPLETE

| Item | Status |
|------|--------|
| Login | `tejas-content-qa@dhe.org.in` |
| Password rotation | Already done; **not** rotated again |
| Current storage | Private Cursor agent credential store only |
| Org password vault CLI (1Password `op`, Bitwarden `bw`, etc.) | **Not installed / not available** in this environment |
| Approved secure owner-sharing mechanism for live QA handoff | **Not available** |
| Pre-existing personal-store GPG recovery artifact (`tejas-recovery-transfer`) | Present but **not** used — not an approved live QA password handoff channel; do not treat as completed handoff |
| Password printed in chat / report / Git / logs | **No** |

**Exact blocker:** No approved organization vault or secure owner-sharing path is available for the agent to transfer the credential so the owner can retrieve it. Handoff is **not** claimed complete.

**Owner action required:** Provide an approved vault/share target (e.g. enable 1Password/Bitwarden CLI with an item the owner can open, or another owner-authorized secure channel). Until then, the rotated password remains only in the private agent store; ask the agent to perform a vault transfer after that channel exists — do not paste the password into chat.

### A6. Production safety confirmation

| Constraint | Final audit |
|------------|-------------|
| Production deploy | **Not performed** — still `dpl_5rKcZW5JNbd3PNfcJBzsdiZAYLci` |
| Migrations / SQL mutations | **Not performed** |
| Schema / catalog data changes | **Not performed** |
| Auth / RLS / Storage | **Not modified** |
| Payment / registration | **Not modified** |
| Student / payment / attempt records | **Not modified** |
| Credentials | **Not changed** |

---

## B. Prior publication & acceptance (context; earlier same day)

Staff publish Eng/Math: **96/96** OK via authorized staff workflow (actor `recovery`, ~2026-11-23T19:37Z).  
Future Tech already published; not republished.  
Prior acceptance harness: 25/25 checks after Eng/Math catalog FK seed and reader-header PDF fetches.  
Additive `tejas_learn_books` / `tejas_learn_tests` metadata seed (Eng/Math) was performed **before** this final audit to enable attempts; final audit did not mutate further.

---

## C. URLs, IDs, commits

| Item | Value |
|------|-------|
| Production site | https://tejas.dhe.org.in |
| Public learn | https://tejas.dhe.org.in/learn |
| QA dashboard | https://tejas.dhe.org.in/learn/dashboard |
| Deployment | `dpl_5rKcZW5JNbd3PNfcJBzsdiZAYLci` |
| Commit on Production | `90e70c55bb253628f4188de537ca2645f70cd83b` |
| Merged feature PR | #58 |

---

## D. Remaining blockers

1. **QA credential secure handoff** — blocked until owner supplies an approved vault/share mechanism (see A5).
2. **Submit coverage** — 87 mocks lack scored-submit evidence by design under read-only rules; pages + starts covered for all 90.
