# Stores a TEJASSTOR1 Storage reader session (publishable + refresh_token) in CM.
# Prefer bootstrap-tejas-storage-reader-session.ps1 for first-time password grant.
# This script is offline: it does not call Supabase. Use when you already have
# a refresh_token for the dedicated backup Auth user.
# Rejects service_role / sb_secret. Never prints secrets.
# Target: tejas-storage-reader/zapccpipwxduzlnvjdmy

param()

$ErrorActionPreference = "Stop"

if ($args.Count -gt 0) {
  Write-Output "rejected|arguments"
  exit 2
}

$ProjectRef = "zapccpipwxduzlnvjdmy"
$Target = "tejas-storage-reader/$ProjectRef"
$UserName = "tejas-storage-reader"
$SupabaseUrl = "https://$ProjectRef.supabase.co"
$SessionPrefix = "TEJASSTOR1"

if (-not ("TejasStorageCred" -as [type])) {
  Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class TejasStorageCred {
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
  [DllImport("advapi32", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool CredWrite(ref NativeCredential credential, uint flags);
  [DllImport("advapi32")]
  public static extern void CredFree(IntPtr credential);
}
"@
}

function Test-PresentSession {
  $pointer = [IntPtr]::Zero
  $found = [TejasStorageCred]::CredRead($Target, 1, 0, [ref]$pointer)
  if (-not $found -or $pointer -eq [IntPtr]::Zero) { return $false }
  try {
    $native = [Runtime.InteropServices.Marshal]::PtrToStructure($pointer, [type][TejasStorageCred+NativeCredential])
    if ($native.UserName -ne $UserName -or $native.CredentialBlobSize -lt 40) { return $false }
    $text = [Runtime.InteropServices.Marshal]::PtrToStringUni($native.CredentialBlob, [int]($native.CredentialBlobSize / 2))
    return ($text.StartsWith($SessionPrefix) -and $text -match '(?m)^publishable=' -and $text -match '(?m)^refresh=')
  } finally {
    [TejasStorageCred]::CredFree($pointer)
  }
}

function Test-ForbiddenPublishable {
  param([string]$Key)
  if ([string]::IsNullOrWhiteSpace($Key)) { return "empty" }
  if ($Key.StartsWith("sb_secret_")) { return "sb-secret-key" }
  if ($Key -match '(?i)service_role') { return "service-role-literal" }
  $parts = $Key.Split('.')
  if ($parts.Count -eq 3) {
    try {
      $payload = $parts[1].Replace('-', '+').Replace('_', '/')
      switch ($payload.Length % 4) { 2 { $payload += "==" }; 3 { $payload += "=" } }
      $json = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload))
      if ($json -match '"role"\s*:\s*"service_role"') { return "jwt-service-role" }
      if ($json -match '"role"\s*:\s*"supabase_admin"') { return "jwt-supabase-admin" }
    } catch { }
  }
  return $null
}

if (Test-PresentSession) {
  Write-Output "credential|present"
  Write-Output ("target|" + $Target)
  Write-Output "format|TEJASSTOR1"
  Write-Output ("url|" + $SupabaseUrl)
  exit 0
}

Write-Host "Store TEJASSTOR1 session (publishable + refresh_token) for $ProjectRef."
Write-Host "Preferred first-time path: bootstrap-tejas-storage-reader-session.ps1"
Write-Host "Rejected: service_role JWTs and sb_secret_ keys. Secrets are not echoed."
Write-Host "Note: SecureString Ctrl+V paste often fails in Windows PowerShell — use right-click paste."
$pubSecure = Read-Host -AsSecureString "Publishable key (sb_publishable_... or legacy anon JWT)"
$refSecure = Read-Host -AsSecureString "Refresh token"
if ($null -eq $pubSecure -or $pubSecure.Length -lt 1) { Write-Output "rejected|publishable-empty"; exit 3 }
if ($null -eq $refSecure -or $refSecure.Length -lt 8) { Write-Output "rejected|refresh-short"; exit 3 }

$pubBstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pubSecure)
$refBstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($refSecure)
try {
  $publishable = ([Runtime.InteropServices.Marshal]::PtrToStringBSTR($pubBstr)).Trim()
  $refresh = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($refBstr)
  Write-Output ("publishable-length|" + $publishable.Length)
  # Mirror bootstrap format rules (inline minimal copy — keep secret/service_role rejected)
  $bad = Test-ForbiddenPublishable -Key $publishable
  if ($bad) {
    Write-Output ("rejected|privileged-publishable|" + $bad)
    exit 3
  }
  $okShape = $false
  if ($publishable.StartsWith("sb_publishable_") -and $publishable.Length -ge 40 -and $publishable -match '^sb_publishable_[A-Za-z0-9]+_[A-Za-z0-9]+$') {
    $okShape = $true
  } elseif ($publishable.StartsWith("eyJ") -and $publishable.Split('.').Count -eq 3 -and $publishable.Length -ge 100) {
    $okShape = $true
  }
  if (-not $okShape) {
    Write-Output "rejected|publishable-format"
    Write-Output "hint|use-sb_publishable-or-legacy-anon-jwt"
    exit 3
  }
  if ($refresh.StartsWith("sb_secret_") -or ($refresh -match '(?i)service_role')) {
    Write-Output "rejected|privileged-refresh"
    exit 3
  }
  $blob = $SessionPrefix + "`npublishable=" + $publishable + "`nrefresh=" + $refresh
  $pointer = [Runtime.InteropServices.Marshal]::StringToCoTaskMemUni($blob)
  try {
    $credential = New-Object TejasStorageCred+NativeCredential
    $credential.Type = 1
    $credential.TargetName = $Target
    $credential.UserName = $UserName
    $credential.CredentialBlobSize = $blob.Length * 2
    $credential.CredentialBlob = $pointer
    $credential.Persist = 2
    $credential.AttributeCount = 0
    $credential.Attributes = [IntPtr]::Zero
    $credential.Comment = "tejas-storage-session-v1 project=$ProjectRef publishable+refresh_token"
    if (-not [TejasStorageCred]::CredWrite([ref]$credential, 0)) {
      Write-Output "rejected|cred-write"
      exit 3
    }
  } finally {
    [Runtime.InteropServices.Marshal]::FreeCoTaskMem($pointer)
  }
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pubBstr)
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($refBstr)
  $pubSecure.Dispose()
  $refSecure.Dispose()
  $publishable = $null
  $refresh = $null
  $blob = $null
}

if (-not (Test-PresentSession)) {
  Write-Output "rejected|verify-absent"
  exit 3
}

Write-Output "credential|stored"
Write-Output ("target|" + $Target)
Write-Output "format|TEJASSTOR1"
Write-Output "stored-fields|publishable+refresh_token"
Write-Output "secret|not-printed"
Write-Output "privileged-check|passed-local"
exit 0
