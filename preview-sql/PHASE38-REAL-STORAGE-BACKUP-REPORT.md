# Phase 38 — Real Storage Backup Report

## Final verdict: **PASS**

Owner-authorized production Supabase Storage backup completed on Windows after TEJASSTOR1 session bootstrap. All **79** private objects downloaded via GET-only Storage HTTP, size-reconciled to live inventory metadata, SHA-256 hashed, archived, sealed with TEJAS1 AES-256-GCM, and plaintext wiped. Phase 37 database archive remained unchanged. `service_role` / `sb_secret_*` were not used.

| | UTC | IST |
| --- | --- | --- |
| Preflight start | `2026-11-22T22:27:07Z` | `2026-11-23T03:57:07+05:30` |
| Dump complete | `2026-11-22T22:29:40Z` | `2026-11-23T03:59:40+05:30` |

Worktree: `C:\Users\Admin\Desktop\tejas\tejas-phase3`
Branch: `phase3/free-host-local` @ `6da54f6` (no commit / push / deploy)
Runner: `scripts/recovery/windows_storage_backup_pipeline.ps1` Dump
Pipeline SHA-256: `FDBE71C06030FA6B9FDB5FBF222E0B43B29CB11536F4C71D6104B4ED2CE980C1`
Seal tool SHA-256: `24ED9C733C2B5A20B3C20506BCFB078D242374D4ADBC60E9C2F98877B5146859` (`windows_seal.js`)

---

## 1. Preflight (before download)

| Check | Result |
| --- | --- |
| CM `tejas-storage-reader/zapccpipwxduzlnvjdmy` | **Present** (TEJASSTOR1 publishable + refresh; password not stored) |
| Prepare gate | `storage-credential\|present`, `storage-dump\|gate-open` |
| Encryption gate | `key-recovery-verified-36av` / `encryption-ready\|true` |
| Disk free | ~338 GiB (≥ 2 GiB gate) |
| SELECT-only policy `tejas_storage_backup_objects_select` | Present on `storage.objects` |
| Policy command | **SELECT only** (`cmd=SELECT`) |
| Policy roles | `{authenticated}` |
| Two-bucket scope | `tejas-registration-files`, `tejas-payment-proofs` |
| Backup-named non-SELECT policies | **0** |
| Phase 37 sealed SHA-256 (pre) | `24db6a21bdf11155b866668cdbcd01881abc6f7cccfb933868bb595ea27388f6` — **unchanged** |
| SQL writes / Storage PUT/DELETE | None |

---

## 2. Project and bucket identity

| Field | Value |
| --- | --- |
| Project ref | `zapccpipwxduzlnvjdmy` |
| Supabase URL | `https://zapccpipwxduzlnvjdmy.supabase.co` |
| Inventory source | `storage.buckets` + `storage.objects` via `tejas_backup_dumper` (SELECT metadata) |
| Object bytes source | Storage HTTP **GET** with Auth user JWT after refresh |
| Bucket / object create/update/delete | **None** |

### Buckets

| Bucket | Public | File size limit |
| --- | --- | --- |
| `tejas-payment-proofs` | **false** | 5,242,880 |
| `tejas-registration-files` | **false** | 10,485,760 |

### Object totals (live inventory + download)

| Metric | Value |
| --- | --- |
| Buckets | 2 |
| Objects | **79** |
| Meta / downloaded bytes | **3,199,827** (exact match) |
| `tejas-payment-proofs` | 25 objects / 1,989,836 bytes |
| `tejas-registration-files` | 54 objects / 1,209,991 bytes |
| Failed downloads | **0** |

Auth refresh: `auth-refresh|rotated-persisted` (rotated refresh written back to CM; secret not printed).

---

## 3. Download / seal execution

| Step | Result |
| --- | --- |
| Inventory | `objects\|79`, `bytes-meta\|3199827` |
| Download | `download\|copied=79\|failed=0\|bytes=3199827` |
| Size reconcile | Per-object size matched metadata when metadata size &gt; 0; total bytes exact |
| SHA-256 | Computed for every copied object; recorded in manifest |
| ZIP | `2,674,162` bytes / `61820ffef4bc3a951079975d266d8e276f8d43959403c1935bec49644f569d5a` |
| Plaintext objects wipe | `plaintext-objects\|wiped` |
| Seal | TEJAS1 AES-256-GCM / PBKDF2-HMAC-SHA256 / 600000; wrap = recovery CM `R` |
| Plaintext ZIP wipe | `plaintext-zip\|wiped` |
| TEJAS1 magic | `TEJAS1\n` |
| Authenticated open verify | `seal-auth-verify\|ok` (length + ZIP `PK` magic; no plaintext left on disk) |

---

## 4. Encrypted archive and manifest

| Field | Value |
| --- | --- |
| Run dir | `C:\Users\Admin\AppData\Local\tejas-storage-backups\run-20261122T222749Z\` |
| Sealed path | `...\tejas-storage-zapccpipwxduzlnvjdmy-20261122T222749Z.zip.tejas1` |
| Sealed size | `2,674,213` bytes |
| Sealed SHA-256 | `f34c09dbde0a256dbc9335bd864d8c978587713c458c54efcd82cd856efaa17b` |
| Manifest | `...\tejas-storage-zapccpipwxduzlnvjdmy-20261122T222749Z.manifest.txt` |
| Manifest SHA-256 | `7611c0892236561cbcd741da9419f5e032c387c54fc4e23e11c73d0fafde9a96` |
| Manifest rows | 79 / status `copied` / each with 64-char SHA-256 |
| Outside Git | Yes |
| ACL (sealed) | `DESKTOP-K12JQ1D\Admin:(R,W,D)` |
| `plaintext-retained` | `false` |

---

## 5. Independent post-run verification

| Check | Result |
| --- | --- |
| Sealed present; ZIP/plaintext absent | Pass |
| Sealed SHA-256 re-hash | Matches Dump output |
| Manifest SHA-256 re-hash | Matches Dump output |
| Manifest object rows / copied / failed | 79 / 79 / 0 |
| Manifest secret-pattern scan (JWT / `sb_secret_` / Bearer) | Clean |
| Phase 37 sealed SHA-256 (post) | Still `24db6a21…88f6` |
| Temp `tejas-storage-*` leftovers | None observed |

---

## 6. Cleanup and secret handling

| Check | Result |
| --- | --- |
| Unencrypted object tree | Absent |
| Unencrypted ZIP | Absent |
| Pass-file after seal | Removed by runner `finally` |
| Secrets in console / report / manifest | Not printed |
| Privileged keys | Rejected by design; not used |

---

## 7. Boundaries

- No `service_role` / `sb_secret_*`
- No production Storage writes or policy changes during Dump
- No Phase 37 archive modification
- No Git commit / push / deploy

**Phase 38 verdict: PASS**
