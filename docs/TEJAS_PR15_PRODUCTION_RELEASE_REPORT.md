# TEJAS PR 15 production release report

Release time: 13 November 2026, 8:19 PM IST.
Production site: https://tejas.dhe.org.in
Supabase project: `zapccpipwxduzlnvjdmy`, PostgreSQL 17.11.

This release deploys the staff publication warning from pull request 15. No book, mock test, student, entitlement, or payment was published or created.

## 1. Final check before merge

| Check | Result |
| --- | --- |
| Pull request | https://github.com/dhevb/tejas/pull/15, open, not a draft |
| Source branch | `cursor/staff-publication-wording-2878` |
| Approved commit | `753f80599b4ed1044b69db03e8e1707f7bd9c0cd` |
| Base | `main` at `8375b595ec9abc64711d8ce89b39085b31f4d836` |
| Commits | 1 |
| Files | 4: `app/learn/staff/page.tsx`, `app/learn/staff/staff-console.tsx`, `lib/portal/portal.test.ts`, `docs/TEJAS_CONTENT_PUBLICATION_APPROVAL_REPORT.md` |
| Diff size | +143 / −2 |
| Mergeability | `mergeable` true, `mergeable_state` clean |
| Reviews | None |
| Review comments | 0, none unresolved |
| Vercel on the approved commit | Success. Deployment has completed, 13 November 2026, 8:14 PM IST. Preview deployment `GUb8E8DjPHi9iXkv252vM67MTvms` |
| Vercel Preview Comments | Success, with no unresolved feedback |
| Supabase Preview | Skipped because a preview branch per pull request is disabled. GitHub treated the pull request as clean |

The four files are the warning on the staff page, the matching note on the publication form, the local test that guards that wording, and the content-approval audit already attached to the approved commit. No other application change was in the pull request.

## 2. Merge

| Item | Value |
| --- | --- |
| Result | GitHub reports the pull request merged |
| Merged at | 13 November 2026, 8:17 PM IST |
| Merge commit | `9a0c5d38f0358355a78227fd26ac569aa8f6e1be` |
| Merged by | cursor[bot] |

## 3. Production deployment

| Item | Value |
| --- | --- |
| GitHub deployment | `7768187989` |
| Environment | Production |
| Deployment SHA | `9a0c5d38f0358355a78227fd26ac569aa8f6e1be` |
| Vercel deployment | `BABty4D6z4MrQLHrx3ePL1rdhiwX` |
| Vercel status | Deployment has completed. https://vercel.com/dhe-projects/tejas/BABty4D6z4MrQLHrx3ePL1rdhiwX |
| Completed | 13 November 2026, 8:19 PM IST |
| Production domain | https://tejas.dhe.org.in |

## 4. Staff page on production

Checked at 13 November 2026, 8:20 PM IST. `GET https://tejas.dhe.org.in/learn/staff` returned 200. The page states:

> Saving a publication status writes that status to the production database. A published book or mock test then opens for a student who has the matching stream and class and a verified ₹49 payment. This action does not deploy the website.

The publication form note in the deployed page bundle states that saving writes the status to the production database and records the staff identity and reason in the audit trail. The old sentences, including “does not deploy the site or write production data” and “does not change production data”, are absent from the page and from that bundle.

The publication form was not submitted, and no staff sign-in was used.

## 5. No publication action

No publication request was sent. The production read after the deployment, in a read-only transaction, shows:

| Record | Count |
| --- | --- |
| `tejas_learn_publication` | 0 |
| `tejas_learn_audit` | 0 |
| `tejas_learn_students` | 0 |
| `tejas_learn_entitlements` | 0 |
| `tejas_learn_attempts` | 0 |

## 6. Existing student, entitlement, and payment data

| Record | Count after this release | Expected |
| --- | --- | --- |
| `tejas_registrations` | 2 | 2 |
| `tejas_payments` | 2 | 2 |
| `tejas_schools` | 2 | 2 |
| `tejas_book_orders` | 2 | 2 |
| `tejas_audit_logs` | 11 | 11 |
| `tejas_admin_users` | 0 | 0 |
| `tejas_learn_students` | 0 | 0 |
| `tejas_learn_entitlements` | 0 | 0 |

No student, payment, entitlement, registration, school, or printed-book row was created or changed. Privileges, row-level security, functions, and migrations were not changed.

## 7. Books and tests remain unpublished

| Item | Production status |
| --- | --- |
| Book 1, `ft-book-1` | `awaiting_approval` |
| Book 2, `ft-book-2` | `awaiting_approval` |
| Mock tests `ft-b1-mt01` through `ft-b1-mt05` | `awaiting_approval` |
| Mock tests `ft-b2-mt01` through `ft-b2-mt05` | `awaiting_approval` |
| Published books | 0 |
| Published tests | 0 |
| Publication override rows | 0 |

The catalog file on the merged commit also keeps every book and mock test at `awaiting_approval`.
