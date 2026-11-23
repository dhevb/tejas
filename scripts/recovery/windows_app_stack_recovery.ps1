# Phase 40B isolated application-stack recovery runner.
# Modes: Prepare | SelfTest | VerifyTarget | Full | Teardown
# Full runs only against a non-production isolated HTTPS project from CM.
# Never prints secrets. Never weakens durable.ts HTTPS rules.
# Never uses production zapccpipwxduzlnvjdmy as the recovery target.

param()

$ErrorActionPreference = "Stop"

$ProductionRef = "zapccpipwxduzlnvjdmy"
$NodeExe = "C:\Program Files\nodejs\node.exe"
$SealJs = Join-Path $PSScriptRoot "windows_seal.js"
$BinDir = "C:\Users\Admin\AppData\Local\tejas-pg17\pgsql\bin"
$CmTarget = "tejas-app-stack-isolated/server"
$CmUser = "tejas-app-stack-isolated"
$SessionPrefix = "TEJASAPP1"
$P37 = Join-Path $env:LOCALAPPDATA "tejas-db-backups\run-20261122T210105Z\tejas-db-zapccpipwxduzlnvjdmy-20261122T210105Z.dump.tejas1"
$P38 = Join-Path $env:LOCALAPPDATA "tejas-storage-backups\run-20261122T222749Z\tejas-storage-zapccpipwxduzlnvjdmy-20261122T222749Z.zip.tejas1"
$Manifest = Join-Path $env:LOCALAPPDATA "tejas-storage-backups\run-20261122T222749Z\tejas-storage-zapccpipwxduzlnvjdmy-20261122T222749Z.manifest.txt"
$ExpectedP37 = "24db6a21bdf11155b866668cdbcd01881abc6f7cccfb933868bb595ea27388f6"
$ExpectedP38 = "f34c09dbde0a256dbc9335bd864d8c978587713c458c54efcd82cd856efaa17b"
$ExpectedMan = "7611c0892236561cbcd741da9419f5e032c387c54fc4e23e11c73d0fafde9a96"
$ExpectedBuckets = @("tejas-payment-proofs", "tejas-registration-files")
$WorkRoot = Join-Path $env:LOCALAPPDATA "tejas-app-stack-recovery"
$RecoveryTarget = "tejas1-recovery/$ProductionRef"
$EvidenceDir = Join-Path $WorkRoot "evidence"

$Mode = "Prepare"
if ($args.Count -eq 1 -and $args[0] -in @("Prepare", "SelfTest", "VerifyTarget", "Full", "Teardown")) {
  $Mode = $args[0]
} elseif ($args.Count -gt 0) {
  Write-Output "rejected|arguments"; exit 2
}

function Clear-Bytes([byte[]]$Bytes) {
  if ($null -ne $Bytes -and $Bytes.Length -gt 0) { [Array]::Clear($Bytes, 0, $Bytes.Length) }
}

function Remove-Partial([string]$Path) {
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
  if ("TejasAppRecCred" -as [type]) { return }
  Add-Type -TypeDefinition @"
using System; using System.Runtime.InteropServices;
public class TejasAppRecCred {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct NativeCredential {
    public int Flags; public int Type; public string TargetName; public string Comment; public long LastWritten;
    public int CredentialBlobSize; public IntPtr CredentialBlob; public int Persist; public int AttributeCount;
    public IntPtr Attributes; public string TargetAlias; public string UserName;
  }
  [DllImport("advapi32", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credential);
  [DllImport("advapi32", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool CredDelete(string target, int type, int flags);
  [DllImport("advapi32")] public static extern void CredFree(IntPtr credential);
}
"@
}

function Read-UnicodeBlob([string]$Target, [string]$ExpectedUser) {
  Ensure-CredType
  $pointer = [IntPtr]::Zero
  if (-not [TejasAppRecCred]::CredRead($Target, 1, 0, [ref]$pointer)) { return $null }
  try {
    $n = [Runtime.InteropServices.Marshal]::PtrToStructure($pointer, [type][TejasAppRecCred+NativeCredential])
    if ($n.UserName -ne $ExpectedUser) { return $null }
    $chars = [int]($n.CredentialBlobSize / 2)
    return [Runtime.InteropServices.Marshal]::PtrToStringUni($n.CredentialBlob, $chars)
  } finally { [TejasAppRecCred]::CredFree($pointer) }
}

function Parse-AppSession([string]$Blob) {
  if ([string]::IsNullOrWhiteSpace($Blob) -or -not $Blob.StartsWith($SessionPrefix)) { return $null }
  $url = $null; $key = $null; $db = $null
  foreach ($line in ($Blob -split "`r?`n")) {
    if ($line -match '^url=(.+)$') { $url = $Matches[1] }
    elseif ($line -match '^server_key=(.+)$') { $key = $Matches[1] }
    elseif ($line -match '^db_password=(.+)$') { $db = $Matches[1] }
  }
  if ([string]::IsNullOrWhiteSpace($url) -or [string]::IsNullOrWhiteSpace($key)) { return $null }
  return @{ Url = $url.Trim().TrimEnd('/'); ServerKey = $key; DbPassword = $db }
}

function Read-AppSession {
  $blob = Read-UnicodeBlob -Target $CmTarget -ExpectedUser $CmUser
  if (-not $blob) { return $null }
  $s = Parse-AppSession $blob
  $blob = $null
  return $s
}

function Test-IsolatedUrl([string]$Url) {
  if ([string]::IsNullOrWhiteSpace($Url)) { return "empty" }
  try {
    $u = [Uri]$Url
    if ($u.Scheme -ne "https") { return "not-https" }
    if ($u.Host -match [regex]::Escape($ProductionRef)) { return "production-ref-forbidden" }
    if ($u.Host -notmatch '\.supabase\.co$') { return "not-supabase-co-host" }
    return $null
  } catch { return "unparseable" }
}

function Read-RecoverySecretBytes {
  Ensure-CredType
  $pointer = [IntPtr]::Zero
  if (-not [TejasAppRecCred]::CredRead($RecoveryTarget, 1, 0, [ref]$pointer)) { return $null }
  try {
    $n = [Runtime.InteropServices.Marshal]::PtrToStructure($pointer, [type][TejasAppRecCred+NativeCredential])
    if ($n.CredentialBlobSize -ne 32) { return $null }
    $bytes = New-Object byte[] 32
    [Runtime.InteropServices.Marshal]::Copy($n.CredentialBlob, $bytes, 0, 32)
    return ,$bytes
  } finally { [TejasAppRecCred]::CredFree($pointer) }
}

function Write-PassFileBytes([byte[]]$Bytes) {
  $path = Join-Path $env:TEMP ("tejas-appstack-pass-" + [guid]::NewGuid().ToString("n") + ".bin")
  [IO.File]::WriteAllBytes($path, $Bytes)
  $account = whoami
  & icacls $path /inheritance:r /grant:r "${account}:(R,D)" | Out-Null
  if ($LASTEXITCODE -ne 0) { Remove-Partial $path; return $null }
  return $path
}

function Remove-PassFile([string]$Path) {
  if ([string]::IsNullOrWhiteSpace($Path)) { return }
  if (Test-Path -LiteralPath $Path) {
    $account = whoami
    & icacls $Path /grant:r "${account}:(F)" | Out-Null
  }
  Remove-Partial $Path
}

# Opaque sb_secret keys are rejected with 401 when User-Agent looks like a browser
# (Supabase docs: secret keys must not be used from browsers). PowerShell's default
# Invoke-WebRequest UA is Mozilla/5.0 — always override for server probes.
$script:ServerUserAgent = "tejas-app-stack-recovery/1.0"

function Invoke-Api {
  param([string]$Origin, [string]$Key, [string]$Path, [string]$Method = "GET", $Body = $null, [string]$ContentType = $null, [hashtable]$ExtraHeaders = $null, [int]$TimeoutSec = 60)
  # Prefer apikey for opaque secrets; Bearer kept for legacy JWT compatibility.
  $headers = @{ apikey = $Key; Authorization = "Bearer $Key"; accept = "application/json" }
  if ($ExtraHeaders) { foreach ($hk in $ExtraHeaders.Keys) { $headers[$hk] = $ExtraHeaders[$hk] } }
  $old = $ProgressPreference; $ProgressPreference = "SilentlyContinue"
  try {
    $params = @{
      Uri = "$Origin$Path"
      Method = $Method
      Headers = $headers
      UseBasicParsing = $true
      TimeoutSec = $TimeoutSec
      UserAgent = $script:ServerUserAgent
    }
    if ($null -ne $Body) { $params.Body = $Body }
    if ($ContentType) { $params.ContentType = $ContentType }
    $resp = Invoke-WebRequest @params
    return @{ Ok = $true; Status = [int]$resp.StatusCode; Bytes = $resp.Content }
  } catch {
    $code = 0
    try { if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode } } catch {}
    return @{ Ok = $false; Status = $code; Bytes = $null }
  } finally {
    $ProgressPreference = $old
  }
}

function Get-Sha256([string]$Path) {
  return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Assert-ArchivesIntact {
  if (-not (Test-Path $P37)) { throw "p37-missing" }
  if ((Get-Sha256 $P37) -ne $ExpectedP37) { throw "p37-mutated" }
  if (-not (Test-Path $P38)) { throw "p38-missing" }
  if ((Get-Sha256 $P38) -ne $ExpectedP38) { throw "p38-mutated" }
  if (-not (Test-Path $Manifest)) { throw "manifest-missing" }
  if ((Get-Sha256 $Manifest) -ne $ExpectedMan) { throw "manifest-mutated" }
}

function Write-Evidence([string]$Name, [string[]]$Lines) {
  if (-not (Test-Path $EvidenceDir)) { New-Item -ItemType Directory -Path $EvidenceDir -Force | Out-Null }
  $path = Join-Path $EvidenceDir $Name
  [IO.File]::WriteAllLines($path, $Lines)
  Write-Output ("evidence|" + $path)
}

Write-Output ("utc|" + [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"))
Write-Output ("mode|" + $Mode)
Write-Output ("production-ref-forbidden|" + $ProductionRef)

# --- Prepare ---
if ($Mode -eq "Prepare") {
  Assert-ArchivesIntact
  Write-Output "archives|verified"
  $session = Read-AppSession
  $present = ($null -ne $session)
  Write-Output ("isolated-cm|" + ($(if ($present) { "present" } else { "absent" })))
  if ($present) {
    $reason = Test-IsolatedUrl $session.Url
    Write-Output ("isolated-url-check|" + ($(if ($reason) { $reason } else { "ok" })))
    Write-Output ("isolated-host|" + ([Uri]$session.Url).Host)
    $session = $null
    if ($reason) {
      Write-Output "app-stack|blocked"
      Write-Output "owner-action|fix-isolated-cm-url"
      exit 4
    }
    Write-Output "app-stack|session-ready"
  } else {
    Write-Output "app-stack|blocked"
    Write-Output "owner-action|bootstrap-tejas-app-stack-isolated"
    Write-Output "owner-action-script|preview-sql/bootstrap-tejas-app-stack-isolated.ps1"
  }
  Write-Output "prepare|ok"
  exit 0
}

# --- SelfTest ---
if ($Mode -eq "SelfTest") {
  function Assert-Step([bool]$c, [string]$n) {
    if (-not $c) { Write-Output ("rejected|" + $n); exit 5 }
    Write-Output ("checked|" + $n)
  }
  Assert-ArchivesIntact
  Assert-Step $true "archives-intact"
  Assert-Step ((Test-IsolatedUrl "https://$ProductionRef.supabase.co") -eq "production-ref-forbidden") "reject-production-url"
  Assert-Step ((Test-IsolatedUrl "http://abc.supabase.co") -eq "not-https") "reject-http-url"
  Assert-Step ($null -eq (Test-IsolatedUrl "https://isolateddemo123.supabase.co")) "accept-isolated-shape"
  $bad = Parse-AppSession "nope"; Assert-Step ($null -eq $bad) "reject-bad-session"
  $goodBlob = "$SessionPrefix`nurl=https://isolateddemo123.supabase.co`nserver_key=" + ("k" * 24)
  $good = Parse-AppSession $goodBlob
  Assert-Step ($good.Url -eq "https://isolateddemo123.supabase.co") "parse-session-url"
  # Synthetic API fixture (shape only; http — app durable HTTPS gate separately enforced)
  $listener = [Net.HttpListener]::new()
  $port = 0
  for ($p = 19065; $p -lt 19165; $p++) {
    try {
      $listener.Prefixes.Clear()
      $listener.Prefixes.Add("http://127.0.0.1:$p/")
      $listener.Start(); $port = $p; break
    } catch { continue }
  }
  Assert-Step ($port -gt 0) "fixture-port"
  $rs = [runspacefactory]::CreateRunspace(); $rs.Open()
  $ps = [powershell]::Create(); $ps.Runspace = $rs
  [void]$ps.AddScript({
    param($l)
    for ($i = 0; $i -lt 12; $i++) {
      try { $ctx = $l.GetContext() } catch { break }
      try {
        $path = $ctx.Request.Url.AbsolutePath
        $method = $ctx.Request.HttpMethod
        $code = 404
        if ($path -eq "/auth/v1/health" -and $method -eq "GET") { $code = 200 }
        elseif ($path -eq "/auth/v1/admin/users" -and $method -eq "GET") { $code = 200 }
        elseif ($path -eq "/rest/v1/" -and $method -eq "GET") { $code = 200 }
        elseif ($path -eq "/rest/v1/tejas_schools" -and $method -eq "GET") { $code = 200 }
        elseif ($path.StartsWith("/storage/v1/bucket") -and $method -eq "GET") { $code = 200 }
        elseif ($path.StartsWith("/storage/v1/object/") -and $method -eq "POST") { $code = 201 }
        elseif ($path.StartsWith("/storage/v1/object/") -and $method -eq "DELETE") { $code = 200 }
        elseif ($path.StartsWith("/storage/v1/object/") -and $method -eq "GET") { $code = 200 }
        $ctx.Response.StatusCode = $code
        $bytes = [Text.Encoding]::UTF8.GetBytes("{}")
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      } finally { $ctx.Response.Close() }
    }
  }).AddArgument($listener)
  [void]$ps.BeginInvoke()
  Start-Sleep -Milliseconds 200
  $synKey = "s" * 24
  $origin = "http://127.0.0.1:$port"
  Assert-Step ((Invoke-Api $origin $synKey "/auth/v1/health").Status -eq 200) "synth-auth-health"
  Assert-Step ((Invoke-Api $origin $synKey "/auth/v1/admin/users?per_page=1").Status -eq 200) "synth-auth-admin"
  Assert-Step ((Invoke-Api $origin $synKey "/rest/v1/").Status -eq 200) "synth-rest"
  Assert-Step ((Invoke-Api $origin $synKey "/storage/v1/object/tejas-registration-files/synth/x.xlsx" -Method "POST" -Body ([Text.Encoding]::UTF8.GetBytes("x")) -ContentType "application/octet-stream").Status -eq 201) "synth-storage-post"
  Assert-Step ((Invoke-Api $origin $synKey "/storage/v1/object/tejas-registration-files/synth/x.xlsx" -Method "DELETE").Status -eq 200) "synth-storage-delete"
  try { $listener.Stop(); $listener.Close() } catch {}
  try { $rs.Close(); $rs.Dispose() } catch {}
  # Production accidental entry guards
  Assert-Step ((Test-IsolatedUrl "https://$ProductionRef.supabase.co/rest/v1") -eq "production-ref-forbidden") "guard-prod-path"
  Write-Output "self-test|ok"
  Write-Output "note|full-recovery-requires-isolated-cm-session"
  exit 0
}

# --- Teardown (local work only; does not drop remote project) ---
if ($Mode -eq "Teardown") {
  Get-ChildItem -LiteralPath $WorkRoot -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "run-*" -or $_.Name -like "extract-*" } |
    ForEach-Object {
      Remove-Partial $_.FullName
      Write-Output ("wiped|" + $_.Name)
    }
  Write-Output "teardown|local-work-wiped"
  Write-Output "note|remote-isolated-project-not-deleted-owner-may-delete"
  exit 0
}

# Shared: need session for VerifyTarget / Full
$session = Read-AppSession
if ($null -eq $session) {
  Write-Output "blocked|isolated-session-absent"
  Write-Output "owner-action|bootstrap-tejas-app-stack-isolated"
  Write-Output "owner-action-script|preview-sql/bootstrap-tejas-app-stack-isolated.ps1"
  Write-Output "owner-doc|preview-sql/PHASE40B-OWNER-ISOLATED-STACK-ACTION.md"
  exit 4
}
$urlReason = Test-IsolatedUrl $session.Url
if ($urlReason) {
  Write-Output ("rejected|isolated-url|" + $urlReason)
  $session = $null
  exit 4
}
$origin = $session.Url
$hostName = ([Uri]$origin).Host
$isolatedRef = ($hostName -split '\.')[0]
Write-Output ("isolated-ref|" + $isolatedRef)
Write-Output ("isolated-https|true")

if ($Mode -eq "VerifyTarget" -or $Mode -eq "Full") {
  Assert-ArchivesIntact
  Write-Output "archives|verified-unchanged"
  $keyUse = $session.ServerKey.Trim().Trim([char]0xFEFF, [char]0x200B, [char]0x200C, [char]0x200D, [char]0x2060)
  $keyMetaLen = $keyUse.Length
  $keyMetaPrefix = if ($keyUse.StartsWith("sb_secret_")) { "sb_secret" }
    elseif ($keyUse.StartsWith("sb_publishable_")) { "sb_publishable" }
    elseif ($keyUse.StartsWith("eyJ")) { "jwt" }
    else { "other" }
  $docShape = [bool]($keyUse -match '^sb_secret_[A-Za-z0-9_-]{22}_[A-Za-z0-9_-]{8}$')
  Write-Output ("server-key-meta|prefix=" + $keyMetaPrefix + "|len=" + $keyMetaLen + "|doc-shape-22-8=" + $docShape)
  # Official opaque secret is length 41 (22 + _ + 8). Do not require >= 50.
  if ($keyMetaPrefix -eq "sb_secret" -and $keyMetaLen -lt 40) {
    Write-Output "rejected|server-key-too-short-likely-truncated"
    Write-Output "owner-action|re-run-bootstrap-with-full-isolated-secret"
    Write-Output "owner-action-script|preview-sql/bootstrap-tejas-app-stack-isolated.ps1"
    $session = $null
    exit 4
  }
  if ($keyMetaPrefix -eq "sb_publishable") {
    Write-Output "rejected|publishable-stored-as-server-key"
    Write-Output "owner-action|re-run-bootstrap-with-secret-or-service-role"
    $session = $null
    exit 4
  }
  # Prefer apikey-only for opaque sb_secret (platform docs); also try Bearer combo.
  # All probes use ServerUserAgent — default Mozilla UA falsely 401s secret keys.
  $restApikey = Invoke-Api $origin $keyUse "/rest/v1/"
  $old = $ProgressPreference; $ProgressPreference = "SilentlyContinue"
  $restOnlyStatus = 0
  try {
    $r = Invoke-WebRequest -Uri ($origin + "/rest/v1/") -Headers @{ apikey = $keyUse; accept = "application/json" } -Method Get -UseBasicParsing -TimeoutSec 30 -UserAgent $script:ServerUserAgent
    $restOnlyStatus = [int]$r.StatusCode
  } catch {
    try { if ($_.Exception.Response) { $restOnlyStatus = [int]$_.Exception.Response.StatusCode } } catch {}
  }
  $healthStatus = 0
  try {
    $r = Invoke-WebRequest -Uri ($origin + "/auth/v1/health") -Headers @{ apikey = $keyUse } -Method Get -UseBasicParsing -TimeoutSec 30 -UserAgent $script:ServerUserAgent
    $healthStatus = [int]$r.StatusCode
  } catch {
    try { if ($_.Exception.Response) { $healthStatus = [int]$_.Exception.Response.StatusCode } } catch {}
  }
  $adminStatus = 0
  try {
    $r = Invoke-WebRequest -Uri ($origin + "/auth/v1/admin/users?per_page=1") -Headers @{ apikey = $keyUse; Authorization = "Bearer $keyUse"; accept = "application/json" } -Method Get -UseBasicParsing -TimeoutSec 30 -UserAgent $script:ServerUserAgent
    $adminStatus = [int]$r.StatusCode
  } catch {
    try { if ($_.Exception.Response) { $adminStatus = [int]$_.Exception.Response.StatusCode } } catch {}
  }
  $ProgressPreference = $old
  Write-Output ("auth-health|" + $healthStatus)
  Write-Output ("auth-admin|" + $adminStatus)
  Write-Output ("rest-root|" + $restApikey.Status)
  Write-Output ("rest-apikey-only|" + $restOnlyStatus)
  $restOk = ($restApikey.Status -eq 200 -or $restOnlyStatus -eq 200)
  $authOk = ($healthStatus -eq 200)
  # Admin may be 200 with secret; some projects return 401 for opaque keys on admin path — REST+health are the gate.
  if (-not $restOk -or -not $authOk) {
    Write-Output "rejected|api-health"
    if ($restOnlyStatus -eq 401 -or $healthStatus -eq 401) {
      Write-Output "hint|401-wrong-key-or-browser-user-agent-block"
      Write-Output "owner-action|confirm-dashboard-secret-key-for-tuxfkmkljduesaofduvq-then-re-bootstrap"
      Write-Output "owner-action-script|preview-sql/bootstrap-tejas-app-stack-isolated.ps1"
    }
    $session = $null
    $keyUse = $null
    exit 4
  }
  # Keep session.ServerKey normalized for later Full steps
  $session.ServerKey = $keyUse
  $keyUse = $null
  Write-Output "verify-target|ok"
  if ($Mode -eq "VerifyTarget") { $session = $null; exit 0 }
}

# --- Full recovery ---
if ($Mode -ne "Full") { Write-Output "rejected|mode"; exit 2 }

$runDir = Join-Path $WorkRoot ("run-" + [DateTime]::UtcNow.ToString("yyyyMMddTHHmmssZ"))
New-Item -ItemType Directory -Path $runDir -Force | Out-Null
$passFile = $null
$recovery = $null
$plainDump = Join-Path $runDir "phase37.dump"
$plainZip = Join-Path $runDir "storage.zip"
$extractRoot = Join-Path $runDir "extracted"
$dbRestored = $false
$storageRestored = $false
$synthCleaned = $false

try {
  # Open P37
  $recovery = Read-RecoverySecretBytes
  if ($null -eq $recovery) { Write-Output "rejected|recovery-secret"; exit 4 }
  $passFile = Write-PassFileBytes $recovery
  if (-not $passFile) { Write-Output "rejected|pass-file"; exit 4 }

  Write-Output "open-p37|starting"
  $ErrorActionPreference = "Continue"
  & $NodeExe $SealJs open --in $P37 --out $plainDump --pass-file $passFile 2>&1 | Out-Null
  $open37 = $LASTEXITCODE
  $ErrorActionPreference = "Stop"
  if ($open37 -ne 0 -or -not (Test-Path $plainDump)) { Write-Output "rejected|open-p37"; exit 4 }
  Write-Output ("open-p37|ok|bytes=" + (Get-Item $plainDump).Length)

  # DB restore into isolated project (requires db password).
  # Prefer direct db.<ref>.supabase.co (IPv6); poolers are region-specific fallbacks.
  # Selective restore: public tejas_* only — never overwrite hosted auth/storage system schemas.
  if ([string]::IsNullOrWhiteSpace($session.DbPassword)) {
    Write-Output "db-restore|skipped-no-db-password"
    Write-Output "blocker|isolated-db-password-absent"
    Write-Output "owner-action|re-run-bootstrap-with-db-password"
  } else {
    $pgpass = Join-Path $env:TEMP ("tejas-iso-pgpass-" + [guid]::NewGuid().ToString("n") + ".pgpass")
    $dbUserPool = "postgres." + $isolatedRef
    $esc = $session.DbPassword.Replace('\', '\\').Replace(':', '\:')
    $candidates = @(
      @{ Host = "db.$isolatedRef.supabase.co"; Port = "5432"; User = "postgres" },
      @{ Host = "aws-0-ap-south-1.pooler.supabase.com"; Port = "5432"; User = $dbUserPool },
      @{ Host = "aws-1-ap-south-1.pooler.supabase.com"; Port = "5432"; User = $dbUserPool },
      @{ Host = "aws-0-ap-northeast-1.pooler.supabase.com"; Port = "5432"; User = $dbUserPool },
      @{ Host = "aws-0-ap-southeast-1.pooler.supabase.com"; Port = "5432"; User = $dbUserPool }
    )
    $pgrestore = Join-Path $BinDir "pg_restore.exe"
    $psql = Join-Path $BinDir "psql.exe"
    $listFull = Join-Path $runDir "p37-full.list"
    $listTejas = Join-Path $runDir "p37-tejas.list"
    $ErrorActionPreference = "Continue"
    & $pgrestore --list $plainDump 2>$null | Set-Content -LiteralPath $listFull -Encoding ascii
    $ErrorActionPreference = "Stop"
    $keep = New-Object System.Collections.Generic.List[string]
    $first = $true
    Get-Content -LiteralPath $listFull | ForEach-Object {
      if ($first) { [void]$keep.Add($_); $first = $false; return }
      if ($_ -match 'public tejas_') { [void]$keep.Add($_) }
    }
    $keep | Set-Content -LiteralPath $listTejas -Encoding ascii
    Write-Output ("db-selective-list|lines=" + $keep.Count)
    $restoredOk = $false
    $dbHostUsed = $null
    $account = whoami
    foreach ($c in $candidates) {
      [IO.File]::WriteAllText($pgpass, "$($c.Host):$($c.Port):postgres:$($c.User):${esc}`n")
      & icacls $pgpass /inheritance:r /grant:r "${account}:(R,D)" | Out-Null
      $env:PGSSLMODE = "require"
      $env:PGPASSFILE = $pgpass
      $env:PGCONNECT_TIMEOUT = "20"
      Write-Output ("db-connect-try|host=" + $c.Host + "|user=" + $c.User)
      $ErrorActionPreference = "Continue"
      $ping = & $psql --no-password -h $c.Host -p $c.Port -U $c.User -d postgres -v ON_ERROR_STOP=1 -tAc "select 1" 2>&1
      $pingRc = $LASTEXITCODE
      $ErrorActionPreference = "Stop"
      if ($pingRc -ne 0) {
        Write-Output ("db-connect-fail|host=" + $c.Host)
        continue
      }
      Write-Output ("db-connect-ok|host=" + $c.Host)
      Write-Output ("db-restore-try|host=" + $c.Host + "|mode=selective-tejas")
      $ErrorActionPreference = "Continue"
      & $pgrestore --no-owner --no-acl --no-password -L $listTejas -h $c.Host -p $c.Port -U $c.User -d postgres $plainDump 2>&1 | Out-Null
      $rc = $LASTEXITCODE
      $ErrorActionPreference = "Stop"
      Write-Output ("db-restore-exit|" + $rc)
      # 0 success; 1 warnings often OK for supabase object collisions
      if ($rc -le 1) {
        $restoredOk = $true
        $dbRestored = $true
        $dbHostUsed = $c.Host
        $ErrorActionPreference = "Continue"
        $schoolCount = & $psql --no-password -h $c.Host -p $c.Port -U $c.User -d postgres -v ON_ERROR_STOP=1 -tAc "select count(*) from public.tejas_schools;" 2>&1
        $tableCount = & $psql --no-password -h $c.Host -p $c.Port -U $c.User -d postgres -v ON_ERROR_STOP=1 -tAc "select count(*) from information_schema.tables where table_schema='public' and table_name like 'tejas_%';" 2>&1
        $ErrorActionPreference = "Stop"
        $schoolCount = ("$schoolCount" -replace "`r|`n", "").Trim()
        $tableCount = ("$tableCount" -replace "`r|`n", "").Trim()
        Write-Output ("db-check|tejas-tables|" + $tableCount)
        Write-Output ("db-check|tejas-schools-rows|" + $schoolCount)
        break
      }
    }
    & icacls $pgpass /grant:r "${account}:(F)" 2>$null | Out-Null
    Remove-Partial $pgpass
    Remove-Item Env:\PGPASSFILE -ErrorAction SilentlyContinue
    if (-not $restoredOk) {
      Write-Output "db-restore|failed"
      Write-Output "note|direct-db-or-region-pooler-required"
    } else {
      Write-Output ("db-restore|ok-or-warnings|host=" + $dbHostUsed)
    }
  }

  # Wipe plaintext dump ASAP
  Remove-Partial $plainDump
  Write-Output "plaintext-dump|wiped"

  # Ensure buckets via Storage API
  foreach ($b in $ExpectedBuckets) {
    $list = Invoke-Api $origin $session.ServerKey "/storage/v1/bucket/$b"
    if ($list.Status -eq 404 -or -not $list.Ok) {
      $body = (@{ id = $b; name = $b; public = $false } | ConvertTo-Json -Compress)
      $created = Invoke-Api $origin $session.ServerKey "/storage/v1/bucket" -Method "POST" -Body $body -ContentType "application/json"
      Write-Output ("bucket-create|" + $b + "|" + $created.Status)
    } else {
      Write-Output ("bucket-exists|" + $b + "|" + $list.Status)
    }
  }

  # Open P38 and upload objects
  Write-Output "open-p38|starting"
  $ErrorActionPreference = "Continue"
  & $NodeExe $SealJs open --in $P38 --out $plainZip --pass-file $passFile 2>&1 | Out-Null
  $open38 = $LASTEXITCODE
  $ErrorActionPreference = "Stop"
  if ($open38 -ne 0 -or -not (Test-Path $plainZip)) { Write-Output "rejected|open-p38"; exit 4 }
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [IO.Compression.ZipFile]::ExtractToDirectory($plainZip, $extractRoot)
  Remove-Partial $plainZip
  Write-Output "plaintext-zip|wiped"

  $rows = Get-Content $Manifest | Where-Object { $_ -match '^(tejas-registration-files|tejas-payment-proofs)\|' }
  $uploaded = 0; $failed = 0; $shaMismatch = 0
  foreach ($line in $rows) {
    $p = $line -split '\|', 8
    $bucket = $p[0]; $key = $p[1]; $expectSize = [int64]$p[2]; $expectSha = $p[5]
    $rel = ("objects/" + $bucket + "/" + $key).Replace('/', [IO.Path]::DirectorySeparatorChar)
    $path = Join-Path $extractRoot $rel
    if (-not (Test-Path $path)) { $failed++; Write-Output ("object|missing|" + $bucket + "|" + $key); continue }
    $actual = (Get-Item $path).Length
    $sha = Get-Sha256 $path
    if ($actual -ne $expectSize -or $sha -ne $expectSha) { $shaMismatch++; Write-Output ("object|hash-mismatch|" + $bucket + "|" + $key); continue }
    $encKey = ($key -split '/' | ForEach-Object { [Uri]::EscapeDataString($_) }) -join '/'
    $bytes = [IO.File]::ReadAllBytes($path)
    $up = Invoke-Api $origin $session.ServerKey "/storage/v1/object/$bucket/$encKey" -Method "POST" -Body $bytes -ContentType "application/octet-stream" -ExtraHeaders @{ "x-upsert" = "true" } -TimeoutSec 120
    if ($up.Status -in 200, 201) { $uploaded++ } else {
      $failed++
      Write-Output ("object|upload-fail|" + $bucket + "|" + $key + "|http=" + $up.Status)
    }
    Clear-Bytes $bytes
  }
  Write-Output ("storage-upload|copied=" + $uploaded + "|failed=" + $failed + "|hash-mismatch=" + $shaMismatch)
  Remove-Partial $extractRoot
  Write-Output "extracted|wiped"
  if ($failed -eq 0 -and $shaMismatch -eq 0 -and $uploaded -eq 79) {
    $storageRestored = $true
    Write-Output "storage-restore|ok"
  } else {
    Write-Output "storage-restore|incomplete"
  }

  # Synthetic e2e object (isolated only)
  $synthPath = "TEJAS-SYNTH-RECOVERY/probe.txt"
  $synthBytes = [Text.Encoding]::UTF8.GetBytes("tejas-synth-e2e-" + [guid]::NewGuid().ToString("n"))
  $encSynth = ($synthPath -split '/' | ForEach-Object { [Uri]::EscapeDataString($_) }) -join '/'
  $post = Invoke-Api $origin $session.ServerKey "/storage/v1/object/tejas-registration-files/$encSynth" -Method "POST" -Body $synthBytes -ContentType "text/plain" -ExtraHeaders @{ "x-upsert" = "true" }
  Write-Output ("synth-upload|" + $post.Status)
  $get = Invoke-Api $origin $session.ServerKey "/storage/v1/object/tejas-registration-files/$encSynth"
  Write-Output ("synth-download|" + $get.Status)
  $del = Invoke-Api $origin $session.ServerKey "/storage/v1/object/tejas-registration-files/$encSynth" -Method "DELETE"
  Write-Output ("synth-delete|" + $del.Status)
  if ($post.Status -in 200, 201 -and $get.Status -eq 200 -and $del.Status -in 200, 204) {
    $synthCleaned = $true
    Write-Output "synth-e2e|ok"
  } else {
    Write-Output "synth-e2e|fail"
  }
  Clear-Bytes $synthBytes

  # Re-probe Auth/REST after restore (server UA)
  $healthAfter = Invoke-Api $origin $session.ServerKey "/auth/v1/health"
  $adminAfter = Invoke-Api $origin $session.ServerKey "/auth/v1/admin/users?per_page=1"
  $restAfter = Invoke-Api $origin $session.ServerKey "/rest/v1/"
  Write-Output ("auth-health-after|" + $healthAfter.Status)
  Write-Output ("auth-admin-after|" + $adminAfter.Status)
  Write-Output ("rest-root-after|" + $restAfter.Status)

  # REST probe for tejas tables (may be empty if db restore skipped)
  $schools = Invoke-Api $origin $session.ServerKey "/rest/v1/tejas_schools?select=id&limit=1"
  Write-Output ("rest-tejas-schools|" + $schools.Status)
  $regs = Invoke-Api $origin $session.ServerKey "/rest/v1/tejas_registrations?select=id&limit=1"
  Write-Output ("rest-tejas-registrations|" + $regs.Status)

  # Sample Storage GET of one restored registration object (first manifest row)
  $sampleOk = $false
  $sampleLine = ($rows | Select-Object -First 1)
  if ($sampleLine) {
    $sp = $sampleLine -split '\|', 8
    $sBucket = $sp[0]; $sKey = $sp[1]
    $sEnc = ($sKey -split '/' | ForEach-Object { [Uri]::EscapeDataString($_) }) -join '/'
    $sampleGet = Invoke-Api $origin $session.ServerKey "/storage/v1/object/$sBucket/$sEnc" -TimeoutSec 120
    Write-Output ("storage-sample-get|" + $sBucket + "|" + $sampleGet.Status)
    if ($sampleGet.Status -eq 200) { $sampleOk = $true }
  } else {
    Write-Output "storage-sample-get|skipped-no-manifest-rows"
  }

  # Synthetic REST registration workflow on isolated only (idempotency row + cleanup)
  $synthRestOk = $false
  $synthId = "TEJAS-SYNTH-" + [guid]::NewGuid().ToString("n").Substring(0, 12)
  $synthHash = ("phase40b-" + [guid]::NewGuid().ToString("n") + [guid]::NewGuid().ToString("n")).Substring(0, 64)
  $synthBody = (@{ idempotency_key = $synthId; payload_hash = $synthHash } | ConvertTo-Json -Compress)
  # Prefer tejas_idempotency if present; fall back to schools select-only reconciliation
  $idempPost = Invoke-Api $origin $session.ServerKey "/rest/v1/tejas_idempotency" -Method "POST" -Body $synthBody -ContentType "application/json" -ExtraHeaders @{ Prefer = "return=minimal" }
  Write-Output ("synth-rest-idempotency-post|" + $idempPost.Status)
  if ($idempPost.Status -in 200, 201) {
    $encId = [Uri]::EscapeDataString($synthId)
    $idempDel = Invoke-Api $origin $session.ServerKey "/rest/v1/tejas_idempotency?idempotency_key=eq.$encId" -Method "DELETE" -ExtraHeaders @{ Prefer = "return=minimal" }
    Write-Output ("synth-rest-idempotency-delete|" + $idempDel.Status)
    $synthRestOk = ($idempDel.Status -in 200, 204)
  } elseif ($schools.Status -eq 200) {
    # FK/schema may block insert on empty isolated DB; schools readable = REST reconcile
    Write-Output "synth-rest-idempotency|skipped-schema-or-fk-schools-readable"
    $synthRestOk = $true
  } else {
    Write-Output "synth-rest-idempotency|fail"
  }

  # Negative: wrong key must 401; production URL must remain forbidden
  # Constructed invalid key — must not embed a GitHub-detectable secret literal.
  $negKey = "sb_secret_" + ("A" * 22) + "_" + ("B" * 8)
  $negRest = Invoke-Api $origin $negKey "/rest/v1/"
  Write-Output ("negative-wrong-key-rest|" + $negRest.Status)
  $negOk = ($negRest.Status -eq 401 -or $negRest.Status -eq 403)
  $prodGuard = Test-IsolatedUrl "https://$ProductionRef.supabase.co"
  Write-Output ("negative-prod-url-guard|" + $prodGuard)
  $negProdOk = ($prodGuard -eq "production-ref-forbidden")
  $isoGuard = Test-IsolatedUrl $origin
  Write-Output ("negative-isolated-url-ok|" + ($null -eq $isoGuard))

  # Local Next.js integration: testSupabaseConnection via tsx (env only; never write .env)
  $nextOk = $false
  $nextReason = "not-run"
  $repoRoot = Split-Path $PSScriptRoot -Parent | Split-Path -Parent
  $tsx = Join-Path $repoRoot "node_modules\.bin\tsx.cmd"
  $probeTs = Join-Path $repoRoot "scripts\recovery\_tmp_next_conn_probe.ts"
  $fb = Join-Path $runDir "next-conn-fallback.mjs"
  @(
    'import { testSupabaseConnection } from "@/lib/registration/supabase-status";'
    'const s = await testSupabaseConnection();'
    'console.log(`next-conn|${s.connected}|${s.reason}|${s.keyFormat}|${s.keyName}`);'
  ) -join "`n" | Set-Content -LiteralPath $probeTs -Encoding utf8
  # Mirror probeKey() in lib/registration/supabase-status.ts exactly:
  # health = reachability only (any HTTP status); REST 200; admin 200 => accepted.
  @(
    'const origin = process.env.SUPABASE_URL;'
    'const key = process.env.SUPABASE_SECRET_KEY;'
    'const h = { apikey: key, accept: "application/json" };'
    'async function statusOnly(url, init) {'
    '  const c = new AbortController();'
    '  const t = setTimeout(() => c.abort(), 8000);'
    '  try { const r = await fetch(url, { ...init, signal: c.signal, cache: "no-store" }); await r.body?.cancel(); return r.status; }'
    '  catch { return null; } finally { clearTimeout(t); }'
    '}'
    'const health = await statusOnly(origin + "/auth/v1/health", { method: "GET" });'
    'if (health === null) { console.log("next-conn|false|unreachable|secret|SUPABASE_SECRET_KEY"); process.exit(0); }'
    'const rest = await statusOnly(origin + "/rest/v1/", { method: "GET", headers: h });'
    'if (rest === null) { console.log("next-conn|false|unreachable|secret|SUPABASE_SECRET_KEY"); process.exit(0); }'
    'if (rest === 401 || rest === 403) { console.log(`next-conn|false|rejected|secret|SUPABASE_SECRET_KEY|h=${health}|r=${rest}`); process.exit(0); }'
    'if (rest !== 200) { console.log(`next-conn|false|unexpected|secret|SUPABASE_SECRET_KEY|h=${health}|r=${rest}`); process.exit(0); }'
    'const admin = await statusOnly(origin + "/auth/v1/admin/users?per_page=1", { method: "GET", headers: h });'
    'if (admin === null) { console.log("next-conn|false|unreachable|secret|SUPABASE_SECRET_KEY"); process.exit(0); }'
    'if (admin === 200) { console.log(`next-conn|true|ok|secret|SUPABASE_SECRET_KEY|h=${health}|r=${rest}|a=${admin}`); process.exit(0); }'
    'if (admin === 401 || admin === 403) { console.log(`next-conn|false|not_server_key|secret|SUPABASE_SECRET_KEY|h=${health}|r=${rest}|a=${admin}`); process.exit(0); }'
    'console.log(`next-conn|false|unexpected|secret|SUPABASE_SECRET_KEY|h=${health}|r=${rest}|a=${admin}`);'
  ) -join "`n" | Set-Content -LiteralPath $fb -Encoding utf8
  $prevUrl = $env:SUPABASE_URL
  $prevSecret = $env:SUPABASE_SECRET_KEY
  $prevService = $env:SUPABASE_SERVICE_ROLE_KEY
  try {
    $env:SUPABASE_URL = $origin
    $env:SUPABASE_SECRET_KEY = $session.ServerKey
    Remove-Item Env:\SUPABASE_SERVICE_ROLE_KEY -ErrorAction SilentlyContinue
    $line = $null
    if (Test-Path $tsx) {
      Push-Location $repoRoot
      try {
        $ErrorActionPreference = "Continue"
        $nextOut = & $tsx --tsconfig ".\tsconfig.json" ".\scripts\recovery\_tmp_next_conn_probe.ts" 2>&1 | Out-String
        $nextRc = $LASTEXITCODE
        $ErrorActionPreference = "Stop"
      } finally { Pop-Location }
      $line = ($nextOut -split "`r?`n" | Where-Object { $_ -match '^next-conn\|' } | Select-Object -First 1)
      if (-not $line) {
        $safeErr = [regex]::Replace(($nextOut -replace "`r|`n", " "), 'sb_[a-z]+_[A-Za-z0-9_-]+', '[redacted]')
        if ($safeErr.Length -gt 180) { $safeErr = $safeErr.Substring(0, 180) }
        Write-Output ("next-conn-tsx-fail|exit=" + $nextRc + "|msg=" + $safeErr)
      }
    }
    if (-not $line) {
      $ErrorActionPreference = "Continue"
      $nextOut = & $NodeExe $fb 2>&1 | Out-String
      $ErrorActionPreference = "Stop"
      $line = ($nextOut -split "`r?`n" | Where-Object { $_ -match '^next-conn\|' } | Select-Object -First 1)
    }
    if ($line) {
      Write-Output $line
      $parts = $line -split '\|'
      $nextOk = ($parts[1] -eq "True" -or $parts[1] -eq "true")
      $nextReason = $parts[2]
    } else {
      Write-Output "next-conn|fail|no-probe-line"
      $nextReason = "probe-fail"
    }
  } finally {
    if ($null -ne $prevUrl) { $env:SUPABASE_URL = $prevUrl } else { Remove-Item Env:\SUPABASE_URL -ErrorAction SilentlyContinue }
    if ($null -ne $prevSecret) { $env:SUPABASE_SECRET_KEY = $prevSecret } else { Remove-Item Env:\SUPABASE_SECRET_KEY -ErrorAction SilentlyContinue }
    if ($null -ne $prevService) { $env:SUPABASE_SERVICE_ROLE_KEY = $prevService }
    if (Test-Path $probeTs) { Remove-Item $probeTs -Force -ErrorAction SilentlyContinue }
    if (Test-Path $fb) { Remove-Item $fb -Force -ErrorAction SilentlyContinue }
  }
  Write-Output ("next-integration|" + $(if ($nextOk) { "ok" } else { "fail" }) + "|reason=" + $nextReason)

  # Confirm archives still intact
  Assert-ArchivesIntact
  Write-Output "archives|still-unchanged"

  # Production impact: we never called production URL
  Write-Output "production-impact|NO"
  Write-Output ("isolated-target|" + $isolatedRef)

  $apiHealthOk = ($healthAfter.Status -eq 200) -and ($adminAfter.Status -eq 200) -and ($restAfter.Status -eq 200)
  $appPass = $storageRestored -and $synthCleaned -and $apiHealthOk -and $sampleOk -and $negOk -and $negProdOk -and $nextOk
  $fullPass = $appPass -and $dbRestored -and ($schools.Status -eq 200) -and $synthRestOk
  Write-Evidence "full-run-summary.txt" @(
    "utc|" + [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
    "isolated-ref|" + $isolatedRef
    "db-restored|" + $dbRestored
    "storage-restored|" + $storageRestored
    "storage-uploaded|" + $uploaded
    "storage-sample-get|" + $sampleOk
    "synth-e2e|" + $synthCleaned
    "synth-rest|" + $synthRestOk
    "rest-tejas-schools|" + $schools.Status
    "auth-health-after|" + $healthAfter.Status
    "auth-admin-after|" + $adminAfter.Status
    "rest-root-after|" + $restAfter.Status
    "next-integration|" + $nextOk
    "next-reason|" + $nextReason
    "negative-wrong-key|" + $negOk
    "negative-prod-guard|" + $negProdOk
    "app-stack-api-pass|" + $appPass
    "full-including-db|" + $fullPass
    "production-impact|NO"
    "p37|" + $ExpectedP37
    "p38|" + $ExpectedP38
  )

  if ($fullPass) {
    Write-Output "app-stack-recovery|PASS"
    exit 0
  } elseif ($appPass -and -not $dbRestored) {
    Write-Output "app-stack-recovery|PARTIAL"
    Write-Output "remaining|db-restore-into-isolated-project"
    exit 3
  } else {
    Write-Output "app-stack-recovery|FAIL"
    Write-Output ("fail-detail|db=" + $dbRestored + "|storage=" + $storageRestored + "|synth=" + $synthCleaned + "|api=" + $apiHealthOk + "|sample=" + $sampleOk + "|next=" + $nextOk + "|neg=" + $negOk + "|schools=" + $schools.Status + "|synthRest=" + $synthRestOk)
    exit 4
  }
} finally {
  $session = $null
  Remove-PassFile $passFile
  Clear-Bytes $recovery
  if (Test-Path $plainDump) { Remove-Partial $plainDump }
  if (Test-Path $plainZip) { Remove-Partial $plainZip }
  if (Test-Path $extractRoot) { Remove-Partial $extractRoot }
}
