# TEJAS — Registration Review Dashboard Implementation Report

**Date:** 2026-11-24  
**Branch:** `feat/registration-review-dashboard-redesign`  
**PR:** https://github.com/dhevb/tejas/pull/65  
**Latest HEAD:** `3d04afdb0f3b1487e423c09baf7a1ecb728848d6`  
**PAN hardening commit:** `118dd9b`  
**Prior reported HEAD:** `9f3ad4d`  
**Production:** not deployed · not merged  

---

## Verdict

### CONDITIONAL PASS

PAN full-reveal is **disabled server-side** for every staff session (no trusted role model exists). Default masking is enforced on detail API, consolidated XLSX, and schools CSV. Dashboard redesign remains accepted in principle. **Authenticated Preview QA is still blocked** — no Preview-only `TEJAS_ADMIN_TOKEN` is configured (Production secret was not copied). Google Drive remains design-only / not configured.

---

## PAN authorization design

### Audit of PAN surfaces

| Surface | Before | After |
|---------|--------|-------|
| List / overview | Masked (`maskedPan`) | Unchanged — masked |
| Registration detail API | Returned **raw** `school.pan` | Returns **masked** `pan` / `maskedPan`; `fullPanAvailable: false` |
| UI “Reveal full PAN” | Client toggle using API raw value | **Removed** |
| Consolidated XLSX `revealPan=yes` | Any staff → full PAN | Server denies; workbook stays masked |
| Schools CSV `revealPan=yes` | Any staff → full PAN | Server denies; CSV stays masked |
| Other exports (students/payments/books/ebooks) | No PAN column | Unchanged |

### Role / permission model inspection

| Source | Finding |
|--------|---------|
| `tejas_learn_staff.role_name` | CHECK allows **only** `'reviewer'` — no admin/senior |
| `tejas_admin_users` | Has `reviewer`/`finance` in schema but is **unused** by live staff cookie path; historically empty |
| Recovery token session | Subject `recovery` — **no role** |
| Client role/header/query | **Not trusted** |

**Decision (per owner instruction):** because no reliable authorized-admin role is wired into staff sessions, **full-PAN reveal/export is disabled for all staff**. No invented role. No new migration. No new Production env var.

### Server enforcement

- Module: `lib/registration/pan-access.ts` (`FULL_PAN_REVEAL_AVAILABLE = false`)
- `authorizePanReveal()` gates file + export routes; denied attempts log  
  `staff pan reveal denied surface=… subject=… reference=…` **without** the PAN value
- `panValueForExport()` / `staffVisiblePan()` never emit raw PAN while the flag is false
- UI hide alone is insufficient — APIs enforce independently

### PAN test evidence

`npx tsx --test lib/registration/pan-access.test.ts lib/registration/staff-metrics.test.ts` → **9 pass / 0 fail**

- reveal disabled flag asserted  
- `revealPan=yes` denied + log has no PAN  
- detail payload helpers mask  
- consolidated workbook (7 sheets) masked even with `revealPan: true`  
- schools CSV masked even with `revealPan: true`  

---

## Preview authentication status

| Item | Status |
|------|--------|
| Preview deploy (prior READY) | `dpl_FzvuYaiN9WChohU1kPaYJcNnD3we` — https://tejas-2v7e7r5ez-dhe-projects.vercel.app |
| `TEJAS_ADMIN_TOKEN` on Preview | **Not present** (name-only `vercel env ls`: Production only) |
| Copy Production secret into Preview | **Not done** (forbidden) |
| Owner Preview-only secret | **Not configured yet** |
| Staff login on Preview | **BLOCKED** — HTTP 503 “Staff review is not configured…” |
| Unauth review page | HTTP 200 |
| Unauth registrations API | HTTP 401 |

Authenticated click-through is **not claimed as passed**.

---

## Authenticated click-through results

| Check | Result |
|-------|--------|
| Staff login / logout | **BLOCKED** (Preview auth) |
| Summary cards / search / filters / sort / pagination | Code present; **not live-exercised** |
| Registration detail + student list + E/M/FT counts | Code present; **not live-exercised** |
| Fee reconciliation | Unit/offline PASS (`reconcileFeeWithSaved`) |
| Original Excel / consolidated XLSX (7 sheets) | Offline PASS; live download **blocked** |
| Default PAN masking | Unit PASS |
| Unauthorized `revealPan=yes` denial | Unit PASS (server deny + mask) |
| Authorized reveal | **N/A** — no trusted role; reveal disabled |
| Payment proof / OCR fields | Code present; **not live-exercised** |
| Mobile / desktop layout | Code review PASS (`md:hidden` cards) |
| Refresh / session expiration | **Not live-exercised** |

No registrations, payments, or attempts were created against the shared Production database.

---

## XLSX and fee reconciliation

Offline / unit:

- Seven sheets: School Details, Student Details, Stream-wise Summary, Class-wise Summary, Fee Summary, Payment Details, File Backup Status  
- Unique-within-registration vs student-stream totals vs no silent merge of different parent mobiles — `staff-metrics` tests PASS  
- Saved fee reconcile helper PASS  

---

## Google Drive

- Disabled; UI/copy: **Drive not configured**  
- No credentials, migrations, or Production env vars added  
- Registration/payment paths independent of Drive  

---

## Remaining owner approvals

1. Configure a **Preview-only** `TEJAS_ADMIN_TOKEN` in Vercel Preview settings (do not reuse/copy from chat; do not change Production). Then re-run authenticated Preview QA.  
2. Decide whether/when to introduce a **trusted role** for full-PAN reveal (requires approved design; likely schema + auth work — stop for approval before migration/env).  
3. Merge of PR #65 (separate).  
4. Production deploy (separate).  
5. Google Drive credentials/schema if sync is wanted (separate).  

---

## Production change confirmation

| Change | Done? |
|--------|-------|
| Production deploy | **No** |
| Merge PR #65 | **No** (left open) |
| Production env vars | **No** |
| Auth / RLS / Storage policies | **No** |
| Fees / UTR / OCR / approval rules | **No** |
| Historical registration mutation | **No** |
| Drive credentials / migration | **No** |
| Unrelated PRs | Untouched |

---

## Implemented (code)

| Area | Status |
|------|--------|
| Dashboard redesign | Implemented |
| Staff metrics + tests | Implemented |
| Consolidated workbook | Implemented (always masked for now) |
| PAN access module + tests | **New** — reveal disabled |
| Detail/export/file routes | Hardened |
| Review UI | Reveal controls / full-PAN links removed |
