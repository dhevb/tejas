# PR #65 — Owner-Only Access + Address-Based State/District Segregation

**Branch:** `feat/registration-review-dashboard-redesign`  
**PR:** [#65](https://github.com/dhevb/tejas/pull/65) — **OPEN**  
**Repo:** `dhevb/tejas`  
**Date:** 2026-11-25  

## Verdict

**PASS**

All required checks for owner-only administration, address-derived State/District behaviour, PIN-prefix false-conflict fix, short State alias hardening, automated suites, TypeScript/lint/build, Preview-only deploy, Preview API + browser UI/filter verification (Trusted Sources OIDC), temporary PIN fixtures (insert → verify → cleanup), and seed preservation are complete. Production was not merged, deployed, or mutated. Deployment Protection remained enabled.

---

## Commit / push / Preview

| Item | Value |
|------|--------|
| Feature commit | `d41b2970a1fdcca690a22fbd9887c31a52201a36` |
| Prior report commits | `e615ec1` / `95c5116` |
| PIN / short-alias fix | `19a463b7718ae3f75bd4fb1578b8836f50cc57ba` |
| Branch | `feat/registration-review-dashboard-redesign` |
| PR state | **OPEN** |
| Post-fix Preview URL | https://tejas-bc42nmsdp-dhe-projects.vercel.app |
| Post-fix Deployment ID | `dpl_YtTGDjMftE7xX5zJWK7jyoqUPikH` |
| Prior Preview URL | https://tejas-9z4nixu3o-dhe-projects.vercel.app |
| Prior Deployment ID | `dpl_8uBSCEx93EoD3VGHUQT7p7YsVrz2` |
| Deploy target | **preview only** |
| Preview Supabase | `nbeslngnrsagarosuaab` only |
| Production | Untouched |

---

## G. Defect: PIN-prefix false conflicts & short State alias matching

### Defect

1. **PIN prefix veto** — `PIN_PREFIX_TO_STATE` mapped the first two PIN digits to a single State and rejected text-derived States that disagreed. Two-digit postal prefixes are ambiguous across States/UTs, causing false conflicts:
   - Mohali, Punjab `160055` (prefix `16` previously → Chandigarh)
   - Dehradun, Uttarakhand `248001` (prefix `24` previously → Uttar Pradesh)
   - Dhanbad, Jharkhand `826001` (prefix `82` previously → Bihar)
   - Ladakh PINs beginning `194` (prefix `19` previously → Jammu and Kashmir)

2. **Short aliases** — Comments claimed ambiguous short codes were excluded, but matching still treated normalised whole tokens (including lowercase ordinary words) as State abbreviations.

### Fix

| File | Change |
|------|--------|
| `lib/registration/india-geo-data.ts` | Emptied `PIN_PREFIX_TO_STATE` with an explicit comment that two-digit prefixes must not invent or veto State/District without a verified six-digit dataset. |
| `lib/registration/india-address.ts` | Removed PIN-prefix import/veto. PIN may only add a diagnostic note when identification fails; never invents District from PIN. Bare ≤2-letter State codes match only as **ALL-CAPS** standalone tokens in the **original** address; punctuated forms (`U.P.`, `T.N.`) continue via normalisation (`u p`, `t n`). Fail-closed on conflicting/ambiguous addresses. |
| `lib/registration/india-address.test.ts` | Mandatory regressions for Mohali / Dehradun / Dhanbad / Leh; `U.P.` / `T.N.` / `TN`; ordinary short-token negatives; ambiguous shared districts; PIN-alone no District; original address unmutated; ambiguous PIN no longer vetoes explicit State. |

### Required behaviour confirmed

- Never reject an explicitly identified State because an ambiguous two-digit PIN prefix maps elsewhere.
- Do not infer State from an ambiguous PIN prefix.
- Prefer removing PIN-prefix veto entirely (done) vs inventing a six-digit map.
- If PIN cannot verify State, retain text-derived State.
- Never invent a District from a PIN prefix.
- Preserve `U.P.` / `T.N.`; bare short codes only when uppercase abbreviations; ordinary words do not identify States.
- Deterministic, fail-closed; full State names and established unambiguous aliases retained.

### Automated retest (this fix)

| Command | Exit | Result |
|---------|------|--------|
| `npx tsx --test --test-concurrency=1 lib/registration/india-address.test.ts` | **0** | 18/18 PASS (incl. PIN false-conflict + short-alias suites) |
| `npx tsx --test --test-concurrency=1 lib/registration/registration.test.ts` (**no** `--test-force-exit`) | **0** | 31/31 PASS |
| Focused: `staff-recovery` / `payment-rules` / `pan-access` / `staff-metrics` | **0** | 24/24 PASS |
| `npx tsc --noEmit` | **0** | PASS |
| `npx next lint` | **0** | PASS (existing `<img>` warnings only) |
| `npx next build` | **0** | PASS |

### Preview verification (PIN regressions)

| Check | Status |
|-------|--------|
| Parser unit tests for four regression addresses | **PASS** (local, EXIT 0) |
| Preview deploy of fix (`19a463b`) | **PASS** — `dpl_YtTGDjMftE7xX5zJWK7jyoqUPikH` / `tejas-bc42nmsdp-dhe-projects.vercel.app` |
| Temporary Preview fixtures (Mohali / Dehradun / Dhanbad / Leh) | **PASS** — inserted on `nbeslngnrsagarosuaab` only; five seeds untouched |
| List derived State/District + address unchanged | **PASS** — all four fixtures |
| State → District / combined filters (`q=PIN QA`) | **PASS** — each filter hit its fixture |
| Schools CSV (`state=Punjab`, `district=Sahibzada Ajit Singh Nagar`, `q=Mohali`) | **PASS** — HTTP 200, `X-TEJAS-Export-Count: 1`, body contains Mohali |
| Browser UI (OIDC Trusted Sources; Protection enabled) | **PASS** — login shows four PIN fixtures + Alpha seed; Punjab → SAS Nagar filters; counts + CSV href |
| Fixture cleanup | **PASS** — 4 deleted; after status: total 5, seeds 5, pinFixtures 0 |
| Deployment Protection | **Left enabled** (OIDC / `vercel curl` / Playwright header only) |

Evidence artifacts (local, untracked): `.local-qa/pr65-pin-preview-api-verify-results.json`, `.local-qa/pr65-pin-preview-verify-results.json`.

---

## A. API verification (prior — still valid; reconfirmed on post-fix Preview)

| Check | Result |
|-------|--------|
| Unauth admin APIs (`vercel curl`) | **PASS** — 401 |
| School-staff email/password session | **PASS** — 401 owner-only message |
| Owner login (`identity=recovery`, `role=owner`) | **PASS** (reconfirmed on `bc42nmsdp`) |
| Owner list / logout | **PASS** |
| Export filters + `X-Tejas-Export-Count` | **PASS** (reconfirmed Punjab/Mohali CSV) |
| Storage-status connected on Preview | **PASS** |
| File download unauth 401 / owner 200 xlsx | **PASS** |
| After PIN fixture cleanup | **PASS** — 5 seeds, 0 PIN fixtures |

---

## B. Automated test verification (prior + this fix)

| Command | Result |
|---------|--------|
| `registration.test.ts` **without** `--test-force-exit` | **EXIT 0**, 31/31 PASS |
| `india-address.test.ts` + owner/filter suites | **EXIT 0**, 18/18 PASS |
| `tsc --noEmit` / `next lint` / `next build` | **EXIT 0** |

### Open-handle investigation

| Finding | Detail |
|---------|--------|
| Prior hang | PowerShell buffering / force-stop contributed to false “hang” signals |
| This run (no `--test-force-exit`) | Suite completed and process exited **0** |
| Code change for hang | **None** |

---

## C. Actual browser UI verification

**Method:** Playwright + fresh `vercel project token` → `x-vercel-trusted-oidc-idp-token` (Trusted Sources). Deployment Protection **not** disabled.

| Surface | Result |
|---------|--------|
| Prior Preview `dpl_8uBSCEx…` geo/owner suite | **24 PASS / 0 FAIL** |
| Post-fix Preview `dpl_YtTGDj…` PIN suite | **PASS** (`browserOk: true`) — Punjab / SAS Nagar combined filter, counts, CSV href |

---

## D. Geographic / PIN fixture integration verification

| Item | Detail |
|------|--------|
| Project | Preview `nbeslngnrsagarosuaab` only |
| Existing five seeds | **Not modified**; preserved before and after PIN QA |
| PIN fixtures | Mohali/Punjab, Dehradun/Uttarakhand, Dhanbad/Jharkhand, Leh/Ladakh — cleaned up |
| Production writes | None |

---

## E. Owner-only endpoint audit (unchanged)

Owner recovery subject only. School-staff email path rejected. `registrationOwnerAuthorised` on registrations/export/payment/file; request-scoped owner gate on storage/schema-status.

---

## F. State/District parser

Address-only derivation; no form fields; original address preserved; unidentified bucket retained. PIN prefixes are **not** used for State veto or District invention. Short bare codes are ALL-CAPS-only; punctuated abbreviations preserved.

---

## Changed files (this fix)

- `lib/registration/india-geo-data.ts`
- `lib/registration/india-address.ts`
- `lib/registration/india-address.test.ts`
- `TEJAS-PR65-OWNER-ONLY-STATE-DISTRICT-IMPLEMENTATION-REPORT.md`

Local QA scripts under `.local-qa/` remain untracked.

---

## Remaining gaps

None for the PIN-prefix / short-alias defect arc. PR #65 remains **OPEN** (not merged).

## Safety confirmation

- PR #65 **OPEN** — no merge  
- No Production deploy / SQL / migration  
- No payment approval mutations; no real registration mutation beyond temporary Preview PIN QA fixtures (cleaned up)  
- Google Drive disabled  
- Deployment Protection left enabled  
