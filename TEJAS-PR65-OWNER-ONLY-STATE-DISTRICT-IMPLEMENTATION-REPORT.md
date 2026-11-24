# PR #65 — Owner-Only Access + Address-Based State/District Segregation

**Branch:** `feat/registration-review-dashboard-redesign`  
**PR:** #65 — **OPEN** (not merged; Production not deployed)  
**Repo:** `dhevb/tejas`  
**Date:** 2026-11-25  

## Verdict

**CONDITIONAL PASS** — Implementation, unit/full registration tests, TypeScript, lint, and production build completed. Preview redeploy + browser QA for the new filters are documented below with PASS / NOT TESTED distinctions; any check not executed is **NOT TESTED**.

## Commit / push

| Item | Value |
|------|--------|
| Commit | *(filled after push)* |
| Branch pushed | `feat/registration-review-dashboard-redesign` |
| Remote | `origin` (`https://github.com/dhevb/tejas`) |
| PR state | **OPEN** |
| Production merge/deploy | **Not performed** |

## Preview deployment

| Item | Value |
|------|--------|
| Preview Supabase project | `nbeslngnrsagarosuaab` (`tejas-preview-pr65`) |
| Production Supabase | Untouched (`zapccpipwxduzlnvjdmy`) |
| Preview URL | *(filled after deploy)* |
| Deployment ID | *(filled after deploy)* |
| Production credentials used | **No** |

---

## 1. Owner-only authorization audit (endpoint-by-endpoint)

**Rule:** Exactly one administrative authority — the owner recovery session (`STAFF_RECOVERY_SUBJECT` / `TEJAS_ADMIN_TOKEN`). Owner = Super Admin + Admin + Staff for registration administration. School staff have no role, login, session, dashboard, or admin API access. UI hiding is not authorization.

| Endpoint | Methods | Auth implementation | Unauthorized behaviour | Test evidence |
|----------|---------|---------------------|------------------------|---------------|
| `/api/register/admin/session` | POST | Owner token via `tokenMatches` only; email/password **rejected** with owner-only message; creates recovery subject session | 401; no cookie | `india-address.test.ts` owner session + school-staff reject — **PASS** |
| `/api/register/admin/session` | DELETE | Clears cookie; bumps session version when subject present | 200 + cleared cookie | Existing session tests — **PASS** (recovery path) |
| `/api/register/admin/registrations` | GET | `registrationOwnerAuthorised()` | 401 `{ ok: false }` — no registration payload | Source audit + owner gate — **PASS** (code); live Preview — see browser QA |
| `/api/register/admin/registrations/[reference]` | GET | `registrationOwnerAuthorised()`; PAN via `staffVisiblePan` (masked while reveal disabled) | 401; no school/PAN leak | Code audit — **PASS**; Preview — see QA |
| `/api/register/admin/registrations/[reference]` | PATCH | `registrationOwnerAuthorised()`; payment status update (unchanged logic) | 401 | Code audit — **PASS** |
| `/api/register/admin/registrations/[reference]/file` | GET | `registrationOwnerAuthorised()`; PAN reveal gated separately | 401 | Code audit — **PASS** |
| `/api/register/admin/export` | GET | `registrationOwnerAuthorised()`; filter query params; masked PAN export | 401 | Unit filter tests + code — **PASS** |
| `/api/register/admin/payment` | GET, PUT | `registrationOwnerAuthorised()` (**fixed** this review; was `staffAuthorised`) | 401 | `india-address.test.ts` payment API — **PASS** |
| `/api/register/storage-status` | GET | `registrationOwnerRequestAuthorised(request)` | 401 `Owner sign-in is required.`; no storage fields | `registration.test.ts` storage status — **PASS** |
| `/api/register/schema-status` | GET | `registrationOwnerRequestAuthorised(request)` | 401; no schema leak | `registration.test.ts` schema status — **PASS** |
| Client role / userId / auth flag | — | **Not trusted**; cookie HMAC + owner subject only | N/A | Code audit — **PASS** |
| School-staff email/password | — | Session POST rejects before any account lookup | 401 owner-only message | Unit — **PASS** |
| Legacy learn email session via same route | — | Same rejection; learn console now token-only | 401 if email sent | Code + UI — **PASS** |

**No alternate school-staff authentication path remains** on registration admin session or admin APIs.

---

## 2. State / District identification audit

| Check | Result |
|-------|--------|
| Source = existing `schoolAddress` only | **PASS** |
| No State/District form fields added | **PASS** |
| Original address never rewritten in storage | **PASS** (derived fields only on StaffRow / detail / CSV) |
| Dataset: India States/UTs + districts + aliases (`india-geo-data.ts`) | **PASS** (maintained in-repo; not live LGD feed) |
| Abbreviations / spelling variants | **PASS** (unit) |
| Incomplete / ambiguous / conflicting → Not Identified | **PASS** (unit) |
| Never invent district | **PASS** (unit) |
| Unidentified retained in filters/totals/exports | **PASS** (unit + dashboard filter key) |
| State constrains District options | **PASS** (UI + unit filter) |
| Combined State + District + search + payment filters | **PASS** (unit) |
| Overview counts / CSV follow filters | **PASS** (unit + `X-TEJAS-Export-Count`) |
| Grouping chips / clear state | **PASS** (implemented); Preview browser — see QA |

**Parser limitations:** Rare/new district names may be “District Not Identified” under a known State. Short English-word aliases (`as`, `or`) omitted intentionally. PIN used only for conflict notes — never invents State alone.

---

## 3. Tests

### Hang investigation (prior force-stop)

| Finding | Detail |
|---------|--------|
| Cause | Process **exit stall** from open handles after tests finished (not a stuck assertion). Prior PowerShell `Select-Object -Last` also buffered until EOF, appearing hung. |
| Fix for this run | `tsx --test --test-force-exit` |
| Label | Not marked FAIL; previous force-stop was **NOT a suite PASS** and is not claimed as PASS |

### Commands and results

```
npx tsx --test --test-concurrency=1 --test-timeout=90000 --test-force-exit lib/registration/registration.test.ts
→ EXIT 0 | tests 31 | pass 31 | fail 0 | skipped 0 | ~3.6s

npx tsx --test --test-concurrency=1 --test-force-exit lib/registration/india-address.test.ts lib/registration/pan-access.test.ts lib/registration/staff-recovery.test.ts lib/registration/staff-metrics.test.ts preview-sql/pr65-isolated/seed-preview-synthetic.test.mjs
→ EXIT 0 | tests 34 | pass 34 | fail 0

npx tsx --test --test-concurrency=1 --test-force-exit lib/registration/india-address.test.ts
→ EXIT 0 | tests 14 | pass 14

npx tsc --noEmit → EXIT 0
npx next lint → EXIT 0 (pre-existing img warnings only)
npm run build → EXIT 0
```

---

## 4. Changed files (this feature set)

### Owner-only
- `lib/registration/staff.ts`
- `app/api/register/admin/session/route.ts`
- `app/api/register/admin/registrations/route.ts`
- `app/api/register/admin/registrations/[reference]/route.ts`
- `app/api/register/admin/registrations/[reference]/file/route.ts`
- `app/api/register/admin/export/route.ts`
- `app/api/register/admin/payment/route.ts` *(owner gate fix)*
- `app/api/register/storage-status/route.ts`
- `app/api/register/schema-status/route.ts`
- `app/schools/register/review/review-dashboard.tsx`
- `app/learn/staff/staff-console.tsx`

### State/District
- `lib/registration/india-address.ts` *(new)*
- `lib/registration/india-geo-data.ts` *(new)*
- `lib/registration/export-filters.ts` *(new)*
- `lib/registration/store.ts`
- `lib/registration/reports.ts`

### Tests / tooling / Preview seed harden
- `lib/registration/india-address.test.ts` *(new)*
- `lib/registration/registration.test.ts`
- `package.json`
- `preview-sql/pr65-isolated/seed-preview-synthetic.mjs`
- `preview-sql/pr65-isolated/seed-preview-synthetic.test.mjs` *(new)*
- `TEJAS-PR65-OWNER-ONLY-STATE-DISTRICT-IMPLEMENTATION-REPORT.md`

**Excluded from commit:** `.local-qa/`, `.env*`, secrets.

---

## 5. Browser / Preview QA

*(Completed after deploy — fill results below.)*

| # | Check | Result |
|---|-------|--------|
| 1 | Owner login and logout | |
| 2 | Unauthenticated access denied | |
| 3 | School-staff login rejected | |
| 4 | Direct API access denied without owner auth | |
| 5 | State filter works | |
| 6 | District filter depends on State | |
| 7 | Combined filters | |
| 8 | Grouping and overview counts | |
| 9 | CSV export matches filters | |
| 10 | Unidentified addresses visible/included | |
| 11 | Original addresses unchanged | |
| 12 | PAN masking / file access protected | |
| 13 | Desktop and mobile layouts | |

### Preview seed geography

All five synthetic Preview seed addresses are non-geographic `TEST DATA …` strings → **State/District Not Identified**. They remain visible in that bucket. **No geographic invention** and **no seed record mutation** for this review.

---

## 6. Safety confirmation

- PR #65 **OPEN**
- No Production merge / deploy / SQL / migration / seed
- Preview project allowlist only: `nbeslngnrsagarosuaab`
- Google Drive remains disabled
- No school-staff roles introduced
- Payment approval/rejection/refund logic not redesigned (PATCH still owner-gated; statuses unchanged by this feature)
- Registration records not deleted/overwritten by this change set
