# TEJAS — Final Project Closure Report

**Date:** 2026-11-23 (Asia/Kolkata)  
**Repository:** `dhevb/tejas`  
**Production:** `https://tejas.dhe.org.in`  
**Final status:** **CLOSED WITH OWNER-ONLY ITEMS**

Fresh evidence from `git fetch` / `gh pr list` / local merge simulation. This revision corrects branch counts and records detailed PR reviews. It does **not** claim full zero-open closure.

---

## A. Completed and Git-verified

| Item | Evidence |
|------|----------|
| `main` HEAD | `8851ada865b814992c6e81c78a05c42e4634d7a5` (PR #52 DR corpus) |
| DR certification on `main` | Overall **PASS** (`preview-sql/TEJAS-DR-MASTER-STATUS.md`) |
| Production deployment | GitHub deployment id `7992290396`, sha `8851ada…`, state **success** |
| Public routes (prior pass) | HEAD **200** for `/`, `/about`, `/schools/register`, `/prepare/ebook`, `/faq`, `/contact` |
| Superseded PRs closed earlier | #43, #22, #21, #17, #16, #11 (with evidence comments) |
| Merged/obsolete remote tips deleted | Prior cleanup; current remote set verified below |
| Security lockfile branch | `security/npm-audit-20261123` @ `52bced777b8a09155e1e3454cdf6a9bfa6593ac0` |
| Recovery Python tests (this pass) | **13 PASS** (`test_inventory_sql`, `test_retention`, `test_restore_target`, `test_seal_backup`, `test_workflows`) |
| Draft PR checks #53 / #54 | validate **SUCCESS**, guard **SUCCESS**, Vercel **SUCCESS** (see §C) |

---

## B. Fresh GitHub inventory (corrected)

### Open Pull Requests — **6**

| PR | Draft | Base ← Head | Head SHA | Mergeability |
|----|-------|-------------|----------|--------------|
| **#54** | yes | `main` ← `security/npm-audit-20261123` | `52bced7` | MERGEABLE / CLEAN |
| **#53** | yes | `main` ← `docs/final-project-closure-20261123` | `b7fb2cc` | MERGEABLE / CLEAN |
| **#25** | no | `main` ← `cursor/registration-payment-verification-2878` | `fff8cd2` | **CONFLICTING / DIRTY** |
| **#13** | no | `cursor/official-documents-6ad0` ← `cursor/separate-orders-ebook-6ad0` | `9af0437` | MERGEABLE / CLEAN *(stacked)* |
| **#12** | no | `cursor/website-accuracy-audit-6ad0` ← `cursor/official-documents-6ad0` | `a8184c6` | MERGEABLE / CLEAN *(stacked)* |
| **#10** | no | `main` ← `cursor/supabase-migration-versions-6ad0` | `0e33256` | MERGEABLE / CLEAN |

Open Issues: **0**

### Remote branches — **8** (excluding `origin/HEAD`)

1. `origin/main`  
2. `origin/docs/final-project-closure-20261123`  
3. `origin/security/npm-audit-20261123`  
4. `origin/cursor/registration-payment-verification-2878` (#25)  
5. `origin/cursor/separate-orders-ebook-6ad0` (#13)  
6. `origin/cursor/official-documents-6ad0` (#12)  
7. `origin/cursor/website-accuracy-audit-6ad0` (stack base for #12)  
8. `origin/cursor/supabase-migration-versions-6ad0` (#10)  

**Correction:** Earlier wording that omitted `docs/final-project-closure-20261123` from the branch count was wrong. The authoritative count is **8**.

### Stack dependencies

```
main
├── #54 security/npm-audit-20261123
├── #53 docs/final-project-closure-20261123
├── #25 cursor/registration-payment-verification-2878   [CONFLICTING]
├── #10 cursor/supabase-migration-versions-6ad0
└── (stack)
    cursor/website-accuracy-audit-6ad0
      └── #12 cursor/official-documents-6ad0
            └── #13 cursor/separate-orders-ebook-6ad0
```

---

## C. Draft PRs #53 and #54 — checks (do not merge)

Both remain **open drafts**. Merging either would trigger a **Vercel Production redeploy**. Owner approval required before merge.

| Check | #53 (docs) | #54 (security) |
|-------|------------|----------------|
| recovery-backup / validate | SUCCESS | SUCCESS |
| recovery-restore-guard / guard | SUCCESS | SUCCESS |
| recovery-backup / backup | SKIPPED | SKIPPED |
| Supabase Preview | SKIPPED | SKIPPED |
| Vercel | SUCCESS | SUCCESS |
| Vercel Preview Comments | SUCCESS | SUCCESS |

---

## D. Retained unfinished work — detailed reviews

### PR #25 — Individual registration / books / payment proof

**Status:** RETAIN open. **Do not merge. Do not apply migrations.**

| Topic | Finding |
|-------|---------|
| Divergence | **63 behind / 5 ahead** of `main` |
| Merge conflict | Simulated merge into `origin/main`: **content conflict only in `package.json`** (other touched files auto-merge) |
| Payment routes added | `app/api/books/*/payment`, `books/individual`, `books/school`, `register/individual`, `register/admin/proof`, plus related UI |
| UTR uniqueness | Docs + code introduce `tejas_payment_utrs` with PK `utr_key`; claim via insert; same-owner retry vs other-owner conflict; explicitly **rejects** unsafe `ON CONFLICT DO NOTHING` backfill |
| Migration preflight | Package includes `20261114_*` (marked unsafe / emptied) and reviewed `20261115_02_payment_utr_registry.sql` + verification SQL; commit message: *“without applying it”* |
| Production assumptions | Assumes staff proof review, hosted proofs, and registry table presence; not present on current `main` feature set |

**Owner-only:** rebase/conflict resolution, migration apply decision, Production payment-behavior approval.

---

### PR #13 — Separate books / e-book access (stacked on #12)

**Status:** RETAIN open. **Do not merge.**

| Topic | Finding |
|-------|---------|
| Base | `cursor/official-documents-6ad0` (not `main`) — cannot land on Production without first resolving #12 stack vs current `main` |
| Book payment / dispatch | Book orders record `paymentCollected: false` and `dispatched: false` at creation; dispatch/payment collection remain unfinished operational flags |
| ₹49 e-book fee | `EBOOK_FEE = 49`; `EBOOK_SALE_OPEN = false`; Olympiad registration must not collect ₹49; UI states fee is ₹49 per student when/if sale opens |
| Private file storage | Order/ebook account JSON under `data/separate-orders` (gitignored), sealed via `sealBytes`; `TEJAS_DATA_DIR` override supported |
| Official e-book files | **`fileSupplied: false` hard-coded**; prepare/ebook page: *“No e-book file has been supplied”*; no official ebook PDF/EPUB in tree for reading |

**Owner-only:** whether to port this model onto current `main` (which uses `app/api/learn/*`) or abandon in favour of the learning portal.

---

### PR #12 — Official brochure / invitation / 2025 report

**Status:** RETAIN open. **Preserve original PDFs. Do not invent an owner decision.**

**Preserved binaries on branch tip `a8184c6`:**

- `public/documents/tejas-olympiad-2026-27-brochure.pdf`  
- `public/documents/tejas-olympiad-2026-27-invitation.pdf`  
- `public/documents/dhe-english-olympiad-2025-brief-report.pdf`  

**Unresolved document differences (recorded in branch `app/documents/page.tsx` / `content/current-cycle.ts`):**

| Topic | Invitation (letter) | Brochure (tentative) | Current `main` (owner-approved site constants) |
|-------|---------------------|----------------------|------------------------------------------------|
| Registration window | **3–20 November 2026** | **02–22 November 2026** | **3–30 November 2026** |
| Results | Invitation: communicated separately; brochure tentative **12 January 2027** | Same tentative date | **12 January 2027** declared on site |
| Awards | Cash prizes ₹3100/2100/1500 + 10×₹500 | Medals + e-certificate | Site FAQ awards text evolved separately; medal-vs-cash relationship still **unresolved in source PDFs** |
| Registration channel | Website school form | Brochure QR → Google Form | Website `/schools/register` |

No autonomous choice was made among invitation vs brochure vs current site constants. PDFs remain on the PR branch for owner reconciliation.

---

### PR #10 — Migration unique versions

**Status:** RETAIN open. **Do not run `supabase db push`. Do not merge without owner migration plan.**

| File on PR tip | Header stance | Relation to `main` |
|----------------|---------------|--------------------|
| `20261031100000_tejas_storage.sql` | **NOT APPLIED** — private `tejas-payment-proofs` bucket + indexes | **Not present** on current `main` migration list |
| `20261031110000_tejas_registration_additive.sql` | **DO NOT RUN** — live inspection said columns/tables/buckets already present | **Not present** on current `main` migration list |
| `main` migrations now | — | `20261031_tejas_registration.sql`, `20261118000100_*`, `20261118000200_*`, `20261119_tejas_pan_holder.sql` |

Diff vs `main` is rename/add of those two SQL files plus a small inspect test. Applying would touch migration history relative to a Production schema that has already moved forward — owner-only.

---

### PR #54 — npm audit lockfile (draft)

**Status:** RETAIN open draft. **Do not merge without owner confirmation. Do not auto-upgrade to Next.js 16.**

| Check | Result |
|-------|--------|
| Changed files vs `main` | **`package-lock.json` only** |
| `package.json` next range | still `^15.5.19` (unchanged) |
| Locked `next` | **15.5.29** |
| Locked top-level `postcss` | **8.5.33** |
| Nested `next/node_modules/postcss` | **8.4.31** (drives remaining advisories) |
| Node local | `v20.18.0` (`engines`: `>=20`; npm warned some tooling wants `^20.19.0`) |
| Advisories after fix | **2** remaining (1 moderate + 1 high) — nested postcss via next |
| Full clear | `npm audit fix --force` → **Next.js 16.4.6** (breaking) — **not performed** |
| Local checks on branch | `tsc --noEmit` PASS (prior); recovery unit tests PASS |

---

## E. Local worktrees / checkpoint (preserved)

| Worktree | Branch | HEAD | Notes |
|----------|--------|------|-------|
| `tejas-dr-closure` | `docs/final-project-closure-20261123` | this report tip | Closure docs worktree |
| `tejas-phase3` | `phase3/free-host-local` | `6da54f6` | Dirty/untracked DR copies **preserved**; not pushed |
| `tejas` | local `docs/dr-windows-verification-20261118` | `d389540` | `getkey.obj` untracked **preserved** |
| `tejas-website` | local `fix/faq-separate-pan-fields` | `d9f86d6` | Clean local tip of previously merged FAQ branch |

**Checkpoint `6da54f6`:** still **not published** (hosting `_next` + mixed WIP). No reset/clean/stash.

Recovery archives, secrets, Auth reader, isolated project: **untouched**.

---

## F. Owner-only decisions (still open)

1. Approve/reject merge of draft **#53** (docs → Production redeploy).  
2. Approve/reject merge of draft **#54** (lockfile → Production redeploy).  
3. Resolve **#25** conflicts + UTR migration apply/abandon.  
4. Decide fate of stacked **#12 / #13** (PDFs + ebook/books separation vs current `main` / learn portal).  
5. Decide fate of **#10** migration renames (no `db push` without plan).  
6. Whether to schedule **Next.js 16** for the last 2 npm advisories.  
7. Isolated Supabase project retain/delete; Auth reader ban/delete.  
8. Separate review of local **`6da54f6`**.

---

## G. Production actions deliberately not taken

- No merge of #53, #54, #25, #13, #12, or #10 into `main`  
- No `supabase db push` / schema / RLS / policy / Auth / Storage changes  
- No payment-config or live registration/payment operations  
- No Next.js 16 / `npm audit fix --force`  
- No force-push, history rewrite, `git clean`, stash discard  
- No deletion of isolated project, Auth reader, recovery keys, or sealed archives  

---

## H. Report Git location

| Field | Value |
|-------|-------|
| Path | `preview-sql/TEJAS-FINAL-PROJECT-CLOSURE-REPORT.md` |
| Branch | `docs/final-project-closure-20261123` |
| Draft PR | https://github.com/dhevb/tejas/pull/53 |
| Tip SHA | `b7fb2cc213eba60af537f8b2044afef77d55f193` (correction series; see git log on branch) |

---

**Honest status: CLOSED WITH OWNER-ONLY ITEMS** — safe cleanup and reviews are complete; unfinished product/migration/security merges remain intentionally open.
