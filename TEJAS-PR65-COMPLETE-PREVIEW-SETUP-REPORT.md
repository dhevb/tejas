# TEJAS PR #65 — Complete Preview Setup Report

**Date:** 2026-11-24  
**PR:** https://github.com/dhevb/tejas/pull/65 (**OPEN**)  
**Branch HEAD:** `f858705`  
**Preview project:** `tejas-preview-pr65` / ref `nbeslngnrsagarosuaab`  
**Preview URL:** `https://nbeslngnrsagarosuaab.supabase.co`  
**Production ref (forbidden):** `zapccpipwxduzlnvjdmy`  

**This pass:** Preview-only inspection. No Production changes. No secrets printed. No seed. No merge/Production deploy.

---

## Status summary

| Item | Status |
|------|--------|
| Storage | **BLOCKED** (no Preview service-role available for live bucket API check) |
| Preview variables | **OWNER ACTION REQUIRED** |
| Preview redeployment | **NOT RUN** |
| Synthetic seed | **NOT RUN** |
| Production | **UNCHANGED** |
| PR #65 | **OPEN** |

---

## SQL execution (owner-reported)

| Script | Owner result |
|--------|----------------|
| `01-preview-registration-schema.sql` | Success. No rows returned |
| `02-preview-staff-sessions.sql` | Success. No rows returned |
| `03-preview-utr-and-payment-columns.sql` | Success. No rows returned |
| `04-preview-storage-buckets.sql` | Success. No rows returned |

Treated as **owner-reported**, not independently re-verified via DB catalog queries (no Preview privileged credential available to the agent).

Isolation check: Preview ref `nbeslngnrsagarosuaab` ≠ Production `zapccpipwxduzlnvjdmy`. Public host responds (auth health HTTP 401 — project reachable).

---

## Phase 1 — Storage verification

**Result: BLOCKED (credential limitation)**

Expected buckets (from kit + app code):

- `tejas-registration-files` — private  
- `tejas-payment-proofs` — private  

Owner SQL 04 is designed to create/upsert both with `public = false`.  
Agent could **not** call Preview Storage Admin API without `SUPABASE_SERVICE_ROLE_KEY` for project `nbeslngnrsagarosuaab`. No bucket listing or object download was performed. **Success was not invented.**

Owner can confirm in Dashboard: Storage → both buckets present → **Public** disabled.

---

## Phase 2 — Vercel Preview environment

### Inspection (names / scopes only — no values)

`vercel env ls` / Preview `env pull` key scan:

| Name | Production | Preview |
|------|------------|---------|
| `TEJAS_ADMIN_TOKEN` | Present | **Absent** |
| `SUPABASE_URL` | Present | **Absent** |
| `SUPABASE_SERVICE_ROLE_KEY` | Present | **Absent** |
| `SUPABASE_SECRET_KEY` | Present | **Absent** |

No Preview overwrite was attempted. Production env was not modified.

### Blocker

Preview **service_role** key is not available through a secure agent integration (not in Preview env; must not be requested in chat).

**STOP — owner action (Vercel Dashboard only):**

1. Supabase → project `tejas-preview-pr65` → **Project Settings → API** → copy **service_role** (into Vercel UI only).  
2. Vercel → **tejas** → **Settings → Environment Variables** → add for **Preview** only:

   | Name | Value source |
   |------|----------------|
   | `TEJAS_ADMIN_TOKEN` | New random ≥16 chars, **≠** Production token |
   | `SUPABASE_URL` | `https://nbeslngnrsagarosuaab.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Preview project service_role only |

3. Do **not** change Production variables.  
4. Do **not** paste any secret into Cursor chat.  
5. Reply when the three Preview names are set (no values).

After that, agent can redeploy Preview and continue.

---

## Phase 3 — Production hostname protection (proposal only)

**Gap:** `lib/registration/durable.ts` `supabaseOrigin()` accepts any `https://` Supabase host. Preview misconfiguration with Production URL is not fail-closed in app code. Seed script alone blocks Production ref.

### Proposed change (NOT implemented — needs owner approval)

In `supabaseOrigin()` (or a wrapper used only when `process.env.VERCEL_ENV === "preview"`):

- If hostname contains `zapccpipwxduzlnvjdmy`, return `null` (treat as not configured) and optionally `console.error` a non-secret message such as `preview refused production supabase host`.  
- Production (`VERCEL_ENV === "production"`) behaviour unchanged.  
- Local/dev unchanged unless explicitly Preview.

**Files:** `lib/registration/durable.ts` (+ focused unit test).  
**Do not implement** until owner approves.

---

## Phase 4 — Preview redeployment

**NOT RUN** — required Preview secrets incomplete.

Latest Preview deploys exist on the project but were **not** triggered by this pass and are **not** claimed to include Preview Supabase env.

---

## Phase 5 — Synthetic seed

**NOT RUN** (gated).

Seed script `preview-sql/pr65-isolated/seed-preview-synthetic.mjs` is **safe to run later** when:

- Preview env verified  
- Preview redeployed  
- Project ref confirmed  
- Storage privacy owner-confirmed  

Script already: refuses Production ref, uses TEST DATA, skips existing refs, no public links, no credential printing.

**Ask owner for a separate confirmation before inserting synthetic records.**

---

## Production isolation

| Check | Result |
|-------|--------|
| Production SQL | Not run |
| Production env | Unchanged |
| Production credentials used | No |
| Preview ref ≠ Production | Yes (`nbeslngnrsagarosuaab`) |
| Merge / Production deploy | No |

---

## Remaining owner-only actions

1. Add three Preview-only Vercel variables via Dashboard (values never in chat).  
2. Confirm Storage buckets private in Preview Dashboard (optional but recommended).  
3. Tell agent Preview env is ready → agent redeploys Preview.  
4. Separately approve synthetic seed.  
5. Optionally approve hostname-guard code change (Phase 3).  

---

## Confirmations

- Production: **UNCHANGED**  
- PR #65: **OPEN** / unmerged  
- Secrets: **not exposed** in this report  
