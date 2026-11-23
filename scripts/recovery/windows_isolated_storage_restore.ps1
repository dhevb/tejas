# Isolated restore/verify of the Phase 38 TEJAS1 Storage archive.
# Opens seal locally, extracts ZIP, reconciles every object to the manifest.
# Does not touch production Storage. Modes: SelfTest | Restore

param()

$ErrorActionPreference = "Stop"

$NodeExe = "C:\Program Files\nodejs\node.exe"
$SealJs = Join-Path $PSScriptRoot "windows_seal.js"
$ProjectRef = "zapccpipwxduzlnvjdmy"
$RecoveryTarget = "tejas1-recovery/$ProjectRef"
$RunDir = Join-Path $env:LOCALAPPDATA "tejas-storage-backups\run-20261122T222749Z"
$SealedArchive = Join-Path $RunDir "tejas-storage-$ProjectRef-20261122T222749Z.zip.tejas1"
$ManifestPath = Join-Path $RunDir "tejas-storage-$ProjectRef-20261122T222749Z.manifest.txt"
$ExpectedSealedSha = "f34c09dbde0a256dbc9335bd864d8c978587713c458c54efcd82cd856efaa17b"
$ExpectedObjectCount = 79
$ExpectedBytes = 3199827L
$ExpectedBuckets = @("tejas-payment-proofs", "tejas-registration-files")
$WorkRoot = Join-Path $env:LOCALAPPDATA "tejas-isolated-storage-restore"

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
  if ("TejasIsoStorCred" -as [type]) { return }
  Add-Type -TypeDefinition @"
using System; using System.Runtime.InteropServices;
public class TejasIsoStorCred {
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
  $found = [TejasIsoStorCred]::CredRead($RecoveryTarget, 1, 0, [ref]$pointer)
  if (-not $found -or $pointer -eq [IntPtr]::Zero) { return $null }
  try {
    $native = [Runtime.InteropServices.Marshal]::PtrToStructure($pointer, [type][TejasIsoStorCred+NativeCredential])
    if ($native.CredentialBlobSize -ne 32) { return $null }
    $bytes = New-Object byte[] 32
    [Runtime.InteropServices.Marshal]::Copy($native.CredentialBlob, $bytes, 0, 32)
    return ,$bytes
  } finally { [TejasIsoStorCred]::CredFree($pointer) }
}

function Write-PassFileBytes {
  param([byte[]]$Bytes)
  $path = Join-Path $env:TEMP ("tejas-iso-stor-pass-" + [guid]::NewGuid().ToString("n") + ".bin")
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
  $full = [IO.Path]::GetFullPath($Directory)
  $root = Get-GitRoot (Split-Path -Parent $PSCommandPath)
  if ([string]::IsNullOrWhiteSpace($root)) { return $false }
  $rootFull = [IO.Path]::GetFullPath($root).TrimEnd('\')
  $fullTrim = $full.TrimEnd('\')
  if ($fullTrim.Equals($rootFull, [StringComparison]::OrdinalIgnoreCase)) { return $false }
  $prefix = $rootFull + [IO.Path]::DirectorySeparatorChar
  return -not $fullTrim.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)
}

function Read-ManifestRows {
  param([string]$Path)
  $lines = Get-Content -LiteralPath $Path
  $header = @{}
  $rows = New-Object System.Collections.Generic.List[object]
  foreach ($line in $lines) {
    if ($line -eq "tejas-storage-backup-manifest|v1") { continue }
    if ($line.StartsWith("columns|")) { continue }
    if ($line -match '^(tejas-registration-files|tejas-payment-proofs)\|') {
      $p = $line -split '\|', 8
      if ($p.Count -lt 8) { continue }
      $rows.Add([pscustomobject]@{
        Bucket = $p[0]; Key = $p[1]; ByteSize = [int64]$p[2]; MimeType = $p[3]
        ModifiedUtc = $p[4]; Sha256 = $p[5]; ArchivePath = $p[6]; Status = $p[7]
      })
      continue
    }
    $idx = $line.IndexOf('|')
    if ($idx -gt 0) {
      $header[$line.Substring(0, $idx)] = $line.Substring($idx + 1)
    }
  }
  return @{ Header = $header; Rows = $rows.ToArray() }
}

Write-Output ("utc|" + [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"))
Write-Output ("mode|" + $Mode)
Write-Output ("sealed|" + $SealedArchive)

if ($Mode -eq "SelfTest") {
  if (-not (Test-Path -LiteralPath $SealedArchive)) { Write-Output "rejected|sealed-missing"; exit 3 }
  $sha = (Get-FileHash -LiteralPath $SealedArchive -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($sha -ne $ExpectedSealedSha) { Write-Output "rejected|sealed-sha-mismatch"; exit 3 }
  Write-Output "checked|sealed-sha"
  if (-not (Test-Path -LiteralPath $ManifestPath)) { Write-Output "rejected|manifest-missing"; exit 3 }
  Write-Output "checked|manifest-present"
  if (-not (Test-Path -LiteralPath $NodeExe)) { Write-Output "rejected|node-missing"; exit 3 }
  Write-Output "checked|node"
  if (-not (Test-Path -LiteralPath $SealJs)) { Write-Output "rejected|seal-missing"; exit 3 }
  Write-Output "checked|seal-tool"
  if (-not (Test-OutsideGit $WorkRoot)) { Write-Output "rejected|work-root-inside-git"; exit 3 }
  Write-Output "checked|work-root-outside-git"

  # Wrong-key must fail open (synthetic).
  $work = Join-Path $env:TEMP ("tejas-iso-stor-selftest-" + [guid]::NewGuid().ToString("n"))
  New-Item -ItemType Directory -Path $work | Out-Null
  $wrongPass = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($wrongPass)
  $wrongFile = Write-PassFileBytes -Bytes $wrongPass
  $wrongOut = Join-Path $work "should-not-open.zip"
  try {
    $ErrorActionPreference = "Continue"
    & $NodeExe $SealJs open --in $SealedArchive --out $wrongOut --pass-file $wrongFile 2>&1 | Out-Null
    $wrongCode = $LASTEXITCODE
    $ErrorActionPreference = "Stop"
    if ($wrongCode -eq 0 -or (Test-Path -LiteralPath $wrongOut)) {
      Write-Output "rejected|wrong-key-opened"
      exit 5
    }
    Write-Output "checked|wrong-key-rejected"
  } finally {
    Remove-PassFile $wrongFile
    Clear-Bytes $wrongPass
    if (Test-Path -LiteralPath $work) { Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue }
  }

  $man = Read-ManifestRows -Path $ManifestPath
  if ([int]$man.Header["object-count"] -ne $ExpectedObjectCount) { Write-Output "rejected|manifest-count"; exit 5 }
  if ($man.Rows.Count -ne $ExpectedObjectCount) { Write-Output "rejected|manifest-rows"; exit 5 }
  Write-Output "checked|manifest-count"
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
if (-not (Test-Path -LiteralPath $ManifestPath)) {
  Write-Output "rejected|manifest-missing"
  exit 4
}
if (-not (Test-OutsideGit $WorkRoot)) {
  Write-Output "rejected|work-root-inside-git"
  exit 4
}

if (-not (Test-Path -LiteralPath $WorkRoot)) {
  New-Item -ItemType Directory -Path $WorkRoot -Force | Out-Null
}
$isoRun = Join-Path $WorkRoot ("run-" + [DateTime]::UtcNow.ToString("yyyyMMddTHHmmssZ"))
New-Item -ItemType Directory -Path $isoRun -Force | Out-Null
$plainZip = Join-Path $isoRun "storage.zip"
$extractRoot = Join-Path $isoRun "extracted"
$passFile = $null
$recovery = $null

try {
  $recovery = Read-RecoverySecretBytes
  if ($null -eq $recovery) { Write-Output "rejected|recovery-secret"; exit 4 }
  $passFile = Write-PassFileBytes -Bytes $recovery
  if (-not $passFile) { Write-Output "rejected|pass-file"; exit 4 }

  Write-Output "open|starting"
  $ErrorActionPreference = "Continue"
  & $NodeExe $SealJs open --in $SealedArchive --out $plainZip --pass-file $passFile 2>&1 | Out-Null
  $openCode = $LASTEXITCODE
  $ErrorActionPreference = "Stop"
  if ($openCode -ne 0 -or -not (Test-Path -LiteralPath $plainZip)) {
    Write-Output "rejected|open-failed"
    exit 4
  }
  Write-Output "open|ok"
  $plainLen = (Get-Item $plainZip).Length
  Write-Output ("plaintext-zip-bytes|" + $plainLen)

  $fs = [IO.File]::OpenRead($plainZip)
  try {
    $magic = New-Object byte[] 2
    [void]$fs.Read($magic, 0, 2)
    $pk = ([Text.Encoding]::ASCII.GetString($magic) -eq "PK")
  } finally { $fs.Dispose() }
  if (-not $pk) { Write-Output "rejected|not-zip"; exit 4 }
  Write-Output "zip-magic|ok"

  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [IO.Compression.ZipFile]::ExtractToDirectory($plainZip, $extractRoot)
  Write-Output "extract|ok"

  # Wipe ZIP as soon as extract succeeds (objects remain for hash check).
  Remove-Partial $plainZip
  if (Test-Path -LiteralPath $plainZip) {
    Write-Output "rejected|plaintext-zip-remains"
    exit 4
  }
  Write-Output "plaintext-zip|wiped"

  $man = Read-ManifestRows -Path $ManifestPath
  if ($man.Header["status"] -ne "complete") { Write-Output "rejected|manifest-status"; exit 4 }
  if ([int]$man.Header["object-count"] -ne $ExpectedObjectCount) { Write-Output "rejected|manifest-count"; exit 4 }
  if ($man.Rows.Count -ne $ExpectedObjectCount) { Write-Output "rejected|manifest-rows"; exit 4 }

  $matched = 0
  $bytes = 0L
  $bucketSeen = @{}
  foreach ($row in $man.Rows) {
    if ($row.Status -ne "copied") {
      Write-Output ("rejected|row-status|" + $row.Bucket + "|" + $row.Key)
      exit 4
    }
    if ($row.Bucket -notin $ExpectedBuckets) {
      Write-Output ("rejected|unexpected-bucket|" + $row.Bucket)
      exit 4
    }
    $bucketSeen[$row.Bucket] = $true
    $rel = $row.ArchivePath.Replace('/', [IO.Path]::DirectorySeparatorChar)
    $path = Join-Path $extractRoot $rel
    if (-not (Test-Path -LiteralPath $path)) {
      Write-Output ("rejected|missing-object|" + $row.Bucket + "|" + $row.Key)
      exit 4
    }
    $actual = (Get-Item -LiteralPath $path).Length
    if ($actual -ne $row.ByteSize) {
      Write-Output ("rejected|size-mismatch|" + $row.Bucket + "|" + $row.Key)
      exit 4
    }
    $sha = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($sha -ne $row.Sha256) {
      Write-Output ("rejected|sha-mismatch|" + $row.Bucket + "|" + $row.Key)
      exit 4
    }
    $matched++
    $bytes += $actual
  }

  Write-Output ("reconcile|matched=" + $matched + "|bytes=" + $bytes)
  if ($matched -ne $ExpectedObjectCount) { Write-Output "rejected|count-mismatch"; exit 4 }
  if ($bytes -ne $ExpectedBytes) { Write-Output "rejected|byte-total-mismatch"; exit 4 }
  foreach ($b in $ExpectedBuckets) {
    if (-not $bucketSeen.ContainsKey($b)) {
      Write-Output ("rejected|bucket-missing|" + $b)
      exit 4
    }
  }
  Write-Output ("buckets-verified|" + ($ExpectedBuckets -join ","))
  Write-Output "reconcile|ok"

  # Wipe extracted plaintext objects.
  Remove-Partial $extractRoot
  if (Test-Path -LiteralPath $extractRoot) {
    Write-Output "rejected|extracted-remain"
    exit 4
  }
  Write-Output "extracted|wiped"

  $post = (Get-FileHash -LiteralPath $SealedArchive -Algorithm SHA256).Hash.ToLowerInvariant()
  Write-Output ("sealed-unchanged|" + ($post -eq $ExpectedSealedSha))
  if ($post -ne $ExpectedSealedSha) {
    Write-Output "rejected|sealed-mutated"
    exit 4
  }

  Write-Output "isolated-storage-restore|complete"
  exit 0
} finally {
  Remove-PassFile $passFile
  Clear-Bytes $recovery
  if (Test-Path -LiteralPath $plainZip) {
    Write-Output "warning|plaintext-zip-still-present"
    Remove-Partial $plainZip
  }
  if (Test-Path -LiteralPath $extractRoot) {
    Write-Output "warning|extracted-still-present"
    Remove-Partial $extractRoot
  }
}
