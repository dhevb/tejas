# PR #65 — Owner-Only Access + Address-Based State/District Segregation

**Branch:** `feat/registration-review-dashboard-redesign`  
**PR:** [#65](https://github.com/dhevb/tejas/pull/65) — **OPEN**  
**Repo:** `dhevb/tejas`  
**Date:** 2026-11-25  

## Verdict

**CONDITIONAL PASS**

Implementation, security gates, unit/full `registration.test.ts`, TypeScript, lint, production build, commit/push, Preview deploy, and **API-level Preview QA** (via `vercel curl`, bypassing Vercel SSO) completed successfully.

Interactive **browser UI** filter/grouping/responsive checks on the Preview URL are **NOT TESTED** in a real browser session because Vercel Deployment Protection redirects to Vercel login. Identified State/District filter behaviour against live Preview rows is **NOT TESTED** with geographic seed data (all five synthetic seeds are intentionally non-geographic); covered by unit tests only.

Production was not merged, deployed, or mutated.

---

## Commit / push

| Item | Value |
|------|--------|
| Feature commit | `d41b2970a1fdcca690a22fbd9887c31a52201a36` |
| Message | Restrict registration admin to the owner and derive State/District from school addresses. |
| Branch pushed | `feat/registration-review-dashboard-redesign` → `origin` |
| PR state | **OPEN** |
| Force-push | **No** |
| Production merge/deploy | **Not performed** |

---

## Preview deployment

| Item | Value |
|------|--------|
| Preview URL | https://tejas-9z4nixu3o-dhe-projects.vercel.app |
| Deployment ID | `dpl_8uBSCEx93EoD3VGHUQT7p7YsVrz2` |
| Inspect | https://vercel.com/dhe-projects/tejas/8uBSCEx93EoD3VGHUQT7p7YsVrz2 |
| `target` | **preview** (not production) |
| Preview Supabase | `nbeslngnrsagarosuaab` (`tejas-preview-pr65`) — local `.env.preview` host confirmed; Preview `storage-status` connected with `urlPresent=true` |
| Production Supabase | Untouched (`zapccpipwxduzlnvjdmy`) |
| Secrets printed | **No** |

---

## 1. Owner-only authorization audit

**Rule:** One administrative authority — owner recovery session (`subject=recovery` via `TEJAS_ADMIN_TOKEN`). Owner holds Super Admin + Admin + Staff capabilities for registration administration. School staff have no role/login/session/dashboard/admin API access. Cookie HMAC; no client-supplied role/userId/auth flag trusted.

| Endpoint | Methods | Auth | Unauthorized | Evidence |
|----------|---------|------|--------------|----------|
| `/api/register/admin/session` | POST | Owner token only; email/password rejected | 401 owner-only message | Unit **PASS**; Preview `vercel curl` school-staff → 401 + owner-only text **PASS**; owner token → 200 `identity=recovery` `role=owner` + HttpOnly cookie **PASS** |
| `/api/register/admin/session` | DELETE | Clears cookie | 200 | Preview logout **PASS**; subsequent list **401 PASS** |
| `/api/register/admin/registrations` | GET | `registrationOwnerAuthorised()` | 401 JSON, no rows | Preview unauth via `vercel curl` **401 PASS**; owner list 5 rows **PASS** |
| `/api/register/admin/registrations/[reference]` | GET | `registrationOwnerAuthorised()`; PAN masked | 401 | Code + unit alignment **PASS**; live detail fetch **NOT TESTED** this turn |
| `/api/register/admin/registrations/[reference]` | PATCH | `registrationOwnerAuthorised()` | 401 | Code audit **PASS**; payment-mutation exercise **NOT TESTED** (safety: not exercised) |
| `/api/register/admin/registrations/[reference]/file` | GET | `registrationOwnerAuthorised()` | 401 | Code audit **PASS**; live file download **NOT TESTED** |
| `/api/register/admin/export` | GET | `registrationOwnerAuthorised()` + filters | 401 | Preview export unidentified count=5; Maharashtra count=0 **PASS** |
| `/api/register/admin/payment` | GET, PUT | `registrationOwnerAuthorised()` (**fixed** this review) | 401 | Unit source/401 **PASS**; Preview owner GET **200 PASS** |
| `/api/register/storage-status` | GET | `registrationOwnerRequestAuthorised` | 401 Owner sign-in | Unit **PASS**; Preview owner connected **PASS** |
| `/api/register/schema-status` | GET | `registrationOwnerRequestAuthorised` | 401 | Unit **PASS**; Preview live **NOT TESTED** this turn |
| School-staff / learn email path on session | — | Rejected before account lookup | 401 | Unit + Preview **PASS** |
| Client role flags | — | Not accepted | N/A | Code audit **PASS** |

**Gap closed this review:** `admin/payment` previously used `staffAuthorised`; now owner-gated.

---

## 2. State / District identification audit

| Check | Result |
|-------|--------|
| Existing `schoolAddress` only; no form fields | **PASS** |
| Original address not rewritten in storage | **PASS** (derived display/export fields only) |
| `india-geo-data.ts` States/UTs + districts + aliases | **PASS** (in-repo maintained set) |
| Abbreviations / variants / conflict / incomplete | **PASS** (unit) |
| Unidentified bucket retained | **PASS** (unit + Preview: 5/5 seeds unidentified, still listed & exported) |
| State constrains District (UI) | Implemented; interactive UI **NOT TESTED** (SSO) |
| Combined filters | Unit **PASS**; Preview export `state=Not Identified&status=confirmed` → count **1 PASS** |
| Counts / CSV follow filters | Preview `X-Tejas-Export-Count` **PASS** |
| Grouping chips / clear | Implemented; interactive UI **NOT TESTED** (SSO) |

**Preview seeds (unchanged, not geographically invented):** all five `TEST DATA …` addresses → **State/District Not Identified**; original prefixes preserved (`TEST DATA Boulevard …`).

---

## 3. Tests

### Prior hang

| Finding | Detail |
|---------|--------|
| Cause | Process **exit stall** from open handles after tests completed (not a failing assertion). PowerShell `Select-Object -Last` also buffered until EOF. |
| This run | `tsx --test --test-force-exit` |
| Prior force-stop | **Not claimed as PASS** |

### Commands / results

```
npx tsx --test --test-concurrency=1 --test-timeout=90000 --test-force-exit lib/registration/registration.test.ts
→ EXIT 0 | 31 pass / 0 fail / 0 skipped

npx tsx --test --test-concurrency=1 --test-force-exit lib/registration/india-address.test.ts \
  lib/registration/pan-access.test.ts lib/registration/staff-recovery.test.ts \
  lib/registration/staff-metrics.test.ts preview-sql/pr65-isolated/seed-preview-synthetic.test.mjs
→ EXIT 0 | 34 pass / 0 fail

npx tsx --test --test-concurrency=1 --test-force-exit lib/registration/india-address.test.ts
→ EXIT 0 | 14 pass (includes admin/payment owner gate)

npx tsc --noEmit → EXIT 0
npx next lint → EXIT 0 (pre-existing <img> warnings only)
npm run build → EXIT 0
```

---

## 4. Preview / “browser” QA evidence

Method: **`vercel curl`** against deployment `dpl_8uBSCEx93EoD3VGHUQT7p7YsVrz2` (Trusted Sources / protection bypass). Direct browser → Vercel SSO login (**blocked**).

| # | Check | Result |
|---|-------|--------|
| 1 | Owner login / logout | **PASS** (API: 200 cookie; DELETE 200; list after → 401) |
| 2 | Unauthenticated access denied | **PASS** (`vercel curl` list **401**; raw browser without bypass gets SSO HTML — protection, not app leak) |
| 3 | School-staff login rejected | **PASS** (401 + owner-only error text) |
| 4 | Direct API denied without owner auth | **PASS** (registrations/export/payment/storage via curl) |
| 5 | State filter | **PASS** (export `state=State/District Not Identified` → 5; `Maharashtra` → 0) |
| 6 | District depends on State | Unit **PASS**; interactive UI **NOT TESTED** (SSO); no identified districts in Preview seed |
| 7 | Combined State + District + search + payment | Export `state=Not Identified&status=confirmed` → **1 PASS**; search UI **NOT TESTED** |
| 8 | Grouping / overview counts | API list exposes derived keys; interactive grouping UI **NOT TESTED** |
| 9 | CSV matches filters | **PASS** (`X-Tejas-Export-Count`, address column present) |
| 10 | Unidentified visible/included | **PASS** (5/5 listed + exported) |
| 11 | Original addresses unchanged | **PASS** (`TEST DATA*` prefixes on list) |
| 12 | PAN masking / file access | List masked `EEEEE****E` **PASS**; file download **NOT TESTED** |
| 13 | Desktop / mobile responsive | **NOT TESTED** (SSO blocks interactive browser) |

Review page HTML (via `vercel curl`): contains “Registration review is owner-only. School staff do not receive accounts…” — **PASS**.

---

## 5. Changed files (committed)

- `lib/registration/staff.ts`, `india-address.ts`, `india-geo-data.ts`, `export-filters.ts`, `store.ts`, `reports.ts`, `india-address.test.ts`, `registration.test.ts`
- `app/api/register/admin/session|registrations|export|payment|…/file` routes; `storage-status`; `schema-status`
- `app/schools/register/review/review-dashboard.tsx`; `app/learn/staff/staff-console.tsx`
- `package.json`; `preview-sql/pr65-isolated/seed-preview-synthetic.mjs` + `.test.mjs`
- This report

**Not committed:** `.local-qa/`, `.env*`, other untracked historical TEJAS-PR65 audit markdowns.

---

## 6. Limitations

- Interactive Preview browser QA blocked by Vercel Deployment Protection (SSO).
- Preview seeds cannot exercise identified State→District UI paths without new synthetic geographic fixtures (not added; existing seeds not mutated).
- District dataset is maintained in-repo, not a live LGD sync.
- `admin/payment` PUT / registration PATCH / file download not re-exercised against Preview in this pass (authorization code audited; destructive payment changes avoided).

## 7. Safety confirmation

- PR #65 **OPEN**
- Preview only; Production unchanged
- No Production SQL / migration / seed / merge / deploy
- Google Drive still disabled
- No school-staff roles
- No State/District registration form fields
