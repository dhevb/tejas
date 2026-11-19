# TEJAS disaster recovery runbook

Draft revised 17 November 2026, IST. Phase 3A evidence reconciliation, 17 November 2026, IST, added sections M, N, and O. Phase 3C, 17 November 2026, IST, added fail-closed cleanup, checksum, and extraction guards. Phase 3D, 17 November 2026, IST, dispositioned the remaining medium and low findings. Phase 3E, 17 November 2026, IST, closed fail-open gaps found in an independent read. Phase 3F, 17 November 2026, IST, added the prerequisite register and recovery gates in section R. Phase 3G, 17 November 2026, IST, separated validation, recovery, upload, and Production states in sections R and S. Section T, 17 November 2026, 12:49 IST, records the later execution. Section U, 17 November 2026, 12:54 IST, reconciles the schema and function counts and corrects the Storage status. Section V, 17 November 2026, 12:58 IST, records the independent reconfirm, the historical-script search, and the owner-decision register. Section W, 17 November 2026, 3:00 PM IST, records the later operator rule. Section X, 17 November 2026, 3:52 PM IST, records the post-merge documentation status. Section Y, 17 November 2026, 6:24 PM IST, records the owner's confirmation that P-08 is closed. Statements above section T that say the real backups were **NOT TESTED** were true when written. Section V is the recovery status of the isolated restore. Section W is the rule for the next operator. Section X is the post-merge documentation status. Section Y is the current P-08 status. Section AA records the owner's approval on 17 November 2026 of the P-03, P-21, and P-22 limitations. Section AB records the owner's decisions on 17 November 2026 for P-04, P-12, P-14, P-18, and P-19. Those five remain open. P-15 also remains open. Sections T and V record it, and no owner decision has been made for it. Section AC, 18 November 2026, 12:01 AM IST, records the later repository alignment, the version-only history repair, and the 17 November backup. It does not close P-04, P-12, P-14, P-15, P-18, or P-19. It does not reopen P-03, P-08, P-21, or P-22. Section AD, 18 November 2026, 5:22 AM IST, records the expected `supabase_vault` 0.3.1 relation inventory and closes P-04 only. P-12, P-14, P-15, P-18, and P-19 remain open. Section AE, 18 November 2026, 6:15 AM IST, records the owner's acceptance that no additional Production repair is required on the evidence then available, and closes P-19 only. That decision supersedes the Section AB deferral for P-19. The Section AB text remains the historical record. P-12, P-14, P-15, and P-18 remain open. Section AF, 18 November 2026, 6:36 AM IST, records a later isolated rehearsal, a new inventory script, and a hardened extractor. It does not close P-12, P-14, P-15, or P-18, and it does not reopen P-03, P-04, P-08, P-19, P-21, or P-22. Section AG, 18 November 2026, 6:47 AM IST, adopts the hardened extractor as the future extraction standard and closes P-15 only. The historical tar command remains unrecovered. P-12, P-14, and P-18 remain open. Section AH, 18 November 2026, 6:53 AM IST, records the owner's acceptance of the P-12 and P-14 limitations and closes those two items only. P-15 stays closed as the future extraction standard. P-18 stays open because no Storage API credential is available. Full disaster recovery is not complete. Section AI, 18 November 2026, 7:23 AM IST, records the later read-only comparison of the four live Storage objects. `SUPABASE_SECRET_KEY` was present, and its value is not written here. The four live hashes matched Section B and the archive members reconfirmed in Section AF. That comparison closes P-18. No Storage object was uploaded, overwritten, or deleted. Section AJ, 18 November 2026, 7:50 AM IST, records two owner-accepted limitations. P-14 remains the accepted counting limitation and does not satisfy the Section H comparison. The P-11 disposable-test record is accepted as historical evidence only. That acceptance does not supply the missing extraction authorization. The database gate and the Storage gate remain not complete. Full disaster recovery remains not complete. Section AK, 18 November 2026, 8:19 AM IST, records a new read-only Production inventory, one new encrypted logical backup, an isolated restore of that backup, and a new read-only Storage listing. It does not mark either recovery gate complete. Section AL, 18 November 2026, 8:30 AM IST, records the local ciphertext recheck, the absent `tejasdrive` remote, the absent Storage archive, and fail-closed recovery guards. It does not upload a backup, extract an archive, or mark either recovery gate complete. Section AM, 18 November 2026, 8:45 AM IST, records the backup pipeline that runs only after that preflight. The pipeline was not executed against Production. It does not upload a backup, extract an archive, or mark either recovery gate complete. Section AN, 18 November 2026, 8:55 AM IST, records the runner-side rclone install and the fail-closed `tejasdrive` configuration. It does not execute a Production backup or mark either recovery gate complete. Section AO, 18 November 2026, 8:31 PM IST, records the Windows local verification. Section AP, 19 November 2026, records a later read-only Drive listing. It does not decrypt, restore, or mark either recovery gate complete.

This manual describes the verified TEJAS Olympiad Production backup set dated 15–16 November 2026. Revising this draft did not decrypt a backup, query Production, change Supabase, change GitHub, or change Google Drive. The safety-wording revision did not test the proposed checks, did not extract an archive, and did not authorize a remote database connection. Later synthetic tests are recorded in sections M, N, O, P, Q, and S. Phase 2 used disposable data under `/tmp/tejas-dr-phase2-synthetic/`. Phase 3C and Phase 3D used separate disposable directories. When this paragraph was written, the real TEJAS backup files remained **NOT TESTED**. Section T records the later checks. Read section W before running a command. Do not restore again into the database section T already filled.

Read every step by its evidence label:

| Label | Meaning |
| --- | --- |
| Current verified inventory | A read-only audit on 17 November 2026 downloaded the Drive object and matched its size and SHA-256. That audit did not decrypt the object and did not repeat the database restore. |
| Historical verified procedure | The recovery session on 15–16 November 2026 actually ran the step. It was not repeated on 17 November 2026. |
| Synthetic test passed | A disposable test passed on data created for that test. It is not a test of a TEJAS backup, and it does not authorize decryption, extraction, or restore of the real files. |
| Proposed, untested | A safer handling step that has not been run against these backups. Do not describe it as verified. A synthetic result, where one exists, does not change this label for the real backup. |
| OWNER/ADMIN CONFIRMATION REQUIRED | The evidence does not establish the step. Stop and ask the owner before relying on it. |

## A. Purpose and scope

This runbook lets an owner and a technical administrator recover four things:

1. The encrypted Production database backup.
2. The encrypted Production Storage backup.
3. The Age identity needed to decrypt the Storage backup.
4. The four original Storage files inside that archive.

Reading those four Storage files requires extraction. Extraction is not part of the authorization given by this runbook. It requires a separate owner authorization after the section F checker. A checker exit of 0 is not that authorization. Database recovery and Storage recovery are separate. Database recovery can finish without extraction. Storage recovery is not complete until that separate authorization exists and the four files have been verified. This runbook is not a full recovery until both parts are complete. Section R is the decision register. It does not authorize decryption, extraction, restore, or any external service.

The owner decides whether a recovery may proceed and holds the passphrases. The administrator runs the commands on an isolated computer, checks the results, and removes plaintext when the check is finished.

This runbook does not:

- Restore over the live Production database.
- Upload the four Storage files back into Supabase Storage. No such upload command was part of the historical verified procedure.
- Apply pull request #25 or any later migration.
- Replace, delete, or share the original Google Drive backups.
- Store a passphrase, token, or plaintext Age identity in this repository or in Google Drive.

These actions need a separate owner approval even after an isolated recovery succeeds:

- Any write to the Production database, including `pg_restore` against Production.
- Any upload of the four Storage files into Supabase Storage.
- Applying pull request #25 or its migration package.
- Replacing the shared rclone Google OAuth client.

## B. Backup inventory

These values are the current verified inventory from 17 November 2026, except where a row is explicitly marked historical.

Root folder: `TEJAS_PRODUCTION_SECURE_BACKUPS`

Root folder ID: `1O1afC89m69bKA3oOITls6CnCno7s_geR`

The 17 November 2026 audit found only this root folder in the authorized Drive listing, and only the three child folders and four files below. Do not delete anything else that appears later. Confirm it with the owner first.

### Database backup

| Item | Value |
| --- | --- |
| Folder | `TEJAS_PRODUCTION_SECURE_BACKUPS/DATABASE_BACKUPS` |
| Folder ID | `1oJoH0AGnTPjAosDwk9G2FQSLIkOeN8Wx` |
| Filename | `tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump.enc` |
| Drive file ID | `1wgnwJmZgJYOBJ68YDJsohl6Fi08EfJdJ` |
| Size | 476,816 bytes |
| SHA-256 | `49d69874bc494c2c353a903906045ece4ad37c989a69ddaf0ae7195314fcdde1` |
| Encryption | OpenSSL `enc`, AES-256-CBC, with `-pbkdf2` and `-salt` |
| Passphrase variable | `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE` |
| Plaintext checksum | `408b10c3ef0e18bd4cde728afe529a780c7d2af7f83042c16c5faf9fe327e4b8` |
| Plaintext checksum status | Historical verified procedure, 15 November 2026. Not recomputed on 17 November 2026. |
| Plaintext size | Not retained. **UNAVAILABLE**. Do not invent it. |
| Free space required before decryption | Not retained. **OWNER/ADMIN CONFIRMATION REQUIRED**. Stop until the operator has compared free space on the work filesystem with a known plaintext size. Do not invent either figure. |
| Dump format | PostgreSQL custom format |
| Source server | PostgreSQL 17.11 |
| Dump program | pg_dump 17.12 (Ubuntu 17.12-1.pgdg24.04+1) |
| Dump created | 2026-11-15 00:44:17 UTC |
| Drive checksum status | Current verified inventory, 17 November 2026 |
| Isolated restore | Passed on 15 November 2026, 6:23 AM IST. Not repeated on 17 November 2026. |

Section T later measured a plaintext copy of 476,793 bytes, recomputed SHA-256 `408b10c3ef0e18bd4cde728afe529a780c7d2af7f83042c16c5faf9fe327e4b8`, and restored it into local database `tejas_restore_full_20261115` on port `5432`. The cells above that say the size was not retained, or that the plaintext digest and restore were not repeated, describe the inventory before that execution. Do not run `pg_restore` into that existing database.

The verified Drive folder contains this one database file. The backup session also encrypted local companion files whose names ended in `.globals.sql.enc` and `.metadata.json.enc`, using the same passphrase variable. Those companions were not in the Drive folder on 17 November 2026. **OWNER/ADMIN CONFIRMATION REQUIRED** before relying on them: their full filenames and whether any copy still exists outside Drive were not in the verified inventory.

### Storage backup

| Item | Value |
| --- | --- |
| Folder | `TEJAS_PRODUCTION_SECURE_BACKUPS/STORAGE_FILE_BACKUPS` |
| Folder ID | `13ghwE4a6oe153Px38G72V1pJBuHXtAGv` |
| Filename | `tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age` |
| Drive file ID | `1uV_h-jhFRKOV9AAXGBa2OouPvvPzL59H` |
| Size | 555,336 bytes |
| SHA-256 | `ac76e4f8895284f098e0f674d58d8a901702f7b219809a0d51f64b358d7e72c4` |
| Encryption | age v1.3.2 (`filippo.io/age`), using the Age identity file, not a passphrase |
| Drive checksum status | Current verified inventory, 17 November 2026 |
| Inner file hash status | Historical verified procedure, 16 November 2026. Not repeated on 17 November 2026. |

Section T later repeated the four file hashes on extracted copies and then removed those copies. The status cell above describes the inventory before that check. The check was not a Supabase Storage upload.

The four files inside the archive, as hashed on 16 November 2026:

| Path inside the archive | Bytes | SHA-256 |
| --- | --- | --- |
| `tejas-payment-proofs/TEJAS-2026-NS553XMZZG2N8XE7DHV3/receipt.pdf` | 205,575 | `26977633c8fa8c2b3c241a9b0e86113deaf6850718ca14af2ddbedc7ba264b07` |
| `tejas-payment-proofs/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/receipt.jpg` | 320,492 | `171fd8bbc7f14342103ac8589fb5b9f91058178b561a9854b8988d899ee47486` |
| `tejas-registration-files/TEJAS-2026-NS553XMZZG2N8XE7DHV3/upload.xlsx` | 11,160 | `762695a34046feb8e58e364d77b562545d960aec6dc658736c83e020dcff06ad` |
| `tejas-registration-files/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/upload.xlsx` | 11,160 | `762695a34046feb8e58e364d77b562545d960aec6dc658736c83e020dcff06ad` |

The two spreadsheets are separate files with the same bytes and the same SHA-256. That match was an observed result, not a missing file.

### Age identity recovery files

Folder: `TEJAS_PRODUCTION_SECURE_BACKUPS/AGE_KEY_RECOVERY`

Folder ID: `1yOrQCpLvf_RNMgV7l_1-Zv8LqYt2ei2_`

| File | Drive file ID | Bytes | SHA-256 | Passphrase variable |
| --- | --- | --- | --- | --- |
| `tejas-storage-backup.identity.gpg` | `1ehDBTPcEqWFpM1M7ij1kXDKsMvUQB8hB` | 273 | `fd2df7cdfd3041cf33c1bce947af0b90213e449642c58b4d7de1ce1f3fb1ab5b` | `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE` |
| `tejas-storage-backup.identity.owner.gpg` | `1L1u80JBY0qD0PzgTLJW3THfrsw7My_v4` | 248 | `e6f86e98fb5203cf75daa7f8dfa13e6d608f1b71fe8c8f0987eb6d4c5a0945cf` | `TEJAS_BACKUP_OWNER_PASSPHRASE` |

These are different files. Either one, after decryption with its own passphrase, is expected to produce the same Age identity. The historical SHA-256 of that plaintext identity is:

`86ac6f159d6a53449622fa1ba4dccad08dd019ec19b855aa5d79e02ea05996e8`

The original GPG file was created and decrypted on 15–16 November 2026 with GnuPG symmetric AES-256. The owner GPG file was created and decrypted in a later verified session with GnuPG 2.4.4, AES-256, S2K mode 3, SHA-512, and S2K count 65011712. The 17 November audit checked both ciphertext files and did not decrypt them again.

Section T later decrypted the original identity file, matched the plaintext digest above, and unlinked the plaintext. The sentence above describes the inventory check before that execution. Do not decrypt either identity file again from this paragraph.

Keep the plaintext identity only on the recovery computer, in a mode `600` file, and delete it when the Storage check is finished. Do not upload it to Google Drive. Deletion limits are in section K. Removing the file does not promise that an SSD or a cloud disk has forgotten it.

## C. Prerequisites and required tools

The owner provides:

- The two passphrases, through a secure channel that is not ChatGPT, Cursor chat, email, GitHub, or a Google Drive document. The passphrase values are never written into this runbook.
- Approval before any step that would write to Production.
- Confirmation that the passphrases are also stored offline. That offline custody was not verified on 17 November 2026.

The administrator provides an isolated computer with:

| Tool | Version used in the verified procedure | Purpose |
| --- | --- | --- |
| OpenSSL | The `enc` command in section G. A separate version string was not recorded. | Decrypt the database archive |
| GnuPG | 2.4.4 for the owner file. The original file reported AES-256 CFB. | Decrypt one Age identity file |
| age | v1.3.2, `filippo.io/age`. The tested program was `/home/ubuntu/tejas-backups/bin/age`. A future run must use that path after the section F version check. Do not accept another `age` from `PATH`. | Decrypt the Storage archive |
| PostgreSQL 17 client | pg_dump 17.12. Restore tools from `/usr/lib/postgresql/17/bin`. | Inspect and restore the custom dump |
| Isolated PostgreSQL 17 server | The successful test used a local socket on port 5433. Its `version()` string was not recorded. | Receive the restore. This is not Production. |
| `supabase_vault` | 0.3.1, in schema `vault` | Required before the full restore. The first restore failed until this extension existed. |
| rclone | Remote name `tejasdrive` | Download the private Drive copies |
| GNU tar | Used during the historical Storage restore. The exact argument list was not preserved. | Section M records a synthetic GNU tar 1.35 listing test. Extraction of the real archive remains unauthorized. |
| `sha256sum` | Used to check every download | Compare with section B |

`age` and `pg_restore` were not installed on the 17 November audit computer. They must be installed on the recovery computer before those sections are attempted. Phase 3D did not execute the pinned age binary or any `pg_restore` client. Installation remains a recovery-computer prerequisite, not a step performed by this revision.

Phase 2C recorded OpenSSL 3.0.13 for a dummy file-descriptor round trip, and portable PostgreSQL 17.12 for an empty disposable database. Those versions belong to section O. They are not the recorded versions of the 15 November decryption or the historical restore. The historical OpenSSL command remains the `env:` command in section G.

These extensions were recorded for the Production database that matched the successful restore:

| Extension | Version |
| --- | --- |
| `pg_stat_statements` | 1.11 |
| `pgcrypto` | 1.3 |
| `plpgsql` | 1.0 |
| `supabase_vault` | 0.3.1 |
| `uuid-ossp` | 1.1 |

The 15 November comparison result was 5 production extensions and 5 restored extensions, with none missing. The exact package-install commands for the four extensions other than `supabase_vault` were not shown. **OWNER/ADMIN CONFIRMATION REQUIRED** if the isolated server cannot create one of them: stop and install the matching extension rather than skipping objects from the dump.

The verified vault setup that allowed the full restore was:

```sql
CREATE SCHEMA vault;
CREATE EXTENSION supabase_vault WITH SCHEMA vault;
```

The intended disposable database for that historical SQL was `tejas_restore_full_20261115`. A later attempt must name a new empty database before any SQL. `postgres` is not a disposable restore target. Before this SQL, `current_database()` must equal the named disposable database and the psql session must have `ON_ERROR_STOP` on. The historical SQL text above is unchanged. Phase 3D did not execute it.

```bash
require_sql_session() {
  on_error_stop=$1
  expected_db=$2
  actual_db=$3
  if [ "$on_error_stop" != "1" ]; then
    echo "ON_ERROR_STOP is not on; stop"
    exit 1
  fi
  if [ -z "$expected_db" ] || [ -z "$actual_db" ]; then
    echo "database identity is missing; stop"
    exit 1
  fi
  if [ "$expected_db" = "postgres" ] || [ "$actual_db" = "postgres" ]; then
    echo "database postgres is not the disposable restore target; stop"
    exit 1
  fi
  if [ "$actual_db" != "$expected_db" ]; then
    echo "database identity mismatch; stop"
    exit 1
  fi
}
```

The psql invocation that carries `ON_ERROR_STOP` is proposed and was not executed:

```bash
psql -v ON_ERROR_STOP=1 -h /var/run/postgresql -p 5433 -d tejas_restore_full_20261115
```

Change `-d` only to the new empty database that passed `require_sql_session`. Do not point it at Production.

The source used for that extension was tag `v0.3.1`. The compile flags used to build it were not preserved. **OWNER/ADMIN CONFIRMATION REQUIRED** for the build commands if a packaged `supabase_vault` 0.3.1 is not already available.

### Passphrase handling

Three mechanisms appear in the historical verified procedures. A fourth form was tested on dummy data only. They are not interchangeable without a test.

| Mechanism | What it is | Where it was used | Exposure to avoid |
| --- | --- | --- | --- |
| Environment variable | The secret is the value of a named shell variable. | Historical OpenSSL decryption of the database archive, using `-pass env:TEJAS_BACKUP_ENCRYPTION_PASSPHRASE`. | Do not type the value in the command. The value can still be visible to process inspection on the same machine. This method is not completely secret. |
| Protected passphrase file | A mode `600` file that contains the passphrase. | Historical GnuPG decryption of `tejas-storage-backup.identity.gpg`, using `--passphrase-file`. | The file must not be copied into the repository, Drive, a screenshot, or a log. |
| File descriptor | GnuPG reads the passphrase from an open descriptor, not from an argument. | Historical GnuPG decryption of `tejas-storage-backup.identity.owner.gpg`, using `--passphrase-fd`. | Do not put the passphrase after `--passphrase`. |
| OpenSSL file descriptor | OpenSSL reads a passphrase file through `-pass fd:3`. | Phase 2C dummy encrypt and decrypt only. It was not used on this backup. It is not approved for the real archive. | Do not use it for the first recovery of this archive. The historical command remains `-pass env:TEJAS_BACKUP_ENCRYPTION_PASSPHRASE`. |

Rules for every mechanism:

- A secret must never appear in a command-line argument, a log, a screenshot, shell history, or chat.
- The owner must not provide a passphrase through ChatGPT. This runbook never asks for the passphrase value, and the administrator must not print, retrieve, or inspect one.
- An environment variable is not completely secret. While a process is running, its environment can be visible to a sufficiently privileged user or to another process on the same machine. Preserving the historical OpenSSL `env:` command does not mean that method hides the passphrase from local process inspection.
- `set +o history` is a Bash setting. It is proposed practice, and it was not part of the recorded historical commands. It stops Bash from recording later commands in that shell. It does not erase history that was already written, it does not apply to other shells, and it does not guarantee that no history exists. Section N records a synthetic Bash test of that limit. Dash rejected the same option.
- Remove every passphrase file after the command that needed it. See section K. `rm` removes a directory entry. It does not guarantee erasure from an SSD, a cloud disk, a snapshot, or a backup.
- At the end of the session, unset `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE`, `TEJAS_BACKUP_OWNER_PASSPHRASE`, `PGPASSWORD`, and `SUPABASE_BACKUP_DB_URL` if any of them is set. Unsetting `SUPABASE_BACKUP_DB_URL` does not revoke a credential or invalidate the URL. Do not print the value.
- Before finishing, check the shell's history list and the terminal scrollback for an accidental secret. Do not paste that check into chat. If a secret was recorded, tell the owner that exposure may have occurred. **OWNER/ADMIN CONFIRMATION REQUIRED** for how that history is cleared on the particular shell, because no tested cleanup command was recorded.

### Proposed passphrase entry

**OWNER/ADMIN CONFIRMATION REQUIRED.** Section N tested a Bash silent-read shape on dummy variable `DUMMY_PHASE2B_ENTRY`. The tested steps were `set +o history`, `stty -echo`, `IFS= read -r -s`, `export` of that name only, a non-empty check that did not print the value, and `unset`. S03 found no history file. The test did not use a TEJAS passphrase variable, did not save a file from an editor, and did not establish the real passphrase bytes or a trailing newline. No real passphrase was used. The real TEJAS passphrases remain **NOT TESTED**.

This method is a way to type a passphrase without putting the secret in a shell command, a command argument, a log, or shell history. Do not use `echo` or `printf`. Do not run `export NAME=value` with the value typed in the command. Do not print the variable afterward.

The real passphrase bytes remain unknown. That includes whether a trailing newline is present. A normal editor save may append a newline. Do not edit, normalize, trim, or reconstruct the real passphrase, and do not use an editor save to decide its bytes. The empty mode `600` file below is preparation only. The commented editor command is not a byte-exact method.

```bash
umask 077
install -m 600 /dev/null "$work/encryption-passphrase"
# Not a byte-exact method. Do not use an editor save to decide the passphrase bytes.
# nano "$work/encryption-passphrase"
```

Do not run that block until section D has created `work` and defined `require_private_work`. The guarded form is in section D.

Use the same empty-file preparation for `"$work/owner-passphrase"` when that file is the one required. An editor swap or backup file is unexpected. Do not remove it with an unguarded `rm`, and do not add it to the cleanup allow-list. Identify the exact regular-file path inside the private work directory and remove only that explicit path with the section E guard. If its purpose is unclear, stop. The section K inventory still stops while any unexpected file remains. If decryption fails, stop. Do not rewrite the passphrase to guess whether a newline belongs in it.

The historical OpenSSL command needs the environment variable. The proposed Bash entry below reads it silently from the terminal. The secret is not part of the command text. The value is still placed in the process environment, where process inspection on the same machine can reveal it:

```bash
IFS= read -r -s TEJAS_BACKUP_ENCRYPTION_PASSPHRASE < /dev/tty
export TEJAS_BACKUP_ENCRYPTION_PASSPHRASE
```

`read -s` is Bash. It is not a method for other shells. `export` in this form names the variable and does not include the secret. Do not confirm the entry by printing it.

The historical OpenSSL command uses the environment variable's exact value. Do not add a newline to that variable. The historical GnuPG `--passphrase-file` command reads the first line of the file. The recorded evidence does not say whether a trailing newline was part of the stored passphrase. **OWNER/ADMIN CONFIRMATION REQUIRED** if a decryption fails for that reason. Do not guess by rewriting the passphrase. The Phase 2C file-descriptor test used a dummy passphrase and does not authorize `-pass fd:3` for the real archive. The historical `-pass env:TEJAS_BACKUP_ENCRYPTION_PASSPHRASE` command was not run in Phase 3C.

Environment variable names, and nothing else:

| Variable | Used for |
| --- | --- |
| `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE` | Database archive and `tejas-storage-backup.identity.gpg` |
| `TEJAS_BACKUP_OWNER_PASSPHRASE` | `tejas-storage-backup.identity.owner.gpg` only |
| `SUPABASE_BACKUP_DB_URL` | Historical source connection used when the dump was created. It is not a restore target. Section K unsets the name. Unsetting it does not revoke a credential or invalidate the URL. Do not print it, inspect it, copy it, export it, or connect to it. |

Do not print these variables. Do not pass a passphrase as a visible command argument.

## D. Google Drive access and download verification

The verified downloads used the private rclone remote `tejasdrive`. The 17 November configuration of that remote used Google Drive scope `drive.file`. If `tejasdrive` is not available on the recovery computer, stop. **OWNER/ADMIN CONFIRMATION REQUIRED** to authorize rclone again to the same private Google account. Do not create a public link, and do not change sharing on the existing files. Replacing rclone's shared Google client is a separate approval and is not part of this recovery.

On 17 November 2026 every verified folder and file had `shared=false`, was owned by the signed-in account, was not in the trash, and had one permission grant: the owner. There was no anyone, domain, or group grant.

Create a private working directory and download one object at a time:

```bash
umask 077
# Bash only. Not part of the historical download.
# Section N records the synthetic limit: it does not erase history already written.
set +o history
work=$(mktemp -d)
chmod 700 "$work"
install -m 600 /dev/null "$work/.tejas-recovery-workspace"
printf '%s\n' 'tejas-isolated-recovery-workspace' > "$work/.tejas-recovery-workspace"
chmod 600 "$work/.tejas-recovery-workspace"
cd "$work"
```

`set +o history` is proposed Bash practice. It was not part of the historical download commands. It does not erase history that Bash or another shell has already written, it does nothing for a shell that does not implement this option, and it is not a guarantee that the session is absent from history.

The `.tejas-recovery-workspace` file is a fixed marker, not a secret. Section K refuses to delete anything when that marker is missing or when `work` is not a private real directory. Removing a file does not securely erase its bytes.

Every later block that writes under `$work` calls `require_private_work` first. A missing function, an unset or empty `work`, a relative path, `/`, a symlink, a mode other than `700`, or a bad marker stops the block before it writes. Pasting a later block alone fails closed because the function is not defined.

```bash
require_private_work() {
  python3 - << 'PY'
import os, stat, sys
FORBIDDEN = {"/tmp", "/var", "/var/tmp", "/home", "/usr", "/opt", "/dev", "/dev/shm", "/root"}
MARKER = b"tejas-isolated-recovery-workspace\n"
path = os.environ.get("work", "")

def fail(message):
    print(message, file=sys.stderr)
    raise SystemExit(1)

if "work" not in os.environ or path == "":
    fail("work directory is unset or empty")
if not path.startswith("/"):
    fail("work directory is relative")
if path == "/":
    fail("work directory is root")
current = ""
for part in path.split("/"):
    if part == "":
        continue
    if part in (".", ".."):
        fail("work directory has an unexpected path component")
    current += "/" + part
    try:
        st = os.lstat(current)
    except OSError:
        fail("work directory is not an existing real directory")
    if stat.S_ISLNK(st.st_mode):
        fail("work directory path contains a symlink")
    if not stat.S_ISDIR(st.st_mode):
        fail("work directory is not a real directory")
if current in FORBIDDEN or current.count("/") < 2:
    fail("work directory is not a private workspace")
st = os.lstat(current)
if st.st_uid != os.getuid() or stat.S_IMODE(st.st_mode) != 0o700:
    fail("work directory is not a private mode 700 directory")
marker = current + "/.tejas-recovery-workspace"
try:
    marker_stat = os.lstat(marker)
except OSError:
    fail("workspace marker is missing")
if stat.S_ISLNK(marker_stat.st_mode) or not stat.S_ISREG(marker_stat.st_mode):
    fail("workspace marker is not a regular file")
if stat.S_IMODE(marker_stat.st_mode) != 0o600:
    fail("workspace marker mode is not 600")
with open(marker, "rb") as handle:
    if handle.read() != MARKER:
        fail("workspace marker content is unexpected")
PY
}
require_rclone_download() {
  source_path=$1
  dest_path=$2
  if [ -z "${work:-}" ] || [ "$work" = "/" ]; then
    echo "work directory is unset, empty, or root; stop"
    exit 1
  fi
  case "$dest_path" in
    tejasdrive:*) echo "rclone destination is Drive; reversed arguments can upload; stop"; exit 1 ;;
  esac
  case "$source_path" in
    tejasdrive:*) ;;
    *) echo "rclone source is not the Drive remote; stop"; exit 1 ;;
  esac
  case "$dest_path" in
    *"/../"*|*"/.."|".."* ) echo "rclone destination has an unexpected path component; stop"; exit 1 ;;
  esac
  case "$dest_path" in
    "$work"/*) ;;
    *) echo "rclone destination is outside the work directory; stop"; exit 1 ;;
  esac
}
```

Create a passphrase file only after `work` exists:

```bash
set -euo pipefail
require_private_work
umask 077
install -m 600 /dev/null "$work/encryption-passphrase"
install -m 600 /dev/null "$work/owner-passphrase"
```

This comparison is a proposed fail-closed gate. A zero exit from `sha256sum` is not acceptance. The expected value is the fixed section B checksum, not a value taken from the download. Define this function in the same shell before each verification block below. Each verification block also includes it, so a pasted block does not depend on an earlier shell.

```bash
require_sha256() {
  file=$1
  expected=$2
  if [ -z "$file" ] || [ -z "$expected" ]; then
    echo "checksum comparison is missing a file or an expected value; stop"
    exit 1
  fi
  if ! printf '%s' "$expected" | grep -Eq '^[0-9a-f]{64}$'; then
    echo "expected checksum is not 64 lowercase hexadecimal digits; stop"
    exit 1
  fi
  if [ -L "$file" ] || [ ! -f "$file" ] || [ ! -r "$file" ] || [ ! -s "$file" ]; then
    echo "checksum file missing, unreadable, empty, or not a regular file; stop"
    exit 1
  fi
  actual=$(sha256sum -- "$file") || {
    echo "checksum command failed; stop"
    exit 1
  }
  actual=${actual%% *}
  if [ "$actual" != "$expected" ]; then
    echo "checksum mismatch; stop"
    exit 1
  fi
}
```

Database archive. This download shape is the historical verified procedure:

```bash
set -euo pipefail
require_sha256() {
  file=$1
  expected=$2
  if [ -z "$file" ] || [ -z "$expected" ]; then
    echo "checksum comparison is missing a file or an expected value; stop"
    exit 1
  fi
  if ! printf '%s' "$expected" | grep -Eq '^[0-9a-f]{64}$'; then
    echo "expected checksum is not 64 lowercase hexadecimal digits; stop"
    exit 1
  fi
  if [ -L "$file" ] || [ ! -f "$file" ] || [ ! -r "$file" ] || [ ! -s "$file" ]; then
    echo "checksum file missing, unreadable, empty, or not a regular file; stop"
    exit 1
  fi
  actual=$(sha256sum -- "$file") || {
    echo "checksum command failed; stop"
    exit 1
  }
  actual=${actual%% *}
  if [ "$actual" != "$expected" ]; then
    echo "checksum mismatch; stop"
    exit 1
  fi
}
require_private_work
require_rclone_download \
  "tejasdrive:TEJAS_PRODUCTION_SECURE_BACKUPS/DATABASE_BACKUPS/tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump.enc" \
  "$work/tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump.enc"
rclone copyto \
  "tejasdrive:TEJAS_PRODUCTION_SECURE_BACKUPS/DATABASE_BACKUPS/tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump.enc" \
  "$work/tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump.enc"
sha256sum "$work/tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump.enc"
require_sha256 \
  "$work/tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump.enc" \
  "49d69874bc494c2c353a903906045ece4ad37c989a69ddaf0ae7195314fcdde1"
```

Storage archive:

```bash
set -euo pipefail
require_sha256() {
  file=$1
  expected=$2
  if [ -z "$file" ] || [ -z "$expected" ]; then
    echo "checksum comparison is missing a file or an expected value; stop"
    exit 1
  fi
  if ! printf '%s' "$expected" | grep -Eq '^[0-9a-f]{64}$'; then
    echo "expected checksum is not 64 lowercase hexadecimal digits; stop"
    exit 1
  fi
  if [ -L "$file" ] || [ ! -f "$file" ] || [ ! -r "$file" ] || [ ! -s "$file" ]; then
    echo "checksum file missing, unreadable, empty, or not a regular file; stop"
    exit 1
  fi
  actual=$(sha256sum -- "$file") || {
    echo "checksum command failed; stop"
    exit 1
  }
  actual=${actual%% *}
  if [ "$actual" != "$expected" ]; then
    echo "checksum mismatch; stop"
    exit 1
  fi
}
require_private_work
require_rclone_download \
  "tejasdrive:TEJAS_PRODUCTION_SECURE_BACKUPS/STORAGE_FILE_BACKUPS/tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age" \
  "$work/tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age"
rclone copyto \
  "tejasdrive:TEJAS_PRODUCTION_SECURE_BACKUPS/STORAGE_FILE_BACKUPS/tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age" \
  "$work/tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age"
sha256sum "$work/tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age"
require_sha256 \
  "$work/tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age" \
  "ac76e4f8895284f098e0f674d58d8a901702f7b219809a0d51f64b358d7e72c4"
```

Original identity file:

```bash
set -euo pipefail
require_sha256() {
  file=$1
  expected=$2
  if [ -z "$file" ] || [ -z "$expected" ]; then
    echo "checksum comparison is missing a file or an expected value; stop"
    exit 1
  fi
  if ! printf '%s' "$expected" | grep -Eq '^[0-9a-f]{64}$'; then
    echo "expected checksum is not 64 lowercase hexadecimal digits; stop"
    exit 1
  fi
  if [ -L "$file" ] || [ ! -f "$file" ] || [ ! -r "$file" ] || [ ! -s "$file" ]; then
    echo "checksum file missing, unreadable, empty, or not a regular file; stop"
    exit 1
  fi
  actual=$(sha256sum -- "$file") || {
    echo "checksum command failed; stop"
    exit 1
  }
  actual=${actual%% *}
  if [ "$actual" != "$expected" ]; then
    echo "checksum mismatch; stop"
    exit 1
  fi
}
require_private_work
require_rclone_download \
  "tejasdrive:TEJAS_PRODUCTION_SECURE_BACKUPS/AGE_KEY_RECOVERY/tejas-storage-backup.identity.gpg" \
  "$work/tejas-storage-backup.identity.gpg"
rclone copyto \
  "tejasdrive:TEJAS_PRODUCTION_SECURE_BACKUPS/AGE_KEY_RECOVERY/tejas-storage-backup.identity.gpg" \
  "$work/tejas-storage-backup.identity.gpg"
sha256sum "$work/tejas-storage-backup.identity.gpg"
require_sha256 \
  "$work/tejas-storage-backup.identity.gpg" \
  "fd2df7cdfd3041cf33c1bce947af0b90213e449642c58b4d7de1ce1f3fb1ab5b"
```

Owner identity file, if the original identity passphrase is unavailable:

```bash
set -euo pipefail
require_sha256() {
  file=$1
  expected=$2
  if [ -z "$file" ] || [ -z "$expected" ]; then
    echo "checksum comparison is missing a file or an expected value; stop"
    exit 1
  fi
  if ! printf '%s' "$expected" | grep -Eq '^[0-9a-f]{64}$'; then
    echo "expected checksum is not 64 lowercase hexadecimal digits; stop"
    exit 1
  fi
  if [ -L "$file" ] || [ ! -f "$file" ] || [ ! -r "$file" ] || [ ! -s "$file" ]; then
    echo "checksum file missing, unreadable, empty, or not a regular file; stop"
    exit 1
  fi
  actual=$(sha256sum -- "$file") || {
    echo "checksum command failed; stop"
    exit 1
  }
  actual=${actual%% *}
  if [ "$actual" != "$expected" ]; then
    echo "checksum mismatch; stop"
    exit 1
  fi
}
require_private_work
require_rclone_download \
  "tejasdrive:TEJAS_PRODUCTION_SECURE_BACKUPS/AGE_KEY_RECOVERY/tejas-storage-backup.identity.owner.gpg" \
  "$work/tejas-storage-backup.identity.owner.gpg"
rclone copyto \
  "tejasdrive:TEJAS_PRODUCTION_SECURE_BACKUPS/AGE_KEY_RECOVERY/tejas-storage-backup.identity.owner.gpg" \
  "$work/tejas-storage-backup.identity.owner.gpg"
sha256sum "$work/tejas-storage-backup.identity.owner.gpg"
require_sha256 \
  "$work/tejas-storage-backup.identity.owner.gpg" \
  "e6f86e98fb5203cf75daa7f8dfa13e6d608f1b71fe8c8f0987eb6d4c5a0945cf"
```

`require_sha256` exits non-zero on a missing, unreadable, empty, or mismatched file. Do not start the next block after a non-zero exit. `set -e` remains in effect in that shell. The `rclone copyto` form above is the download shape that was used. In that form the first path is the source and the second path is the destination. Reversing them can upload a local file to Drive and can overwrite a Drive object. `rclone copy` and `rclone sync` toward `tejasdrive:` can do the same. This phase did not run rclone and did not contact Google Drive.

Each download block above calls `require_private_work` and `require_rclone_download` before `rclone copyto`. The source must begin with `tejasdrive:`. The destination must be inside the marked work directory, must not begin with `tejasdrive:`, and must not contain `..`. An empty `work` must not make the destination a path at `/`. A later read-only listing, if the owner authorizes one, uses the remote path as the only object argument. It is not a substitute for the section B checksum, and it is not authorized by this phase.

Keep the encrypted downloads until the owner accepts the result. Section K checks that they are still intact after plaintext is removed.

## E. GPG recovery of the Age identity

Recover the identity before decrypting the Storage archive. Use only one of the two GPG files. They require different passphrases.

The owner supplies the chosen passphrase on the recovery computer, not through ChatGPT or any other chat. Section C records what the dummy silent-read tested and what it did not test. Use that silent-read shape only for a passphrase the owner supplies on this computer. Do not use the commented editor command to decide passphrase bytes. The administrator does not echo it, hash it, screenshot it, print it, or put it after a command flag as text.

### Original recovery file

This is the historical verified procedure for the file created and decrypted on 15–16 November 2026. It uses `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE` through `--passphrase-file` and a mode `600` file:

```bash
set -euo pipefail
umask 077
require_sha256() {
  file=$1
  expected=$2
  if [ -z "$file" ] || [ -z "$expected" ]; then
    echo "checksum comparison is missing a file or an expected value; stop"
    exit 1
  fi
  if ! printf '%s' "$expected" | grep -Eq '^[0-9a-f]{64}$'; then
    echo "expected checksum is not 64 lowercase hexadecimal digits; stop"
    exit 1
  fi
  if [ -L "$file" ] || [ ! -f "$file" ] || [ ! -r "$file" ] || [ ! -s "$file" ]; then
    echo "checksum file missing, unreadable, empty, or not a regular file; stop"
    exit 1
  fi
  actual=$(sha256sum -- "$file") || {
    echo "checksum command failed; stop"
    exit 1
  }
  actual=${actual%% *}
  if [ "$actual" != "$expected" ]; then
    echo "checksum mismatch; stop"
    exit 1
  fi
}
require_private_work
gpg --batch --yes --pinentry-mode loopback \
  --passphrase-file "$work/encryption-passphrase" \
  --output "$work/tejas-storage-backup.identity" \
  --decrypt "$work/tejas-storage-backup.identity.gpg"
chmod 600 "$work/tejas-storage-backup.identity"
sha256sum "$work/tejas-storage-backup.identity"
require_sha256 \
  "$work/tejas-storage-backup.identity" \
  "86ac6f159d6a53449622fa1ba4dccad08dd019ec19b855aa5d79e02ea05996e8"
```

The creation command also included `--cipher-algo AES256` and `--symmetric`. Those flags are for creating the file. Decryption does not need them. `--s2k-mode`, `--s2k-digest-algo`, and `--s2k-count` were not shown for this original file.

### Owner recovery file

Use this file when the owner supplies `TEJAS_BACKUP_OWNER_PASSPHRASE` instead. This is the historical verified procedure. The passphrase is passed on file descriptor 3, not as a command argument. The verified file uses AES-256 and S2K mode 3 with SHA-512 and count 65011712. Those S2K settings are already inside the file. The decrypt command does not repeat them:

```bash
set -euo pipefail
umask 077
require_sha256() {
  file=$1
  expected=$2
  if [ -z "$file" ] || [ -z "$expected" ]; then
    echo "checksum comparison is missing a file or an expected value; stop"
    exit 1
  fi
  if ! printf '%s' "$expected" | grep -Eq '^[0-9a-f]{64}$'; then
    echo "expected checksum is not 64 lowercase hexadecimal digits; stop"
    exit 1
  fi
  if [ -L "$file" ] || [ ! -f "$file" ] || [ ! -r "$file" ] || [ ! -s "$file" ]; then
    echo "checksum file missing, unreadable, empty, or not a regular file; stop"
    exit 1
  fi
  actual=$(sha256sum -- "$file") || {
    echo "checksum command failed; stop"
    exit 1
  }
  actual=${actual%% *}
  if [ "$actual" != "$expected" ]; then
    echo "checksum mismatch; stop"
    exit 1
  fi
}
require_private_work
gpg --batch --yes --pinentry-mode loopback \
  --passphrase-fd 3 \
  --output "$work/tejas-storage-backup.identity" \
  --decrypt "$work/tejas-storage-backup.identity.owner.gpg" \
  3< "$work/owner-passphrase"
chmod 600 "$work/tejas-storage-backup.identity"
sha256sum "$work/tejas-storage-backup.identity"
require_sha256 \
  "$work/tejas-storage-backup.identity" \
  "86ac6f159d6a53449622fa1ba4dccad08dd019ec19b855aa5d79e02ea05996e8"
```

For either file, continue only when the SHA-256 is exactly:

`86ac6f159d6a53449622fa1ba4dccad08dd019ec19b855aa5d79e02ea05996e8`

If GnuPG reports a bad passphrase, stop and ask the owner to check which passphrase was supplied. Do not try the other passphrase by guessing. The owner may choose the other GPG file and its matching passphrase.

Remove the passphrase file as soon as decryption succeeds. Keep the identity file only until section F is finished. Unlinking does not guarantee secure erasure. The old unguarded `rm -f "$work/encryption-passphrase" "$work/owner-passphrase"` is withdrawn. With an empty `work` it named `/encryption-passphrase` and `/owner-passphrase`. It also followed a symlinked work directory. It did not name an encrypted original, but it had no workspace check.

The replacement unlinks only those two names when they are regular files inside the private work directory. It does not remove a `.dump.enc`, `.tar.age`, or `.gpg` original. A symlink, a relative path, an unset `work`, or a target outside the workspace stops it before any unlink.

```bash
set -euo pipefail
python3 - << 'PY'
import os, stat, sys
FILES = ["encryption-passphrase", "owner-passphrase"]
FORBIDDEN = {"/tmp", "/var", "/var/tmp", "/home", "/usr", "/opt", "/dev", "/dev/shm", "/root"}
MARKER = b"tejas-isolated-recovery-workspace\n"

def fail(message):
    print(message, file=sys.stderr)
    raise SystemExit(1)

def private_work(path):
    if "work" not in os.environ or path == "":
        fail("work directory is unset or empty")
    if not path.startswith("/") or path == "/":
        fail("work directory is relative or root")
    current = ""
    for part in path.split("/"):
        if part == "":
            continue
        if part in (".", ".."):
            fail("work directory has an unexpected path component")
        current += "/" + part
        try:
            st = os.lstat(current)
        except OSError:
            fail("work directory is not an existing real directory")
        if stat.S_ISLNK(st.st_mode) or not stat.S_ISDIR(st.st_mode):
            fail("work directory path contains a symlink or a non-directory")
    if current in FORBIDDEN or current.count("/") < 2:
        fail("work directory is not a private workspace")
    st = os.lstat(current)
    if st.st_uid != os.getuid() or stat.S_IMODE(st.st_mode) != 0o700:
        fail("work directory is not a private mode 700 directory")
    marker = current + "/.tejas-recovery-workspace"
    try:
        marker_stat = os.lstat(marker)
    except OSError:
        fail("workspace marker is missing")
    if stat.S_ISLNK(marker_stat.st_mode) or not stat.S_ISREG(marker_stat.st_mode):
        fail("workspace marker is not a regular file")
    if stat.S_IMODE(marker_stat.st_mode) != 0o600:
        fail("workspace marker mode is not 600")
    with open(marker, "rb") as handle:
        if handle.read() != MARKER:
            fail("workspace marker content is unexpected")
    return current

def inside(work, rel):
    if rel.startswith("/") or rel in ("", ".", "..") or "\\" in rel:
        fail("deletion target is not an explicit relative path")
    path = work + "/" + rel
    if not path.startswith(work + "/"):
        fail("deletion target is outside the work directory")
    return path

work = private_work(os.environ.get("work", ""))
planned = []
for rel in FILES:
    path = inside(work, rel)
    if not os.path.lexists(path):
        continue
    st = os.lstat(path)
    if stat.S_ISLNK(st.st_mode) or not stat.S_ISREG(st.st_mode):
        fail("passphrase path is a symlink or not a regular file")
    if st.st_nlink != 1:
        fail("passphrase path has another hard link; stop")
    if path in (work + "/tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump.enc",
                work + "/tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age",
                work + "/tejas-storage-backup.identity.gpg",
                work + "/tejas-storage-backup.identity.owner.gpg"):
        fail("refusing to unlink an encrypted original")
    planned.append(path)
for path in planned:
    os.unlink(path)
PY
```

Section K is the full cleanup. It also unsets the shell variables.

## F. Age decryption of the Storage archive

The historical verified decryption used the identity file and did not use an age passphrase. The tested program was age v1.3.2 at `/home/ubuntu/tejas-backups/bin/age`. This is the historical command. Its arguments are unchanged. Do not run the name `age` from `PATH`.

```bash
age -d \
  -i "$work/tejas-storage-backup.identity" \
  -o "$work/archive.tar" \
  "$work/tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age"
```

Before a future decryption, require that exact path and version. Phase 3D tested this guard with disposable programs. It did not execute the pinned binary and did not decrypt a TEJAS archive. Accepted version output is exactly `v1.3.2`, with or without one trailing newline. Any other output stops the procedure.

```bash
require_exact_age_version() {
  bin=$1
  if [ -L "$bin" ] || [ ! -f "$bin" ] || [ ! -x "$bin" ]; then
    echo "age binary is missing, not a regular executable, or is a symlink; stop"
    exit 1
  fi
  age_version=$("$bin" --version 2>&1) || {
    echo "age version check failed; stop"
    exit 1
  }
  age_version=${age_version%$'\n'}
  if [ "$age_version" != "v1.3.2" ]; then
    echo "age version is not v1.3.2; stop"
    exit 1
  fi
}
require_pinned_age() {
  if [ "$1" != "/home/ubuntu/tejas-backups/bin/age" ]; then
    echo "age path is not the pinned binary; stop"
    exit 1
  fi
  require_exact_age_version "$1"
}
```

A future decryption uses the pinned binary and the same arguments. The version check is in the same block, so a mismatch stops before decryption. This form was not run in Phase 3D:

```bash
set -euo pipefail
require_private_work
age_bin=/home/ubuntu/tejas-backups/bin/age
require_pinned_age "$age_bin"
"$age_bin" -d \
  -i "$work/tejas-storage-backup.identity" \
  -o "$work/archive.tar" \
  "$work/tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age"
```

The historical session then extracted the tar and hashed the four members. The exact `tar` argument list was not preserved. That historical extraction is not a tested safe-member inspection. Matching the four hashes shows that those four files were present. It does not show that the archive was checked for dangerous members.

### Proposed inspection before extraction

**Synthetic listing test passed. See section M. The real Storage archive remains NOT TESTED. OWNER/ADMIN CONFIRMATION REQUIRED before extraction.**

Reading `tar -tf` or `tar -tvf` by eye is not mechanical validation. A visual reading can miss an absolute path, a `..` segment, a duplicate name, a symbolic link, a hard link, a device, a FIFO, or an extra member. Do not treat a visual reading as a pass, and do not extract on the basis of one.

The procedure below has not been run against `tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age`. It is not a historical verified procedure. A zero exit from it is not approval to extract. Section M records the disposable-archive test. Do not extract this archive until the owner/admin records a separate approval after that test. The real archive remains **NOT TESTED**.

If GNU tar rejects `--quoting-style=escape`, stop. Do not drop the option and extract. Do not pipe `tar` into another program. A pipe can hide a non-zero exit status.

The proposed checker fails closed. It must exit non-zero, and extraction must not begin, when any of these is true:

- Either listing command exits non-zero, produces no members, or omits a final newline.
- The name listing and the verbose listing do not have the same count.
- A name is absolute, including a leading `/`, a leading `\`, or a drive-style `:` prefix.
- A name contains an empty segment, a `.` segment, or a `..` segment.
- The same name appears more than once.
- A name is not one of the four expected regular files and is not one of their expected parent directories.
- One of the four expected regular files is missing.
- A verbose line does not end with the matching member name.
- A verbose line begins with any type other than `-` for a required regular file or `d` for an allowed parent directory. That rejects a symbolic link, a hard link shown with another type letter, a device, a FIFO, a socket, and any other special file.
- A verbose line contains ` -> ` or ` link to `.

The only acceptable names are:

| Kind | Acceptable name |
| --- | --- |
| Directory | `tejas-payment-proofs` or `tejas-payment-proofs/` |
| Directory | `tejas-payment-proofs/TEJAS-2026-NS553XMZZG2N8XE7DHV3` or the same path with a trailing slash |
| Directory | `tejas-payment-proofs/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ` or the same path with a trailing slash |
| Directory | `tejas-registration-files` or `tejas-registration-files/` |
| Directory | `tejas-registration-files/TEJAS-2026-NS553XMZZG2N8XE7DHV3` or the same path with a trailing slash |
| Directory | `tejas-registration-files/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ` or the same path with a trailing slash |
| Regular file | `tejas-payment-proofs/TEJAS-2026-NS553XMZZG2N8XE7DHV3/receipt.pdf` |
| Regular file | `tejas-payment-proofs/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/receipt.jpg` |
| Regular file | `tejas-registration-files/TEJAS-2026-NS553XMZZG2N8XE7DHV3/upload.xlsx` |
| Regular file | `tejas-registration-files/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/upload.xlsx` |

Directory entries are optional. Each of the four regular files is mandatory and may appear only once. The historical archive listing was not preserved member by member, so this allow-list is derived from the four verified file paths. **OWNER/ADMIN CONFIRMATION REQUIRED** if the real archive contains an extra directory name that this table does not list. Do not extract it while that confirmation is missing.

This proposed script lists members and checks those conditions. It does not extract. Section M ran it with GNU tar 1.35 on synthetic archives. GNU tar showed the hard-link member with type `h` and the text ` link to `, and the checker rejected it. A successful exit is not proof that the real archive is safe, and it is not approval to extract:

```bash
tar --quoting-style=escape -tf "$work/archive.tar" > "$work/tar-names.txt"
tar_names_exit=$?
tar --quoting-style=escape -tvf "$work/archive.tar" > "$work/tar-verbose.txt"
tar_verbose_exit=$?
if [ "$tar_names_exit" -ne 0 ] || [ "$tar_verbose_exit" -ne 0 ]; then
  echo "tar listing failed; fail closed; do not extract"
  exit 1
fi
python3 - "$work/tar-names.txt" "$work/tar-verbose.txt" << 'PY'
import sys
from pathlib import Path

def fail(message):
    print(message, file=sys.stderr)
    raise SystemExit(1)

def lines(path):
    data = Path(path).read_bytes()
    if not data.endswith(b"\n"):
        fail("listing has no final newline")
    parts = data.split(b"\n")[:-1]
    if any(part == b"" for part in parts):
        fail("empty listing line")
    return parts

names = lines(sys.argv[1])
verbose = lines(sys.argv[2])
if len(names) != len(verbose):
    fail("name count does not match verbose count")
if not names:
    fail("empty archive listing")

files = {
    b"tejas-payment-proofs/TEJAS-2026-NS553XMZZG2N8XE7DHV3/receipt.pdf",
    b"tejas-payment-proofs/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/receipt.jpg",
    b"tejas-registration-files/TEJAS-2026-NS553XMZZG2N8XE7DHV3/upload.xlsx",
    b"tejas-registration-files/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/upload.xlsx",
}
directories = {
    b"tejas-payment-proofs",
    b"tejas-payment-proofs/",
    b"tejas-payment-proofs/TEJAS-2026-NS553XMZZG2N8XE7DHV3",
    b"tejas-payment-proofs/TEJAS-2026-NS553XMZZG2N8XE7DHV3/",
    b"tejas-payment-proofs/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ",
    b"tejas-payment-proofs/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/",
    b"tejas-registration-files",
    b"tejas-registration-files/",
    b"tejas-registration-files/TEJAS-2026-NS553XMZZG2N8XE7DHV3",
    b"tejas-registration-files/TEJAS-2026-NS553XMZZG2N8XE7DHV3/",
    b"tejas-registration-files/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ",
    b"tejas-registration-files/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/",
}
allowed = files.union(directories)
seen = set()
for name in names:
    if name in seen:
        fail("duplicate name")
    seen.add(name)
    if name not in allowed or name.startswith((b"/", b"\\")) or b":" in name or b"\x00" in name:
        fail("unexpected or unsafe member name")
    parts = [part for part in name.split(b"/") if part != b""]
    if any(part in (b"..", b".") for part in parts):
        fail("path traversal")
if any(name not in seen for name in files):
    fail("required regular file missing")

for name, line in zip(names, verbose):
    if b" -> " in line or b" link to " in line:
        fail("link member")
    if not line.endswith(b" " + name):
        fail("verbose line does not end with the member name")
    kind = line[:1]
    if name in files and kind != b"-":
        fail("required path is not a regular file")
    if name in directories and kind != b"d":
        fail("directory path has an unexpected type")
    if kind not in (b"-", b"d"):
        fail("unexpected member type")
print("proposed check exited 0; this is not approval to extract")
PY
checker_exit=$?
if [ "$checker_exit" -ne 0 ]; then
  echo "archive checker failed; stop; do not extract"
  exit "$checker_exit"
fi
python3 - "$work/archive.tar" "$work/checker-archive-id" << 'PY'
import os, stat, sys
archive, record = sys.argv[1], sys.argv[2]
if os.path.islink(archive) or not os.path.isfile(archive):
    print("checker archive is missing or not a regular file; stop", file=sys.stderr)
    raise SystemExit(1)
st = os.lstat(archive)
if not stat.S_ISREG(st.st_mode):
    print("checker archive is not a regular file; stop", file=sys.stderr)
    raise SystemExit(1)
with open(record, "w", encoding="ascii") as handle:
    handle.write(f"{st.st_dev} {st.st_ino}\n")
PY
```

### Extraction is not authorized

Do not run `tar -x` on the real TEJAS archive. The historical extraction command was not preserved. Section M did not extract any archive. Phase 3C tested the guard below on disposable synthetic archives only. Those tests stopped absolute-path, traversal, symlink, hard-link, and duplicate members before `tar` ran. GNU tar's behavior on those members remains **UNTESTED**. A checker exit of 0 is not approval to extract the real archive. The real archive remains **NOT TESTED**. This block is not authorized for it.

```bash
set -euo pipefail
require_private_work
if [ "${checker_exit:-}" != "0" ]; then
  echo "archive checker exit is not exactly 0; stop"
  exit 1
fi
dest="$work/extracted"
if [ "$dest" = "/" ] || [ "$dest" = "$work" ]; then
  echo "extraction destination is not allowed; stop"
  exit 1
fi
python3 - "$work" "$work/archive.tar" "$work/checker-archive-id" "$dest" << 'PY'
import os, stat, sys
work, archive, record, dest = sys.argv[1:]

def fail(message):
    print(message, file=sys.stderr)
    raise SystemExit(1)

def real_directory(path):
    if not path.startswith("/") or path == "/":
        fail("path is not an absolute private directory")
    current = ""
    for part in path.split("/"):
        if part == "":
            continue
        if part in (".", ".."):
            fail("path has an unexpected component")
        current += "/" + part
        try:
            st = os.lstat(current)
        except OSError:
            fail("path is not an existing real directory")
        if stat.S_ISLNK(st.st_mode) or not stat.S_ISDIR(st.st_mode):
            fail("path contains a symlink or a non-directory")
    return current

work = real_directory(work)
marker = work + "/.tejas-recovery-workspace"
try:
    marker_stat = os.lstat(marker)
except OSError:
    fail("workspace marker is missing")
if stat.S_ISLNK(marker_stat.st_mode) or not stat.S_ISREG(marker_stat.st_mode):
    fail("workspace marker is not a regular file")
if os.lstat(work).st_uid != os.getuid() or stat.S_IMODE(os.lstat(work).st_mode) != 0o700:
    fail("work directory is not a private mode 700 directory")
with open(marker, "rb") as handle:
    if handle.read() != b"tejas-isolated-recovery-workspace\n":
        fail("workspace marker content is unexpected")
if os.path.islink(archive) or not os.path.isfile(archive):
    fail("archive is missing or not a regular file")
archive_stat = os.lstat(archive)
if not stat.S_ISREG(archive_stat.st_mode):
    fail("archive is not a regular file")
if not archive.startswith(work + "/"):
    fail("archive is outside the work directory")
try:
    recorded = open(record, "r", encoding="ascii").read()
except OSError:
    fail("checker archive identity is missing")
if recorded != f"{archive_stat.st_dev} {archive_stat.st_ino}\n":
    fail("extraction archive is not the archive that passed the checker")
if os.path.lexists(dest):
    fail("destination already exists; stop before extraction")
parent = dest.rsplit("/", 1)[0]
if parent != work:
    fail("destination is not directly inside the work directory")
if os.path.islink(parent):
    fail("destination parent is a symlink")
PY
if ! mkdir -m 700 "$dest"; then
  echo "mkdir failed; stop"
  exit 1
fi
if [ -L "$dest" ] || [ ! -d "$dest" ]; then
  echo "destination is not a real directory; stop"
  exit 1
fi
if [ -n "$(find "$dest" -mindepth 1 -print -quit)" ]; then
  echo "destination is not empty; stop"
  exit 1
fi
tar --no-wildcards --no-overwrite-dir \
  -x -f "$work/archive.tar" \
  -C "$dest" \
  -- \
  "tejas-payment-proofs/TEJAS-2026-NS553XMZZG2N8XE7DHV3/receipt.pdf" \
  "tejas-payment-proofs/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/receipt.jpg" \
  "tejas-registration-files/TEJAS-2026-NS553XMZZG2N8XE7DHV3/upload.xlsx" \
  "tejas-registration-files/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/upload.xlsx"
```

GNU tar 1.35 rejected `--no-absolute-names` as an unrecognized option, so that option is not part of this command. Do not add `--absolute-names` or `-P`. On the clean disposable archive, the command used `--no-wildcards` and `--no-overwrite-dir` and wrote only inside the new destination. Those options were not what stopped an absolute path, a traversal name, a symlink, a hard link, or a duplicate member. Those members were stopped by the checker before `tar` ran. When this paragraph was written, their extraction behavior remained **UNTESTED**. Section T later recorded GNU tar 1.35 behavior on disposable archives. Those results do not change this command, and they do not authorize extraction of an unsafe member from the TEJAS archive.

### File-type inventory before any hash

**Synthetic inventory behavior passed. See section N. When this paragraph was written, a real TEJAS extract remained NOT TESTED.** Section T later extracted the four named files, checked their digests, and removed the copies. Do not extract them again from this paragraph. This sequence is not a Supabase Storage upload. `sha256sum` follows symbolic links. A hash is not a file-type check, and it must not be used to decide whether a path is a regular file. A symlink can make `sha256sum` read a file outside the extract directory.

After a future approved extraction, use this order and stop at the first failure:

1. Inventory every object under `$work/extracted` without following symlinks. GNU `find -printf` passed on the synthetic fixtures in section N. If it is unavailable, stop. Do not substitute `sha256sum`.
2. Stop if any object is a symlink, FIFO, socket, device, or any type other than a directory or a regular file.
3. Stop if any path is not one of the two Storage directories, `tejas-payment-proofs` and `tejas-registration-files`, their expected parent directories, or the four regular files in section B. An unexpected object of any type is a stop.
4. Only after that inventory matches, calculate the four SHA-256 values and compare them with section B.

```bash
find "$work/extracted" -mindepth 1 -printf '%y %p\n'
```

The type letter is `f` for a regular file, `d` for a directory, and `l` for a symlink. Any `l`, `p`, `s`, `b`, `c`, or other letter is a stop. Do not continue to the hash command.

```bash
set -euo pipefail
require_sha256() {
  file=$1
  expected=$2
  if [ -z "$file" ] || [ -z "$expected" ]; then
    echo "checksum comparison is missing a file or an expected value; stop"
    exit 1
  fi
  if ! printf '%s' "$expected" | grep -Eq '^[0-9a-f]{64}$'; then
    echo "expected checksum is not 64 lowercase hexadecimal digits; stop"
    exit 1
  fi
  if [ -L "$file" ] || [ ! -f "$file" ] || [ ! -r "$file" ] || [ ! -s "$file" ]; then
    echo "checksum file missing, unreadable, empty, or not a regular file; stop"
    exit 1
  fi
  actual=$(sha256sum -- "$file") || {
    echo "checksum command failed; stop"
    exit 1
  }
  actual=${actual%% *}
  if [ "$actual" != "$expected" ]; then
    echo "checksum mismatch; stop"
    exit 1
  fi
}
require_private_work
sha256sum \
  "$work/extracted/tejas-payment-proofs/TEJAS-2026-NS553XMZZG2N8XE7DHV3/receipt.pdf" \
  "$work/extracted/tejas-payment-proofs/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/receipt.jpg" \
  "$work/extracted/tejas-registration-files/TEJAS-2026-NS553XMZZG2N8XE7DHV3/upload.xlsx" \
  "$work/extracted/tejas-registration-files/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/upload.xlsx"
require_sha256 \
  "$work/extracted/tejas-payment-proofs/TEJAS-2026-NS553XMZZG2N8XE7DHV3/receipt.pdf" \
  "26977633c8fa8c2b3c241a9b0e86113deaf6850718ca14af2ddbedc7ba264b07"
require_sha256 \
  "$work/extracted/tejas-payment-proofs/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/receipt.jpg" \
  "171fd8bbc7f14342103ac8589fb5b9f91058178b561a9854b8988d899ee47486"
require_sha256 \
  "$work/extracted/tejas-registration-files/TEJAS-2026-NS553XMZZG2N8XE7DHV3/upload.xlsx" \
  "762695a34046feb8e58e364d77b562545d960aec6dc658736c83e020dcff06ad"
require_sha256 \
  "$work/extracted/tejas-registration-files/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/upload.xlsx" \
  "762695a34046feb8e58e364d77b562545d960aec6dc658736c83e020dcff06ad"
```

`require_sha256` exits non-zero when a hash differs from section B. Do not start the next block after that exit. Also stop if any size differs from section B. The historical verified procedure stopped after its own hash comparison. It did not upload the four files to Supabase Storage. This later hash command is not that historical extraction, and it is not authorized now.

**OWNER/ADMIN CONFIRMATION REQUIRED** before any Supabase Storage upload. No verified command, bucket API call, or service-role step was recorded for putting these four objects back. A future upload needs a separate owner approval, confirmation that the buckets are still private, and a check that an existing object will not be overwritten by accident.

Section K is the cleanup. Do not delete the downloaded `.tar.age` until the owner accepts the result. Do not delete the Drive original. Cleanup must still remove `tejas-payment-proofs` and `tejas-registration-files` if either name exists in the work directory.

## G. Database archive decryption and isolated restore

Restore first into an empty local database. The commands in this section are not commands against Production.

### Historical decryption

This is the historical verified procedure. The passphrase is taken from the environment variable. Do not place the passphrase text after `-pass`. An earlier round-trip test omitted `-salt` on decrypt. The restore decryption that was actually used included `-salt`, and that is the historical command:

```bash
set -euo pipefail
require_sha256() {
  file=$1
  expected=$2
  if [ -z "$file" ] || [ -z "$expected" ]; then
    echo "checksum comparison is missing a file or an expected value; stop"
    exit 1
  fi
  if ! printf '%s' "$expected" | grep -Eq '^[0-9a-f]{64}$'; then
    echo "expected checksum is not 64 lowercase hexadecimal digits; stop"
    exit 1
  fi
  if [ -L "$file" ] || [ ! -f "$file" ] || [ ! -r "$file" ] || [ ! -s "$file" ]; then
    echo "checksum file missing, unreadable, empty, or not a regular file; stop"
    exit 1
  fi
  actual=$(sha256sum -- "$file") || {
    echo "checksum command failed; stop"
    exit 1
  }
  actual=${actual%% *}
  if [ "$actual" != "$expected" ]; then
    echo "checksum mismatch; stop"
    exit 1
  fi
}
require_private_work
openssl enc -d -aes-256-cbc -pbkdf2 -salt \
  -pass env:TEJAS_BACKUP_ENCRYPTION_PASSPHRASE \
  -in "$work/tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump.enc" \
  -out "$work/tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump"
chmod 600 "$work/tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump"
sha256sum "$work/tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump"
require_sha256 \
  "$work/tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump" \
  "408b10c3ef0e18bd4cde728afe529a780c7d2af7f83042c16c5faf9fe327e4b8"
```

This historical command reads the passphrase from the environment. That is not completely secret. A sufficiently privileged user, or another process on the same machine, can inspect the environment of the `openssl` process while it is running. The command is preserved because it is the historical verified procedure, not because the environment hides the passphrase. Do not place the passphrase text after `-pass` or anywhere else in the command.

### Proposed OpenSSL file-descriptor method

**Synthetic test passed on dummy data. See section O. The real archive remains NOT TESTED. Do not use this form for the first recovery of this archive.**

This is not a replacement for the historical command above. OpenSSL can read a passphrase from a file descriptor with `-pass fd:3`. That form was not used on this backup. Section O records a dummy encrypt and decrypt with OpenSSL 3.0.13. It did not execute the historical `env:` command, and it did not compare the two forms on a copy of this encrypted file. The command below remains the proposed form:

```bash
openssl enc -d -aes-256-cbc -pbkdf2 -salt \
  -pass fd:3 \
  -in "$work/tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump.enc" \
  -out "$work/tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump" \
  3< "$work/encryption-passphrase"
```

That comparison on a copy of this encrypted archive remains **NOT TESTED**. For this archive, use the historical `env:` command.

The historical plaintext SHA-256 is:

`408b10c3ef0e18bd4cde728afe529a780c7d2af7f83042c16c5faf9fe327e4b8`

That value was recorded on 15 November 2026. It was not recomputed on 17 November 2026. Stop if the new digest is different.

### Inspect the dump without hiding errors

The historical archive header came from `pg_restore --list`. It identified database `postgres`, PostgreSQL 17.11, pg_dump 17.12, and custom format.

Do not pipe `pg_restore --list` into `head`. A pipe can report success from `head` when `pg_restore` failed. Save the list and check the exit status separately. Saving the list this way is a **PROPOSED, UNTESTED** safeguard around the historical listing operation:

```bash
set -euo pipefail
require_private_work
pg_restore_client=/usr/lib/postgresql/17/bin/pg_restore
require_pinned_pg_restore "$pg_restore_client"
set +e
"$pg_restore_client" --list \
  "$work/tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump" \
  > "$work/dump.list"
pg_restore_list_exit=$?
set -e
if [ "$pg_restore_list_exit" -ne 0 ]; then
  echo "pg_restore --list failed; stop"
  exit "$pg_restore_list_exit"
fi
```

Stop if `pg_restore_list_exit` is not 0. Read the start of `$work/dump.list` and confirm the header before restoring. The expected header contents are historical: database `postgres`, dumped from PostgreSQL 17.11 by pg_dump 17.12, custom format, created 2026-11-15 00:44:17 UTC.

### Prove the target is isolated before restore

The historical full restore used database name `tejas_restore_full_20261115`, host `/var/run/postgresql`, and port `5433`. Those values identified a local test server. They are not a Production address.

No remote database connection is authorized. The restore target must be the local socket `/var/run/postgresql`, the address `127.0.0.1`, or the address `::1`. The guard does not accept another address in `127.0.0.0/8`. A remote hostname, a remote IP address, and the Production host inside `SUPABASE_BACKUP_DB_URL` are not authorized, even if the owner names one of them as a convenience.

The host, port, and database name typed into the client are configured connection parameters. They are not proof of where the session connected. Server-confirmed details are the values the connected server returns. Compare the two. Do not restore when they disagree.

These confirmation queries passed on the empty disposable database in section O. They were not preserved as the historical pre-check script, and they were not run against a restored TEJAS database. The real restore target remains **NOT TESTED**. **OWNER/ADMIN CONFIRMATION REQUIRED** before treating them as the approved pre-check:

```sql
SELECT current_database() AS server_confirmed_database;
SELECT version();
SELECT inet_server_addr() AS server_confirmed_addr;
SELECT current_setting('port') AS server_port_setting;

SELECT n.nspname, c.relkind, c.relname
FROM pg_namespace n
JOIN pg_class c ON c.relnamespace = n.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
ORDER BY 1, 2, 3;
```

Read the result as follows:

- `version()` must report PostgreSQL 17.
- `current_database()` must be the new empty local database, not a database that already holds TEJAS data.
- `inet_server_addr()` is server-confirmed. Null means the session is not a confirmed TCP connection. It does not prove which local socket path was used. The configured host must still be the local socket path.
- If `inet_server_addr()` is not null, it must be a loopback address. Any other address is a remote connection. Stop. Remote access is not authorized.
- `current_setting('port')` is the server's port setting. The historical test used port `5433`. A different local port is acceptable only when the owner has named it and this server setting is that same port. The port typed into the client is not, by itself, the server-confirmed port.
- A check limited to schema `public` does not establish that other schemas contain no application tables. The query excludes only `pg_catalog` and `information_schema`. It does not exclude `pg_toast` by name. It also selects only relation kinds `r`, `p`, `v`, `m`, `S`, and `f`, so a toast table, whose kind is `t`, is outside this result. Do not describe `pg_toast` as excluded by the SQL.
- The exact relation names created by `supabase_vault` 0.3.1 were not retained, apart from the historical result that `vault.secrets` had count 0. Do not invent the other names. The 15 November restore remains the historical verified result. Before any new restore, the owner/admin must approve an expected-object list. Until that list exists, a new restore cannot be fully checked. Any application table outside that approved list is a stop.

The database name in the historical command was the test name `tejas_restore_full_20261115`. For a new test, create a new empty name and use that name only in the `-d` position. Do not reuse a Production database name. Do not add `--no-owner` or `--no-acl`.

Install `supabase_vault` 0.3.1 before the restore. The first test, which commented the vault entries out of the restore list, was explicitly not accepted. The accepted test restored the whole dump, including vault, and exited 0.

### Historical restore command

This is the accepted command from 15 November 2026. It is not a Production command. Its arguments are unchanged. Phase 3D did not execute it. Do not paste this record as the command to run. It uses `pg_restore` from `PATH` and does not capture the exit status. Use the future block below.

```bash
pg_restore -h /var/run/postgresql -p 5433 \
  -d tejas_restore_full_20261115 \
  --exit-on-error --no-password \
  "$work/tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump"
```

Before a future restore, the client must be the regular executable `/usr/lib/postgresql/17/bin/pg_restore`, and its `--version` text must start with `pg_restore (PostgreSQL) 17.`. Do not accept a client from `PATH`. Do not install or run `pg_restore` as part of this revision.

```bash
require_pg_restore_version() {
  bin=$1
  if [ -L "$bin" ] || [ ! -f "$bin" ] || [ ! -x "$bin" ]; then
    echo "pg_restore client is missing, not a regular executable, or is a symlink; stop"
    exit 1
  fi
  version=$("$bin" --version 2>&1) || {
    echo "pg_restore version check failed; stop"
    exit 1
  }
  case "$version" in
    "pg_restore (PostgreSQL) 17."*) ;;
    *) echo "pg_restore client is not PostgreSQL 17; stop"; exit 1 ;;
  esac
}
require_pinned_pg_restore() {
  if [ "$1" != "/usr/lib/postgresql/17/bin/pg_restore" ]; then
    echo "pg_restore path is not the PostgreSQL 17 client; stop"
    exit 1
  fi
  require_pg_restore_version "$1"
}
require_restore_preconditions() {
  host=$1
  port=$2
  database=$3
  server_addr=$4
  server_port=$5
  server_database=$6
  if [ "$database" != "$server_database" ] || [ "$port" != "$server_port" ]; then
    echo "restore target does not match server identity; stop"
    exit 1
  fi
  case "$host" in
    /var/run/postgresql|127.0.0.1|::1) ;;
    *) echo "restore host is not a local socket or loopback; stop"; exit 1 ;;
  esac
  if [ "$host" = "/var/run/postgresql" ]; then
    if [ -n "$server_addr" ]; then
      echo "local socket session returned a TCP address; stop"
      exit 1
    fi
  elif [ "$server_addr" != "$host" ]; then
    echo "server address does not match the configured loopback host; stop"
    exit 1
  fi
  if [ -z "$database" ] || [ "$database" = "postgres" ]; then
    echo "database postgres is not the disposable restore target; stop"
    exit 1
  fi
}
```

The historical target is host `/var/run/postgresql`, port `5433`, and disposable database `tejas_restore_full_20261115`. A later test may change `-d`, `-p`, and `-h` only after `require_restore_preconditions` exits 0. Keep `--exit-on-error` and `--no-password`. Do not change `-h` to a remote host.

Do not execute the future block below against database `tejas_restore_full_20261115`. Section T already restored into that name on this computer's port `5432`. The block still names port `5433` and passes that same port, host, and database as the server-confirmed arguments. Those arguments are literals in the call. They are not the result of `current_database()`, `inet_server_addr()`, or `current_setting('port')`. A zero exit from `require_restore_preconditions` in this block is not server confirmation. A later restore needs a new empty database name. Read the server with the queries above, and stop if the target is not empty. The command text below is unchanged.

The separate line `pg_restore_exit=$?` is not used. Pasted alone, it would capture the previous command rather than `pg_restore`. Earlier blocks may also have left `set -e` on, which would skip a following capture after a failure. A future restore uses this block. It turns `set -e` off, checks the pinned client and the server identity, runs the same arguments as the historical command, and then captures that command's exit status. Phase 3E did not execute it.

```bash
set -euo pipefail
require_private_work
pg_restore_client=/usr/lib/postgresql/17/bin/pg_restore
require_pinned_pg_restore "$pg_restore_client"
require_restore_preconditions \
  /var/run/postgresql 5433 tejas_restore_full_20261115 \
  "" 5433 tejas_restore_full_20261115
set +e
"$pg_restore_client" -h /var/run/postgresql -p 5433 \
  -d tejas_restore_full_20261115 \
  --exit-on-error --no-password \
  "$work/tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump"
pg_restore_exit=$?
set -e
if [ "$pg_restore_exit" -ne 0 ]; then
  echo "pg_restore failed; stop"
  exit "$pg_restore_exit"
fi
```

`--no-owner` and `--no-acl` were not used. If the restore stops because a Production role does not exist on the isolated server, stop and record the error. Do not add a flag to skip ownership. The globals backup that might contain roles was not in the verified Drive inventory. **OWNER/ADMIN CONFIRMATION REQUIRED** to decide how to handle a missing role.

After the restore exits 0, section K removes the plaintext dump. Keep the encrypted `.dump.enc` and the Drive original until the owner accepts the result.

## H. Post-restore validation

Run this against the named disposable database only, in a read-only transaction. The historical disposable database was `tejas_restore_full_20261115`. Before this SQL, `require_sql_session` must exit 0 for that name, or for the new empty name chosen for a later test, with `ON_ERROR_STOP` set to `1`. This is the comparison that was run on 15 November 2026. The expected vault result was `supabase_vault` version `0.3.1` and `vault.secrets` count 0. The other vault relation names were not retained. Do not invent them. Phase 3D did not execute this SQL.

```sql
BEGIN READ ONLY;
SELECT extname, extversion
FROM pg_extension
ORDER BY extname;

SELECT 'vault|' || (
  SELECT extversion FROM pg_extension WHERE extname = 'supabase_vault'
);
SELECT 'secrets|' || (
  SELECT count(*)::text FROM vault.secrets
);
COMMIT;
```

Compare the isolated database with the baseline recorded on 15 November 2026:

| Object | Expected result |
| --- | --- |
| Schemas | 9 |
| Tables | 68 of 68, none missing and none extra |
| Indexes | 189 |
| Constraints | 238 |
| Sequences | 2 |
| Functions | 116 |
| Triggers | 12 |
| Extensions | 5, none missing |

TEJAS row counts that matched:

| Area | Rows |
| --- | --- |
| Payments | 2 |
| Registrations | 2 |
| Entitlements | 3 |
| E-book audit | 20 |
| Book orders | 2 |
| E-book access | 2 |
| Payment proofs | 2 |
| Idempotency | 2 |

`tejas_case_files` and `tejas_payment_utrs` were absent on both the source and the restore. Their absence was a match, not a restore failure. One payment status was `confirmed` and one was `reported`. The entitlement status was `verified`.

The exact SQL used to count every one of the 68 tables was not preserved as a single script. **OWNER/ADMIN CONFIRMATION REQUIRED** only for the listing query text. The counts above are the recorded results. Compare the same areas in a read-only transaction. Do not update rows to make the counts match.

These counts describe the backup taken at 2026-11-15 00:44:17 UTC. They are not a new reading of Production. Production may have changed since that time. A difference from these counts does not by itself prove that the restore command failed. It proves that the restored data is not the same as this baseline.

## I. Production recovery precautions and owner approval boundaries

The isolated restore is the end of the verified procedure. It is not permission to repair Production.

The owner must give a separate, explicit approval before anyone writes to Production. Until that approval exists:

- Do not run `pg_restore` against the Production database.
- Do not drop, truncate, or overwrite a Production table.
- Do not apply pull request #25, its migration package, or any other pending SQL as part of recovering this backup.
- Do not upload or replace the four Storage objects in Supabase.
- Do not delete, rename, overwrite, or share the original Drive files.
- Do not delete the local encrypted downloads until the owner has accepted the isolated result.
- Do not rotate or replace either passphrase.
- Do not replace the rclone Google OAuth client as part of this recovery.

No command in this runbook is an approved Production action. The `pg_restore` command in section G is an isolated local test only.

A Production repair, if the owner later approves one, is a new plan. It must name the target database, the backup file, the expected baseline time, and the rollback method before it starts. This runbook does not contain that plan.

On 17 November 2026 the recorded status was that pull request #25 was open and unmerged. That status was not reverified in Phase 3D. Do not treat it as the current GitHub status. No GitHub lookup was performed in this phase. Its changes are not inside the 15 November database backup. Applying it during recovery would change the restored database into something the backup test did not verify. The prohibition does not depend on a fresh status check.

## J. Offline passphrase custody

Offline custody has not been verified. This section is the required practice. It is not a statement that the practice has already been completed.

The owner keeps two distinct passphrases:

| Passphrase variable | Decrypts |
| --- | --- |
| `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE` | The database archive and `tejas-storage-backup.identity.gpg` |
| `TEJAS_BACKUP_OWNER_PASSPHRASE` | `tejas-storage-backup.identity.owner.gpg` only |

The owner stores each passphrase outside Cursor, outside ChatGPT, outside GitHub, and outside Google Drive. A password manager or a sealed paper copy held by the owner is appropriate. An administrator may receive a passphrase for one recovery and must discard every copy, including shell history and passphrase files, when that recovery ends.

The owner does not send a passphrase in ChatGPT, Cursor chat, email, a repository file, or a shared document. The administrator does not write a passphrase into this runbook, a screenshot, or a log.

During a recovery, the administrator keeps the secret only in one of the three historical mechanisms in section C. The OpenSSL file-descriptor row is dummy-only and is not approved for this archive. The environment-variable mechanism remains visible to process inspection on that machine. `set +o history` is Bash-only and does not erase history already written. After the commands that need it:

- Remove the passphrase file. `rm` removes the directory entry. It does not guarantee that an SSD, a cloud disk, a snapshot, or a backup has erased the bytes.
- Unset `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE` and `TEJAS_BACKUP_OWNER_PASSPHRASE`.
- Check the shell history and the terminal scrollback. Do not copy them into the recovery report. If a secret was captured, tell the owner and clear that local history. The exact clear command depends on the shell and is **OWNER/ADMIN CONFIRMATION REQUIRED**.

Losing `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE` makes the database archive and the original identity file unusable. The owner file remains usable only when `TEJAS_BACKUP_OWNER_PASSPHRASE` is still available. Losing both passphrases makes the Age identity and the Storage archive unrecoverable. The Storage archive has no separate age passphrase. It requires the identity file.

The plaintext Age identity is not a backup to be stored on Drive. The two GPG files are the backups of that identity.

## K. Incident checklist, cleanup, and completion

### Incident checklist

The owner:

- [ ] Names the incident and approves an isolated recovery.
- [ ] Chooses which identity passphrase will be used.
- [ ] Supplies that passphrase on the recovery computer, not through ChatGPT or any other chat.
- [ ] States that Production must not be changed unless a later written approval says so.

The administrator:

- [ ] In Bash only, runs `set +o history` before a passphrase is supplied. Does not treat that as erasure of old history or as protection for any other shell.
- [ ] Confirms `tejasdrive` still reaches the private folder and that sharing is unchanged.
- [ ] Downloads only the required files into a mode `700` directory.
- [ ] Matches every filename, size, and SHA-256 in section B before decryption.
- [ ] Decrypts one identity file and matches the identity SHA-256.
- [ ] Decrypts the Storage archive with the pinned age binary and the historical arguments. Does not run `age` from `PATH` and does not extract it. Section M records the synthetic listing test. When this checklist was written, extraction of the real archive remained **NOT TESTED** and waited for a separate owner/admin approval. A checker exit of 0 is not that approval. Section T later records one named-file extraction. That record is not an instruction to extract again, and it is not a Supabase upload.
- [ ] Does not hash extracted files until the section F file-type inventory has passed. `sha256sum` is not a file-type check.
- [ ] Decrypts the database archive with the historical OpenSSL command and matches the historical plaintext SHA-256.
- [ ] Records the configured host, port, and database name, then compares them with the server-confirmed details in section G. The target is a local socket or loopback only. No remote connection is authorized.
- [ ] Does not treat a `public` schema check as proof that other schemas are empty.
- [ ] Installs `supabase_vault` 0.3.1 before restore.
- [ ] Runs the historical `pg_restore` flags only against that isolated local database.
- [ ] Compares the isolated counts with section H.
- [ ] Completes the cleanup below.
- [ ] Reports the result to the owner without including secret values.

### Plaintext cleanup

Do this after the checks the owner asked for have been recorded.

`rm` removes a directory entry. It does not guarantee that the data blocks are erased. On an SSD, wear leveling can leave the old data in storage the filesystem no longer names. A cloud disk, a snapshot, and a backup can retain another copy outside the work directory. `shred` was not part of the verified procedure, and it is not a guarantee on those media. This runbook does not promise forensic secure deletion.

Remove the plaintext database dump, the plaintext Age identity, the decrypted tar, the listing files, and both passphrase files. Also remove both original Storage directories wherever they were created: `tejas-payment-proofs` and `tejas-registration-files`. Those two names must not remain at the top of the work directory or inside `$work/extracted`.

If either Storage path is a symlink, stop. Do not remove it until the owner confirms what it points at. Section N stopped cleanup when a synthetic `tejas-payment-proofs` path or a synthetic `tejas-registration-files` path was a symlink. The guard below was tested on disposable directories in Phase 3C. It was not run in a real TEJAS recovery directory. `rm` is not used. Unlinking a directory entry does not securely erase the bytes.

```bash
set -euo pipefail
python3 - << 'PY'
import os, stat, sys

FILES = [
    "tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump",
    "tejas-storage-backup.identity",
    "archive.tar",
    "tar-names.txt",
    "tar-verbose.txt",
    "dump.list",
    "encryption-passphrase",
    "owner-passphrase",
]
DIRS = [
    "tejas-payment-proofs",
    "tejas-registration-files",
    "extracted/tejas-payment-proofs",
    "extracted/tejas-registration-files",
    "extracted",
]
FORBIDDEN = {"/tmp", "/var", "/var/tmp", "/home", "/usr", "/opt", "/dev", "/dev/shm", "/root"}
MARKER = b"tejas-isolated-recovery-workspace\n"

def fail(message):
    print(message, file=sys.stderr)
    raise SystemExit(1)

def private_work(path):
    if "work" not in os.environ or path == "":
        fail("work directory is unset or empty")
    if not path.startswith("/"):
        fail("work directory is relative")
    if path == "/":
        fail("work directory is root")
    current = ""
    for part in path.split("/"):
        if part == "":
            continue
        if part in (".", ".."):
            fail("work directory has an unexpected path component")
        current += "/" + part
        try:
            st = os.lstat(current)
        except OSError:
            fail("work directory is not an existing real directory")
        if stat.S_ISLNK(st.st_mode):
            fail("work directory path contains a symlink")
        if not stat.S_ISDIR(st.st_mode):
            fail("work directory is not a real directory")
    if current in FORBIDDEN or current.count("/") < 2:
        fail("work directory is not a private workspace")
    st = os.lstat(current)
    if st.st_uid != os.getuid() or stat.S_IMODE(st.st_mode) != 0o700:
        fail("work directory is not a private mode 700 directory")
    marker = current + "/.tejas-recovery-workspace"
    try:
        marker_stat = os.lstat(marker)
    except OSError:
        fail("workspace marker is missing")
    if stat.S_ISLNK(marker_stat.st_mode) or not stat.S_ISREG(marker_stat.st_mode):
        fail("workspace marker is not a regular file")
    if stat.S_IMODE(marker_stat.st_mode) != 0o600:
        fail("workspace marker mode is not 600")
    with open(marker, "rb") as handle:
        if handle.read() != MARKER:
            fail("workspace marker content is unexpected")
    return current

def inside(work, rel):
    if rel.startswith("/") or "\\" in rel or rel == "":
        fail("deletion target is not an explicit relative path")
    current = work
    for part in rel.split("/"):
        if part in ("", ".", ".."):
            fail("deletion target has an unexpected path component")
        current += "/" + part
        if not (current == work or current.startswith(work + "/")):
            fail("deletion target is outside the work directory")
    return current

def collect(path):
    files, dirs = [], []
    stack = [path]
    while stack:
        current = stack.pop()
        st = os.lstat(current)
        if stat.S_ISLNK(st.st_mode):
            fail("deletion target is a symlink")
        if stat.S_ISREG(st.st_mode):
            if st.st_nlink != 1:
                fail("deletion target has another hard link; stop")
            files.append(current)
            continue
        if not stat.S_ISDIR(st.st_mode):
            fail("deletion target has an unexpected file type")
        dirs.append(current)
        with os.scandir(current) as entries:
            for entry in entries:
                stack.append(entry.path)
    return files, dirs

work = private_work(os.environ.get("work", ""))
planned_files, planned_dirs = [], []
for rel in FILES:
    path = inside(work, rel)
    if not os.path.lexists(path):
        continue
    st = os.lstat(path)
    if stat.S_ISLNK(st.st_mode) or not stat.S_ISREG(st.st_mode):
        fail("deletion target is a symlink or not a regular file")
    if st.st_nlink != 1:
        fail("deletion target has another hard link; stop")
    planned_files.append(path)
for rel in DIRS:
    path = inside(work, rel)
    if not os.path.lexists(path):
        continue
    files, dirs = collect(path)
    planned_files.extend(files)
    planned_dirs.extend(dirs)
unique_files = []
seen_files = set()
for path in planned_files:
    if path not in seen_files:
        seen_files.add(path)
        unique_files.append(path)
for path in unique_files + planned_dirs:
    if not path.startswith(work + "/"):
        fail("deletion target is outside the work directory")
for path in unique_files:
    os.unlink(path)
for path in sorted(set(planned_dirs), key=lambda item: item.count("/"), reverse=True):
    os.rmdir(path)
PY
unset TEJAS_BACKUP_ENCRYPTION_PASSPHRASE
unset TEJAS_BACKUP_OWNER_PASSPHRASE
unset PGPASSWORD
unset SUPABASE_BACKUP_DB_URL
if [ -n "${TEJAS_BACKUP_ENCRYPTION_PASSPHRASE+x}" ] \
  || [ -n "${TEJAS_BACKUP_OWNER_PASSPHRASE+x}" ] \
  || [ -n "${PGPASSWORD+x}" ] \
  || [ -n "${SUPABASE_BACKUP_DB_URL+x}" ]; then
  echo "a cleanup variable is still set; stop"
  exit 1
fi
echo "cleanup variables are unset"
```

`SUPABASE_BACKUP_DB_URL` is the historical source connection, not the isolated restore target. The unset command removes the name from this shell. It does not print the value, revoke a credential, or invalidate the URL. The following test checks that the name is absent without displaying a value. Unsetting a variable does not securely erase a passphrase that was stored anywhere else.

Then inventory every remaining object. `find -type f` is not a complete inventory: it skips directories, symlinks, FIFOs, sockets, and devices. Section N used this GNU `find -printf` form on synthetic fixtures. It does not follow symlinks. The command below was not run in a real recovery directory. If it is unavailable, stop. Do not replace it with a regular-file-only listing, and do not run `sha256sum` yet:

```bash
set -euo pipefail
require_private_work
find "$work" -mindepth 1 -printf '%y %p\n'
```

Every line must be type `f`, a regular file. Any `d`, `l`, `p`, `s`, `b`, `c`, or other type is a stop. Any unexpected path is a stop, including a directory named `tejas-payment-proofs` or `tejas-registration-files`. The only objects that may remain, and only until the owner accepts the result, are:

| Type | File that may remain | Why it may remain |
| --- | --- | --- |
| Regular file | `tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump.enc` | Encrypted database download |
| Regular file | `tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age` | Encrypted Storage download |
| Regular file | `tejas-storage-backup.identity.gpg` | Encrypted identity download |
| Regular file | `tejas-storage-backup.identity.owner.gpg` | Encrypted identity download |
| Regular file | `.tejas-recovery-workspace` | Private-workspace marker required by the cleanup guard |

If an object is unexpected and its purpose is unclear, stop and ask the owner before deleting it.

Only after that inventory shows regular files and no symlink, re-hash the encrypted downloads with `require_sha256` and the fixed section B values. `sha256sum` follows symlinks, so it must not be used in place of the type inventory. A zero exit from `sha256sum` alone is not acceptance. Do not delete those encrypted downloads, and do not delete the Drive originals, until the owner accepts the result.

```bash
set -euo pipefail
require_sha256() {
  file=$1
  expected=$2
  if [ -z "$file" ] || [ -z "$expected" ]; then
    echo "checksum comparison is missing a file or an expected value; stop"
    exit 1
  fi
  if ! printf '%s' "$expected" | grep -Eq '^[0-9a-f]{64}$'; then
    echo "expected checksum is not 64 lowercase hexadecimal digits; stop"
    exit 1
  fi
  if [ -L "$file" ] || [ ! -f "$file" ] || [ ! -r "$file" ] || [ ! -s "$file" ]; then
    echo "checksum file missing, unreadable, empty, or not a regular file; stop"
    exit 1
  fi
  actual=$(sha256sum -- "$file") || {
    echo "checksum command failed; stop"
    exit 1
  }
  actual=${actual%% *}
  if [ "$actual" != "$expected" ]; then
    echo "checksum mismatch; stop"
    exit 1
  fi
}
require_private_work
require_sha256 \
  "$work/tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump.enc" \
  "49d69874bc494c2c353a903906045ece4ad37c989a69ddaf0ae7195314fcdde1"
require_sha256 \
  "$work/tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age" \
  "ac76e4f8895284f098e0f674d58d8a901702f7b219809a0d51f64b358d7e72c4"
require_sha256 \
  "$work/tejas-storage-backup.identity.gpg" \
  "fd2df7cdfd3041cf33c1bce947af0b90213e449642c58b4d7de1ce1f3fb1ab5b"
require_sha256 \
  "$work/tejas-storage-backup.identity.owner.gpg" \
  "e6f86e98fb5203cf75daa7f8dfa13e6d608f1b71fe8c8f0987eb6d4c5a0945cf"
```

Check the shell history and the terminal scrollback for a passphrase or a connection string. Do not paste either one into the report. If one was captured, tell the owner. Clearing that history is **OWNER/ADMIN CONFIRMATION REQUIRED** for the shell in use.

### Recovery completion checklist

Database recovery completion is separate from Storage recovery completion. Neither one is full recovery by itself.

Database recovery completion:

- [ ] The isolated `pg_restore` exit status was captured and is 0.
- [ ] The server-confirmed database, host, and port matched the named disposable target.
- [ ] `supabase_vault` version `0.3.1` and the section H area counts were compared.
- [ ] For a new restore, the owner/admin expected-object list for vault was used. The 15 November result remains historical. A new restore is not complete while that list is absent.
- [ ] Extracted Storage-file hashes are not required for database completion.

Storage recovery completion:

- [ ] A separate owner authorization for extraction was recorded. Until it exists, Storage recovery is not complete.
- [ ] The four extracted-file hashes are required only after that authorization and the section F inventory. They are not required while extraction remains unauthorized.
- [ ] Supabase Storage was not changed.

Shared completion:

- [ ] Drive originals still exist, with the same file IDs and checksums.
- [ ] No Drive permission changed.
- [ ] The local encrypted downloads still match section B, and they were hashed only after the type inventory showed regular files.
- [ ] The inventory shows no directory, symlink, FIFO, socket, device, plaintext dump, identity, tar, passphrase file, editor swap file, `tejas-payment-proofs` directory, or `tejas-registration-files` directory. The `.tejas-recovery-workspace` marker may remain. An unexpected file is still a stop.
- [ ] The passphrase variables and `SUPABASE_BACKUP_DB_URL` were unset. Their values were not displayed. Unsetting `SUPABASE_BACKUP_DB_URL` did not revoke a credential.
- [ ] Shell history and scrollback were checked for accidental secrets.
- [ ] Production was not contacted, or a separate owner approval names exactly what was changed.
- [ ] Pull request #25 was not applied as part of this recovery. When this checklist was written, its 17 November status had not been reverified. Section T later recorded it as open and not merged. Do not merge it as recovery.
- [ ] Full recovery is complete only when both the database items and the Storage items above are complete.

## L. Known limitations and items requiring owner confirmation

Sections M, N, and O record synthetic tests. They do not change the historical facts in items 1 through 4 or the administrative decisions in items 7 through 13. The real TEJAS backups remain **NOT TESTED**.

1. The 17 November 2026 audit verified Drive ciphertext. It did not repeat decryption, the isolated restore, or the four-file hash comparison.
2. The local encrypted database file was not on the audit computer. The Drive copy is the verified copy.
3. Companion `.globals.sql.enc` and `.metadata.json.enc` files were created locally during the backup session and were not in the verified Drive folder. Role and privilege recovery from those files is **OWNER/ADMIN CONFIRMATION REQUIRED**.
4. The historical `tar` argument list and the exact 68-table counting script were not preserved. The hashes, sizes, and summary counts were preserved.
5. The section F listing check passed on synthetic archives in section M. It was not run on the real Storage archive, which remains **NOT TESTED**. Reading a tar listing by eye is not mechanical validation. Named-file extraction was not part of that synthetic test and remains unauthorized until the owner/admin approves it. A zero exit from the checker is not approval to extract.
6. The OpenSSL `-pass fd:3` form passed on dummy data in section O. It is untested on this archive. The historical command remains `-pass env:TEJAS_BACKUP_ENCRYPTION_PASSPHRASE`. The historical command was not executed in Phase 2C.
7. The compile commands for `supabase_vault` 0.3.1 were not preserved. The required SQL and version were preserved.
8. `--no-owner` and `--no-acl` were not part of the successful restore. A missing Production role is **OWNER/ADMIN CONFIRMATION REQUIRED**. Do not add those flags without a new owner approval.
9. No verified command restores the four Storage files into Supabase Storage. That action is **OWNER/ADMIN CONFIRMATION REQUIRED** and needs a separate approval.
10. Offline passphrase custody is not verified. `rm` removes a directory entry and does not guarantee erasure on SSDs, cloud disks, snapshots, or backups.
11. How to clear a particular shell's history is **OWNER/ADMIN CONFIRMATION REQUIRED** if a secret was recorded. `set +o history` is Bash-specific, does not erase history already written, and does not protect other shells.
12. rclone reported that its shared Google client is scheduled to stop working during 2026. Creating a replacement client is a future change and needs a separate approval. It is not part of this recovery. A new `drive.file` client would not automatically see files created by the current client.
13. The backup baseline is 2026-11-15 00:44:17 UTC for the database and 16 November 2026 for Storage. Later Production changes are outside this backup.
14. The passphrase-entry silent-read shape and the GNU `find -printf` inventory passed on dummy data in section N. The all-schema pre-restore query passed on an empty disposable database in section O. None of those tests used a real passphrase, a real extract, or a restored TEJAS database. None of them resolves the unknown trailing newline in the stored passphrase. The real backup remains **NOT TESTED**.
15. Creating a live device node was not permitted in Phase 2B, so that part of the filesystem test is **BLOCKED**. The character-device result in section M used a tar header only. No device node was created.
16. Phase 2C did not install `supabase_vault`, did not restore roles, and did not restore any TEJAS schema. Portable PostgreSQL 17.12 and disposable port `55432` are not the historical restore server or port `5433`.
17. Phase 3D left these prerequisites unresolved: the portable archive checksum is unavailable; the plaintext dump size and required free space were not retained; the full `supabase_vault` 0.3.1 relation list was not retained; and the 17 November pull request #25 status was not reverified. None of those items is a completed check.
18. Phase 3E put the workspace and rclone checks on the write path, rejected extra hard links during cleanup, and moved `pg_restore` exit capture into the same block as the command. Those were disposable tests. They did not execute a historical recovery command.
19. Section R is the consolidated register for the open prerequisites in this section. It does not close any of them.
20. Phase 3G corrected the gate wording that made P-09, the checker, and the extracted hashes look like permission to begin. The prerequisites remain unresolved. Section S records the disposable logic tests.
21. Section T is later execution evidence. It does not rewrite the historical commands, checksums, or the Phase 3G register.
22. Section W is the operator rule for statements in this section that say a real check had not yet been run. Items 1, 5, 14, and 17 describe the document before section T. They are not an instruction to decrypt, extract, or restore again.

## M. Phase 2A synthetic archive listing tests

**Synthetic test passed. The real Storage archive remains NOT TESTED.**

These tests ran on 17 November 2026 under `/tmp/tejas-dr-phase2-synthetic/tests/`. Every archive was constructed for the test. None was a TEJAS backup. The checker was the listing script in section F. GNU tar was 1.35, using `--quoting-style=escape` with `-tf` and `-tvf`. No test ran `tar -x`. A checker exit of 0 printed `proposed check exited 0; this is not approval to extract`.

| Test | Synthetic condition | Exit | Result |
| --- | --- | --- | --- |
| T01 | Four regular files at the exact allow-list paths | 0 | Pass. The stdout was the not-an-approval line above. |
| T02 | Those four files plus the six expected parent directories | 0 | Pass. The same stdout. |
| T03 | Only the first three required files | 1 | `required regular file missing` |
| T04 | The four files plus `notes.txt` | 1 | `unexpected or unsafe member name` |
| T05 | An absolute member. The listing still showed a leading `/`. | 1 | `unexpected or unsafe member name` |
| T06 | Two parent-traversal names. The listing still showed `..`. | 1 | `unexpected or unsafe member name` |
| T07 | The first required file stored a second time | 1 | `duplicate name` |
| T08 | A symbolic link at the first required path | 1 | `link member` |
| T09 | A hard link. The verbose line began with `h` and contained ` link to `. | 1 | `link member` |
| T10 | A FIFO header at the first required path. No FIFO node was created. | 1 | `required path is not a regular file` |
| T11 | A character-device header, device numbers 1,3. No device node was created. | 1 | `required path is not a regular file` |
| T12 | The first 64 bytes of the T01 archive | 1 | `tar listing failed; fail closed; do not extract` |
| T13a | The four required paths prefixed with `./` | 1 | `unexpected or unsafe member name` |
| T13b | An extra member named `C:/outside-dummy.txt` | 1 | `unexpected or unsafe member name` |
| T13c | An extra member whose name contains a newline | 1 | `unexpected or unsafe member name` |

Limits of this test:

- The real file `tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age` was not listed or decrypted.
- T01 and T02 were not extracted. Their zero exits are not extraction approval.
- T11 tested a crafted header. It did not test a live device node.
- The historical `tar` argument list remains unknown.
- Owner/admin approval to extract the real archive is still required.

## N. Phase 2B synthetic filesystem and dummy secret-handling tests

**Synthetic test passed. No real TEJAS file, passphrase, or backup was used. The real backup remains NOT TESTED.**

These tests ran on 17 November 2026 under `/tmp/tejas-dr-phase2-synthetic/fs/` and `/tmp/tejas-dr-phase2-synthetic/secrets/`. The inventory command was GNU `find -mindepth 1 -printf '%y %p\n'`. `sha256sum` ran only after that inventory showed directories and regular files.

| Test | Synthetic condition | `sha256sum` | Result |
| --- | --- | --- | --- |
| F01 | The two Storage directories, their parent directories, and four regular dummy files | Ran, exit 0 | Pass |
| F02 | A symlink named `tejas-payment-proofs/dummy-link` | Did not run | Pass. Stopped before the hash. |
| F03 | A FIFO and a socket beside the dummy files | Did not run | Pass. Both types were detected. Live device-node creation was **BLOCKED**: `mknod` was not permitted, and it was not attempted. |
| F04 | An extra regular file `notes-dummy.txt` and an extra directory `unexpected-dir` | Did not run | Pass. Stopped before the hash. |
| F05 | The `receipt.jpg` file and its parent directory were absent | Did not run | Pass. Stopped before the hash. |
| F06a | `tejas-payment-proofs` was a symlink. `sentinel/keep.txt` was present. | Did not run | Pass. Cleanup stopped. The sentinel remained. |
| F06b | `tejas-registration-files` was a symlink. `sentinel/keep.txt` was present. | Did not run | Pass. Cleanup stopped. The sentinel remained. |
| F07 | The four dummy files and their parent directories were removed by explicit path. Four dummy encrypted stand-ins remained. | Ran on the stand-ins, exit 0 | Pass |

The SHA-256 values below are synthetic. They are not the TEJAS backup checksums in section B.

F01 dummy files:

| Synthetic path | SHA-256 |
| --- | --- |
| `receipt.pdf` under `TEJAS-2026-NS553XMZZG2N8XE7DHV3` | `e20d0bd80b9dc539e2bd188dafe654318fe6b3bd208bc273ee4f5712c11d1081` |
| `receipt.jpg` under `TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ` | `94ffaed6d9cb78e384bc038c5902c60322b1192ff47cefc4683f53bf821b3cda` |
| `upload.xlsx` under `TEJAS-2026-NS553XMZZG2N8XE7DHV3` | `0eade8a061d284f8f0812e54c3855a974ae9f43f340fafe4806a0572478cdcaa` |
| `upload.xlsx` under `TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ` | `9dc2591584db5a31c0daec96c8f0b2b214be5bb888fb23f22870d59f14c68b40` |

F07 dummy encrypted stand-ins, which are not TEJAS backups:

| Synthetic filename | SHA-256 |
| --- | --- |
| `dummy-database.dump.enc` | `77967776203db054107516e905157bcb20a8132a7e779040421ae9786b93929d` |
| `dummy-storage.tar.age` | `9f7b7a6b79d92031f10db7fd5e00c68c7e91da9b972bcdf3383a80c1bfdce44b` |
| `dummy-identity.gpg` | `1e999871592cd4ab9a94b0ca77d1558057fa82bec254ea973c54f5597f233cd6` |
| `dummy-owner-identity.gpg` | `22f6e2003b6036ba8d9e86f74f8bd79e126d2768a1c7b646a9ea43db6db00d12` |

Secret-handling results, also synthetic:

| Test | What was exercised | Result |
| --- | --- | --- |
| S01 | `install -m 600 /dev/null` created an empty dummy file. `stat` reported `600 1000 ubuntu 1000 ubuntu`. The file contents were not read. | Pass |
| S02 | Bash `set +o history`, `stty -echo`, then `IFS= read -r -s DUMMY_PHASE2B_ENTRY < /dev/tty`, then `export` of that name only, a non-empty test that did not print the value, and `unset`. The variable was not a TEJAS passphrase variable. | Pass. The value was not printed, hashed, or dumped from the environment, and it was not visible in the terminal transcript. |
| S03 | The same S02 session was checked for unsafe forms. | Pass. No history file existed (`history_file_exists` false), so the dummy was not found in a history file. The terminal transcript did not contain the dummy. `echo`, `printf`, and `export NAME=value` were not used. |
| S04 | An isolated history file, not the user history file. Bash wrote `echo MARK_BEFORE` before `set +o history`. A later `echo MARK_AFTER` was command output. Dash ran `set +o history`. | Pass. The history file still contained four identical `echo MARK_BEFORE` lines and did not gain `MARK_AFTER`. Dash exited 2 with `sh: 1: set: Illegal option -o history`. Bash accepted `set +o history`. |

Limits of this test:

- The dummy value must not be written until echo is off and `read -s` is active. An earlier attempt displayed a dummy because it was written too soon. The recorded passing run waited.
- `set +o history` did not erase the lines already in the isolated history file.
- The real passphrase format, including any trailing newline, remains unknown.
- Explicit deletion of named paths is not forensic erasure.
- F06 left `sentinel/keep.txt` in place because cleanup stopped at the symlink.
- No real backup file was hashed, deleted, decrypted, or extracted.

## O. Phase 2C synthetic OpenSSL file-descriptor and PostgreSQL 17.12 validation

**Synthetic test passed. The real database archive, the real Storage archive, and the real passphrases remain NOT TESTED.**

### OpenSSL file descriptor

OpenSSL was 3.0.13, dated 30 January 2024. The test used a newly generated dummy passphrase and dummy plaintext under `/tmp/tejas-dr-phase2-synthetic/openssl-fd/`. The passphrase file was mode `600`. Its mode and owner were checked without displaying the secret. The passphrase was not a command argument, was not passed with `-pass pass:`, and was not printed with `echo` or `printf`.

Both commands used `-aes-256-cbc -pbkdf2 -salt -pass fd:3`. Descriptor 3 was redirected from the mode `600` file.

| Check | Result |
| --- | --- |
| Encryption exit | 0 |
| Decryption exit | 0 |
| Byte comparison of the dummy plaintext | Matched |
| Passphrase file after the test | Unlinked |

The SHA-256 values below are synthetic. They are not the TEJAS backup checksums in section B.

| Synthetic object | SHA-256 |
| --- | --- |
| Dummy plaintext | `ef235e2a286db50333fdc2c2f2ed45f7b38781743babacbab0b8ebd4fb97bf3c` |
| Dummy ciphertext | `e3acf2d11676ed991580b7efab01d8a3a1fadd92cf28beb7a9ba9294235cf55d` |

The dummy passphrase file had no trailing newline. That does not establish the format of the real stored passphrase.

File-descriptor delivery does not remove every host-level exposure. OpenSSL held the passphrase in memory while it ran. The file existed on disk until it was unlinked. Unlinking does not erase a copy that a disk, a snapshot, or a backup may already hold.

The historical command `-pass env:TEJAS_BACKUP_ENCRYPTION_PASSPHRASE` was not executed. The file-descriptor form was not used on the real archive. The two commands remain distinct. The historical command is still the command for this archive.

### PostgreSQL 17.12

No system PostgreSQL package or service was installed. The server was the portable build from the theseus-rs `postgresql-binaries` release 17.12.0, file `postgresql-17.12.0-x86_64-unknown-linux-gnu.tar.gz`. The retained Phase 2 evidence says the published checksum matched. The exact SHA-256 of that archive is not in the retained evidence. It is **UNAVAILABLE**. Do not invent it. The comparison cannot be repeated from the retained files. The archive was extracted only under `/tmp/tejas-dr-phase2-synthetic/postgresql/`. `postgres`, `psql`, and `initdb` each reported PostgreSQL 17.12.

An earlier portable package, Maven `io.zonky.test.postgres:embedded-postgres-binaries-linux-amd64:17.12.0`, also reported PostgreSQL 17.12 and contained `postgres`, `initdb`, and `pg_ctl` only. It was not the server used for the queries.

The disposable database was `tejas_phase2c_validation`. The server listened on `127.0.0.1:55432` and on a Unix socket inside the disposable directory. Port `55432` was free before startup. `pg_hba.conf` allowed local sockets, `127.0.0.1/32`, and `::1/128`. No non-loopback listener was observed.

`version()` returned:

`PostgreSQL 17.12 on x86_64-pc-linux-gnu, compiled by gcc (Debian 12.2.0-14+deb12u1) 12.2.0, 64-bit`

| Check | Unix socket | `127.0.0.1` |
| --- | --- | --- |
| `current_database()` | `tejas_phase2c_validation` | `tejas_phase2c_validation` |
| `inet_server_addr()` | SQL NULL | `127.0.0.1` |
| `current_setting('port')` | `55432` | `55432` |

Schemas present: `information_schema`, `pg_catalog`, `pg_toast`, and `public`. The first three are system schemas. `public` was present and held no application relation. The section G query excludes only `pg_catalog` and `information_schema`. It does not name `pg_toast`, so `pg_toast` is not excluded by the SQL. The selected kinds are `r`, `p`, `v`, `m`, `S`, and `f`. Toast tables use kind `t`, which this query does not select. On the empty disposable database the query returned zero rows. That result does not mean the SQL excluded `pg_toast`.

`supabase_vault` was not installed. No real dump was restored. No Production role, vault object, or TEJAS schema was present. `pg_restore` was not run.

The server was then stopped. No PostgreSQL process remained, and port `55432` was closed. The Phase 2C OpenSSL and PostgreSQL files were removed. The Phase 2A and Phase 2B synthetic evidence was left in place. No system-wide PostgreSQL service was changed.

Limits of this test:

- Portable PostgreSQL 17.12 is not the historical restore server, whose `version()` string was not recorded. The historical dump came from PostgreSQL 17.11 and pg_dump 17.12.
- Port `55432` was the disposable port for this empty database. The historical test port remains `5433`.
- The empty-database result does not predict the objects a restored TEJAS database would contain. Section H remains the historical baseline.
- The real database archive was not decrypted.

No phase in this section authorizes decryption, extraction, `pg_restore`, a Storage upload, or a Production change. Those actions still require a separate owner approval.

## P. Phase 3D synthetic guard tests

**Synthetic test passed. No real TEJAS file, passphrase, client, or remote service was used. The real backup remains NOT TESTED.**

These checks ran on 17 November 2026 under `/tmp/tejas-dr-phase3d-synthetic/`. They executed the guard functions added in this phase. They did not run the historical `age`, GnuPG, OpenSSL, `pg_restore`, or rclone commands, and they did not execute the pinned age or `pg_restore` binaries.

| Guard | Disposable case | Result |
| --- | --- | --- |
| rclone direction | Drive source and a destination inside the work directory | Pass |
| rclone direction | Local source and a `tejasdrive:` destination | Stop. The message says reversed arguments can upload. |
| rclone direction | Destination outside the work directory | Stop |
| rclone direction | Source that is not `tejasdrive:` | Stop |
| age version | Dummy program printing `v1.3.2` | Pass |
| age version | `v1.3.20`, `v1.2.0`, a non-zero exit, and a prefixed version line | Stop |
| age version | Symlink and a non-executable file | Stop |
| age path | A path other than `/home/ubuntu/tejas-backups/bin/age` | Stop, and the dummy program was not executed |
| pg_restore version | Dummy text `pg_restore (PostgreSQL) 17.12` | Pass |
| pg_restore version | PostgreSQL 16 and PostgreSQL 18 text | Stop |
| pg_restore path | A path other than `/usr/lib/postgresql/17/bin/pg_restore` | Stop, and the dummy program was not executed |
| SQL session | Matching disposable name with `ON_ERROR_STOP` set to `1` | Pass |
| SQL session | Name mismatch, `ON_ERROR_STOP` not `1`, and database `postgres` | Stop |
| Restore identity | Historical socket, port `5433`, and `tejas_restore_full_20261115` | Pass |
| Restore identity | Remote host, port mismatch, and a matching loopback pair | Stop for the first two. Pass for the loopback pair. |
| Passphrase unlink | Two regular dummy passphrase files in a private work directory | Pass. An encrypted stand-in and an outside sentinel remained. |
| Passphrase unlink | Empty, unset, relative, and root work values | Stop. Sentinels remained. |
| Passphrase unlink | Symlinked work directory and a symlinked passphrase path | Stop. The target files remained. |

The pinned age binary and the pinned `pg_restore` client were not executed. The portable PostgreSQL archive checksum remains **UNAVAILABLE**. The plaintext dump size remains **UNAVAILABLE**. No historical recovery command was executed.

## Q. Phase 3E independent readiness corrections

**Synthetic test passed. No real TEJAS file, passphrase, client, or remote service was used. The real backup remains NOT TESTED.**

These checks ran on 17 November 2026 under `/tmp/tejas-dr-phase3e-synthetic/`. They cover the gaps found by reading the runbook, not by repeating the Phase 3D labels.

| Check | Disposable case | Result |
| --- | --- | --- |
| `require_private_work` | Valid marked mode `700` directory | Pass. Outside sentinel unchanged. |
| `require_private_work` | Empty, unset, relative, root, symlink, mode `755`, and missing marker | Stop. Sentinel unchanged. |
| `require_rclone_download` | Drive source and destination inside the work directory | Pass |
| `require_rclone_download` | Reversed arguments, empty `work` with destination `/file`, and a `..` destination | Stop. No rclone program was launched. |
| Exit capture | A disposable command exiting 7, after `set -e` had been on | Exit 7. The following command did not run. |
| Exit capture | A disposable command exiting 0 | Pass. The following command ran. |
| Guard before a client | Empty `work`, then a disposable program | Stop. The program was not executed. |
| Passphrase cleanup | A passphrase name hard-linked to an outside sentinel | Stop. Both names remained. |
| Section K cleanup | `archive.tar` hard-linked to an outside sentinel | Stop. The sentinel and an unlisted file remained. |
| Extraction guard | Work directory without the marker | Stop. The destination was not created. |

The historical `age`, GnuPG, OpenSSL, and `pg_restore` commands were not executed. The pinned binaries were not executed.

## R. Prerequisite register and recovery gates

Phase 3F, 17 November 2026, IST. This section collects every unresolved prerequisite as of that phase. Phase 3G, 17 November 2026, IST, corrected the gate states below. Section T records what was later established. This section is the audit trail, not the current status table.

Missing evidence is **OPEN**. A test that was not run is **NOT TESTED**. A step that cannot be performed in the recorded environment is **BLOCKED**. A choice that only the owner or administrator can make is **OWNER DECISION REQUIRED**. None of these words means that a test failed.

When this register was written, `/home/ubuntu/tejas-backups/bin/age` and `/usr/lib/postgresql/17/bin/pg_restore` were absent. Their version output had not been read. No external service was contacted to refresh a status in that phase. Section T later records both version checks. Do not replace those pinned binaries to repeat the check.

### Register index

| ID | Prerequisite | Status | Responsible | Blocks | Real backup | External service |
| --- | --- | --- | --- | --- | --- | --- |
| P-01 | Plaintext database-dump size | OPEN | Owner | Database decryption | No, if a retained record exists | No |
| P-02 | Free space required before decryption | OPEN | Technical Operator | Database decryption | No | No |
| P-03 | Portable PostgreSQL 17.12.0 archive checksum | OPEN | Owner | Reuse of that portable package | No | No |
| P-04 | Expected `supabase_vault` 0.3.1 relation list | OWNER DECISION REQUIRED | Owner | Database RECOVERY COMPLETE | No | No |
| P-05 | Current pull request #25 status | OPEN | Owner | Nothing | No | Yes, so it was not refreshed |
| P-06 | Storage extraction authorization | OWNER DECISION REQUIRED | Owner | Storage extraction | No, for the decision itself | No |
| P-07 | Real passphrase bytes and trailing newline | OWNER DECISION REQUIRED | Owner | Decryption of the named archive | No. Do not reveal the bytes | No |
| P-08 | Offline passphrase custody | OWNER DECISION REQUIRED | Owner | Decryption of the named archive | No. Do not reveal the bytes | No |
| P-09 | Real database and Storage archive validation | NOT TESTED | Technical Operator | VALIDATION PASSED and RECOVERY COMPLETE | Yes, to produce the evidence | Yes, only for a new download |
| P-10 | Pinned age and `pg_restore` version output | NOT TESTED | Technical Operator | age decryption and any `pg_restore` use | No | No |
| P-11 | GNU tar extraction of unsafe members | NOT TESTED | Owner | Storage extraction acceptance | No | No |
| P-12 | Companion `.globals.sql.enc` and `.metadata.json.enc` files | OWNER DECISION REQUIRED | Owner | Role recovery only | No, until a copy is identified | No |
| P-13 | Install commands for the non-vault extensions, and `supabase_vault` build flags | OPEN | Administrator | A new restore only if the server cannot create them | No | No |
| P-14 | Exact SQL that counted all 68 tables | OPEN | Owner | A row-by-row recount only | No | No |
| P-15 | Historical `tar` argument list | OPEN | Owner | Treating the old extraction as a safe procedure | No | No |
| P-16 | Shell-history clear command | OPEN | Administrator | Cleanup only after a secret was captured | No | No |
| P-17 | `tejasdrive` availability and the shared rclone client | OPEN | Owner | Downloads, if the remote is absent | No | Yes, so it was not refreshed |
| P-18 | Supabase Storage upload command | OWNER DECISION REQUIRED | Owner | Storage upload | Yes, if upload is later approved | Yes |
| P-19 | Production repair plan | OWNER DECISION REQUIRED | Owner | Production writes | Yes | Yes |
| P-20 | Missing Production role | OWNER DECISION REQUIRED | Owner | Continuing after a role error | No, until that error exists | No |
| P-21 | Historical OpenSSL version string and historical restore `version()` string | OPEN | Owner | None. A new restore still checks `version()` | No | No |
| P-22 | Live device-node synthetic case | BLOCKED | Technical Operator | Nothing in the recovery gates | No | No |

### What each item requires

P-01. Section B records the plaintext checksum and says the size was not retained. This is missing evidence, not a failed measurement. The owner may supply a size from a retained record. Do not decrypt the archive to discover the size, and do not invent one. Until a size is recorded, do not decrypt the database archive. A ciphertext checksum does not use this size. Section T later recorded 476,793 bytes. Do not decrypt the archive again to rediscover that size.

P-02. Section B requires a free-space comparison against the P-01 size. The operator measures free space on the recovery work filesystem at execution time. That measurement does not need the backup file. It cannot be completed while P-01 is open. Do not invent the figure.

P-03. Section O says the published checksum matched and that the exact SHA-256 was not retained. This is missing evidence, not a failed comparison. Do not invent the digest and do not download the archive to recreate it during this phase. Reusing that portable package later requires the retained digest. The historical restore server is separate and does not depend on this digest.

P-04. Sections G and H retain `supabase_vault` 0.3.1 and `vault.secrets` count 0. The other relation names were not retained. The owner approves an expected-object list from an independent source. Do not invent names. The 15 November restore remains historical. A new restore cannot be called fully checked, and database RECOVERY COMPLETE cannot be declared, until the list exists. Do not run that restore to discover the names. Limited validation does not need the list.

P-05. Section I records that pull request #25 was open and unmerged on 17 November 2026 and that this status was not reverified. Refreshing it would require GitHub, which this phase does not use. Applying the pull request is a software change. It is not required to decrypt, restore, or extract the backup. Do not apply it as part of recovery, regardless of its later status.

P-06. Sections A and F require a separate owner authorization before `tar -x` on the real Storage archive. A checker exit of 0 is not that authorization. The decision itself does not read the archive. Until it is granted, do not extract, and do not mark Storage recovery or full recovery complete. P-06 does not block a ciphertext checksum, age decryption, or the section F checker.

P-07. Sections C and N say the real passphrase bytes, including any trailing newline, are unknown. The dummy tests did not use a TEJAS variable. The real bytes remain **NOT TESTED**. The open action is an owner confirmation, so the register status is **OWNER DECISION REQUIRED**. The owner confirms that the stored bytes for the named secret will be supplied unchanged. Database decryption uses `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE`. Storage decryption uses the one named identity file. Confirmation of one secret does not confirm the other. Do not write the bytes into this runbook, and do not trim, normalize, or add a newline to make decryption succeed. If decryption fails for that reason, stop.

P-08. Section C and section J say offline custody was not verified. The owner confirms custody for the secret named in the authorization. Confirmation of the database passphrase does not confirm an identity file, and the reverse is also unresolved until the owner confirms it. Confirmation does not include sending either value. Do not decrypt with a passphrase whose custody the owner has not confirmed.

P-09. Sections B, F, and G identify the real archives and say they remain **NOT TESTED**. No phase failed a real decrypt, extract, or restore, because none was run. P-09 is the evidence produced by an authorized limited validation. It is required before VALIDATION PASSED and before RECOVERY COMPLETE for that archive. It is not required before the written authorization that names the first validation. Database evidence does not satisfy the Storage archive, and Storage evidence does not satisfy the database archive. Do not declare either of those two states without a recorded result. Section T later records the 17 November checks. This paragraph described the register before that execution.

P-10. Section F pins age at `/home/ubuntu/tejas-backups/bin/age` and expects output `v1.3.2`. Section G pins `pg_restore` at `/usr/lib/postgresql/17/bin/pg_restore` and expects PostgreSQL 17. Both paths are absent on this computer, and neither program was executed. On the recovery computer, the operator may run only `--version`, with no archive or dump argument. Do not accept a binary from `PATH`. Do not run age decryption before the age result is `v1.3.2`. Do not run `pg_restore`, including `--list`, before the client result starts with PostgreSQL 17. A ciphertext checksum does not use either binary.

P-11. Section F and section M stopped unsafe synthetic members before `tar -x`. GNU tar's extraction behavior for an absolute path, a traversal name, a symlink, a hard link, and a duplicate member is **NOT TESTED**. Do not extract those members to learn the behavior. The owner accepts that residual limit in the same decision as P-06, or withholds extraction. Withholding it blocks extraction. It does not block the section F checker. Do not describe the tar options as a tested containment boundary.

P-12. Section B says the companion files were not in the verified Drive folder. Their full names and any surviving copy were not established. The owner decides whether role recovery depends on them. Do not add `--no-owner` or `--no-acl` while this is open.

P-13. Section C records the five extension versions and the vault SQL. The package commands for the other four extensions, and the vault compile flags, were not preserved. If a packaged `supabase_vault` 0.3.1 is absent, stop. Do not skip dump objects instead of installing the matching extension.

P-14. Section H preserves the eight area counts and says the exact 68-table script was not preserved. The area comparison can use those counts. A full row-by-row recount needs the owner to supply the query text. Do not invent that script and do not update rows to make counts match.

P-15. Sections F and M say the historical `tar` argument list was not preserved. Use the section F checker and the separate extraction decision. Do not reconstruct the old command from memory.

P-16. Sections C, J, and K say no tested history-clear command was recorded. This matters only after a secret is captured. Until the administrator identifies the command for the shell in use, do not clear history by guessing and do not paste the history into a report.

P-17. Section D says `tejasdrive` used scope `drive.file` on 17 November 2026. If that remote is absent, stop and ask the owner before authorizing rclone again. Replacing the shared Google client is a separate approval. This phase did not contact Google Drive, so current availability is not known.

P-18. Section F records no upload command for the four Storage objects. Upload is not part of recovering the backup. The owner must give a separate approval, confirm the buckets are private, and decide overwrite behavior. Do not upload while this is open.

P-19. Section I says the isolated restore is not permission to repair Production. A later plan must name the target database, backup file, baseline time, and rollback method. This runbook does not contain that plan. Do not write to Production while this is open.

P-20. Section G says a missing role stops the restore. The owner decides how to handle it. `--no-owner` and `--no-acl` remain prohibited. Do not continue a restore by adding those flags.

P-21. Section C says the historical OpenSSL version string was not recorded. Section C also says the historical restore server's `version()` string was not recorded. These are missing records, not failed checks. A new restore still requires `version()` to report PostgreSQL 17. Do not invent either historical string.

P-22. Section N records that `mknod` was not permitted, so the live device-node case is **BLOCKED**. Section M tested a character-device tar header only. This does not block either recovery gate. Do not create a device node to close it.

### Gate states

The database gate and the Storage gate each use five states. Upload and Production are separate decisions, not states of either gate.

- **CLOSED.** No real archive operation is authorized.
- **AUTHORIZED FOR LIMITED VALIDATION.** A separate written authorization names the exact archive, the permitted operation, the target, and the stop conditions. Only that validation may occur.
- **VALIDATION PASSED.** The authorized checks have succeeded and their evidence is recorded.
- **RECOVERY AUTHORIZED.** A separate authorization names the recovery operation and its target.
- **RECOVERY COMPLETE.** The required criteria for that component have been met and verified.

Limited validation does not authorize a restore, extraction, an upload, or a Production write. Recovery authorization does not authorize an upload or a Production write. One component reaching **RECOVERY COMPLETE** leaves the other component where it is.

### Database recovery gate

This gate covers a named database-archive validation, isolated `pg_restore`, and the section H comparison. It does not authorize Storage extraction or a Storage upload. When this paragraph was written, its state was **CLOSED**. Section V is the later state.

**AUTHORIZED FOR LIMITED VALIDATION** may name a ciphertext checksum while P-01 remains open. It may name decryption only after P-01 and P-02 are recorded figures and the owner has confirmed P-07 and P-08 for `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE`. The confirmation names the secret and does not include its bytes. It may name `pg_restore --list` only after P-10 shows that `/usr/lib/postgresql/17/bin/pg_restore` is PostgreSQL 17. The writing names the section B database archive, the work target, and the stop conditions. P-09 remains **NOT TESTED** when that writing is made. This runbook is not that writing.

**VALIDATION PASSED** records the result of the named checks. A failed check does not reach this state and does not authorize recovery. This state does not authorize `pg_restore` into a database.

**RECOVERY AUTHORIZED** is a second writing. It names the disposable database, the host, and the port. The host is `/var/run/postgresql`, `127.0.0.1`, or `::1`. The database is not `postgres` and it is not Production. It requires decrypt-validation evidence and the pinned PostgreSQL 17 client. It does not follow from the validation authorization.

**RECOVERY COMPLETE** requires a captured `pg_restore` exit of 0, a server-confirmed target match, the section H comparison, and P-04. P-04 is required before a new restore is called fully checked. The database P-09 evidence is part of this completion. P-06, P-11, and P-18 do not move this gate. P-05 does not move it. Section V records that the isolated restore exited 0 and that the schema and function comparison remains pending, so this gate is not complete.

### Storage recovery gate

This gate covers a named Storage-archive validation and extraction after P-06. It does not authorize `pg_restore`, a database restore, or an upload. When this paragraph was written, its state was **CLOSED**. Section V is the later state.

**AUTHORIZED FOR LIMITED VALIDATION** may name a ciphertext checksum, age decryption, or the section F checker. Decryption and the checker require P-07 and P-08 for the named identity file, without its bytes, and P-10 output `v1.3.2` from `/home/ubuntu/tejas-backups/bin/age`. The writing names the section B Storage archive, the work target, and the stop conditions. P-06 is not required to start the checker. P-09 remains **NOT TESTED** when that writing is made. P-11 remains **NOT TESTED** and is disclosed in any later extraction decision.

**VALIDATION PASSED** records the checker result when the checker was one of the authorized checks. A checker exit of 0 is evidence for this state. It is not permission to extract.

**RECOVERY AUTHORIZED** is the extraction decision. It requires P-06, the owner's acceptance of the P-11 limit, and a checker result that has already passed. The writing names the archive and the extract target. Withholding P-06 or P-11 leaves extraction unauthorized and leaves a completed checker at **VALIDATION PASSED**.

**RECOVERY COMPLETE** requires that authorized extraction and a match of the four section B file hashes. The Storage P-09 evidence is part of this completion. P-18 remains a separate upload decision. That gate name covers the archive check and the four hashes. It does not mean a Supabase Storage destination was restored. Section V uses **ARCHIVE VALIDATION COMPLETE**, **RESTORATION NOT PERFORMED**, and **UPLOAD NOT PERFORMED**.

### Full recovery gate

Full recovery requires the database gate and the Storage gate, each at **RECOVERY COMPLETE**. Either component alone leaves full recovery **CLOSED**. P-18 remains an upload decision. P-19 remains a Production decision. P-05 remains a software-change decision and is not a third component of full recovery.

### Owner decisions

These boxes are not answers. None is approved by this runbook.

- [ ] Authorize one limited validation, or withhold it. Name the archive, the operation, the target, and the stop conditions.
- [ ] Authorize the database restore in a separate decision, or withhold it.
- [ ] P-04: approve an expected `supabase_vault` 0.3.1 object list from an independent source, or withhold the fully checked claim.
- [ ] P-07: confirm that the stored passphrase bytes for the named secret will be supplied unchanged, including the unresolved trailing newline. Do not write the bytes here.
- [ ] P-08: confirm offline custody for the named secret. Do not write the value here.
- [ ] P-06: authorize Storage extraction, or withhold it.
- [ ] P-11: accept that unsafe-member extraction is **NOT TESTED**, or withhold extraction.
- [ ] Name the disposable database, host, and port. The host is `/var/run/postgresql`, `127.0.0.1`, or `::1`. Do not name Production.
- [ ] Confirm that the backup identity is the section B file IDs, sizes, and checksums.
- [ ] P-05: decide any software change for pull request #25 outside this recovery. Do not approve applying it as part of recovery.
- [ ] P-12: decide whether the missing companion files are required for roles.
- [ ] P-18: authorize a Supabase Storage upload, or withhold it.
- [ ] P-19: authorize a Production write under a separate plan, or withhold it.
- [ ] P-20: decide, only after a missing-role error, how to proceed without `--no-owner` or `--no-acl`.

### Operator tasks before any real file is read

The operator can do these without a real backup, a passphrase, or an external service:

- Keep section R matched to sections A through S. A blocker is removed only when its evidence is recorded.
- On the future recovery computer, run only the pinned `--version` checks in P-10. Do not pass an archive or a dump.
- Measure free space for P-02 after P-01 has a real figure.
- Prepare an empty local PostgreSQL 17 server. Do not connect it to Production.
- Refuse `--no-owner`, `--no-acl`, a Drive destination, and extraction while P-06 is open.

A real TEJAS file is read only when its gate is **AUTHORIZED FOR LIMITED VALIDATION** for that named operation, or **RECOVERY AUTHORIZED** for that named recovery operation. **CLOSED** permits neither. **VALIDATION PASSED** records evidence and does not itself permit the recovery operation.

## S. Phase 3G gate-state logic

Phase 3G, 17 November 2026, IST. This section records the dependency audit and the disposable logic tests. It does not authorize a real archive operation. The real TEJAS backups remain **NOT TESTED**.

### Wording corrected

Phase 3F said the database gate stays closed until its list is true, and that the gate is not complete while P-09 remains **NOT TESTED**. The operator rule then said a real file waits until the gate is open. Together, those sentences required the validation result before the authorization that would produce it.

Phase 3F also said the Storage gate stays closed until the checker exits 0 and the four file hashes match. Those results are produced by the checker and by extraction. It required P-06 before the gate, so the pre-extraction checker waited on extraction authorization. Withholding P-11 closed every Storage step, including a checksum and the checker.

Section R now uses the five states. P-09, a checker exit, and the four hashes are evidence for **VALIDATION PASSED** or **RECOVERY COMPLETE**. They are not permission to begin. P-06 and P-11 block extraction. They do not block the checker. No prerequisite in P-01 through P-22 changed from unresolved to resolved. No approval was added.

### Dependency audit

The status and the responsible party are unchanged. The dependency column is the Phase 3G reading.

| ID | Status | Responsible | Dependency | Stop condition |
| --- | --- | --- | --- | --- |
| P-01 | OPEN | Owner | Decrypt waits on a retained size. Checksum validation does not. | Do not decrypt to discover the size, and do not invent it. |
| P-02 | OPEN | Technical Operator | Decrypt waits on a free-space comparison. P-02 waits on P-01. The comparison does not read the archive. | Do not invent the free-space figure. |
| P-03 | OPEN | Owner | No database, Storage, upload, or Production dependency. | Do not reuse the portable package without the retained digest. |
| P-04 | OWNER DECISION REQUIRED | Owner | Database **RECOVERY COMPLETE** waits on the approved list. Limited validation does not. | Do not invent relation names or call a new restore fully checked. |
| P-05 | OPEN | Owner | No validation, recovery, upload, or Production dependency. | Do not apply pull request #25 as part of recovery. |
| P-06 | OWNER DECISION REQUIRED | Owner | Extraction waits on this writing. The checker does not. | Do not run `tar -x` on the real archive. |
| P-07 | OWNER DECISION REQUIRED | Owner | Decryption waits on confirmation for the named secret. The real bytes remain **NOT TESTED**. | Do not write, trim, or invent the bytes. |
| P-08 | OWNER DECISION REQUIRED | Owner | Decryption waits on custody confirmation for the named secret. | Do not decrypt on an unconfirmed custody. |
| P-09 | NOT TESTED | Technical Operator | **VALIDATION PASSED** and **RECOVERY COMPLETE** wait on recorded evidence. The first validation authorization does not. | Do not declare either state without that evidence. |
| P-10 | NOT TESTED | Technical Operator | age decryption waits on `v1.3.2`. Any `pg_restore` use waits on PostgreSQL 17. A checksum waits on neither. | Do not pass an archive or a dump to the version check. |
| P-11 | NOT TESTED | Owner | Extraction acceptance waits on this disclosure. The checker does not. | Do not extract unsafe members to learn tar's behavior. |
| P-12 | OWNER DECISION REQUIRED | Owner | Role recovery from the missing companion files. | Do not add `--no-owner` or `--no-acl`. |
| P-13 | OPEN | Administrator | A restore stops if the matching extension cannot be created. | Do not skip dump objects in place of the extension. |
| P-14 | OPEN | Owner | A 68-table recount only. The eight area counts remain usable. | Do not invent the counting script. |
| P-15 | OPEN | Owner | Reuse of the unknown historical tar command. | Do not reconstruct that command from memory. |
| P-16 | OPEN | Administrator | Cleanup after a captured secret. | Do not guess a history-clear command. |
| P-17 | OPEN | Owner | A new download when `tejasdrive` is absent. | Do not re-authorize rclone or replace the shared client here. |
| P-18 | OWNER DECISION REQUIRED | Owner | Upload only. | Do not upload to Supabase Storage. |
| P-19 | OWNER DECISION REQUIRED | Owner | Production writes only. | Do not write to Production. |
| P-20 | OWNER DECISION REQUIRED | Owner | Continuation after a missing-role error. | Do not add `--no-owner` or `--no-acl`. |
| P-21 | OPEN | Owner | No gate dependency. A new restore still checks `version()`. | Do not invent the missing historical strings. |
| P-22 | BLOCKED | Technical Operator | No gate dependency. | Do not create a device node to close it. |

P-01 and P-02 are ordered, not circular. P-07 and P-08 are the byte rule and the custody rule for one named secret. P-12 and P-20 are the missing companion files and a later role error. P-06 and P-11 are the extraction decision and the untested tar limit. No second register entry repeats an ID.

### Disposable logic tests

The tests used string identifiers `tejas-database-dump.enc`, `tejas-storage.tar.age`, and `identity.gpg`. They did not open a file, a passphrase, a database, or a network service. All 27 cases passed.

| Check | Fixture state | Result |
| --- | --- | --- |
| Gate closed | No authorization | Decrypt validation denied. Restore denied. |
| Validation without recovery | Checksum authorization while P-09 was **NOT TESTED** | State became **AUTHORIZED FOR LIMITED VALIDATION**. Restore denied. |
| Validation failure | Authorized decrypt returned failure | State stayed **AUTHORIZED FOR LIMITED VALIDATION**. Recovery authorization denied. |
| Validation success | Authorized decrypt returned success | State became **VALIDATION PASSED**. Restore still denied. |
| Restore authorization | A second writing after **VALIDATION PASSED** | Restore denied until that writing. The validation writing was not enough. |
| Extraction | Checker passed and P-06 unset | Extraction denied. |
| Extraction after P-06 | Checker passed, P-06 set, P-11 accepted, recovery writing present | Extraction allowed in the fixture only. |
| Upload | Storage **RECOVERY COMPLETE**, P-18 unset | Upload denied. |
| Production | P-19 unset | Production write denied. |
| Database only | Database **RECOVERY COMPLETE**, Storage **CLOSED** | Full recovery denied. |
| Storage only | Storage **RECOVERY COMPLETE**, database **CLOSED** | Full recovery denied. |
| Both complete | Both fixture gates **RECOVERY COMPLETE** | The fixture accepted full recovery. The real gates remain **CLOSED**. Upload and Production still denied. |
| Checksum and P-01 | P-01 unset | Checksum authorization allowed. Decrypt authorization denied. |
| Checker and P-06 | P-06 unset | Checker authorization allowed. |
| P-04 | Restore evidence present, P-04 unset | Database **RECOVERY COMPLETE** denied. |
| P-05 | No P-05 input on the fixture | Full recovery did not read it. |

## T. Execution evidence, 17 November 2026

Current verified evidence, recorded 17 November 2026, 12:49 IST. The computer was Ubuntu 24.04.5, hostname `cursor`. The work filesystem had 263,068,471,296 bytes free. This section does not replace the historical commands or checksums in sections A through S. It does replace statements that the 17 November execution had not yet happened. Section W is the operator rule.

The owner authorization in the execution request covered pending recovery work. It did not name a Production database other than the injected remote URLs, and those URLs use database name `postgres`. No statement in this section is a Production change.

### Archive identity

Drive remote `tejasdrive` listed the same three folders and four files as section B. Copies were downloaded into a mode `700` workspace. The originals on Drive were not uploaded to, renamed, or deleted. A later listing showed the same four sizes.

| File | Bytes | SHA-256 | Result |
| --- | --- | --- | --- |
| Database `.dump.enc` | 476,816 | `49d69874bc494c2c353a903906045ece4ad37c989a69ddaf0ae7195314fcdde1` | Match |
| Storage `.tar.age` | 555,336 | `ac76e4f8895284f098e0f674d58d8a901702f7b219809a0d51f64b358d7e72c4` | Match |
| `identity.gpg` | 273 | `fd2df7cdfd3041cf33c1bce947af0b90213e449642c58b4d7de1ce1f3fb1ab5b` | Match |
| `identity.owner.gpg` | 248 | `e6f86e98fb5203cf75daa7f8dfa13e6d608f1b71fe8c8f0987eb6d4c5a0945cf` | Match |

The local file `/home/ubuntu/tejas-backups/age-recovery/tejas-storage-backup.identity.owner.gpg` is 248 bytes, mode `600`, and has the owner-file digest above. It was not modified. No `.globals.sql.enc` or `.metadata.json.enc` file was found on Drive or on this computer.

### Database validation and isolated restore

The encryption passphrase was already in the environment. Its bytes were not printed, hashed, or edited. The value had no trailing newline. OpenSSL 3.0.13 decrypted a copy with the historical `env:` command. OpenSSL exited 0. The plaintext was 476,793 bytes, began with the custom-dump header, and its SHA-256 was `408b10c3ef0e18bd4cde728afe529a780c7d2af7f83042c16c5faf9fe327e4b8`. That is current measured evidence. It does not change the older statement that the size had not been retained before this run.

The plaintext was removed after the restore. The encrypted copy remains.

`pg_restore` at `/usr/lib/postgresql/17/bin/pg_restore` reports `pg_restore (PostgreSQL) 17.12 (Ubuntu 17.12-1.pgdg24.04+1)`. It came from the signed PGDG repository after the published key fingerprint `B97B0AFCAA1A47F044F244A07FCC7D46ACCC4CF8` was checked. The archive TOC says it was dumped from PostgreSQL 17.11 by pg_dump 17.12 (Ubuntu 17.12-1.pgdg24.04+1) at 2026-11-15 00:44:17 UTC. The historical OpenSSL version string is still not in a retained log. The current OpenSSL 3.0.13 string is the version that decrypted the copy. It is not a claim about the 15 November binary.

The local cluster is PostgreSQL 17.12 on socket `/var/run/postgresql`, port `5432`. That port is the cluster that was created here. It is not the historical port `5433`. `inet_server_addr()` was null. The target database `tejas_restore_full_20261115` was created empty. It is not database `postgres` and it is not the remote Supabase URL.

The first restore exited 1 because role `supabase_admin` did not exist. The incomplete database was dropped. The dump names these roles and does not contain `CREATE ROLE`: `anon`, `authenticated`, `dashboard_user`, `pgbouncer`, `service_role`, `supabase_admin`, `supabase_auth_admin`, `supabase_functions_admin`, `supabase_realtime_admin`, and `supabase_storage_admin`. They were created on this local cluster only, `NOLOGIN` and `NOINHERIT`, with no password. `supabase_admin` was then made a local superuser because the dump assigns it event triggers, and PostgreSQL requires that owner to be a superuser. No Production role was created or altered. `--no-owner` and `--no-acl` were not used.

The second restore exited 0.

`supabase_vault` 0.3.1 was built from git tag `v0.3.1`, commit `6e0cd916242d922a646e4d611cc215e09dd429f4`, using that tag's Makefile and `PG_CONFIG=/usr/lib/postgresql/17/bin/pg_config`. The other four extensions were already available at the historical versions. After restore, `pg_extension` showed five extensions: `pg_stat_statements` 1.11, `pgcrypto` 1.3, `plpgsql` 1.0, `supabase_vault` 0.3.1, and `uuid-ossp` 1.1. `vault.secrets` count was 0.

Observed inventory, from queries run in this session. These queries are current evidence. They are not the missing historical 68-table script.

| Measure | Observed | Historical figure |
| --- | --- | --- |
| Ordinary tables plus one partitioned table | 68 | 68 |
| Ordinary indexes plus two partitioned indexes | 189 | 189 |
| Constraints | 238 | 238 |
| Sequences | 2 | 2 |
| Triggers | 12 | 12 |
| Extensions | 5 | 5 |
| Non-system schemas, including `vault` | 10 | 9 |
| Functions outside system schemas | 117 | 116 |
| Invalid indexes | 0 | not separately recorded |

One check constraint, `realtime.messages_payload_exclusive`, is not validated. The restore did not change it afterward. `public.tejas_case_files` and `public.tejas_payment_utrs` are absent.

Application counts, with no row contents recorded:

| Area | Table | Rows |
| --- | --- | --- |
| Payments | `public.tejas_payments` | 2, one `confirmed` and one `reported` |
| Registrations | `public.tejas_registrations` | 2 |
| Entitlements | `public.tejas_learn_entitlements` | 3, one `verified` and two `unpaid` |
| E-book audit | `public.tejas_learn_audit` | 20 |
| Book orders | `public.tejas_book_orders` | 2 |
| E-book access | `public.tejas_ebook_access` | 2 |
| Payment proofs | `public.tejas_payment_proofs` | 2 |
| Idempotency | `public.tejas_idempotency` | 2 |

The schema count and the function count do not equal the unlabeled historical totals. Section U records the read-only reconciliation. Database historical object-count reconciliation stays pending.

### Storage validation

Age v1.3.2 was downloaded from the official v1.3.2 release and checked with `sigsum-verify` against the two public keys published in that tag's `SIGSUM.md`. The binary was installed at `/home/ubuntu/tejas-backups/bin/age`. `--version` returned `v1.3.2` and one trailing newline. No PATH binary was used.

The original identity file decrypted with the encryption passphrase file. GnuPG exited 0. The plaintext identity SHA-256 was `86ac6f159d6a53449622fa1ba4dccad08dd019ec19b855aa5d79e02ea05996e8`. The identity and the passphrase file were then unlinked. The owner passphrase was present, had no trailing newline, and was not used, because the matching identity file had already decrypted. Offline custody beyond this computer and Drive was not verified.

Pinned age decrypted the Storage copy. The section F checker exited 0 on 10 members. The four named files were extracted into a new mode `700` directory. Their sizes and SHA-256 values matched section B. Those extracted files were then removed from the workspace. The encrypted `.tar.age` copy remains. The status of that work is **ARCHIVE VALIDATION COMPLETE**. Supabase Storage **UPLOAD NOT PERFORMED**. Destination restoration was **RESTORATION NOT PERFORMED**.

### GNU tar 1.35 disposable results

These used archives created for the test. They did not use a TEJAS archive.

| Case | Result |
| --- | --- |
| Absolute member | Exit 0. Tar removed the leading slash and wrote inside the destination. The absolute target was not written. |
| `..` member | Exit 2. Tar rejected the member. The outside sentinel stayed unchanged. |
| Symlink | Exit 0. The symlink was created. |
| Hard link | Exit 0. The two names shared one inode. |
| Duplicate member | Exit 0. The later member remained. |
| FIFO | Exit 0. A FIFO was created. |
| Character-device header | Exit 2. `mknod` returned `EPERM`. No device node remained. |
| Direct `mknod` | `EPERM`. This case stays **BLOCKED**. |
| Unexpected member | Exit 0. Tar extracted it. The checker, not tar, is what rejects it. |
| Truncated payload | Exit 2. Tar said it did not look like a tar archive. |
| Existing destination file | Exit 0. `--no-overwrite-dir` did not keep the old bytes. |
| Stored ownership | Exit 0. The file is owned by the extracting user, not the stored uid. |

### Current prerequisite status

| ID | Status now | Evidence | Remaining action |
| --- | --- | --- | --- |
| P-01 | Closed for the measured size | Plaintext copy was 476,793 bytes | None for decryption safety |
| P-02 | Closed | 263,068,471,296 bytes free before decryption | None |
| P-03 | OPEN | Portable archive checksum was not found | Do not invent it |
| P-04 | Observed, confirmation outstanding | Installed and restored `supabase_vault` 0.3.1; `vault.secrets` count 0 | Owner confirmation of any fuller expected list |
| P-05 | Refreshed | Pull request #25 is open, not merged, head `fff8cd20cd78ecca7d0c8beeef83f25cd4eb805c`, base `266156332bda1ca3857471c0d83ec59134c83d3f` | Do not merge it as recovery |
| P-06 | Used | Checker exit 0, then the four named files were extracted | None for that extraction |
| P-07 | Closed for the encryption passphrase | Bytes were used unchanged and both decryptions matched | Owner passphrase was not used |
| P-08 | OPEN | Drive copies and the local owner file match section B | Offline custody outside this computer and Drive is not verified |
| P-09 | Closed for these checks | Both ciphertext digests, the plaintext digest, and the four file digests matched | None for those checks |
| P-10 | Closed | Pinned age `v1.3.2`; pinned `pg_restore` PostgreSQL 17.12 | None |
| P-11 | Tested | GNU tar 1.35 results above | Do not treat tar options as a substitute for the checker |
| P-12 | OPEN | Companion files were not found | Do not invent them |
| P-13 | Closed on this cluster | Five extensions at the recorded versions | Production installation is separate |
| P-14 | OPEN for the original script | A labeled count of ordinary plus partitioned tables is 68 | Do not call that query the historical script |
| P-15 | OPEN for the historical command | The named-file extraction in section F was used | Do not call it the historical tar command |
| P-16 | Documented | Bash `set +o history` does not erase existing history. No history was deleted | None |
| P-17 | Closed for this download | `tejasdrive` listed and downloaded into the workspace. Nothing was copied back to Drive | Shared-client replacement remains separate |
| P-18 | OPEN | No upload was performed | Do not invent a bucket or command |
| P-19 | Plan only | No Production restore. The injected URL points at remote database `postgres` | Do not restore there |
| P-20 | Local only | Named roles were created on this cluster. Production roles were not changed | Do not copy those grants to Production without the missing globals file |
| P-21 | Partial | Archive header records PostgreSQL 17.11 and pg_dump 17.12. Current OpenSSL is 3.0.13 | Historical OpenSSL version string remains unknown |
| P-22 | BLOCKED | `mknod` returned `EPERM` | Do not raise privileges to force it |

### Gate result

Database archive validation is complete. The isolated restore exited 0 and the application counts matched. Historical schema and function reconciliation is pending, so full database recovery is not declared complete.

Storage archive validation is complete. Supabase Storage upload was not performed, and Storage objects were not restored to a Supabase destination.

Full recovery is not complete. Production recovery was not performed. Pull request #25 was not merged.

### Cleanup

The passphrase file, plaintext identity, plaintext database dump, and extracted Storage files were unlinked inside the marked workspace. Ordinary unlink is not secure erasure. The encrypted copies in the workspace and the Drive originals remain. Unsetting `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE`, `TEJAS_BACKUP_OWNER_PASSPHRASE`, and `SUPABASE_BACKUP_DB_URL` in the shell does not revoke those credentials. No secret value was written into this runbook.

## U. Phase 4 reconciliation, 17 November 2026, 12:54 IST

Read-only inspection of local database `tejas_restore_full_20261115`. No Production connection. No rows were changed. No function was dropped or altered. The plaintext dump was already gone, so this phase did not re-read the dump SQL.

### Current recovery states

| Component | State |
| --- | --- |
| Database archive validation | Complete |
| Database isolated restore | Complete. Exit 0 into an empty local database |
| Database historical object-count reconciliation | Pending |
| Storage archive validation | Complete |
| Storage destination restoration | Not performed |
| Storage upload | Not performed |
| Production recovery | Not performed |
| Full disaster recovery | Not complete |

### Schema reconciliation

System schemas present: `pg_catalog`, `information_schema`, `pg_toast`.

Non-system schemas, 10:

| Schema | Notes |
| --- | --- |
| `auth` | Present in the restored catalogs |
| `extensions` | Install schema for `pgcrypto`, `pg_stat_statements`, and `uuid-ossp` |
| `graphql` | Present |
| `graphql_public` | Present |
| `pgbouncer` | Name begins with `pg_`, but it is not one of the three system schemas above |
| `public` | Present |
| `realtime` | Present |
| `storage` | Present |
| `supabase_migrations` | Present |
| `vault` | Install schema of `supabase_vault` 0.3.1 |

`pg_depend` does not mark any of these schemas as an extension-owned namespace. `supabase_vault` is installed in `vault`.

Counting rules:

| Rule | Count |
| --- | --- |
| System schemas named above | 3 |
| Non-system schemas | 10 |
| Non-system schemas except `vault` | 9 |
| Non-system schemas except `pgbouncer` | 9 |

The historical total is 9. Excluding `vault` yields 9, and excluding `pgbouncer` also yields 9. The original counting query was not preserved, so the difference of one is not uniquely explained. Schema reconciliation stays pending.

### Function reconciliation

Every non-system function has `prokind` `f`. The count is by function OID.

| Rule | Count |
| --- | --- |
| Non-system function OIDs | 117 |
| Distinct schema and name | 102 |
| Non-system OIDs except the five `vault` functions | 112 |
| Non-system OIDs that are not extension members | 63 |

By schema: `auth` 4, `extensions` 55 of which 49 are extension members, `graphql_public` 1, `pgbouncer` 1, `public` 8, `realtime` 19, `storage` 24, `vault` 5. All five `vault` functions are members of `supabase_vault`: `_crypto_aead_det_decrypt`, `_crypto_aead_det_encrypt`, `_crypto_aead_det_noncegen`, `create_secret`, and `update_secret`.

The historical total is 116. None of the documented filters above equals 116. Distinct names equal 102, not 116. The extra OID cannot be identified as one specific function. The historical counting script was not found. Function reconciliation stays pending. No function was changed to force a match.

### Vault and extensions

| Extension | Version | Install schema |
| --- | --- | --- |
| `pg_stat_statements` | 1.11 | `extensions` |
| `pgcrypto` | 1.3 | `extensions` |
| `plpgsql` | 1.0 | `pg_catalog` |
| `supabase_vault` | 0.3.1 | `vault` |
| `uuid-ossp` | 1.1 | `extensions` |

Observed `vault` relations, from `pg_class`:

| Kind | Name |
| --- | --- |
| Table | `vault.secrets` |
| Index | `vault.secrets_pkey` |
| Index | `vault.secrets_name_idx` |
| View | `vault.decrypted_secrets` |

`vault.secrets` has 0 rows. This is the observed list. It is not an owner-approved expected inventory. P-04 stays **OWNER DECISION REQUIRED**.

### Integrity

The eight application-area counts in section T were read again and are unchanged. Invalid indexes: 0. Non-internal triggers: 12. Sequences: `auth.refresh_tokens_id_seq`, owned by `supabase_auth_admin` and attached to `auth.refresh_tokens.id`; `realtime.subscription_id_seq`, owned by `supabase_realtime_admin`, with no column dependency recorded. Unvalidated foreign keys: 0.

One check constraint is not validated: `realtime.messages_payload_exclusive`, defined as `CHECK (((payload IS NULL) OR (binary_payload IS NULL))) NOT VALID`. This phase did not run `VALIDATE CONSTRAINT`. The plaintext dump was already removed, so the dump text was not re-read. The constraint is in the restored catalog in the `NOT VALID` state the restore left behind. It was not altered.

`public.tejas_case_files` and `public.tejas_payment_utrs` are absent. They were not created.

### Local database retention

The database owner is `postgres`. `listen_addresses` is `localhost`. Port `5432` accepts a connection on `127.0.0.1`. `pg_hba.conf` allows local peer authentication and scram-sha-256 for `127.0.0.1/32` and `::1/128`. It does not allow a non-local address. The data directory `/var/lib/postgresql/17/main` is mode `700` and owned by `postgres`. The socket directory is mode `755`. The socket itself is mode `777`, which lets a local user attempt a connection. Authentication still applies.

`postgres` is a superuser and can log in. `supabase_admin` is a local superuser and cannot log in. The other local recovery roles cannot log in and are not superusers. Those grants were not copied to Production.

`/etc/postgresql/17/main/start.conf` says `auto`, and `postgresql.service` is enabled. The restored database is stored in the cluster data directory and is expected to remain across a restart if that service starts. This phase did not drop the database.

Retention recommendation: keep `tejas_restore_full_20261115` until the owner names that database and approves a disposal method. Disposal is not authorized by this section. A later disposal would need to drop that named database and account for copies in the data directory. Ordinary deletion is not secure erasure.

### Prerequisite confirmation

P-03, P-08, P-12, P-14, P-15, P-18, P-19, the historical OpenSSL version string, and P-22 stay unresolved. No checksum, companion file, historical script, historical tar command, upload destination, or Production plan was invented. P-04 stays an owner decision. P-18 stays open: archive validation is not an upload.

## V. Phase 5 independent audit, 17 November 2026, 12:58 IST

Read-only reconfirm of local database `tejas_restore_full_20261115` on the local socket. PostgreSQL `17.12 (Ubuntu 17.12-1.pgdg24.04+1)`. No decryption, no restore, no object change, and no Production connection.

### Reconfirmed state

| Component | State |
| --- | --- |
| Database ciphertext validation | Complete |
| Database plaintext digest validation | Complete |
| Database isolated restore | Complete |
| Database historical object-count reconciliation | Pending |
| Storage archive validation | Complete |
| Four named Storage files | Verified, then the extracted copies were removed |
| Storage destination restoration | Not performed |
| Supabase Storage upload | Not performed |
| Production recovery | Not performed |
| Full disaster recovery | Not complete |

The eight application-area counts were read again and still match section H. Non-system schemas remain the ten names in section U. Their ordered-name SHA-256 is `cccfa37fb6a5c1675aac23399f54bc0b5738bec01e5c36e80785270ca0531de1`. Non-system function OIDs remain 117. The ordered signature listing, schema, name, identity arguments, and extension owner, has SHA-256 `3429e65b3e9344ee6b8de5ebaf7bf878a5761f0448c05541e2a7121fe63bf4dd`. These two digests are a 17 November catalog reading. They are not historical checksums.

Extensions and the four observed `vault` relations match section U. `vault.secrets` still has 0 rows. Invalid indexes: 0. Non-internal triggers: 12. The only unvalidated constraint is still `realtime.messages_payload_exclusive`, unchanged and not validated. The two sequences and their owners match section U. `public.tejas_case_files` and `public.tejas_payment_utrs` remain absent.

`listen_addresses` is still `localhost`. The socket is still mode `777`. Local peer authentication and loopback scram-sha-256 are unchanged. `postgres` can log in and is a superuser. `supabase_admin` is a superuser and cannot log in. No other local recovery role is a superuser or can log in. Role memberships are only the default `pg_monitor` memberships. No Production grant was copied. The data directory remains mode `700`, owned by `postgres`. `start.conf` remains `auto`. The database was not dropped. This is not secure erasure.

### Historical script search

Searched every local commit and remote-tracking branch, the tag list (empty), GitHub code search on `dhevb/tejas` for the function total and for `pg_namespace` counts, and the repository documents `docs/PRODUCTION_MIGRATION_PREFLIGHT.md` and `docs/PORTAL_POST_MIGRATION_PRIVILEGE_AUDIT.md`.

The totals 9, 116, and 68 appear as recorded results in section H. They were introduced in commit `9245d0c613eb8c694d3ecf90b536bbc340ea2b32`. No schema-count query, function-count query, or 68-table script was found with a verified source. The portal documents count `public` relations and `tejas_%` functions. They are not the 15 November scripts. P-14 and the schema and function reconciliations stay unresolved. No replacement query was labeled historical.

### Prerequisite status

| ID | Status |
| --- | --- |
| P-01 | Closed for the measured plaintext size |
| P-02 | Closed for the measured free space |
| P-03 | Open. Portable PostgreSQL checksum was not found |
| P-04 | Owner decision. Observed relations are listed. The expected list is not approved |
| P-05 | Open pull request #25, not merged, and not part of recovery |
| P-06 | Used for the checker and the four named files |
| P-07 | Closed for the encryption passphrase. The owner passphrase was not used |
| P-08 | Open. Offline custody beyond this computer and Drive is not verified |
| P-09 | Closed for the checks that were run |
| P-10 | Closed for pinned age `v1.3.2` and pinned PostgreSQL 17.12 |
| P-11 | Tested on disposable archives. Not a historical tar command |
| P-12 | Open. Companion files were not found |
| P-13 | Closed on this cluster. Production installation is separate |
| P-14 | Open. The 68-table script was not found |
| P-15 | Open. The historical tar command was not found |
| P-16 | Documented. No history was deleted |
| P-17 | Closed for this download. Nothing was copied back to Drive |
| P-18 | Open. Upload was not performed |
| P-19 | Open. Production repair was not performed |
| P-20 | Local roles only. Production roles were not changed |
| P-21 | Partial. Historical OpenSSL version string remains unknown |
| P-22 | Blocked. `mknod` returned `EPERM` |

### Owner decisions still required

| Item | Owner decision | Evidence still needed | Blocks archive validation | Blocks full recovery | Safe next action |
| --- | --- | --- | --- | --- | --- |
| P-03 | Accept the missing portable PostgreSQL checksum, or supply one | A checksum whose source can be verified | No | Yes, until accepted or supplied | Do not invent a checksum |
| P-04 | Approve or reject a fuller expected `supabase_vault` relation list | An independent expected list | No | Yes | Keep the observed list unlabeled as expected |
| P-08 | Confirm or reject offline custody beyond this computer and Drive | A custody location the owner can verify | No | Yes | Do not treat Drive as offline custody |
| P-12 | Decide whether companion files are required | The files, if the owner says they exist | No | Yes, if the owner requires them | Do not invent files |
| P-14 | Supply the original 68-table script, or accept the area counts without it | The original query text | No | Yes, for a row-by-row recount | Do not label a new query as historical |
| P-15 | Supply the original tar command, or accept section F | The original command text | No | No for the completed archive check | Do not label a new command as historical |
| P-18 | Decide whether a Storage destination restore or upload is required | Owner-supplied or verified bucket and object paths | No | Yes, if a destination restore is required | Do not upload and do not invent a path |
| P-19 | Decide whether Production repair is required | A named target other than database `postgres`, plus a tested rollback | No | Yes, for Production | Do not connect to Production |
| P-21 | Supply the historical OpenSSL version, or accept it as unknown | A version string with a source | No | No | Do not invent a version |
| P-22 | Accept the blocked device-node test, or authorize a later privileged test | A result that is not `EPERM`, if a later test is authorized | No | No | Do not raise privileges |
| Local disposal | Name `tejas_restore_full_20261115` and approve a disposal method | That named approval | No | No | Keep the database. Do not drop it |

### Retention decision note

Keep `tejas_restore_full_20261115` on this local cluster. Disposal requires a later owner decision that names this database and the method. This section does not authorize disposal and does not claim secure erasure.

### Completion roadmap

1. Human review of pull request #26. Do not merge it from this phase. This item described the state before that pull request was merged. Section X records the merge. Item 1 is not a current task.
2. Owner decisions in the table above, starting with P-04, P-14, and P-18.
3. If the owner supplies the original counting queries, compare them read-only. Do not change objects to force a match.
4. A Storage destination restore only after the owner supplies the bucket and object paths.
5. A Production repair only after a separate plan names a target other than database `postgres` and records a tested rollback.
6. Disposal of the local database only after a separate approval names that database and the method.

## W. Operator rule after the independent review, 17 November 2026, 3:00 PM IST

This review compared the live pull request with the runbook. It did not decrypt an archive, restore a database, upload Storage, query Production, or drop `tejas_restore_full_20261115`. A read-only catalog check confirmed that local database still exists.

### What an operator must not repeat

- Do not run `pg_restore` into `tejas_restore_full_20261115`. That database holds the 17 November restore on port `5432`.
- Do not treat the future block in section G as server confirmation. Its `require_restore_preconditions` call repeats the expected host, port `5433`, and database name as the server arguments. A later restore needs a new empty name and a result read from the server.
- Do not decrypt the database archive again to discover its plaintext size. Section T measured 476,793 bytes.
- Do not extract the four Storage files again from section F. Section T already checked them and removed the copies.
- Do not upload those files, and do not write to Production.
- Do not replace the pinned age binary or the pinned `pg_restore` merely because section R, as first written, said they were absent.
- Do not drop the local database. Section V states the disposal decision.

Sections A through S remain the audit trail and the historical procedure. Where they say a real check was **NOT TESTED**, that was true when written. Section V is the recovery status after the execution. The nine historical checksums and the command blocks were not rewritten by this review.

### Review result

No passphrase, connection URL, Age identity, plaintext dump, or payment row was found in the committed runbook. The four `rclone copyto` blocks copy from `tejasdrive:` into the work directory. No authorized command uploads to Supabase Storage or restores Production. Schema 9 versus 10 and functions 116 versus 117 stay unresolved. Full disaster recovery is not complete.

## X. Post-merge documentation status, 17 November 2026, 3:52 PM IST

This section records the GitHub state after pull request #26. It does not decrypt an archive, query Production, change Supabase, upload Storage, or drop `tejas_restore_full_20261115`.

shiksha-mahakumbh approved pull request #26 at 3:45 PM IST on commit `2c85ed099e12ce6de4d80e568bab30abce810fa1`. dheWeb merged it into `main` at 3:49 PM IST. The merge commit is `fd215a92396c8d422443bc46fdfadff28228d7bb`. `docs/TEJAS_DISASTER_RECOVERY_RUNBOOK.md` is present on `main` at that commit.

Pull request #25 remains open and unmerged. Its head is `fff8cd20cd78ecca7d0c8beeef83f25cd4eb805c`. It is a separate software change. This section does not merge it and does not apply its migration.

The Vercel status for merge commit `fd215a92396c8d422443bc46fdfadff28228d7bb` was success at 3:51 PM IST, with the description "Deployment has completed". That status is not an independent verification of the Production website. This section does not claim a Production deployment.

The human-review step in the section V roadmap is historical. It is not a current pending task.

The remaining owner decisions are unchanged:

| Item | Status | Current action |
| --- | --- | --- |
| P-03 | Open | Portable PostgreSQL checksum was not found. Do not invent it |
| P-04 | Owner decision | Observed `supabase_vault` relations are not an approved expected list |
| P-08 | Open | Offline custody beyond this computer and Drive is not verified |
| P-12 | Open | Companion files were not found |
| P-14 | Open | The original 68-table counting script was not found |
| P-18 | Open | Storage destination restoration and upload were not performed |
| P-19 | Open | Production recovery target and tested rollback were not recorded |
| P-21 | Open | Historical OpenSSL version string remains unknown |
| P-22 | Blocked | The device-node test returned `EPERM` |

The rows in this table record the state at 3:52 PM IST. Section Y records the owner's later confirmation that P-08 is closed. Section AA records the owner's later approval that P-03, P-21, and P-22 are closed as accepted limitations. P-04, P-12, P-14, P-18, and P-19 remain open. Section AB records the owner's later decisions that keep those five open. P-15 remains open in sections T and V. No owner decision has been made for it. The table cells above were not rewritten.

Full disaster recovery is not complete.

## Y. P-08 offline custody confirmation, 17 November 2026, 6:24 PM IST

The owner explicitly confirmed P-08 on 17 November 2026. P-08 is **CLOSED**. This section does not close any other owner decision. Rows in sections R, S, T, U, V, and X that call P-08 open describe the state before this confirmation.

The transfer stage created and uploaded only these two files to `tejasdrive:TEJAS_PRODUCTION_SECURE_BACKUPS/PASSPHRASE_CUSTODY/`:

| File | Bytes |
| --- | --- |
| `tejas-recovery-passphrases-20261117.age` | 471 |
| `tejas-recovery-passphrases-20261117.manifest.txt` | 386 |

The ciphertext was created at `2026-11-17T11:26:06Z`. Its SHA-256 is `a5a945fc2fa0cd06edeb38e981c1690d28a67be93d91584e1cc4b1da48f26f94`. A download of that remote ciphertext matched this digest. The ciphertext is encrypted to the owner's Windows age public recipient. This section does not record either passphrase, the private identity, or a plaintext copy.

The owner confirmed all of the following:

- Both files were downloaded to the owner's Windows computer.
- The owner decrypted the ciphertext with the private age identity held on that computer.
- Both passphrases were placed in offline custody.
- `recovered.txt` was deleted and the Recycle Bin was emptied.
- The private identity remains stored on Windows.

This confirmation did not decrypt a backup, query Production, change Supabase, upload Storage objects, change Google Drive again, or change GitHub. Full disaster recovery is not complete.

## Z. Proposed owner decisions, 17 November 2026, 6:41 PM IST

**PROPOSED — NOT YET APPROVED BY OWNER**

This heading records the draft at 6:41 PM IST. The owner later approved P-03, P-21, and P-22, as recorded in section AA. The owner later approved the five decision statements in section AB on 17 November 2026. That approval keeps P-04, P-12, P-14, P-18, and P-19 **OPEN** and does not close them. Sentences below that say the five proposals are not yet approved, and sentences that say P-03, P-21, and P-22 remain open, describe this draft, not the current status.

This section drafts five decisions for owner review. Drafting them does not approve them. P-04, P-12, P-14, P-18, and P-19 remain **OPEN**. P-03, P-21, and P-22 also remain **OPEN**. P-08 remains **CLOSED** in section Y. Section Y was not rewritten by this draft.

No proposal below authorizes a Production connection, a Supabase connection, a database restore, a Storage upload, a decryption, a Google Drive change, or a change to the local database `tejas_restore_full_20261115`. Database recovery, Storage destination restoration, Production recovery, and full disaster recovery are not complete.

### P-19 — Production repair

Existing status: **OPEN**. Section I requires a separate plan before any Production write. Section T records that no Production restore was performed and that the injected remote URL uses database `postgres`.

| Item | Label | Record |
| --- | --- | --- |
| Isolated restore | VERIFIED | Exit 0 into local `tejas_restore_full_20261115`. It is not Production |
| Remote database name `postgres` | VERIFIED | Section T records it as the injected URL's database. It is not an approved restore target |
| Production repair plan | UNKNOWN | No approved target, baseline, or tested rollback is in this runbook |
| Proposed decision | PROPOSED | Defer Production repair. Preserve the existing Production database and its data |
| Owner approval | OWNER APPROVAL REQUIRED | This draft is not that approval |
| Later repair | NOT AUTHORIZED | A future repair needs a separately reviewed plan, an approved target, a backup baseline, and a tested rollback |

Accepting this proposal would record a deferral. It would not show that Production recovery is complete. Production data would stay where it is. No connection or modification is authorized by this draft.

### P-18 — Storage destination restoration

Existing status: **OPEN**. Section T records archive validation as complete, destination restoration as not performed, and upload as not performed. Section F records no upload command. Section B records the four archive paths and their historical hashes.

| Item | Label | Record |
| --- | --- | --- |
| Storage archive validation | VERIFIED | Ciphertext check, member check, and the four file hashes matched. Extracted copies were then removed |
| Destination restoration and upload | UNKNOWN | No approved bucket confirmation, object-path approval, or overwrite rule |
| Proposed decision | PROPOSED | Defer destination restoration and upload. Preserve the verified archive and its validation evidence |
| Owner approval | OWNER APPROVAL REQUIRED | This draft is not that approval |
| Later upload | NOT AUTHORIZED | A future upload needs an approved bucket, exact object paths, a privacy and access confirmation, and overwrite rules |

Accepting this proposal would leave the verified archive in place. It would not show that Storage destination restoration is complete. Archive validation would remain the completed part. No Storage object would be uploaded, overwritten, deleted, or changed under this draft.

### P-04 — Supabase Vault relations

Existing status: **OPEN**. Section R requires an expected `supabase_vault` 0.3.1 relation list before database **RECOVERY COMPLETE**. Section U records the observed extension and relations. Those observations are not an approved expected inventory.

| Item | Label | Record |
| --- | --- | --- |
| Extension version | OBSERVED | `supabase_vault` 0.3.1 in schema `vault` |
| `vault.secrets` row count | OBSERVED | 0 |
| Relation names | OBSERVED | `vault.secrets`, `vault.secrets_pkey`, `vault.secrets_name_idx`, `vault.decrypted_secrets` |
| Expected relation list | UNKNOWN | No independent expected list has been approved |
| Proposed decision | PROPOSED | Keep database **RECOVERY COMPLETE** unclaimed until an independent list is reconciled. Keep the four relations as observations only |
| Owner approval | OWNER APPROVAL REQUIRED | This draft is not that approval |
| Vault changes | NOT AUTHORIZED | Do not modify Vault objects or secrets |

Accepting this proposal would keep the observed list unlabeled as the expected inventory. Database recovery would remain short of **RECOVERY COMPLETE**. No Vault object would be changed under this draft.

### P-12 — Companion files

Existing status: **OPEN**. Section B says local companion files ending in `.globals.sql.enc` and `.metadata.json.enc` were not in the verified Drive folder. Section T found neither file on Drive or on this computer. The isolated restore exited 0 after local `NOLOGIN` roles were created on this cluster only. `--no-owner` and `--no-acl` were not used.

| Item | Label | Record |
| --- | --- | --- |
| Isolated restore | VERIFIED | Complete on this local cluster. It must not be repeated into `tejas_restore_full_20261115` |
| Companion files | UNKNOWN | Full filenames and any surviving copy were not established |
| Dependency on those files | UNKNOWN | Whether further role recovery requires them has not been decided |
| Proposed decision | PROPOSED | Do not perform additional role recovery now. Do not treat the missing files as unnecessary |
| Owner approval | OWNER APPROVAL REQUIRED | This draft is not that approval |
| Flags and file search | NOT AUTHORIZED | Do not add `--no-owner` or `--no-acl`. A later decision needs the exact filenames and an independently supported dependency assessment |

Accepting this proposal would leave the completed isolated restore as it is. It would not decide that the companions are unnecessary. Role recovery beyond that restore would remain incomplete until the filenames and the dependency assessment exist.

### P-14 — Historical counts

Existing status: **OPEN**. Section H preserves eight application-area counts and says the exact 68-table script was not preserved. Section T records a labeled count of ordinary tables plus one partitioned table as 68. Section U records 10 non-system schemas against a historical 9, and 117 non-system function OIDs against a historical 116. Section V found no original counting script.

| Item | Label | Record |
| --- | --- | --- |
| Eight application-area counts | VERIFIED | They match section H on the isolated restore |
| Table count of 68 | OBSERVED | A labeled ordinary-plus-partitioned count. It is not the missing historical script |
| Schema count | OBSERVED | 10 non-system schemas. Historical figure 9. The difference is unresolved |
| Function count | OBSERVED | 117 non-system function OIDs. Historical figure 116. The difference is unresolved |
| Original queries | UNKNOWN | No schema, function, or 68-table script was found with a verified source |
| Proposed decision | PROPOSED | Keep 68 as a labeled observation. Keep both discrepancies unresolved until the original query is supplied or the owner accepts that limitation in a later decision |
| Owner approval | OWNER APPROVAL REQUIRED | This draft is not that approval |
| Catalog changes | NOT AUTHORIZED | Do not change objects to force a match, and do not label a new query as historical |

Accepting this proposal would not explain the schema or function discrepancy. An acceptance of the labeled 68 count, if the owner gives it later, would still leave 10 versus 9 and 117 versus 116 unresolved. Database **RECOVERY COMPLETE** stays unclaimed.

### What this draft does not decide

P-03, P-21, and P-22 stay **OPEN**. No blocker in this section changes from **OPEN** to closed. Full disaster recovery is not complete.

## AA. Proposed decisions for the remaining three blockers, 17 November 2026, 6:46 PM IST

**PROPOSED — NOT YET APPROVED BY OWNER**

This heading records the draft at 6:46 PM IST. The owner approved these three proposals later on 17 November 2026. The approval record at the end of this section is the current status of P-03, P-21, and P-22. Section AB is the later record for P-04, P-12, P-14, P-18, and P-19. The proposal tables below were not rewritten, and sentences in them that say the blockers remain open describe the draft.

This section drafts decisions for P-03, P-21, and P-22. Drafting them does not approve them. Those three blockers remain **OPEN**. P-04, P-12, P-14, P-18, and P-19 remain **OPEN** in section Z, and section Z remains an unapproved draft. P-08 remains **CLOSED** in section Y. Sections Y and Z were not rewritten by this draft.

No proposal below authorizes a download, a checksum reconstruction, a privileged test, a restore, a Production connection, or a Supabase connection. Database recovery, Storage destination restoration, Production recovery, and full disaster recovery are not complete.

### P-03 — Portable PostgreSQL package checksum

Existing status: **OPEN**. Section O says the published checksum of the portable PostgreSQL 17.12.0 archive matched, and that the exact SHA-256 was not retained. Section T records the isolated restore with the PGDG client `pg_restore (PostgreSQL) 17.12 (Ubuntu 17.12-1.pgdg24.04+1)`.

| Item | Label | Record |
| --- | --- | --- |
| Published checksum comparison | VERIFIED | Section O says it matched. The retained evidence does not include the digest |
| Exact archive SHA-256 | UNKNOWN | It was not retained. This draft does not reconstruct it |
| Isolated restore client | VERIFIED | PGDG PostgreSQL 17.12. That restore did not use the portable package |
| Proposed decision | PROPOSED | Accept the missing digest as an evidence limitation. Do not reuse the portable package |
| Owner approval | OWNER APPROVAL REQUIRED | This draft is not that approval |
| Later reuse of that package | NOT AUTHORIZED | Reuse would need the retained digest from a source that can be checked |

Accepting this proposal would close only the missing-digest record, and only after the owner approves it. It would not prove the portable package's historical integrity. The completed isolated restore would remain the PGDG restore already recorded.

### P-21 — Historical version strings

Existing status: **OPEN**. Section C says the historical OpenSSL version string was not recorded, and that the historical restore server's `version()` string was not recorded. Section T records PostgreSQL 17.11 and pg_dump 17.12 in the archive header. The 17 November decryption used the current OpenSSL 3.0.13. That current string is not the 15 November binary.

| Item | Label | Record |
| --- | --- | --- |
| Archive header | VERIFIED | PostgreSQL 17.11, dumped by pg_dump 17.12 |
| Current decryption OpenSSL | OBSERVED | 3.0.13 on 17 November. It is not historical evidence for 15 November |
| Historical OpenSSL version | UNKNOWN | The 15 November version string was not retained |
| Historical restore `version()` | UNKNOWN | The historical restore server's output was not retained |
| Proposed decision | PROPOSED | Accept both missing strings as unknown. Do not invent either value, and do not substitute OpenSSL 3.0.13 for the historical string |
| Owner approval | OWNER APPROVAL REQUIRED | This draft is not that approval |
| Future restore | NOT AUTHORIZED | Any later restore still requires a PostgreSQL 17 server confirmed by its actual `version()` output |

Accepting this proposal would record an evidence limit. It would not create a historical version string. A future restore would still have to read `version()` from the server being used.

### P-22 — mknod EPERM

Existing status: **OPEN** and blocked. Section T records that direct `mknod` returned `EPERM`, and that a character-device tar header exited 2 with no device node left behind. Section R says this case blocks nothing in the recovery gates.

| Item | Label | Record |
| --- | --- | --- |
| Direct `mknod` | OBSERVED | `EPERM` |
| Character-device tar header | OBSERVED | Exit 2. No device node remained |
| Recovery-gate dependency | VERIFIED | Section R records no gate dependency |
| Proposed decision | PROPOSED | Accept the permission limitation. Do not run a privileged retest |
| Owner approval | OWNER APPROVAL REQUIRED | This draft is not that approval |
| Later device-node test | NOT AUTHORIZED | Another `mknod` or device-node test would need a separate authorization. This draft does not request elevated privileges |

Accepting this proposal would leave the `EPERM` result as the recorded result. It would not show that a device node can be created here. The limitation does not block the recovery checks that have already been completed.

### What this draft does not decide

P-03, P-21, and P-22 stay **OPEN** until the owner approves a decision. Section Z's proposals for P-04, P-12, P-14, P-18, and P-19 stay unapproved. No blocker changes from **OPEN** to closed because this section was drafted. Full disaster recovery is not complete.

### Owner approval, 17 November 2026

The owner explicitly approved the three proposals in this section on 17 November 2026. The proposal tables above remain the record of what was proposed at 6:46 PM IST. They are not rewritten. The sentences above that say these three blockers remain **OPEN** describe the draft before this approval.

Current status:

| Item | Current status | What the approval accepts |
| --- | --- | --- |
| P-03 | **CLOSED — OWNER ACCEPTED LIMITATION** | The missing portable PostgreSQL checksum stays unknown. The portable package is not to be reused, and no checksum is to be invented |
| P-21 | **CLOSED — OWNER ACCEPTED LIMITATION** | The 15 November OpenSSL version and the historical restore server's `version()` output stay unknown. OpenSSL 3.0.13 is not historical evidence |
| P-22 | **CLOSED — OWNER ACCEPTED LIMITATION** | The recorded `mknod` result remains `EPERM`. No privileged retest is authorized |

Closing these three blockers does not mean the missing evidence was recovered. The checksum, the two historical version strings, and a successful device-node result are still absent.

P-04, P-12, P-14, P-18, and P-19 remain **OPEN**. Section Z remains an unapproved draft. P-08 remains **CLOSED** in section Y. A future restore still requires a PostgreSQL 17 server confirmed by its actual `version()` output. Reuse of the portable package, invention of a checksum or version string, and another `mknod` test are not authorized. Database recovery, Storage destination restoration, Production recovery, and full disaster recovery are not complete.

Current blocker summary after this approval:

| Item | Current status |
| --- | --- |
| P-03 | **CLOSED — OWNER ACCEPTED LIMITATION** |
| P-04 | **OPEN** |
| P-08 | **CLOSED** |
| P-12 | **OPEN** |
| P-14 | **OPEN** |
| P-18 | **OPEN** |
| P-19 | **OPEN** |
| P-21 | **CLOSED — OWNER ACCEPTED LIMITATION** |
| P-22 | **CLOSED — OWNER ACCEPTED LIMITATION** |

This table is the status after the P-03, P-21, and P-22 approval. The sentence above that says section Z remains an unapproved draft describes the state before section AB. Section AB records the owner's later decisions for P-04, P-12, P-14, P-18, and P-19. Those five remain **OPEN**. P-15 remains **OPEN** in sections T and V. No owner decision has been made for it.

## AB. Owner decisions for five open blockers, 17 November 2026, 7:02 PM IST

The owner explicitly approved the five decision statements in this section on 17 November 2026. These are approved limitations, deferrals, and safety decisions. They are not closure of the blockers. P-04, P-12, P-14, P-18, and P-19 remain **OPEN**.

Section Z remains the historical draft and was not rewritten. Its proposal tables are not these approvals. Section AA's closures of P-03, P-21, and P-22 are unchanged. P-08 remains **CLOSED** in section Y.

This approval does not mark database recovery complete, Storage destination restoration complete, Production recovery complete, or full disaster recovery complete. It does not authorize a Production connection, a Supabase connection, a Storage upload, a backup decryption or extraction, role recovery, or a change to the local database `tejas_restore_full_20261115`.

### P-04 — Vault inventory

Status after this approval: **OPEN**. Sections R and U are the evidence. Section R requires an expected `supabase_vault` 0.3.1 relation list before database **RECOVERY COMPLETE**. Section U records the observed extension and four relations. This decision does not make those observations the expected inventory.

Approved owner decision:

> Keep database recovery short of complete. Do not treat the four observed Vault relations as the expected inventory, and do not modify Vault objects.

This is an owner limitation. It is not technical completion of database recovery.

### P-12 — Missing companion files and role recovery

Status after this approval: **OPEN**. Sections B and T are the evidence. Section B records that companion files ending in `.globals.sql.enc` and `.metadata.json.enc` were not in the verified Drive folder. Section T found neither file. The isolated restore exited 0 after local `NOLOGIN` roles were created, without `--no-owner` or `--no-acl`.

Approved owner decision:

> Do not perform more role recovery now. Do not treat the missing companion files as unnecessary, and do not use `--no-owner` or `--no-acl`.

This is an owner safety decision. It is not a finding that the companion files are unnecessary, and it is not completion of role recovery.

### P-14 — Historical counts

Status after this approval: **OPEN**. Sections H, T, U, and V are the evidence. Section H preserves the eight application-area counts and says the exact 68-table script was not preserved. Section T records a labeled ordinary-plus-partitioned count of 68. Section U records 10 non-system schemas against a historical 9, and 117 non-system function OIDs against a historical 116. Section V found no original counting script.

Approved owner decision:

> Keep the 68 table count as an observation, not as the missing historical script. Leave the schema difference, 10 against 9, and the function difference, 117 against 116, unresolved. Do not change objects to force a match.

This is an owner limitation. It does not explain the differences, and it is not completion of historical object-count reconciliation.

### P-18 — Storage destination

Status after this approval: **OPEN**. Sections B, F, and T are the evidence. Section B records the four archive paths and their historical hashes. Section F records no upload command. Section T records archive validation as complete, destination restoration as not performed, and upload as not performed.

Approved owner decision:

> Defer Storage destination restoration and upload. Do not upload, overwrite, delete, or change any Storage object. Archive validation remains complete, and destination restoration remains not performed.

This is an approved deferral. It is not Storage destination restoration, and it is not an upload.

### P-19 — Production repair

Status after this approval: **OPEN**. Sections I and T are the evidence. Section I requires a separate plan before any Production write and rejects the remote `postgres` database as a restore target. Section T records that no Production restore was performed.

Approved owner decision:

> Defer Production repair. Do not connect to Production, and do not use database `postgres` as a restore target. A later repair needs its own plan, approved target, backup baseline, and tested rollback.

This is an approved deferral. It is not Production recovery.

### Current blocker summary after these decisions

| Item | Current status | What this record means |
| --- | --- | --- |
| P-03 | **CLOSED — OWNER ACCEPTED LIMITATION** | Unchanged. Section AA. The missing checksum was not recovered |
| P-04 | **OPEN** | Approved limitation. Database recovery stays short of complete |
| P-08 | **CLOSED** | Unchanged. Section Y |
| P-12 | **OPEN** | Approved safety decision. Role recovery stays incomplete |
| P-14 | **OPEN** | Approved limitation. The count differences stay unresolved |
| P-18 | **OPEN** | Approved deferral. Destination restoration stays not performed |
| P-19 | **OPEN** | Approved deferral. Production repair stays not performed |
| P-21 | **CLOSED — OWNER ACCEPTED LIMITATION** | Unchanged. Section AA. The historical strings were not recovered |
| P-22 | **CLOSED — OWNER ACCEPTED LIMITATION** | Unchanged. Section AA. The `EPERM` result stands |

This table records the nine owner items in sections Y, AA, and AB. It is not the full prerequisite register. P-15 remains **OPEN**. Sections T and V record that the historical tar command was not found. The named-file extraction in section F is not that command. No owner decision has been made for P-15, and the command must not be reconstructed. Sections T and V remain the status record for every other ID. Section V's disposal note for `tejas_restore_full_20261115` is unchanged.

Database recovery is not complete. Storage archive validation is complete. Storage destination restoration was not performed. Production recovery was not performed. Full disaster recovery is not complete.

## AC. Later alignment, history-version repair, and 17 November backup, 18 November 2026, 12:01 AM IST

This section records evidence gathered on 17 November 2026 after section AB. It does not rewrite sections A through AB. Sentences in those sections that describe an earlier state remain the record of that state. This section does not close P-04, P-12, P-14, P-15, P-18, or P-19. It does not reopen P-03, P-08, P-21, or P-22. Full disaster recovery is not complete.

Writing this section did not connect to Production, create a backup, change Google Drive, change Supabase, merge a pull request, or deploy. The post-repair backup recorded below was created under a separate owner authorization. This correction does not create another backup.

### Repository alignment

These values were verified on GitHub and in the workspace during the 17 November audit. `main` was `1d290e7dc344195ffb2690ab36148681fed0c25d`. No newer commit was present. The worktree had no uncommitted change.

| Item | Evidence |
| --- | --- |
| Pull request #29 | Merged. https://github.com/dhevb/tejas/pull/29. Merge time 17 November 2026, 11:54:30 PM IST |
| Merge commit | `1d290e7dc344195ffb2690ab36148681fed0c25d` |
| Diff | Five renames, 0 insertions, 0 deletions. File bytes were unchanged |
| Pull request #25 | Open and unmerged. Head `fff8cd20cd78ecca7d0c8beeef83f25cd4eb805c`. https://github.com/dhevb/tejas/pull/25 |

Active migrations after that merge:

- `supabase/migrations/20261031_tejas_registration.sql`
- `supabase/migrations/20261118000100_tejas_learning_portal.sql`
- `supabase/migrations/20261118000200_tejas_learning_portal_durable.sql`

The portal checksums remain `4d68d0578ee5c578115f8c03e42b3953b3054f3493c2188e7581b96cac71c628` and `65f370b086e3f0a35fbfc58c41c3216fcb3262beba054f57529386f2e04916d5`.

Unconfirmed SQL files, not active migrations:

- `supabase/held-migrations/20261031_tejas_registration_additive.sql`
- `supabase/held-migrations/20261031_tejas_storage.sql`
- `supabase/held-migrations/20261103_optional_school_place.sql`

Pull request #25 must stay unmerged until its migration order is reviewed against history that now ends at `20261118000200`. Its migration filenames use earlier version prefixes. This section does not merge it.

### Production history-version repair

A later owner authorization changed only the `version` column of two rows in `supabase_migrations.schema_migrations`. No migration SQL was executed. `name` and `statements` were not modified. No application table was written.

| Old version | New version | Required name |
| --- | --- | --- |
| `20261113_tejas_learning_portal` | `20261118000100` | `tejas_learning_portal` |
| `20261113_tejas_learning_portal_durable` | `20261118000200` | `tejas_learning_portal_durable` |

Each update affected one row. The transaction committed only after the checks inside that transaction passed.

An independent read-only transaction at 17 November 2026, 11:56:08 PM IST, and a later read-only transaction at 17 November 2026, 11:59:58 PM IST, each returned exactly three rows. The server was PostgreSQL 17.11. `transaction_read_only` was `on` in those read-only transactions. Statement text was not printed.

| version | name | statements SHA-256 |
| --- | --- | --- |
| `20261031` | `tejas_registration` | `463de3694b3292df227aa73b3694e15797e4495c6326cb24478d38d39e3ad83d` |
| `20261118000100` | `tejas_learning_portal` | `fadc39ce0ef039b9c56fcd8f60a588fa57f1b88612b88980ff2c9820d4844702` |
| `20261118000200` | `tejas_learning_portal_durable` | `bbbf00d930aabe45bd699ac9324af21edf3beba2082e33aacb31f869de92cf24` |

These digests match the values recorded before the version change and the values measured from the isolated restore of the 17 November archive. The registration digest is unchanged.

This version change is not the Production repair plan required by P-19. P-19 stays **OPEN**.

### 17 November database backup

The authorized Drive folder `TEJAS_PRODUCTION_SECURE_BACKUPS/DATABASE_BACKUPS` was listed at 17 November 2026, 11:59:53 PM IST. The 15 November archive in section B was still present, with the same size, SHA-256, and file ID. Two additional objects were present. This section does not replace section B. Section B remains the inventory of the 15 November archive.

| File | Bytes | SHA-256 | Drive file ID |
| --- | --- | --- | --- |
| `tejas-zapccpipwxduzlnvjdmy-20261117T175954Z.dump.enc` | 479,856 | `536b6e17b42b20d1c42f487e57052f04b0b64b8e8fd2e2cb24fa53a00312b630` | `1wdjoZnwozxZ7zGn0Ke-v1DAw5rLflPvb` |
| `tejas-zapccpipwxduzlnvjdmy-20261117T175954Z.manifest.txt` | 856 | `2a0d1b613c8942eac4523c74a87fff4d485d2a822d09e895568946688bfe76a3` | `1Mo_HagJ4JTqTNSFVtbGj4-_VudaYEPm1` |

The archive header says it was created at 2026-11-17 17:59:55 UTC, which is 17 November 2026, 11:29:55 PM IST. It is custom format, database `postgres`, dumped from PostgreSQL 17.11 by pg_dump 17.12. The plaintext was 479,831 bytes and its SHA-256 was `7512a40f3743b4fe3f9764587d5efca32740c94987e2b2a9aac86f33e7ffe80d`. The archive listing includes `TABLE supabase_migrations schema_migrations` and `TABLE DATA supabase_migrations schema_migrations`.

An isolated restore used PostgreSQL 17.12 on `127.0.0.1` port `55432` and database `tejas_phase2d_20261117`. `pg_restore --exit-on-error` exited 0. The disposable database was then removed. The restore listing and log remain local evidence. This section does not authorize another restore into `tejas_restore_full_20261115`.

The archive predates the version repair. Its history rows are the pre-repair versions. The sentence that no post-repair backup existed was true at 12:01 AM IST. It is superseded by the next subsection. The pre-repair archive and the post-repair archive are different files. Neither replaces the 15 November archive in section B.

### Post-repair database backup, 18 November 2026, 12:17 AM IST

A later owner authorization created one logical backup after the version repair. The archive header says it was created at 2026-11-17 18:42:10 UTC, which is 18 November 2026, 12:12:10 AM IST. This documentation records that completed backup. It did not connect to Production, create another backup, change Google Drive, change Supabase Storage, execute migration SQL, or deploy.

The read-only Production preflight found exactly the three approved history rows in the table above. Their statement digests matched that table. The server was PostgreSQL 17.11 and the database was `postgres`. `transaction_read_only` was `on`. pg_dump 17.12 used a read-only dump transaction. No Production row was written, and no migration SQL was executed.

The archive is custom format. Its listing includes `TABLE supabase_migrations schema_migrations` and `TABLE DATA supabase_migrations schema_migrations`. The plaintext was 479,830 bytes and its SHA-256 was `b7d804738410f77f4aedfcf9e9b5e8c2fe925792d34d32e2bd33ab7ed213446c`. The plaintext was not uploaded.

| File | Bytes | SHA-256 | Drive file ID |
| --- | --- | --- | --- |
| `tejas-zapccpipwxduzlnvjdmy-20261117T184209Z.dump.enc` | 479,856 | `1dd023171475ebf2386918ad7be4ba9634b02dc4145f1e643b820ece148d0cd5` | `1cX-l4R8APlrXb_FtrYX23FhxYOK750hB` |
| `tejas-zapccpipwxduzlnvjdmy-20261117T184209Z.manifest.txt` | 1,645 | `cdf86ab281851665f3d64a66df7a5b3025693e4f25d5844f3ac089e301587411` | `1nQqKs4KSablpyXr_jRcEwx1y2WEMMSGW` |

The encrypted archive and manifest were uploaded to `TEJAS_PRODUCTION_SECURE_BACKUPS/DATABASE_BACKUPS` without overwriting an existing object. The 15 November archive and the pre-repair 17 November archive remained in that folder. Both new objects were downloaded separately. The downloaded sizes and SHA-256 values matched the uploaded files. Decrypting the downloaded archive reproduced the plaintext checksum above. `pg_restore --list` on that decrypted copy confirmed the migration-history table and its data.

An isolated restore used PostgreSQL 17.12 on `127.0.0.1` port `55433` and database `tejas_postrepair`. `pg_restore --exit-on-error` exited 0. The restored history contained exactly `20261031`, `20261118000100`, and `20261118000200`, and all three statement digests matched the Production preflight. The disposable server, its data directory, and the plaintext temporary files were removed. Only the encrypted archive and the manifest were retained locally.

This backup does not close P-04, P-12, P-14, P-15, P-18, or P-19. It is not a Production repair and it is not full disaster recovery.

### Open and closed items after this record

P-03, P-08, P-21, and P-22 stay as recorded in sections Y and AA. They are not reopened. The missing portable checksum, the historical version strings, and a successful device-node result were not recovered.

| Item | Status | What remains |
| --- | --- | --- |
| P-04 | **OPEN** | An owner-approved expected `supabase_vault` 0.3.1 relation list |
| P-12 | **OPEN** | A decision on the missing `.globals.sql.enc` and `.metadata.json.enc` companions |
| P-14 | **OPEN** | The original 68-table counting script, or a further owner-accepted limitation |
| P-15 | **OPEN** | The original tar command, or an owner-accepted limitation. Do not reconstruct it |
| P-18 | **OPEN** | Storage destination and upload approval |
| P-19 | **OPEN** | A separate Production repair plan and a tested rollback |

### Operational cautions

- Supabase Deploy to production remains **OFF** according to the owner's confirmation. This section does not independently verify that dashboard control, and it does not enable it.
- Pull request #25 must remain unmerged pending migration-order review.
- rclone reports that its shared Google client is scheduled to stop working during 2026. Replacing that client needs a separate approval. This section does not replace it.
- Vercel reported a completed deployment of merge commit `1d290e7dc344195ffb2690ab36148681fed0c25d`. That report is not proof that Supabase executed migrations.

Full disaster recovery is not complete.

## AD. Expected `supabase_vault` 0.3.1 relation inventory, 18 November 2026, 5:22 AM IST

This subsection closes P-04 only. It does not rewrite sections A through AC. Sentences in those sections that leave P-04 open describe the state when they were written. P-12, P-14, P-15, P-18, and P-19 remain **OPEN**. P-03, P-08, P-21, and P-22 stay as recorded in sections Y and AA. Full disaster recovery is not complete.

Writing this subsection did not connect to Production, change Supabase, change Storage, change Google Drive, execute migration SQL, or deploy.

### Comparison with section U

Section U records these observed relations and states that `vault.secrets` had 0 rows:

| Kind | Name |
| --- | --- |
| Table | `vault.secrets` |
| Index | `vault.secrets_pkey` |
| Index | `vault.secrets_name_idx` |
| View | `vault.decrypted_secrets` |

Section U also records five `vault` functions, all members of `supabase_vault`: `_crypto_aead_det_decrypt`, `_crypto_aead_det_encrypt`, `_crypto_aead_det_noncegen`, `create_secret`, and `update_secret`. The installed extension version in that section is `0.3.1`.

The later isolated check produced the same four relation names, the same zero row count, and the same five function names. No relation in section U is absent from the new check, and the new check adds no relation. There is no contradiction. P-04 is **CLOSED** on that match.

### Expected inventory

The expected `supabase_vault` 0.3.1 relation inventory is:

| Kind | Name |
| --- | --- |
| Table | `vault.secrets` |
| Index | `vault.secrets_pkey` |
| Index | `vault.secrets_name_idx` |
| View | `vault.decrypted_secrets` |

The source is upstream tag `v0.3.1`, commit `6e0cd916242d922a646e4d611cc215e09dd429f4`. The installed SQL files match that commit byte for byte. The update from v0.3.0 to v0.3.1 contains no SQL change.

A disposable PostgreSQL 17.12 server ran `CREATE EXTENSION supabase_vault` and returned exactly these four relations. `vault.secrets` had 0 rows. The five functions matched the section U record. The disposable server was then removed.

This inventory comes from that isolated verification. No Production write was made, and no Production object was modified.

P-04 does not close P-12, P-14, P-15, P-18, or P-19. Database recovery is not fully complete, and full disaster recovery is not complete.

## AE. P-19 closed: no additional Production repair required, 18 November 2026, 6:15 AM IST

This section closes P-19 only. It does not rewrite sections A through AD. Sentences in those sections that leave P-19 open describe the state when they were written. Section AB's P-19 heading, the deferral quoted there, and the blocker table that lists P-19 as **OPEN** remain the historical record of the 17 November 2026 decision. This section supersedes that deferral.

Current status of P-19: **CLOSED — OWNER ACCEPTED NO REPAIR REQUIRED**.

The owner explicitly accepted, on 18 November 2026, that the evidence now available shows no additional repair is required in the current TEJAS Production database. The evidence is the record in Section AC: the two read-only history checks, the version-only change of the two portal history rows, the post-repair backup `tejas-zapccpipwxduzlnvjdmy-20261117T184209Z.dump.enc`, and the isolated restore that exited 0. No new Production query was run to write this section.

This closure is based on that current evidence. A later verified defect needs its own repair review. That review must name the defect, the target, the backup baseline, and a tested rollback before any Production write. Database `postgres` is not a restore target. The Section AB prohibition on using it as a restore target remains in force.

P-12, P-14, P-15, and P-18 stay **OPEN**. P-03, P-04, P-08, P-21, and P-22 stay as recorded in sections Y, AA, and AD. Writing this section did not connect to Production, change Supabase, change Storage, change Google Drive, execute migration SQL, restore a database, or deploy. Full disaster recovery is not complete.

## AF. Isolated rehearsal and new recovery tools, 18 November 2026, 6:36 AM IST

This section records new checks. It does not rewrite sections A through AE. It does not close P-12, P-14, P-15, or P-18. It does not reopen P-03, P-04, P-08, P-19, P-21, or P-22. Database `postgres` was not a restore target. No Storage object was uploaded, overwritten, or deleted. No Drive object was deleted or replaced. Supabase Deploy to production was not enabled.

### P-12 companion search

The authorized Drive folder contained exactly these ten objects. None ends in `.globals.sql.enc` or `.metadata.json.enc`:

- `AGE_KEY_RECOVERY/tejas-storage-backup.identity.gpg`
- `AGE_KEY_RECOVERY/tejas-storage-backup.identity.owner.gpg`
- `PASSPHRASE_CUSTODY/tejas-recovery-passphrases-20261117.age`
- `PASSPHRASE_CUSTODY/tejas-recovery-passphrases-20261117.manifest.txt`
- `STORAGE_FILE_BACKUPS/tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age`
- `DATABASE_BACKUPS/tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump.enc`
- `DATABASE_BACKUPS/tejas-zapccpipwxduzlnvjdmy-20261117T175954Z.dump.enc`
- `DATABASE_BACKUPS/tejas-zapccpipwxduzlnvjdmy-20261117T175954Z.manifest.txt`
- `DATABASE_BACKUPS/tejas-zapccpipwxduzlnvjdmy-20261117T184209Z.dump.enc`
- `DATABASE_BACKUPS/tejas-zapccpipwxduzlnvjdmy-20261117T184209Z.manifest.txt`

No local copy of those companion names was found. The original files were not recreated. P-12 stays **OPEN**.

A read-only role listing recorded names and non-secret attributes. It did not read or copy passwords. The isolated restore below created those required role names as `NOLOGIN` and did not use `--no-owner` or `--no-acl`. That shows ownership and ACL statements inside the dump can be applied. It does not replace the missing companion files.

### P-14 new inventory

`scripts/recovery/inventory.sql` is a new read-only script. Its SHA-256 is `d9285020600ae6d4225700f9ef6d6d03f3ca1d5fd130d57809138efe8a56ce4a`. It is not the historical counting script. It counts ordinary and partitioned tables, excludes `pg_catalog`, `information_schema`, `pg_toast`, `pg_temp_%`, and `pg_toast_temp_%`, and counts function OIDs with `prokind` `f`.

A read-only Production transaction and the isolated restore of the post-repair backup both returned:

| Measure | Result |
| --- | --- |
| Durable non-system schemas | 10 |
| Tables, ordinary plus partitioned | 68 |
| Indexes, relkind `i` and `I` | 190 |
| Constraints | 238 |
| Sequences | 2 |
| Function OIDs | 117 |
| Non-internal triggers | 12 |
| Policies | 0 |
| Extensions | 5 |

The ten schema names are `auth`, `extensions`, `graphql`, `graphql_public`, `pgbouncer`, `public`, `realtime`, `storage`, `supabase_migrations`, and `vault`. The first Production reading also saw ten temporary `pg_temp_%` and `pg_toast_temp_%` schemas. Those are session artifacts. They are excluded by the script above and were not in the dump. The historical totals 9 schemas, 116 functions, and 189 indexes remain unreproduced. This script's index count is 190 on both the live reading and the restore. P-14 stays **OPEN**.

The same two readings returned the current application counts: payments 2, registrations 2, entitlements 4, e-book audit 31, book orders 2, e-book access 2, payment proofs 2, and idempotency 2. Section H records the 15 November counts. The later audit and entitlement rows are in both the live database and the post-repair backup. They are not a restore mismatch.

### P-15 hardened extractor

`scripts/recovery/safe_extract.py` is a new tool. Its SHA-256 is `f89c68f42b93080c6fef927a37b3ad5db7085f607299d2970f68a5214c2736bf`. It is not the historical `tar` command, and it does not run `tar -x`. Python 3.12.3 tests rejected absolute paths, `..`, symlinks, hard links, FIFOs, device headers, duplicate names, unexpected members, a malformed archive, a checksum mismatch, and an existing destination. A clean allowlisted fixture was extracted as a mode `600` regular file and did not write outside the destination. Fourteen tests passed. P-15 stays **OPEN** until the owner accepts that the original command is unreproducible and accepts this tool as the future standard.

### P-18 and the storage rehearsal

The Storage ciphertext was downloaded again. Size 555,336 and SHA-256 `ac76e4f8895284f098e0f674d58d8a901702f7b219809a0d51f64b358d7e72c4` matched section B. Age v1.3.2 decrypted it after the identity digest matched. The new extractor accepted 6 directories and 4 files. All four file SHA-256 values matched section B. No live Storage bytes were downloaded: this environment has no `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`. Metadata still has no SHA-256 field. P-18 stays **OPEN**.

### Database rehearsal

The post-repair ciphertext `tejas-zapccpipwxduzlnvjdmy-20261117T184209Z.dump.enc` matched SHA-256 `1dd023171475ebf2386918ad7be4ba9634b02dc4145f1e643b820ece148d0cd5` and 479,856 bytes. OpenSSL 3.0.13 decrypted it with the passphrase on file descriptor 3. The plaintext was 479,830 bytes and SHA-256 `b7d804738410f77f4aedfcf9e9b5e8c2fe925792d34d32e2bd33ab7ed213446c`. `pg_restore` 17.12 `--list` exited 0.

The restore target was a new local PostgreSQL 17.12 cluster on port `55441`, database `tejas_rehearsal`. `listen_addresses` was empty. Eleven role names were created `NOLOGIN`. `supabase_admin` was the only local superuser. `pg_restore --exit-on-error` exited 0 on the first attempt. `--no-owner` and `--no-acl` were not used. `public.tejas_payments` was owned by `postgres`. Seventy non-system relations had ACLs. Migration history and the three statement digests matched section AC. The extensions matched section U, including `supabase_vault` 0.3.1.

The local server was stopped. The plaintext dump, decrypted archive, identity, and extracted Storage files were overwritten and removed. The original encrypted backups were not deleted.

Full disaster recovery is not complete.

## AG. Future extraction standard, 18 November 2026, 6:47 AM IST

This section closes P-15 only. It does not rewrite sections A through AF. Section AF's statement that P-15 stays open describes the state when that section was written. The historical `tar` command was not recovered, and this section does not claim that it was.

Current status of P-15: **CLOSED — FUTURE EXTRACTION STANDARD ADOPTED**.

The owner directed that `scripts/recovery/safe_extract.py` is the future standard for extracting a TEJAS recovery archive. Its SHA-256 is `d367983bb3dd330b869a197474bd2f739c529a1d82bc06431ed6a55c8ab35292`. It does not call `tar -x`. Archive ownership and permission bits are not copied. Files are written mode `0600` into a new directory.

The command reads every member before writing. It rejects an empty allowlist, a checksum that is not lowercase SHA-256, absolute names, drive letters, null bytes, `.` and `..`, duplicate names, names that normalize to the same path, links, FIFOs, device headers, continuation headers, unexpected members, a truncated archive, a symlink archive, a symlink anywhere in the destination path, an existing destination, a short member, and a checksum mismatch. A mismatch removes the destination. Python 3.12.3 ran 23 tests in `scripts/recovery/test_safe_extract.py`. All passed.

Decrypt the Storage archive first, then extract only into a new directory:

```
python3 scripts/recovery/safe_extract.py \
  --archive archive.tar \
  --destination /path/to/new-empty-directory \
  --allow tejas-payment-proofs/TEJAS-2026-NS553XMZZG2N8XE7DHV3/receipt.pdf:26977633c8fa8c2b3c241a9b0e86113deaf6850718ca14af2ddbedc7ba264b07 \
  --allow tejas-payment-proofs/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/receipt.jpg:171fd8bbc7f14342103ac8589fb5b9f91058178b561a9854b8988d899ee47486 \
  --allow tejas-registration-files/TEJAS-2026-NS553XMZZG2N8XE7DHV3/upload.xlsx:762695a34046feb8e58e364d77b562545d960aec6dc658736c83e020dcff06ad \
  --allow tejas-registration-files/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/upload.xlsx:762695a34046feb8e58e364d77b562545d960aec6dc658736c83e020dcff06ad \
  --allow-dir tejas-payment-proofs \
  --allow-dir tejas-payment-proofs/ \
  --allow-dir tejas-payment-proofs/TEJAS-2026-NS553XMZZG2N8XE7DHV3 \
  --allow-dir tejas-payment-proofs/TEJAS-2026-NS553XMZZG2N8XE7DHV3/ \
  --allow-dir tejas-payment-proofs/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ \
  --allow-dir tejas-payment-proofs/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/ \
  --allow-dir tejas-registration-files \
  --allow-dir tejas-registration-files/ \
  --allow-dir tejas-registration-files/TEJAS-2026-NS553XMZZG2N8XE7DHV3 \
  --allow-dir tejas-registration-files/TEJAS-2026-NS553XMZZG2N8XE7DHV3/ \
  --allow-dir tejas-registration-files/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ \
  --allow-dir tejas-registration-files/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/
```

The destination's parent must be a real directory. Do not point it at a live Storage bucket or at an existing recovery directory.

### P-12 final name check

A targeted Drive listing for `*globals*`, `*metadata*`, `*.sql.enc`, and `*.json.enc` returned no names. No local file with those companion names was found. The original files were not created. P-12 stays **OPEN**.

### P-14 script label

`scripts/recovery/inventory.sql` now states in the file itself that it does not reproduce the historical claims of 9 schemas, 116 functions, and 189 indexes, and that it must not be edited to force those figures. The counting filters are unchanged. The file SHA-256 is now `1ad055c4ef5df5b5f1755b037b9a6a152b97909f9011a2f8801fc599b70ad29b`. The 18 November reading of these rules remains 10 durable schemas, 117 function OIDs, and 190 indexes. No Production object was changed. P-14 stays **OPEN**.

### P-18 credential check

No live Storage bytes were downloaded. The injected environment names are `SUPABASE_DB_URL`, `SUPABASE_BACKUP_DB_URL`, `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE`, and `TEJAS_BACKUP_OWNER_PASSPHRASE`. `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_SECRET_KEY` are absent. The Cursor app secret store for this workspace has no secrets. GitHub Actions secret names were not readable from this session. No Storage object was uploaded, overwritten, or deleted. P-18 stays **OPEN**.

P-12, P-14, and P-18 stay **OPEN**. Writing this section did not connect a restore to Production, execute migration SQL, or enable Supabase Deploy to production. Full disaster recovery is not complete.

## AH. Owner acceptance of the P-12 and P-14 limitations, 18 November 2026, 6:53 AM IST

This section closes P-12 and P-14 only. It does not rewrite sections A through AG. Sentences in those sections that leave P-12 or P-14 open describe the state when they were written. No companion file, password, or historical query was created. No Production object was changed. No Storage object was uploaded, overwritten, or deleted. Supabase Deploy to production was not enabled.

Current status of P-12: **CLOSED — OWNER ACCEPTED LIMITATION**.

The owner explicitly accepted, on 18 November 2026, that the original `.globals.sql.enc` and `.metadata.json.enc` files were not recovered, and that the original role passwords cannot currently be recovered. Sections B, T, AF, and AG record the searches. The Section AF isolated restore applied ownership and ACLs from the post-repair dump: `pg_restore --exit-on-error` exited 0, `--no-owner` and `--no-acl` were not used, `public.tejas_payments` was owned by `postgres`, and 70 non-system relations had ACLs. The required role names were created on that disposable cluster as `NOLOGIN`. Future operators must keep this limitation in view. Database `postgres` remains prohibited as a restore target.

Current status of P-14: **CLOSED — OWNER ACCEPTED LIMITATION**.

The owner explicitly accepted, on 18 November 2026, that the historical 9-schema, 116-function, and 189-index figures cannot be reproduced from the available evidence. Those figures are the 15 November 2026 observations. Their queries were not recovered. The current script `scripts/recovery/inventory.sql`, SHA-256 `1ad055c4ef5df5b5f1755b037b9a6a152b97909f9011a2f8801fc599b70ad29b`, does not replace those queries and must not be edited to force the old figures. Its 18 November 2026 read-only Production reading and the isolated restore of `tejas-zapccpipwxduzlnvjdmy-20261117T184209Z` both reported 10 durable schemas, 117 function OIDs, and 190 indexes, with 68 ordinary and partitioned tables. No database object may be changed to force the historical counts.

| Date | Schemas | Functions | Indexes | Evidence |
| --- | --- | --- | --- | --- |
| 15 November 2026 | 9 | 116 | 189 | Historical observations. The queries were not recovered. |
| 18 November 2026 | 10 durable | 117 | 190 | `inventory.sql` on read-only Production and on the isolated post-repair restore. |

Current status of P-15: **CLOSED — FUTURE EXTRACTION STANDARD ADOPTED**. Section AG remains the standard. The historical `tar` command remains unrecovered. `scripts/recovery/safe_extract.py` is the future extractor.

Current status of P-18: **OPEN**.

A second credential search at 6:53 AM IST found no Storage API credential. The injected names are still `SUPABASE_DB_URL`, `SUPABASE_BACKUP_DB_URL`, `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE`, and `TEJAS_BACKUP_OWNER_PASSPHRASE`. `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_ANON_KEY`, and `SUPABASE_URL` are absent. The Cursor app secret store for this workspace has no secrets. GitHub Actions secret names were not readable from this session. No live object bytes were downloaded. Matching object sizes do not prove that the live bytes equal the archive. The missing `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` is the only immediate blocker to live-object SHA-256 verification.

Full disaster recovery is not complete while P-18 remains open.

## AI. Live Storage object comparison, 18 November 2026, 7:23 AM IST

This section closes P-18 only. It does not rewrite sections A through AH. Sentences in those sections that leave P-18 open, and sentences that say `SUPABASE_SECRET_KEY` is absent, describe the state when they were written. Section AH's credential search at 6:53 AM IST remains the record of that search.

Current status of P-18: **CLOSED — LIVE OBJECTS MATCH THE ARCHIVE**.

`SUPABASE_SECRET_KEY` was present in the runtime environment. Its value was not printed, hashed, copied into a file, or written into this runbook. The key is a JWT. The payload claims are issuer `supabase`, project ref `zapccpipwxduzlnvjdmy`, and role `service_role`. The ref is the TEJAS project. The role is `service_role`, so this credential is not a separate read-only Storage key. This run used it only to read. Every request was HTTP GET to `https://zapccpipwxduzlnvjdmy.supabase.co`. No POST, PUT, PATCH, or DELETE was sent, and no redirect was followed. The project API accepted the key: both bucket reads and all four object reads returned HTTP 200.

| Bucket | Public | File size limit | Allowed MIME types |
| --- | --- | --- | --- |
| `tejas-payment-proofs` | false | 5,242,880 bytes | `image/jpeg`, `image/png`, `application/pdf` |
| `tejas-registration-files` | false | 10,485,760 bytes | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/vnd.ms-excel`, `text/csv` |

The four documented objects were downloaded with GET `/storage/v1/object/{path}`. The copies were mode `600` files in a mode `700` temporary directory. Each file was hashed, overwritten, and unlinked, and the directory was removed. Overwrite and unlink do not securely erase a disk.

| Path | Bytes | SHA-256 | Section B |
| --- | --- | --- | --- |
| `tejas-payment-proofs/TEJAS-2026-NS553XMZZG2N8XE7DHV3/receipt.pdf` | 205,575 | `26977633c8fa8c2b3c241a9b0e86113deaf6850718ca14af2ddbedc7ba264b07` | Match |
| `tejas-payment-proofs/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/receipt.jpg` | 320,492 | `171fd8bbc7f14342103ac8589fb5b9f91058178b561a9854b8988d899ee47486` | Match |
| `tejas-registration-files/TEJAS-2026-NS553XMZZG2N8XE7DHV3/upload.xlsx` | 11,160 | `762695a34046feb8e58e364d77b562545d960aec6dc658736c83e020dcff06ad` | Match |
| `tejas-registration-files/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/upload.xlsx` | 11,160 | `762695a34046feb8e58e364d77b562545d960aec6dc658736c83e020dcff06ad` | Match |

The two spreadsheets are separate objects with the same byte count and the same SHA-256. That repeats the observation in Section B.

Section B records those four hashes as the members of `tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age`. Section AF, at 6:36 AM IST on 18 November 2026, downloaded that ciphertext again, matched size 555,336 and SHA-256 `ac76e4f8895284f098e0f674d58d8a901702f7b219809a0d51f64b358d7e72c4`, decrypted it, and matched the same four member hashes. This run did not download or decrypt that archive again. The live hashes match Section B, and they match the archive-member hashes Section AF recomputed.

No Storage object was uploaded, overwritten, or deleted. No Production database connection was opened. No migration SQL was executed. Supabase Deploy to production was not enabled. Google Drive was not contacted. The Section AB prohibition on uploading Storage objects remains in force. This match shows the four live objects already have the archive bytes, so that deferred upload is not required to reproduce them.

P-04 and P-19 stay closed as recorded in Sections AD and AE. P-12, P-14, and P-15 stay closed as recorded in Sections AG and AH. Section AH said full disaster recovery is not complete while P-18 remains open. This comparison closes that item.

## AJ. Owner-accepted limitations for Section H and P-11, 18 November 2026, 7:50 AM IST

This section records two owner decisions. It does not rewrite sections A through AI. Sentences in those sections keep the hashes, counts, archive names, timestamps, and command outcomes they already record. This section does not mark the database gate or the Storage gate **RECOVERY COMPLETE**. It does not mark full disaster recovery complete. Section R's criteria stay as written.

### Database comparison

The owner accepts this limitation.

Section H records the historical schema total 9 and the historical function total 116. The recorded comparison is 10 non-system schemas and 117 function OIDs. Section T records 189 indexes under its rule, ordinary indexes plus two partitioned indexes. Section AF records 190 indexes from `scripts/recovery/inventory.sql` under that script's separate rule, relkind `i` and `I`. The owner accepts that the original historical query cannot be recovered from the available evidence. Those recorded counts stay unchanged.

P-14 remains **CLOSED — OWNER ACCEPTED LIMITATION**, as Section AH records it. That closure does not satisfy the Section H comparison. No historical SQL may be invented. No database object may be changed to force a numerical match.

The database target confirmation remains **UNVERIFIED**. This section did not run `current_database()`, `current_user`, `inet_server_addr()`, `inet_server_port()`, or `current_setting`. The Database Gate remains **NOT COMPLETE**. This is an owner-accepted limitation. It does not replace the Section H comparison that Section R requires, and it does not move that gate to **RECOVERY COMPLETE**.

### Storage evidence

The owner accepts the following as historical evidence only.

Sections T and AF record completed extraction and a match of the four Storage files against Section B. The GNU tar 1.35 disposable-test limitation recorded under P-11 is accepted as a historical limitation. P-11 remains **Tested**, as Sections T and V record it. This acceptance adds no new test result.

The future extraction standard remains `scripts/recovery/safe_extract.py` under Section AG. P-15 remains **CLOSED — FUTURE EXTRACTION STANDARD ADOPTED**.

This acceptance does not create a retrospective written authorization that names the historical archive and the extraction target. The missing authorization record remains missing. Acceptance of evidence already recorded is a different act from authorization of the extraction that produced it.

No further decryption, extraction, archive handling, or Storage upload is authorized by this decision.

P-06 remains **Used**, as Section T records it. P-18 remains **CLOSED — LIVE OBJECTS MATCH THE ARCHIVE**, as Section AI records it. That live-object comparison does not establish Storage archive restoration or destination restoration. P-04 remains closed as Section AD records it. P-19 remains **CLOSED — OWNER ACCEPTED NO REPAIR REQUIRED**, as Section AE records it.

The Storage Gate remains **NOT COMPLETE**. This is an owner-accepted limitation. Section R still requires an authorized extraction and a match of the four Section B file hashes before **RECOVERY COMPLETE**. The four-hash match stays the match already recorded in Sections T and AF. The missing named authorization is not supplied here, so this decision does not move the Storage gate to **RECOVERY COMPLETE**.

### Status after these decisions

| Item | Status |
| --- | --- |
| Database Gate | **NOT COMPLETE** |
| Storage Gate | **NOT COMPLETE** |
| Production database recovery | **NOT PERFORMED** |
| Storage destination restoration | **NOT PERFORMED** |
| Application/service operational recovery | **NOT ESTABLISHED** |
| Full disaster recovery | **NOT COMPLETE** |

Section R still requires the database gate and the Storage gate each to be **RECOVERY COMPLETE** before full recovery is complete. Neither gate is in that state. These rows do not weaken that rule.

Writing this section did not connect to Production, Supabase, Google Drive, or Storage. It did not run a backup, decryption, extraction, restore, migration, or database command. It did not start or stop a service. It did not change a credential, a role, a password, or a deployment setting.

## AK. Isolated backup and restore, 18 November 2026, 8:19 AM IST

This section records new evidence. It does not rewrite sections A through AJ. The historical counts, hashes, archive names, and owner decisions stay as written. P-11 remains **Tested**. P-14's accepted limitation still does not satisfy the Section H comparison. No historical SQL was invented. No Production row, role, password, Storage object, or deployment setting was changed.

### Database connection

`db.zapccpipwxduzlnvjdmy.supabase.co` port 5432 publishes only an IPv6 address. This environment has no IPv6 route, so a direct connection returned `Network is unreachable`. The reachable path was the session pooler `aws-0-ap-northeast-1.pooler.supabase.com` port 5432, user `postgres.zapccpipwxduzlnvjdmy`, database `postgres`, with TLS. The pooler did not honor a startup `default_transaction_read_only` setting. The preflight then executed `SET default_transaction_read_only = on` and `BEGIN READ ONLY`. `transaction_read_only` returned `on` before the inventory.

| Check | Result |
| --- | --- |
| `current_database()` | `postgres` |
| `current_user` | `postgres` |
| `is_superuser` | `off` |
| `inet_server_addr()` | `2406:da14:311:1501:8d8d:5a73:fe74:1b71/128` |
| `inet_server_port()` | `5432` |
| `current_setting('port')` | `5432` |
| `current_setting('ssl')` | `on` |
| `server_version` | `17.11` |

That address is the AAAA record of `db.zapccpipwxduzlnvjdmy.supabase.co`. The credential value was not printed. No Production role or password was changed.

`scripts/recovery/inventory.sql` returned the same catalog shape recorded in Section AF, with two application-count changes since that section:

| Measure | This reading | Section AF |
| --- | --- | --- |
| Durable schemas | 10 | 10 |
| Tables, ordinary plus partitioned | 68 | 68 |
| Indexes, relkind `i` and `I` | 190 | 190 |
| Constraints | 238 | 238 |
| Sequences | 2 | 2 |
| Function OIDs | 117 | 117 |
| Non-internal triggers | 12 | 12 |
| Policies | 0 | 0 |
| Extensions | 5 | 5 |
| `tejas_learn_audit` rows | 32 | 31 |
| `tejas_learn_entitlements` rows | 5 | 4 |
| `tejas_payments`, registrations, proofs, orders, e-book access, idempotency | 2 each | 2 each |

The extensions remain `pg_stat_statements` 1.11, `pgcrypto` 1.3, `plpgsql` 1.0, `supabase_vault` 0.3.1, and `uuid-ossp` 1.1. The three migration statement digests match Section AC. Section H's historical totals, 9 schemas and 116 functions, were not reproduced. The Section T index total of 189 was not reproduced by this script. Those historical figures stay unchanged.

### Backup

pg_dump 17.12 wrote one custom-format archive from the read-only-verified pooler session. The command did not use `--clean`, `--no-owner`, or `--no-acl`. The archive header says it was created at 2026-11-18 02:44:05 UTC, which is 18 November 2026, 8:14:05 AM IST, from database `postgres` on PostgreSQL 17.11. The source database name is the Production name. It was not used as the restore target.

| Item | Result |
| --- | --- |
| Plaintext bytes | 480,109 |
| Plaintext SHA-256 | `2d4457b19536d978d76cdc0b823d14491b40f1c48d6e4657e0643faabcafc872` |
| `pg_restore --list` | Exit 0. 785 catalog entries, including `supabase_migrations.schema_migrations` and its data |
| Post-dump application counts | Unchanged from the pre-dump reading |

OpenSSL 3.0.13 encrypted the plaintext with `enc -aes-256-cbc -pbkdf2 -salt`. The passphrase was `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE`, supplied on file descriptor 3. Its value is not written here. Decrypting that ciphertext reproduced the plaintext SHA-256.

| Item | Result |
| --- | --- |
| Ciphertext bytes | 480,128 |
| Ciphertext SHA-256 | `254fb4540980c97ffea1b79201db0c02c4249828da618e86990bf4be283c6424` |
| Round trip | Match |

The plaintext copies were overwritten and unlinked. The ciphertext remained only on the recovery machine, mode `600`, outside the repository. It was not committed and it was not uploaded. `rclone` and the `tejasdrive` remote were not present, so Google Drive was not contacted. A ciphertext checksum does not by itself prove a restore. The restore below used the plaintext before it was removed.

### Isolated restore

The target was a new local PostgreSQL 17.12 cluster. `listen_addresses` was `127.0.0.1`. The port was `55442`. The connection used the socket `/var/run/postgresql`. `inet_server_addr()` was empty because the session used that socket. The data directory was `/var/lib/postgresql/17/tejas-isolated`. Before `pg_restore`, `current_database()` was `tejas_isolated_20261118`.

The ten role names recorded in Section T were created on this cluster only, `NOLOGIN` and `NOINHERIT`, with no password: `anon`, `authenticated`, `dashboard_user`, `pgbouncer`, `service_role`, `supabase_admin`, `supabase_auth_admin`, `supabase_functions_admin`, `supabase_realtime_admin`, and `supabase_storage_admin`. `supabase_admin` was a local superuser and could not log in. No Production role was created or altered.

`supabase_vault` 0.3.1 was built from tag `v0.3.1`, commit `6e0cd916242d922a646e4d611cc215e09dd429f4`, with `PG_CONFIG=/usr/lib/postgresql/17/bin/pg_config`. `pg_restore --exit-on-error` exited 0 in less than one second. `--no-owner` and `--no-acl` were not used. After the restore, the local database named `postgres` contained zero `public` relations whose names begin with `tejas_`. Its size stayed near the template databases. The restored database was the larger database.

A read-only transaction on `tejas_isolated_20261118` returned the same inventory totals, extension versions, migration digests, and application row counts as the pre-dump Production reading, including audit 32 and entitlements 5. `public.tejas_payments` was owned by `postgres`. Seventy non-system relations had ACLs. `vault.secrets` had 0 rows. The vault relations were `vault.secrets`, `vault.secrets_pkey`, `vault.secrets_name_idx`, and `vault.decrypted_secrets`.

The local server was then stopped and its data directory was removed. The package-created cluster `17/main` was never started and was not a restore target.

This restore confirms that the new backup can be read and restored into an isolated database. It does not satisfy Section H. The Database Gate remains **NOT COMPLETE**.

### Storage listing

`SUPABASE_SECRET_KEY` was present. Its value was not printed. The JWT payload claims are issuer `supabase`, project ref `zapccpipwxduzlnvjdmy`, and role `service_role`. Every object read was HTTP GET. Bucket metadata used HTTP GET. Listing used POST `/storage/v1/object/list/{bucket}`, which returns names. No upload, overwrite, or delete was sent.

Both buckets are private. `tejas-payment-proofs` allows 5,242,880 bytes and the MIME types recorded in Section AI. `tejas-registration-files` allows 10,485,760 bytes and the MIME types recorded in Section AI. Each bucket has exactly two prefixes, and each prefix has exactly one object. No additional object was listed.

| Path | Bytes | SHA-256 against Section B |
| --- | --- | --- |
| `tejas-payment-proofs/TEJAS-2026-NS553XMZZG2N8XE7DHV3/receipt.pdf` | 205,575 | Match |
| `tejas-payment-proofs/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/receipt.jpg` | 320,492 | Match |
| `tejas-registration-files/TEJAS-2026-NS553XMZZG2N8XE7DHV3/upload.xlsx` | 11,160 | Match |
| `tejas-registration-files/TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ/upload.xlsx` | 11,160 | Match |

The downloaded copies were hashed in memory and overwritten. The Storage archive was not on this machine. `/home/ubuntu/tejas-backups/bin/age` was absent. No decryption or extraction was run. This listing reconfirms the four live objects. It does not supply the missing historical extraction authorization, and it does not restore a Storage destination. The Storage Gate remains **NOT COMPLETE**.

### Application access

The restored `tejas_learn_students` table had 16 rows with both `password_hash` and `password_salt`. `tejas_learn_staff` had 0 such rows. The hash and salt values were not selected or printed. No sign-in was attempted. No password, role, or session was changed. PostgreSQL role passwords remain unrecovered under the Section AH limitation. Application and service operational recovery remains **NOT ESTABLISHED**.

### Scheduling and retention

The repository has no GitHub Actions workflow. Listing GitHub Actions secret names returned HTTP 403, so a scheduled Production backup was not added. No backup alert, retention job, or restore schedule was enabled. The encrypted archive was not copied to Google Drive. Off-machine retention of this new backup remains **BLOCKED**.

`python3 -m unittest test_safe_extract.py test_inventory_sql.py` ran 25 tests. All passed. Those tests do not connect to Production.

### Status after this evidence

| Item | Status |
| --- | --- |
| Database Gate | **NOT COMPLETE** |
| Storage Gate | **NOT COMPLETE** |
| Production database recovery | **NOT PERFORMED** |
| Storage destination restoration | **NOT PERFORMED** |
| Application/service operational recovery | **NOT ESTABLISHED** |
| Full disaster recovery | **NOT COMPLETE** |

Section R still requires the Section H comparison before the database gate is **RECOVERY COMPLETE**, and an authorized extraction plus the four archive-member hashes before the Storage gate is **RECOVERY COMPLETE**. This section supplies a new backup and a new isolated restore. It does not replace either requirement.

## AL. Retention, Storage search, and recovery guards, 18 November 2026, 8:30 AM IST

This section records what was found after Section AK. It does not rewrite sections A through AK. Historical counts, hashes, archive names, and owner decisions stay as written. P-11 remains **Tested**. No Production row, role, password, Storage object, or deployment setting was changed. Supabase Deploy to production was not enabled.

The starting commit was `913c759cbe76979a37d2271710b6d224af3e3516`, the merge of pull request #39. Vercel reported that deployment completed. That report is the existing site integration. It is not a database or Storage restore.

### Off-machine database retention

The Section AK ciphertext was still on the recovery machine, mode `600`, 480,128 bytes. Its SHA-256 still matched `254fb4540980c97ffea1b79201db0c02c4249828da618e86990bf4be283c6424`. `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE` and `TEJAS_BACKUP_OWNER_PASSPHRASE` were set. Their values were not printed. The existing file remains OpenSSL AES-256-CBC with PBKDF2 and salt. It was not decrypted, re-encrypted, or deleted.

`rclone` is not installed. No rclone configuration file is present. The approved remote `tejasdrive` is absent. No new Google OAuth client was created. No upload was attempted. Off-machine retention of this backup remains **BLOCKED**.

The local age of that backup, measured from 2026-11-18 02:44:05 UTC, was under one hour and inside a 48-hour local check. That check is not a deployed monitor.

`scripts/recovery/seal_backup.py` is a future-generation format only. It uses AES-256-GCM and PBKDF2-HMAC-SHA256 with 600,000 iterations. OpenSSL 3.0.13 `enc` rejects AES-GCM on this host, so the script uses the installed cryptography library. It does not open the Section AK file. Tests use a fixture passphrase and a reduced iteration count. The production iteration count stays 600,000.

`scripts/recovery/retention.py` verifies a local checksum, rejects a destination outside `tejasdrive:TEJAS_PRODUCTION_SECURE_BACKUPS/DATABASE_BACKUPS/`, and plans rotation without deleting a file. `scripts/recovery/backup_preflight.py` exits 2 when a required secret name is empty, when the destination is rejected, or when `tejasdrive` is not configured. It does not run `pg_dump` and it does not upload.

### Storage archive search

The documented archive name remains `tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age`, SHA-256 `ac76e4f8895284f098e0f674d58d8a901702f7b219809a0d51f64b358d7e72c4`, from Section B. That file was not on this machine. The identity files named in Section D were not on this machine. `/home/ubuntu/tejas-backups/bin/age` was absent. No age binary was downloaded. No archive was inspected or extracted. No isolated extraction directory was chosen, because choosing one before the archive is present would invent a destination.

The owner authorized this phase. The archive and identity were not available through an existing configured remote, so this section does not record an extraction authorization for a path that was not found. `scripts/recovery/safe_extract.py` was not run on a TEJAS archive. `tar -x` was not used. No live Storage object was uploaded, overwritten, or deleted. The Storage Gate remains **NOT COMPLETE**.

### Automation

The repository had no GitHub Actions workflow. Two workflows are now present, and neither has a `schedule`. `.github/workflows/recovery-backup.yml` runs the recovery unit tests on a pull request. Its manual `backup` choice calls only the fail-closed preflight. It does not install a dump command and it does not upload an artifact. `.github/workflows/recovery-restore-guard.yml` accepts only an isolated host and database name. It does not call `pg_restore`.

GitHub Actions secret names were not readable from this session in the previous audit, and this phase did not receive a secret list. The schedule stays disabled. An owner who later enables a backup run must configure these secret names, without putting their values in the workflow file:

| Secret name | Use |
| --- | --- |
| `SUPABASE_BACKUP_DB_URL` | Read-only source connection |
| `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE` | Encryption passphrase |
| `TEJAS_BACKUP_DESTINATION` | Must name one file under `tejasdrive:TEJAS_PRODUCTION_SECURE_BACKUPS/DATABASE_BACKUPS/` |

The runner also needs `rclone` with the existing `tejasdrive` remote. Those conditions were not met here. No Production backup workflow was run.

### Staff access

Staff sign-in for the learning portal reads `public.tejas_learn_staff`. The password check is application scrypt in `password_hash` and `password_salt`. It is not Supabase Auth and it is not a PostgreSQL role password. Section AK recorded 16 student rows with both hash and salt, and 0 staff rows with both. This phase did not read those columns and did not query Production again.

`createStaffAccount` inserts a reviewer row only when the portal database is configured. A new test deletes that configuration and checks that creation stays closed and authentication returns `unavailable`. No staff account was created. No password was reset. No PostgreSQL role was changed.

The registration review cookie is separate. It uses `TEJAS_ADMIN_TOKEN` and the subject `recovery`. That token is a shared application secret, not a recovered staff password. It was not read, rotated, or printed.

Creating the first staff row, or rotating `TEJAS_ADMIN_TOKEN`, needs a separate owner decision. The decision must name the one email address or the token name, the operator, and the rollback. This section does not authorize either change.

### Database gate

Section AK remains the record of the new backup and the isolated restore. `pg_restore` exited 0 on `tejas_isolated_20261118`. The server-confirmed target was local. P-04's vault inventory was present, with `vault.secrets` at 0 rows. Section H still records 9 schemas and 116 functions. The later comparison is 10 schemas and 117 functions. The Section T index total remains 189, and `inventory.sql` remains 190. No historical SQL was invented. No database object was changed to force a match. The Section AH limitation still does not satisfy Section H. The Database Gate remains **NOT COMPLETE**.

### Checks and status

`python3 -m unittest` in `scripts/recovery` ran 36 tests. All passed. The staff provisioning test passed. Neither test connected to Production.

| Item | Status |
| --- | --- |
| Off-machine backup copy | **BLOCKED** |
| Storage archive extraction | **NOT PERFORMED** |
| Backup schedule | **NOT ENABLED** |
| Database Gate | **NOT COMPLETE** |
| Storage Gate | **NOT COMPLETE** |
| Production database recovery | **NOT PERFORMED** |
| Storage destination restoration | **NOT PERFORMED** |
| Application/service operational recovery | **NOT ESTABLISHED** |
| Full disaster recovery | **NOT COMPLETE** |

Section R is unchanged. A workflow file does not move a gate to **RECOVERY COMPLETE**.

## AM. Backup pipeline, 18 November 2026, 8:45 AM IST

This section records the next phase after Section AL. It does not rewrite sections A through AL. Historical counts, hashes, archive names, and owner decisions stay as written. No Production row, role, password, Storage object, or deployment setting was changed. Supabase Deploy to production was not enabled. No scheduled backup was enabled.

The verified `origin/main` at the start was `6d3fe3587e550a1cf9d7a3c514a5725f0abd4958`, the merge of pull request #40. Vercel reported `Deployment has completed` for that commit at 2026-11-18 03:06:45 UTC, which is 18 November 2026, 8:36:45 AM IST. Supabase Preview was skipped. That deployment is the existing site integration. It is not a database or Storage restore.

### Database backup pipeline

The Section AK ciphertext was checked again. It is still mode `600`, 480,128 bytes, SHA-256 `254fb4540980c97ffea1b79201db0c02c4249828da618e86990bf4be283c6424`. `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE` and `SUPABASE_BACKUP_DB_URL` were set. Their values were not printed. The ciphertext was not decrypted, re-encrypted, replaced, or uploaded.

`rclone` is not installed. No rclone configuration file was found. `/home/ubuntu/tejas-backups/bin/age` is absent. A search of the recovery machine did not find `tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age` or either documented age identity. GitHub Actions secret names still could not be listed: the API returned HTTP 403. No new Google OAuth client was created. No Production `pg_dump` was run in this phase.

`scripts/recovery/backup_pipeline.py` is the command the manual backup job calls after preflight succeeds. It checks that the source host or user contains `zapccpipwxduzlnvjdmy`, opens a session with `default_transaction_read_only` on, and continues only when that session reports read-only, database `postgres`, PostgreSQL 17, TLS, and a non-loopback server address. It then runs PostgreSQL custom-format `pg_dump` without `--clean`, `--no-owner`, or `--no-acl`. The password is passed in the child environment, not on the command line. The plaintext is sealed with the existing AES-256-GCM helper, overwritten, and removed. The sealed name is `tejas-zapccpipwxduzlnvjdmy-YYYYMMDDTHHMMSSZ.dump.seal`. The command refuses to continue when that name is already listed. It uploads with `rclone copyto` to `tejasdrive:TEJAS_PRODUCTION_SECURE_BACKUPS/DATABASE_BACKUPS/`, copies that one object back, and exits 0 only when the two SHA-256 values match. It prints one manifest line and `remote_match true`. It does not delete a previous backup. `delete_backup` always raises `backup deletion is not permitted`.

Section AL said `TEJAS_BACKUP_DESTINATION` must name one file. This section tightens that rule. The secret must be the directory `tejasdrive:TEJAS_PRODUCTION_SECURE_BACKUPS/DATABASE_BACKUPS`, with or without a trailing slash. The command appends the unique name. A fixed filename is rejected so a later run cannot replace an older object. The Section AL wording remains the historical record.

The workflow `.github/workflows/recovery-backup.yml` still has no `schedule` and no artifact upload. A pull request runs the unit tests only. The manual `backup` choice runs preflight first. The PostgreSQL client install and `backup_pipeline.py` are later steps, so they do not run when preflight exits 2. A preflight failure is a failed job. It is not a successful backup. This phase did not dispatch the workflow. The pipeline was not executed, so there is no new ciphertext, no remote object, and no remote checksum from this phase.

### Manual recovery

When `rclone`, the existing `tejasdrive` remote, and the three secret names are present, an operator may dispatch `recovery-backup` with action `backup`. The job is acceptable only when its log contains `remote_match true` and one manifest line. A log that stops at preflight is a failure. The new object is additive. Removing it needs a separate decision, because the command refuses deletion. A restore still has to pass `scripts/recovery/restore_target.py`: the host must be `127.0.0.1`, `::1`, or `/var/run/postgresql`, and the database must not be `postgres`. Production remains a prohibited restore target. Rollback of a bad sealed object is to leave it in place and take a new uniquely named backup. Do not overwrite it and do not restore it into Production.

### Storage

The archive and both identity files remain absent. No age binary was downloaded. No archive was decrypted or extracted. `tar -x` was not used. No isolated extraction directory was chosen. No live Storage object was uploaded, overwritten, or deleted. The Storage Gate remains **NOT COMPLETE**.

### Staff access

No staff account was created. No password was reset. `TEJAS_ADMIN_TOKEN` was not read or rotated. The fail-closed staff test remains in the repository. The first staff row, or a token rotation, still needs a separate owner decision that names the one email address or the token, the operator, and the rollback.

### Database gate

Section H still records 9 schemas and 116 functions. The later comparison remains 10 schemas and 117 function OIDs. No historical SQL was invented and no database object was changed. The Database Gate remains **NOT COMPLETE**.

### Checks and status

`python3 -m unittest` in `scripts/recovery` ran 41 tests. All passed. The tests use fixture identities and do not connect to Production. The staff provisioning test also passed: with the portal database configuration removed, account creation stayed closed and authentication returned `unavailable`.

| Item | Status |
| --- | --- |
| Production backup execution | **NOT PERFORMED** |
| Remote upload | **NOT PERFORMED** |
| Remote checksum | **NOT PERFORMED** |
| Off-machine backup copy | **BLOCKED** |
| Storage archive extraction | **NOT PERFORMED** |
| Backup schedule | **NOT ENABLED** |
| Database Gate | **NOT COMPLETE** |
| Storage Gate | **NOT COMPLETE** |
| Production database recovery | **NOT PERFORMED** |
| Storage destination restoration | **NOT PERFORMED** |
| Application/service operational recovery | **NOT ESTABLISHED** |
| Full disaster recovery | **NOT COMPLETE** |

Section R is unchanged. Implementation and unit tests do not move a gate to **RECOVERY COMPLETE**.

## AN. Runner rclone configuration, 18 November 2026, 8:55 AM IST

This section records a correction after Section AM. It does not rewrite sections A through AM. No Production row, role, password, Storage object, or deployment setting was changed. The backup workflow was not dispatched. Supabase Deploy to production was not enabled. No schedule was added.

Pull request #41 had already merged before this correction. Its merge commit is `b989bf9f3d5d7cbc60ebd57530487d281bd9c3b0`. The pull request head remains `9c14df95df0acfa062dbe6a5489695df3ad018bb`. The review found that the backup job used `runs-on: ubuntu-latest` but did not install rclone or give that runner the existing `tejasdrive` configuration. A preflight on that runner would stop because rclone was absent. It could not reach the approved destination.

### Configuration method

The backup job now follows this order. A failure at any step stops the job before the next step.

1. Check that `SUPABASE_BACKUP_DB_URL`, `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE`, `TEJAS_BACKUP_DESTINATION`, and `TEJAS_RCLONE_CONFIG_B64` are present. The destination must be the directory `tejasdrive:TEJAS_PRODUCTION_SECURE_BACKUPS/DATABASE_BACKUPS`, not a fixed filename.
2. Install rclone `v1.76.0` for `linux-amd64`. The zip SHA-256 is `b00f00b3266c3764413afe599d3ec316f6f43b3e0ea8a0bc1d186d2133e46df7`. That digest was read from `https://downloads.rclone.org/v1.76.0/SHA256SUMS` and matched a downloaded copy of `rclone-v1.76.0-linux-amd64.zip`. The job rejects the archive when `sha256sum -c` fails.
3. Decode `TEJAS_RCLONE_CONFIG_B64` into a temporary `rclone.conf` with mode `0600`. The decoded file must contain a `[tejasdrive]` section. A different remote name is rejected. No new Google OAuth client is created and no remote is created by the job.
4. Run `rclone listremotes` with `RCLONE_CONFIG` pointed at that file. Continue only when the listed name is `tejasdrive`, then list the approved directory. The configuration, token, and command error text from rclone are not printed.
5. Only after those checks does the job install the PostgreSQL client and run the identity query, custom-format dump, AES-256-GCM seal, one `copyto` upload, and the downloaded SHA-256 comparison.

The child environment for rclone does not receive the database URL, the passphrase, or the base64 configuration. The database password is not placed on a command line. `delete_backup` still refuses deletion. An existing object name is still refused. The Section AK ciphertext was not opened or replaced.

### What was not done

`TEJAS_RCLONE_CONFIG_B64` is not present on this recovery machine. GitHub Actions secret names remain unreadable from this session. `tejasdrive` was not reachable from this phase. No Production connection was opened. No dump was created. No remote object was uploaded. A passing unit test is not a remote backup.

### Checks and status

`python3 -m unittest` in `scripts/recovery` ran 45 tests. All passed. The tests use fixture configuration and do not contact Production or Google Drive. The staff provisioning test passed: with the portal database configuration removed, account creation stayed closed and authentication returned `unavailable`.

| Item | Status |
| --- | --- |
| `tejasdrive` reachable from the runner | **NOT VERIFIED** |
| Production backup execution | **NOT PERFORMED** |
| Remote upload | **NOT PERFORMED** |
| Remote checksum | **NOT PERFORMED** |
| Off-machine backup copy | **BLOCKED** |
| Backup schedule | **NOT ENABLED** |
| Database Gate | **NOT COMPLETE** |
| Storage Gate | **NOT COMPLETE** |
| Full disaster recovery | **NOT COMPLETE** |

Section R is unchanged. A pinned installer does not move a gate to **RECOVERY COMPLETE**. The owner still has to place the existing rclone configuration in the Actions secret `TEJAS_RCLONE_CONFIG_B64`, without sending that value in chat, and confirm the other three backup secret names. The destination secret must be the approved directory.

## AO. Windows local verification, 18 November 2026, 8:31 PM IST

This section records checks on `DESKTOP-K12JQ1D`. It does not rewrite sections A through AN. No Production connection was opened. No Drive object was uploaded, renamed, replaced, or deleted. No backup workflow was dispatched. Supabase Deploy to production was not enabled. No schedule was added.

Repository `main` was `c6038a6dd6a6bb3f891b647e48a668423f3c3545`, matching `origin/main`, the merge of pull request #42. The worktree had no uncommitted change before this section. Pull request #25 remained open. The eight most recent recovery workflow runs visible from this session were pull-request checks, and all succeeded. No manual backup run was in that list.

Local rclone was v1.76.0. The existing `tejasdrive` remote was type `drive`, scope `drive.readonly`, and root folder ID `1O1afC89m69bKA3oOITls6CnCno7s_geR`. The duplicate folder ID was not used. `rclone lsl --max-depth 1` exited 0 for all four approved directories. The ten object names and sizes matched Section AF. Nothing else was listed.

### Database file and manifest

The previously downloaded `tejas-zapccpipwxduzlnvjdmy-20261117T184209Z.dump.enc` was not downloaded again. Its size remained 479,856 bytes and its SHA-256 remained `1dd023171475ebf2386918ad7be4ba9634b02dc4145f1e643b820ece148d0cd5`.

The matching manifest was downloaded once. It was 1,645 bytes and SHA-256 `cdf86ab281851665f3d64a66df7a5b3025693e4f25d5844f3ac089e301587411`. Both match Section AC. The manifest names project `zapccpipwxduzlnvjdmy`, stage `post-repair`, created `20261117T184209Z`, PostgreSQL custom format, database `postgres`, server PostgreSQL 17.11, pg_dump 17.12, and encryption `openssl-enc-aes-256-cbc-pbkdf2-salt`. It records the encrypted size and SHA-256 above, plaintext 479,830 bytes, and plaintext SHA-256 `b7d804738410f77f4aedfcf9e9b5e8c2fe925792d34d32e2bd33ab7ed213446c`. It records the three Section AC migration rows and says the plaintext was not uploaded. It contains no passphrase.

### Decryption attempt

age v1.3.2, the pinned version, decrypted `tejas-recovery-passphrases-20261117.age` with the Section Y Windows identity. The ciphertext was 471 bytes and SHA-256 `a5a945fc2fa0cd06edeb38e981c1690d28a67be93d91584e1cc4b1da48f26f94`, matching Section Y. The decrypted record names `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE` and then a 2-digit field. OpenSSL used that 2-digit field as the passphrase and exited 1 with `bad decrypt`. The following line was not a length-prefixed value for that field, so it was not tried. No further passphrase candidate was tried. The passphrase value was not printed.

The OpenSSL binary on this PC is Git's OpenSSL 3.2.3. Its `enc -pbkdf2` help says the default iteration count is 10000. Section AC used OpenSSL 3.0.13. GnuPG from Git is 2.4.5. Section B records GnuPG 2.4.4 for the owner identity file. Neither identity ciphertext was decrypted. PostgreSQL is not installed, so `pg_restore` and an isolated cluster were not run. Python is not installed, so the local recovery unit tests were not run.

The failed plaintext output and the decrypted custody copy were overwritten and removed. The owner's original identity file and original `recovered.txt` were not deleted. The encrypted downloads remain under `C:\TEJAS_RECOVERY_VERIFICATION`.

### Storage archive

`tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age` was downloaded. Its size was 555,336 bytes and its SHA-256 was `ac76e4f8895284f098e0f674d58d8a901702f7b219809a0d51f64b358d7e72c4`, matching Section B. Both identity ciphertexts matched the Section B sizes and SHA-256 values. They were not decrypted. The encryption passphrase stop also blocks the original identity file, and the owner passphrase was not separated as its own value.

A pre-existing directory, `Downloads\TEJAS_STORAGE_BACKUP`, already contained the four Section B object paths. Their sizes and SHA-256 values matched Section B. That directory was not produced by decrypting the archive downloaded in this section. It is not an isolated extraction of that archive.

### Pipeline review

The code on `main` refuses a backup when a required secret is absent, when the destination is not the approved database directory, or when `tejasdrive` is not in the supplied configuration. rclone is pinned to v1.76.0, and the Linux zip digest is the one in Section AN. The rclone child environment drops `TEJAS_*` and `SUPABASE_*` variables. The passphrase is used in the Python seal step and is not passed to rclone. Production identity checks reject a loopback server. The upload is one `copyto`, followed by a download and SHA-256 comparison. Deletion remains refused. The workflow trigger is a pull request or a manual dispatch. It has no schedule. This review did not dispatch it.

### Status after this check

| Item | Status |
| --- | --- |
| Database ciphertext and manifest | Verified |
| Database decryption | **BLOCKED** |
| Isolated database restore | **NOT TESTED** |
| Storage ciphertext | Verified |
| Storage identity decryption | **BLOCKED** |
| Isolated extraction of this Storage archive | **NOT TESTED** |
| Database Gate | **NOT COMPLETE** |
| Storage Gate | **NOT COMPLETE** |
| Full disaster recovery | **NOT COMPLETE** |

The owner can continue decryption by supplying `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE` as the passphrase bytes only, in the user environment or a mode-600 file. It must not be sent in chat, and it must not be taken from the 2-digit field in the custody record. This PC also needs PostgreSQL 17.12 before an isolated restore can run. The owner passphrase is still required before the owner identity ciphertext can be decrypted if the encryption passphrase is not the one that opens the original identity file.

## AP. Read-only recheck, 19 November 2026

This section records a later listing on the same Windows PC. It does not rewrite sections A through AO. No archive was downloaded. No checksum was recomputed. No passphrase was read, guessed, or printed. No backup was decrypted. No database was restored. No Storage object was uploaded, renamed, replaced, or deleted. The `AGE_KEY_RECOVERY` files were not modified.

`origin/main` at this check was `47833c2ba5452635626d8f871b9e59919423c8e3`, the merge of pull request #46. That merge is the PAN-holder website change. It is not a database restore and it is not a Storage restore. Pull requests #43, #25, #22, #21, and #17 remained open. Pull request #25 was not applied.

### Tools

| Tool | Result |
| --- | --- |
| rclone | v1.76.0. `rclone lsl` and `rclone lsf` exited 0. The remote remained read-only. |
| age | v1.3.2 is installed. It was not used. |
| psql | PostgreSQL 17.12 client only. No database server was installed. No connection was opened. |
| pg_restore | Not installed. |

### Drive listing

`tejasdrive:DATABASE_BACKUPS` listed these names and sizes. The times are the listing times.

| Bytes | Listed time | Name |
| --- | --- | --- |
| 476,816 | 2026-11-15 06:16:47 | `tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump.enc` |
| 479,856 | 2026-11-17 23:30:43 | `tejas-zapccpipwxduzlnvjdmy-20261117T175954Z.dump.enc` |
| 856 | 2026-11-17 23:30:43 | `tejas-zapccpipwxduzlnvjdmy-20261117T175954Z.manifest.txt` |
| 479,856 | 2026-11-18 00:12:57 | `tejas-zapccpipwxduzlnvjdmy-20261117T184209Z.dump.enc` |
| 1,645 | 2026-11-18 00:12:57 | `tejas-zapccpipwxduzlnvjdmy-20261117T184209Z.manifest.txt` |

`STORAGE_FILE_BACKUPS` listed `tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age` at 555,336 bytes, 2026-11-16 15:26:15. `AGE_KEY_RECOVERY` listed `tejas-storage-backup.identity.gpg` and `tejas-storage-backup.identity.owner.gpg`. `PASSPHRASE_CUSTODY` listed `tejas-recovery-passphrases-20261117.age` and `tejas-recovery-passphrases-20261117.manifest.txt`. File contents were not opened.

The 479,856-byte database archive matches the size recorded in Section AO. Its SHA-256 was not recomputed in this section. The prior value remains the Section AO value. The Storage archive size matches Section B. Its SHA-256 was not recomputed in this section.

### Status after this listing

| Item | Status |
| --- | --- |
| Database archive still present at the recorded size | Verified by listing only |
| Database checksum on 19 November | **NOT RECOMPUTED** |
| Database decryption | **BLOCKED**. The Section AO passphrase stop still applies. |
| Isolated database restore | **NOT TESTED**. `pg_restore` is absent and decryption is blocked. |
| Storage archive still present at the recorded size | Verified by listing only |
| Storage identity decryption | **BLOCKED** |
| Isolated Storage extraction | **NOT TESTED** |
| Database Gate | **NOT COMPLETE** |
| Storage Gate | **NOT COMPLETE** |
| Full disaster recovery | **NOT COMPLETE** |

A matching filename and size are not a new integrity check. Decryption still needs the passphrase bytes supplied outside chat, not the 2-digit field recorded in Section AO. An isolated restore still needs `pg_restore` from PostgreSQL 17 and an empty database that is not Production.
