# TEJAS Phase 2.4 — Preview Learn-Schema Read-Only Inspection

**Scope:** READ-ONLY. No SQL executed. No schema/data mutation. No Production access. No merge. No publication.  
**Branch:** `fix/pr72-phase2-1-utr-recovery-preview-qa`  
**HEAD at inspection:** `822970440840556ce77a817badcd3f01d32a651e`  
**Evidence (gitignored):** `.local-qa/phase24-learn-schema-inspection.json`

---

## Final verdict

# READY FOR OWNER SQL REVIEW

Meaning: the repository migrations are additive and Preview is missing the learn-portal objects that cause PGRST205. Applying **Preview-only** `20261118000100` then `20261118000200` is the correct next Owner decision — **this phase does not apply them**.

Caveats that Owner must accept before any apply are listed in §7–§9 (especially existing `tejas_staff_sessions` / `tejas_staff_bump_session`, and FT-only book seed gap).

---

## 1. Confirmed Preview project identity

| Check | Result | Evidence |
|-------|--------|----------|
| Target host | `nbeslngnrsagarosuaab.supabase.co` | Local ignored `.env.preview` URL hostname (value not printed) |
| Preview ref | **`nbeslngnrsagarosuaab`** | Hostname prefix match |
| Production ref | **`zapccpipwxduzlnvjdmy`** | Hard-denied in probe; not contacted |
| Probe methods | **GET only** | No RPC POST, no INSERT/UPDATE/DELETE |
| Mutations | **None** | Confirmed in probe script |

---

## 2. Existing versus missing schema objects (Preview REST / OpenAPI)

### 2.1 Tables required by learning portal

| Object | Repo source | Preview REST | Notes |
|--------|-------------|--------------|-------|
| `tejas_learn_students` | `20261118000100` | **MISSING** PGRST205 | Causes prior integration BLOCKED |
| `tejas_learn_audit` | `20261118000100` | **MISSING** PGRST205 | |
| `tejas_learn_books` | `20261118000100` | **MISSING** PGRST205 | |
| `tejas_learn_book_classes` | `20261118000100` | **MISSING** PGRST205 | |
| `tejas_learn_tests` | `20261118000100` | **MISSING** PGRST205 | |
| `tejas_learn_questions` | `20261118000100` | **MISSING** PGRST205 | |
| `tejas_learn_options` | `20261118000100` | **MISSING** PGRST205 | |
| `tejas_learn_entitlements` | `20261118000100` | **MISSING** PGRST205 | |
| `tejas_learn_attempts` | `20261118000100` | **MISSING** PGRST205 | |
| `tejas_learn_publication` | `20261118000200` | **MISSING** PGRST205 | |
| `tejas_learn_staff` | `20261118000200` | **MISSING** PGRST205 | |
| `tejas_staff_sessions` | `20261118000200` | **PRESENT** HTTP 200 | Partial Preview state |
| `tejas_payment_utrs` (related) | `20261123_…` | **PRESENT** HTTP 200 | Not a learn table; keep intact |

**PGRST205 message (students):** `Could not find the table 'public.tejas_learn_students' in the schema cache`  
This matches “table missing / not in API schema,” not RLS hiding rows (empty select would be 200 + `[]`).

### 2.2 Functions / RPCs (OpenAPI presence only — **not invoked**)

| Function | Preview OpenAPI | Notes |
|----------|-----------------|-------|
| `tejas_staff_bump_session` | **PRESENT** | Coexists with `tejas_staff_sessions` |
| `tejas_learn_rotate_session` | **MISSING** | |
| `tejas_learn_register_student` | **MISSING** | |
| `tejas_learn_correct_registration` | **MISSING** | |
| `tejas_learn_report_payment` | **MISSING** | |
| `tejas_learn_review_payment` | **MISSING** | |
| `tejas_learn_set_publication` | **MISSING** | |

### 2.3 Indexes / constraints / triggers / RLS policies (repo expectation)

| Kind | In migrations? | Preview verification |
|------|----------------|----------------------|
| Indexes (`tejas_learn_*_idx`, unique active/open/reference) | Defined in `20261118000200` | **Cannot verify** without SQL catalog access; objects absent ⇒ indexes absent |
| Constraint `tejas_learn_entitlements_fee_49` | Conditional add in `20261118000200` | N/A until table exists |
| Triggers | **None** in learn migrations | N/A |
| `CREATE POLICY` | **None** in learn migrations | RLS enabled with **zero policies** (deny anon/authenticated by default; service_role used by app) |

---

## 3. Exact migration files and relevant SQL sections

### 3.1 Order (mandatory)

1. **`supabase/migrations/20261118000100_tejas_learning_portal.sql`**  
   - Creates base `tejas_learn_*` tables (students, audit, books, book_classes, tests, questions, options, entitlements, attempts).  
   - Enables RLS on those tables.  
   - **No** seed data. **No** functions. **No** policies.  
   - Header: `NOT APPLIED. Do not run this file against production.`

2. **`supabase/migrations/20261118000200_tejas_learning_portal_durable.sql`**  
   - **Depends on** base tables from (1) for `ALTER TABLE … ADD COLUMN`.  
   - Adds durable columns, publication/staff/session tables, indexes, fee check, security-definer RPCs + revoke/grant service_role.  
   - Seeds **only** Future Tech books/tests/classes (`ON CONFLICT DO NOTHING`).  
   - Enables RLS on publication/staff/sessions.  
   - Header: `NOT APPLIED TO PRODUCTION` / apply only after backup + Owner approval.

### 3.2 Related (already on Preview — do not re-break)

- `supabase/migrations/20261123_payment_utr_registry_and_ocr.sql` → `tejas_payment_utrs` (**present**).

### 3.3 Option A note (out of scope for this apply)

Phase 2.3 designed removing `books.stream_id = students.stream_id` from report/review RPCs. **That change is not part of these two files** and must not be slipped into a first Preview schema apply without separate Owner SQL approval.

---

## 4. Dependency and execution order

```
[existing Preview]
  tejas_payment_utrs          ✓ keep
  tejas_staff_sessions        ✓ keep (IF NOT EXISTS on re-apply)
  tejas_staff_bump_session    ✓ will be CREATE OR REPLACE if 002 runs

[Owner-approved Preview apply — NOT DONE HERE]
  1) 20261118000100_tejas_learning_portal.sql
       → creates empty learn tables + RLS enable
  2) 20261118000200_tejas_learning_portal_durable.sql
       → alters columns, extra tables, indexes, RPCs, FT seed rows
  3) PostgREST schema reload / wait for cache
  4) Re-probe GET tejas_learn_students?select=id&limit=1 → expect 200
```

**Do not** run `002` before `001`: `ALTER TABLE public.tejas_learn_students …` will fail if the table does not exist.

---

## 5. Existing-data compatibility assessment

| Existing Preview asset | Impact of applying 001+002 as written |
|------------------------|----------------------------------------|
| Olympiad / registration tables (if any) | Migrations claim no Olympiad alter; **not re-verified** via SQL catalog in this read-only REST probe |
| `tejas_payment_utrs` rows | **Untouched** by learn migrations |
| `tejas_staff_sessions` | `CREATE TABLE IF NOT EXISTS` — **no wipe** |
| `tejas_staff_bump_session` | `CREATE OR REPLACE` — body replaced with repo version (should match intent; **verify after apply**) |
| Learn student/payment rows | **None exist** (tables missing) — no overwrite risk |
| FT book/test seed inserts | `ON CONFLICT DO NOTHING` — additive |
| English/Math DB book rows | **Not seeded** by these files — see §7 |

**Assessment:** For a Preview project missing all `tejas_learn_*` tables, applying the two additive migrations is **compatible with preserving existing UTR registry and staff session table data**. It does **not** overwrite those rows.

---

## 6. RLS, grants and access-control assessment

| Control | Design in migrations | Implication |
|---------|----------------------|-------------|
| RLS enable on learn tables | Yes | With **no policies**, `anon`/`authenticated` cannot read/write via RLS |
| Table GRANTs on learn tables | Not explicitly granted to anon/authenticated in these files | App uses **service_role** REST/RPC |
| RPC EXECUTE | `REVOKE … FROM public, anon, authenticated` then `GRANT … TO service_role` | Correct for current portal architecture |
| Public Storage | Not touched | Unchanged |

Residual risk: Supabase default privileges historically granted EXECUTE to anon/authenticated; migration explicitly revokes those — **must remain** after apply.

---

## 7. Risks and unresolved questions

1. **Partial Preview state:** `tejas_staff_sessions` + `tejas_staff_bump_session` exist without learn tables — origin UNVERIFIED (manual apply vs truncated run).  
2. **English/Math book catalog in DB:** durable SQL seeds only FT Book 1/2. App reading uses `content/portal/catalog.json`, but `tejas_learn_register_student` / payment RPCs validate against **`tejas_learn_books` + book_classes**. Without Eng/Math rows, remote registration/payment for those streams will fail even after schema apply.  
   - **Follow-up Owner task:** approved Eng/Math (+ full test metadata) seed, or confirm app path that inserts entitlement rows without DB book rows (current RPC requires book match when `p_book_id` set).  
3. **Questions/options tables:** created empty; mock content served from catalog files — OK for schema, but DB test identity rows beyond FT may still be needed for some paths.  
4. **No SQL-level catalog proof** of non-learn tables (REST cannot list all `pg_catalog` objects). Olympiad collision risk rated **low** by migration comments, not re-proven live.  
5. **Option A RPC patch** remains a **separate** Owner approval after base schema exists.  
6. **PostgREST cache** may lag briefly after create — probe before declaring PASS.

---

## 8. Exact proposed SQL execution plan (REPORT ONLY — DO NOT EXECUTE)

**Prerequisite Owner approvals (separate messages):**

1. “Authorize Preview-only apply of `20261118000100` then `20261118000200` on project `nbeslngnrsagarosuaab`.”  
2. Confirm Production `zapccpipwxduzlnvjdmy` is **not** in the SQL client connection.  
3. Take/confirm Preview backup or snapshot before apply.

**Proposed steps (human/operator — not this agent):**

1. Connect SQL editor **only** to Preview `nbeslngnrsagarosuaab`.  
2. Run entire file `20261118000100_tejas_learning_portal.sql` inside a transaction; commit on success.  
3. Run entire file `20261118000200_tejas_learning_portal_durable.sql` inside a transaction; commit on success.  
4. Confirm objects:  
   - `select to_regclass('public.tejas_learn_students');` → non-null  
   - OpenAPI / REST GET `tejas_learn_students?select=id&limit=1` → 200  
5. Confirm `tejas_payment_utrs` still selectable.  
6. Confirm RPCs listed in §2.2 appear for service_role.  
7. **Stop.** Do not apply Option A predicate change unless separately approved.  
8. **Stop.** Do not seed Eng/Math books unless separately approved.  
9. **Stop.** Do not publish books / change Storage.

---

## 9. Rollback SQL and limitations (REPORT ONLY — DO NOT EXECUTE)

Illustrative rollback (destructive to any learn data created after apply):

```sql
-- PREVIEW ONLY after Owner approval. DESTROYS learn portal objects.
-- Does NOT drop tejas_payment_utrs.
-- May drop tejas_staff_sessions if Owner explicitly wants full undo of 002.

drop function if exists public.tejas_learn_set_publication(text, text, text, text, text);
drop function if exists public.tejas_learn_review_payment(uuid, text, text, text, text);
drop function if exists public.tejas_learn_report_payment(uuid, text, text, integer);
drop function if exists public.tejas_learn_correct_registration(uuid, text, integer, text, integer, integer, text, text);
drop function if exists public.tejas_learn_register_student(text, text, text, text, text, text, text, text, integer, text, integer, integer);
drop function if exists public.tejas_learn_rotate_session(uuid);
-- Optional: drop function if exists public.tejas_staff_bump_session(text);

drop table if exists public.tejas_learn_options;
drop table if exists public.tejas_learn_questions;
drop table if exists public.tejas_learn_tests;
drop table if exists public.tejas_learn_book_classes;
drop table if exists public.tejas_learn_attempts;
drop table if exists public.tejas_learn_entitlements;
drop table if exists public.tejas_learn_publication;
drop table if exists public.tejas_learn_staff;
drop table if exists public.tejas_learn_audit;
drop table if exists public.tejas_learn_books;
drop table if exists public.tejas_learn_students;
-- Optional: drop table if exists public.tejas_staff_sessions;
```

**Limitations:**

- Rollback **deletes** any students/entitlements/attempts created after apply.  
- Dropping `tejas_staff_sessions` / replacing `tejas_staff_bump_session` may affect Preview staff console sessions — coordinate before optional drops.  
- Does not restore a prior custom function body if Preview had a divergent `tejas_staff_bump_session`.  
- Does not undo unrelated Olympiad data (none expected to be touched).

---

## 10. Explicit confirmation — actions NOT performed

| Action | Performed? |
|--------|------------|
| Execute SQL / migrations | **No** |
| Create/alter/drop tables, functions, policies, indexes | **No** |
| Modify registrations, payments, UTRs, students, entitlements | **No** |
| Publish books / change PDF access | **No** |
| Change env vars or credentials | **No** |
| Merge PRs | **No** |
| Deploy Production | **No** |
| Enable public Storage | **No** |
| Print secrets | **No** |
| Contact Production Supabase `zapccpipwxduzlnvjdmy` | **No** |

---

## Test / probe evidence summary

| Check | Result |
|-------|--------|
| Preview host allowlist | **PASS** (`nbeslngnrsagarosuaab`) |
| Production hard-deny | **PASS** (not targeted) |
| Learn tables present | **FAIL / MISSING** (11/12; only `tejas_staff_sessions` present among required set) |
| Learn RPCs present | **FAIL / MISSING** (6/7 missing; bump_session present) |
| PGRST205 reproduced | **PASS** (diagnosis confirmed) |
| Mutations | **NONE** |
| Schema apply | **NOT RUN** |

---

## Owner next permission (if proceeding)

> Authorize Preview-only execution of `supabase/migrations/20261118000100_tejas_learning_portal.sql` followed by `supabase/migrations/20261118000200_tejas_learning_portal_durable.sql` on Supabase project **`nbeslngnrsagarosuaab`**, after backup, with Production excluded. Do **not** include Option A RPC predicate change or Eng/Math catalog seed unless separately approved.

**READY FOR OWNER SQL REVIEW**
