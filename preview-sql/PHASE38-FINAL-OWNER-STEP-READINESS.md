# Phase 38 — Final Owner-Step Readiness

## Verdict: **READY FOR OWNER STEPS** (no production changes performed)

All remaining technical preparation is complete. Real Storage downloads are still stopped until the owner creates a dedicated Auth user, authorizes applying the held SELECT-only SQL, and bootstraps a TEJASSTOR1 session locally.

| | UTC | IST |
| --- | --- | --- |
| Readiness stamped | `2026-11-22T21:28:56Z` | `2026-11-23T02:58:56+05:30` |

Phase 37 archive preserved:
`24db6a21bdf11155b866668cdbcd01881abc6f7cccfb933868bb595ea27388f6`
(`…\tejas-db-backups\run-20261122T210105Z\…dump.tejas1`)

SelfTest (incl. secure refresh): **PASS** (`windows_storage_backup_pipeline.ps1 SelfTest`)

---

## 1. Line-by-line review of held SQL

File: `preview-sql/PHASE38-HELD-STORAGE-BACKUP-SELECT-ONLY.sql` (**not applied**)

| Lines | Content | Review |
| --- | --- | --- |
| 1–27 | Comments / owner prerequisites | No executable grants |
| 29 | `begin;` | Transaction wrapper |
| 31–38 | `DO` block: placeholder UUID must be replaced or apply fails | Fail-closed |
| 40–47 | `CREATE POLICY … FOR SELECT … ON storage.objects TO authenticated` | **Only** privilege created |
| 44–46 | `bucket_id IN ('tejas-registration-files','tejas-payment-proofs') AND auth.uid() = <reader>` | Two buckets + one UUID |
| 49 | `commit;` | |
| 51–52 | Reverse drop comment | Not executed |

### Restrictions confirmed

| Requirement | Status |
| --- | --- |
| Two intended bucket IDs only | Yes |
| One dedicated Auth user UUID | Yes (`auth.uid() = …`) |
| SELECT only on `storage.objects` | Yes (buckets policy **removed** from earlier draft) |
| No INSERT / UPDATE / DELETE policies | Confirmed — none in file |
| No bucket-management (create/update/delete bucket) | Confirmed |
| No policy-management / role grants | Confirmed — only `CREATE POLICY` for SELECT |

### Listing + download

Supabase Storage enforces both **object listing** and **authenticated object GET/download** through RLS **SELECT** on `storage.objects`. This single SELECT policy is sufficient for list and download for that Auth user on the two buckets. No INSERT/UPDATE/DELETE policy is required or included.

Inventory for Phase 38 continues to use the existing DB role `tejas_backup_dumper` (metadata only). HTTP download uses the Auth user session after this policy exists.

### Exact SQL (copy after UUID substitution)

```sql
begin;

do $$
declare
  reader uuid := '<BACKUP_READER_AUTH_USERS_ID>'::uuid;
begin
  if reader = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'HELD SQL: replace placeholder backup-reader UUID before apply';
  end if;
end $$;

create policy tejas_storage_backup_objects_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id in ('tejas-registration-files', 'tejas-payment-proofs')
    and auth.uid() = '<BACKUP_READER_AUTH_USERS_ID>'::uuid
  );

commit;
```

Replace **every** `<BACKUP_READER_AUTH_USERS_ID>` (including the `DO` block) with the dedicated user’s `auth.users.id`. Leave no all-zero UUID.

---

## 2. Token lifecycle design

| Token | Lifetime (Supabase default) | Use |
| --- | --- | --- |
| Access token (JWT) | Typically **~3600s** (project Auth “JWT expiry”; short-lived) | `Authorization: Bearer` for Storage GET |
| Refresh token | Does **not** expire by default; **single-use** (rotated on refresh) | Obtain new access (+ new refresh) |
| Password | N/A | Used **once** at bootstrap only; **never stored** |
| Publishable / anon key | Long-lived project key (low privilege) | `apikey` header for Auth + Storage |

### Refresh API

`POST {supabase}/auth/v1/token?grant_type=refresh_token`
Headers: `apikey: <publishable>`, `Authorization: Bearer <publishable>`, `Content-Type: application/json`
Body: `{ "refresh_token": "<current>" }`
Response: `access_token`, `refresh_token` (rotated), `expires_in`

### Downloader behavior (implemented)

1. Read CM session `TEJASSTOR1` (`publishable` + `refresh`).
2. Refresh once at Dump start → short-lived access JWT (`role` must be `authenticated`; `service_role` rejected).
3. Persist rotated refresh_token back to CM (no logging of token values).
4. Download with GET only; on HTTP **401**, refresh again, persist rotation, retry.
5. Access token / publishable cleared from script variables in `finally`.

Prior gap: Dump used a static bearer with no refresh. **Resolved** and synthetically tested (`auth-refresh*`, `session-parse*` checks).

### Non-exposure rules

- Refresh tokens and passwords are never written to reports, Git, or chat.
- `Protect-Text` redacts password/token/authorization patterns in pipeline logs.
- Bootstrap discards password after password-grant; CM stores only publishable + refresh.

---

## 3. Credential requirements (final auth design)

| CM target | Username | Persist | Contents |
| --- | --- | --- | --- |
| `tejas-storage-reader/zapccpipwxduzlnvjdmy` | `tejas-storage-reader` | Local machine (Generic) | `TEJASSTOR1` blob: `publishable=` + `refresh=` |

**Not stored:** user password, access JWT (except briefly in memory), `service_role`, `sb_secret_*`.

| Script | Role |
| --- | --- |
| `preview-sql/bootstrap-tejas-storage-reader-session.ps1` | **Preferred:** password grant once → store session |
| `preview-sql/store-tejas-storage-reader-credential.ps1` | Offline store when publishable + refresh already known |
| Both | Reject privileged publishable / service_role shapes |

---

## 4. Synthetic verification (this prep)

`SelfTest` exit 0 includes: GET-only downloader, privileged-key rejection, fixture download, PUT/DELETE rejected, TEJAS1 seal/wipe, pagination merge, **auth refresh + refresh rotation + session blob parse**. No production Storage download.

---

## 5. Exact owner instructions

Do **not** paste secrets into chat. Do **not** use `service_role` / secret keys.

### Step A — Create dedicated Auth user (Dashboard)

1. Open Supabase project `zapccpipwxduzlnvjdmy` → Authentication → Users.
2. Add user (email + strong password) used **only** for Storage backup reads (not staff UI).
3. Copy that user’s UUID (`auth.users.id`).

### Step B — Prepare and authorize SQL

1. Edit `preview-sql/PHASE38-HELD-STORAGE-BACKUP-SELECT-ONLY.sql`.
2. Replace the placeholder UUID in **all** places with the UUID from Step A.
3. Review: only `FOR SELECT` on `storage.objects`; two bucket IDs; that UUID.
4. Explicitly authorize apply (this is a production privilege change).
   The agent will not apply SQL until you say so in a later message.

### Step C — Apply SQL (owner or authorized operator)

Apply only the reviewed file (SQL editor / approved migration path). Confirm policy `tejas_storage_backup_objects_select` exists and no backup-reader INSERT/UPDATE/DELETE policies were added.

### Step D — Bootstrap session (local PC)

```powershell
Set-Location C:\Users\Admin\Desktop\tejas\tejas-phase3
powershell -NoProfile -File .\preview-sql\bootstrap-tejas-storage-reader-session.ps1
```

Enter at SecureString/prompts:

1. Project **publishable (anon)** key
2. Backup reader **email**
3. Backup reader **password**

Expect: `session|stored`, `format|TEJASSTOR1`, `password|not-stored`, `secret|not-printed`.

### Step E — Resume downloads

Reply in chat: **resume Phase 38 downloads** (no secrets).
Agent will re-inventory, download, hash, TEJAS1-seal, wipe, and verify.

---

## 6. Remaining blockers (owner authority only)

1. Create dedicated Auth user + capture UUID.
2. Authorize + apply held SELECT-only SQL.
3. Run bootstrap session script locally.
4. Resume message for downloads.

---

## 7. Boundaries

- No production SQL/policy apply in this prep
- No production Storage download
- No `service_role` use
- No Phase 37 / recovery material changes
- No Git commit / push / deploy
- Phase 39 not started

**Status: technical prep complete. Waiting on owner Steps A–E.**
