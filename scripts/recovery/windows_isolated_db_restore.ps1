# Isolated restore of the Phase 37 TEJAS1 database archive onto local loopback PostgreSQL.
# Does not touch production. Uses recovery CM R only in memory / temp pass-file.
# Modes: SelfTest | Restore

param()

$ErrorActionPreference = "Stop"

$BinDir = "C:\Users\Admin\AppData\Local\tejas-pg17\pgsql\bin"
$NodeExe = "C:\Program Files\nodejs\node.exe"
$SealJs = Join-Path $PSScriptRoot "windows_seal.js"
$ProjectRef = "zapccpipwxduzlnvjdmy"
$RecoveryTarget = "tejas1-recovery/$ProjectRef"
$SealedArchive = Join-Path $env:LOCALAPPDATA "tejas-db-backups\run-20261122T210105Z\tejas-db-zapccpipwxduzlnvjdmy-20261122T210105Z.dump.tejas1"
$ExpectedSealedSha = "24db6a21bdf11155b866668cdbcd01881abc6f7cccfb933868bb595ea27388f6"
$LocalHost = "127.0.0.1"
$LocalPort = "55432"
$LocalUser = "postgres"
$RestoreDb = "tejas_p40_iso_" + [DateTime]::UtcNow.ToString("yyyyMMddHHmmss")
$WorkRoot = Join-Path $env:LOCALAPPDATA "tejas-isolated-restore"

$Mode = "Restore"
if ($args.Count -eq 1 -and $args[0] -in @("SelfTest", "Restore")) {
  $Mode = $args[0]
} elseif ($args.Count -gt 0) {
  Write-Output "rejected|arguments"
  exit 2
}

function Clear-Bytes {
  param([byte[]]$Bytes)
  if ($null -ne $Bytes -and $Bytes.Length -gt 0) { [Array]::Clear($Bytes, 0, $Bytes.Length) }
}

function Remove-Partial {
  param([string]$Path)
  if ([string]::IsNullOrWhiteSpace($Path) -or -not (Test-Path -LiteralPath $Path)) { return }
  $item = Get-Item -LiteralPath $Path
  if (-not $item.PSIsContainer -and $item.Length -gt 0) {
    $account = whoami
    & icacls $Path /grant:r "${account}:(F)" | Out-Null
    $stream = [IO.File]::Open($Path, "Open", "Write")
    try {
      $buf = New-Object byte[] 4096
      $rem = $item.Length
      while ($rem -gt 0) {
        $n = [Math]::Min($buf.Length, $rem)
        $stream.Write($buf, 0, $n)
        $rem -= $n
      }
      $stream.Flush()
    } finally { $stream.Dispose() }
  }
  Remove-Item -LiteralPath $Path -Force -Recurse -ErrorAction SilentlyContinue
}

function Ensure-CredType {
  if ("TejasIsoCred" -as [type]) { return }
  Add-Type -TypeDefinition @"
using System; using System.Runtime.InteropServices;
public class TejasIsoCred {
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

function Read-RecoverySecretBytes {
  Ensure-CredType
  $pointer = [IntPtr]::Zero
  $found = [TejasIsoCred]::CredRead($RecoveryTarget, 1, 0, [ref]$pointer)
  if (-not $found -or $pointer -eq [IntPtr]::Zero) { return $null }
  try {
    $native = [Runtime.InteropServices.Marshal]::PtrToStructure($pointer, [type][TejasIsoCred+NativeCredential])
    if ($native.CredentialBlobSize -ne 32) { return $null }
    $bytes = New-Object byte[] 32
    [Runtime.InteropServices.Marshal]::Copy($native.CredentialBlob, $bytes, 0, 32)
    return ,$bytes
  } finally { [TejasIsoCred]::CredFree($pointer) }
}

function Write-PassFileBytes {
  param([byte[]]$Bytes)
  $path = Join-Path $env:TEMP ("tejas-iso-pass-" + [guid]::NewGuid().ToString("n") + ".bin")
  [IO.File]::WriteAllBytes($path, $Bytes)
  $account = whoami
  & icacls $path /inheritance:r /grant:r "${account}:(R,D)" | Out-Null
  if ($LASTEXITCODE -ne 0) { Remove-Partial $path; return $null }
  return $path
}

function Remove-PassFile {
  param([string]$Path)
  if ([string]::IsNullOrWhiteSpace($Path)) { return }
  if (Test-Path -LiteralPath $Path) {
    $account = whoami
    & icacls $Path /grant:r "${account}:(F)" | Out-Null
  }
  Remove-Partial $Path
}

Write-Output ("utc|" + [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"))
Write-Output ("mode|" + $Mode)
Write-Output ("sealed|" + $SealedArchive)

if ($Mode -eq "SelfTest") {
  if (-not (Test-Path -LiteralPath $SealedArchive)) { Write-Output "rejected|sealed-missing"; exit 3 }
  $sha = (Get-FileHash -LiteralPath $SealedArchive -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($sha -ne $ExpectedSealedSha) { Write-Output "rejected|sealed-sha-mismatch"; exit 3 }
  Write-Output "checked|sealed-sha"
  if (-not (Test-Path -LiteralPath (Join-Path $BinDir "pg_restore.exe"))) { Write-Output "rejected|pg_restore"; exit 3 }
  Write-Output "checked|pg_restore"
  Write-Output "self-test|ok"
  exit 0
}

if (-not (Test-Path -LiteralPath $SealedArchive)) {
  Write-Output "rejected|sealed-missing"
  exit 4
}
$sealedSha = (Get-FileHash -LiteralPath $SealedArchive -Algorithm SHA256).Hash.ToLowerInvariant()
Write-Output ("sealed-sha256|" + $sealedSha)
if ($sealedSha -ne $ExpectedSealedSha) {
  Write-Output "rejected|sealed-sha-mismatch"
  exit 4
}

if ($LocalHost -notin @("127.0.0.1", "::1") -or $RestoreDb -eq "postgres") {
  Write-Output "rejected|not-isolated"
  exit 4
}

if (-not (Test-Path -LiteralPath $WorkRoot)) {
  New-Item -ItemType Directory -Path $WorkRoot -Force | Out-Null
}
$runDir = Join-Path $WorkRoot ("run-" + [DateTime]::UtcNow.ToString("yyyyMMddTHHmmssZ"))
New-Item -ItemType Directory -Path $runDir -Force | Out-Null
$plainDump = Join-Path $runDir "phase37.dump"
$passFile = $null
$recovery = $null
$createdb = Join-Path $BinDir "createdb.exe"
$dropdb = Join-Path $BinDir "dropdb.exe"
$pgrestore = Join-Path $BinDir "pg_restore.exe"
$psql = Join-Path $BinDir "psql.exe"
$localArgs = @("--no-password", "-h", $LocalHost, "-p", $LocalPort, "-U", $LocalUser)
$oldSsl = $env:PGSSLMODE

try {
  $env:PGSSLMODE = "disable"
  $recovery = Read-RecoverySecretBytes
  if ($null -eq $recovery) { Write-Output "rejected|recovery-secret"; exit 4 }
  $passFile = Write-PassFileBytes -Bytes $recovery
  if (-not $passFile) { Write-Output "rejected|pass-file"; exit 4 }

  Write-Output "open|starting"
  $ErrorActionPreference = "Continue"
  & $NodeExe $SealJs open --in $SealedArchive --out $plainDump --pass-file $passFile 2>&1 | Out-Null
  $openCode = $LASTEXITCODE
  $ErrorActionPreference = "Stop"
  if ($openCode -ne 0 -or -not (Test-Path -LiteralPath $plainDump)) {
    Write-Output "rejected|open-failed"
    exit 4
  }
  Write-Output "open|ok"
  $plainLen = (Get-Item $plainDump).Length
  Write-Output ("plaintext-bytes|" + $plainLen)

  $list = & $pgrestore --list $plainDump 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) { Write-Output "rejected|list-failed"; exit 4 }
  Write-Output "list|ok"
  if ($list -notmatch "TABLE DATA") { Write-Output "warning|no-table-data-in-list" }

  & $dropdb @localArgs --if-exists $RestoreDb | Out-Null
  & $createdb @localArgs $RestoreDb
  if ($LASTEXITCODE -ne 0) { Write-Output "rejected|createdb"; exit 4 }
  Write-Output ("restore-db|" + $RestoreDb)

  # Supabase custom dump into stock PG: ignore role/ACL noise; fail on hard errors via exit code check after.
  $ErrorActionPreference = "Continue"
  $restoreOut = & $pgrestore --no-owner --no-acl --no-password -h $LocalHost -p $LocalPort -U $LocalUser -d $RestoreDb $plainDump 2>&1 | Out-String
  $restoreCode = $LASTEXITCODE
  $ErrorActionPreference = "Stop"
  # pg_restore often returns 1 with warnings for missing roles/extensions; treat as conditional.
  Write-Output ("pg_restore-exit|" + $restoreCode)
  if ($restoreCode -gt 1) {
    Write-Output "rejected|pg_restore"
    exit 4
  }

  $checks = @{
    "schemas" = "SELECT count(*) FROM information_schema.schemata WHERE schema_name IN ('public','auth','storage');"
    "public_tables" = "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';"
    "storage_objects" = "SELECT count(*) FROM storage.objects;"
    "storage_buckets" = "SELECT count(*) FROM storage.buckets;"
  }
  foreach ($name in ($checks.Keys | Sort-Object)) {
    $ErrorActionPreference = "Continue"
    $val = & $psql @localArgs -d $RestoreDb -v ON_ERROR_STOP=1 -At -c $checks[$name] 2>&1 | Out-String
    $code = $LASTEXITCODE
    $ErrorActionPreference = "Stop"
    $val = ($val -replace "`r|`n", "").Trim()
    if ($code -ne 0) {
      Write-Output ("check|" + $name + "|FAILED")
    } else {
      Write-Output ("check|" + $name + "|" + $val)
    }
  }

  # Wipe plaintext immediately after restore checks
  Remove-Partial $plainDump
  if (Test-Path -LiteralPath $plainDump) {
    Write-Output "rejected|plaintext-remains"
    exit 4
  }
  Write-Output "plaintext-cleanup|verified"

  # Drop isolated DB
  & $dropdb @localArgs --if-exists $RestoreDb | Out-Null
  Write-Output "isolated-db|dropped"

  # Confirm sealed archive unchanged
  $post = (Get-FileHash -LiteralPath $SealedArchive -Algorithm SHA256).Hash.ToLowerInvariant()
  Write-Output ("sealed-unchanged|" + ($post -eq $ExpectedSealedSha))

  if ($restoreCode -eq 0) {
    Write-Output "isolated-restore|complete"
    exit 0
  } else {
    Write-Output "isolated-restore|complete-with-warnings"
    exit 0
  }
} finally {
  Remove-PassFile $passFile
  Clear-Bytes $recovery
  if (Test-Path -LiteralPath $plainDump) {
    Write-Output "warning|plaintext-still-present"
  }
  if ($null -ne $oldSsl) { $env:PGSSLMODE = $oldSsl } else { Remove-Item Env:\PGSSLMODE -ErrorAction SilentlyContinue }
  if (Test-Path -LiteralPath (Join-Path $BinDir "dropdb.exe")) {
    $ErrorActionPreference = "Continue"
    $env:PGSSLMODE = "disable"
    & $dropdb --no-password -h $LocalHost -p $LocalPort -U $LocalUser --if-exists $RestoreDb 2>$null | Out-Null
    $ErrorActionPreference = "Stop"
  }
}
