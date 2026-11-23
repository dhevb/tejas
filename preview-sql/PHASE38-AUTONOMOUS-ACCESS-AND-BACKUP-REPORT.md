# Phase 38 — Autonomous Access Resolution and Backup Report

## Final verdict: **FAIL** (blocked — least-privilege Storage HTTP access does not exist yet)

All safe autonomous work is complete. Real object download and TEJAS1 Storage archive creation remain blocked until the owner authorizes a **SELECT-only** Storage access path and stores a non-privileged credential. `service_role` / secret keys were not used or stored.

| | UTC | IST |
| --- | --- | --- |
| Access investigation | `2026-11-22T21:07:29Z`–`21:23:20Z` | `2026-11-23T02:37`–`02:53+05:30` |
| SelfTest complete | `2026-11-22T21:23:20Z` | `2026-11-23T02:53:20+05:30` |

Branch: `phase3/free-host-local` @ `6da54f6` (no commit / push / deploy)

---

## 1. What was inspected

### Project / buckets

| Item | Result |
| --- | --- |
| Project | `zapccpipwxduzlnvjdmy` |
| Buckets | `tejas-registration-files`, `tejas-payment-proofs` — both **private** |
| Objects (DB catalog) | **79** (reconfirmed) |
| Metadata bytes | **3,199,827** |
| Storage API credential in CM | **Absent** (`tejas-storage-reader/…`) |
| Env service/anon/secret keys | **Absent** |
| Phase 37 DB archive | Unchanged `24db6a21bdf11155b866668cdbcd01881abc6f7cccfb933868bb595ea27388f6` |

### Storage RLS / grants (read-only via `tejas_backup_dumper`)

| Check | Result |
| --- | --- |
| `storage.objects` RLS | **Enabled**, force RLS off |
| `storage.buckets` RLS | **Enabled** |
| Policies on `storage.*` | **0** |
| `anon` / `authenticated` table privs on `storage.objects` | SELECT/INSERT/UPDATE/DELETE grants exist, but **zero policies** ⇒ API cannot list/download private objects |
| `service_role` | BYPASSRLS + full table privs — **forbidden for Phase 38 reader target** |
| `tejas_backup_dumper` | SELECT-only on `storage.objects`, **BYPASSRLS** — can inventory metadata; **cannot** fetch object bytes over Storage HTTP |

### Application behavior (code / held SQL)

Held migration `20261031_tejas_storage.sql` states server uploads use the **service role** after staff checks; anonymous/authenticated have no Storage SELECT/INSERT policies. Live catalog matches that design (still zero policies).

### Local credential references

| Source | Finding |
| --- | --- |
| CM tejas targets | recovery, backup-dumper, schema-reader only |
| `.env.local` (Desktop/tejas) | `VERCEL_OIDC_TOKEN` only — not a Storage key |
| Vercel link in worktree | Not linked |

---

## 2. Supported least-privilege mechanism (research)

Per Supabase Storage access control:

- Private bucket downloads require a user JWT that **passes RLS SELECT**, or a **secret/service key** (bypasses RLS — disallowed here).
- Publishable/`anon` keys alone are insufficient without SELECT policies.
- There is **no** built-in bucket-scoped read-only secret key that avoids RLS.

**Conclusion:** A least-privilege path requires **new SELECT-only policies** for a dedicated Auth user (or equivalent claim), then a user-scoped credential — **not** `service_role`.

Creating those policies is a production privilege change. This phase **prepared but did not apply** them.

---

## 3. What was implemented (safe / autonomous)

| Artifact | Purpose |
| --- | --- |
| `preview-sql/PHASE38-HELD-STORAGE-BACKUP-SELECT-ONLY.sql` | Held SELECT-only policies for one Auth UID on the two buckets; placeholder UUID fail-closed; **not applied** |
| `preview-sql/store-tejas-storage-reader-credential.ps1` | SecureString → CM; rejects `sb_secret_*` and `service_role` JWTs |
| `scripts/recovery/windows_storage_backup_pipeline.ps1` | Prepare / Inventory / Dump / **SelfTest**; GET-only downloader; privileged-token reject on Dump |
| Inventory under `%LOCALAPPDATA%\tejas-storage-backups\inventory-20261122T210729Z\` | Outside Git |

### Exact permissions established today

| Permission | Status |
| --- | --- |
| DB metadata inventory (backup dumper) | **Established** (existing role) |
| Storage HTTP list/download least-privilege | **Not established** (no SELECT policy + no reader credential) |
| Write/delete for backup reader | **Not granted** (and must not be) |

---

## 4. Synthetic test results

`windows_storage_backup_pipeline.ps1 SelfTest` → exit **0**

| Check | Result |
| --- | --- |
| Downloader source is GET-only | Pass |
| Reject `sb_secret_` | Pass |
| Reject JWT `role=service_role` | Pass |
| Allow authenticated JWT **shape** (synthetic) | Pass |
| Local fixture GET download + size + SHA-256 | Pass |
| Fixture PUT / DELETE → rejected (403) | Pass |
| Zip → TEJAS1 seal → wipe plaintext → auth verify (`PK`) | Pass |
| Pagination merge uniqueness (synthetic pages) | Pass |
| No production download | Pass |

---

## 5. Real backup status

| Step | Result |
| --- | --- |
| Download 79 objects | **Not started** (no least-privilege HTTP access) |
| Manifest / sealed archive / cleanup of real objects | **N/A** |
| Encrypted archive size / SHA-256 | **N/A** |

---

## 6. Unavoidable owner-only actions

Finish these in order. Do **not** paste secrets into chat.

### A. Authorize and apply SELECT-only access (production privilege change)

1. Create a **dedicated** Supabase Auth user used only for Storage backup reads.
2. Edit `preview-sql/PHASE38-HELD-STORAGE-BACKUP-SELECT-ONLY.sql`: replace the placeholder UUID with that user’s `auth.users.id` in **all** occurrences.
3. Explicitly authorize applying that held SQL (or equivalent SELECT-only policies).
   Agent will **not** apply it without that authorization.
4. Confirm still **no** INSERT/UPDATE/DELETE policies for that user on `storage.objects`.

### B. Store least-privilege credential locally

```powershell
Set-Location C:\Users\Admin\Desktop\tejas\tejas-phase3
powershell -NoProfile -File .\preview-sql\store-tejas-storage-reader-credential.ps1
```

Enter a **user access JWT** (or other non-secret, non–service-role material agreed for the reader target) at the SecureString prompt.
Expect `credential|stored` and `privileged-check|passed-local`.

**Do not** enter `service_role` / `sb_secret_` — the store script rejects those.

### C. Resume

Reply **resume Phase 38 downloads** after A+B. The agent will then inventory-delta check, download, hash, seal, wipe, and update evidence.

---

## 7. Boundaries respected

- No `service_role` / secret key use or storage
- No RLS weakening; no policy apply; no privilege grants executed
- No Storage or database writes
- No Phase 37 archive modification
- No Git commit / push / deploy
- Phase 39 not started

---

## 8. Remaining blockers

1. **Owner authorization** to apply SELECT-only Storage policies for a dedicated Auth user.
2. **Owner-local store** of a least-privilege reader credential in CM after those policies exist.
3. Until then: real Storage backup archive cannot be produced without violating least-privilege rules.

**Phase 38 autonomous access work: complete.**
**Phase 38 real Storage backup: FAIL / blocked on owner privilege + credential steps above.**
