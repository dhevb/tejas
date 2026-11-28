# TEJAS Phase 2.4.1 — Final SQL Safety Review Before Preview Apply

**Reviewed commit SHA:** `c2f6aa8f958c2db866edc3dea7ee92a52af0098c`  
**Branch:** `fix/pr72-phase2-1-utr-recovery-preview-qa`  
**Review mode:** READ-ONLY — migrations **not** executed, **not** modified.  
**Option A RPC changes:** **not** included, **not** run.  
**Target intended by Owner (future apply):** Preview `nbeslngnrsagarosuaab` only.  
**Production `zapccpipwxduzlnvjdmy`:** must not be targeted.

### File hashes at reviewed tip

| Migration | SHA-256 |
|-----------|---------|
| `supabase/migrations/20261118000100_tejas_learning_portal.sql` | `D9A6746E52C035DCBFC0B1F8B5A9D357C8C7F427008687536C377B80BEFB3290` |
| `supabase/migrations/20261118000200_tejas_learning_portal_durable.sql` | `67A15470352809FC26A0DFE79EBE3E9898C8F86083A6569F4785336215C963B3` |

---

## Final verdict

# SAFE FOR PREVIEW APPLY — OWNER FINAL CONFIRMATION REQUIRED

**Meaning:** On an empty learn-schema Preview (confirmed PGRST205 for `tejas_learn_*`), these two files are additive, contain **no** `DROP`/`TRUNCATE`/`DELETE` DDL against existing payment/UTR/Olympiad data, and are ordered so that 001 must precede 002. They are **safe to apply to Preview** after Owner’s explicit confirmation and connection check — **this review does not authorize or perform that apply.**

---

## 1. Full migration inventory

### 1.1 `20261118000100_tejas_learning_portal.sql`

| Statement class | Objects | Impact on apply |
|-----------------|---------|-----------------|
| `CREATE TABLE IF NOT EXISTS` | `tejas_learn_students`, `tejas_learn_audit`, `tejas_learn_books`, `tejas_learn_book_classes`, `tejas_learn_tests`, `tejas_learn_questions`, `tejas_learn_options`, `tejas_learn_entitlements`, `tejas_learn_attempts` | Creates empty tables in `public` (unqualified names → default `public`) |
| Primary keys | Each table | Structural only |
| Foreign keys | `audit.student_id` → students; `book_classes.book_id` → books; `tests.book_id` → books; `questions.test_id` → tests; `options.question_id` → questions; `entitlements.student_id` → students; `entitlements.book_id` → books; `attempts.student_id` → students; `attempts.test_id` → tests | No row writes |
| Unique / checks | email unique; stream/class checks; status enums; mock fee = 0 on books | No row writes |
| `ALTER TABLE … ENABLE ROW LEVEL SECURITY` | All 9 tables above | No policies created |
| `DROP` / `TRUNCATE` / `DELETE` / `UPDATE` (DDL path) | **None** | — |
| Storage / HTTP / project refs | **None** | — |
| Functions | **None** | — |
| Seed `INSERT` | **None** | — |

### 1.2 `20261118000200_tejas_learning_portal_durable.sql`

| Statement class | Objects | Impact on apply |
|-----------------|---------|-----------------|
| `ALTER TABLE … ADD COLUMN IF NOT EXISTS` | students: `password_salt`, `session_version NOT NULL DEFAULT 1`; entitlements: `transaction_reference`, `reported_at`, `verified_at`, `verified_by`, `note`; attempts: `book_id`, `expires_at` | Additive columns; default fills `session_version` if rows existed |
| `CREATE TABLE IF NOT EXISTS` | `tejas_learn_publication`, `tejas_learn_staff`, `tejas_staff_sessions` | No wipe of existing `tejas_staff_sessions` |
| Indexes | student idxs; unique active entitlement; unique open attempt; unique payment reference | Fail only if conflicting duplicate data exists (none on empty learn tables) |
| Conditional check | `tejas_learn_entitlements_fee_49` | Adds only if missing |
| `CREATE OR REPLACE FUNCTION` + `SECURITY DEFINER` + `search_path = pg_catalog` | `tejas_staff_bump_session`, `tejas_learn_rotate_session`, `tejas_learn_register_student`, `tejas_learn_correct_registration`, `tejas_learn_report_payment`, `tejas_learn_review_payment`, `tejas_learn_set_publication` | Replaces function **definitions** only; does not run business UPDATEs until later RPC calls |
| `REVOKE ALL … FROM public, anon, authenticated` / `GRANT EXECUTE … TO service_role` | All seven functions | Hardens EXECUTE |
| Seed `INSERT … ON CONFLICT DO NOTHING` | FT books (2), book_classes (5), tests (10) — all `awaiting_approval` | Additive metadata only |
| `ENABLE ROW LEVEL SECURITY` | publication, staff, staff_sessions | No policies |
| `DROP` / `TRUNCATE` / table `DELETE` | **None** in migration script | — |
| Storage / Production project IDs / external HTTP | **None** | — |

**Important distinction:** Function **bodies** contain `INSERT`/`UPDATE` (register, report, review, correct, set_publication, bump_session). Those statements run only when the RPC is **invoked by the app**, not when the migration file is applied.

---

## 2. Risk analysis by migration

### Migration 001 — Risk: **Low** (Preview empty learn schema)

- Idempotent table create (`IF NOT EXISTS`).
- Does not touch `tejas_payment_utrs`, Olympiad tables, or staff sessions.
- Rerun: safe if tables already exist with compatible shape; does **not** alter existing column definitions if a divergent table already existed under the same name (IF NOT EXISTS skips entirely) — **not an issue on current Preview** where tables are absent (PGRST205).

### Migration 002 — Risk: **Low–Moderate** (managed caveats)

| Risk | Severity | Mitigation / note |
|------|----------|-------------------|
| Must run after 001 | High if order wrong | `ALTER` on missing students/entitlements/attempts **fails** |
| `CREATE OR REPLACE` of `tejas_staff_bump_session` | Moderate | Replaces existing Preview function body with repo version; does not delete session rows |
| Unique indexes on empty tables | Low | No conflicting rows |
| Fee check constraint | Low on empty entitlements | Would reject non-compliant rows if any existed |
| FT seed inserts | Low | `ON CONFLICT DO NOTHING`; publication stays `awaiting_approval` |
| Eng/Math books not seeded | Functional gap, not data-destruction | Remote register/pay for Eng/Math need DB book rows later — separate Owner task |
| Attempts.`book_id` has no FK | Low | Intentional flexibility; not destructive |

---

## 3. Existing-object collision analysis (Preview)

From Phase 2.4 read-only REST probe (not re-executed as mutation; findings remain authoritative):

| Existing Preview object | Collision with 001/002 apply |
|-------------------------|------------------------------|
| `tejas_payment_utrs` | **None** — not referenced |
| `tejas_staff_sessions` | `CREATE TABLE IF NOT EXISTS` → **kept**; RLS enabled if not already |
| `tejas_staff_bump_session` | **Replaced** by `CREATE OR REPLACE` + revoke/grant | Session **rows** preserved |
| `tejas_learn_*` tables | **Created** (currently missing) |
| Payment / UTR / Olympiad rows | **Not modified** by DDL |
| Student / entitlement learn rows | **None exist** today |

---

## 4. RLS and access-control findings

| Finding | Assessment |
|---------|------------|
| RLS enabled on all learn + staff/publication tables | Correct for service-role app pattern |
| **Zero** `CREATE POLICY` statements | `anon`/`authenticated` cannot read/write via RLS; app uses service_role |
| RPC EXECUTE revoked from `public`, `anon`, `authenticated`; granted to `service_role` | Required on Supabase (default privileges otherwise leak EXECUTE) |
| Security definer + `search_path = pg_catalog` + `public.*` qualification | Aligns with prior portal security review intent; no dynamic SQL |
| Storage buckets | **Not created or altered**; private PDF delivery remains application-layer |

No migration statement makes Storage public or opens permanent public PDF URLs.

---

## 5. Execution order and preconditions

1. Owner confirms SQL client is connected to **`nbeslngnrsagarosuaab`** only (not Production).  
2. Preview backup / snapshot available.  
3. Run **001** to completion (`BEGIN`…`COMMIT` in file).  
4. Run **002** to completion.  
5. Verify: `GET /rest/v1/tejas_learn_students?select=id&limit=1` → HTTP 200 (not PGRST205).  
6. Verify: `tejas_payment_utrs` still selectable.  
7. **Do not** apply Option A predicate change in the same window unless separately approved.  
8. **Do not** publish books; FT seeds remain `awaiting_approval`.

---

## 6. Exact SQL proposed for Preview execution — **NOT EXECUTED**

Operator should execute the **unmodified repository files** in order:

```text
-- NOT EXECUTED BY THIS REVIEW
-- 1) Entire contents of:
supabase/migrations/20261118000100_tejas_learning_portal.sql

-- 2) Entire contents of:
supabase/migrations/20261118000200_tejas_learning_portal_durable.sql
```

No rewritten / patched SQL is proposed in this review. No Option A edits.

---

## 7. Rollback SQL and limitations — **NOT EXECUTED**

```sql
-- PREVIEW ONLY after Owner approval. DESTRUCTIVE to post-apply learn data.
-- Does NOT drop tejas_payment_utrs.
-- NOT EXECUTED by this review.

drop function if exists public.tejas_learn_set_publication(text, text, text, text, text);
drop function if exists public.tejas_learn_review_payment(uuid, text, text, text, text);
drop function if exists public.tejas_learn_report_payment(uuid, text, text, integer);
drop function if exists public.tejas_learn_correct_registration(uuid, text, integer, text, integer, integer, text, text);
drop function if exists public.tejas_learn_register_student(text, text, text, text, text, text, text, text, integer, text, integer, integer);
drop function if exists public.tejas_learn_rotate_session(uuid);
-- Optional (coordinate first): drop function if exists public.tejas_staff_bump_session(text);

drop table if exists public.tejas_learn_options cascade;
drop table if exists public.tejas_learn_questions cascade;
drop table if exists public.tejas_learn_tests cascade;
drop table if exists public.tejas_learn_book_classes cascade;
drop table if exists public.tejas_learn_attempts cascade;
drop table if exists public.tejas_learn_entitlements cascade;
drop table if exists public.tejas_learn_publication cascade;
drop table if exists public.tejas_learn_staff cascade;
drop table if exists public.tejas_learn_audit cascade;
drop table if exists public.tejas_learn_books cascade;
drop table if exists public.tejas_learn_students cascade;
-- Optional: drop table if exists public.tejas_staff_sessions cascade;
```

**Limitations:** destroys any learn students/entitlements/attempts/books created after apply; optional drop of `tejas_staff_sessions` / `bump_session` may disrupt Preview staff login versioning; cannot restore a pre-replace custom function body without backup.

---

## 8. Irreversible or potentially destructive statements

### In the two migration files (apply path)

| Statement | Destructive to existing Preview payment/UTR/Olympiad data? |
|-----------|------------------------------------------------------------|
| All `CREATE TABLE IF NOT EXISTS` | **No** |
| All `ADD COLUMN IF NOT EXISTS` | **No** (additive) |
| All `CREATE INDEX IF NOT EXISTS` | **No** on empty learn tables |
| `CREATE OR REPLACE FUNCTION` | **No** row delete; **yes** function-definition replace for `tejas_staff_bump_session` |
| Seed `INSERT … ON CONFLICT DO NOTHING` | **No** overwrite |
| `ENABLE ROW LEVEL SECURITY` | **No** data wipe |
| `DROP` / `TRUNCATE` / bulk `DELETE` | **Absent** |

### Not in migrations but irreversible if Owner later runs rollback

- `DROP TABLE` / `DROP FUNCTION` rollback (Section 7) — **destructive** to learn objects created after apply.

### RPC bodies after apply (runtime, not migration)

- `tejas_learn_correct_registration` can supersede entitlements when **called**.  
- Payment report/review UPDATEs when **called**.  
These are application features, not migration-time mutations.

---

## 9. Rerun safety

| File | Rerun on same Preview after successful apply |
|------|-----------------------------------------------|
| 001 | Generally safe: `IF NOT EXISTS` skips existing tables |
| 002 | Generally safe: IF NOT EXISTS columns/tables/indexes; conditional fee constraint; OR REPLACE functions; seed ON CONFLICT DO NOTHING |

Rerun does **not** repair a hand-edited divergent table shape (IF NOT EXISTS will skip).

---

## 10. Production / side-effect check

| Check | Result |
|-------|--------|
| Production project ref in SQL | **Absent** |
| External HTTP / webhooks | **Absent** |
| Storage bucket create/public | **Absent** |
| Olympiad table DML/DDL | **Absent** (header claims; no contradictory statements found) |
| Option A stream-predicate change | **Absent** from these files |

---

## 11. Effect on existing payment, UTR, student, entitlement data

| Data class | Effect of applying 001+002 on current Preview |
|------------|-----------------------------------------------|
| `tejas_payment_utrs` | **Unchanged** |
| Olympiad payments/registrations | **Unchanged** by these scripts |
| Learn students / entitlements | **Created empty** (no prior rows to invalidate) |
| Existing staff session rows | **Preserved**; bump function definition refreshed |

---

## 12. Final recommendation

1. **Approve Preview-only apply** of the two unmodified files in order, after backup and host confirmation.  
2. Treat Eng/Math DB book/test seed and Option A RPC patch as **separate** Owner approvals.  
3. Expect FT metadata rows only, all `awaiting_approval` — no publication side effect.  
4. After apply, re-run read-only PGRST probe and unit/integration gates before further Preview QA.

**This inspection did not execute SQL, apply migrations, mutate Preview/Production, merge, deploy, or expose secrets.**

---

**SAFE FOR PREVIEW APPLY — OWNER FINAL CONFIRMATION REQUIRED**
