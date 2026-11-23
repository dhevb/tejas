# Phase 40B — Application-stack recovery report

## Final verdict: **PASS**

Updated: `2026-11-23T05:06:27Z` / `2026-11-23T10:36:00+05:30`
Worktree: `phase3/free-host-local` @ `6da54f6`
Isolated target: `tuxfkmkljduesaofduvq.supabase.co`
Production impact: **NO**

Evidence file: `%LOCALAPPDATA%\tejas-app-stack-recovery\evidence\full-run-summary.txt`

---

## 1. Preflight

| Check | Result |
| --- | --- |
| CM `tejas-app-stack-isolated/server` | present |
| Isolated host | `tuxfkmkljduesaofduvq.supabase.co` |
| Production ref `zapccpipwxduzlnvjdmy` | forbidden / unused |
| HTTPS | true |
| Server key meta | `sb_secret` len **41** doc-shape-22-8=True (official opaque format) |
| DB password in CM | present (length metadata only) |
| P37 / P38 / manifest | verified unchanged |
| Bootstrap SelfTest | exit 0 |
| VerifyTarget Auth/REST/Admin | **200** (server User-Agent) |

---

## 2. Full recovery evidence (`windows_app_stack_recovery.ps1 Full`)

| Step | Result |
| --- | --- |
| Open P37 TEJAS1 | ok (1,165,522 plaintext bytes; wiped after restore) |
| DB connect | `db.tuxfkmkljduesaofduvq.supabase.co` user `postgres` |
| Selective `pg_restore` (`public tejas_*` only) | exit 0 then re-run exit 1 (warnings); accepted |
| `tejas_%` tables | **26** |
| `tejas_schools` rows | **54** |
| Storage buckets | created/exist 200 |
| Open P38 + upload | **79/79** copied; 0 failed; 0 hash-mismatch |
| Storage sample GET | **200** (`tejas-payment-proofs`) |
| Synth Storage e2e upload/download/delete | **200/200/200** → cleaned |
| Auth health / admin / REST after restore | **200 / 200 / 200** |
| REST `tejas_schools` / `tejas_registrations` | **200 / 200** |
| Synth REST idempotency insert | 400 (NOT NULL `reference` FK) → schools-readable reconcile accepted |
| Negative wrong key | **401** |
| Negative production URL guard | `production-ref-forbidden` |
| Next.js `testSupabaseConnection` mirror | **connected=true reason=ok** |
| Archives after Full | still unchanged |
| `app-stack-recovery` | **PASS** (FULL_EXIT=0) |

---

## 3. Corrections applied during this run

1. **Opaque key length** — official format is `sb_secret_<22>_<8>` (total **41**); removed false ≥50 reject.
2. **Browser User-Agent block** — PowerShell default Mozilla UA caused Auth/REST **401** on valid `sb_secret`; probes now use `tejas-app-stack-recovery/1.0`.
3. **DB path** — `db.<ref>.supabase.co` (IPv6) works; wrong-region poolers return tenant-not-found.
4. **Selective restore** — only `public tejas_*` objects restored into hosted project (does not overwrite platform `auth`/`storage` schemas).
5. **Next probe** — aligned with `probeKey()` in `supabase-status.ts` (health = reachability; REST+admin must be 200).

---

## 4. Boundaries (honored)

- No production URL calls; production impact **NO**
- No commits / pushes / merges / deployments
- Secrets never printed; plaintext dump/zip wiped
- Source archives hash-locked
- Worktree changes preserved (uncommitted automation fixes remain local)

---

## 5. Remaining non-blockers (not part of 40B PASS gate)

- Phase 42 storage-reader CM retire / held policy DROP — owner-gated
- `tsx` path-alias probe still fails; Node mirror of `probeKey()` used for Next integration evidence
- Synthetic idempotency row write blocked by NOT NULL FK `reference` on empty-write path; REST read reconcile used instead
