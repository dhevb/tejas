# Phase 40B — No-cost isolated Supabase options

Updated: `2026-11-22T22:56:00Z` / amended `2026-11-23T11:34:00+05:30`
**Historical options memo.** Application-stack certification is now **PASS** via Phase 40B Full on isolated `tuxfkmkljduesaofduvq` — see `PHASE40B-APPLICATION-STACK-RECOVERY-REPORT.md`. This file retains Free-tier decision context.

Constraints for this investigation (owner-stated):

- Do **not** upgrade any organization
- Do **not** delete / pause / transfer any existing project
- Do **not** modify production (`zapccpipwxduzlnvjdmy` / `dheWeb's Org` production workload)
- Do **not** expose secrets

---

## 1. What this agent could and could not inspect

| Check | Result |
| --- | --- |
| `supabase orgs list` / `projects list` | **Blocked** — CLI `AccessTokenRequiredError` (no `supabase login` / token in agent session) |
| Dashboard org list via automation browser | **Not signed in** (login wall) |
| Production project identity | Known: `zapccpipwxduzlnvjdmy` — **forbidden** as isolated target |
| Published Free-tier rules | Reviewed from Supabase billing docs (cited below) |

Therefore: **no live inventory of other orgs/projects was possible without owner login.** Owner must confirm the decision tree below in the dashboard.

---

## 2. Free-tier rule that blocks “just make another org”

From [About billing on Supabase](https://supabase.com/docs/guides/platform/billing-on-supabase):

> You are granted **two free projects**. The project limit applies **across all organizations** where you are an **Owner or Administrator**.
> You could have two Free orgs with one project each, **or** one Free org with two projects.
> **Paused** projects do not count (but pausing is **disallowed** in this DR authorization).

From [Billing FAQ](https://supabase.com/docs/guides/platform/billing-faq):

> Within an organization, free limits also consider **other Owners/Admins**. If another Owner/Admin has exhausted their free quota, that can block new free projects **in that organization**.
> Remedies cited by Supabase: create another Free org, **or** change that member’s role (Developer), **or** (elsewhere) pause/delete — pause/delete **forbidden here**.

### Implication for `dheWeb's Org`

| Situation | New Free project in same org? | New Free org + new project? |
| --- | --- | --- |
| **You** (Owner/Admin) already have **2 active** free projects anywhere | No | **No** — new org does **not** grant a 3rd free project |
| Blocker is **another** Owner/Admin at their 2-project limit, and **you** still have free capacity | Often no (org counts their quota) | **Yes, $0** — new Free org where only you are Owner/Admin |
| You have ≤1 active free project | Maybe (if org members allow) | Yes |

**Creating a new Free organization alone is not a free “third project” for someone already at the personal 2-project cap.**

---

## 3. Is a genuinely isolated, no-cost hosted environment possible?

**Yes, under at least one of these paths — without upgrading:**

### Option A — Prefer if you still have personal free capacity (safest *new* stack)

1. Confirm in dashboard Account/org billing that **you** (this login) have **fewer than 2 active** free projects.
2. Create a **new Free organization** (not `dheWeb's Org`) where the quota-exhausted member is **not** Owner/Admin.
3. Create **one** new Free project there.
4. Bootstrap CM: `preview-sql/bootstrap-tejas-app-stack-isolated.ps1`
5. Reply `resume Phase 40B application-stack recovery`

**Cost:** $0. **Isolation:** New project ref ≠ `zapccpipwxduzlnvjdmy`.

### Option B — Prefer if you are already at 2 active free projects (no pause/delete/upgrade)

**Reuse an existing Free project that is not production**, as the isolated recovery target.

Only if **all** owner checks pass:

| # | Owner verification (do not skip) |
| --- | --- |
| 1 | Project ref ≠ `zapccpipwxduzlnvjdmy` |
| 2 | You Own/Admin it; it is disposable/test (not live TEJAS registrations/payments) |
| 3 | Willing to allow **destructive restore/upload of DR test data** into it (Phase 40B Full writes Storage + may `pg_restore`) |
| 4 | HTTPS URL `https://<ref>.supabase.co` |
| 5 | Server key used **only** locally via CM bootstrap — never as Phase 38 backup-reader |

Then run the same bootstrap with that project’s URL + server key (+ optional DB password).

**Cost:** $0. **Risk:** Overwrites/fills that test project — **not** production if checks hold.

### Option C — Separate free Supabase account (owner-controlled)

Create/login a second Supabase account (personal) → new 2-project free quota → create Free org + project → bootstrap CM on this PC.

**Cost:** $0. **Caveat:** Separate identity; keep production keys off that account’s default workflows.

### Option D — Local stack (no hosted project)

Install Docker + run `supabase start` + put an **HTTPS** reverse proxy in front (app `durable.ts` rejects `http://`).

**Cost:** $0 software. **Blocked today:** Docker absent on this PC. Larger owner setup than A/B/C.

---

## 4. Options explicitly ruled out by current authorization

| Action | Why ruled out |
| --- | --- |
| Upgrade org to Pro | Owner forbade upgrades |
| Pause a free project to free a slot | Owner forbade pause |
| Delete a free project to free a slot | Owner forbade delete |
| Transfer projects | Owner forbade transfer |
| Use production `zapccpipwxduzlnvjdmy` | Forbidden isolation rule |
| Weaken HTTPS / `durable.ts` | Forbidden |

---

## 5. Recommended decision (safest available)

1. **First:** Owner opens Supabase dashboard → list **all** orgs and **active** free projects for **this login** (Owner/Admin).
2. **If active free count &lt; 2:** use **Option A** (new Free org + new project).
3. **If active free count = 2:**
   - If a **non-production** Free project exists and passes the Option B checklist → **Option B** (reuse as isolated target).
   - Else → **Option C** (separate free account) or authorize Docker (**Option D**).
4. Do **not** create another Free org expecting a third project while already at 2 active — it will fail or waste time.
5. After bootstrap: **resume Phase 40B application-stack recovery** (agent runs Full; certifies only if verified).

---

## 6. Exact owner-only steps (copy)

### Path A or B or C (hosted)

```powershell
Set-Location C:\Users\Admin\Desktop\tejas\tejas-phase3
powershell -NoProfile -File .\preview-sql\bootstrap-tejas-app-stack-isolated.ps1
```

Non-secret reply:

```text
isolated stack ready
path|A-or-B-or-C
project-ref|<ref-not-zapccpipwxduzlnvjdmy>
https|yes
server-key|present-locally
production-untouched|yes
```

### Optional role fix (only if blocker is another Owner/Admin in dheWeb's Org)

In `dheWeb's Org` team settings, set the quota-exhausted member to **Developer** (not Owner/Admin), **if** that is organizationally acceptable — then retry creating a Free project **only if you still have personal free capacity**. This does not upgrade billing. It does not modify production data. Still does not create a 3rd project for someone already at 2.

---

## 7. Local work continued (no PASS claim)

- App-stack SelfTest re-run: **PASS**
- Full recovery still blocked until isolated CM session exists
- Production not contacted for org listing (no token)

**Superseded:** Phase 40B Full isolated recovery was verified `2026-11-23T05:06:27Z` (PASS).
