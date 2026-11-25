# TEJAS PR #65 — Preview Environment Safety Audit

**Date:** 2026-11-24  
**Branch HEAD at audit start:** `a8dd2c8`  
**PR:** https://github.com/dhevb/tejas/pull/65 (OPEN — not merged)  
**Scope:** School registration **review** page + staff admin APIs (read-only analysis)  
**Actions taken:** None — no env create/modify, no schema/RLS/Storage/registration/payment changes, no Production deploy  

---

## Verdict

### NOT SAFE TO CONFIGURE PREVIEW
**(if “configure Preview” means enabling Production Supabase privileged credentials on the Preview deployment)**

Pointing Preview at the **Production** Supabase project with `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` would give the Preview app **full bypass-RLS write power** over Production registration, payment, storage, and staff-session data. Even a careful click-through can mutate Production via:

- staff **login/logout** → `tejas_staff_bump_session` (session version upsert)
- dashboard **Mark verified / Reject / Refund** → `PATCH` payment + audit insert

### Conditionally safe configurations (owner-only; agent does not apply)

| Option | Safe for Production data? | Useful for full dashboard QA? |
|--------|---------------------------|-------------------------------|
| **A.** Preview-only `TEJAS_ADMIN_TOKEN` alone | Yes (no DB link) | **No** — list/detail/downloads empty / unavailable on Vercel without durable storage |
| **B.** Separate **Preview Supabase project** + Preview-only URL + Preview-only service role for *that* project + Preview-only admin token + synthetic seed data | Yes (writes stay in Preview project) | Yes |
| **C.** Production Supabase + **read-only** DB role | Would be safer *in principle* | **Not supported today** — app only accepts service-role-class keys and still exposes write APIs |
| **D.** Copy Production service-role / DB password / secret keys into Preview | **No** | Dangerous |

**Do not** copy Production service-role keys, database passwords, or other privileged Production credentials into Preview.

---

## 1. Environment variable dependency table

### Required / used by school registration review + staff APIs

| Variable | Required by | Public / secret | Read / write capability of the credential | Connects to |
|----------|-------------|-----------------|---------------------------------------------|-------------|
| `TEJAS_ADMIN_TOKEN` | `lib/registration/auth.ts` (`adminSecret`, cookie HMAC, `tokenMatches`); `POST/DELETE /api/register/admin/session` | **Secret** | Auth secret only (not a DB credential). Enables staff cookie issuance/verification | App-local; not a Supabase resource |
| `SUPABASE_URL` | `lib/registration/durable.ts` → `database.ts`, `lib/portal/supabase-rest.ts` (staff directory/sessions) | **Secret in practice** (project locator; treat as sensitive) | N/A by itself; selects API origin | Whichever Supabase project the URL names (today Production-only in Vercel) |
| `SUPABASE_SERVICE_ROLE_KEY` | Preferred server key in `durable.ts` `SERVER_KEY_NAMES` | **Secret — privileged** | **Full read + write** via PostgREST + Storage as `service_role` (RLS bypass). RPC `tejas_staff_bump_session` granted to `service_role` only | Same project as `SUPABASE_URL` |
| `SUPABASE_SECRET_KEY` | Fallback server key if service-role name absent (`durable.ts`) | **Secret — privileged** | Treated identically to service-role key by the app (`apikey` + `Bearer`) | Same project as `SUPABASE_URL` |

### Optional / related (not required for basic review login; listed for completeness)

| Variable | Role in review stack | Public / secret | Notes |
|----------|----------------------|-----------------|-------|
| `ANON` / `SUPABASE_ANON_KEY` / `SUPABASE_PUBLISHER_KEY` / `Publishable_key` | Used by inspect/client-key helpers (`supabase-inspect.ts`), **not** by staff review REST path | Secret / publishable depending on name | Staff APIs do **not** use anon for registration CRUD |
| `SUPABASE_DB_URL` | Direct Postgres URL (Production env present) | **Secret — privileged** | **Not** referenced by review page/staff admin route code paths audited here |
| `SERVICE_ROLE` / `Secret_keys` | Legacy/alias names in Vercel Production | Secret | **Not** in `durable.ts` `SERVER_KEY_NAMES` — app will ignore unless also set as `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` |
| `TEJAS_DATA_DIR` / `TEJAS_DATA_KEY` | Local sealed file store fallback (`paths.ts`, `seal.ts`, `store.ts`) | Secret / path | On `VERCEL=1` without durable config, remote writes throw; local disk is ephemeral — **not** a Production DB |
| `TEJAS_ACCEPT_PAYMENT_PROOF` | Tests / legacy toggles | Config | Proof acceptance in prod path follows `durableStorageConfigured()` |
| `VERCEL` / `VERCEL_ENV` / `NODE_ENV` | Platform | Public system | Forces durable path expectations; OCR probe allows Preview |
| `TEJAS_CONTENT_QA_*` / portal secrets | Learning portal QA | Secret | **Out of scope** for school registration review |

### Current Vercel targeting (name-only; no values)

All application secrets listed by `vercel env ls` are **Production-only**. Preview currently has **no** `TEJAS_ADMIN_TOKEN`, **no** `SUPABASE_URL`, **no** service-role class keys (confirmed earlier via Preview `env pull` key scan).

---

## 2. Route → dependency map

| Route / surface | Env needed to function | DB operations when durable configured |
|-----------------|------------------------|----------------------------------------|
| `GET /schools/register/review` (page shell) | None for HTML shell | None |
| `POST /api/register/admin/session` (recovery token) | `TEJAS_ADMIN_TOKEN` required; Supabase optional | **WRITE** `rpc/tejas_staff_bump_session` when Supabase configured; else version `0` cookie |
| `POST /api/register/admin/session` (email/password) | `TEJAS_ADMIN_TOKEN` + Supabase server key | **READ** `tejas_learn_staff`; **WRITE** bump session |
| `DELETE /api/register/admin/session` | Cookie + `TEJAS_ADMIN_TOKEN` to clear/sign | **WRITE** bump session when subject present + DB up |
| `GET /api/register/admin/registrations` | Staff cookie; durable URL+server key for real data | **READ** registrations snapshot |
| `GET /api/register/admin/registrations/[ref]` | Staff cookie; durable | **READ** one registration (API masks PAN) |
| `PATCH .../registrations/[ref]` | Staff cookie; durable | **WRITE** payment status + `tejas_audit_logs` |
| `GET .../file` (upload/receipt/consolidated) | Staff cookie; durable for stored files | **READ** DB + Storage (`tejas-payment-proofs` / registration files) |
| `GET /api/register/admin/export` | Staff cookie; durable | **READ** list → CSV |
| `GET/PUT /api/register/admin/payment` | Staff cookie; payment config on **local** `TEJAS_DATA_DIR` | PUT writes **local file** (ephemeral on Vercel); not Supabase schema |

Staff HTTP client: `lib/registration/database.ts` and `lib/portal/supabase-rest.ts` both send:

`apikey: <server key>` and `Authorization: Bearer <server key>`

from `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` only.

---

## 3. Privileged credential finding

**Yes — staff review durable access uses service-role-class credentials**, not anon.

- Selection: `lib/registration/durable.ts` (`SERVER_KEY_NAMES`).
- RLS: service role bypasses RLS; bump RPC is `GRANT … TO service_role` only.
- There is **no** application env today for a least-privilege read-only PostgREST role.

---

## 4. Can authenticated Preview QA be done safely?

### Separate Preview Supabase project/database — **YES (preferred)**

- Preview env: Preview-only `TEJAS_ADMIN_TOKEN`, Preview project `SUPABASE_URL`, Preview project `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`) for **that** project only.
- Seed **synthetic** registrations/proofs in the Preview project (never Production rows).
- Login session bumps and accidental payment PATCH stay inside Preview project.
- Google Drive remains disabled (no Drive env).

### Explicit read-only role against Production — **NOT SAFE / NOT VIABLE with current code**

- App cannot be pointed at a read-only key without code changes (only service-role-class names accepted).
- Even with a hypothetical read-only key, UI still offers payment mutation; failures would be uneven and login bump would fail or require write.
- Using Production data with any write-capable key is **not** “read-only QA.”

### Production URL + Production service role on Preview — **NOT SAFE**

See write analysis below.

---

## 5. Preview operations that can write shared Production DB

Assumes Preview were given Production `SUPABASE_URL` + Production service-role-class key (disallowed recommendation):

| Operation | Writes Production? | What |
|-----------|--------------------|------|
| Open review page (unauthenticated) | No | Static/RSC shell |
| Staff recovery **login** | **Yes** | `tejas_staff_bump_session` upserts `tejas_staff_sessions` |
| Staff **logout** | **Yes** (if DB up) | Session version bump |
| Load dashboard list/detail | Read-only | Selects |
| Downloads / consolidated XLSX / CSV | Read-only | Selects + Storage GET |
| **Mark verified / Reject / Refund** | **Yes** | Payment PATCH + audit insert |
| Payment settings PUT | Local FS only on Vercel | Not Production Postgres (still unsafe to treat as Prod-safe admin) |
| Unauthorized API | No | 401 |
| Audit “logging” via `console.info` | No DB | May include reference/status; must not include PAN (PAN deny path already avoids PAN in logs) |

**Login alone is not read-only** when durable Production credentials are present.

If Preview has **only** `TEJAS_ADMIN_TOKEN` (no Supabase): login uses session version `0` and does **not** write Production; list/detail cannot load Production rows.

---

## 6. Production vs Preview resource mapping (today)

| Resource | Production Vercel | Preview Vercel (current) |
|----------|-------------------|---------------------------|
| `TEJAS_ADMIN_TOKEN` | Present | **Absent** |
| `SUPABASE_URL` | Present → Production Supabase project | **Absent** |
| `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` | Present | **Absent** |
| Registration / payment tables | Production DB | Unreachable from Preview |
| `tejas-payment-proofs` storage | Production | Unreachable from Preview |
| Staff sessions | Production | Unreachable from Preview |
| Google Drive | Not configured | Not configured |

---

## 7. Minimum safe Preview configuration (owner actions — do not apply yet)

### Minimum for login-only smoke (no Production DB risk)

1. Add **Preview-only** `TEJAS_ADMIN_TOKEN` (≥16 chars, **different** from Production).  
2. Redeploy Preview.  
3. Expect: login works; registration list empty/unavailable — **incomplete QA**.

### Minimum for **full** authenticated Preview QA without touching Production data

1. Create a **separate** Supabase project (or isolated non-Production database) for TEJAS Preview.  
2. Apply required migrations / seed **synthetic** school registrations, students, fees, optional payment proofs.  
3. Set Preview env only:  
   - `TEJAS_ADMIN_TOKEN` (Preview-only)  
   - `SUPABASE_URL` (Preview project)  
   - `SUPABASE_SERVICE_ROLE_KEY` **or** `SUPABASE_SECRET_KEY` (**Preview project** key only)  
4. Do **not** attach Production service-role, Production `SUPABASE_DB_URL`, or Production DB passwords.  
5. Redeploy Preview branch.  
6. QA rules: no Production host; avoid relying on mutation buttons unless intentional Preview-only test data; Drive stays off.

### Explicitly out of scope / rejected

- Copying Production `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_DB_URL`, or DB passwords into Preview.  
- Enabling Google Drive.  
- Schema/RLS/Storage changes for this audit.  
- Merge/deploy Production.

---

## 8. Owner actions required (checklist)

1. Decide QA mode: **login-only smoke (A)** vs **isolated Preview database (B)**.  
2. If **B**: provision Preview Supabase + synthetic data + Preview-only secrets.  
3. If anyone proposed Production service-role on Preview: **reject** — **NOT SAFE**.  
4. After safe Preview env exists and redeploy completes: resume authenticated Preview QA on PR #65.  
5. Keep PR #65 **OPEN** until owner review.

---

## 9. Safety confirmations for this audit

- No environment variables created or modified  
- No database schema, RLS, or Storage policy changes  
- No registration/payment mutations performed  
- No secret values printed  
- No merge / Production deploy  
