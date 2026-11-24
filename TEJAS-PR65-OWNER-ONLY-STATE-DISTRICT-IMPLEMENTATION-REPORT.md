# PR #65 — Owner-Only Access + Address-Based State/District Segregation

**Branch:** `feat/registration-review-dashboard-redesign`  
**PR:** [#65](https://github.com/dhevb/tejas/pull/65) — **OPEN**  
**Repo:** `dhevb/tejas`  
**Date:** 2026-11-25  

## Verdict

**CONDITIONAL PASS** — pending Preview deploy + Preview UI/filter verification of the PIN-prefix / short-alias fix below. Automated parser/unit/type/lint/build checks for that fix are complete.

All prior required checks for owner-only administration, address-derived State/District behaviour, Preview API verification, interactive browser UI QA (Trusted Sources OIDC), geographic fixture integration (insert → filter QA → cleanup), and open-handle investigation remain complete. Production was not merged, deployed, or mutated.

---

## Commit / push / Preview

| Item | Value |
|------|--------|
| Feature commit | `d41b2970a1fdcca690a22fbd9887c31a52201a36` |
| Prior report commits | `e615ec1` / `95c5116` |
| PIN / short-alias fix | *(this push — see git log)* |
| Branch | `feat/registration-review-dashboard-redesign` |
| PR state | **OPEN** |
| Prior Preview URL | https://tejas-9z4nixu3o-dhe-projects.vercel.app |
| Prior Deployment ID | `dpl_8uBSCEx93EoD3VGHUQT7p7YsVrz2` |
| Post-fix Preview | *(pending deploy)* |
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
| `npm run lint` | **0** | PASS (existing `<img>` warnings only) |
| `npm run build` | **0** | PASS |

### Preview verification (PIN regressions)

| Check | Status |
|-------|--------|
| Parser unit tests for four regression addresses | **PASS** (local) |
| Preview deploy of fix | **PENDING** |
| Temporary Preview fixtures for four addresses (no seed mutation) | **PENDING** |
| State → District / combined filters / counts / CSV on Preview | **PENDING** |
| Deployment Protection left enabled | Required |

---

## A. API verification (prior — still valid on previous Preview)

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

## B. Automated test verification (prior + this fix)

| Command | Result |
|---------|--------|
| `registration.test.ts` **without** `--test-force-exit` | **EXIT 0**, 31/31 PASS |
| `india-address.test.ts` + owner/filter suites | **EXIT 0**, 18/18 PASS |
| `tsc --noEmit` / `next lint` / `npm run build` | **EXIT 0** |

### Open-handle investigation

| Finding | Detail |
|---------|--------|
| Prior hang | PowerShell buffering / force-stop contributed to false “hang” signals |
| This run (no `--test-force-exit`) | Suite completed and process exited **0** |
| Code change for hang | **None** |

---

## C. Actual browser UI verification (prior Preview `dpl_8uBSCEx…`)

**Method:** Playwright + fresh `vercel project token` → `x-vercel-trusted-oidc-idp-token` (Trusted Sources). Deployment Protection **not** disabled.

**Summary:** **24 PASS / 0 FAIL** (browser suite on prior deployment). Re-run against post-fix Preview is still required for full PASS on this defect arc.

---

## D. Geographic fixture integration verification (prior)

| Item | Detail |
|------|--------|
| Project | Preview `nbeslngnrsagarosuaab` only |
| Existing five seeds | **Not modified**; preserved |
| Prior fixtures | MH/Pune, MH/Nagpur, TN/Chennai, TN/Madurai — cleaned up |
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

1. Preview-only deploy of the PIN/short-alias fix.
2. Preview UI/filter verification for Mohali / Dehradun / Dhanbad / Leh (temporary fixtures; do not mutate the five seeds).
3. Recheck State → District, combined filters, counts, CSV on the new Preview deployment.
4. Record new Preview URL / deployment ID here and flip verdict to **PASS** when complete.

## Safety confirmation

- PR #65 **OPEN** — no merge  
- No Production deploy / SQL / migration  
- No payment approval mutations; no real registration mutation beyond temporary Preview GEO/PIN QA fixtures  
- Google Drive disabled  
- Deployment Protection left enabled  
