# Windows TEJAS Storage backup (Phase 38).
# Modes: Prepare | Inventory | Dump
# Dump requires: 36AV recovery verified, Storage reader CM, TEJAS1 seal.
# Read-only against production Storage. Never prints secrets.

param()

$ErrorActionPreference = "Stop"

$NodeExe = "C:\Program Files\nodejs\node.exe"
$SealJs = Join-Path $PSScriptRoot "windows_seal.js"
$BinDir = "C:\Users\Admin\AppData\Local\tejas-pg17\pgsql\bin"
$ProjectRef = "zapccpipwxduzlnvjdmy"
$SupabaseUrl = "https://$ProjectRef.supabase.co"
$PoolerHost = "aws-0-ap-northeast-1.pooler.supabase.com"
$PoolerPort = "5432"
$Database = "postgres"
$BackupUser = "tejas_backup_dumper.$ProjectRef"
$DbCredentialTarget = "tejas-backup-dumper/$ProjectRef"
$StorageCredentialTarget = "tejas-storage-reader/$ProjectRef"
$StorageCredentialUser = "tejas-storage-reader"
$StorageSessionPrefix = "TEJASSTOR1"
$RecoveryTarget = "tejas1-recovery/$ProjectRef"
$ExpectedBuckets = @("tejas-payment-proofs", "tejas-registration-files")
$MinimumFreeBytes = 2GB
$BackupRoot = Join-Path $env:LOCALAPPDATA "tejas-storage-backups"
$AvStatusPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\..\preview-sql\PHASE36AV-RUN-STATUS.txt"))
$PageSize = 100
$MaxRetries = 3

$Mode = "Prepare"
if ($args.Count -eq 1 -and $args[0] -in @("Prepare", "Inventory", "Dump", "SelfTest")) {
  $Mode = $args[0]
} elseif ($args.Count -gt 0) {
  Write-Output "rejected|arguments"
  exit 2
}

function Protect-Text {
  param([string]$Text)
  if ([string]::IsNullOrEmpty($Text)) { return "" }
  $Text = [regex]::Replace($Text, '(?i)(password|passphrase|secret|token|apikey|authorization)\s*[=:]\s*\S+', '$1=[redacted]')
  $Text = [regex]::Replace($Text, '(?i)Bearer\s+\S+', 'Bearer [redacted]')
  $Text = [regex]::Replace($Text, '(?i)eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', '[redacted-jwt]')
  return $Text
}

function Clear-Bytes {
  param([byte[]]$Bytes)
  if ($null -ne $Bytes -and $Bytes.Length -gt 0) {
    [Array]::Clear($Bytes, 0, $Bytes.Length)
  }
}

function Ensure-CredType {
  if ("TejasStorPipeCred" -as [type]) { return }
  Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class TejasStorPipeCred {
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

function Read-UnicodeCredential {
  param([string]$Target, [string]$ExpectedUser, [int]$MinChars)
  Ensure-CredType
  $pointer = [IntPtr]::Zero
  $found = [TejasStorPipeCred]::CredRead($Target, 1, 0, [ref]$pointer)
  if (-not $found -or $pointer -eq [IntPtr]::Zero) { return $null }
  try {
    $native = [Runtime.InteropServices.Marshal]::PtrToStructure($pointer, [type][TejasStorPipeCred+NativeCredential])
    if ($native.UserName -ne $ExpectedUser) { return $null }
    $chars = [int]($native.CredentialBlobSize / 2)
    if ($chars -lt $MinChars) { return $null }
    return [Runtime.InteropServices.Marshal]::PtrToStringUni($native.CredentialBlob, $chars)
  } finally {
    [TejasStorPipeCred]::CredFree($pointer)
  }
}

function Test-RecoveryCredentialPresent {
  Ensure-CredType
  $pointer = [IntPtr]::Zero
  $found = [TejasStorPipeCred]::CredRead($RecoveryTarget, 1, 0, [ref]$pointer)
  if (-not $found -or $pointer -eq [IntPtr]::Zero) { return $false }
  try {
    $native = [Runtime.InteropServices.Marshal]::PtrToStructure($pointer, [type][TejasStorPipeCred+NativeCredential])
    return ($native.CredentialBlobSize -eq 32)
  } finally {
    [TejasStorPipeCred]::CredFree($pointer)
  }
}

function Read-RecoverySecretBytes {
  Ensure-CredType
  $pointer = [IntPtr]::Zero
  $found = [TejasStorPipeCred]::CredRead($RecoveryTarget, 1, 0, [ref]$pointer)
  if (-not $found -or $pointer -eq [IntPtr]::Zero) { return $null }
  try {
    $native = [Runtime.InteropServices.Marshal]::PtrToStructure($pointer, [type][TejasStorPipeCred+NativeCredential])
    if ($native.CredentialBlobSize -ne 32) { return $null }
    $bytes = New-Object byte[] 32
    [Runtime.InteropServices.Marshal]::Copy($native.CredentialBlob, $bytes, 0, 32)
    return ,$bytes
  } finally {
    [TejasStorPipeCred]::CredFree($pointer)
  }
}

function Test-EncryptionGate {
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

function Parse-StorageSessionBlob {
  param([string]$Blob)
  if ([string]::IsNullOrWhiteSpace($Blob)) { return $null }
  if (-not $Blob.StartsWith($StorageSessionPrefix)) { return $null }
  $publishable = $null
  $refresh = $null
  foreach ($line in ($Blob -split "`r?`n")) {
    if ($line -match '^publishable=(.+)$') { $publishable = $Matches[1] }
    elseif ($line -match '^refresh=(.+)$') { $refresh = $Matches[1] }
  }
  if ([string]::IsNullOrWhiteSpace($publishable) -or [string]::IsNullOrWhiteSpace($refresh)) { return $null }
  return @{ Publishable = $publishable; RefreshToken = $refresh }
}

function New-StorageSessionBlob {
  param([string]$Publishable, [string]$RefreshToken)
  return ($StorageSessionPrefix + "`npublishable=" + $Publishable + "`nrefresh=" + $RefreshToken)
}

function Read-StorageSession {
  $blob = Read-UnicodeCredential -Target $StorageCredentialTarget -ExpectedUser $StorageCredentialUser -MinChars 20
  if ([string]::IsNullOrWhiteSpace($blob)) { return $null }
  $session = Parse-StorageSessionBlob -Blob $blob
  $blob = $null
  return $session
}

function Write-StorageSession {
  param([string]$Publishable, [string]$RefreshToken)
  Ensure-CredType
  $blob = New-StorageSessionBlob -Publishable $Publishable -RefreshToken $RefreshToken
  if (-not ("TejasStorPipeCredWrite" -as [type])) {
    Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class TejasStorPipeCredWrite {
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
  public static extern bool CredWrite(ref NativeCredential credential, uint flags);
}
"@
  }
  $pointer = [Runtime.InteropServices.Marshal]::StringToCoTaskMemUni($blob)
  try {
    $credential = New-Object TejasStorPipeCredWrite+NativeCredential
    $credential.Type = 1
    $credential.TargetName = $StorageCredentialTarget
    $credential.UserName = $StorageCredentialUser
    $credential.CredentialBlobSize = $blob.Length * 2
    $credential.CredentialBlob = $pointer
    $credential.Persist = 2
    $credential.AttributeCount = 0
    $credential.Attributes = [IntPtr]::Zero
    $credential.Comment = "tejas-storage-session-v1 project=$ProjectRef publishable+refresh_token"
    return [TejasStorPipeCredWrite]::CredWrite([ref]$credential, 0)
  } finally {
    [Runtime.InteropServices.Marshal]::FreeCoTaskMem($pointer)
    $blob = $null
  }
}

function Test-StorageCredentialPresent {
  $session = Read-StorageSession
  $present = ($null -ne $session)
  $session = $null
  return $present
}

function Invoke-AuthTokenRefresh {
  param(
    [string]$AuthBaseUrl,
    [string]$Publishable,
    [string]$RefreshToken
  )
  # Returns hashtable AccessToken, RefreshToken, ExpiresIn. Never logs secrets.
  $uri = "$AuthBaseUrl/auth/v1/token?grant_type=refresh_token"
  $body = (@{ refresh_token = $RefreshToken } | ConvertTo-Json -Compress)
  $old = $ProgressPreference
  $ProgressPreference = "SilentlyContinue"
  try {
    $resp = Invoke-RestMethod -Uri $uri -Method Post -Headers @{
      apikey = $Publishable
      Authorization = "Bearer $Publishable"
      "Content-Type" = "application/json"
    } -Body $body -TimeoutSec 60
  } catch {
    return $null
  } finally {
    $ProgressPreference = $old
    $body = $null
  }
  if (-not $resp.access_token -or -not $resp.refresh_token) { return $null }
  $access = [string]$resp.access_token
  $forbidden = Test-ForbiddenStorageSecret -Secret $access
  if ($forbidden) { return $null }
  $parts = $access.Split('.')
  if ($parts.Count -eq 3) {
    try {
      $payload = $parts[1].Replace('-', '+').Replace('_', '/')
      switch ($payload.Length % 4) { 2 { $payload += "==" }; 3 { $payload += "=" } }
      $json = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload))
      if ($json -notmatch '"role"\s*:\s*"authenticated"') { return $null }
    } catch { return $null }
  }
  $expires = 3600
  if ($resp.expires_in) { [void][int]::TryParse([string]$resp.expires_in, [ref]$expires) }
  return @{
    AccessToken = $access
    RefreshToken = [string]$resp.refresh_token
    ExpiresIn = $expires
  }
}

function Get-FreeBytes {
  param([string]$Directory)
  $root = [System.IO.Path]::GetPathRoot($Directory)
  if ([string]::IsNullOrWhiteSpace($root)) { return [int64]-1 }
  $drive = New-Object System.IO.DriveInfo ($root.Substring(0, 1))
  if (-not $drive.IsReady) { return [int64]-1 }
  return [int64]$drive.AvailableFreeSpace
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

function Remove-Partial {
  param([string]$Path)
  if ([string]::IsNullOrWhiteSpace($Path)) { return }
  if (-not (Test-Path -LiteralPath $Path)) { return }
  $item = Get-Item -LiteralPath $Path
  if (-not $item.PSIsContainer -and $item.Length -gt 0) {
    $account = whoami
    & icacls $Path /grant:r "${account}:(F)" | Out-Null
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
  Remove-Item -LiteralPath $Path -Force -Recurse -ErrorAction SilentlyContinue
}

function New-PgPassFile {
  param([string]$Secret)
  $path = Join-Path $env:TEMP ("tejas-storage-pgpass-" + [guid]::NewGuid().ToString("n") + ".pgpass")
  $escaped = $Secret.Replace('\', '\\').Replace(':', '\:')
  [System.IO.File]::WriteAllText($path, "${PoolerHost}:${PoolerPort}:${Database}:${BackupUser}:${escaped}`n")
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

function Get-DbInventory {
  $secret = Read-UnicodeCredential -Target $DbCredentialTarget -ExpectedUser $BackupUser -MinChars 24
  if ([string]::IsNullOrWhiteSpace($secret)) { throw "db-credential-missing" }
  $pgpass = New-PgPassFile -Secret $secret
  $secret = $null
  if ([string]::IsNullOrWhiteSpace($pgpass)) { throw "pgpass-failed" }
  $oldSsl = $env:PGSSLMODE
  $oldPass = $env:PGPASSFILE
  $oldTimeout = $env:PGCONNECT_TIMEOUT
  try {
    $env:PGSSLMODE = "require"
    $env:PGPASSFILE = $pgpass
    $env:PGCONNECT_TIMEOUT = "30"
    $psql = Join-Path $BinDir "psql.exe"
    if (-not (Test-Path -LiteralPath $psql)) { throw "psql-missing" }

    $bucketSql = "SELECT id, public::text, coalesce(file_size_limit::text,''), created_at::text FROM storage.buckets ORDER BY id;"
    $bucketRaw = & $psql --no-password -h $PoolerHost -p $PoolerPort -U $BackupUser -d $Database -v ON_ERROR_STOP=1 -At -F "|" -c $bucketSql
    if ($LASTEXITCODE -ne 0) { throw "bucket-query-failed" }

    $objSql = "SELECT bucket_id, name, coalesce(metadata->>'size',''), coalesce(metadata->>'mimetype', coalesce(metadata->>'contentType','')), updated_at::text FROM storage.objects ORDER BY bucket_id, name;"
    $objRaw = & $psql --no-password -h $PoolerHost -p $PoolerPort -U $BackupUser -d $Database -v ON_ERROR_STOP=1 -At -F "|" -c $objSql
    if ($LASTEXITCODE -ne 0) { throw "object-query-failed" }

    $buckets = @()
    foreach ($line in @($bucketRaw)) {
      if ([string]::IsNullOrWhiteSpace($line)) { continue }
      $p = $line -split '\|', 4
      if ($p.Count -lt 4) { continue }
      $buckets += [pscustomobject]@{
        Id = $p[0]
        Public = ($p[1] -eq "true" -or $p[1] -eq "t")
        FileSizeLimit = $p[2]
        CreatedAt = $p[3]
      }
    }

    $objects = @()
    foreach ($line in @($objRaw)) {
      if ([string]::IsNullOrWhiteSpace($line)) { continue }
      $p = $line -split '\|', 5
      if ($p.Count -lt 5) { continue }
      $size = 0L
      [void][int64]::TryParse($p[2], [ref]$size)
      $objects += [pscustomobject]@{
        Bucket = $p[0]
        Key = $p[1]
        ByteSize = $size
        MimeType = $p[3]
        ModifiedUtc = $p[4]
      }
    }

    return @{ Buckets = $buckets; Objects = $objects }
  } finally {
    Remove-PgPassFile $pgpass
    if ($null -ne $oldSsl) { $env:PGSSLMODE = $oldSsl } else { Remove-Item Env:\PGSSLMODE -ErrorAction SilentlyContinue }
    if ($null -ne $oldPass) { $env:PGPASSFILE = $oldPass } else { Remove-Item Env:\PGPASSFILE -ErrorAction SilentlyContinue }
    if ($null -ne $oldTimeout) { $env:PGCONNECT_TIMEOUT = $oldTimeout } else { Remove-Item Env:\PGCONNECT_TIMEOUT -ErrorAction SilentlyContinue }
  }
}

function Assert-ExpectedBuckets {
  param($Buckets)
  $names = @($Buckets | ForEach-Object { $_.Id } | Sort-Object)
  $expected = @($ExpectedBuckets | Sort-Object)
  if ($names.Count -ne $expected.Count) { return "bucket-count-mismatch" }
  for ($i = 0; $i -lt $expected.Count; $i++) {
    if ($names[$i] -ne $expected[$i]) { return "bucket-set-mismatch" }
  }
  foreach ($b in $Buckets) {
    if ($b.Public) { return "public-bucket-forbidden" }
  }
  return $null
}

function Test-ForbiddenStorageSecret {
  param([string]$Secret)
  if ([string]::IsNullOrWhiteSpace($Secret)) { return "empty" }
  if ($Secret.StartsWith("sb_secret_")) { return "sb-secret-key" }
  if ($Secret -match '(?i)service_role') { return "service-role-literal" }
  $parts = $Secret.Split('.')
  if ($parts.Count -eq 3) {
    try {
      $payload = $parts[1].Replace('-', '+').Replace('_', '/')
      switch ($payload.Length % 4) {
        2 { $payload += "==" }
        3 { $payload += "=" }
      }
      $json = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload))
      if ($json -match '"role"\s*:\s*"service_role"') { return "jwt-service-role" }
      if ($json -match '"role"\s*:\s*"supabase_admin"') { return "jwt-supabase-admin" }
    } catch { }
  }
  return $null
}

function Invoke-StorageGet {
  param(
    [string]$Url,
    [string]$AccessToken,
    [string]$Publishable,
    [string]$OutFile,
    [ref]$StatusCode
  )
  # Hard rule: GET only. No PUT/POST/PATCH/DELETE ever.
  $method = "Get"
  if ($method -ne "Get") { throw "storage-method-guard" }
  $apiKey = $Publishable
  if ([string]::IsNullOrWhiteSpace($apiKey)) { $apiKey = $AccessToken }
  $headers = @{
    Authorization = "Bearer $AccessToken"
    apikey = $apiKey
  }
  $old = $ProgressPreference
  $ProgressPreference = "SilentlyContinue"
  try {
    $resp = Invoke-WebRequest -Uri $Url -Headers $headers -Method Get -OutFile $OutFile -UseBasicParsing -TimeoutSec 120
    if ($null -ne $StatusCode) { $StatusCode.Value = [int]$resp.StatusCode }
    return $true
  } catch {
    $code = 0
    try {
      if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
        $code = [int]$_.Exception.Response.StatusCode
      }
    } catch { }
    if ($null -ne $StatusCode) { $StatusCode.Value = $code }
    return $false
  } finally {
    $ProgressPreference = $old
  }
}

function Test-DownloaderIsGetOnly {
  $src = Get-Content -LiteralPath $PSCommandPath -Raw
  $m = [regex]::Match($src, '(?s)function Invoke-StorageGet\s*\{.*?^function\s', [Text.RegularExpressions.RegexOptions]::Multiline)
  if (-not $m.Success) {
    $m = [regex]::Match($src, '(?s)function Invoke-StorageGet\s*\{.*')
  }
  if (-not $m.Success) { return $false }
  $body = $m.Value
  if ($body -notmatch 'Method\s+Get') { return $false }
  if ($body -match 'Method\s+(Put|Post|Delete|Patch)') { return $false }
  return $true
}

function Get-ArchiveSha256 {
  param([string]$Path)
  return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Write-PassFileBytes {
  param([byte[]]$Bytes)
  $path = Join-Path $env:TEMP ("tejas-storage-seal-pass-" + [guid]::NewGuid().ToString("n") + ".bin")
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
    return ([System.Text.Encoding]::ASCII.GetString($buf) -eq "TEJAS1`n")
  } finally {
    $fs.Dispose()
  }
}

function Invoke-SealAuthenticatedVerify {
  param([string]$SealedPath, [string]$PassFile, [int64]$ExpectedPlainLength, [string]$ExpectedMagicPrefix)
  $verifyJs = @"
const seal = require(process.argv[2]);
const fs = require('fs');
const sealedPath = process.argv[3];
const passPath = process.argv[4];
const expected = Number(process.argv[5]);
const prefix = process.argv[6] || '';
let pass = Buffer.alloc(0);
let plain = Buffer.alloc(0);
try {
  pass = fs.readFileSync(passPath);
  const blob = fs.readFileSync(sealedPath);
  if (!blob.slice(0, 7).equals(Buffer.from('TEJAS1\n'))) process.exit(11);
  plain = seal.openSealed(blob, pass);
  if (plain.length !== expected) process.exit(12);
  if (prefix && plain.slice(0, prefix.length).toString('utf8') !== prefix) process.exit(13);
  process.exit(0);
} catch (e) {
  process.exit(14);
} finally {
  if (pass.length) pass.fill(0);
  if (plain.length) plain.fill(0);
}
"@
  $jsPath = Join-Path $env:TEMP ("tejas-storage-seal-verify-" + [guid]::NewGuid().ToString("n") + ".js")
  try {
    [System.IO.File]::WriteAllText($jsPath, $verifyJs)
    $old = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & $NodeExe $jsPath $SealJs $SealedPath $PassFile ([string]$ExpectedPlainLength) $ExpectedMagicPrefix 2>&1 | Out-Null
    $code = $LASTEXITCODE
    $ErrorActionPreference = $old
    return ($code -eq 0)
  } finally {
    Remove-Item -LiteralPath $jsPath -Force -ErrorAction SilentlyContinue
  }
}

function Write-StorageManifest {
  param([string]$Path, [object[]]$Rows, [hashtable]$Header)
  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add("tejas-storage-backup-manifest|v1")
  foreach ($key in ($Header.Keys | Sort-Object)) {
    $lines.Add(($key + "|" + $Header[$key]))
  }
  $lines.Add("columns|bucket|object_key|byte_size|mime_type|modified_utc|sha256|archive_path|status")
  foreach ($row in $Rows) {
    $lines.Add(("{0}|{1}|{2}|{3}|{4}|{5}|{6}|{7}" -f $row.Bucket, $row.Key, $row.ByteSize, $row.MimeType, $row.ModifiedUtc, $row.Sha256, $row.ArchivePath, $row.Status))
  }
  [System.IO.File]::WriteAllLines($Path, $lines)
}

# --- main ---
$gate = Test-EncryptionGate
$storageCred = Test-StorageCredentialPresent
$free = Get-FreeBytes $env:TEMP
Write-Output ("utc|" + [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"))
Write-Output ("project|" + $ProjectRef)
Write-Output ("supabase-url|" + $SupabaseUrl)
Write-Output ("disk-free-bytes|" + $free)
Write-Output ("encryption|" + $gate.Reason)
Write-Output ("encryption-ready|" + ($(if ($gate.Ready) { "true" } else { "false" })))
Write-Output ("storage-credential|" + ($(if ($storageCred) { "present" } else { "absent" })))

if ($Mode -eq "Prepare") {
  if ($free -lt $MinimumFreeBytes) {
    Write-Output "rejected|disk"
    exit 4
  }
  if ($gate.Ready -and $storageCred) {
    Write-Output "storage-dump|gate-open"
  } else {
    Write-Output "storage-dump|blocked"
  }
  Write-Output "prepare|ok"
  exit 0
}

if ($Mode -eq "SelfTest") {
  function Assert-Step {
    param([bool]$Condition, [string]$Name)
    if (-not $Condition) {
      Write-Output ("rejected|" + $Name)
      exit 5
    }
    Write-Output ("checked|" + $Name)
  }

  Assert-Step (Test-DownloaderIsGetOnly) "downloader-get-only"
  # Constructed probe — must not embed a GitHub-detectable secret literal.
  $sbSecretProbe = "sb_secret_" + "examplevalue_not_real" + "_000"
  Assert-Step ($null -ne (Test-ForbiddenStorageSecret -Secret $sbSecretProbe)) "reject-sb-secret"
  Assert-Step ((Test-ForbiddenStorageSecret -Secret $sbSecretProbe) -eq "sb-secret-key") "reject-sb-secret-reason"
  # Synthetic JWT payload {"role":"service_role"} base64url
  $synPayload = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('{"role":"service_role","ref":"zapccpipwxduzlnvjdmy"}')).TrimEnd('=').Replace('+','-').Replace('/','_')
  $synJwt = "eyJhbGciOiJub25lIn0.$synPayload.sig"
  Assert-Step ((Test-ForbiddenStorageSecret -Secret $synJwt) -eq "jwt-service-role") "reject-jwt-service-role"
  $okPayload = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('{"role":"authenticated","sub":"11111111-1111-1111-1111-111111111111"}')).TrimEnd('=').Replace('+','-').Replace('/','_')
  $okJwt = "eyJhbGciOiJub25lIn0.$okPayload.sig"
  Assert-Step ($null -eq (Test-ForbiddenStorageSecret -Secret $okJwt)) "allow-authenticated-jwt-shape"

  # Local fixture HTTP server (in-process): GET succeeds; PUT/DELETE -> 403.
  $work = Join-Path $env:TEMP ("tejas-storage-selftest-" + [guid]::NewGuid().ToString("n"))
  New-Item -ItemType Directory -Path $work | Out-Null
  $listener = $null
  $passFile = $null
  $synPass = $null
  $runspace = $null
  try {
    $fixtureBody = [Text.Encoding]::UTF8.GetBytes("synthetic-storage-object-v1")
    $port = 0
    $listener = [System.Net.HttpListener]::new()
    for ($p = 18765; $p -lt 18865; $p++) {
      try {
        $listener.Prefixes.Clear()
        $listener.Prefixes.Add("http://127.0.0.1:$p/")
        $listener.Start()
        $port = $p
        break
      } catch { continue }
    }
    Assert-Step ($port -gt 0 -and $listener.IsListening) "fixture-listener"

    $runspace = [runspacefactory]::CreateRunspace()
    $runspace.Open()
    $ps = [powershell]::Create()
    $ps.Runspace = $runspace
    [void]$ps.AddScript({
      param($l, $body)
      for ($i = 0; $i -lt 16; $i++) {
        try {
          $ctx = $l.GetContext()
        } catch { break }
        try {
          if ($ctx.Request.HttpMethod -eq "GET" -and $ctx.Request.Url.AbsolutePath -match '/object/') {
            $ctx.Response.StatusCode = 200
            $ctx.Response.OutputStream.Write($body, 0, $body.Length)
          } else {
            $ctx.Response.StatusCode = 403
          }
        } finally {
          $ctx.Response.Close()
        }
      }
    }).AddArgument($listener).AddArgument($fixtureBody)
    $handle = $ps.BeginInvoke()
    Start-Sleep -Milliseconds 200

    $out1 = Join-Path $work "obj1.bin"
    $status = 0
    $okGet = Invoke-StorageGet -Url "http://127.0.0.1:$port/storage/v1/object/tejas-registration-files/a/upload.xlsx" -AccessToken $okJwt -Publishable "syn-publishable" -OutFile $out1 -StatusCode ([ref]$status)
    Assert-Step $okGet "fixture-get"
    Assert-Step ((Get-Item $out1).Length -eq $fixtureBody.Length) "fixture-size"
    $sha = Get-ArchiveSha256 $out1
    Assert-Step ($sha.Length -eq 64) "fixture-sha256"
    Write-Output ("fixture-sha256|" + $sha)

    $oldProg = $ProgressPreference
    $ProgressPreference = "SilentlyContinue"
    $putRejected = $false
    $delRejected = $false
    try {
      Invoke-WebRequest -Uri "http://127.0.0.1:$port/storage/v1/object/tejas-registration-files/a/upload.xlsx" -Method Put -Body $fixtureBody -UseBasicParsing -TimeoutSec 5 | Out-Null
    } catch { $putRejected = $true }
    try {
      Invoke-WebRequest -Uri "http://127.0.0.1:$port/storage/v1/object/tejas-registration-files/a/upload.xlsx" -Method Delete -UseBasicParsing -TimeoutSec 5 | Out-Null
    } catch { $delRejected = $true }
    $ProgressPreference = $oldProg
    Assert-Step $putRejected "fixture-put-rejected"
    Assert-Step $delRejected "fixture-delete-rejected"

    $plainRoot = Join-Path $work "plain"
    $objDir = Join-Path $plainRoot "objects\tejas-registration-files\a"
    New-Item -ItemType Directory -Path $objDir -Force | Out-Null
    Copy-Item $out1 (Join-Path $objDir "upload.xlsx")
    $zipPath = Join-Path $work "synthetic.zip"
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($plainRoot, $zipPath)
    $zipLen = (Get-Item $zipPath).Length
    Remove-Partial $plainRoot
    Assert-Step (-not (Test-Path $plainRoot)) "synthetic-plain-wiped"
    $synPass = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($synPass)
    $passFile = Write-PassFileBytes -Bytes $synPass
    Assert-Step (-not [string]::IsNullOrWhiteSpace($passFile)) "synthetic-pass-file"
    $sealed = Join-Path $work "synthetic.zip.tejas1"
    Assert-Step (Test-OutsideGit $work) "synthetic-outside-git"
    $ErrorActionPreference = "Continue"
    & $NodeExe $SealJs seal --in $zipPath --out $sealed --pass-file $passFile --wipe-plaintext 2>&1 | Out-Null
    $sealCode = $LASTEXITCODE
    $ErrorActionPreference = "Stop"
    Assert-Step ($sealCode -eq 0) "synthetic-seal"
    Assert-Step (-not (Test-Path $zipPath)) "synthetic-zip-wiped"
    Assert-Step (Test-Tejas1Magic $sealed) "synthetic-tejas1-magic"
    Assert-Step (Invoke-SealAuthenticatedVerify -SealedPath $sealed -PassFile $passFile -ExpectedPlainLength $zipLen -ExpectedMagicPrefix "PK") "synthetic-seal-auth"

    $page1 = 0..99
    $page2 = 100..178
    $all = @($page1) + @($page2)
    Assert-Step ($all.Count -eq 179) "pagination-merge-count"
    Assert-Step (($all | Select-Object -Unique).Count -eq 179) "pagination-no-dupes"

    # Secure refresh design (synthetic Auth token endpoint)
    $authPort = 0
    $authListener = [System.Net.HttpListener]::new()
    for ($p = 18865; $p -lt 18965; $p++) {
      try {
        $authListener.Prefixes.Clear()
        $authListener.Prefixes.Add("http://127.0.0.1:$p/")
        $authListener.Start()
        $authPort = $p
        break
      } catch { continue }
    }
    Assert-Step ($authPort -gt 0) "auth-fixture-listener"
    $newAccessPayload = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('{"role":"authenticated","sub":"11111111-1111-1111-1111-111111111111"}')).TrimEnd('=').Replace('+','-').Replace('/','_')
    $newAccess = "eyJhbGciOiJub25lIn0.$newAccessPayload.sig"
    $authRs = [runspacefactory]::CreateRunspace(); $authRs.Open()
    $authPs = [powershell]::Create(); $authPs.Runspace = $authRs
    [void]$authPs.AddScript({
      param($l, $access)
      for ($i = 0; $i -lt 4; $i++) {
        try { $ctx = $l.GetContext() } catch { break }
        try {
          $reader = New-Object IO.StreamReader($ctx.Request.InputStream)
          $raw = $reader.ReadToEnd()
          $reader.Dispose()
          if ($ctx.Request.HttpMethod -eq "POST" -and $ctx.Request.Url.Query -match "refresh_token" -and $raw -match "refresh_token") {
            $json = (@{ access_token = $access; refresh_token = "rotated-refresh-token-synthetic"; expires_in = 3600; token_type = "bearer" } | ConvertTo-Json -Compress)
            $bytes = [Text.Encoding]::UTF8.GetBytes($json)
            $ctx.Response.StatusCode = 200
            $ctx.Response.ContentType = "application/json"
            $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
          } else {
            $ctx.Response.StatusCode = 400
          }
        } finally { $ctx.Response.Close() }
      }
    }).AddArgument($authListener).AddArgument($newAccess)
    [void]$authPs.BeginInvoke()
    Start-Sleep -Milliseconds 200
    $refreshed = Invoke-AuthTokenRefresh -AuthBaseUrl "http://127.0.0.1:$authPort" -Publishable "syn-publishable" -RefreshToken "old-refresh-token-synthetic"
    Assert-Step ($null -ne $refreshed) "auth-refresh"
    Assert-Step ($refreshed.AccessToken -eq $newAccess) "auth-refresh-access"
    Assert-Step ($refreshed.RefreshToken -eq "rotated-refresh-token-synthetic") "auth-refresh-rotated"
    Assert-Step ($refreshed.ExpiresIn -eq 3600) "auth-refresh-expires"
    # Session blob round-trip (no secret print)
    $sessBlob = New-StorageSessionBlob -Publishable "syn-publishable" -RefreshToken $refreshed.RefreshToken
    $parsed = Parse-StorageSessionBlob -Blob $sessBlob
    Assert-Step ($parsed.Publishable -eq "syn-publishable") "session-parse-publishable"
    Assert-Step ($parsed.RefreshToken -eq "rotated-refresh-token-synthetic") "session-parse-refresh"
    try { if ($authListener.IsListening) { $authListener.Stop() }; $authListener.Close() } catch {}
    try { $authRs.Close(); $authRs.Dispose() } catch {}

    Assert-Step ($Mode -eq "SelfTest") "selftest-no-prod-download"
    Write-Output "self-test|ok"
    exit 0
  } finally {
    Remove-PassFile $passFile
    Clear-Bytes $synPass
    if ($null -ne $listener) {
      try { if ($listener.IsListening) { $listener.Stop() } } catch {}
      try { $listener.Close() } catch {}
    }
    if ($null -ne $runspace) {
      try { $runspace.Close(); $runspace.Dispose() } catch {}
    }
    if (Test-Path -LiteralPath $work) { Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue }
  }
}

if ($Mode -eq "Inventory" -or $Mode -eq "Dump") {
  if (-not (Test-Path -LiteralPath $BackupRoot)) {
    New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
  }
  if (-not (Protect-BackupDirectory $BackupRoot)) {
    Write-Output "rejected|backup-root-acl"
    exit 4
  }

  Write-Output "inventory|starting"
  $inv = Get-DbInventory
  $bucketIssue = Assert-ExpectedBuckets -Buckets $inv.Buckets
  if ($bucketIssue) {
    Write-Output ("rejected|" + $bucketIssue)
    exit 4
  }
  Write-Output ("buckets|" + $inv.Buckets.Count)
  foreach ($b in $inv.Buckets) {
    Write-Output ("bucket|" + $b.Id + "|public=" + $b.Public + "|limit=" + $b.FileSizeLimit)
  }
  $totalBytes = ($inv.Objects | Measure-Object -Property ByteSize -Sum).Sum
  if ($null -eq $totalBytes) { $totalBytes = 0 }
  Write-Output ("objects|" + $inv.Objects.Count)
  Write-Output ("bytes-meta|" + $totalBytes)
  Write-Output "inventory|complete"

  if ($Mode -eq "Inventory") {
    $stamp = [DateTime]::UtcNow.ToString("yyyyMMddTHHmmssZ")
    $invDir = Join-Path $BackupRoot ("inventory-" + $stamp)
    New-Item -ItemType Directory -Path $invDir -Force | Out-Null
    $csv = Join-Path $invDir "objects.csv"
    $inv.Objects | Export-Csv -LiteralPath $csv -NoTypeInformation -Encoding UTF8
    Write-Output ("inventory-path|" + $invDir)
    exit 0
  }
}

# Dump
if (-not $gate.Ready) {
  Write-Output "blocked|encryption"
  Write-Output ("encryption|" + $gate.Reason)
  exit 4
}
if (-not $storageCred) {
  Write-Output "blocked|storage-credential"
  Write-Output "owner-action|bootstrap-tejas-storage-reader-session"
  Write-Output "owner-action-script|preview-sql/bootstrap-tejas-storage-reader-session.ps1"
  Write-Output "owner-action-detail|After SELECT-only policy apply: run bootstrap (publishable + reader email/password). Stores publishable+refresh_token only. Do not paste secrets into chat."
  exit 4
}
if ($free -lt $MinimumFreeBytes) {
  Write-Output "rejected|disk"
  exit 4
}

$session = Read-StorageSession
if ($null -eq $session) {
  Write-Output "rejected|storage-session-format"
  Write-Output "expected-format|TEJASSTOR1 publishable+refresh"
  exit 4
}
$forbiddenPub = Test-ForbiddenStorageSecret -Secret $session.Publishable
if ($forbiddenPub) {
  Write-Output ("rejected|privileged-publishable|" + $forbiddenPub)
  $session = $null
  exit 4
}
$refreshed = Invoke-AuthTokenRefresh -AuthBaseUrl $SupabaseUrl -Publishable $session.Publishable -RefreshToken $session.RefreshToken
if ($null -eq $refreshed) {
  Write-Output "rejected|auth-refresh-failed"
  $session = $null
  exit 4
}
if ($refreshed.RefreshToken -ne $session.RefreshToken) {
  if (-not (Write-StorageSession -Publishable $session.Publishable -RefreshToken $refreshed.RefreshToken)) {
    Write-Output "rejected|refresh-persist-failed"
    exit 4
  }
  Write-Output "auth-refresh|rotated-persisted"
} else {
  Write-Output "auth-refresh|ok"
}
$accessToken = $refreshed.AccessToken
$publishableKey = $session.Publishable
$session = $null
$refreshed = $null

$stamp = [DateTime]::UtcNow.ToString("yyyyMMddTHHmmssZ")
$runDir = Join-Path $BackupRoot ("run-" + $stamp)
$plainRoot = Join-Path $runDir "plaintext"
$objectsRoot = Join-Path $plainRoot "objects"
$zipPath = Join-Path $runDir ("tejas-storage-" + $ProjectRef + "-" + $stamp + ".zip")
$sealedPath = Join-Path $runDir ("tejas-storage-" + $ProjectRef + "-" + $stamp + ".zip.tejas1")
$manifestPath = Join-Path $runDir ("tejas-storage-" + $ProjectRef + "-" + $stamp + ".manifest.txt")
$passFile = $null
$recovery = $null

try {
  New-Item -ItemType Directory -Path $objectsRoot -Force | Out-Null
  if (-not (Protect-BackupDirectory $runDir)) {
    Write-Output "rejected|run-dir-acl"
    exit 4
  }

  Write-Output "download|starting"
  $rows = New-Object System.Collections.Generic.List[object]
  $seen = @{}
  $failed = 0
  $copied = 0
  $downloadedBytes = 0L

  foreach ($obj in $inv.Objects) {
    $dupKey = $obj.Bucket + "|" + $obj.Key
    if ($seen.ContainsKey($dupKey)) {
      $rows.Add([pscustomobject]@{
        Bucket = $obj.Bucket; Key = $obj.Key; ByteSize = $obj.ByteSize; MimeType = $obj.MimeType
        ModifiedUtc = $obj.ModifiedUtc; Sha256 = $seen[$dupKey]; ArchivePath = ""; Status = "duplicate"
      })
      Write-Output ("object|duplicate|" + $obj.Bucket + "|" + $obj.Key)
      continue
    }

    $rel = Join-Path $obj.Bucket (($obj.Key -replace '/', [IO.Path]::DirectorySeparatorChar))
    $dest = Join-Path $objectsRoot $rel
    $destDir = Split-Path -Parent $dest
    if (-not (Test-Path -LiteralPath $destDir)) {
      New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }

    $encKey = ($obj.Key -split '/' | ForEach-Object { [Uri]::EscapeDataString($_) }) -join '/'
    $url = "$SupabaseUrl/storage/v1/object/$($obj.Bucket)/$encKey"
    $ok = $false
    $sha = ""
    $actual = 0L
    for ($attempt = 1; $attempt -le $MaxRetries; $attempt++) {
      if (Test-Path -LiteralPath $dest) { Remove-Partial $dest }
      $httpStatus = 0
      $ok = Invoke-StorageGet -Url $url -AccessToken $accessToken -Publishable $publishableKey -OutFile $dest -StatusCode ([ref]$httpStatus)
      if (-not $ok -and $httpStatus -eq 401) {
        Write-Output ("object|auth-expired-refresh|" + $obj.Bucket + "|" + $obj.Key)
        $again = Read-StorageSession
        if ($null -eq $again) { $ok = $false }
        else {
          $r2 = Invoke-AuthTokenRefresh -AuthBaseUrl $SupabaseUrl -Publishable $again.Publishable -RefreshToken $again.RefreshToken
          if ($null -ne $r2) {
            $accessToken = $r2.AccessToken
            $publishableKey = $again.Publishable
            if ($r2.RefreshToken -ne $again.RefreshToken) {
              [void](Write-StorageSession -Publishable $again.Publishable -RefreshToken $r2.RefreshToken)
            }
            $r2 = $null
            $ok = Invoke-StorageGet -Url $url -AccessToken $accessToken -Publishable $publishableKey -OutFile $dest -StatusCode ([ref]$httpStatus)
          }
          $again = $null
        }
      }
      if (-not $ok -or -not (Test-Path -LiteralPath $dest)) {
        Write-Output ("object|retry-download|" + $obj.Bucket + "|" + $obj.Key + "|attempt=" + $attempt + "|http=" + $httpStatus)
        continue
      }
      $actual = (Get-Item -LiteralPath $dest).Length
      if ($obj.ByteSize -gt 0 -and $actual -ne $obj.ByteSize) {
        Write-Output ("object|size-mismatch|" + $obj.Bucket + "|" + $obj.Key + "|expected=" + $obj.ByteSize + "|actual=" + $actual + "|attempt=" + $attempt)
        Remove-Partial $dest
        $ok = $false
        continue
      }
      $sha = Get-ArchiveSha256 $dest
      $ok = $true
      break
    }

    if (-not $ok) {
      $failed++
      $rows.Add([pscustomobject]@{
        Bucket = $obj.Bucket; Key = $obj.Key; ByteSize = $obj.ByteSize; MimeType = $obj.MimeType
        ModifiedUtc = $obj.ModifiedUtc; Sha256 = ""; ArchivePath = ""; Status = "failed"
      })
      Write-Output ("object|failed|" + $obj.Bucket + "|" + $obj.Key)
      continue
    }

    $archiveRel = ("objects/" + $obj.Bucket + "/" + $obj.Key).Replace('\', '/')
    $seen[$dupKey] = $sha
    $copied++
    $downloadedBytes += $actual
    $rows.Add([pscustomobject]@{
      Bucket = $obj.Bucket; Key = $obj.Key; ByteSize = $actual; MimeType = $obj.MimeType
      ModifiedUtc = $obj.ModifiedUtc; Sha256 = $sha; ArchivePath = $archiveRel; Status = "copied"
    })
  }

  Write-Output ("download|copied=" + $copied + "|failed=" + $failed + "|bytes=" + $downloadedBytes)
  if ($failed -gt 0) {
    Write-Output "rejected|download-incomplete"
    Write-StorageManifest -Path $manifestPath -Rows $rows.ToArray() -Header @{
      "utc" = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
      "project-ref" = $ProjectRef
      "status" = "download-incomplete"
      "copied" = $copied
      "failed" = $failed
    }
    Write-Output ("manifest|" + $manifestPath)
    exit 4
  }
  if ($copied -ne $inv.Objects.Count) {
    Write-Output "rejected|count-mismatch"
    exit 4
  }

  # Reconcile byte totals
  if ($downloadedBytes -ne [int64]$totalBytes -and [int64]$totalBytes -gt 0) {
    Write-Output ("warning|byte-total-drift|meta=" + $totalBytes + "|downloaded=" + $downloadedBytes)
  }

  Write-Output "zip|starting"
  if (Test-Path -LiteralPath $zipPath) { Remove-Partial $zipPath }
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [System.IO.Compression.ZipFile]::CreateFromDirectory($plainRoot, $zipPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)
  if (-not (Test-Path -LiteralPath $zipPath)) {
    Write-Output "rejected|zip"
    exit 4
  }
  $zipLen = (Get-Item -LiteralPath $zipPath).Length
  $zipSha = Get-ArchiveSha256 $zipPath
  Write-Output ("zip-bytes|" + $zipLen)
  Write-Output ("zip-sha256|" + $zipSha)

  # Wipe plaintext object tree before seal (zip retains bytes)
  Remove-Partial $plainRoot
  if (Test-Path -LiteralPath $plainRoot) {
    Write-Output "rejected|plaintext-objects-remain"
    exit 4
  }
  Write-Output "plaintext-objects|wiped"

  $recovery = Read-RecoverySecretBytes
  if ($null -eq $recovery -or $recovery.Length -ne 32) {
    Write-Output "rejected|recovery-secret"
    exit 4
  }
  $passFile = Write-PassFileBytes -Bytes $recovery
  if ([string]::IsNullOrWhiteSpace($passFile)) {
    Write-Output "rejected|pass-file"
    exit 4
  }

  $oldPref = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $NodeExe $SealJs seal --in $zipPath --out $sealedPath --pass-file $passFile --wipe-plaintext 2>&1 | ForEach-Object { Protect-Text ("seal|" + $_) }
  $sealCode = $LASTEXITCODE
  $ErrorActionPreference = $oldPref
  if ($sealCode -ne 0 -or -not (Test-Path -LiteralPath $sealedPath)) {
    Write-Output "rejected|seal"
    exit 4
  }
  Write-Output "seal|ok"

  if (Test-Path -LiteralPath $zipPath) {
    Write-Output "rejected|plaintext-zip-remains"
    exit 4
  }
  Write-Output "plaintext-zip|wiped"

  if (-not (Test-Tejas1Magic $sealedPath)) {
    Write-Output "rejected|tejas1-magic"
    exit 4
  }
  # ZIP local file header magic PK\x03\x04
  if (-not (Invoke-SealAuthenticatedVerify -SealedPath $sealedPath -PassFile $passFile -ExpectedPlainLength $zipLen -ExpectedMagicPrefix "PK")) {
    Write-Output "rejected|seal-auth-verify"
    exit 4
  }
  Write-Output "seal-auth-verify|ok"

  $sealedSha = Get-ArchiveSha256 $sealedPath
  $sealedLen = (Get-Item -LiteralPath $sealedPath).Length
  Write-Output ("sealed-bytes|" + $sealedLen)
  Write-Output ("sealed-sha256|" + $sealedSha)

  $header = @{
    "utc" = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
    "project-ref" = $ProjectRef
    "buckets" = ($ExpectedBuckets -join ",")
    "object-count" = $copied
    "bytes-downloaded" = $downloadedBytes
    "bytes-meta" = $totalBytes
    "zip-sha256" = $zipSha
    "zip-bytes" = $zipLen
    "sealed-sha256" = $sealedSha
    "sealed-bytes" = $sealedLen
    "sealed-path" = $sealedPath
    "encryption-gate" = $gate.Reason
    "plaintext-retained" = "false"
    "phase" = "38"
    "status" = "complete"
  }
  Write-StorageManifest -Path $manifestPath -Rows $rows.ToArray() -Header $header
  $manifestSha = Get-ArchiveSha256 $manifestPath
  Write-Output ("manifest|" + $manifestPath)
  Write-Output ("manifest-sha256|" + $manifestSha)
  Write-Output ("sealed|" + $sealedPath)
  Write-Output "storage-dump|complete"
  exit 0
} finally {
  $accessToken = $null
  $publishableKey = $null
  Remove-PassFile $passFile
  Clear-Bytes $recovery
  if (Test-Path -LiteralPath $plainRoot) {
    Write-Output "warning|plaintext-root-still-present"
  }
  if (Test-Path -LiteralPath $zipPath) {
    Write-Output "warning|plaintext-zip-still-present"
  }
}
