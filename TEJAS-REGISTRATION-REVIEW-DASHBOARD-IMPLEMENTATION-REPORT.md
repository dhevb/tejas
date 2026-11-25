# TEJAS — Registration Review Dashboard Implementation Report

**Date:** 2026-11-24  
**Branch:** `feat/registration-review-dashboard-redesign`  
**PR:** https://github.com/dhevb/tejas/pull/65  
**Exact HEAD:** see tip after isolated-Preview kit push  
**PAN security fix:** `118dd9b`  
**Production:** not deployed · **PR left OPEN / UNMERGED**  
**Preview env safety:** `TEJAS-PR65-PREVIEW-ENVIRONMENT-SAFETY-AUDIT.md` → **NOT SAFE** with Production service-role on Preview  
**Isolated Preview kit / QA status:** `TEJAS-PR65-ISOLATED-PREVIEW-SUPABASE-AND-QA-REPORT.md` → **CONDITIONAL PASS** (stopped: owner must create Preview Supabase project)

---

## Verdict

### CONDITIONAL PASS

PAN hardening remains verified in unit tests. **Authenticated Preview QA remains blocked.** Preview still lacks `TEJAS_ADMIN_TOKEN` and `SUPABASE_URL`. Copying Production privileged Supabase credentials into Preview is **not safe** (login writes staff sessions; payment PATCH writes Production). Prefer a separate Preview Supabase project or login-only smoke with Preview-only admin token. No Production secret was copied. No env/schema/RLS/Storage/payment changes by the agent. No merge/deploy.

---

## Step 1 — Preview token verification (failed)

| Check | Result |
|-------|--------|
| Owner statement | Preview-only `TEJAS_ADMIN_TOKEN` configured |
| `vercel env ls` | `TEJAS_ADMIN_TOKEN` listed for **Production only** — not Preview |
| `vercel env pull --environment=preview` (key names only) | **`HAS_TEJAS_ADMIN_TOKEN=False`**. Pulled keys were Vercel system vars only (no app secrets) |
| Production secret copied into Preview by agent | **No** |
| Production env modified by agent | **No** |

### Live probes (invalid probe token — no secrets used)

| Deployment | Status | Error |
|------------|--------|-------|
| https://tejas-m7wjwyoxx-dhe-projects.vercel.app (`dpl_EpJ9K94e2oHse4LNfiEAMmRPchDc`, READY) | **503** | Staff review is not configured. No password has been set. |
| https://tejas-hxtf4ho8p-dhe-projects.vercel.app | **503** | same |
| Branch alias `…feat-registration-review-dashboar-8653c8…` | **503** | same |

Expected if Preview token were live: **401** for a wrong token (configured but mismatch), not 503 (`adminConfigured()` false).

**Action stopped:** authenticated QA not started.

### Owner follow-up (configuration)

1. In Vercel → Project **tejas** → Settings → Environment Variables, add **`TEJAS_ADMIN_TOKEN`** with environment **Preview** checked (separate value from Production).  
2. Confirm `vercel env ls` shows the variable for **Preview**.  
3. Redeploy the PR Preview (or push an empty commit) so the READY deployment receives Preview env.  
4. Optional but likely required for list/detail/downloads: ensure Preview also has the Supabase runtime vars it needs (today Preview pull shows **no** `SUPABASE_*` keys). Enabling existing Production-linked vars for Preview is an **owner** action — agent will not copy Production secrets.

---

## Step 2 — Authenticated dashboard verification

**Not executed** (blocked by Step 1).

| # | Item | Status |
|---|------|--------|
| 1 | Staff login / logout | **UNTESTED** (login 503) |
| 2 | Summary cards / stream-wise counts | **UNTESTED** |
| 3 | Search / filters / sort / pagination | **UNTESTED** |
| 4 | School / PAN mask / students | **UNTESTED** live; PAN unit covered |
| 5 | Stream-wise fee calculations | **UNTESTED** live; unit covered |
| 6 | Payment / UTR / OCR / proof | **UNTESTED** |
| 7 | Original Excel download | **UNTESTED** |
| 8 | Consolidated 7-sheet XLSX | **UNTESTED** live; unit covered |
| 9 | Desktop / mobile layouts | **UNTESTED** live; code review only |
| 10 | Session expiry / unauthorized | Unauthorized API **401** previously verified; session expiry **UNTESTED** |

No registrations, payments, or DB records created.

---

## Step 3 — PAN security (code / unit — not live Preview)

```
npx tsx --test lib/registration/pan-access.test.ts lib/registration/staff-metrics.test.ts
→ 9 pass / 0 fail (last green run this session / prior)
```

| Requirement | Status |
|-------------|--------|
| Default PAN masked | PASS (unit) |
| `revealPan=yes` cannot expose full PAN | PASS (unit) |
| UI has no full-PAN reveal/export | PASS (code) |
| Denial logs omit PAN value | PASS (unit) |
| Live Preview detail/XLSX/CSV after staff login | **UNTESTED** (auth blocked) |

---

## Step 4 — Safety confirmations

| Constraint | Status |
|------------|--------|
| Never reveal full PAN | Held |
| No create registration/payment/records | Held |
| No shared Production Supabase mutations | Held |
| Google Drive disabled | Held |
| No Production env / schema / RLS / Storage / payment logic changes | Held |
| No Production deploy | Held |
| PR #65 merge | **Not done — remains OPEN** |

---

## Remaining blockers

1. **Preview-only `TEJAS_ADMIN_TOKEN` not actually available to Preview** (env ls + env pull + 503 probes).  
2. Preview currently lacks pulled app secrets (including Supabase) — may block post-login data even after admin token is fixed.  
3. After owner fixes Preview env + redeploys, re-run this authenticated checklist.

Until then, authenticated Preview QA remains incomplete; product verdict stays **CONDITIONAL PASS**.
