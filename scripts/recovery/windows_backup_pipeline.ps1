# Windows runner for TEJAS database backup (Phase 37).
# Dump mode requires TEJAS1 key recovery verified (Phase 36AV).
# Passwords are never accepted as arguments and are never printed.

param()

$ErrorActionPreference = "Stop"

$BinDir = "C:\Users\Admin\AppData\Local\tejas-pg17\pgsql\bin"
$NodeExe = "C:\Program Files\nodejs\node.exe"
$SealJs = Join-Path $PSScriptRoot "windows_seal.js"
$ProjectRef = "zapccpipwxduzlnvjdmy"
$PoolerHost = "aws-0-ap-northeast-1.pooler.supabase.com"
$PoolerPort = "5432"
$Database = "postgres"
$BackupUser = "tejas_backup_dumper.$ProjectRef"
$CredentialTarget = "tejas-backup-dumper/$ProjectRef"
$RecoveryTarget = "tejas1-recovery/$ProjectRef"
$ExpectedServerVersion = "17.11"
$MinimumFreeBytes = 2GB
$BackupRoot = Join-Path $env:LOCALAPPDATA "tejas-db-backups"
$AvStatusPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\..\preview-sql\PHASE36AV-RUN-STATUS.txt"))
$script:CredentialReads = 0
$script:RecoveryReads = 0
$script:BackupCredentialReads = 0

$Mode = "Prepare"
if ($args.Count -eq 1 -and $args[0] -in @("Prepare", "SelfTest", "Dump")) {
  $Mode = $args[0]
} elseif ($args.Count -gt 0) {
  Write-Output "rejected|arguments"
  exit 2
}

function Protect-Text {
  param([string]$Text)
  if ([string]::IsNullOrEmpty($Text)) { return "" }
  $Text = [regex]::Replace($Text, '(?i)(password|passphrase|secret|token)\s*[=:]\s*\S+', '$1=[redacted]')
  $Text = [regex]::Replace($Text, '(?i)postgres(?:ql)?://\S+', '[redacted-url]')
  return $Text
}

function Get-Tool {
  param([string]$Name)
  $path = Join-Path $BinDir ($Name + ".exe")
  if (-not (Test-Path -LiteralPath $path)) {
    Write-Output "rejected|tool-missing|$Name"
    exit 3
  }
  $version = & $path --version 2>&1 | Out-String
  if ($version -notmatch "PostgreSQL\)\s+17\.") {
    Write-Output "rejected|tool-version|$Name"
    exit 3
  }
  return @{ Path = $path; Version = ($version.Trim()) }
}

function Get-FreeBytes {
  param([string]$Directory)
  $root = [System.IO.Path]::GetPathRoot($Directory)
  if ([string]::IsNullOrWhiteSpace($root)) { return [int64]-1 }
  $drive = New-Object System.IO.DriveInfo ($root.Substring(0, 1))
  if (-not $drive.IsReady) { return [int64]-1 }
  return [int64]$drive.AvailableFreeSpace
}

function Test-DiskForBackup {
  param([string]$Directory, [int64]$RequiredBytes)
  $free = Get-FreeBytes $Directory
  return ($free -ge $RequiredBytes)
}

function Remove-Partial {
  param([string]$Path)
  if ([string]::IsNullOrWhiteSpace($Path)) { return }
  if (Test-Path -LiteralPath $Path) {
    $item = Get-Item -LiteralPath $Path
    if (-not $item.PSIsContainer -and $item.Length -gt 0) {
      $stream = [System.IO.File]::Open($Path, "Open", "Write")
      try {
        $buffer = New-Object byte[] 4096
        $remaining = $item.Length
        while ($remaining -gt 0) {
          $count = [Math]::Min($buffer.Length, $remaining)
          $stream.Write($buffer, 0, [int]$count)
          $remaining -= $count
        }
        $stream.Flush()
      } finally {
        $stream.Dispose()
      }
    }
    Remove-Item -LiteralPath $Path -Force
  }
}

function Test-ArchiveList {
  param([string]$PgRestore, [string]$Archive)
  $old = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $listing = & $PgRestore --list $Archive 2>&1 | Out-String
  $code = $LASTEXITCODE
  $ErrorActionPreference = $old
  return @{ Code = $code; Listing = (Protect-Text $listing) }
}

function Test-RecoveryCredentialPresent {
  # Presence + 32-byte blob only. Does not return or print the secret.
  if (-not ("TejasDumpCred" -as [type])) {
    Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class TejasDumpCred {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct NativeCredential {
    public int Flags;
    public int Type;
    public string TargetName;
    public string Comment;
    public long LastWritten;
    public int CredentialBlobSize;
    public IntPtr CredentialBlob;
    public int Persist;
    public int AttributeCount;
    public IntPtr Attributes;
    public string TargetAlias;
    public string UserName;
  }
  [DllImport("advapi32", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credential);
  [DllImport("advapi32")]
  public static extern void CredFree(IntPtr credential);
}
"@
  }
  $pointer = [IntPtr]::Zero
  $found = [TejasDumpCred]::CredRead($RecoveryTarget, 1, 0, [ref]$pointer)
  if (-not $found -or $pointer -eq [IntPtr]::Zero) { return $false }
  try {
    $native = [Runtime.InteropServices.Marshal]::PtrToStructure($pointer, [type][TejasDumpCred+NativeCredential])
    return ($native.CredentialBlobSize -eq 32)
  } finally {
    [TejasDumpCred]::CredFree($pointer)
  }
}

function Test-EncryptionGate {
  # TEJAS1 AES-256-GCM / PBKDF2-HMAC-SHA256 / 600000. Dump requires:
  # 1) Phase 36AV owner verification complete
  # 2) Recovery CM target present with 32-byte secret
  # 3) windows_seal.js available
  if (-not (Test-Path -LiteralPath $SealJs)) {
    return @{ Ready = $false; Reason = "seal-tool-missing" }
  }
  if (-not (Test-Path -LiteralPath $NodeExe)) {
    return @{ Ready = $false; Reason = "node-missing" }
  }
  if (-not (Test-Path -LiteralPath $AvStatusPath)) {
    return @{ Ready = $false; Reason = "key-recovery-unverified" }
  }
  $av = Get-Content -LiteralPath $AvStatusPath -Raw -ErrorAction SilentlyContinue
  if ($av -notmatch '(?m)^verification\|complete\s*$' -or $av -notmatch '(?m)^cross-copy\|PASS\s*$') {
    return @{ Ready = $false; Reason = "key-recovery-unverified" }
  }
  if (-not (Test-RecoveryCredentialPresent)) {
    return @{ Ready = $false; Reason = "recovery-credential-absent" }
  }
  return @{ Ready = $true; Reason = "key-recovery-verified-36av" }
}

function Read-RecoverySecretBytes {
  # Returns 32-byte R from CM. Caller must Clear. Never print.
  $script:RecoveryReads = $script:RecoveryReads + 1
  $pointer = [IntPtr]::Zero
  $found = [TejasDumpCred]::CredRead($RecoveryTarget, 1, 0, [ref]$pointer)
  if (-not $found -or $pointer -eq [IntPtr]::Zero) { return $null }
  try {
    $native = [Runtime.InteropServices.Marshal]::PtrToStructure($pointer, [type][TejasDumpCred+NativeCredential])
    if ($native.CredentialBlobSize -ne 32) { return $null }
    $bytes = New-Object byte[] 32
    [Runtime.InteropServices.Marshal]::Copy($native.CredentialBlob, $bytes, 0, 32)
    return ,$bytes
  } finally {
    [TejasDumpCred]::CredFree($pointer)
  }
}

function Clear-Bytes {
  param([byte[]]$Bytes)
  if ($null -ne $Bytes -and $Bytes.Length -gt 0) {
    [Array]::Clear($Bytes, 0, $Bytes.Length)
  }
}

function Test-DumpTarget {
  param([string]$HostName, [string]$UserName, [string]$DatabaseName)
  return ($HostName -eq $PoolerHost -and $UserName -eq $BackupUser -and $DatabaseName -eq $Database)
}

function Test-ClientTls {
  param([string]$ConninfoText)
  return ($ConninfoText -match '(?m)SSL connection \(protocol:')
}

function Get-GitRoot {
  param([string]$Start)
  $old = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $root = & git -C $Start rev-parse --show-toplevel 2>$null
  $code = $LASTEXITCODE
  $ErrorActionPreference = $old
  if ($code -ne 0 -or [string]::IsNullOrWhiteSpace($root)) { return $null }
  return ($root | Select-Object -First 1).Trim()
}

function Test-OutsideGit {
  param([string]$Directory)
  if ([string]::IsNullOrWhiteSpace($Directory)) { return $false }
  $full = [System.IO.Path]::GetFullPath($Directory)
  $root = Get-GitRoot (Split-Path -Parent $PSCommandPath)
  if ([string]::IsNullOrWhiteSpace($root)) { return $false }
  $rootFull = [System.IO.Path]::GetFullPath($root).TrimEnd('\')
  $fullTrim = $full.TrimEnd('\')
  if ($fullTrim.Equals($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) { return $false }
  $prefix = $rootFull + [System.IO.Path]::DirectorySeparatorChar
  return -not $fullTrim.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)
}

function Resolve-BackupCredential {
  param($Store, [string]$Target, [string]$ExpectedUser)
  if ($null -eq $Store -or -not $Store.Contains($Target)) { return $null }
  $entry = $Store[$Target]
  if ($entry.User -ne $ExpectedUser) { return $null }
  if ([string]::IsNullOrWhiteSpace($entry.Secret) -or $entry.Secret.Length -lt 24) { return $null }
  return $entry.Secret
}

function Read-ManagedCredential {
  $script:CredentialReads = $script:CredentialReads + 1
  if (-not ("TejasDumpCred" -as [type])) {
    Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class TejasDumpCred {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct NativeCredential {
    public int Flags;
    public int Type;
    public string TargetName;
    public string Comment;
    public long LastWritten;
    public int CredentialBlobSize;
    public IntPtr CredentialBlob;
    public int Persist;
    public int AttributeCount;
    public IntPtr Attributes;
    public string TargetAlias;
    public string UserName;
  }
  [DllImport("advapi32", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credential);
  [DllImport("advapi32")]
  public static extern void CredFree(IntPtr credential);
}
"@
  }
  $pointer = [IntPtr]::Zero
  $found = [TejasDumpCred]::CredRead($CredentialTarget, 1, 0, [ref]$pointer)
  if (-not $found -or $pointer -eq [IntPtr]::Zero) { return $null }
  try {
    $native = [Runtime.InteropServices.Marshal]::PtrToStructure($pointer, [type][TejasDumpCred+NativeCredential])
    if ($native.UserName -ne $BackupUser -or $native.CredentialBlobSize -lt 48) { return $null }
    return [Runtime.InteropServices.Marshal]::PtrToStringUni($native.CredentialBlob, [int]($native.CredentialBlobSize / 2))
  } finally {
    [TejasDumpCred]::CredFree($pointer)
  }
}

function New-PgPassFile {
  param([string]$HostName, [string]$Port, [string]$DatabaseName, [string]$UserName, [string]$Secret)
  $path = Join-Path $env:TEMP ("tejas-backup-pgpass-" + [guid]::NewGuid().ToString("n") + ".pgpass")
  $escaped = $Secret.Replace('\', '\\').Replace(':', '\:')
  [System.IO.File]::WriteAllText($path, "${HostName}:${Port}:${DatabaseName}:${UserName}:${escaped}`n")
  $account = whoami
  & icacls $path /inheritance:r /grant:r "${account}:(R,D)" | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Remove-Item -LiteralPath $path -Force -ErrorAction SilentlyContinue
    return $null
  }
  return $path
}

function Remove-PgPassFile {
  param([string]$Path)
  if ([string]::IsNullOrWhiteSpace($Path)) { return }
  if (Test-Path -LiteralPath $Path) {
    $account = whoami
    & icacls $Path /grant:r "${account}:(F)" | Out-Null
    Remove-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue
  }
}

function Protect-BackupDirectory {
  param([string]$Directory)
  if (-not (Test-OutsideGit $Directory)) { return $false }
  if (-not (Test-Path -LiteralPath $Directory)) { return $false }
  $account = whoami
  & icacls $Directory /inheritance:r /grant:r "${account}:(OI)(CI)(F)" | Out-Null
  if ($LASTEXITCODE -ne 0) { return $false }
  $acl = & icacls $Directory 2>&1 | Out-String
  if ($acl -match 'Everyone|Users:') { return $false }
  return $true
}

function Get-ArchiveSha256 {
  param([string]$Path)
  $item = Get-Item -LiteralPath $Path
  if ($item.Length -le 0) { return $null }
  return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function New-DumpArgumentList {
  param([string]$Archive)
  $dump = Join-Path $BinDir "pg_dump.exe"
  $argv = @(
    $dump, "--format=custom", "--compress=gzip:6", "--no-password",
    "-h", $PoolerHost, "-p", $PoolerPort, "-U", $BackupUser, "-d", $Database, "-f", $Archive
  )
  foreach ($flag in @("--clean", "--no-owner", "--no-acl")) {
    if ($argv -contains $flag) { return $null }
  }
  return $argv
}

function Write-PassFileBytes {
  param([byte[]]$Bytes)
  $path = Join-Path $env:TEMP ("tejas-seal-pass-" + [guid]::NewGuid().ToString("n") + ".bin")
  [System.IO.File]::WriteAllBytes($path, $Bytes)
  $account = whoami
  & icacls $path /inheritance:r /grant:r "${account}:(R,D)" | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Remove-Partial $path
    return $null
  }
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

function Test-Tejas1Magic {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) { return $false }
  $fs = [System.IO.File]::OpenRead($Path)
  try {
    $buf = New-Object byte[] 7
    $n = $fs.Read($buf, 0, 7)
    if ($n -ne 7) { return $false }
    $magic = [System.Text.Encoding]::ASCII.GetString($buf)
    return ($magic -eq "TEJAS1`n")
  } finally {
    $fs.Dispose()
  }
}

function Invoke-SealAuthenticatedVerify {
  param([string]$SealedPath, [string]$PassFile, [int64]$ExpectedPlainLength)
  # In-memory open only. Never writes plaintext to disk.
  # node argv: [0]=node [1]=this.js [2]=seal.js [3]=sealed [4]=pass [5]=expectedLen
  $verifyJs = @"
const seal = require(process.argv[2]);
const fs = require('fs');
const sealedPath = process.argv[3];
const passPath = process.argv[4];
const expected = Number(process.argv[5]);
let pass = Buffer.alloc(0);
let plain = Buffer.alloc(0);
try {
  pass = fs.readFileSync(passPath);
  const blob = fs.readFileSync(sealedPath);
  if (!blob.slice(0, 7).equals(Buffer.from('TEJAS1\n'))) process.exit(11);
  plain = seal.openSealed(blob, pass);
  if (plain.length !== expected) process.exit(12);
  if (plain.slice(0, 5).toString('utf8') !== 'PGDMP') process.exit(13);
  process.exit(0);
} catch (e) {
  process.exit(14);
} finally {
  if (pass.length) pass.fill(0);
  if (plain.length) plain.fill(0);
}
"@
  $jsPath = Join-Path $env:TEMP ("tejas-seal-verify-" + [guid]::NewGuid().ToString("n") + ".js")
  try {
    [System.IO.File]::WriteAllText($jsPath, $verifyJs)
    $old = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & $NodeExe $jsPath $SealJs $SealedPath $PassFile ([string]$ExpectedPlainLength) 2>&1 | Out-Null
    $code = $LASTEXITCODE
    $ErrorActionPreference = $old
    return ($code -eq 0)
  } finally {
    Remove-Item -LiteralPath $jsPath -Force -ErrorAction SilentlyContinue
  }
}

function Write-BackupManifest {
  param(
    [string]$ManifestPath,
    [hashtable]$Fields
  )
  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add("tejas-db-backup-manifest|v1")
  foreach ($key in ($Fields.Keys | Sort-Object)) {
    $lines.Add(($key + "|" + $Fields[$key]))
  }
  [System.IO.File]::WriteAllLines($ManifestPath, $lines)
}

function Invoke-GatedDump {
  $gate = Test-EncryptionGate
  if (-not $gate.Ready) {
    Write-Output "blocked|encryption"
    Write-Output ("encryption|" + $gate.Reason)
    Write-Output "real-dump|not-started"
    exit 4
  }
  Write-Output ("encryption|" + $gate.Reason)

  if (-not (Test-DiskForBackup $env:TEMP $MinimumFreeBytes)) {
    Write-Output "rejected|disk"
    exit 4
  }

  if (-not (Test-Path -LiteralPath $BackupRoot)) {
    New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
  }
  if (-not (Protect-BackupDirectory $BackupRoot)) {
    Write-Output "rejected|backup-root-acl"
    exit 4
  }

  $stamp = [DateTime]::UtcNow.ToString("yyyyMMddTHHmmssZ")
  $runDir = Join-Path $BackupRoot ("run-" + $stamp)
  New-Item -ItemType Directory -Path $runDir -Force | Out-Null
  if (-not (Protect-BackupDirectory $runDir)) {
    Write-Output "rejected|run-dir-acl"
    exit 4
  }

  $plainArchive = Join-Path $runDir ("tejas-db-" + $ProjectRef + "-" + $stamp + ".dump")
  $sealedArchive = Join-Path $runDir ("tejas-db-" + $ProjectRef + "-" + $stamp + ".dump.tejas1")
  $manifestPath = Join-Path $runDir ("tejas-db-" + $ProjectRef + "-" + $stamp + ".manifest.txt")
  $listPath = Join-Path $runDir ("tejas-db-" + $ProjectRef + "-" + $stamp + ".pg_restore-list.txt")

  $passFile = $null
  $pgpass = $null
  $secret = $null
  $recovery = $null
  $oldSsl = $env:PGSSLMODE
  $oldPass = $env:PGPASSFILE
  $oldTimeout = $env:PGCONNECT_TIMEOUT

  try {
    Write-Output "real-dump|starting"
    $secret = Read-ManagedCredential
    if ([string]::IsNullOrWhiteSpace($secret)) {
      Write-Output "rejected|backup-credential"
      exit 4
    }
    $script:BackupCredentialReads = $script:BackupCredentialReads + 1

    $pgpass = New-PgPassFile -HostName $PoolerHost -Port $PoolerPort -DatabaseName $Database -UserName $BackupUser -Secret $secret
    if ([string]::IsNullOrWhiteSpace($pgpass)) {
      Write-Output "rejected|pgpass"
      exit 4
    }

    $env:PGSSLMODE = "require"
    $env:PGPASSFILE = $pgpass
    $env:PGCONNECT_TIMEOUT = "30"

    $psql = Join-Path $BinDir "psql.exe"
    $identSql = "SELECT current_database() AS db, current_user AS usr, current_setting('server_version') AS ver;"
    $oldPref = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $ident = & $psql --no-password -h $PoolerHost -p $PoolerPort -U $BackupUser -d $Database -v ON_ERROR_STOP=1 -t -A -F "|" -c $identSql 2>&1 | Out-String
    $identCode = $LASTEXITCODE
    $conninfo = & $psql --no-password -h $PoolerHost -p $PoolerPort -U $BackupUser -d $Database -v ON_ERROR_STOP=1 -c "\conninfo" 2>&1 | Out-String
    $connCode = $LASTEXITCODE
    $ErrorActionPreference = $oldPref

    $identSafe = Protect-Text $ident.Trim()
    $connSafe = Protect-Text $conninfo
    Write-Output ("identity|" + ($identSafe -replace "`r|`n", " "))
    if ($identCode -ne 0 -or $connCode -ne 0) {
      Write-Output "rejected|identity-query"
      exit 4
    }
    if ($identSafe -notmatch [regex]::Escape($Database)) {
      Write-Output "rejected|database-identity"
      exit 4
    }
    if ($identSafe -notmatch [regex]::Escape("tejas_backup_dumper")) {
      Write-Output "rejected|role-identity"
      exit 4
    }
    if ($identSafe -notmatch [regex]::Escape($ExpectedServerVersion)) {
      Write-Output "rejected|server-version"
      exit 4
    }
    if (-not (Test-ClientTls $connSafe)) {
      Write-Output "rejected|tls"
      exit 4
    }
    Write-Output "tls|verified"
    Write-Output "role|tejas_backup_dumper|verified"

    $dump = Join-Path $BinDir "pg_dump.exe"
    $ErrorActionPreference = "Continue"
    & $dump --format=custom --compress=gzip:6 --no-password -h $PoolerHost -p $PoolerPort -U $BackupUser -d $Database -f $plainArchive 2>&1 | ForEach-Object { Protect-Text ("pg_dump|" + $_) }
    $dumpCode = $LASTEXITCODE
    $ErrorActionPreference = $oldPref
    if ($dumpCode -ne 0 -or -not (Test-Path -LiteralPath $plainArchive)) {
      Write-Output "rejected|pg_dump"
      Remove-Partial $plainArchive
      exit 4
    }
    Write-Output "pg_dump|ok"

    $listed = Test-ArchiveList -PgRestore (Join-Path $BinDir "pg_restore.exe") -Archive $plainArchive
    if ($listed.Code -ne 0) {
      Write-Output "rejected|archive-list"
      Remove-Partial $plainArchive
      exit 4
    }
    [System.IO.File]::WriteAllText($listPath, $listed.Listing)
    Write-Output "archive-list|ok"
    if ($listed.Listing -match '(?i)TABLE DATA') {
      Write-Output "archive-contents|table-data-present"
    } else {
      Write-Output "archive-contents|no-table-data-warning"
    }

    $plainLen = (Get-Item -LiteralPath $plainArchive).Length
    $plainSha = Get-ArchiveSha256 $plainArchive
    Write-Output ("plaintext-bytes|" + $plainLen)
    Write-Output ("plaintext-sha256|" + $plainSha)

    $recovery = Read-RecoverySecretBytes
    if ($null -eq $recovery -or $recovery.Length -ne 32) {
      Write-Output "rejected|recovery-secret"
      Remove-Partial $plainArchive
      exit 4
    }
    $passFile = Write-PassFileBytes -Bytes $recovery
    if ([string]::IsNullOrWhiteSpace($passFile)) {
      Write-Output "rejected|pass-file"
      Remove-Partial $plainArchive
      exit 4
    }

    $ErrorActionPreference = "Continue"
    & $NodeExe $SealJs seal --in $plainArchive --out $sealedArchive --pass-file $passFile --wipe-plaintext 2>&1 | ForEach-Object { Protect-Text ("seal|" + $_) }
    $sealCode = $LASTEXITCODE
    $ErrorActionPreference = $oldPref
    if ($sealCode -ne 0 -or -not (Test-Path -LiteralPath $sealedArchive)) {
      Write-Output "rejected|seal"
      Remove-Partial $plainArchive
      Remove-Partial $sealedArchive
      exit 4
    }
    Write-Output "seal|ok"

    if (Test-Path -LiteralPath $plainArchive) {
      Write-Output "rejected|plaintext-remains"
      exit 4
    }
    Write-Output "plaintext-cleanup|verified"

    if (-not (Test-Tejas1Magic $sealedArchive)) {
      Write-Output "rejected|tejas1-magic"
      exit 4
    }
    Write-Output "tejas1-magic|ok"

    if (-not (Invoke-SealAuthenticatedVerify -SealedPath $sealedArchive -PassFile $passFile -ExpectedPlainLength $plainLen)) {
      Write-Output "rejected|seal-auth-verify"
      exit 4
    }
    Write-Output "seal-auth-verify|ok"

    $sealedSha = Get-ArchiveSha256 $sealedArchive
    $sealedLen = (Get-Item -LiteralPath $sealedArchive).Length
    Write-Output ("sealed-bytes|" + $sealedLen)
    Write-Output ("sealed-sha256|" + $sealedSha)

    $fields = @{
      "utc" = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
      "project-ref" = $ProjectRef
      "database" = $Database
      "backup-role" = "tejas_backup_dumper"
      "server-version-expected" = $ExpectedServerVersion
      "pooler-host" = $PoolerHost
      "archive-format" = "postgresql-custom+tejas1-aes-256-gcm"
      "plaintext-bytes" = $plainLen
      "plaintext-sha256" = $plainSha
      "sealed-bytes" = $sealedLen
      "sealed-sha256" = $sealedSha
      "sealed-path" = $sealedArchive
      "list-path" = $listPath
      "encryption-gate" = $gate.Reason
      "plaintext-retained" = "false"
      "phase" = "37"
    }
    Write-BackupManifest -ManifestPath $manifestPath -Fields $fields
    Write-Output ("manifest|" + $manifestPath)
    Write-Output ("sealed|" + $sealedArchive)
    Write-Output "real-dump|complete"
    exit 0
  } finally {
    Remove-PassFile $passFile
    Remove-PgPassFile $pgpass
    Clear-Bytes $recovery
    if (-not [string]::IsNullOrWhiteSpace($secret)) {
      # SecureString not used; overwrite best-effort then drop reference
      $secret = $null
    }
    if ($null -ne $oldSsl) { $env:PGSSLMODE = $oldSsl } else { Remove-Item Env:\PGSSLMODE -ErrorAction SilentlyContinue }
    if ($null -ne $oldPass) { $env:PGPASSFILE = $oldPass } else { Remove-Item Env:\PGPASSFILE -ErrorAction SilentlyContinue }
    if ($null -ne $oldTimeout) { $env:PGCONNECT_TIMEOUT = $oldTimeout } else { Remove-Item Env:\PGCONNECT_TIMEOUT -ErrorAction SilentlyContinue }
    if (Test-Path -LiteralPath $plainArchive) {
      Write-Output "warning|plaintext-still-present"
      # Do not auto-delete if seal failed mid-way without confirmation of sealed copy;
      # caller already attempted Remove-Partial on failure paths.
    }
  }
}

$dumpTool = Get-Tool "pg_dump"
$restoreTool = Get-Tool "pg_restore"
$psqlTool = Get-Tool "psql"
$free = Get-FreeBytes $env:TEMP
$gateStatus = Test-EncryptionGate
Write-Output ("utc|" + [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"))
Write-Output ("tool|pg_dump|" + $dumpTool.Version)
Write-Output ("tool|pg_restore|" + $restoreTool.Version)
Write-Output ("tool|psql|" + $psqlTool.Version)
Write-Output ("disk-free-bytes|" + $free)
Write-Output ("encryption|" + $gateStatus.Reason)
Write-Output ("encryption-ready|" + ($(if ($gateStatus.Ready) { "true" } else { "false" })))

if ($Mode -eq "Dump") {
  Invoke-GatedDump
}

if ($Mode -eq "Prepare") {
  if (-not (Test-DiskForBackup $env:TEMP $MinimumFreeBytes)) {
    Write-Output "rejected|disk"
    exit 4
  }
  if ($gateStatus.Ready) {
    Write-Output "real-dump|gate-open"
  } else {
    Write-Output "real-dump|blocked"
  }
  Write-Output "prepare|ok"
  exit 0
}

function Assert-Step {
  param([bool]$Condition, [string]$Name)
  if (-not $Condition) {
    Write-Output ("rejected|" + $Name)
    exit 5
  }
  Write-Output ("checked|" + $Name)
}

$work = Join-Path $env:TEMP ("tejas-win-backup-" + [guid]::NewGuid().ToString("n"))
$partial = Join-Path $work "partial.dump"
$success = Join-Path $work "SUCCESS"
$syntheticSecret = "synthetic-local-only-value"
$passFile = $null
$archive = $null
$localDb = "tejas_p34b_syn_20261122"
try {
  New-Item -ItemType Directory -Path $work | Out-Null
  [System.IO.File]::WriteAllText($partial, "not-a-postgres-archive")
  $listed = Test-ArchiveList -PgRestore $restoreTool.Path -Archive $partial
  Assert-Step ($listed.Code -ne 0) "invalid-archive"
  Remove-Partial $partial
  Assert-Step (-not (Test-Path -LiteralPath $partial)) "partial-removed"
  Assert-Step (-not (Test-Path -LiteralPath $success)) "no-false-success"
  $sample = Protect-Text "password=should-not-appear postgresql://user:hidden@host/db"
  Assert-Step ($sample -notmatch "should-not-appear|hidden@") "redaction"

  $mock = @{
    $CredentialTarget = @{ User = "other-user"; Secret = $syntheticSecret }
  }
  Assert-Step ($null -eq (Resolve-BackupCredential $mock $CredentialTarget $BackupUser)) "credential-wrong-user"
  $mock[$CredentialTarget].User = $BackupUser
  $mock[$CredentialTarget].Secret = "short-secret"
  Assert-Step ($null -eq (Resolve-BackupCredential $mock $CredentialTarget $BackupUser)) "credential-short"
  $mock[$CredentialTarget].Secret = $syntheticSecret
  $resolved = Resolve-BackupCredential $mock $CredentialTarget $BackupUser
  Assert-Step ($resolved.Length -ge 24) "credential-mock"
  Assert-Step ($script:CredentialReads -eq 0) "credential-store-not-read"

  Assert-Step (-not (Test-DumpTarget "bad-host.example" $BackupUser $Database)) "target-wrong-host"
  Assert-Step (-not (Test-DumpTarget $PoolerHost "postgres.$ProjectRef" $Database)) "target-wrong-user"
  Assert-Step (-not (Test-DumpTarget $PoolerHost $BackupUser "otherdb")) "target-wrong-database"
  Assert-Step (Test-DumpTarget $PoolerHost $BackupUser $Database) "target-accepted"
  Assert-Step (-not (Test-ClientTls "You are connected to database postgres.")) "tls-missing"
  Assert-Step (Test-ClientTls "SSL connection (protocol: TLSv1.3, cipher: test, compression: off)") "tls-present"

  $repoRoot = Get-GitRoot (Split-Path -Parent $PSCommandPath)
  Assert-Step (-not [string]::IsNullOrWhiteSpace($repoRoot)) "git-root"
  Assert-Step (-not (Test-OutsideGit $repoRoot)) "git-boundary-rejects-repo"
  Assert-Step (-not (Test-OutsideGit (Join-Path $repoRoot "preview-sql"))) "git-boundary-rejects-child"
  Assert-Step (Test-OutsideGit $work) "git-boundary-accepts-temp"
  Assert-Step (Protect-BackupDirectory $work) "output-acl"
  Assert-Step (Test-DiskForBackup $work $MinimumFreeBytes) "disk-sufficient"
  Assert-Step (-not (Test-DiskForBackup $work (($free) + 1))) "disk-insufficient"

  $passFile = New-PgPassFile -HostName "synthetic.example" -Port "5432" -DatabaseName "postgres" -UserName "synthetic" -Secret $syntheticSecret
  Assert-Step (-not [string]::IsNullOrWhiteSpace($passFile)) "pgpass-created"
  Assert-Step (Test-Path -LiteralPath $passFile) "pgpass-present"
  Remove-PgPassFile $passFile
  $passFile = $null
  $left = @(Get-ChildItem -LiteralPath $env:TEMP -Filter "tejas-backup-pgpass-*.pgpass" -ErrorAction SilentlyContinue)
  Assert-Step ($left.Count -eq 0) "pgpass-removed"

  $argv = New-DumpArgumentList -Archive (Join-Path $work "planned.dump")
  Assert-Step ($null -ne $argv) "dump-args"
  Assert-Step (($argv -join " ") -match "--format=custom --compress=gzip:6 --no-password") "dump-format"
  Assert-Step (($argv -join " ") -notmatch "--clean|--no-owner|--no-acl") "dump-flags"

  $createdb = Join-Path $BinDir "createdb.exe"
  $dropdb = Join-Path $BinDir "dropdb.exe"
  $localArgs = @("--no-password", "-h", "127.0.0.1", "-p", "55432", "-U", "postgres")
  $oldSsl = $env:PGSSLMODE
  $env:PGSSLMODE = "disable"
  $env:PGCONNECT_TIMEOUT = "5"
  & $dropdb @localArgs --if-exists $localDb | Out-Null
  & $createdb @localArgs $localDb
  Assert-Step ($LASTEXITCODE -eq 0) "synthetic-db"
  $sql = "CREATE TABLE public.phase34b_probe (id integer PRIMARY KEY, label text); INSERT INTO public.phase34b_probe VALUES (1, 'synthetic-row');"
  & $psqlTool.Path @localArgs -d $localDb -v ON_ERROR_STOP=1 -c $sql | Out-Null
  Assert-Step ($LASTEXITCODE -eq 0) "synthetic-table"
  $archive = Join-Path $work "synthetic.dump"
  & $dumpTool.Path --format=custom --compress=gzip:6 --no-password -h 127.0.0.1 -p 55432 -U postgres -d $localDb -f $archive
  Assert-Step ($LASTEXITCODE -eq 0) "synthetic-dump"
  $localList = Test-ArchiveList -PgRestore $restoreTool.Path -Archive $archive
  Assert-Step ($localList.Code -eq 0) "synthetic-list"
  Assert-Step ($localList.Listing -match "phase34b_probe") "synthetic-contents"
  $hash = Get-ArchiveSha256 $archive
  Assert-Step (-not [string]::IsNullOrWhiteSpace($hash) -and $hash.Length -eq 64) "synthetic-sha256"
  Write-Output ("synthetic-sha256|" + $hash)

  # Synthetic TEJAS1 seal + wipe (local archive only; not production R).
  $synPass = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($synPass)
  $synPassFile = Write-PassFileBytes -Bytes $synPass
  Assert-Step (-not [string]::IsNullOrWhiteSpace($synPassFile)) "synthetic-pass-file"
  $synSealed = Join-Path $work "synthetic.dump.tejas1"
  $synPlainLen = (Get-Item -LiteralPath $archive).Length
  $ErrorActionPreference = "Continue"
  & $NodeExe $SealJs seal --in $archive --out $synSealed --pass-file $synPassFile --wipe-plaintext 2>&1 | Out-Null
  $synSealCode = $LASTEXITCODE
  $ErrorActionPreference = "Stop"
  Assert-Step ($synSealCode -eq 0) "synthetic-seal"
  Assert-Step (-not (Test-Path -LiteralPath $archive)) "synthetic-plaintext-wiped"
  Assert-Step (Test-Tejas1Magic $synSealed) "synthetic-tejas1-magic"
  Assert-Step (Invoke-SealAuthenticatedVerify -SealedPath $synSealed -PassFile $synPassFile -ExpectedPlainLength $synPlainLen) "synthetic-seal-auth"
  Remove-PassFile $synPassFile
  Clear-Bytes $synPass
  Remove-Partial $synSealed
  $archive = $null

  & $dropdb @localArgs --if-exists $localDb | Out-Null
  Assert-Step ($LASTEXITCODE -eq 0) "synthetic-dropped"
  if ($null -ne $oldSsl) { $env:PGSSLMODE = $oldSsl } else { Remove-Item Env:\PGSSLMODE -ErrorAction SilentlyContinue }

  $gate = Test-EncryptionGate
  Assert-Step ($gate.Ready) "encryption-ready"
  Assert-Step ($gate.Reason -eq "key-recovery-verified-36av") "encryption-reason"
  # SelfTest must not start a production dump.
  Assert-Step ($Mode -eq "SelfTest") "selftest-mode-no-prod-dump"
  Write-Output "self-test|ok"
  exit 0
} finally {
  Remove-PgPassFile $passFile
  if (-not [string]::IsNullOrWhiteSpace($archive)) { Remove-Partial $archive }
  $dropdb = Join-Path $BinDir "dropdb.exe"
  if (Test-Path -LiteralPath $dropdb) {
    $oldPref = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $oldSsl = $env:PGSSLMODE
    $env:PGSSLMODE = "disable"
    & $dropdb --no-password -h 127.0.0.1 -p 55432 -U postgres --if-exists $localDb | Out-Null
    if ($null -ne $oldSsl) { $env:PGSSLMODE = $oldSsl } else { Remove-Item Env:\PGSSLMODE -ErrorAction SilentlyContinue }
    $ErrorActionPreference = $oldPref
  }
  if (Test-Path -LiteralPath $work) {
    Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
  }
}
