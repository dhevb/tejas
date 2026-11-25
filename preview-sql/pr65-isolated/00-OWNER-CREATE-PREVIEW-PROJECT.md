# Owner action required — Create isolated Preview Supabase project

**Status:** Agent stopped at Phase 2 (Option B). Creating a new Supabase project needs your login, organization selection, and possibly billing confirmation.

**Full checklist:** `TEJAS-PR65-PREVIEW-OWNER-SETUP-CHECKLIST.md` (dashboard steps, SQL success checks, Vercel Preview env, resume handoff).

**Do not** use Production project `zapccpipwxduzlnvjdmy`.  
**Do not** restore Production backups into Preview.  
**Do not** paste Production service-role keys into Vercel Preview.  
**Do not** create this project via CLI — Dashboard only.

---

## Exact steps (owner)

### A. Create the project

1. Open https://supabase.com/dashboard while signed into the **dheWeb** (or TEJAS) organization.
2. Click **New project**.
3. Settings:
   - **Name:** `tejas-preview-pr65` (or similar; must be unmistakably non-Production)
   - **Database password:** generate a new Preview-only password (store in your password manager; never commit; never share in chat)
   - **Region:** prefer the same region as Production for latency, or any region you accept for throwaway Preview
   - **Plan:** Free tier is enough for synthetic QA unless your org policy requires otherwise
4. Wait until the project is **Active**.
5. Copy the **Project reference** (URL looks like `https://<PROJECT_REF>.supabase.co`). Confirm `<PROJECT_REF>` is **not** `zapccpipwxduzlnvjdmy`.

### B. Apply Preview schema (SQL Editor)

In the **new** project → **SQL Editor**, run these files **in order** from this repo (Preview project only):

1. `01-preview-registration-schema.sql`
2. `02-preview-staff-sessions.sql`
3. `03-preview-utr-and-payment-columns.sql`
4. `04-preview-storage-buckets.sql`

Do **not** run them against Production.

### C. Create Preview-only secrets (local / password manager — not chat)

1. Dashboard → **Project Settings → API**
   - Copy **Project URL** → this is Preview `SUPABASE_URL`
   - Copy **service_role** key → Preview `SUPABASE_SERVICE_ROLE_KEY`  
     (never the Production key; never commit; never paste into GitHub issues/chat)
2. Generate a new random string ≥ 16 characters for Preview `TEJAS_ADMIN_TOKEN`  
   (must differ from Production).

### D. Attach secrets to Vercel **Preview** only

1. https://vercel.com → project **tejas** → **Settings → Environment Variables**
2. Add **only** for environment **Preview** (not Production, not Development unless you intend local use):

   | Name | Value |
   |------|--------|
   | `TEJAS_ADMIN_TOKEN` | Preview-only token from C.2 |
   | `SUPABASE_URL` | `https://<PREVIEW_REF>.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Preview service_role from C.1 |

3. Confirm Production variables remain Production-only and unchanged.
4. Redeploy the PR Preview deployment for branch `feat/registration-review-dashboard-redesign` (Deployments → … → Redeploy, or empty commit).

### E. Isolation sanity (owner)

1. Preview `SUPABASE_URL` host ≠ `zapccpipwxduzlnvjdmy.supabase.co`
2. JWT payload for Preview service_role (decode header/payload only, do not share) shows Preview `ref`, not Production
3. `vercel env ls` shows the three names on **Preview**

### F. Notify agent to resume

Reply in the PR #65 thread / Cursor chat with **only**:

- Preview project ref (e.g. `abcdefghijklmnop`)
- Confirmation that Vercel Preview env is set and redeployed
- Confirmation that schema SQL 01–04 ran successfully

**Do not** send secret values, passwords, or service-role keys in chat.

Agent will then: seed synthetic TEST DATA, verify isolation, run authenticated QA, and update `TEJAS-PR65-ISOLATED-PREVIEW-SUPABASE-AND-QA-REPORT.md`.

---

## Why the agent stopped

Per PR instructions: if project creation needs owner login, billing, org selection, or external approval → **stop and request owner approval**. Browser automation to create a billable Supabase project was blocked for that reason.
