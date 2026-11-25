# TEJAS PR #65 — Preview Owner Setup Checklist

**Date:** 2026-11-24  
**PR:** https://github.com/dhevb/tejas/pull/65 (**OPEN / unmerged**)  
**Branch HEAD at doc write:** `1af603f` (+ follow-up kit fixes on this push)  
**Production project (never use):** `zapccpipwxduzlnvjdmy`  
**Agent actions in this pass:** documentation + safe SQL/seed kit corrections only. **No** project create, SQL execute, Vercel env change, or seed run.

---

## Verdict

### CONDITIONAL PASS

Owner dashboard checklist and Preview SQL/seed kits are ready. Setup is **blocked on owner** creating isolated project `tejas-preview-pr65` and attaching Preview-only secrets. Authenticated QA remains unstarted until that handoff.

---

## Phase 1 — Branch verification

| Check | Result |
|-------|--------|
| Branch | `feat/registration-review-dashboard-redesign` |
| Local = remote HEAD | `1af603f98e226016dc9bc3f39df44502c0f4141f` |
| PR #65 | **OPEN**, `mergedAt: null` |
| Companion guide | `preview-sql/pr65-isolated/00-OWNER-CREATE-PREVIEW-PROJECT.md` |

### Kit issues found and corrected on branch

1. **Seed references** used digits `0`/`1`, which fail `referenceIsValid` — fixed to allowed alphabet only.  
2. **Seed re-run** was non-idempotent (duplicate key failures) — now **skips** existing references.  
3. **SQL 01** redundant `pan_holder` re-add / second check — removed (column already on `CREATE TABLE`).

### Remaining prerequisite (owner)

Create isolated Supabase project via **Dashboard only** (not CLI). Agent CLI on this Windows host also failed to load `supabase.exe`.

---

## Phase 2 — Dashboard project creation (owner)

Do this only in the Supabase Dashboard while signed into the correct org.

### 1. Open Supabase Dashboard

1. Go to https://supabase.com/dashboard  
2. Sign in with the dheWeb / TEJAS organization account  
3. Confirm the org switcher shows the intended organization (not a personal sandbox unless that is intentional)

### 2. Create a separate project

1. Click **New project**  
2. **Name:** `tejas-preview-pr65` (exact preferred)  
3. **Organization:** the TEJAS/dheWeb org used for this product  
4. **Region:** choose deliberately  
   - Optional preference: same region as Production (historically pooler notes referenced `ap-northeast-1`) for latency  
   - Any region is acceptable for throwaway Preview QA  
5. **Database password:** generate a **new strong** Preview-only password  
   - Store only in your password manager  
   - **Never** paste into chat, PR comments, Git, or screenshots  
6. **Plan / billing:** read the confirmation screen  
   - Free tier is usually enough for synthetic QA  
   - If the UI asks for paid plan, card, or org spend approval → pause and decide before confirming  
7. Confirm **Create project** only after the above are correct  
8. Wait until status is **Active / Healthy**

### 3. Locate Project Reference and prove isolation

1. Open **Project Settings → General** (or read the URL)  
2. Note **Reference ID** `<PREVIEW_REF>`  
3. API URL will be `https://<PREVIEW_REF>.supabase.co`  
4. Isolation checks (all required):

| Check | Required |
|-------|----------|
| Project name | `tejas-preview-pr65` (or clearly Preview) |
| `<PREVIEW_REF>` ≠ `zapccpipwxduzlnvjdmy` | Yes |
| Host ≠ `zapccpipwxduzlnvjdmy.supabase.co` | Yes |
| Not opened from Production project bookmark | Yes |

**Do not** restore Production backups into this project.

---

## Phase 3 — SQL kit review (do not execute yet)

Run **only** in the new Preview project → **SQL Editor**, in order. Each file is wrapped in a transaction and uses `IF NOT EXISTS` / upsert where applicable. **No DROP/TRUNCATE of business data.**

### Execution order

| # | File | Safe for fresh Preview? | Destructive? |
|---|------|-------------------------|--------------|
| 1 | `preview-sql/pr65-isolated/01-preview-registration-schema.sql` | Yes | No |
| 2 | `preview-sql/pr65-isolated/02-preview-staff-sessions.sql` | Yes | No (`CREATE OR REPLACE` function only) |
| 3 | `preview-sql/pr65-isolated/03-preview-utr-and-payment-columns.sql` | Yes | No |
| 4 | `preview-sql/pr65-isolated/04-preview-storage-buckets.sql` | Yes | No (upserts bucket metadata; keeps `public=false`) |

**Never** run these against Production `zapccpipwxduzlnvjdmy`.

### Per-file summary

#### `01-preview-registration-schema.sql`

- **Purpose:** Core registration / payment / audit schema + RLS enable + indexes.  
- **Creates:** `tejas_schools`, `tejas_principals`, `tejas_coordinators`, `tejas_registrations`, `tejas_students`, `tejas_registration_streams`, `tejas_payments`, `tejas_payment_proofs`, `tejas_book_orders`, `tejas_ebook_access`, `tejas_admin_users`, `tejas_audit_logs`, `tejas_idempotency`, `tejas_registration_files`.  
- **Alters:** additive columns (`previous_*`, `record_snapshot`, payment `history` / `review_note`).  
- **Indexes:** pan, reference, payment status.  
- **Policies:** RLS **enabled**; **no** permissive anon/authenticated policies (service_role used by app).  
- **Storage:** none (see 04).  
- **Dependencies:** none (run first).

**Success check:** SQL success; Table editor shows the tables above; `tejas_registrations` has `record_snapshot`.

#### `02-preview-staff-sessions.sql`

- **Purpose:** Staff recovery-token session versioning.  
- **Creates:** `tejas_staff_sessions`; RPC `tejas_staff_bump_session`; grant execute to `service_role` only.  
- **Policies:** RLS enabled; no public policies.  
- **Dependencies:** none beyond Postgres defaults.

**Success check:** Function listed under Database → Functions; table `tejas_staff_sessions` exists.

#### `03-preview-utr-and-payment-columns.sql`

- **Purpose:** UTR registry + OCR-related payment columns.  
- **Creates:** `tejas_payment_utrs` (+ index, RLS, revoke from anon/authenticated, grant to service_role).  
- **Alters:** `tejas_payments` columns `entered_utr`, `extracted_utr`, `review_reason`, `verification_label`, `approval_method`, `beneficiary_match`, `amount_match`.  
- **Dependencies:** `01` (payments table).

**Success check:** `tejas_payment_utrs` exists; payment table shows new columns.

#### `04-preview-storage-buckets.sql`

- **Purpose:** Private buckets for uploads/proofs.  
- **Buckets:** `tejas-registration-files` (10 MiB; xlsx/xls/csv), `tejas-payment-proofs` (5 MiB; jpeg/png/pdf), both `public=false`.  
- **Policies:** none added (anon denied by default; server uses service_role).  
- **Dependencies:** Storage API available on project (default).

**Success check:** Storage shows both buckets as **Private**.

---

## Phase 4 — Synthetic seed review (do not run yet)

File: `preview-sql/pr65-isolated/seed-preview-synthetic.mjs`

| Requirement | Status |
|-------------|--------|
| Refuses Production URL / ref `zapccpipwxduzlnvjdmy` | Yes |
| Uses only env-supplied Preview URL + service role | Yes |
| Fictional TEST DATA only | Yes |
| No Production import | Yes |
| Credentials not printed | Yes (prints project ref + seed summary only) |
| Public Storage links | No (service_role upload to private buckets) |
| Re-run safety | **Skip** if reference already exists (does not delete/overwrite) |

**Do not run** until owner confirms Preview project + SQL 01–04 + Vercel Preview env + redeploy.

---

## Phase 5 — Preview-only Vercel environment variables (owner)

In https://vercel.com → project **tejas** → **Settings → Environment Variables**, add for **Preview only**:

| Name | Value source |
|------|----------------|
| `TEJAS_ADMIN_TOKEN` | New random string ≥ 16 chars (**not** Production token) |
| `SUPABASE_URL` | `https://<PREVIEW_REF>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Preview project **service_role** key from Project Settings → API |

### Secret-handling precautions

- Never paste passwords, service_role keys, or admin tokens into chat, PR comments, commits, or screenshots.  
- Never copy Production secrets into Preview.  
- Never modify Production environment variables for this task.  
- After saving Preview vars, **Redeploy** the PR Preview deployment for `feat/registration-review-dashboard-redesign`.  
- Confirm `vercel env ls` (or Dashboard) shows those three names on **Preview**, and Production still owns Production secrets separately.

---

## Exact information required to resume (owner → agent)

Reply with **only**:

1. Preview **Project Reference** `<PREVIEW_REF>`  
2. Confirmation: SQL files **01–04** succeeded in that project  
3. Confirmation: Vercel **Preview** env has the three variables and Preview was **redeployed**  
4. Confirmation: `<PREVIEW_REF>` is **not** `zapccpipwxduzlnvjdmy`

**Do not** send database password, service_role key, or `TEJAS_ADMIN_TOKEN`.

Agent will then: isolation verify → seed TEST DATA → authenticated QA → update `TEJAS-PR65-ISOLATED-PREVIEW-SUPABASE-AND-QA-REPORT.md`.

---

## Safety rules (this pass)

- No Production project use  
- No credential copy  
- No Supabase project create/modify by agent  
- No SQL execution by agent  
- No Vercel env configuration by agent  
- No seed run  
- No Drive enable  
- No merge / Production deploy  
