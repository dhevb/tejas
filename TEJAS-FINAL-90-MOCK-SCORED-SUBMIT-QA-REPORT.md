# TEJAS — Final 90 Mock Scored-Submit QA Report

**Date:** 24 November 2026 (IST)  
**Production URL:** https://tejas.dhe.org.in  
**Production deployment (unchanged):** `dpl_5rKcZW5JNbd3PNfcJBzsdiZAYLci`  
**Production commit (unchanged):** `90e70c55bb253628f4188de537ca2645f70cd83b`  
**QA identity:** `tejas-content-qa@dhe.org.in` (content-QA only)  
**Verdict:** **PARTIAL / BLOCKED** — 76 of 87 newly scored; 8 Future Tech mocks blocked by no-retake policy after prior open attempts expired

**Production safety:** No deploy, merge, migration, SQL mutation, schema/catalog/RLS/Auth/Storage/payment/registration change. Only normal QA attempt submissions through the authorized QA account where the platform allowed them.

Evidence (local, not committed): `.local-qa/scored-submit-87-evidence.json`, `.local-qa/blocked-history-check.json`

---

## 1. Inventory

| Stream | Books | Mocks |
|--------|------:|------:|
| English | 8 | 40 |
| Mathematics | 8 | 40 |
| Future Tech | 2 | 10 |
| **Total** | **18** | **90** |

Catalog reconcile against live catalog: **PASS** (90 entries; 5 per book; no orphans/dupes).

### Previously verified scored-submit samples (3)

| Test ID | Stream | Prior score | Evidence |
|---------|--------|------------:|----------|
| `ft-b1-mt03` | Future Tech | 6/25 | Prior acceptance sample submit |
| `eng-c05-mt03` | English | 6/25 | Prior acceptance sample submit |
| `mat-c05-mt03` | Mathematics | 6/25 | Prior acceptance sample submit |

These three were **not** re-submitted (avoid duplicate attempts).

### Targeted for this run: 87 remaining IDs

All catalog test IDs except the three above.

---

## 2. Scored-submit execution results (this run)

**Executed:** 2026-11-24T04:30:16Z–04:31:14Z via authorized QA login + student-facing `/api/learn/tests/{id}` start + submit.

| Metric | Count |
|--------|------:|
| Targeted | 87 |
| **Newly scored-submit PASS** | **76** |
| Failed (page/start/submit/isolation) | **0** |
| Blocked (retake not approved) | **11** |
| Previously verified (not retested) | 3 |
| **All 90 have scored-submit evidence?** | **No** (8 still lack any scored submit) |

### By stream (of the 87)

| Stream | Pass | Failed | Blocked |
|--------|-----:|-------:|--------:|
| English | 38 | 0 | 1 (`eng-c05-mt02`) |
| Mathematics | 38 | 0 | 1 (`mat-c05-mt02`) |
| Future Tech | 0 | 0 | 9 (all FT except prior `ft-b1-mt03`) |

Scores on new submits: **6–7 / 25** (all-A answers). Max score **25**. Result payloads returned `ok: true` with numeric `score`/`maxScore`. No answer-key leak in start payloads. No unrelated student/payment fields in submit responses.

### 76 newly scored — PASS (executed)

**English (38):**  
`eng-c03-mt01`, `eng-c03-mt02`, `eng-c03-mt03`, `eng-c03-mt04`, `eng-c03-mt05`, `eng-c04-mt01`, `eng-c04-mt02`, `eng-c04-mt03`, `eng-c04-mt04`, `eng-c04-mt05`, `eng-c05-mt01`, `eng-c05-mt04`, `eng-c05-mt05`, `eng-c06-mt01`, `eng-c06-mt02`, `eng-c06-mt03`, `eng-c06-mt04`, `eng-c06-mt05`, `eng-c07-mt01`, `eng-c07-mt02`, `eng-c07-mt03`, `eng-c07-mt04`, `eng-c07-mt05`, `eng-c08-mt01`, `eng-c08-mt02`, `eng-c08-mt03`, `eng-c08-mt04`, `eng-c08-mt05`, `eng-c09-mt01`, `eng-c09-mt02`, `eng-c09-mt03`, `eng-c09-mt04`, `eng-c09-mt05`, `eng-c10-mt01`, `eng-c10-mt02`, `eng-c10-mt03`, `eng-c10-mt04`, `eng-c10-mt05`

**Mathematics (38):**  
`mat-c03-mt01`, `mat-c03-mt02`, `mat-c03-mt03`, `mat-c03-mt04`, `mat-c03-mt05`, `mat-c04-mt01`, `mat-c04-mt02`, `mat-c04-mt03`, `mat-c04-mt04`, `mat-c04-mt05`, `mat-c05-mt01`, `mat-c05-mt04`, `mat-c05-mt05`, `mat-c06-mt01`, `mat-c06-mt02`, `mat-c06-mt03`, `mat-c06-mt04`, `mat-c06-mt05`, `mat-c07-mt01`, `mat-c07-mt02`, `mat-c07-mt03`, `mat-c07-mt04`, `mat-c07-mt05`, `mat-c08-mt01`, `mat-c08-mt02`, `mat-c08-mt03`, `mat-c08-mt04`, `mat-c08-mt05`, `mat-c09-mt01`, `mat-c09-mt02`, `mat-c09-mt03`, `mat-c09-mt04`, `mat-c09-mt05`, `mat-c10-mt01`, `mat-c10-mt02`, `mat-c10-mt03`, `mat-c10-mt04`, `mat-c10-mt05`

Evidence reference: `.local-qa/scored-submit-87-evidence.json` → `results[]` where `outcome === "pass_scored"`.

### 11 blocked — cannot start new attempt

Error (platform): `Another attempt is not open. A retake has not been approved.`

| Test ID | Notes |
|---------|-------|
| `eng-c05-mt02` | Prior scored submit exists (6/25) from earlier acceptance — **inherited scored evidence**; retest blocked |
| `mat-c05-mt02` | Prior scored submit exists (6/25) — **inherited scored evidence**; retest blocked |
| `ft-b1-mt02` | Prior scored submit exists (6/25) — **inherited scored evidence**; retest blocked |
| `ft-b1-mt01` | **No scored-submit evidence** — open attempt from prior QA start expired |
| `ft-b1-mt04` | **No scored-submit evidence** |
| `ft-b1-mt05` | **No scored-submit evidence** |
| `ft-b2-mt01` | **No scored-submit evidence** |
| `ft-b2-mt02` | **No scored-submit evidence** |
| `ft-b2-mt03` | **No scored-submit evidence** |
| `ft-b2-mt04` | **No scored-submit evidence** |
| `ft-b2-mt05` | **No scored-submit evidence** |

### Coverage after combining executed + inherited scored evidence

| Category | Count |
|----------|------:|
| New scored this run | 76 |
| Prior sample trio (`*-mt03`) | 3 |
| Inherited prior samples (`*-mt02` FT/Eng/Mat) | 3 |
| **Total with scored-submit evidence** | **82** |
| **Still lacking any scored-submit** | **8** (all Future Tech listed above) |

---

## 3. Exact blocker (remaining 8)

The portal refuses a second start when any prior attempt exists and `TEJAS_PORTAL_RETAKES` is not `allow` (`lib/portal/remote-store.ts` → `retakesAllowed()`).

Earlier QA acceptance started all 90 tests (creating open attempts). After the 30-minute window, unsaved FT attempts became non-open. Retakes are not approved. Completing scored-submit for the remaining 8 therefore requires an **owner-approved** Production capability change, for example:

1. Temporarily set Production env `TEJAS_PORTAL_RETAKES=allow` for QA retest, then disable; or  
2. Use a staff-approved retake workflow for the QA account on those test IDs (if/when available).

**Stopped** here per safety rules — no env change, SQL mutation, or attempt-row deletion performed.

---

## 4. Security isolation — Re-executed with this run — PASS

| Check | Result |
|-------|--------|
| Anon staff overview | Denied |
| Anon test start | Denied |
| QA `contentQa` | true |
| QA staff overview | Denied; no student list leak |
| QA staff payment | Denied |
| QA dashboard | Content-QA banner; payment link hidden |
| Submit responses | No other-student / UTR exposure observed |
| Auth / RLS / Storage | Untouched |

---

## 5. QA credential handoff — NOT COMPLETE

| Item | Status |
|------|--------|
| Account | `tejas-content-qa@dhe.org.in` |
| Password | Already rotated; remains in private agent credential store only |
| Org vault CLI (`op` / `bw` / etc.) | **Not available** |
| Approved secure owner-sharing facility | **Not available** |
| Password in this report / chat / Git / PR | **No** |
| Handoff complete? | **No** |

**Blocker:** No approved organization vault or secure share path for owner retrieval.  
**Owner action:** Enable an approved vault/share target, then authorize the agent to transfer into it (do not paste the password into chat).

---

## 6. PR #59 review — Safe for owner review (do not merge without owner)

**URL:** https://github.com/dhevb/tejas/pull/59  
**Branch:** `docs/final-post-publication-audit` → `main`  
**Commit:** `ee3004d`  
**Files changed:** only `TEJAS-ALL-CONTENT-PUBLICATION-AND-QA-ACCESS-REPORT.md` (documentation)

| Review item | Result |
|-------------|--------|
| Documentation-only | **Yes** |
| Secrets / password values | **None found** |
| Private student data | **None found** |
| Misleading “handoff complete” claim | **No** — report correctly states handoff **NOT COMPLETE** |
| Consistency with audit evidence | Aligns with final audit (18/90 live, PDF SHA, security, 87 lacking full submit at that time) |
| Merge / deploy in this task | **Not performed** |

**Verdict:** Safe for **owner** review and merge decision. Agent must not merge.

---

## 7. Production unchanged — Confirmed

| Item | Value |
|------|-------|
| Deployment | `dpl_5rKcZW5JNbd3PNfcJBzsdiZAYLci` (Ready; same as before this task) |
| Commit | `90e70c5` |
| Migrations / SQL / RLS / Auth / Storage | Not changed |
| Catalog / payment / registration code | Not changed |

---

## 8. Summary verdict

**PARTIAL / BLOCKED**

- Of the **87** targeted: **76 submitted and scored PASS**, **0 failed**, **11 blocked** by no-retake.
- Of those 11 blocked, **3** already had prior scored-submit evidence; **8** Future Tech mocks still have **no** scored-submit evidence.
- **All 90 do not yet have scored-submit evidence** (82 do; 8 do not).
- Credential handoff: **not complete**.
- PR #59: docs-only, safe for owner review; **not merged**.
