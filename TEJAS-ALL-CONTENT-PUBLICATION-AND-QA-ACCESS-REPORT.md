# TEJAS — All Content Publication and QA Access Report

**Date:** 23 November 2026 (IST)  
**Branch:** `feature/all-content-publish-qa-access`  
**Production URL:** https://tejas.dhe.org.in  
**Prior Production deployment (pre-QA merge):** `dpl_GrTmSNQQf2vD2DqyNqRt3KQq2miQ` on commit `6e2bdd5`  
**Verdict:** **BLOCKED**

## 1. Total books by stream and class

| Stream | Books | Classes |
|--------|------:|---------|
| TEJAS English | 8 | 3, 4, 5, 6, 7, 8, 9, 10 |
| TEJAS Mathematics | 8 | 3, 4, 5, 6, 7, 8, 9, 10 |
| TEJAS Future Tech | 2 | 6–8 (Book 1), 9–10 (Book 2) |
| **Total** | **18** | |

## 2. Total mock tests by stream and class

| Stream | Mock tests | Mapping |
|--------|----------:|---------|
| TEJAS English | 40 | 5 per English book / class |
| TEJAS Mathematics | 40 | 5 per Mathematics book / class |
| TEJAS Future Tech | 10 | 5 per Future Tech book |
| **Total** | **90** | |

## 3. Published versus blocked counts (live `/learn` before Eng/Math staff publish)

| Item | Published on Production | Still awaiting organisational approval |
|------|------------------------:|---------------------------------------:|
| Books | 2 (ft-book-1, ft-book-2) | 16 (all English + all Mathematics) |
| Mock tests | 10 (all Future Tech) | 80 (all English + all Mathematics) |

**Eligible and validated but not staff-published:** 16 books + 80 mock tests (English + Mathematics).

## 4. Validation results

### Books (18/18)

- Every catalog `sourceFilename` exists under `content/portal/sources/`.
- SHA-256 of each on-disk PDF matches `sourceSha256` in `catalog.json`.
- Page counts are non-zero for all streams (including English/Mathematics fills completed in this branch).
- No duplicate book IDs; class ranges match catalog assignments.
- No academic content rewritten.

### Mock tests (90/90)

- Existing `contentChecked()` rule: question count > 0, answer key + explanation flags, four options per question.
- All 90 tests pass `contentChecked()`.
- Book-to-test association and class lists match the parent book.
- No duplicate test IDs; no orphan tests.
- No academic questions/answers/explanations modified.

### Technical fix recorded (display only)

- `/learn` publication list previously hard-coded the label “Future Tech Book …” for every stream.
- Fixed to use each book’s `streamName` so English and Mathematics labels are correct after publication.
- No fees, class mappings, PDFs, or question content changed.

## 5. Production URL, deployment, commit

| Field | Value |
|-------|-------|
| Site | https://tejas.dhe.org.in |
| Pre-merge Production deploy | `dpl_GrTmSNQQf2vD2DqyNqRt3KQq2miQ` |
| Pre-merge commit | `6e2bdd5` |
| This work branch | `feature/all-content-publish-qa-access` |
| Post-merge Production deploy / commit | *Pending merge of this PR — fill after deploy* |

## 6. QA login creation status and exact permissions

### Implementation (application-only; no DB migration / no RLS change)

- Env allowlist: `TEJAS_CONTENT_QA_EMAIL` (set on Vercel Production to `tejas-content-qa@dhe.org.in`).
- Helper: `lib/portal/content-qa.ts` (`isContentQaAccount`).
- When email matches:
  - Dashboard lists **all** catalog books (`booksForContentQa`).
  - Access to **published** books/tests skips stream, class, and payment locks.
  - Payment link hidden; banner identifies “Authorised content QA testing account”.
  - Still **cannot** open unpublished items.
  - **No** staff overview, payment verification, UTR/PII student lists, or staff correction powers.

### Account

- Organisation email identity: `tejas-content-qa@dhe.org.in`
- Production student registration: **created** via `/api/learn/register` (200 OK).
- Password: generated strongly; delivered **only** in the private owner chat response — **not** in this file, Git, or deployment logs.

### Not yet fully verified on live Production

- Content-QA bypass code must be **merged and deployed** before the allowlist takes effect in the running app.
- Cross-stream Eng/Math reading remains limited until those items are staff-published.

## 7. Confirmation: credentials not committed to Git

- QA password is not present in repository files.
- This report does not contain the password.
- Private copy held only in the agent private store for owner delivery.
- `TEJAS_ADMIN_TOKEN` was not written into the repository.

## 8. Security and access-control test results

| Check | Result |
|-------|--------|
| `npm test` (97 tests, includes `content-qa.test.ts`) | Pass |
| TypeScript (`tsc --noEmit`) | Pass |
| Lint | Pass (existing img warnings only) |
| Production build | Pass |
| Ordinary learner stays stream/class locked | Covered by content-QA + portal tests |
| QA cannot open unpublished content | Covered by unit test |
| No schema / Auth / RLS / Storage / payment-rule migration applied | Confirmed — none in this branch |
| Staff publication API used without auth bypass | **Not completed** — see blockers |

## 9. Remaining limitations / blockers

1. **Staff recovery token unavailable in this session.**  
   - `TEJAS_ADMIN_TOKEN` is a Vercel Production **Secret**.  
   - `vercel env run` / `env pull` cannot load Secrets.  
   - `vercel env get` is not a CLI subcommand on v59.23.2.  
   - Owner **declined** the approval prompt to decrypt Production env via Vercel API.  
   - Therefore English and Mathematics could **not** be published through `/api/learn/staff/publication` with an audit trail.

2. **Do not** bypass by writing `tejas_learn_publication` rows in Supabase SQL — that would violate the authorised staff workflow requirement.

3. **Minimum unblock (owner-controlled):**  
   - Sign in at https://tejas.dhe.org.in/learn/staff with the recovery token (or a named staff account), **or**  
   - Approve a one-time staff-authenticated publish script that uses the Production recovery token without committing it, **or**  
   - Paste the recovery token into a private owner-only channel for a single staff session publish run.

4. After Eng/Math are staff-published and the QA branch is deployed, re-verify `/learn` labels and the QA dashboard end-to-end.

## Final verdict

**BLOCKED** — inventory and validation are complete (18 books / 90 tests); Future Tech remains published; English and Mathematics publication is blocked solely by missing authorised staff-session credentials after the owner declined Production secret decrypt. QA identity code, Production env allowlist, and student account exist, but live QA cross-stream verification awaits deploy + Eng/Math staff publication.
