# Apply DROP using a write-capable session sequence for tejas_backup_dumper.
# Clears session default_transaction_read_only, then runs exact DROP only.
# Never prints secrets. Modes: Apply

$ErrorActionPreference = "Stop"
$ProjectRef = "zapccpipwxduzlnvjdmy"
$ExpectedPolicy = "tejas_storage_backup_objects_select"
$ExpectedUuid = "cf49f328-d5d6-4eb4-9aaf-bc0cbefa3355"
$Pooler = "aws-0-ap-northeast-1.pooler.supabase.com"
$Psql = "C:\Users\Admin\AppData\Local\tejas-pg17\pgsql\bin\psql.exe"
$DumpTarget = "tejas-backup-dumper/$ProjectRef"
$DumpUser = "tejas_backup_dumper.$ProjectRef"
$SqlFile = Join-Path $PSScriptRoot "_p42_drop_session.sql"
$EvidenceDir = Join-Path $env:LOCALAPPDATA "tejas-app-stack-recovery\evidence"

Write-Output ("utc|" + [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"))
Write-Output "mode|Apply-RW"
Write-Output ("project|" + $ProjectRef)

if (-not (Test-Path $SqlFile)) { Write-Output "rejected|sql-file-missing"; exit 4 }
$body = Get-Content $SqlFile -Raw
if ($body -notmatch '(?i)drop\s+policy\s+if\s+exists\s+tejas_storage_backup_objects_select\s+on\s+storage\.objects') {
  Write-Output "rejected|sql-shape"; exit 4
}
if ($body -match '(?i)create\s+policy') { Write-Output "rejected|create-forbidden"; exit 4 }

Add-Type -TypeDefinition @"
using System; using System.Runtime.InteropServices;
public class TejasApplyRw {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct NativeCredential {
    public int Flags; public int Type; public string TargetName; public string Comment; public long LastWritten;
    public int CredentialBlobSize; public IntPtr CredentialBlob; public int Persist; public int AttributeCount;
    public IntPtr Attributes; public string TargetAlias; public string UserName;
  }
  [DllImport("advapi32", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credential);
  [DllImport("advapi32")] public static extern void CredFree(IntPtr credential);
}
"@
$p = [IntPtr]::Zero
if (-not [TejasApplyRw]::CredRead($DumpTarget, 1, 0, [ref]$p)) { Write-Output "rejected|cm"; exit 4 }
$n = [Runtime.InteropServices.Marshal]::PtrToStructure($p, [type][TejasApplyRw+NativeCredential])
if ($n.UserName -ne $DumpUser) { [TejasApplyRw]::CredFree($p); Write-Output "rejected|user"; exit 4 }
$pass = [Runtime.InteropServices.Marshal]::PtrToStringUni($n.CredentialBlob, [int]($n.CredentialBlobSize / 2)).Trim()
[TejasApplyRw]::CredFree($p)

function Invoke-Sql([string]$Pass, [string]$Sql) {
  $esc = $Pass.Replace('\', '\\').Replace(':', '\:')
  $pgpass = Join-Path $env:TEMP ("tejas-rw-apply-" + [guid]::NewGuid().ToString("n") + ".pgpass")
  [IO.File]::WriteAllText($pgpass, "${Pooler}:5432:postgres:${DumpUser}:${esc}`n")
  $account = whoami
  & icacls $pgpass /inheritance:r /grant:r "${account}:(R,D)" | Out-Null
  $env:PGSSLMODE = "require"; $env:PGPASSFILE = $pgpass; $env:PGCONNECT_TIMEOUT = "25"
  $ErrorActionPreference = "Continue"
  $raw = & $Psql --no-password -h $Pooler -p 5432 -U $DumpUser -d postgres -v ON_ERROR_STOP=1 -F '|' -At -c $Sql 2>&1
  $rc = $LASTEXITCODE
  $ErrorActionPreference = "Stop"
  & icacls $pgpass /grant:r "${account}:(F)" 2>$null | Out-Null
  Remove-Item $pgpass -Force -ErrorAction SilentlyContinue
  Remove-Item Env:\PGPASSFILE -ErrorAction SilentlyContinue
  return @{ Rc = $rc; Out = ("$raw" | Out-String).Trim() }
}

# Pre identity (read-only session ok)
$idSql = @"
select policyname||'|'||cmd||'|'||roles::text||'|'||
  (qual ilike '%tejas-registration-files%' and qual ilike '%tejas-payment-proofs%')::text||'|'||
  (qual ilike '%$ExpectedUuid%')::text||'|'||(with_check is null)::text
from pg_policies
where schemaname='storage' and tablename='objects' and policyname='$ExpectedPolicy';
"@
$snapSql = "select policyname||'|'||cmd||'|'||roles::text from pg_policies where schemaname='storage' and tablename='objects' order by 1;"

$before = Invoke-Sql $pass $snapSql
New-Item -ItemType Directory -Path $EvidenceDir -Force | Out-Null
$stamp = [DateTime]::UtcNow.ToString("yyyyMMddTHHmmssZ")
$beforeFile = Join-Path $EvidenceDir ("p42-rw-policies-before-$stamp.txt")
$before.Out | Set-Content $beforeFile -Encoding utf8
$peersBefore = @(($before.Out -split "`r?`n") | Where-Object { $_.Trim() })
Write-Output ("policy-peers-before|" + $peersBefore.Count)

$id = Invoke-Sql $pass $idSql
$line = (($id.Out -split "`r?`n") | Where-Object { $_.Trim() } | Select-Object -First 1)
if ([string]::IsNullOrWhiteSpace($line)) {
  Write-Output "policy|already-absent"
  $pass = $null
  exit 0
}
Write-Output ("policy-live|" + $line)
if ($line -notmatch [regex]::Escape($ExpectedPolicy)) { Write-Output "rejected|name"; $pass = $null; exit 4 }
if ($line -notmatch 'SELECT') { Write-Output "rejected|cmd"; $pass = $null; exit 4 }
if ($line -notmatch 'authenticated') { Write-Output "rejected|role"; $pass = $null; exit 4 }
if ($line -notmatch 'true' -and $line -notmatch '\|t\|') { Write-Output "rejected|scope-flags"; $pass = $null; exit 4 }
Write-Output "policy-identity|match"

# Execute DROP file in one session: set RW then drop
$esc = $pass.Replace('\', '\\').Replace(':', '\:')
$pgpass = Join-Path $env:TEMP ("tejas-rw-drop-" + [guid]::NewGuid().ToString("n") + ".pgpass")
[IO.File]::WriteAllText($pgpass, "${Pooler}:5432:postgres:${DumpUser}:${esc}`n")
$account = whoami
& icacls $pgpass /inheritance:r /grant:r "${account}:(R,D)" | Out-Null
$env:PGSSLMODE = "require"; $env:PGPASSFILE = $pgpass; $env:PGCONNECT_TIMEOUT = "25"
$ErrorActionPreference = "Continue"
$dropOut = & $Psql --no-password -h $Pooler -p 5432 -U $DumpUser -d postgres -v ON_ERROR_STOP=1 -f $SqlFile 2>&1 | Out-String
$dropRc = $LASTEXITCODE
$ErrorActionPreference = "Stop"
& icacls $pgpass /grant:r "${account}:(F)" 2>$null | Out-Null
Remove-Item $pgpass -Force -ErrorAction SilentlyContinue
Remove-Item Env:\PGPASSFILE -ErrorAction SilentlyContinue
$pass = $null

$safe = [regex]::Replace($dropOut, '(?i)password[^\r\n]*', '[redacted]')
$safe = ($safe -replace "`r|`n", " | ").Trim()
if ($safe.Length -gt 240) { $safe = $safe.Substring(0, 240) }
Write-Output ("drop-exit|" + $dropRc)
Write-Output ("drop-msg|" + $safe)

# Re-read password for verify
$p2 = [IntPtr]::Zero
[void][TejasApplyRw]::CredRead($DumpTarget, 1, 0, [ref]$p2)
$n2 = [Runtime.InteropServices.Marshal]::PtrToStructure($p2, [type][TejasApplyRw+NativeCredential])
$pass2 = [Runtime.InteropServices.Marshal]::PtrToStringUni($n2.CredentialBlob, [int]($n2.CredentialBlobSize / 2)).Trim()
[TejasApplyRw]::CredFree($p2)

$afterId = Invoke-Sql $pass2 $idSql
$afterSnap = Invoke-Sql $pass2 $snapSql
$pass2 = $null
$afterFile = Join-Path $EvidenceDir ("p42-rw-policies-after-$stamp.txt")
$afterSnap.Out | Set-Content $afterFile -Encoding utf8
$still = -not [string]::IsNullOrWhiteSpace((($afterId.Out -split "`r?`n") | Where-Object { $_.Trim() } | Select-Object -First 1))
$peersAfter = @(($afterSnap.Out -split "`r?`n") | Where-Object { $_.Trim() })
Write-Output ("policy-after|present=" + $still)
Write-Output ("policy-peers-after|" + $peersAfter.Count)
Write-Output ("policy-snapshot-after|" + $afterFile)

if ($still) {
  Write-Output "apply|FAILED|policy-still-present"
  exit 3
}
if ($peersAfter.Count -ne ($peersBefore.Count - 1) -and -not ($peersBefore.Count -eq 1 -and $peersAfter.Count -eq 0)) {
  Write-Output ("warning|peer-delta|before=" + $peersBefore.Count + "|after=" + $peersAfter.Count)
} else {
  Write-Output "policy-peers|delta-ok"
}
Write-Output "apply|ok"
exit 0
