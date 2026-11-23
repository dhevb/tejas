# Phase 39 — Isolated Storage Restore Evidence

## Final verdict: **PASS**

Real Phase 38 TEJAS1 Storage archive was opened with the verified recovery credential, extracted locally outside Git, reconciled object-by-object to the Phase 38 manifest (count, size, SHA-256), then wiped. Production Storage was not written. Phase 37 and Phase 38 sealed archives remained unchanged.

| | UTC | IST |
| --- | --- | --- |
| SelfTest | `2026-11-22T22:31:38Z` | `2026-11-23T04:01:38+05:30` |
| Restore complete | `2026-11-22T22:31:46Z` | `2026-11-23T04:01:46+05:30` |

Worktree: `C:\Users\Admin\Desktop\tejas\tejas-phase3`
Branch: `phase3/free-host-local` @ `6da54f6` (no commit / push / deploy)
Runner: `scripts/recovery/windows_isolated_storage_restore.ps1`

---

## 1. Source archive

| Field | Value |
| --- | --- |
| Path | `C:\Users\Admin\AppData\Local\tejas-storage-backups\run-20261122T222749Z\tejas-storage-zapccpipwxduzlnvjdmy-20261122T222749Z.zip.tejas1` |
| SHA-256 (pre/post) | `f34c09dbde0a256dbc9335bd864d8c978587713c458c54efcd82cd856efaa17b` |
| Unchanged after restore | **True** |
| Manifest | `...\tejas-storage-zapccpipwxduzlnvjdmy-20261122T222749Z.manifest.txt` |
| Open | TEJAS1 authenticated open via recovery CM `tejas1-recovery/zapccpipwxduzlnvjdmy` (secret not printed) |
| Plaintext ZIP size | `2,674,162` bytes (`PK` magic) |

---

## 2. SelfTest

| Check | Result |
| --- | --- |
| Sealed SHA matches expected | Pass |
| Manifest present | Pass |
| Node + seal tool | Pass |
| Work root outside Git | Pass |
| Wrong recovery key rejected | Pass (`checked\|wrong-key-rejected`) |
| Manifest object-count = 79 | Pass |
| Exit | **0** |

---

## 3. Isolated restore / reconcile

| Check | Result |
| --- | --- |
| Target | `%LOCALAPPDATA%\tejas-isolated-storage-restore\run-*` (local only) |
| Production Storage upload/delete | **None** |
| Objects matched | **79** / **3,199,827** bytes |
| Buckets verified | `tejas-payment-proofs`, `tejas-registration-files` |
| Per-object size + SHA-256 vs manifest | All match |
| Plaintext ZIP wiped after extract | Yes |
| Extracted objects wiped after reconcile | Yes |
| Sealed archive mutated | **No** |

---

## 4. Live catalog cross-check (read-only)

Compared live `storage.objects` (via `tejas_backup_dumper`) to the Phase 38 manifest:

| Metric | Result |
| --- | --- |
| Live objects | 79 |
| Manifest objects | 79 |
| Keys only in live | 0 |
| Keys only in manifest | 0 |
| Size mismatches (where meta size &gt; 0) | 0 |
| Cross-reconcile | **PASS** |

---

## 5. Boundaries

- No production Storage writes
- No `service_role`
- No Phase 37 / Phase 38 sealed-file modification
- No Git commit / push / deploy

**Phase 39 verdict: PASS**
