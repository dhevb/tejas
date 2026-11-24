# TEJAS — PR #63 Final Read-Only Review

**Date:** 2026-11-24 (IST)  
**PR:** https://github.com/dhevb/tejas/pull/63 (`docs/open-attempt-atomicity-migration-proposal`)  
**Reviewed head (before this review commit):** `3de2ef3e3618cc69a6a79a95df253f97d73b54e5`  
**Scope:** Documentation + ENSURE/ROLLBACK SQL files only  

**This review did not:** apply either SQL file · mutate Production · expire the nine open attempts · merge PR #63 · create attempts · change Auth/RLS/Storage/payment/env.

---

## Verdict

### CONDITIONAL PASS → addressed to PASS for file readiness (owner apply still separate)

| Check | Result |
|-------|--------|
| Production index matches `UNIQUE (student_id, test_id) WHERE status = 'open'` | **PASS** |
| ENSURE idempotent create (no drop/replace, no row mods) | **PASS** |
| ENSURE refuses wrong same-named definition | **PASS** after review hardening (was CONDITIONAL on name-only `IF NOT EXISTS`) |
| ROLLBACK impact/risks documented | **PASS** (rollback discouraged) |
| Nine timer-elapsed opens untouched by this work | **PASS** |
| No Production SQL mutation / apply / RPC / attempt-start in this review | **PASS** |

**Owner apply of ENSURE/ROLLBACK remains a separate decision.** This review does not authorize Production apply. Prefer leaving the live index as-is (ENSURE would be a verified no-op create + assert).

---

## 1. Production index definition (read-only evidence)

Executed `SELECT`-only against Production via Supabase SQL Editor:

| Field | Value |
|-------|--------|
| `indexname` | `tejas_learn_attempts_one_open` |
| `indexdef` | `CREATE UNIQUE INDEX tejas_learn_attempts_one_open ON public.tejas_learn_attempts USING btree (student_id, test_id) WHERE (status = 'open'::text)` |
| `exact_indexdef_match` vs canonical string | **true** |
| `open_total` | 9 |
| `open_timer_elapsed` | 9 |
| `duplicate_open_groups` | 0 |

Canonical semantic match confirmed:

`UNIQUE (student_id, test_id) WHERE status = 'open'`

(Postgres catalogs cast the predicate as `status = 'open'::text`; equivalent.)

---

## 2. ENSURE SQL review

File: `preview-sql/20261124_tejas_learn_attempts_one_open_ENSURE.sql`

### Before hardening (head `3de2ef3`)

| Property | Assessment |
|----------|------------|
| Safe to re-apply when correct index exists | Yes — `CREATE UNIQUE INDEX IF NOT EXISTS` is a no-op |
| Does not drop/replace existing index | Yes |
| Does not modify rows | Yes — DDL index create only |
| Silently accept incorrect same-named index | **Gap** — Postgres `IF NOT EXISTS` is **name-only** |

### After review hardening (this commit)

Added a transactional `DO` assert that compares `pg_indexes.indexdef` to the exact Production canonical string and `RAISE EXCEPTION` on mismatch or missing index.

| Property | Assessment |
|----------|------------|
| Safe to re-apply when correct index exists | Yes — create no-op + assert passes |
| Does not drop/replace | Yes |
| Does not modify rows | Yes |
| Silent accept of wrong definition | **No** — assert fails closed |

**Not applied to Production in this review.**

---

## 3. ROLLBACK SQL review

File: `preview-sql/20261124_tejas_learn_attempts_one_open_ROLLBACK.sql`

```sql
drop index if exists public.tejas_learn_attempts_one_open;
```

| Aspect | Impact |
|--------|--------|
| Effect | Removes DB-level one-open enforcement |
| Rows | No attempt row changes |
| Concurrent safety | Restores TOCTOU race; app `23505` reuse alone is not atomic |
| Production | Index came from durable migration `20261118000200`; drop is **not recommended** |
| Idempotency | Safe to re-run (`IF EXISTS`) but harmful if it succeeds once |

**Do not apply on Production** unless owner explicitly accepts loss of atomicity.

---

## 4. Nine timer-elapsed opens

| Evidence | Value |
|----------|------:|
| `open_total` (this review SELECT) | 9 |
| `open_timer_elapsed` | 9 |
| Expire / UPDATE / DELETE executed | **None** |

Proposal and ENSURE comments correctly treat hygiene as a **separate** owner-approved mutation. Untouched.

---

## 5. No Production mutation confirmation (this review)

| Action | Status |
|--------|--------|
| ENSURE apply | **Not executed** |
| ROLLBACK apply | **Not executed** |
| Migration apply | **Not executed** |
| RPC create/call for attempt start | **Not executed** |
| Attempt INSERT/UPDATE/DELETE | **Not executed** |
| Expire nine opens | **Not executed** |
| PR #63 merge | **Not performed** (left open) |
| SQL run | **SELECT-only** index/aggregate verification |

---

## 6. Files reviewed

| Path | Role |
|------|------|
| `TEJAS-OPEN-ATTEMPT-ATOMICITY-MIGRATION-PROPOSAL.md` | Proposal / audit |
| `preview-sql/20261124_tejas_learn_attempts_one_open_ENSURE.sql` | Idempotent ensure + definition assert |
| `preview-sql/20261124_tejas_learn_attempts_one_open_ROLLBACK.sql` | Discouraged drop |
| `TEJAS-PR63-FINAL-READ-ONLY-REVIEW.md` | This report |

---

## 7. Owner guidance

1. Keep PR #63 open for review; merge is documentation-only and optional.  
2. **Do not** apply ROLLBACK on Production.  
3. ENSURE apply is optional/no-op when the live index already matches; if ever applied, rely on the assert.  
4. Separate approval required to expire the nine timer-elapsed opens.  

**Production remains unchanged by this review.**
