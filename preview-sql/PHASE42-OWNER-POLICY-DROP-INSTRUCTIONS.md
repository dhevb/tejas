# Phase 42 — Owner-only policy DROP instructions

**Status:** owner DROP completed and independently verified — see `PHASE42-OWNER-SQL-RESULTS-RECONCILE.md` (`2026-11-23T05:51:14Z`). This file remains the audited instruction packet.

Prepared: `2026-11-23T05:30:32Z` / amended `2026-11-23T11:34:00+05:30`
Production project: **`zapccpipwxduzlnvjdmy`** (`https://zapccpipwxduzlnvjdmy.supabase.co`)

---

## 1. Inspected DROP file (shape audit)

File: `preview-sql/PHASE38-RETIRE-STORAGE-READER-SELECT-POLICY.sql`

| Check | Result |
| --- | --- |
| Exact DROP | `drop policy if exists tejas_storage_backup_objects_select on storage.objects;` |
| CREATE | **Absent** |
| ALTER | **Absent** |
| GRANT / REVOKE | **Absent** |
| Other DROP (table/role/function/…) | **Absent** |
| Transaction wrapper | `begin;` … `commit;` only |
| Unrelated DML/DDL | **Absent** |

Do **not** run `PHASE38-HELD-STORAGE-BACKUP-SELECT-ONLY.sql` (that file is **CREATE POLICY**).

---

## 2. Expected policy identity (live baseline `2026-11-23T05:30:32Z`)

| Field | Expected |
| --- | --- |
| Project | `zapccpipwxduzlnvjdmy` |
| Policy | `tejas_storage_backup_objects_select` |
| Table | `storage.objects` |
| Command | `SELECT` |
| Roles | `{authenticated}` |
| Buckets in USING | `tejas-registration-files`, `tejas-payment-proofs` |
| Auth UUID | `cf49f328-d5d6-4eb4-9aaf-bc0cbefa3355` |
| Peers on `storage.objects` (this probe) | **1** (this policy only) |

CM reader session already retired. Auth reader account: **do not modify**. Archives: preserve.

---

## 3. Dashboard steps (project-owner context)

1. Open Supabase Dashboard → project **`zapccpipwxduzlnvjdmy`** → **SQL Editor**.
2. Confirm the project ref in the URL/UI matches `zapccpipwxduzlnvjdmy` (not the isolated recovery project).
3. **Precheck (read-only):** paste and run all of
   `preview-sql/PHASE42-OWNER-POLICY-DROP-PRECHECK.sql`
   - Query A: expect **1** row matching the table above.
   - Query B: save/screenshot the policy list.
   - Query C: note `rls_enabled` / `rls_forced`.
   - Query D: expect count **1**.
   If identity does not match → **STOP**; do not DROP.
4. **DROP (owner only):** paste and run **only**
   `preview-sql/PHASE38-RETIRE-STORAGE-READER-SELECT-POLICY.sql`
5. **Postcheck (read-only):** paste and run all of
   `preview-sql/PHASE42-OWNER-POLICY-DROP-POSTCHECK.sql`
   - Query A: expect **0** rows.
   - Query B: expect prior peers minus this policy (likely **0** remaining).
   - Query C: RLS flags unchanged vs precheck.
   - Query D: expect count **0**.
   - Query E: both buckets still listed.
6. Tell the agent: **“Phase 42 DROP executed — please post-verify.”**
   Agent will re-query via read-only `tejas_backup_dumper` and update reports. **PASS only if post-verify succeeds.**

---

## 4. Exact DROP SQL (copy from reviewed file)

```sql
begin;

drop policy if exists tejas_storage_backup_objects_select on storage.objects;

commit;
```

---

## 5. Boundaries

- No agent privilege escalation; `tejas_backup_dumper` cannot own `storage.objects`.
- No Auth user ban/delete in this step.
- No archive deletion or hash changes.
- Application durable path uses server keys (bypasses RLS) — this DROP retires backup-reader SELECT only.
