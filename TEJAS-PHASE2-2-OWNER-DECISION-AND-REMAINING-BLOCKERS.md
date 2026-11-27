# TEJAS Phase 2.2 — Owner Decision & Remaining Blockers

**Final status: PREVIEW ONLY — WAITING FOR OWNER APPROVAL**

No merge of PR #71 / #72 / #73. No Production deploy. No SQL applied. No book publication. No access-control weakening.

---

## 1. Exact PR and commit metadata (verified)

| Item | Verified value | Evidence |
|------|----------------|----------|
| PR #71 | OPEN — https://github.com/dhevb/tejas/pull/71 | `gh pr view 71` |
| PR #71 head | `966bc8e688408928a7ab4e96747c324a4a9a4203` on `feat/ebook-portal-multi-stream-ft-syllabus-pdf-revamp` | gh |
| PR #72 | OPEN — https://github.com/dhevb/tejas/pull/72 | gh |
| PR #72 head | `e856edce48e9f2416fc83cc016ce14fecc9b2d70` on `fix/pr71-phase2-payment-entitlement-pdf` | gh |
| PR #73 | OPEN — https://github.com/dhevb/tejas/pull/73 | gh |
| PR #73 base | `fix/pr71-phase2-payment-entitlement-pdf` @ `e856edc…` | gh |
| PR #73 head (before this Phase 2.2 commit) | `d173d261f65f5c485e347a69679221acdb14d8bf` | gh + local |
| PR #73 head (Phase 2.2) | `5909aac5aa43be0288d97ba3b9667317b4d44ca8` — trust GitHub PR #73 if tip advances | `gh pr view 73` / git |
| Working branch | `fix/pr72-phase2-1-utr-recovery-preview-qa` | local |
| Vercel project | `dhe-projects/tejas` | `vercel ls` / inspect |

---

## 2. Preview deployment verification

| Field | Value | Evidence class |
|-------|--------|----------------|
| Latest Preview for SHA `d173d26` | https://tejas-7edcw033y-dhe-projects.vercel.app | **Verified** — GitHub deployment status `target_url` + `vercel inspect` |
| Deployment ID | `dpl_6UZievvEvDRZnLgdkPjDT6SKspRJ` | **Verified** — `vercel inspect` + GitHub Vercel status context |
| `target` | **`preview`** (not null) | **Verified** — `npx vercel inspect` reports `target preview` |
| `readyState` / status | READY / ● Ready | **Verified** |
| Environment label | Preview | **Verified** — GitHub Deployments API `environment: Preview`; `vercel ls` column Environment = Preview |
| Earlier CLI deploy (86103b6-era) | https://tejas-8weocht3q-dhe-projects.vercel.app / `dpl_Bx9PqKVPY1ZiCGRt48duAmNn5xcL` | Historical; **superseded** for PR tip by GitHub Preview deploy of `d173d26` |
| Phase 2 Preview (PR #72) | https://tejas-jt4k6b4qv-dhe-projects.vercel.app / `dpl_VCF3L3uyatwFidKwL6rTKLjGq9V9` | Historical Phase 2 only |

**Non-Production evidence used:** Vercel `target: preview`, GitHub deployment environment `Preview`, and `vercel ls` Environment column `Preview` (distinct from rows labelled `Production`).

---

## 3. Report SHA correction

`TEJAS-PR72-PHASE2-1-OWNER-QA-REPORT.md` previously listed:

- Final SHA `ad4a420…` while PR tip was already `d173d26…`
- Preview URL / deployment ID from the earlier CLI deploy (`8weocht3q` / `dpl_Bx9Pq…`)
- Claimed `target: null` in places; Vercel now confirms **`target: preview`** for these Preview deployments

Phase 2.2 corrects that report to match PR #73 tip + the GitHub-linked Preview deployment above, and separates **Verified** vs **Cursor-reported tests** vs **BLOCKED**.

---

## 4. Remote Preview Supabase integration status

| Check | Result | Evidence class |
|-------|--------|----------------|
| Allowlist host `nbeslngnrsagarosuaab.supabase.co` | Enforced | Code + probe |
| Production host `zapccpipwxduzlnvjdmy` hard-deny | Enforced | Code |
| Local ignored `.env.preview` present | Yes (gitignored) | Local FS (no secret printed) |
| `vercel env pull` placeholders | Still placeholder-only in `.local-qa/.env.preview.pulled` | Local FS |
| CRLF env parse bug | **Fixed** in integration loader (Windows `\r` broke `NAME=value` match) | Code fix |
| Read-only probe `GET /rest/v1/` | HTTP 200 | Cursor-run probe |
| Read-only `GET tejas_learn_students?select=id&limit=1` | **HTTP 404** | Cursor-run probe |
| Mutations | **None executed** | Probe + test abort before writes |
| `npm run test:preview-integration` | **BLOCKED** (fail, not PASS) | Cursor-reported |

**BLOCKED reason (current):** Preview host reachable with local Preview-shaped key, but `tejas_learn_students` is not readable (HTTP 404). Portal learn schema may be missing or not exposed on this Preview project. **Do not apply SQL in this phase.**

### Safe Owner credential setup (no paste into chat)

1. Open Supabase dashboard → project ref **`nbeslngnrsagarosuaab` only** (never `zapccpipwxduzlnvjdmy`).  
2. Copy Project URL + **service_role** into local ignored file **`.env.preview`** (already gitignored via `.env*`):

```env
PREVIEW_SUPABASE_URL=https://nbeslngnrsagarosuaab.supabase.co
PREVIEW_SUPABASE_SERVICE_ROLE_KEY=<service_role from Preview project only>
```

3. Confirm host allowlist mentally; never use Production keys as fallback.  
4. Re-run: `npm run test:preview-integration`  
5. If tables 404, Owner must authorize a **separate** Preview schema apply — out of scope here.  
Guidance reference: `TEJAS-PR65-PREVIEW-CREDENTIAL-SETUP-GUIDANCE.md`.

---

## 5. Secondary-stream RPC / schema decision options

Full write-up: `docs/TEJAS-PHASE2-2-SECONDARY-STREAM-RPC-AND-PAYMENT-SCHEMA-DECISION.md`  
(also `docs/TEJAS-PR71-PHASE2-PAYMENT-GROUP-SCHEMA-PROPOSAL.md`)

| Option | Summary | Owner choice |
|--------|---------|--------------|
| **A. Interim** | Keep one ₹49 + one genuine UTR per unpaid stream; Preview-first RPC relax so secondary-stream report works without `students.stream_id = books.stream_id` | ☐ Approve Preview SQL later / ☐ Defer |
| **B. Grouped payment** | New payment_transactions + lines; one UTR for N×₹49; atomic verify | ☐ Approve design / ☐ Defer |

**No SQL applied in Phase 2.2.**

---

## 6. Five blank English pages — Owner decision packet

Sources preserved. SHA matches catalog. Deep pdf.js analysis + prior browser renders.

| Book / page | Source SHA | Source-level finding | Browser-render finding | Likely cause | Recommended action | Owner decision |
|-------------|------------|----------------------|------------------------|--------------|--------------------|----------------|
| eng-class-07 p6 | `f24075e7…a88` matches catalog | 0 ops, 0 text, 0 annotations, rotate 0 | Blank white canvas | Empty page object in source | Confirm intentional blank **or** provide replacement PDF | ☐ Blank OK ☐ Replace |
| eng-class-07 p74 | same file | genuinely_blank_no_ops_no_text | Blank white | Empty page object | Same | ☐ Blank OK ☐ Replace |
| eng-class-07 p76 | same file | genuinely_blank_no_ops_no_text | Blank white | Empty page object | Same | ☐ Blank OK ☐ Replace |
| eng-class-10 p6 | `4293fd8e…373` matches catalog | genuinely_blank_no_ops_no_text | Blank white | Empty page object | Same | ☐ Blank OK ☐ Replace |
| eng-class-10 p80 | same file | genuinely_blank_no_ops_no_text | Blank white | Empty page object | Same | ☐ Blank OK ☐ Replace |

Evidence: `.local-qa/blank-page-owner-packet.json`, `.local-qa/pdf-visual-qa/evidence.json` (gitignored).  
Spot-checks (Eng p7, Math p5, FT1 p8, FT2 p10) rendered with content — **PASS** (Cursor visual QA).  
**Do not fabricate replacements.** Original files untouched.

---

## 7. Authenticated Preview PDF QA access status

| Item | Status |
|------|--------|
| Preview `/learn` publication | All catalog books **awaiting organisational approval** on last Preview check |
| Authenticated portal reader QA (all 18 books) | **BLOCKED** — approval gate |
| Private Storage / signed delivery / no-download / no-print / one-device | Unchanged in code; not weakened |

### Proposed safe Preview-only path (NOT implemented — needs Owner auth)

**Proposal only:** On Preview only, Owner authorizes temporary `setPublication(…, published)` for the 18 books (and needed tests) **or** binds a dedicated content-QA student via Preview env `TEJAS_CONTENT_QA_STUDENT_ID` / email **and** publishes books for that Preview environment — using existing staff publication APIs, without making Storage public, without permanent public PDF URLs, without Production changes.

**Not acceptable without Owner authorization:** bypassing `awaiting_approval`, publishing to Production, public buckets, or disabling entitlement/session checks.

Until Owner authorizes one of the above, authenticated Preview PDF QA remains **BLOCKED**.

---

## 8. Test evidence (Phase 2.2)

| Suite | Result | Class |
|-------|--------|-------|
| `npm test` (unit, includes UTR recovery / multi-stream / portal) | **170 pass / 0 fail** | Cursor-reported |
| `lib/portal/utr-payment-recovery.test.ts` + multi-stream | **PASS** | Cursor-reported |
| `npm run test:preview-integration` | **BLOCKED** (HTTP 404 learn tables; no mutations) | Cursor-reported |
| `tsc --noEmit` | **PASS** | Cursor-reported |
| Lint | **PASS** (existing `<img>` warnings only) | Cursor-reported |
| `npm run build` | **PASS** | Cursor-reported |
| PDF blank-page source analysis | **PASS** (analysis complete; pages blank) | Cursor-reported |
| Authenticated Preview PDF reader (18 books) | **BLOCKED** | Verified blocker |
| Remote multi-stream payment on Preview | **BLOCKED** | Schema/RPC + tables |

Never converted BLOCKED → PASS.

---

## 9. Remaining blockers

1. Preview learn schema readable (`tejas_learn_students` 404) — Owner schema apply authorization required separately.  
2. Secondary-stream `tejas_learn_report_payment` predicate — choose Option A / B / defer.  
3. Five blank English pages — Owner blank-vs-replace decisions.  
4. Authenticated Preview PDF QA — Owner temporary Preview publication / content-QA authorization.  
5. Full remote integration suite — blocked until (1) and credentials/schema are Owner-cleared.

---

## 10. Exact Owner actions required next

1. **Do not merge** #71 / #72 / #73 until satisfied.  
2. Confirm Phase 2.2 Preview URL https://tejas-7edcw033y-dhe-projects.vercel.app for tip after this push (or newest GitHub Preview for PR #73 head).  
3. Decide **Option A vs B** (or defer) for secondary-stream / grouped payments — no SQL until separate approval.  
4. For each of the five blank pages: **confirm intentional blank** or **supply approved replacement source** (file + page).  
5. If remote integration is required: ensure Preview project `nbeslngnrsagarosuaab` has portal learn tables; place service_role only in local `.env.preview`; never paste into chat.  
6. If authenticated PDF QA is required: explicitly authorize temporary Preview-only publication (or content-QA path) without Production changes.  
7. Reply with approvals; agent will not implement schema, replacements, publication, merge, or Production deploy without that reply.

---

**PREVIEW ONLY — WAITING FOR OWNER APPROVAL**
