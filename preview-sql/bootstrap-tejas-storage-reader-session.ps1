# One-time owner bootstrap: password grant -> store publishable + refresh_token in CM.
# Password is never persisted. Tokens are never printed.
# Accepts sb_publishable_... or legacy anon JWT. Rejects sb_secret_ / service_role.
# Target: tejas-storage-reader/zapccpipwxduzlnvjdmy
# Modes: (none) interactive bootstrap | SelfTest

param()

$ErrorActionPreference = "Stop"

$ProjectRef = "zapccpipwxduzlnvjdmy"
$Target = "tejas-storage-reader/$ProjectRef"
$UserName = "tejas-storage-reader"
$SupabaseUrl = "https://$ProjectRef.supabase.co"
$SessionPrefix = "TEJASSTOR1"

$Mode = "Bootstrap"
if ($args.Count -eq 1 -and $args[0] -eq "SelfTest") {
  $Mode = "SelfTest"
} elseif ($args.Count -gt 0) {
  Write-Output "rejected|arguments"
  exit 2
}

if (-not ("TejasStorageSessionCred" -as [type])) {
  Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class TejasStorageSessionCred {
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

function Get-JwtPayloadJson {
  param([string]$Jwt)
  $parts = $Jwt.Split('.')
  if ($parts.Count -ne 3) { return $null }
  try {
    $payload = $parts[1].Replace('-', '+').Replace('_', '/')
    switch ($payload.Length % 4) { 2 { $payload += "==" }; 3 { $payload += "=" } }
    return [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload))
  } catch {
    return $null
  }
}

function Test-ForbiddenPublishable {
  param([string]$Key)
  if ([string]::IsNullOrWhiteSpace($Key)) { return "empty" }
  $trim = $Key.Trim()
  if ($trim.StartsWith("sb_secret_")) { return "sb-secret-key" }
  if ($trim -match '(?i)service_role') { return "service-role-literal" }
  $json = Get-JwtPayloadJson -Jwt $trim
  if ($json -and ($json -match '"role"\s*:\s*"service_role"')) { return "jwt-service-role" }
  if ($json -and ($json -match '"role"\s*:\s*"supabase_admin"')) { return "jwt-supabase-admin" }
  return $null
}

function Test-PublishableKeyFormat {
  # Returns $null if acceptable; otherwise a short reason code (never includes the key).
  # Supported:
  #   - sb_publishable_<random>_<checksum>  (opaque; typically ~46 chars)
  #   - legacy anon JWT (eyJ... three segments; role anon or missing elevated roles)
  param([string]$Key)
  if ([string]::IsNullOrWhiteSpace($Key)) { return "empty" }
  $trim = $Key.Trim()
  $forbidden = Test-ForbiddenPublishable -Key $trim
  if ($forbidden) { return $forbidden }

  if ($trim.StartsWith("sb_publishable_")) {
    # Platform format: sb_publishable_<22-ish>_<8-ish>; allow modest variance, reject tiny stubs.
    if ($trim.Length -lt 40) { return "sb-publishable-too-short" }
    if ($trim.Length -gt 200) { return "sb-publishable-too-long" }
    if ($trim -notmatch '^sb_publishable_[A-Za-z0-9]+_[A-Za-z0-9]+$') { return "sb-publishable-malformed" }
    return $null
  }

  $parts = $trim.Split('.')
  if ($parts.Count -eq 3 -and $trim.StartsWith("eyJ")) {
    if ($trim.Length -lt 100) { return "anon-jwt-too-short" }
    $json = Get-JwtPayloadJson -Jwt $trim
    if (-not $json) { return "anon-jwt-payload" }
    if ($json -match '"role"\s*:\s*"service_role"') { return "jwt-service-role" }
    if ($json -match '"role"\s*:\s*"authenticated"') { return "jwt-user-access-not-publishable" }
    # Legacy project anon keys embed role anon.
    if ($json -match '"role"\s*:\s*"anon"') { return $null }
    # Role claim absent: accept long eyJ client-key shape only (still not secret/service_role).
    if ($json -notmatch '"role"\s*:') { return $null }
    return "anon-jwt-role-not-anon"
  }

  return "unrecognized-publishable-format"
}

function New-SessionBlob {
  param([string]$Publishable, [string]$RefreshToken)
  return ($SessionPrefix + "`npublishable=" + $Publishable + "`nrefresh=" + $RefreshToken)
}

function Write-SessionCredential {
  param([string]$Blob)
  $pointer = [Runtime.InteropServices.Marshal]::StringToCoTaskMemUni($Blob)
  try {
    $credential = New-Object TejasStorageSessionCred+NativeCredential
    $credential.Type = 1
    $credential.TargetName = $Target
    $credential.UserName = $UserName
    $credential.CredentialBlobSize = $Blob.Length * 2
    $credential.CredentialBlob = $pointer
    $credential.Persist = 2
    $credential.AttributeCount = 0
    $credential.Attributes = [IntPtr]::Zero
    $credential.Comment = "tejas-storage-session-v1 project=$ProjectRef publishable+refresh_token"
    if (-not [TejasStorageSessionCred]::CredWrite([ref]$credential, 0)) { return $false }
    return $true
  } finally {
    [Runtime.InteropServices.Marshal]::FreeCoTaskMem($pointer)
  }
}

function Test-PresentSession {
  $pointer = [IntPtr]::Zero
  $found = [TejasStorageSessionCred]::CredRead($Target, 1, 0, [ref]$pointer)
  if (-not $found -or $pointer -eq [IntPtr]::Zero) { return $false }
  try {
    $native = [Runtime.InteropServices.Marshal]::PtrToStructure($pointer, [type][TejasStorageSessionCred+NativeCredential])
    if ($native.UserName -ne $UserName -or $native.CredentialBlobSize -lt 40) { return $false }
    $text = [Runtime.InteropServices.Marshal]::PtrToStringUni($native.CredentialBlob, [int]($native.CredentialBlobSize / 2))
    return ($text.StartsWith($SessionPrefix) -and $text -match '(?m)^publishable=' -and $text -match '(?m)^refresh=')
  } finally {
    [TejasStorageSessionCred]::CredFree($pointer)
  }
}

function ConvertFrom-SecureToPlain {
  param([System.Security.SecureString]$Secure)
  if ($null -eq $Secure) { return $null }
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

function Initialize-PublishableKeyGui {
  Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop
  Add-Type -AssemblyName System.Drawing -ErrorAction Stop
  [System.Windows.Forms.Application]::EnableVisualStyles()
}

function Read-PublishableKeyFromGui {
  # Paste-capable TextBox (Ctrl+V / right-click). Returns trimmed key or $null on cancel.
  # Never writes the key to disk or host output.
  param([string]$PresetText = $null, [switch]$NoShow)
  Initialize-PublishableKeyGui
  $form = New-Object System.Windows.Forms.Form
  $form.Text = "TEJAS Storage Reader — Publishable Key"
  $form.Size = New-Object System.Drawing.Size(640, 260)
  $form.StartPosition = "CenterScreen"
  $form.FormBorderStyle = "FixedDialog"
  $form.MaximizeBox = $false
  $form.MinimizeBox = $false
  $form.TopMost = $true

  $label = New-Object System.Windows.Forms.Label
  $label.Location = New-Object System.Drawing.Point(16, 16)
  $label.Size = New-Object System.Drawing.Size(590, 48)
  $label.Text = "Supabase Publishable Key — not Secret/service_role`r`nPaste sb_publishable_... or legacy anon JWT (eyJ...). Ctrl+V and right-click paste work here."
  $form.Controls.Add($label)

  $box = New-Object System.Windows.Forms.TextBox
  $box.Location = New-Object System.Drawing.Point(16, 72)
  $box.Size = New-Object System.Drawing.Size(590, 28)
  $box.UseSystemPasswordChar = $false
  $box.Multiline = $false
  $box.AcceptsTab = $false
  $box.ShortcutsEnabled = $true
  if (-not [string]::IsNullOrEmpty($PresetText)) { $box.Text = $PresetText }
  $form.Controls.Add($box)

  $hint = New-Object System.Windows.Forms.Label
  $hint.Location = New-Object System.Drawing.Point(16, 108)
  $hint.Size = New-Object System.Drawing.Size(590, 36)
  $hint.Text = "Project: $ProjectRef   Dashboard: Settings -> API Keys -> Publishable (or Legacy anon)."
  $form.Controls.Add($hint)

  $ok = New-Object System.Windows.Forms.Button
  $ok.Text = "OK"
  $ok.Location = New-Object System.Drawing.Point(430, 160)
  $ok.Size = New-Object System.Drawing.Size(80, 28)
  $ok.DialogResult = [System.Windows.Forms.DialogResult]::OK
  $form.Controls.Add($ok)
  $form.AcceptButton = $ok

  $cancel = New-Object System.Windows.Forms.Button
  $cancel.Text = "Cancel"
  $cancel.Location = New-Object System.Drawing.Point(526, 160)
  $cancel.Size = New-Object System.Drawing.Size(80, 28)
  $cancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
  $form.Controls.Add($cancel)
  $form.CancelButton = $cancel

  $resultText = $null
  try {
    if ($NoShow) {
      # SelfTest/harness path: do not display; read preset text.
      $resultText = $box.Text
    } else {
      $dialog = $form.ShowDialog()
      if ($dialog -eq [System.Windows.Forms.DialogResult]::OK) {
        $resultText = $box.Text
      }
    }
  } finally {
    try { $box.Text = "" } catch {}
    try { $form.Dispose() } catch {}
  }
  if ($null -eq $resultText) { return $null }
  return $resultText.Trim()
}

if ($Mode -eq "SelfTest") {
  function Assert-Step {
    param([bool]$Ok, [string]$Name)
    if (-not $Ok) { Write-Output ("rejected|" + $Name); exit 5 }
    Write-Output ("checked|" + $Name)
  }

  $synPub = "sb_publishable_ABCDEFGHIJabcdefghij12_ABCDEF12"
  Assert-Step ($synPub.Length -ge 40) "syn-pub-length"
  Assert-Step ($null -eq (Test-PublishableKeyFormat -Key $synPub)) "accept-sb-publishable"

  # Whitespace-padded paste (common clipboard artifact); validator trims internally
  $padded = "  `t" + $synPub + "  `r`n"
  Assert-Step ($null -eq (Test-PublishableKeyFormat -Key $padded)) "accept-whitespace-padded"

  # Paste-like full-length opaque key
  $pasteLike = "sb_publishable_1234567890abcdefghijAB_XYZ12345"
  Assert-Step ($pasteLike.Length -ge 40) "paste-like-full-length"
  Assert-Step ($null -eq (Test-PublishableKeyFormat -Key $pasteLike)) "accept-paste-like-full"

  Assert-Step ((Test-PublishableKeyFormat -Key "sb_publishable_x_y") -eq "sb-publishable-too-short") "reject-sb-publishable-short"
  Assert-Step ((Test-PublishableKeyFormat -Key "") -eq "empty") "reject-empty"
  Assert-Step ((Test-PublishableKeyFormat -Key "   ") -eq "empty") "reject-whitespace-only"
  # Constructed probe — must not embed a GitHub-detectable secret literal.
  $sbSecretProbe = "sb_secret_" + "TESTONLYPLACEHOLDERXX" + "_" + "TESTONLY"
  Assert-Step ((Test-PublishableKeyFormat -Key $sbSecretProbe) -eq "sb-secret-key") "reject-sb-secret"
  Assert-Step ((Test-PublishableKeyFormat -Key "x") -eq "unrecognized-publishable-format") "reject-single-char"

  $anonPayload = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('{"role":"anon","iss":"supabase","ref":"zapccpipwxduzlnvjdmy"}')).TrimEnd('=').Replace('+','-').Replace('/','_')
  $anonJwt = ("eyJhbGciOiJub25lIn0." + $anonPayload + "." + ("a" * 80))
  Assert-Step ($null -eq (Test-PublishableKeyFormat -Key $anonJwt)) "accept-anon-jwt"
  Assert-Step ($null -eq (Test-PublishableKeyFormat -Key ("  " + $anonJwt + "  ").Trim())) "accept-anon-jwt-trimmed"

  $srvPayload = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('{"role":"service_role","ref":"zapccpipwxduzlnvjdmy"}')).TrimEnd('=').Replace('+','-').Replace('/','_')
  $srvJwt = ("eyJhbGciOiJub25lIn0." + $srvPayload + "." + ("b" * 80))
  Assert-Step ((Test-PublishableKeyFormat -Key $srvJwt) -eq "jwt-service-role") "reject-service-role-jwt"
  Assert-Step ((Test-PublishableKeyFormat -Key "not-a-key-at-all-but-long-enough-xxxxxxxxxx") -eq "unrecognized-publishable-format") "reject-unrecognized"

  # GUI path without ShowDialog: preset textbox value (simulates successful paste)
  $fromGui = Read-PublishableKeyFromGui -PresetText ("  " + $synPub + "  ") -NoShow
  Assert-Step ($fromGui -eq $synPub) "gui-noshow-trim"
  Assert-Step ($null -eq (Test-PublishableKeyFormat -Key $fromGui)) "gui-noshow-format"
  $fromGui = $null

  $fromGuiOne = Read-PublishableKeyFromGui -PresetText "x" -NoShow
  Assert-Step ($fromGuiOne -eq "x") "gui-noshow-single-char-captured"
  Assert-Step ((Test-PublishableKeyFormat -Key $fromGuiOne) -eq "unrecognized-publishable-format") "gui-single-char-still-rejected"
  $fromGuiOne = $null

  Write-Output "self-test|ok"
  Write-Output "note|publishable-input|winforms-textbox-paste-capable"
  Write-Output "note|password-input|securestring-unchanged"
  exit 0
}

Write-Host "Bootstrap TEJAS Storage reader session for project $ProjectRef."
Write-Host "URL: $SupabaseUrl"
Write-Host "Prereq: SELECT-only policy applied for the dedicated Auth user."
Write-Host "Publishable key: Windows dialog (paste-capable). Password: SecureString (not displayed/stored)."
Write-Host "Do not paste secrets into chat or Git."
Write-Host ""

Write-Output "input|publishable-gui-awaiting"
$publishable = Read-PublishableKeyFromGui
if ([string]::IsNullOrWhiteSpace($publishable)) {
  Write-Output "rejected|publishable-cancelled-or-empty"
  exit 3
}
Write-Output ("publishable-length|" + $publishable.Length)
$formatFail = Test-PublishableKeyFormat -Key $publishable
if ($formatFail) {
  Write-Output ("rejected|publishable-format|" + $formatFail)
  $publishable = $null
  exit 3
}
Write-Output "input|publishable-accepted-format"

$email = Read-Host "Backup reader email"
$passSecure = Read-Host -AsSecureString "Backup reader password"
if ([string]::IsNullOrWhiteSpace($email) -or $email -notmatch '@') {
  Write-Output "rejected|email"
  $publishable = $null
  exit 3
}
if ($null -eq $passSecure -or $passSecure.Length -lt 8) {
  Write-Output "rejected|password-short"
  $publishable = $null
  exit 3
}

$password = $null
try {
  $password = ConvertFrom-SecureToPlain -Secure $passSecure

  $bodyObj = @{ email = $email; password = $password }
  $bodyJson = $bodyObj | ConvertTo-Json -Compress
  $uri = "$SupabaseUrl/auth/v1/token?grant_type=password"
  $old = $ProgressPreference
  $ProgressPreference = "SilentlyContinue"
  try {
    $resp = Invoke-RestMethod -Uri $uri -Method Post -Headers @{
      apikey = $publishable
      Authorization = "Bearer $publishable"
      "Content-Type" = "application/json"
    } -Body $bodyJson -TimeoutSec 60
  } catch {
    Write-Output "rejected|password-grant-failed"
    Write-Output "hint|confirm-publishable-key-email-password-and-auth-user-exist"
    exit 3
  } finally {
    $ProgressPreference = $old
  }

  if (-not $resp.access_token -or -not $resp.refresh_token) {
    Write-Output "rejected|token-response-incomplete"
    exit 3
  }

  $accessJson = Get-JwtPayloadJson -Jwt ([string]$resp.access_token)
  if (-not $accessJson) {
    Write-Output "rejected|access-token-inspect-failed"
    exit 3
  }
  if ($accessJson -match '"role"\s*:\s*"service_role"') {
    Write-Output "rejected|access-token-service-role"
    exit 3
  }
  if ($accessJson -notmatch '"role"\s*:\s*"authenticated"') {
    Write-Output "rejected|access-token-not-authenticated"
    exit 3
  }

  $blob = New-SessionBlob -Publishable $publishable -RefreshToken ([string]$resp.refresh_token)
  if (-not (Write-SessionCredential -Blob $blob)) {
    Write-Output "rejected|cred-write"
    exit 3
  }
} finally {
  if ($null -ne $passSecure) { $passSecure.Dispose() }
  $publishable = $null
  $password = $null
  $bodyJson = $null
  $resp = $null
  $accessJson = $null
}

if (-not (Test-PresentSession)) {
  Write-Output "rejected|verify-absent"
  exit 3
}

Write-Output "session|stored"
Write-Output ("target|" + $Target)
Write-Output "format|TEJASSTOR1"
Write-Output "stored-fields|publishable+refresh_token"
Write-Output "password|not-stored"
Write-Output "secret|not-printed"
exit 0
