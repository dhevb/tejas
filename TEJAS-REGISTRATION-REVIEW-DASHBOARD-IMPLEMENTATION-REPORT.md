# TEJAS — Registration Review Dashboard Implementation Report

**Date:** 2026-11-24  
**Branch:** `feat/registration-review-dashboard-redesign`  
**PR:** https://github.com/dhevb/tejas/pull/65 (`274b4dc`)  
**Head:** `274b4dca856e4ea8bfc67190aca3cbdb88ce87a4`  
**Production:** not deployed · not merged  

---

## Verdict

### CONDITIONAL PASS

Dashboard redesign, server metrics, consolidated workbook, student-count math, default PAN masking, and Drive-disabled UI are implemented and verified offline / via unauthenticated Preview probes. **Authenticated Preview staff click-through could not complete** because `TEJAS_ADMIN_TOKEN` is present on **Production only** (Preview returns HTTP 503: “Staff review is not configured”). Google Drive remains design-only. PAN full reveal (`revealPan=yes`) is available to **any** authenticated staff session with no role gate — owner must accept that or treat it as a merge blocker.

---

## Preview deployment

| Field | Value |
|-------|--------|
| Status | READY |
| Deployment ID | `dpl_FzvuYaiN9WChohU1kPaYJcNnD3we` |
| URL | https://tejas-2v7e7r5ez-dhe-projects.vercel.app |
| Alias | https://tejas-git-feat-registration-review-dashboar-8653c8-dhe-projects.vercel.app |
| Commit | `274b4dc` |
| Target | preview |

Browser navigation to the Preview URL hits **Vercel Deployment Protection SSO** (login.vercel.com). API/HTML checks used `vercel curl` (automatic protection bypass). No Production credentials were used against Production hosts for this walkthrough. No Production registrations or payments were created.

---

## Preview staff click-through results

| Check | Result |
|-------|--------|
| `GET /schools/register/review` (unauth) | **PASS** — HTTP 200; staff recovery form present; title Registration review |
| `GET /api/register/admin/registrations` (unauth) | **PASS** — HTTP 401 |
| Staff recovery-token login on Preview | **BLOCKED** — HTTP 503 `Staff review is not configured. No password has been set.` (`adminConfigured()` requires `TEJAS_ADMIN_TOKEN` ≥ 16 chars; Vercel env shows that secret on **Production only**) |
| Summary cards / search / sort / pagination / filters | **Not exercised live** (auth blocked). Present in `review-dashboard.tsx` (overview cards including unique students + E/M/FT, client filters, sort keys, page size, `md:hidden` mobile cards) |
| Registration detail sections (school / principal / coordinator / PAN / students / class & stream counts / payment / UTR / OCR / proof) | **Not exercised live** (auth blocked). Sections 1–16 implemented in dashboard detail |
| Download original upload | **Not exercised live** (auth blocked). Route `kind=upload` still gated by `staffAuthorised` |
| Download consolidated XLSX | **Offline PASS** (see below). Live download blocked by Preview auth |
| Mobile + desktop layout | **Code review PASS** — table `hidden md:…`, card list `md:hidden` |
| Refresh / logout | **Not exercised live** (auth blocked). UI + `DELETE /api/register/admin/session` present |
| Drive UI | **PASS (disabled)** — rows default to “Drive not configured”; no Drive env / migration applied |

**Safety:** Synthetic Preview registrations were **not** created (Preview shares Production durable Supabase).

---

## Student-count reconciliation

Definitions verified in `lib/registration/staff-metrics.ts` + tests + offline synthetic battery:

| Metric | Meaning |
|--------|---------|
| Unique students **within one registration** | Distinct `fullName\|DOB\|parentName\|parentMobile` keys inside that registration’s student rows |
| Unique students **across registrations** | Overview sums per-registration uniques; identities are **not** silently merged across different parent mobile / DOB / name tuples |
| Total **student-stream registrations** | Sum of stream selections (one student with E+M+FT = 3) |

Offline synthetic results (`.local-qa/pr65-offline-xlsx-verify.mjs`):

| Scenario | Result |
|----------|--------|
| English / Math / FT only + one student with all three + same identity twice in one reg | unique **5**, streams **8** (E3/M3/FT2) |
| Same name+DOB, different parent mobile | **2** unique (no silent merge) — unit test |
| Class-wise | unique students per class (V:4, VI:1 in offline set) |
| Fee reconcile vs saved fee record | `reconcileFeeWithSaved` **ok** for matching saved streams / ₹150–₹30–₹120 breakdown |

Unit tests: `npx tsx --test lib/registration/staff-metrics.test.ts` → **4 pass / 0 fail**.

---

## XLSX download and sheet verification

Offline consolidated workbook (`consolidatedRegistrationWorkbook`):

| Sheet | Present |
|-------|---------|
| School Details | yes |
| Student Details | yes |
| Stream-wise Summary | yes |
| Class-wise Summary | yes |
| Fee Summary | yes |
| Payment Details | yes |
| File Backup Status | yes |

- Default export PAN sample: `ABCDE****F` (full PAN absent).  
- `revealPan=yes`: full PAN `ABCDE1234F` present.  
- Live Preview download of a real registration workbook was **not** possible without staff session.

---

## PAN authorization finding

| Item | Finding |
|------|---------|
| Default consolidated / schools export | Masks PAN |
| `?kind=consolidated&revealPan=yes` | After `staffAuthorised()` only — **no role check** |
| UI “Reveal full PAN” / “Schools CSV with full PAN” | Same: any staff cookie |
| Should every staff account export full PAN? | **Unresolved owner policy.** If only a subset of staff should see full PAN, **role-based restriction is unavailable today → document as merge blocker until decided.** |
| Logs / public links | No change that prints PAN to logs; reveal links are staff-auth routes, not public |

Staff authentication was **not** weakened. No Auth/RLS/Storage changes in this PR walkthrough.

---

## Google Drive

- Kept **disabled**.  
- No credentials created.  
- No environment variables added.  
- No database migration.  
- UI explicitly shows **Drive not configured**.

---

## Remaining blockers

1. **Preview staff auth:** enable `TEJAS_ADMIN_TOKEN` for the Preview environment (same value as Production is enough) so an authorized staff session can finish the live click-through / real XLSX downloads. Do **not** use Production host credentials against Production for this checklist.  
2. **Google Drive:** still blocked on owner credentials + optional schema (by design).  
3. **PAN role gate (policy):** if full-PAN export must be restricted beyond “any staff”, implement role check before merge; otherwise owner accepts all-staff reveal.  
4. **Owner approval:** merge / Production deploy remain separate decisions. PR **#65 stays open**.

---

## Implemented and tested (code)

| Area | Status |
|------|--------|
| Source audit doc | `TEJAS-REGISTRATION-REVIEW-DASHBOARD-AUDIT.md` |
| Drive design doc | `TEJAS-GOOGLE-DRIVE-BACKUP-DESIGN.md` |
| Unique student + stream fee helpers | `lib/registration/staff-metrics.ts` + tests (4) |
| Staff overview/row extensions | channel, unique counts, E/M/FT, Drive label, contacts |
| Review dashboard UX | Summary cards, filters, sort, pagination, mobile cards, detail sections, logout, refresh |
| Consolidated multi-sheet XLSX | `kind=consolidated` (+ optional `revealPan=yes`) |
| Original upload preserved | Still `kind=upload` |
| Payment status rules | Unchanged PATCH / OCR / UTR logic |

---

## Owner approval still required

1. Merge of this feature PR (separate decision).  
2. Deploy to Production (separate).  
3. Optionally attach `TEJAS_ADMIN_TOKEN` to Preview for complete staff Preview QA.  
4. Google Drive credentials / schema if sync is wanted.  
5. Decision on whether all staff may use `revealPan=yes`.

---

## Safety confirmations

- No fee/form/payment/UTR/OCR rule changes  
- No historical registration mutation  
- No Auth/RLS/Storage policy changes  
- No Production schema / env changes from this walkthrough  
- No Drive credentials / env / migration  
- No merge / Production deploy  
- PR #63 and other open PRs untouched  
