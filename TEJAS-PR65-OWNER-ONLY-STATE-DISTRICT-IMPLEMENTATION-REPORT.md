# PR #65 — Owner-Only Access + Address-Based State/District Segregation

**Branch:** `feat/registration-review-dashboard-redesign`  
**PR:** [#65](https://github.com/dhevb/tejas/pull/65) — **OPEN**  
**Repo:** `dhevb/tejas`  
**Date:** 2026-11-25  

## Verdict

**PASS**

All required checks for owner-only administration, address-derived State/District behaviour, automated tests, Preview API verification, interactive browser UI QA (Trusted Sources OIDC), geographic fixture integration (insert → filter QA → cleanup), and open-handle investigation were completed. Production was not merged, deployed, or mutated.

---

## Commit / push / Preview

| Item | Value |
|------|--------|
| Feature commit | `d41b2970a1fdcca690a22fbd9887c31a52201a36` |
| Prior report commit | `e615ec1a418c4cbed698e4d26660ef33dc332b7e` |
| This report update | *(after push)* |
| Branch | `feat/registration-review-dashboard-redesign` |
| PR state | **OPEN** |
| Preview URL | https://tejas-9z4nixu3o-dhe-projects.vercel.app |
| Deployment ID | `dpl_8uBSCEx93EoD3VGHUQT7p7YsVrz2` |
| Deploy target | **preview** |
| Preview Supabase | `nbeslngnrsagarosuaab` only |
| Production | Untouched |

---

## A. API verification

| Check | Result |
|-------|--------|
| Unauth admin APIs (`vercel curl`) | **PASS** — 401 |
| School-staff email/password session | **PASS** — 401 owner-only message |
| Owner login (`identity=recovery`, `role=owner`) | **PASS** |
| Owner list / logout | **PASS** |
| Export filters + `X-Tejas-Export-Count` | **PASS** |
| Storage-status connected on Preview | **PASS** |
| File download unauth 401 / owner 200 xlsx | **PASS** |
| Geo fixtures visible in list (during QA) | **PASS** — 9 rows (5 seed + 4 geo) |
| After geo cleanup API count | **PASS** — 5 seeds, 0 geo |

---

## B. Automated test verification

| Command | Result |
|---------|--------|
| `registration.test.ts` with `--test-force-exit` (earlier) | 31/31 PASS |
| `registration.test.ts` **without** `--test-force-exit` (this pass) | **EXIT 0**, 31/31 PASS, ~2.9s test time, ~5.9s wall — clean process exit |
| `india-address.test.ts` + related focused suites | PASS (prior) |
| `tsc --noEmit` / `next lint` / `npm run build` | EXIT 0 (prior) |

### Open-handle investigation

| Finding | Detail |
|---------|--------|
| Prior hang | Process appeared stuck; earlier force-stop / PowerShell `Select-Object -Last` buffering contributed to false “hang” signals |
| This run (no `--test-force-exit`) | Suite completed and process exited **0** under a 120s cap |
| Forced exit misrepresented as clean? | **No** — this run is a clean exit; earlier force-exit is not claimed as clean termination |
| Code change for hang | **None** (no defect demonstrated in app/test infra requiring a fix) |

---

## C. Actual browser UI verification

**Method:** Playwright + fresh `vercel project token` → `x-vercel-trusted-oidc-idp-token` (Trusted Sources). Deployment Protection **not** disabled. Tokens not printed.

**Script / evidence:** `.local-qa/pr65-browser-geo-qa.mjs` → `.local-qa/pr65-browser-geo-qa-results.json`  
**Summary:** **24 PASS / 0 FAIL / 0 NOT TESTED** (browser suite)

| # | Check | Result |
|---|-------|--------|
| 1 | Owner login / logout | **PASS** |
| 2 | Unauthenticated login form (owner-only copy; no email field) | **PASS** |
| 3 | School-staff UI path absent + bad token rejected | **PASS** |
| 4 | Direct API denial | **PASS** (API section) |
| 5 | State filter (Maharashtra) | **PASS** |
| 6 | District depends on State (Pune/Nagpur options) | **PASS** |
| 7 | Combined State + District + search + payment | **PASS** |
| 8 | Grouping chips + Clear/reset | **PASS** |
| 9 | Overview filtered counts | **PASS** (baseline 9 with fixtures) |
| 10 | CSV href filters + fetch (`X-Tejas-Export-Count` / body) | **PASS** |
| 11 | Unidentified-address filter | **PASS** |
| 12 | PAN masking | **PASS** |
| 13 | Detail / file controls + protected file API | **PASS** |
| 14 | Desktop / tablet / mobile viewports | **PASS** |

---

## D. Geographic fixture integration verification

| Item | Detail |
|------|--------|
| Script | `.local-qa/pr65-geo-fixtures.mjs` (`insert` / `cleanup` / `status`) |
| Project | Preview `nbeslngnrsagarosuaab` only (allowlist) |
| Existing five seeds | **Not modified**; preserved before/after (**5**) |
| Fixtures created | 4 synthetic schools — MH/Pune, MH/Nagpur, TN/Chennai, TN/Madurai |
| Refs | `TEJAS-2026-TESTDATAGEPQA65PUNEX`, `…NAGPX`, `…CHENX`, `…MADUX` |
| Labels | All names/addresses prefixed `TEST DATA GEO QA` |
| Real PII | None |
| Production writes | None |
| Browser + API filter QA with fixtures | **PASS** |
| Cleanup | All 4 deleted; `geoRemaining=0`; `seedsPreserved=true`; API `api_count=5 geo_left=0 seeds=5` |

---

## E. Owner-only endpoint audit (unchanged from prior)

Owner recovery subject only. School-staff email path rejected. `registrationOwnerAuthorised` on registrations/export/payment/file; request-scoped owner gate on storage/schema-status. `admin/payment` owner-gate fix included in feature commit. See prior endpoint table in git history / feature commit message scope.

---

## F. State/District parser (unchanged)

Address-only derivation; no form fields; original address preserved; unidentified bucket retained. Unit coverage PASS.

---

## Changed files (feature — already on branch)

See commits `d41b297` / report commits. Local QA scripts under `.local-qa/` are **not** application code and remain untracked (contain no secrets in scripts; results JSON has no tokens).

---

## Remaining gaps

**None required for this scope.** Optional future: live LGD feed sync (not required).

## Safety confirmation

- PR #65 **OPEN** — no merge  
- No Production deploy / SQL / migration  
- No payment approval mutations; no real registration mutation beyond temporary Preview GEO QA fixtures (removed)  
- Google Drive disabled  
- Deployment Protection left enabled  
