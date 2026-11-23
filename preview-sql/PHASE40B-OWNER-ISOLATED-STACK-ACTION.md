# Phase 40B — Minimal owner action (isolated application stack)

**Status:** Required for application-stack certification.
**See also:** `PHASE40B-NO-COST-ISOLATED-OPTIONS.md` (Free-tier capacity decision tree).
**Do not** paste secrets into chat. **Do not** use production `zapccpipwxduzlnvjdmy`.

---

## Important Free-tier fact

Supabase allows **2 active free projects per Owner/Admin person across all orgs**.
A new Free organization does **not** give a third free project if you are already at that cap.
Paused projects free a slot — **pausing is not authorized** in the current DR instructions.

If `dheWeb's Org` blocks “New project” because **another** Owner/Admin is at their limit, a **new Free org where only you are Owner** can still work **only if you personally have &lt; 2 active free projects**.

---

## Choose one no-cost path

| Path | When | Action |
| --- | --- | --- |
| **A** | You have &lt; 2 active free projects | New Free org (not dheWeb) → new Free project |
| **B** | Already at 2; a non-prod Free project exists | Reuse that project after isolation checklist in `PHASE40B-NO-COST-ISOLATED-OPTIONS.md` |
| **C** | At 2 and no disposable project | Separate free Supabase account → new Free project |
| **D** | Prefer local | Install Docker + HTTPS front for `supabase start` (heavier) |

Forbidden: upgrade, pause, delete, transfer, or use production.

---

## Bootstrap (all hosted paths)

```powershell
Set-Location C:\Users\Admin\Desktop\tejas\tejas-phase3
powershell -NoProfile -File .\preview-sql\bootstrap-tejas-app-stack-isolated.ps1
```

1. Isolated HTTPS URL (`https://<ref>.supabase.co`, not production).
2. Server key dialog:
   - In the dashboard, copy the **full** isolated **secret** / **service_role** key.
   - Click **Paste from Clipboard** (do not rely on Ctrl+V into the masked field).
   - Confirm the on-screen **Length** looks complete (full secrets are typically well above 50).
   - Must be the server key, **not** publishable/anon. Truncation detection remains strict.
3. Optional: isolated DB password (Cancel / empty to skip).

Expect `session|stored`, `stored-server-key-length|<n>` with n ≥ 50, and **no** `sb-secret-too-short-likely-truncated`.

### Reply (non-secret)

```text
isolated stack ready
path|A
project-ref|<ref>
https|yes
server-key|present-locally
production-untouched|yes
```

Or: **resume Phase 40B application-stack recovery**

Agent then runs `windows_app_stack_recovery.ps1` Full and certifies **only** if verification passes.
