# TEJAS — Google Drive Backup Design (Registration Files)

**Status:** Design only — **blocked** pending owner Google Cloud / credential approval  
**Date:** 2026-11-24  
**Rules:** No invented credentials · no secrets in chat/repo · no Production env changes · no migration apply · no historical backfill

---

## 1. Existing inventory (names only)

| Finding | Detail |
|---------|--------|
| In-app Drive API | **None** under `app/` / `lib/` |
| Recovery backups | `scripts/recovery/*`, GitHub `recovery-backup.yml`, rclone remote `tejasdrive` |
| Related env **names** (not values) | `TEJAS_RCLONE_CONFIG_B64`, `TEJAS_BACKUP_DESTINATION`, `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE`, `SUPABASE_BACKUP_DB_URL` |
| App primary store | Supabase DB + private buckets `tejas-registration-files`, `tejas-payment-proofs` |

Do **not** reuse recovery rclone secrets for interactive staff Drive folders without an explicit owner design decision.

---

## 2. Proposed folder hierarchy

```
TEJAS Olympiad 2026-27/
  School Registrations/
    [Registration Reference]/
      Original Student Upload/
      Payment Proof/
      Consolidated Registration/
```

- Private folders only; DHE staff ACL; **never** create public links.
- Deterministic names, e.g. `{reference}-students.{ext}`, `{reference}-proof.{ext}`, `{reference}-consolidated.xlsx`.

---

## 3. Behaviour

| Event | Action |
|-------|--------|
| Registration saved | Queue original upload sync (non-blocking) |
| Payment proof uploaded | Queue proof sync |
| Consolidated download / staff action | Queue consolidated workbook sync |
| Drive down | Registration/payment still succeed; status `failed` / `pending` |
| Retry | Staff retry only; idempotent by Drive file id / content hash |
| Historical backfill | **Not automatic** |

---

## 4. Durable audit (requires owner-approved migration — **STOP**)

Proposed table (not applied):

`tejas_registration_drive_files`  
`(id, reference, kind, drive_file_id, drive_folder_id, status, attempts, last_error, content_sha256, updated_at)`

Kinds: `original_upload` | `payment_proof` | `consolidated`.

Until approved: UI shows **Drive not configured**; no sync writes.

---

## 5. Environment / Google Cloud requirements (owner)

Exact requirements — values must be set only in Vercel/Google consoles by owner:

1. Google Cloud project with Drive API enabled.  
2. Service account **or** OAuth client with restricted DHE shared-drive access.  
3. Suggested env **names** (placeholders):  
   - `TEJAS_DRIVE_ENABLED=true`  
   - `TEJAS_DRIVE_ROOT_FOLDER_ID`  
   - `TEJAS_DRIVE_SERVICE_ACCOUNT_JSON` (Secret) **or** OAuth tokens as Secrets  
4. No public sharing settings on the service account.  
5. Preview vs Production credential isolation.

**STOP:** Do not add these to Production without separate owner approval. This task does not set them.

---

## 6. Security

- Supabase remains source of truth.  
- Never log access tokens.  
- Mask PAN in consolidated Drive copies by default; full-PAN export remains staff-only in-app.  
- Formula-injection protection on generated sheets (existing `safe` / `safeExport` pattern).
