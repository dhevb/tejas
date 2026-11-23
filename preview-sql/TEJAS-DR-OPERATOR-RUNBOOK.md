# TEJAS DR — Operator runbook

Worktree: `phase3/free-host-local` @ `6da54f6`
Production project (never use as isolated target): `zapccpipwxduzlnvjdmy`

---

## A. Data-plane (already PASS)

| Operation | Command |
| --- | --- |
| Storage Prepare | `powershell -NoProfile -File .\scripts\recovery\windows_storage_backup_pipeline.ps1 Prepare` |
| Isolated Storage verify | `powershell -NoProfile -File .\scripts\recovery\windows_isolated_storage_restore.ps1 Restore` |
| Isolated DB restore | `powershell -NoProfile -File .\scripts\recovery\windows_isolated_db_restore.ps1 Restore` |

Archives (do not modify):

- DB: `%LOCALAPPDATA%\tejas-db-backups\run-20261122T210105Z\*.dump.tejas1` → `24db6a21…88f6`
- Storage: `%LOCALAPPDATA%\tejas-storage-backups\run-20261122T222749Z\*.zip.tejas1` → `f34c09db…a17b`

---

## B. Application-stack (owner gate → Full)

1. Create disposable hosted Supabase project (not production).
2. Bootstrap CM (secrets never in chat):

```powershell
powershell -NoProfile -File .\preview-sql\bootstrap-tejas-app-stack-isolated.ps1
```

3. Run recovery:

```powershell
powershell -NoProfile -File .\scripts\recovery\windows_app_stack_recovery.ps1 Prepare
powershell -NoProfile -File .\scripts\recovery\windows_app_stack_recovery.ps1 VerifyTarget
powershell -NoProfile -File .\scripts\recovery\windows_app_stack_recovery.ps1 Full
```

4. Local wipe of work dirs: `… Full` finally wipes plaintext; optional `Teardown` mode.
5. Owner may delete the disposable cloud project when finished.

SelfTests (safe anytime):

```powershell
powershell -NoProfile -File .\preview-sql\bootstrap-tejas-app-stack-isolated.ps1 SelfTest
powershell -NoProfile -File .\scripts\recovery\windows_app_stack_recovery.ps1 SelfTest
powershell -NoProfile -File .\scripts\recovery\windows_app_stack_recovery_prep.ps1 SelfTest
```

---

## C. Security cleanup (after downloads done)

```powershell
powershell -NoProfile -File .\preview-sql\retire-tejas-storage-reader-session.ps1 Status
powershell -NoProfile -File .\preview-sql\retire-tejas-storage-reader-session.ps1 Retire
```

Then owner-apply held SQL: `PHASE38-RETIRE-STORAGE-READER-SELECT-POLICY.sql`.

---

## D. Failure / corruption checks (already evidenced)

| Check | Where |
| --- | --- |
| Wrong TEJAS1 key rejected | Phase 39 SelfTest |
| Corrupted Storage seal rejected | Phase 41 independent flip-byte test |
| Production URL rejected for app-stack | Bootstrap + Full SelfTest |
| HTTPS required | `durable.ts` + prep SelfTest |

---

## E. Prohibitions

No production deploy, DNS change, ExecutionPolicy Bypass, `service_role` as backup-reader, secret paste into chat, archive overwrite, git commit/push from this runbook alone.
