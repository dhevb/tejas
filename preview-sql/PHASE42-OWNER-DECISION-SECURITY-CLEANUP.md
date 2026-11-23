# Phase 42 — Owner decision / execution record: security cleanup

**Decision at readiness review: READY**
**Execution verdict: PASS** — CM retired; owner DROP verified absent; Auth intact

Issued readiness: `2026-11-23T05:12:16Z`
Agent CM Retire: `2026-11-23T05:21:43Z`
Owner DROP + agent post-verify: `2026-11-23T05:51:14Z`
Worktree: `phase3/free-host-local` @ `6da54f6` (no commit / push / deploy)

Evidence: `PHASE42-OWNER-SQL-RESULTS-RECONCILE.md`; `%LOCALAPPDATA%\tejas-app-stack-recovery\evidence\p42-reconcile-*`

---

## Execution summary

| Step | Result | Detail |
| --- | --- | --- |
| 1 Offline retention gate | **PASS** | P37/P38/manifest SHA match; 79 objects; recovery CM 32-byte present; scripts+evidence present; plaintext leftovers 0 |
| 2 Retire Storage-reader CM | **PASS** | `tejas-storage-reader/zapccpipwxduzlnvjdmy` → **absent**; recovery / backup-dumper / app-stack CM **untouched** |
| 3 DROP SELECT policy | **PASS** | Owner ran RETIRE SQL in Dashboard; agent read-only post-verify: policy **ABSENT**; peer diff −1 / +0 |
| 4 Auth reader inspect | **DONE** (no mutate) | UUID present; not banned; not soft-deleted; **not disabled/deleted** |

**Phase 42 PASS claimed** after independent post-verify (`PHASE42-OWNER-SQL-RESULTS-RECONCILE.md`).

---

## Step 1 evidence (gate)

| Check | Result |
| --- | --- |
| P37 SHA | `24db6a21…88f6` match (1,165,573 bytes) |
| P38 SHA | `f34c09db…a17b` match (2,674,213 bytes) |
| Manifest | `7611c089…9a96`; **79** object rows |
| Recovery key CM | present; blob-bytes=32 |
| Restore/runbook scripts | present |
| Plaintext leftovers | **0** |
| P39/P40/P40B/P41 evidence | present |

---

## Step 2 evidence

```
retire|ok
storage-reader-cm-after|absent
Status → storage-reader-cm|absent
cm|recovery|present
cm|backup-dumper|present
cm|app-stack|present
```

---

## Step 3 — SQL file correction + blocker

Owner message named `PHASE38-HELD-STORAGE-BACKUP-SELECT-ONLY.sql`. **Inspection showed that file is CREATE POLICY**, not DROP. It was **not** applied.

DROP source used (matches authorized intent): `PHASE38-RETIRE-STORAGE-READER-SELECT-POLICY.sql`
Body: `drop policy if exists tejas_storage_backup_objects_select on storage.objects;`

### Live identity before DROP attempt (matched)

| Field | Value |
| --- | --- |
| Name | `tejas_storage_backup_objects_select` |
| Cmd | SELECT |
| Roles | `{authenticated}` |
| Buckets | both TEJAS private buckets (true) |
| UUID | `cf49f328-d5d6-4eb4-9aaf-bc0cbefa3355` (true) |
| Peers on `storage.objects` | **1** (this policy only, in `pg_policies` snapshot) |

### DROP attempts

1. Direct DROP as `tejas_backup_dumper` → `cannot execute DROP POLICY in a read-only transaction`
2. Session `set default_transaction_read_only = off` then DROP → **`must be owner of relation objects`**

Executor lacks ownership of `storage.objects`. Dashboard SQL editor (postgres / supabase_admin) is required.

**Owner action to finish Step 3:**

Follow `preview-sql/PHASE42-OWNER-POLICY-DROP-INSTRUCTIONS.md`:

1. Precheck: `PHASE42-OWNER-POLICY-DROP-PRECHECK.sql` (read-only).
2. DROP: `PHASE38-RETIRE-STORAGE-READER-SELECT-POLICY.sql` only (Dashboard project-owner).
3. Postcheck: `PHASE42-OWNER-POLICY-DROP-POSTCHECK.sql` (read-only).
4. Message agent to independently post-verify — **Phase 42 PASS only after that**.

Do **not** run the CREATE held file (`PHASE38-HELD-STORAGE-BACKUP-SELECT-ONLY.sql`).

---

## Step 4 — Auth reader (inspect only; intact)

| Field | Value |
| --- | --- |
| UUID | `cf49f328-d5d6-4eb4-9aaf-bc0cbefa3355` |
| Present | yes |
| Banned | no |
| Soft-deleted | no |
| Email confirmed | yes |
| Provider | email |
| Disable supported? | Yes — Dashboard ban/disable (or delete) |
| Disable reversible? | Ban/disable: **yes**; delete: **no** |
| Future Storage backup | Needs SELECT policy + new/CM session if re-enabled |
| Safer than deletion? | **Yes — retain inactive/intact** until separate owner decision |
| Action this run | **None** (left intact) |

App/recovery do not depend on this Auth user (`durable.ts` uses server keys; restores use TEJAS1 archives).

---

## Remaining limitations

1. Production SELECT policy **still active** until owner applies DROP as relation owner.
2. Local TEJASSTOR1 CM session is already retired — production re-download with that session is unavailable until re-bootstrap (and policy still allows the Auth UUID if someone signs in).
3. Supabase Dashboard was not signed in this session; agent cannot complete DDL as table owner.
4. No commits/pushes/deploys.

---

## Safe finish sequence (owner)

1. Confirm P37/P38 still retained (already verified).
2. Follow `PHASE42-OWNER-POLICY-DROP-INSTRUCTIONS.md` (precheck → DROP → postcheck).
3. Optionally ban/disable Auth UUID (separate decision; not part of this DROP).
4. Ask agent to independently post-verify → Phase 42 PASS only after that succeeds.
