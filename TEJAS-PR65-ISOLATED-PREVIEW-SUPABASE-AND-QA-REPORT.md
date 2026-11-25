# TEJAS PR #65 — Isolated Preview Supabase Setup and Authenticated QA Report

**Date:** 2026-11-24  
**PR:** https://github.com/dhevb/tejas/pull/65  
**Branch:** `feat/registration-review-dashboard-redesign`  
**Verified HEAD:** `c9795ce852ca9da99a2633e6ad28ffcda8aa2994` (local = origin at audit start)  
**Production project (forbidden target):** `zapccpipwxduzlnvjdmy`  
**PR status:** **OPEN / UNMERGED**

---

## Final verdict

### CONDITIONAL PASS — stopped at Phase 2 (owner action required)

Phase 1 dependency work and Preview schema/seed **kits** are ready on the branch.  
**Phases 2–7 cannot complete** until the owner creates an isolated Supabase project and attaches Preview-only secrets (agent must not create billable projects or handle Production credentials).

Authenticated Preview QA: **NOT RUN** (blocked).

---

## Phase 1 — Current state and dependency verification

| Check | Result |
|-------|--------|
| Branch HEAD | `c9795ce` matches `origin/feat/registration-review-dashboard-redesign` |
| Safety audit | `TEJAS-PR65-PREVIEW-ENVIRONMENT-SAFETY-AUDIT.md` reviewed |
| Production SQL executed | **No** |
| Env vars modified | **No** |

### Required Preview schema (minimum)

Documented in `preview-sql/pr65-isolated/05-DEPENDENCY-CHECKLIST.md`.

Includes: registration tables + `record_snapshot` + file/idempotency tables, staff session RPC, UTR/OCR columns, private Storage buckets `tejas-registration-files` and `tejas-payment-proofs`.

### Write-capable staff APIs (Preview-only when isolated)

- Login/logout → `tejas_staff_bump_session`  
- Payment PATCH → payments + audit  
- Reads: list/detail/file/export  

Drive: remains disabled.

---

## Phase 2 — Isolated Preview Supabase

| Item | Status |
|------|--------|
| New Preview project created by agent | **STOPPED** — requires owner login / org / possible billing |
| Owner instructions | `preview-sql/pr65-isolated/00-OWNER-CREATE-PREVIEW-PROJECT.md` |
| Production project used | **No** |
| Production credentials copied | **No** |
| Production backups used | **No** |

**Preview project reference:** _pending owner creation_  

---

## Phase 3 — Preview schema and Storage (prepared, not applied)

Ordered SQL kits (Preview project SQL Editor only):

1. `preview-sql/pr65-isolated/01-preview-registration-schema.sql`  
2. `preview-sql/pr65-isolated/02-preview-staff-sessions.sql`  
3. `preview-sql/pr65-isolated/03-preview-utr-and-payment-columns.sql`  
4. `preview-sql/pr65-isolated/04-preview-storage-buckets.sql`  

| Check | Status |
|-------|--------|
| Applied to Preview | **Pending owner** |
| Applied to Production | **No** |
| Schema incompatibilities found in kit prep | None known; additive `pan_holder` handled idempotently |

---

## Phase 4 — Synthetic test data (script ready)

`preview-sql/pr65-isolated/seed-preview-synthetic.mjs`

- Refuses URL containing Production ref `zapccpipwxduzlnvjdmy`  
- Seeds 5 fictional schools/registrations covering pending / reported / confirmed / rejected / refund_pending  
- Streams: English-only, Math-only, FT-only, multi-stream, multi-class  
- Fictional PANs / UTRs / names prefixed **TEST DATA**  
- Synthetic XLSX + 1×1 PNG proof uploads  

| Check | Status |
|-------|--------|
| Seed executed | **No** (no Preview project yet) |
| Production data copied | **No** |

---

## Phase 5 — Preview environment variables

| Variable | Preview presence | Notes |
|----------|------------------|-------|
| `TEJAS_ADMIN_TOKEN` | Still absent (last check) | Owner sets Preview-only |
| `SUPABASE_URL` | Still absent | Must be Preview project HTTPS URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Still absent | Preview project key only |

Agent did **not** set Vercel env (secrets must be entered by owner; never in chat/Git).

---

## Phase 6 — Isolation verification

**Not run** — no Preview project credentials available.

Planned gates (will run after owner handoff):

1. Preview URL host ≠ Production  
2. Service-role JWT `ref` = Preview ref  
3. Session bump rows only in Preview  
4. List/detail only TEST DATA  
5. Storage only Preview buckets  
6. Drive still disabled  
7. Fail closed if Production ref detected  

---

## Phase 7 — Authenticated Preview QA

All items **UNTESTED** (blocked by Phase 2):

Login/logout, cards, counts, filters, detail, PAN mask / `revealPan=yes` denial, fees, payment/UTR/OCR/proof, Excel/XLSX/CSV, layouts, session expiry, unauthorized access.

PAN unit regression from prior work remains available offline (`pan-access.test.ts`).

---

## Phase 8 — Deliverables on this PR

| Artifact | Purpose |
|----------|---------|
| `00-OWNER-CREATE-PREVIEW-PROJECT.md` | Exact owner steps |
| `01`–`04` SQL | Preview schema + buckets |
| `05-DEPENDENCY-CHECKLIST.md` | API/schema checklist |
| `seed-preview-synthetic.mjs` | Synthetic seed (env-based) |
| This report | Evidence + verdict |

---

## Owner actions to unblock (resume QA)

1. Follow `preview-sql/pr65-isolated/00-OWNER-CREATE-PREVIEW-PROJECT.md`.  
2. Reply with **Preview project ref only** + confirmation that Preview Vercel env is set and redeployed (no secrets).  
3. Agent resumes: isolation checks → seed → authenticated QA → update this report to PASS / CONDITIONAL PASS / FAIL.

---

## Safety confirmations

- No Production Supabase credentials placed in Preview  
- No Production DB/Storage writes  
- No Production schema/RLS/policy/migration  
- No real student/payment data  
- Drive not activated  
- Fees/payment logic unchanged  
- PR #65 **not merged**  
- No Production deployment  
- No secrets printed in this report  
