# TEJAS — Open Attempt Atomicity Migration Proposal (Read-Only Precheck)

**Date:** 24 November 2026 (IST)  
**Related:** PR #62 (QA-account-only retakes) — https://github.com/dhevb/tejas/pull/62  
**Docs PR:** https://github.com/dhevb/tejas/pull/63 (open; do not merge from this task)  
**Mode:** READ-ONLY investigation + proposal files only  
**This task:** No SQL mutations, no migration apply, no config changes, no attempt creates  

**Context note:** PR #62 was later owner-merged to `main` (`2fdeca0`) outside this docs task. This proposal still does **not** apply schema changes. Production index state was re-verified read-only after that merge.

### Executive recommendation

**Safest minimal solution:** Keep (or idempotently ensure) the existing partial unique index:

`UNIQUE (student_id, test_id) WHERE status = 'open'`  
Index name: `tejas_learn_attempts_one_open`

**Live Production finding (re-verified 2026-11-24):** This index is **already present**. Duplicate open groups: **0**.  
Therefore Production does **not** need a new structural migration for atomicity unless an environment is missing the index. Prefer the idempotent ENSURE script only where needed.

A separate transactional RPC is **not** required for insert atomicity when this index exists. App-side `23505` → canonical-open reuse (shipped with PR #62) complements the index; it is not a substitute for it.

---

## 1. Schema findings

### 1.1 Base table (`20261118000100_tejas_learning_portal.sql`)

`public.tejas_learn_attempts`:

| Column | Notes |
|--------|--------|
| `id` | uuid PK |
| `student_id` | uuid → `tejas_learn_students` |
| `test_id` | text → `tejas_learn_tests` |
| `status` | `open` \| `submitted` \| `expired` |
| `score`, `max_score`, `answers`, `started_at`, `submitted_at` | scoring / lifecycle |

RLS enabled; no policies in migration 1 (service role bypasses RLS).

### 1.2 Durable additions (`20261118000200_tejas_learning_portal_durable.sql`)

Already defines (among other portal durable objects):

```sql
create unique index if not exists tejas_learn_attempts_one_open
  on public.tejas_learn_attempts (student_id, test_id)
  where status = 'open';
```

Also adds `book_id`, `expires_at`, and `tejas_learn_attempts_student_idx`.

**No attempt-start RPC** exists in current migrations — starts use PostgREST `INSERT` from the app (`remoteStartAttempt`).

### 1.3 Live Production indexes (read-only re-verify, 2026-11-24)

| Index | Definition (summary) |
|-------|----------------------|
| `tejas_learn_attempts_one_open` | **PRESENT** — `CREATE UNIQUE INDEX … ON public.tejas_learn_attempts USING btree (student_id, test_id) WHERE (status = 'open'::text)` |
| `tejas_learn_attempts_pkey` | UNIQUE (`id`) |
| `tejas_learn_attempts_student_idx` | btree (`student_id`) |

Partial unique indexes are supported and compatible with this Supabase Postgres project (index already live).  
**Attempt-like RPCs in `public`:** **0** (no `start_attempt` / attempt RPC found).

### 1.4 Live columns confirmed

Includes `book_id` (nullable text), `expires_at` (nullable timestamptz), plus base columns.

---

## 2. Duplicate audit results (read-only, no PII)

Re-run aggregates via Supabase SQL Editor (`SELECT` only). No student identifiers returned.

| Metric | Value |
|--------|------:|
| Attempts total | 93 |
| Status `submitted` | 84 |
| Status `open` | 9 |
| Status `expired` | 0 |
| Open with `expires_at` null | 0 |
| Open still within timer (`expires_at > now()`) | 0 |
| Open timer-elapsed (`expires_at <= now()`, status still `open`) | 9 |
| Distinct open `test_id` values | 9 |
| Distinct students with any open row | 2 |
| **Duplicate open groups** (`count > 1` per student/test) | **0** |
| **Excess open rows** | **0** |

Interpretation:

- Database already prevents a second `status = 'open'` row for the same student/test.
- Nine “open” rows are **timer-elapsed** but not yet marked `expired` (app marks expired on late submit / retake path). That is a **status hygiene** issue, not a duplicate-open violation.
- Cleaning those nine rows to `expired` would be a **data mutation** and requires **separate owner approval** (not part of this precheck; not executed).

---

## 3. Concurrent INSERT / transaction guarantees

| Mechanism | Guarantee |
|-----------|-----------|
| Partial unique index | Concurrent second `INSERT … status='open'` for same `(student_id, test_id)` fails with unique violation (`23505`) |
| App GET-then-INSERT alone | Racey without the index |
| PR #62 app reconcile | Best-effort heal after insert; fails closed on bad expire PATCH |
| File store `withLock` | Serializes local tests only |

With the live index, **atomic exclusion of a second open row is already enforced by Postgres**.

App conflict handling (now on `main` via PR #62): on insert `23505`, re-SELECT and return the canonical time-valid open attempt (or fail closed). That UX path depends on the index remaining in place.

---

## 4. Option comparison

### A. Partial unique index (recommended)

| Aspect | Assessment |
|--------|------------|
| Minimal? | Yes — already in durable migration; ENSURE is `IF NOT EXISTS` |
| Affects submitted/expired? | No (partial predicate) |
| Concurrent safety | Strong (DB unique constraint) |
| Production today | **Already applied** |
| Rollback | Dangerous if dropped (see rollback file) |

### B. Transactional RPC `start_attempt`

| Aspect | Assessment |
|--------|------------|
| Minimal? | No — new SECURITY DEFINER function, grants, app wiring |
| Value add with index present | Mostly UX / centralizing expire+insert |
| Risks | Broader privilege surface; must match REVOKE/GRANT style of durable migration |
| Recommendation | **Not required** for atomicity; optional later enhancement |

**Chosen:** Option A (ensure index). Do not introduce RPC unless owner wants centralized start semantics later.

---

## 5. Exact proposed migration / rollback files

| File | Role |
|------|------|
| `preview-sql/20261124_tejas_learn_attempts_one_open_ENSURE.sql` | Idempotent `CREATE UNIQUE INDEX IF NOT EXISTS …` |
| `preview-sql/20261124_tejas_learn_attempts_one_open_ROLLBACK.sql` | `DROP INDEX IF EXISTS` (not recommended on Production) |

These live under `preview-sql/` as **reviewed proposals**, not auto-applied Supabase migration history entries.

---

## 6. Deployment sequence (if an environment lacks the index)

1. Owner backup / confirm restore path.  
2. Read-only precheck on that environment (duplicate open groups must be **0**).  
   - If duplicates exist: **stop** — owner-approved cleanup plan required before index create.  
3. Apply ENSURE SQL in a single transaction.  
4. Verify `pg_indexes` shows `tejas_learn_attempts_one_open`.  
5. Deploy app that handles `23505` gracefully (PR #62 + optional conflict reuse).  
6. Do **not** enable `TEJAS_PORTAL_RETAKES` globally.

**Production (this project):** Steps 3–4 are already satisfied for the index. App `23505` reuse shipped with merged PR #62. Remaining optional owner work: timer-elapsed open hygiene (nine rows) under a **separate** mutation approval.

### Locking notes

- `CREATE UNIQUE INDEX` (non-`CONCURRENTLY`) takes a stronger lock; table is small (~93 rows) so brief lock is acceptable if ever re-run.  
- Prefer `IF NOT EXISTS` so re-apply is a no-op.  
- `CREATE INDEX CONCURRENTLY` cannot run inside a transaction block — not used in the ENSURE script.

### Conflict handling (app)

| Event | Expected |
|-------|----------|
| Second open insert | `23505` |
| Desired app behaviour | Re-fetch open row; return that attempt id |
| Submitted / expired inserts | Unconstrained by this partial index |

### Rollback limitations

- Dropping the index restores the TOCTOU race for duplicate opens.  
- Rollback does not restore data; it only removes the constraint.  
- If ENSURE was a no-op (index already from durable migration), rollback still removes Production protection — **avoid**.

---

## 7. Risks and owner approval requirements

| Item | Approval needed? |
|------|------------------|
| Apply ENSURE on Production when index already present | Optional no-op; low value |
| Drop index (rollback) on Production | **Strongly discourage** |
| Mutate 9 timer-elapsed `open` → `expired` | **Yes — separate** data mutation approval |
| Merge / deploy PR #62 | Owner already merged/deployed separately; **out of scope for this docs task** |
| New start-attempt RPC | **Yes — separate** (not recommended now) |
| Merge docs PR #63 | Owner review only; do not treat as a schema apply |

---

## 8. Automated tests and verification plan

### Already covered in PR #62 (app)

- Concurrent file-store starts → one open id  
- Fail-closed expire PATCH interpretation  
- QA vs ordinary retake behaviour  

### Recommended after any ENSURE apply / on CI against a disposable DB

```sql
-- Expect true
select exists (
  select 1 from pg_indexes
  where schemaname = 'public' and indexname = 'tejas_learn_attempts_one_open'
);

-- Expect 0
select count(*) from (
  select 1 from public.tejas_learn_attempts
  where status = 'open'
  group by student_id, test_id
  having count(*) > 1
) d;
```

Optional integration test (non-Production): attempt two concurrent opens for same student/test; assert second insert fails or app returns the first open id.

---

## 9. Production unchanged (this task)

| Action | Status |
|--------|--------|
| SQL mutations | **Not executed** |
| Migration apply | **Not executed** |
| Index drop | **Not executed** |
| Attempt row updates/deletes | **Not executed** |
| Env / Auth / RLS / Storage / payment changes | **None** |
| Create Production attempts | **None** |

Only read-only `SELECT`s were run for the audit above. **Production schema and attempt rows remain unchanged by this documentation task.**
