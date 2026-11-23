# Phase 40 — Isolated Database Restore Report

## Final verdict: **PASS**

Real Phase 37 TEJAS1 archive was opened with the verified recovery credential, restored into a disposable local PostgreSQL database on loopback, verified, wiped, and dropped. Production was not used as a restore target. Phase 37 sealed archive hash unchanged.

| | UTC | IST |
| --- | --- | --- |
| Start | `2026-11-22T21:35:43Z` | `2026-11-23T03:05:43+05:30` |
| End | `2026-11-22T21:35:48Z` | `2026-11-23T03:05:48+05:30` |

Runner: `scripts/recovery/windows_isolated_db_restore.ps1` Restore
SelfTest: exit 0 before Restore

---

## 1. Source archive

| Field | Value |
| --- | --- |
| Path | `C:\Users\Admin\AppData\Local\tejas-db-backups\run-20261122T210105Z\tejas-db-zapccpipwxduzlnvjdmy-20261122T210105Z.dump.tejas1` |
| SHA-256 (pre/post) | `24db6a21bdf11155b866668cdbcd01881abc6f7cccfb933868bb595ea27388f6` |
| Unchanged after restore | **True** |
| Open | TEJAS1 authenticated open via recovery CM `tejas1-recovery/zapccpipwxduzlnvjdmy` (secret not printed) |
| Plaintext size | `1,165,522` bytes |
| `pg_restore --list` | ok (TABLE DATA present) |

---

## 2. Isolated target

| Field | Value |
| --- | --- |
| Host | `127.0.0.1` |
| Port | `55432` |
| Database | `tejas_p40_iso_20261122213543` (created then dropped) |
| Production project | **Not connected** |
| `pg_restore` flags | `--no-owner --no-acl` |
| `pg_restore` exit | `0` |

---

## 3. Post-restore checks

| Check | Result |
| --- | --- |
| Schemas among public/auth/storage | **3** |
| Public base tables | **26** |
| `storage.buckets` | **2** |
| `storage.objects` | **79** (matches Phase 38 live inventory count) |

---

## 4. Cleanup

| Check | Result |
| --- | --- |
| Plaintext dump wiped | **verified** |
| Isolated DB dropped | **yes** |
| Recovery secret printed | **no** |
| Phase 37 archive modified | **no** |

---

## 5. Limitations

1. Local stock PostgreSQL 17.12 is not a full Supabase platform clone (Auth HTTP, Storage HTTP, Vault, etc. are out of scope here).
2. This proves **database archive decrypt + restore + catalog checks**, not Storage file-byte restore (blocked on Phase 38).
3. Application end-to-end recovery against an isolated stack is not claimed.

---

## 6. Boundaries

- No production writes
- No Git commit / push / deploy
- No recovery-key rotation
- No Phase 38 Storage download attempted in this runner

**Phase 40 verdict: PASS**
