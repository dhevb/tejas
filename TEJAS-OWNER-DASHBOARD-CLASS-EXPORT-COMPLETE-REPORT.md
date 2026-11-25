# TEJAS — Owner Dashboard class-wise simplification + Complete Excel export

**Date:** 2026-11-25  
**Branch:** `feat/owner-dashboard-class-export-complete` (from `origin/main` @ `d8c3ef7` / PR #67 merge)  
**PR:** *(filled after open)* — **OPEN, NOT MERGED**  
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
| Links | Hyperlinks to Owner-authenticated `/api/register/admin/registrations/{ref}/file?kind=upload` and `…?kind=receipt` |
| Security | No public Storage URLs; no service-role/secrets in workbook; missing proof → “Payment proof unavailable” (no broken link) |

**Hyperlink usability:** Links use the same cookie-session Owner routes as the dashboard. Opening a link in the system browser requires an **active Owner session** on that host. Short-lived signed public URLs were **not** used (would weaken Storage controls).

---

## 3. Complete Excel column inventory

See `COMPLETE_REGISTRATION_COLUMNS` in `lib/registration/complete-registration-workbook.ts` (school form fields, derived State/District, masked PAN, student upload name + link, payment fields including gross / school share / amountDue, entered/OCR UTR, proof name + link). No invented fields; blanks preserved.

---

## 4. Class-wise table — before / after

| Before (PR #67) | After |
|-----------------|-------|
| Columns included Rejected and Refund/adj. | Those columns **removed from main table** |
| Amounts for all statuses in class rows | Main table = **Confirmed + Pending** only (`reported` counted as pending / proof submitted) |
| Rejected/refund still in overview cards | **Unchanged** — still on Rejected/adjustment card |
| Rejected/refund records | **Not deleted or altered**; included in Complete Excel |

Main columns now: Class · Registration records · Unique students · Student-streams · Confirmed Gross Received · Confirmed TEJAS Share · Pending Gross · Pending TEJAS Share.

---

## 5. Tests

| Suite | Result |
|-------|--------|
| `staff-metrics.test.ts` | **17/17 PASS** |
| `complete-registration-workbook.test.ts` | **3/3 PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npm run lint` | **PASS** (existing `<img>` warnings) |
| `npm run build` | *(this session)* |
| `git diff --check` | **PASS** |

Owner-only export/file routes continue to require `registrationOwnerAuthorised()` (401 when unauthenticated). File route binds downloads to the requested reference after auth (IDOR requires Owner session; invalid reference → 404).

---

## 6. Preview / Production

| Item | Status |
|------|--------|
| Preview URL / deployment ID | *(filled after deploy)* |
| Production data / Auth / RLS / Storage / env | **UNCHANGED** |
| Fee policy / payment records / student access | **UNCHANGED** |
| Held PRs #10 / #63 / #54 / #12 | **HOLD unchanged** |
| Merge | **NOT MERGED** |

---

## 7. Stop

Stopped after Preview QA. PR left **OPEN** for Owner review. No merge without separate explicit approval.
