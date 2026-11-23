# PR #56 — Pre-merge Production safety audit (READ-ONLY re-audit)

| Field | Value |
|---|---|
| Audit date | 23 November 2026 (IST) — **re-audit after UTR filesystem fix** |
| PR | https://github.com/dhevb/tejas/pull/56 |
| Base (`main`) | `fa1b15e62900d12d1832dcb19b88c67ef1a9935f` |
| Head (feature) | `f8b6d3a84de798b70668fb02183041e867f3f988` |
| Mode | Code + config inspection; **no** merge, Production deploy, or migration apply |
| Prior verdict | **DO NOT MERGE** (filesystem `claimUtr` on read-only Vercel FS) |
| This verdict | **SAFE TO MERGE WITH CONDITIONS** |

---

## A. Merge deployment consequences

**Unchanged:** Merging PR #56 into `main` **will automatically trigger a Vercel Production deployment.**

Evidence (unchanged from prior audit):

- Vercel project `dhe-projects/tejas` → GitHub link `productionBranch: "main"`.
- `commandForIgnoringBuildStep: null`.
- Prior Production deploy `dpl_EWNdXmo…` has `githubCommitRef: "main"` from merge of PR #55.
- Build = `npm run build` only — **no migration runner**.
- GitHub Actions: recovery workflows only — no deploy/migrate on merge.
- `main` branch protection: **not configured**.

**Implication:** Merge ≡ Production release. Owner must treat merge as deploy authorization.

---

## B. Migration dependency matrix

Migration (still **unapplied**): `supabase/migrations/20261123_payment_utr_registry_and_ocr.sql`  
SHA-256: `91758B3FB2B53AFA7E549A33A12546DA97604F857BB7F9D2CA15C25628E20E2C`  
(grants `service_role` DML; explicit `REVOKE ALL` from `public`, `anon`, and `authenticated`).

| API/Workflow | New DB dependency | Migration applied? | Safe after merge? | Evidence |
|---|---|---|---|---|
| `/api/register/[reference]/payment` | Uses `tejas_payment_utrs` **only for atomic claim** when present | No | **Yes — fail-closed** | Missing table → `unavailable`; proof saved as `reported` + exception; **never** `confirmed` |
| `/api/learn/pay` | Same claim gate | No | **Yes — fail-closed** | `reportPaymentWithScreenshot` blocks auto-verify without claim |
| UTR uniqueness | Requires `tejas_payment_utrs` PK | No | Unique claims **gated off**; duplicates not silently ignored | `claimUtr` → `unavailable` |
| Auto-approval | Requires successful claim **and** OCR match | No | **Blocked until registry available** | `approved = uniquenessOk && decision.automatic` |
| Registration submit / reads | Existing tables only | N/A | **Yes** | No UTR registry dependency |
| Remote payment patch | Existing columns + `record_snapshot` | No | **Yes** | Does not PATCH new payment columns |
| OCR probe | None | N/A | Production 404 | `VERCEL_ENV=production` |

---

## C. Production outage risk

### Resolved (was Critical)

- **Filesystem UTR claims** — removed. `lib/registration/utr-claim.ts` no longer imports `node:fs`, does not write `/tmp`, app dir, or JSON claim files. Production path = Supabase PostgREST insert into `tejas_payment_utrs`.

### Remaining risks

| Severity | Risk | Notes |
|---|---|---|
| High (process) | Merge auto-deploys Production | Owner must accept merge = deploy |
| Medium (product) | Until migration is applied, **automatic** screenshot approval stays off | Proofs can still be stored as pending/exception; staff review remains possible via existing flows |
| Medium | Preview/Production credential isolation | Current `vercel env ls` shows Supabase secrets on Production only |
| Low | OCR probe in bundle | Hard-disabled on Production |
| Low | Cold-start OCR latency | Fail-closed; Preview-proven after WASM tracing |

### None (migration crash)

- Missing `tejas_payment_utrs` returns controlled `unavailable` — **no unhandled FS throw**, no 500 from claim path for missing schema.

---

## D. Deployment safeguards

| Safeguard | Enforced? |
|---|---|
| Merge does not auto-deploy | **No** — still auto-deploys |
| Migrations on build | **Yes** — not run |
| `claimUtr` Vercel FS-safe | **Yes** — Supabase only |
| Missing registry → no auto-approve | **Yes** — code gate |
| Missing registry → no crash | **Yes** |
| Probe disabled on Production | **Yes** |
| Fixture OCR cannot auto-approve | **Yes** |
| Branch protection on `main` | **No** |

---

## E. Final diff audit (post-fix focus)

### Critical
- **None remaining** for the prior filesystem blocker.

### High
- Auto Production deploy on merge (process).
- Auto-approval remains intentionally gated until owner applies migration (product/ops).

### Medium
- New individual registration + OCR payment UX (intentional).
- Learn pay requires screenshot (intentional).

### Low
- Preview OCR probe endpoint (Production-disabled).

### None observed
- No secrets in diff; no historical row deletes; no migration auto-apply.

---

## F. Recommendation

### Verdict: **SAFE TO MERGE WITH CONDITIONS**

#### Mandatory conditions (owner)

1. **Accept that merge auto-deploys Production** (or pause auto-promote / use a manual release process before merging).
2. **Do not expect automatic screenshot approval until** `20261123_payment_utr_registry_and_ocr.sql` is **owner-authorized and applied** to Production. Until then, payment APIs remain up and fail closed to pending/exception.
3. **Apply the migration as a separate, explicit Production step** after merge/deploy if/when uniqueness + auto-approval are required.
4. Keep PR #25 / #13 unmerged; no force-push; no ad-hoc Production schema edits outside the reviewed migration.

#### Established by this re-audit

| Question | Answer |
|---|---|
| Does merging still auto-deploy Production? | **Yes** |
| Are payment APIs safe without the migration? | **Yes** — no crash; no auto-approve; proofs can pend |
| Is `claimUtr()` Vercel-compatible? | **Yes** — Supabase PK insert; no app FS |
| Any other payment UTR filesystem dependency? | **No** in `utr-claim` / payment / learn-pay claim path |
| Can deploy cause payment API outage from missing schema? | **No** for claim path (controlled exception) |
| Is new payment auto-approval safely gated until migration? | **Yes** |

---

## Appendix — Fix summary

- Replaced filesystem `O_EXCL` claims with Supabase `tejas_payment_utrs` primary-key inserts.
- Missing table / DB errors → `{ error: "unavailable" }`.
- Payment + learn flows: OCR may succeed, but **approval requires claim success**.
- Tests: `lib/registration/utr-claim.test.ts` (+ updated payment-rules); suite **94/94**, `tsc`, lint, build pass locally.
- Migration file includes `service_role` grants + explicit anon/authenticated REVOKE (still **not applied**).
- Final migration SHA-256: `91758B3FB2B53AFA7E549A33A12546DA97604F857BB7F9D2CA15C25628E20E2C`.
- Tip commit: `6150ffac99fca6eb20869538206c4b5512282a79`

**Production unchanged by this work.** PR #56 remains **OPEN / unmerged** until the owner decides.
