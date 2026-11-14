# TEJAS production deployment readiness

Updated: 14 November 2026, 3:49 PM IST.
Pull request #20 was merged by owner authorization. No separate Production deployment command was run.

## 1. Merge result

| Item | Result |
|---|---|
| Pull request | [#20](https://github.com/dhevb/tejas/pull/20) |
| State | MERGED |
| Source branch | `cursor/website-remediation-2878` |
| Reviewed head | `8b4446462d5d5a409b1a351386974918be142ec1` |
| Target | `main` |
| Merge commit | `24355920c970cfd54d7457dd00ae6b4dcc3dcca6` |
| New `main` HEAD | `24355920c970cfd54d7457dd00ae6b4dcc3dcca6` |
| Merged at | 3:47 PM IST, 14 November 2026 |

The merge commit’s parents are `fb64ed3c910b0d582648d176523ed4407cee34ed` and `8b4446462d5d5a409b1a351386974918be142ec1`. No other commit was added by the merge. The reviewed application changes are on `main`.

## 2. GitHub checks

Before the merge, the pull request was clean and mergeable.

| Check | Result |
|---|---|
| Vercel, preview of `8b44464` | Passed. Deployment `2WDKfoisYW7X5AfY7RHChU6MZEv2`. |
| Vercel Preview Comments | Passed |
| Supabase Preview | Skipped. It was not a required failure. |

After the merge, the Vercel check on `24355920c970cfd54d7457dd00ae6b4dcc3dcca6` succeeded. Deployment `AtAyPG8yZJEcFnZajPsTx3dPL8vb`.

## 3. What Vercel did after the merge

Merging `main` caused the existing Git integration to create a Production deployment. No deploy command was run, and the preview was not promoted by hand.

| Item | Result |
|---|---|
| Deployment | GitHub deployment `7786134620` |
| Environment | Production |
| Commit | `24355920c970cfd54d7457dd00ae6b4dcc3dcca6` |
| Created | 3:48 PM IST, 14 November 2026 |
| State | success, “Deployment has completed” |
| Previous Production commit | `fb64ed3c910b0d582648d176523ed4407cee34ed`, created 1:27 PM IST the same day |

A read-only GET of https://tejas.dhe.org.in at 3:49 PM IST showed the merged site:

- `/` shows तेजस with OLYMPIAD and says the school registration form does not charge the ₹49 e-book.
- `/prepare` no longer contains “65%”.
- `/olympiads/english` no longer contains “DHE English Olympiad 2.0”.
- `/olympiads/future-tech` follows to `/olympiads/technology`.
- `/beta` says the page does not send a form.
- `/learn` and `/prepare/ebook` say Future Tech Book 1 and Book 2 are published, with 5 of 5 included mock tests published for each book. They say English and Mathematics files have not been supplied.

The “2.0” characters on `/contact` are an SVG path, not programme copy.

## 4. Database

No migration was run. No student, registration, payment, or publication row was written. No RLS policy, grant, or permission was changed. No form was submitted and no test account was created. The public pages above only read publication status.

## 5. Outstanding issues

- Contact and beta still do not deliver mail. They say so.
- Search remains disabled.
- English and Mathematics book files are not on the website.
- This note itself is not on `main` yet. It was not pushed there, because the merge instruction did not authorize a further commit on `main`.

## 6. Statement

The owner authorized the merge. The owner did not authorize a separate Production deployment. No deploy command was issued. The project’s Git integration nevertheless deployed merge commit `24355920c970cfd54d7457dd00ae6b4dcc3dcca6` to Production, and https://tejas.dhe.org.in is serving that commit.
