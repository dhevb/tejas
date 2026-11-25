# TEJAS — Owner Dashboard class-wise simplification + Complete Excel export

**Date:** 2026-11-25  
**Branch:** `feat/owner-dashboard-class-export-complete`  
**PR:** https://github.com/dhevb/tejas/pull/68 — **OPEN, NOT MERGED**  
**Production:** **NOT DEPLOYED** · **UNCHANGED**

---

## 1. Three original exports (from Git history)

Verified in `0c9b980` / `49c100d` owner review dashboard (before Phase A/B removed the links):

| # | Historical UI label | API | Format | Scope |
|---|---------------------|-----|--------|-------|
| 1 | Schools CSV (masked PAN, filtered) | `/api/register/admin/export?report=schools` | CSV | Dashboard State/District/status/search filters |
| 2 | Students CSV (filtered) | `…?report=students` | CSV | Same filters |
| 3 | Payments CSV (filtered) | `…?report=payments` | CSV | Same filters |

**Note:** History shows **CSV**, not `.xlsx`. Restored with the same meaning, columns (`lib/registration/reports.ts`), and filter scope. Content was not reinvented.

---

## 2. Fourth export (new)

| Name | Complete School Registration Excel |
|------|-------------------------------------|
| API | `/api/register/admin/export?report=complete` |
| File | `tejas-complete-school-registrations.xlsx` |
| Worksheets | **Exactly one** — `School Registrations` |
| Rows | **One row per registration** |
| Scope | **All** registrations (including rejected / refund_pending); **not** dashboard-filter scoped; labeled in workbook banner |
| Links | Hyperlinks to Owner-authenticated `/api/register/admin/registrations/{ref}/file?kind=upload` and `…?kind=receipt` **only when the file exists** |
| Security | No public Storage URLs; no service-role/secrets/tokens in workbook; missing files → clear unavailable label (no hyperlink) |

**Hyperlink usability:** Links use the same cookie-session Owner routes as the dashboard. Opening a link in the system browser requires an **active Owner session** on that host. Short-lived signed public URLs were **not** used (would weaken Storage controls).

---

## 3. Complete Excel — fields added in security/completeness pass

### Exact fields added (original stored geo + payment UTR separation)

| Column | Source | Notes |
|--------|--------|-------|
| Stored state (original) | `school.state` | Blank preserved; not inferred |
| Stored district (original) | `school.district` | Blank preserved; not inferred |
| Stored city (original) | `school.city` | Blank preserved; not inferred |
| Stored PIN (original) | `school.pin` | Blank preserved; not inferred |
| State (derived from address) | `parseIndiaAddress(schoolAddress)` | Kept separate from stored state |
| District (derived from address) | `parseIndiaAddress(schoolAddress)` | Kept separate from stored district |
| Transaction reference | `payment.transactionReference` | Distinct column |
| Entered UTR | `payment.enteredUtr` | Distinct column |
| OCR-extracted UTR | `payment.extractedUtr` | Distinct column |

**Unchanged:** School address (original) remains the raw stored address. PAN uses `panValueForExport(..., false)` → project mask `ABCDE****F` (`FULL_PAN_REVEAL_AVAILABLE` stays false). Full SchoolForm field coverage is asserted via `SCHOOL_FORM_FIELD_COVERAGE`.

Full inventory: `COMPLETE_REGISTRATION_COLUMNS` in `lib/registration/complete-registration-workbook.ts`.

---

## 4. Host-validation strategy (secure hyperlink origin)

Implemented in `lib/registration/export-origin.ts` as `resolveOwnerExportOrigin(request)`:

| Rule | Behavior |
|------|----------|
| Allowlist | `tejas.dhe.org.in`; `tejas(-*)-dhe-projects.vercel.app`; `tejas-git-*-dhe-projects.vercel.app`; `localhost` / `127.0.0.1` for local QA |
| Preference | `Host` header → `request.url` host → `TEJAS_PUBLIC_ORIGIN` (must be allowlisted) → `VERCEL_URL` (must be allowlisted) |
| Rejected | Unexpected hosts → export returns **400** (no workbook with attacker links) |
| Ignored | `x-forwarded-host` and `x-forwarded-proto` are **never** used to build hyperlinks |
| Protocol | HTTPS forced for Production/Preview; HTTP only for localhost |

Tests in `export-origin.test.ts` cover attacker forwarded-host/proto, unexpected Host, and legitimate Production/Preview hosts.

---

## 5. Missing-file behavior

| Case | Workbook cell | Hyperlink |
|------|---------------|-----------|
| Upload missing | `Student upload unavailable` | None |
| Receipt missing | `Payment proof unavailable` | None |
| Upload present | `Open student upload (Owner login required)` | Owner route `…/file?kind=upload` |
| Receipt present | `Open payment proof (Owner login required)` | Owner route `…/file?kind=receipt` |

Existence uses `uploadExists` / `receiptExists` (Storage **HEAD**, ranged GET fallback; local `fs.access`) — **does not** load full file bytes into memory. Owner file route and `registrationOwnerAuthorised()` / reference binding are unchanged.

---

## 6. Class-wise table — before / after

| Before (PR #67) | After |
|-----------------|-------|
| Columns included Rejected and Refund/adj. | Those columns **removed from main table** |
| Amounts for all statuses in class rows | Main table = **Confirmed + Pending** only (`reported` counted as pending / proof submitted) |
| Rejected/refund still in overview cards | **Unchanged** — still on Rejected/adjustment card |
| Rejected/refund records | **Not deleted or altered**; included in Complete Excel |

Main columns now: Class · Registration records · Unique students · Student-streams · Confirmed Gross Received · Confirmed TEJAS Share · Pending Gross · Pending TEJAS Share. Classes **3–10** retained.

---

## 7. Security regression tests

| Check | Result |
|-------|--------|
| Unauthenticated export/file → 401 | Routes still gate on `registrationOwnerAuthorised()`; local smoke: **401** `{ok:false}` |
| Owner download bound to requested reference | File route: auth → `referenceIsValid` → read by that reference only |
| Invalid / unrelated reference | **404**; no cross-registration exposure |
| No public Storage / permanent public URL / token / service-role in workbook | Asserted; hyperlinks are Owner API paths only |
| `Cache-Control: no-store` on sensitive downloads | Export + file routes |
| `registrationOwnerAuthorised()` not weakened | Source guard test in `export-security.test.ts` |

---

## 8. Validation results (this pass)

| Suite | Result |
|-------|--------|
| `complete-registration-workbook.test.ts` | **PASS** (full SchoolForm coverage, blank geo, missing/present files, fee independence) |
| `export-origin.test.ts` | **PASS** (allowlist + forwarded-header rejection) |
| `export-security.test.ts` | **PASS** (auth / no-store / no public URL) |
| `staff-metrics.test.ts` | **PASS** |
| `pan-access.test.ts` | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npm run lint` | **PASS** (existing `<img>` warnings only) |
| `npm run build` | **PASS** |
| `git diff --check` | **PASS** |

---

## 9. Preview / Production

| Item | Status |
|------|--------|
| Preview URL | https://tejas-lvib1h9mo-dhe-projects.vercel.app/schools/register/review |
| Preview host (links) | `tejas-lvib1h9mo-dhe-projects.vercel.app` (allowlisted `tejas-*-dhe-projects.vercel.app`) |
| Git branch alias (may lag CLI deploy) | https://tejas-git-feat-owner-dashboard-class-export-c2c54b-dhe-projects.vercel.app/schools/register/review |
| Deployment ID | `dpl_G91J85LGp1Qcwnsk89djpQQBofrw` (**Ready**, target=preview) |
| Inspector | https://vercel.com/dhe-projects/tejas/G91J85LGp1Qcwnsk89djpQQBofrw |
| Unauthenticated export/file | Browser/raw: Preview **302** Vercel SSO. Bypass protection (`vercel curl`): app returns **`{"ok":false}`** (Owner gate). Invalid reference same gate before file exposure. |
| Workbook structure QA | Local sample + unit tests: **1 sheet** `School Registrations`, **64 columns**, stored geo + distinct UTR columns, missing receipt → unavailable label / no hyperlink, present upload → Owner-route link on Preview host |
| Production `tejas.dhe.org.in/schools/register/review` | **200** (unchanged; this PR not deployed to Production) |
| Production data / Auth / RLS / Storage / env | **UNCHANGED** |
| Fee policy / payment records / student access | **UNCHANGED** |
| Database schema | **UNCHANGED** |
| Held PRs #10 / #63 / #54 / #12 | **HOLD unchanged** |
| Merge | **NOT MERGED** — awaiting separate Owner approval |

---

## 10. Preview file-existence investigation (5 TEST DATA refs)

Probed Preview Supabase `nbeslngnrsagarosuaab` Storage objects directly (HEAD / ranged GET / `uploadExists` / `receiptExists`). **No fake files created. No registration rows changed. No file contents exposed.**

| Reference | Upload metadata | Actual upload object | Workbook upload link | Proof metadata | Actual proof object | Workbook proof link |
|-----------|-----------------|----------------------|----------------------|----------------|---------------------|---------------------|
| `TEJAS-2026-TESTDATAAAAA23PENDUV` | yes (`…/upload.xlsx`) | **yes** (~18KB, HEAD 200) | **yes** (correct) | no | no (`receiptExt=null`) | **no** → unavailable |
| `TEJAS-2026-TESTDATABBBB22REPTUV` | yes | **yes** (~16KB) | **yes** | no | no | **no** → unavailable |
| `TEJAS-2026-TESTDATACCCC23CPNFUV` | yes | **yes** (~16KB) | **yes** | no | no | **no** → unavailable |
| `TEJAS-2026-TESTDATADDDD24REJTUV` | yes | **yes** (~16KB) | **yes** | no | no | **no** → unavailable |
| `TEJAS-2026-TESTDATAEEEE25REFTUV` | yes | **yes** (~16KB) | **yes** | no | no | **no** → unavailable |

**Verdict:** Workbook upload links match real Storage objects. Payment-proof “unavailable” matches missing objects (`receiptExt` null; seed proofs were opt-in and not present). Discrepancy vs Owner “no uploads available” is **not** a false-positive link generator for these five — Storage has the XLSX objects. Opening workbook links still requires an active Owner session on the Preview host (SSO/Owner gate otherwise blocks download).

### Hardening shipped with this pass
- `objectExists`: treat Storage **400** like missing; reject empty (`content-length: 0`) objects; HEAD-first without full download.
- Workbook `fileAvailability` **fail closed** when map omitted (no links from filename/`receiptExt` alone).
- Tests: metadata≠existence, wrong registration path, empty object, omitted map, no public Storage URLs.

---

## 11. Remaining limitations

- Workbook file hyperlinks require an **active Owner browser session** on the same host (by design; not public Storage links).
- Full PAN reveal remains **disabled** (`FULL_PAN_REVEAL_AVAILABLE = false`) until a trusted role model is approved.
- Existence checks use HEAD (with ranged GET fallback); extremely unusual Storage gateways that reject both may mark a present file unavailable (safe failure → no link).
- Preview Deployment Protection may return SSO **302** before app **401** for unauthenticated browser hits.
- Detail-panel dashboard still shows an upload shortcut from the detail UI without a separate Storage existence gate (workbook export path is gated).

---

## 12. Stop

Stopped after Preview QA. PR left **OPEN** for Owner review. **No merge** and **no Production deploy** without separate explicit Owner approval.
