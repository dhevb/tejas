# PR #56 — Final Production migration SQL security audit (READ-ONLY)

| Field | Value |
|---|---|
| Audit date | 23 November 2026 (IST) |
| Follow-up checks | Same day — `tejas_payments` ordering + explicit `anon`/`authenticated` REVOKE |
| Migration | `supabase/migrations/20261123_payment_utr_registry_and_ocr.sql` |
| Migration SHA-256 | `91758B3FB2B53AFA7E549A33A12546DA97604F857BB7F9D2CA15C25628E20E2C` |
| Prior SHA-256 (pre-REVOKE hardening) | `3EAB546721FF7355B29FF554C7B71B65825823324CBD47CBACAF6F157591CF63` |
| PR | https://github.com/dhevb/tejas/pull/56 — **OPEN, unmerged** |
| Base (`main`) | `fa1b15e62900d12d1832dcb19b88c67ef1a9935f` |
| Tip commit | `2f0c8872438293e7e398b73eda1caf5fdca2fd1a` |
| Working-tree note | REVOKE hardening committed to PR #56 feature branch (not applied to any database) |
| Executed on Production? | **No** |
| Live schema queried? | **No** |

---

## Follow-up check 1 — `tejas_payments` exists before this migration

### Active migration order (`supabase/migrations/`, lexical / timestamp order)

| Order | File | Relevance to `tejas_payments` |
|---|---|---|
| 1 | `20261031_tejas_registration.sql` | **Creates** `tejas_payments` (`create table if not exists tejas_payments (…)` at lines 71–81) |
| 2 | `20261118000100_tejas_learning_portal.sql` | Learning portal only — no drop of `tejas_payments` |
| 3 | `20261118000200_tejas_learning_portal_durable.sql` | Durable learn RPCs — no drop of `tejas_payments` |
| 4 | `20261119_tejas_pan_holder.sql` | Adds `tejas_schools.pan_holder` only |
| 5 | `20261123_payment_utr_registry_and_ocr.sql` | **Alters** `tejas_payments` with `ADD COLUMN IF NOT EXISTS` |

### Held migrations (not in the active chain)

- `supabase/held-migrations/20261031_tejas_registration_additive.sql` — alters `tejas_payments` / indexes (held).
- `supabase/held-migrations/20261031_tejas_storage.sql` — indexes including `tejas_payments_status_idx` (held).

### Conclusion

**Confirmed:** In the repository’s active migration history, `tejas_payments` is created in **`20261031_tejas_registration.sql`**, which sorts **before** `20261123_payment_utr_registry_and_ocr.sql`. No later active migration drops `tejas_payments`. The UTR migration’s `ALTER TABLE public.tejas_payments …` is ordered correctly **after** table creation.

Production live presence was **not** re-queried in this pass (read-only / no Production contact). Owner should still confirm Production already applied the 20261031 registration baseline before running 20261123.

---

## Follow-up check 2 — Explicit privilege revocation

### Change prepared in migration SQL

```sql
alter table public.tejas_payment_utrs enable row level security;
revoke all on table public.tejas_payment_utrs from public;
revoke all on table public.tejas_payment_utrs from anon, authenticated;
grant select, insert, update, delete on table public.tejas_payment_utrs to service_role;
```

### Permissions matrix (as scripted)

| Principal | Effect |
|---|---|
| `PUBLIC` | `REVOKE ALL` |
| `anon` | **`REVOKE ALL` (explicit)** |
| `authenticated` | **`REVOKE ALL` (explicit)** |
| `service_role` | **`GRANT SELECT, INSERT, UPDATE, DELETE`** retained after revokes |

### Pattern alignment

Matches the project’s durable-portal style of `REVOKE … FROM public, anon, authenticated` then `GRANT … TO service_role` (see function grants in `20261118000200_tejas_learning_portal_durable.sql`).

### Student exposure

With RLS enabled, **no policies**, and explicit revokes from JWT client roles, browser/`anon`/`authenticated` clients cannot read another student’s UTR registry rows through PostgREST client keys. Server payment paths continue to use the service role key.

---

## 1. SQL structure findings (unchanged shape)

| Object | Action |
|---|---|
| `public.tejas_payment_utrs` | `CREATE TABLE IF NOT EXISTS` + PK on `utr_key` |
| `tejas_payment_utrs_owner_idx` | `CREATE INDEX IF NOT EXISTS` |
| RLS | Enabled; no policies |
| Privileges | REVOKE public/anon/authenticated; GRANT service_role |
| `tejas_payments` | Seven nullable `ADD COLUMN IF NOT EXISTS` |

No FKs, triggers, RPCs, or `SECURITY DEFINER` objects.

---

## 2. UTR uniqueness (re-verified)

Unchanged and still **Pass**: PK on `utr_key`; concurrent inserts conflict atomically; app `claimUtr()` INSERT + 409 handling; no UPSERT overwrite; approval still requires successful claim.

---

## 3. Idempotency (re-verified after REVOKE change)

| Statement | Re-run safe? |
|---|---|
| `CREATE TABLE IF NOT EXISTS` | Yes |
| `CREATE INDEX IF NOT EXISTS` | Yes |
| `ENABLE ROW LEVEL SECURITY` | Yes |
| `REVOKE ALL … FROM public/anon/authenticated` | Yes (idempotent) |
| `GRANT … TO service_role` | Yes (idempotent) |
| `ADD COLUMN IF NOT EXISTS` | Yes |
| Single `BEGIN`/`COMMIT` | Yes |

Application compatibility with `claimUtr()` / `noteUtr()` / `releaseUtr()` **unchanged** by the REVOKE lines (service_role grants preserved).

---

## 4. Application compatibility (re-verified)

| Check | Result |
|---|---|
| Table/column names vs `utr-claim.ts` | Match |
| Category CHECK vs app categories | Match |
| Missing table → fail-closed | Still enforced in app |
| Auto-approve requires claim success | Still enforced |
| New `tejas_payments` columns | Still unused by remote writers (harmless) |

---

## 5. Findings by severity (updated)

### Critical / High
- None for applying this additive migration as written (static review).

### Medium
- ~~No explicit REVOKE from anon/authenticated~~ → **Addressed** in working-tree migration (`REVOKE … FROM anon, authenticated`).
- `verification_label` still unused by `noteUtr` (harmless).
- Additive `tejas_payments` columns still unused by remote writers (harmless).

### Low
- No DB check that `utr_key` equals normalized `utr_text` (server-enforced).
- Commented DROP rollback remains destructive if registry has data — prefer forward-fix.
- Brief `ALTER TABLE` lock on apply.

---

## 6. Rollback (unchanged)

Forward-fix safer once claims exist. Commented DROP of `tejas_payment_utrs` loses registry data; does not un-confirm already processed payment statuses in other tables.

---

## 7. Final verdict

### **SAFE WITH CONDITIONS**

Conditions:

1. Owner-authorized Production apply only (not via app build).
2. Confirm Production already has `tejas_payments` from the 20261031 registration baseline.
3. Apply the **updated** migration (SHA-256 `91758B3F…`) so explicit anon/authenticated revokes are included.
4. Prefer forward-fix over drop-based rollback after any UTR rows exist.
5. Do not merge/deploy/apply as part of this audit pass.

### Explicit non-actions

- Migration **not** executed on any database.  
- Production **not** contacted or modified.  
- PR #56 **not** merged; no Production deploy.

---

## Appendix — Evidence

| Item | Source |
|---|---|
| Create `tejas_payments` | `supabase/migrations/20261031_tejas_registration.sql` L71–81 |
| Active migration order | Lexical listing of `supabase/migrations/*.sql` |
| REVOKE pattern precedent | `20261118000200_tejas_learning_portal_durable.sql` |
| App claim path | `lib/registration/utr-claim.ts` @ PR head `6fd884f…` |
| New migration hash | SHA-256 of updated SQL file |
