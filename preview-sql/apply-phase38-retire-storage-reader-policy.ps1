# Apply Phase 38 Storage-reader SELECT policy DROP on production.
# Executes ONLY: drop policy if exists tejas_storage_backup_objects_select on storage.objects;
# Source of truth: PHASE38-RETIRE-STORAGE-READER-SELECT-POLICY.sql
# Does NOT apply PHASE38-HELD-STORAGE-BACKUP-SELECT-ONLY.sql (that file is CREATE).
# Modes: Verify | Apply
# Never prints passwords/secrets.

param()

$ErrorActionPreference = "Stop"
$ProjectRef = "zapccpipwxduzlnvjdmy"
$ExpectedPolicy = "tejas_storage_backup_objects_select"
$ExpectedUuid = "cf49f328-d5d6-4eb4-9aaf-bc0cbefa3355"
$Pooler = "aws-0-ap-northeast-1.pooler.supabase.com"
$Psql = "C:\Users\Admin\AppData\Local\tejas-pg17\pgsql\bin\psql.exe"
$DumpTarget = "tejas-backup-dumper/$ProjectRef"
$DumpUser = "tejas_backup_dumper.$ProjectRef"
$RetireSqlPath = Join-Path $PSScriptRoot "PHASE38-RETIRE-STORAGE-READER-SELECT-POLICY.sql"
$EvidenceDir = Join-Path $env:LOCALAPPDATA "tejas-app-stack-recovery\evidence"

$Mode = "Verify"
if ($args.Count -eq 1 -and $args[0] -in @("Verify", "Apply")) { $Mode = $args[0] }
elseif ($args.Count -gt 0) { Write-Output "rejected|arguments"; exit 2 }

Write-Output ("utc|" + [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"))
Write-Output ("mode|" + $Mode)
Write-Output ("project|" + $ProjectRef)
Write-Output ("policy|" + $ExpectedPolicy)

if (-not (Test-Path -LiteralPath $RetireSqlPath)) { Write-Output "rejected|retire-sql-missing"; exit 4 }
$retireText = Get-Content -LiteralPath $RetireSqlPath -Raw
if ($retireText -notmatch '(?i)drop\s+policy\s+if\s+exists\s+tejas_storage_backup_objects_select\s+on\s+storage\.objects') {
  Write-Output "rejected|retire-sql-missing-exact-drop"; exit 4
}
if ($retireText -match '(?i)create\s+policy') { Write-Output "rejected|retire-sql-contains-create"; exit 4 }
# Ensure only one drop policy statement target
$dropMatches = [regex]::Matches($retireText, '(?i)drop\s+policy')
if ($dropMatches.Count -ne 1) { Write-Output ("rejected|retire-sql-drop-count|" + $dropMatches.Count); exit 4 }
Write-Output "retire-sql|shape-ok"

# Refuse CREATE held file if somehow passed
$createPath = Join-Path $PSScriptRoot "PHASE38-HELD-STORAGE-BACKUP-SELECT-ONLY.sql"
if (Test-Path $createPath) {
  $createText = Get-Content -LiteralPath $createPath -Raw
  if ($createText -match '(?i)create\s+policy\s+tejas_storage_backup_objects_select') {
    Write-Output "note|held-create-sql-present-not-executed"
  }
}

if (-not ("TejasApplyRetirePol" -as [type])) {
  Add-Type -TypeDefinition @"
using System; using System.Runtime.InteropServices;
public class TejasApplyRetirePol {
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
}

function Get-DumpPass {
  $p = [IntPtr]::Zero
  if (-not [TejasApplyRetirePol]::CredRead($DumpTarget, 1, 0, [ref]$p)) { return $null }
  try {
    $n = [Runtime.InteropServices.Marshal]::PtrToStructure($p, [type][TejasApplyRetirePol+NativeCredential])
    if ($n.UserName -ne $DumpUser) { return $null }
    return [Runtime.InteropServices.Marshal]::PtrToStringUni($n.CredentialBlob, [int]($n.CredentialBlobSize / 2)).Trim()
  } finally { [TejasApplyRetirePol]::CredFree($p) }
}

function Invoke-Sql([string]$Pass, [string]$Sql) {
  $esc = $Pass.Replace('\', '\\').Replace(':', '\:')
  $pgpass = Join-Path $env:TEMP ("tejas-apply-retire-" + [guid]::NewGuid().ToString("n") + ".pgpass")
  [IO.File]::WriteAllText($pgpass, "${Pooler}:5432:postgres:${DumpUser}:${esc}`n")
  $account = whoami
  & icacls $pgpass /inheritance:r /grant:r "${account}:(R,D)" | Out-Null
  $env:PGSSLMODE = "require"
  $env:PGPASSFILE = $pgpass
  $env:PGCONNECT_TIMEOUT = "25"
  $ErrorActionPreference = "Continue"
  $raw = & $Psql --no-password -h $Pooler -p 5432 -U $DumpUser -d postgres -v ON_ERROR_STOP=1 -F '|' -At -c $Sql 2>&1
  $rc = $LASTEXITCODE
  $ErrorActionPreference = "Stop"
  & icacls $pgpass /grant:r "${account}:(F)" 2>$null | Out-Null
  Remove-Item -LiteralPath $pgpass -Force -ErrorAction SilentlyContinue
  Remove-Item Env:\PGPASSFILE -ErrorAction SilentlyContinue
  return @{ Rc = $rc; Out = ("$raw" | Out-String).Trim() }
}

$pass = Get-DumpPass
if (-not $pass) { Write-Output "rejected|backup-dumper-absent"; exit 4 }

$snapSql = @"
select policyname || '|' || cmd || '|' || roles::text
from pg_policies
where schemaname='storage' and tablename='objects'
order by policyname;
"@
$idSql = @"
select
  policyname,
  cmd,
  roles::text,
  (qual ilike '%tejas-registration-files%' and qual ilike '%tejas-payment-proofs%')::text,
  (qual ilike '%$ExpectedUuid%')::text,
  (with_check is null)::text
from pg_policies
where schemaname='storage' and tablename='objects' and policyname='$ExpectedPolicy';
"@

$snap = Invoke-Sql $pass $snapSql
if ($snap.Rc -ne 0) { Write-Output "rejected|snapshot-failed"; $pass = $null; exit 4 }
New-Item -ItemType Directory -Path $EvidenceDir -Force | Out-Null
$stamp = [DateTime]::UtcNow.ToString("yyyyMMddTHHmmssZ")
$beforeFile = Join-Path $EvidenceDir ("p42-storage-policies-before-$stamp.txt")
$snap.Out | Set-Content -LiteralPath $beforeFile -Encoding utf8
$peerBefore = @(($snap.Out -split "`r?`n") | Where-Object { $_.Trim().Length -gt 0 })
Write-Output ("policy-peers-before|" + $peerBefore.Count)
Write-Output ("policy-snapshot-before|" + $beforeFile)

$id = Invoke-Sql $pass $idSql
if ($id.Rc -ne 0) { Write-Output "rejected|identity-query-failed"; $pass = $null; exit 4 }
$line = (($id.Out -split "`r?`n") | Where-Object { $_.Trim().Length -gt 0 } | Select-Object -First 1)
if ([string]::IsNullOrWhiteSpace($line)) {
  Write-Output "policy|absent"
  if ($Mode -eq "Verify") { Write-Output "verify|already-absent"; $pass = $null; exit 0 }
  Write-Output "apply|noop-already-absent"
  $pass = $null
  exit 0
}
$parts = $line -split '\|', 6
Write-Output ("policy-live|name=" + $parts[0] + "|cmd=" + $parts[1] + "|roles=" + $parts[2] + "|two-bucket=" + $parts[3] + "|uuid-match=" + $parts[4] + "|no-with-check=" + $parts[5])
function Test-BoolTrue([string]$v) {
  return ($v -eq "t" -or $v -eq "true" -or $v -eq "True")
}
$match =
  ($parts[0] -eq $ExpectedPolicy) -and
  ($parts[1] -eq "SELECT") -and
  ($parts[2] -match 'authenticated') -and
  (Test-BoolTrue $parts[3]) -and
  (Test-BoolTrue $parts[4]) -and
  (Test-BoolTrue $parts[5])
if (-not $match) {
  Write-Output "rejected|live-policy-identity-mismatch"
  $pass = $null
  exit 4
}
Write-Output "policy-identity|match"

if ($Mode -eq "Verify") {
  Write-Output "verify|present-and-matched"
  $pass = $null
  exit 0
}

# Apply exact DROP only
$dropSql = "begin; drop policy if exists tejas_storage_backup_objects_select on storage.objects; commit;"
$drop = Invoke-Sql $pass $dropSql
$safe = [regex]::Replace($drop.Out, '(?i)password[^\r\n]*', '[redacted]')
$safe = ($safe -replace "`r|`n", " ").Trim()
if ($safe.Length -gt 220) { $safe = $safe.Substring(0, 220) }
Write-Output ("drop-exit|" + $drop.Rc)
Write-Output ("drop-msg|" + $safe)

$afterId = Invoke-Sql $pass $idSql
$afterLine = (($afterId.Out -split "`r?`n") | Where-Object { $_.Trim().Length -gt 0 } | Select-Object -First 1)
$still = -not [string]::IsNullOrWhiteSpace($afterLine)
Write-Output ("policy-after|present=" + $still)

$afterSnap = Invoke-Sql $pass $snapSql
$afterFile = Join-Path $EvidenceDir ("p42-storage-policies-after-$stamp.txt")
$afterSnap.Out | Set-Content -LiteralPath $afterFile -Encoding utf8
$peerAfter = @(($afterSnap.Out -split "`r?`n") | Where-Object { $_.Trim().Length -gt 0 })
Write-Output ("policy-peers-after|" + $peerAfter.Count)
Write-Output ("policy-snapshot-after|" + $afterFile)

$pass = $null

if ($still) {
  Write-Output "apply|FAILED|policy-still-present"
  Write-Output "blocker|executor-lacks-drop-policy-privilege"
  Write-Output "owner-action|run-PHASE38-RETIRE-STORAGE-READER-SELECT-POLICY.sql-in-dashboard-sql-editor-as-postgres"
  exit 3
}

if ($peerAfter.Count -ne ($peerBefore.Count - 1)) {
  Write-Output ("warning|peer-count-delta|before=" + $peerBefore.Count + "|after=" + $peerAfter.Count)
} else {
  Write-Output "policy-peers|delta-ok"
}
Write-Output "apply|ok"
exit 0
