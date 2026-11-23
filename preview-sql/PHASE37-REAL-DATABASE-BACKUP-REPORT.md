# Phase 37 — Real Database Backup Report

## Final verdict: **PASS**

Owner-authorized production Supabase PostgreSQL backup completed on Windows. Custom-format archive sealed with TEJAS1 AES-256-GCM. Plaintext wiped. Integrity and encryption verified. Restore verification is **not** claimed (Phase 40).

| | UTC | IST |
| --- | --- | --- |
| Start | `2026-11-22T21:01:05Z` | `2026-11-23T02:31:05+05:30` |
| End | `2026-11-22T21:02:03Z` | `2026-11-23T02:32:03+05:30` |

Worktree: `C:\Users\Admin\Desktop\tejas\tejas-phase3`
Branch: `phase3/free-host-local` @ `6da54f6` (unchanged; no commit)
Runner: `scripts/recovery/windows_backup_pipeline.ps1` Dump
Pipeline SHA-256: `F2581518F5A5119D5D8EBAD2FD0C788ACC8302CC068F1A14045DC2F1082AD279`
Seal tool SHA-256: `24ED9C733C2B5A20B3C20506BCFB078D242374D4ADBC60E9C2F98877B5146859` (`windows_seal.js`)

---

## 1. Preflight

| Check | Result |
| --- | --- |
| Phases 32–36AV evidence reviewed | Pass (Windows pipeline, backup role, TEJAS1, 36AV recovery-set PASS) |
| Project ref | `zapccpipwxduzlnvjdmy` |
| Database | `postgres` |
| Server version (live) | `17.11` |
| Client tools | PostgreSQL **17.12** `pg_dump` / `pg_restore` / `psql` |
| Backup role | `tejas_backup_dumper` (login `tejas_backup_dumper.zapccpipwxduzlnvjdmy`) |
| Schema-reader role | Not used |
| TLS | `PGSSLMODE=require`; `\conninfo` showed SSL protocol |
| Recovery CM | `tejas1-recovery/zapccpipwxduzlnvjdmy` present (32-byte blob; secret not printed) |
| Backup-login CM | `tejas-backup-dumper/zapccpipwxduzlnvjdmy` present |
| 36AV status | `verification\|complete`, `cross-copy\|PASS` |
| Disk (C:) | ~338 GiB free (≥ 2 GiB gate) |
| Destination | `%LOCALAPPDATA%\tejas-db-backups\` (outside Git) |
| Existing worktree changes | Preserved (pipeline modified in place; no commit/stash) |

Encryption gate after 36AV: `key-recovery-verified-36av` / `encryption-ready|true`.

---

## 2. Synthetic tests (before real dump)

`Prepare` exit 0: gate open, tools present, disk OK.

`SelfTest` exit 0 after gate/seal integration:

- Invalid archive rejection, redaction, credential mock rules, target/TLS/Git ACL/disk/pgpass controls
- Local disposable DB dump + `pg_restore --list` + SHA-256
- Synthetic TEJAS1 seal, plaintext wipe, magic check, in-memory authenticated open (`PGDMP` + length)
- Gate asserts `encryption-ready` / `key-recovery-verified-36av`
- Explicit `selftest-mode-no-prod-dump` (SelfTest does not call production Dump)

Leftover synthetic `tejas-seal-pass-*.bin` from an earlier failed cleanup were zeroed and removed before the real dump. Post-dump scan: none remaining.

---

## 3. Independent code review (pre-dump)

| Gate | Verdict |
| --- | --- |
| No password on `pg_dump` argv; uses `PGPASSFILE` | Pass |
| `PGSSLMODE=require` for production path | Pass |
| Dump role is `tejas_backup_dumper` only | Pass |
| Seal uses `--wipe-plaintext` | Pass |
| Gate requires 36AV evidence + recovery CM + seal/node | Pass |
| Backup root outside Git + ACL restrict | Pass |
| Production Dump SQL | Read-only: `SELECT` identity + `\conninfo` + `pg_dump` (no writes) |
| SelfTest local `CREATE`/`INSERT`/`dropdb` | Local `127.0.0.1:55432` only; not production |

Static regex that scanned past `Invoke-GatedDump` into SelfTest SQL was a **false positive**; manual review of the Dump path confirmed no production writes.

---

## 4. Real backup execution

| Step | Result |
| --- | --- |
| Credential retrieval | Backup-login CM via CredRead → temp `.pgpass` (ACL-restricted); not on argv |
| Identity | `postgres\|tejas_backup_dumper\|17.11` |
| TLS | `tls\|verified` |
| Role | `role\|tejas_backup_dumper\|verified` |
| `pg_dump` | Custom + `gzip:6` + `--no-password`; `pg_dump\|ok` |
| `pg_restore --list` | `archive-list\|ok`; `table-data-present` (793 listing lines) |
| Plaintext size / SHA-256 | `1165522` / `631b4c2da713a8100a10f6e6cbd02868cfc36469272e59d7abf8d9d41a1d109a` |
| Seal | TEJAS1 AES-256-GCM / PBKDF2-HMAC-SHA256 / 600000; wrap = recovery CM `R` |
| Plaintext cleanup | `plaintext-cleanup\|verified` (`.dump` absent after seal) |
| TEJAS1 magic | `tejas1-magic\|ok` |
| Authenticated open (in-memory) | `seal-auth-verify\|ok` (length + `PGDMP`; no plaintext re-written to disk) |

Pooler: `aws-0-ap-northeast-1.pooler.supabase.com:5432`.

---

## 5. Encrypted archive and manifest

| Field | Value |
| --- | --- |
| Sealed path | `C:\Users\Admin\AppData\Local\tejas-db-backups\run-20261122T210105Z\tejas-db-zapccpipwxduzlnvjdmy-20261122T210105Z.dump.tejas1` |
| Format | PostgreSQL custom archive inside TEJAS1 |
| Sealed size | `1165573` bytes |
| Sealed SHA-256 | `24db6a21bdf11155b866668cdbcd01881abc6f7cccfb933868bb595ea27388f6` |
| Manifest | `...\tejas-db-zapccpipwxduzlnvjdmy-20261122T210105Z.manifest.txt` |
| List evidence | `...\tejas-db-zapccpipwxduzlnvjdmy-20261122T210105Z.pg_restore-list.txt` |
| Outside Git | Yes |
| ACL (sealed) | `DESKTOP-K12JQ1D\Admin:(R,W,D)` (inheritance removed) |

Manifest records project ref, database, role, gate reason, plaintext/sealed hashes and sizes, and `plaintext-retained|false`. No passwords, passphrases, or connection URLs.

Expected app objects present in listing (sample): `public` functions such as `tejas_learn_register_student`, plus auth/storage system table data. ~200 listing lines reference `public`.

---

## 6. Cleanup and secret handling

| Check | Result |
| --- | --- |
| Unencrypted `.dump` in run dir | Absent |
| Temp `tejas-backup-pgpass-*` | Absent |
| Temp `tejas-seal-pass-*` | Absent |
| Evidence secret-pattern scan (manifest + list) | Pass |
| P / M / R exposure in logs or this report | None |
| CM / USB / KeePassXC recovery copies | Unchanged (not modified or rotated) |

Limitation: PowerShell cannot guarantee cryptographic wipe of the in-memory backup-login string after CredRead; reference was dropped after use. Recovery `R` byte array was cleared after seal verify. Pass-file and pgpass files were ACL-restricted and removed.

---

## 7. Boundaries respected

- No production SQL writes; no role/schema/RLS/extension changes
- No Storage operations
- No deployment; no Git commit / push / merge
- No recovery-key rotation; existing CM/USB/KDBX copies untouched
- No restore verification (deferred to Phase 40)
- Phase 38 not started

---

## 8. Failures, warnings, limitations

1. **Restore not verified** — intentional Phase 37 scope stop.
2. **Client 17.12 vs server 17.11** — supported pairing; listing succeeded; full restore remains Phase 40.
3. **SelfTest cleanup ACL** — one intermediate SelfTest run left synthetic pass files until ACL fix; cleaned before real dump; final cleanup Pass.
4. **Instruction notes** from 36AP still optional/absent — does not affect dump seal (R from CM).

No DUMP or encryption failures on the authorized real run.

---

## 9. Independent review verdict

Re-checked sealed file size/hash, TEJAS1 magic, plaintext absence, manifest completeness, listing object evidence, outside-Git placement, ACL, and secret-pattern scan after the Dump exit. All matched the runner output.

**Independent review: PASS**

**Phase 37 final verdict: PASS**

STOP. Do not start Phase 38 automatically.
