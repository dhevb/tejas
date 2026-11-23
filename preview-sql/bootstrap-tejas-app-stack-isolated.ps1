# Store isolated app-stack credentials in Credential Manager (local only).
# Format TEJASAPP1: url + server_key [+ optional db_password].
# Rejects production project ref. Never prints secrets.
# Modes: (interactive) | SelfTest

param()

$ErrorActionPreference = "Stop"

$ProductionRef = "zapccpipwxduzlnvjdmy"
$Target = "tejas-app-stack-isolated/server"
$UserName = "tejas-app-stack-isolated"
$Prefix = "TEJASAPP1"

$Mode = "Bootstrap"
if ($args.Count -eq 1 -and $args[0] -eq "SelfTest") { $Mode = "SelfTest" }
elseif ($args.Count -gt 0) { Write-Output "rejected|arguments"; exit 2 }

if (-not ("TejasAppStackCred" -as [type])) {
  Add-Type -TypeDefinition @"
using System; using System.Runtime.InteropServices;
public class TejasAppStackCred {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct NativeCredential {
    public int Flags; public int Type; public string TargetName; public string Comment;
    public long LastWritten; public int CredentialBlobSize; public IntPtr CredentialBlob;
    public int Persist; public int AttributeCount; public IntPtr Attributes;
    public string TargetAlias; public string UserName;
  }
  [DllImport("advapi32", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credential);
  [DllImport("advapi32", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool CredWrite(ref NativeCredential credential, uint flags);
  [DllImport("advapi32", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool CredDelete(string target, int type, int flags);
  [DllImport("advapi32")] public static extern void CredFree(IntPtr credential);
}
"@
}

function Test-IsolatedUrl {
  param([string]$Url)
  if ([string]::IsNullOrWhiteSpace($Url)) { return "empty" }
  try {
    $u = [Uri]$Url.Trim()
    if ($u.Scheme -ne "https") { return "not-https" }
    if ([string]::IsNullOrWhiteSpace($u.Host)) { return "no-host" }
    if ($u.Host -match [regex]::Escape($ProductionRef)) { return "production-ref-forbidden" }
    if ($u.Host -notmatch '\.supabase\.co$') { return "not-supabase-co-host" }
    return $null
  } catch { return "unparseable" }
}

function Normalize-ServerKeyInput {
  # Trim ends; strip BOM / zero-width chars that dashboards/clipboards sometimes prepend.
  param([string]$Key)
  if ($null -eq $Key) { return "" }
  $k = $Key.Trim()
  $k = $k.Trim([char]0xFEFF, [char]0x200B, [char]0x200C, [char]0x200D, [char]0x2060)
  return $k
}

function Test-ServerKeyShape {
  # Official opaque secret format (Supabase docs / self-hosted auth keys):
  #   sb_secret_<22-char-random>_<8-char-checksum>   (total length 41)
  # Hosted platform uses the same layout. Do NOT require length >= 50.
  param([string]$Key)
  if ([string]::IsNullOrWhiteSpace($Key)) { return "empty" }
  $k = Normalize-ServerKeyInput $Key
  if ([string]::IsNullOrWhiteSpace($k)) { return "empty" }
  foreach ($ch in $k.ToCharArray()) {
    if ([char]::IsWhiteSpace($ch)) { return "contains-whitespace" }
  }
  if ($k.Length -gt 4096) { return "too-long" }
  # Reject publishable — isolated app stack needs the project server/secret key.
  if ($k.StartsWith("sb_publishable_")) { return "publishable-not-server-key" }
  if ($k.StartsWith("sb_secret_")) {
    # Documented shape (preferred).
    if ($k -match '^sb_secret_[A-Za-z0-9_-]{22}_[A-Za-z0-9_-]{8}$') { return $null }
    # Minor platform variance (e.g. reported display length 43): still opaque secret form.
    if ($k -match '^sb_secret_[A-Za-z0-9_-]{20,24}_[A-Za-z0-9_-]{6,10}$') { return $null }
    if ($k.Length -lt 40) { return "sb-secret-too-short-likely-truncated" }
    return "sb-secret-malformed"
  }
  $parts = $k.Split('.')
  if ($parts.Count -eq 3 -and $k.StartsWith("eyJ")) {
    # Legacy service_role JWT (elevated) — acceptable as isolated server key.
    if ($k.Length -lt 100) { return "jwt-too-short" }
    return $null
  }
  if ($k.Length -lt 40) { return "too-short" }
  return "unrecognized-server-key-format"
}

function New-SessionBlob {
  param([string]$Url, [string]$ServerKey, [string]$DbPassword)
  $lines = @($Prefix, "url=$Url", "server_key=$ServerKey")
  if (-not [string]::IsNullOrWhiteSpace($DbPassword)) { $lines += "db_password=$DbPassword" }
  return ($lines -join "`n")
}

function Parse-SessionBlob {
  param([string]$Blob)
  if ([string]::IsNullOrWhiteSpace($Blob) -or -not $Blob.StartsWith($Prefix)) { return $null }
  $url = $null; $key = $null; $db = $null
  foreach ($line in ($Blob -split "`r?`n")) {
    if ($line -match '^url=(.+)$') { $url = $Matches[1] }
    elseif ($line -match '^server_key=(.+)$') { $key = $Matches[1] }
    elseif ($line -match '^db_password=(.+)$') { $db = $Matches[1] }
  }
  if ([string]::IsNullOrWhiteSpace($url) -or [string]::IsNullOrWhiteSpace($key)) { return $null }
  return @{ Url = $url; ServerKey = $key; DbPassword = $db }
}

function Write-Session {
  param([string]$Blob)
  $pointer = [Runtime.InteropServices.Marshal]::StringToCoTaskMemUni($Blob)
  try {
    $c = New-Object TejasAppStackCred+NativeCredential
    $c.Type = 1; $c.TargetName = $Target; $c.UserName = $UserName
    $c.CredentialBlobSize = $Blob.Length * 2; $c.CredentialBlob = $pointer
    $c.Persist = 2; $c.Comment = "tejas-isolated-app-stack v1 (not production)"
    return [TejasAppStackCred]::CredWrite([ref]$c, 0)
  } finally {
    [Runtime.InteropServices.Marshal]::FreeCoTaskMem($pointer)
  }
}

function Read-Session {
  $pointer = [IntPtr]::Zero
  if (-not [TejasAppStackCred]::CredRead($Target, 1, 0, [ref]$pointer)) { return $null }
  try {
    $n = [Runtime.InteropServices.Marshal]::PtrToStructure($pointer, [type][TejasAppStackCred+NativeCredential])
    if ($n.UserName -ne $UserName) { return $null }
    $chars = [int]($n.CredentialBlobSize / 2)
    $blob = [Runtime.InteropServices.Marshal]::PtrToStringUni($n.CredentialBlob, $chars)
    return (Parse-SessionBlob $blob)
  } finally { [TejasAppStackCred]::CredFree($pointer) }
}

function Initialize-SecretGui {
  Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop
  Add-Type -AssemblyName System.Drawing -ErrorAction Stop
  [System.Windows.Forms.Application]::EnableVisualStyles()
}

function Get-ClipboardTextSafe {
  # Prefer WinForms clipboard (Unicode). Never logs content.
  try {
    if ([System.Windows.Forms.Clipboard]::ContainsText()) {
      return [System.Windows.Forms.Clipboard]::GetText([System.Windows.Forms.TextDataFormat]::UnicodeText)
    }
  } catch {}
  try {
    return [System.Windows.Forms.Clipboard]::GetText()
  } catch {
    return $null
  }
}

function Read-GuiSecret {
  # Masked field + explicit "Paste from Clipboard" (bypasses password-TextBox paste truncation).
  # Shows length only. Never writes the secret to disk/host output.
  param(
    [string]$Title,
    [string]$Label,
    [string]$PresetText = $null,
    [switch]$NoShow,
    [switch]$Optional
  )
  Initialize-SecretGui
  $ui = @{
    Box = $null
    Len = $null
    Form = $null
    Optional = [bool]$Optional
  }

  $form = New-Object System.Windows.Forms.Form
  $form.Text = $Title
  $form.Size = New-Object System.Drawing.Size(680, 260)
  $form.StartPosition = "CenterScreen"
  $form.FormBorderStyle = "FixedDialog"
  $form.MaximizeBox = $false
  $form.MinimizeBox = $false
  $form.TopMost = $true
  $ui.Form = $form

  $lbl = New-Object System.Windows.Forms.Label
  $lbl.Location = New-Object System.Drawing.Point(16, 12)
  $lbl.Size = New-Object System.Drawing.Size(630, 40)
  $lbl.Text = $Label
  $form.Controls.Add($lbl)

  $box = New-Object System.Windows.Forms.TextBox
  $box.Location = New-Object System.Drawing.Point(16, 60)
  $box.Size = New-Object System.Drawing.Size(630, 28)
  $box.UseSystemPasswordChar = $true
  $box.Multiline = $false
  $box.AcceptsTab = $false
  $box.ShortcutsEnabled = $true
  $box.MaxLength = 8192
  if (-not [string]::IsNullOrEmpty($PresetText)) { $box.Text = $PresetText }
  $form.Controls.Add($box)
  $ui.Box = $box

  $lenLabel = New-Object System.Windows.Forms.Label
  $lenLabel.Location = New-Object System.Drawing.Point(16, 96)
  $lenLabel.Size = New-Object System.Drawing.Size(400, 24)
  $lenLabel.Text = "Length: 0 (value never shown)"
  $form.Controls.Add($lenLabel)
  $ui.Len = $lenLabel

  $box.add_TextChanged({
    param($sender, $e)
    $ui.Len.Text = ("Length: " + $ui.Box.Text.Length + " (value never shown)")
  }.GetNewClosure())
  $ui.Len.Text = ("Length: " + $box.Text.Length + " (value never shown)")

  $paste = New-Object System.Windows.Forms.Button
  $paste.Text = "Paste from Clipboard"
  $paste.Location = New-Object System.Drawing.Point(16, 130)
  $paste.Size = New-Object System.Drawing.Size(180, 32)
  $paste.add_Click({
    param($sender, $e)
    $clip = Get-ClipboardTextSafe
    if ([string]::IsNullOrEmpty($clip)) {
      [System.Windows.Forms.MessageBox]::Show(
        "Clipboard is empty or unavailable. Copy the full key in the dashboard first, then click Paste from Clipboard.",
        "TEJAS",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Information
      ) | Out-Null
      return
    }
    # Full clipboard assignment (end-trim only). Password TextBox Ctrl+V is unreliable for long secrets.
    $ui.Box.Text = $clip.Trim()
    $clip = $null
  }.GetNewClosure())
  $form.Controls.Add($paste)

  $hint = New-Object System.Windows.Forms.Label
  $hint.Location = New-Object System.Drawing.Point(210, 134)
  $hint.Size = New-Object System.Drawing.Size(430, 40)
  $hint.Text = "Use Paste from Clipboard for long secrets (avoids masked-field truncation). Confirm Length before OK."
  $form.Controls.Add($hint)

  $ok = New-Object System.Windows.Forms.Button
  $ok.Text = "OK"
  $ok.Location = New-Object System.Drawing.Point(460, 180)
  $ok.Size = New-Object System.Drawing.Size(80, 28)
  $ok.add_Click({
    param($sender, $e)
    if ($ui.Optional -and [string]::IsNullOrWhiteSpace($ui.Box.Text)) {
      $ui.Form.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
      $ui.Form.Close()
      return
    }
    $ui.Form.DialogResult = [System.Windows.Forms.DialogResult]::OK
    $ui.Form.Close()
  }.GetNewClosure())
  $form.Controls.Add($ok)
  $form.AcceptButton = $ok

  $cancel = New-Object System.Windows.Forms.Button
  $cancel.Text = "Cancel"
  $cancel.Location = New-Object System.Drawing.Point(556, 180)
  $cancel.Size = New-Object System.Drawing.Size(80, 28)
  $cancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
  $form.Controls.Add($cancel)
  $form.CancelButton = $cancel

  $resultText = $null
  try {
    if ($NoShow) {
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
    $ui.Box = $null; $ui.Len = $null; $ui.Form = $null
  }
  if ($null -eq $resultText) { return $null }
  return $resultText.Trim()
}

function New-SyntheticServerKey {
  # Dummy sb_secret_ shape only — never a real key.
  # Default matches docs: 22-char random + _ + 8-char checksum (total 41).
  param([int]$BodyLen = 22, [int]$SuffixLen = 8)
  $alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-"
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $total = $BodyLen + $SuffixLen
  $bytes = New-Object byte[] $total
  $rng.GetBytes($bytes)
  $chars = New-Object char[] $total
  for ($i = 0; $i -lt $total; $i++) {
    $chars[$i] = $alphabet[$bytes[$i] % $alphabet.Length]
  }
  [Array]::Clear($bytes, 0, $bytes.Length)
  $body = -join $chars[0..($BodyLen - 1)]
  $suf = -join $chars[$BodyLen..($total - 1)]
  $key = "sb_secret_${body}_${suf}"
  $body = $null; $suf = $null
  for ($i = 0; $i -lt $chars.Length; $i++) { $chars[$i] = [char]0 }
  return $key
}

function Get-SecretSha256Hex {
  param([string]$Value)
  $bytes = [Text.Encoding]::UTF8.GetBytes($Value)
  try {
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
      $hash = $sha.ComputeHash($bytes)
      return ([BitConverter]::ToString($hash) -replace '-', '').ToLowerInvariant()
    } finally { $sha.Dispose() }
  } finally {
    if ($bytes.Length -gt 0) { [Array]::Clear($bytes, 0, $bytes.Length) }
  }
}

function Write-SessionToTarget {
  param([string]$Blob, [string]$CredTarget, [string]$CredUser)
  $pointer = [Runtime.InteropServices.Marshal]::StringToCoTaskMemUni($Blob)
  try {
    $c = New-Object TejasAppStackCred+NativeCredential
    $c.Type = 1; $c.TargetName = $CredTarget; $c.UserName = $CredUser
    $c.CredentialBlobSize = $Blob.Length * 2; $c.CredentialBlob = $pointer
    $c.Persist = 1
    $c.Comment = "tejas-isolated-app-stack selftest (disposable)"
    return [TejasAppStackCred]::CredWrite([ref]$c, 0)
  } finally {
    [Runtime.InteropServices.Marshal]::FreeCoTaskMem($pointer)
  }
}

function Read-SessionFromTarget {
  param([string]$CredTarget, [string]$CredUser)
  $pointer = [IntPtr]::Zero
  if (-not [TejasAppStackCred]::CredRead($CredTarget, 1, 0, [ref]$pointer)) { return $null }
  try {
    $n = [Runtime.InteropServices.Marshal]::PtrToStructure($pointer, [type][TejasAppStackCred+NativeCredential])
    if ($n.UserName -ne $CredUser) { return $null }
    $chars = [int]($n.CredentialBlobSize / 2)
    $blob = [Runtime.InteropServices.Marshal]::PtrToStringUni($n.CredentialBlob, $chars)
    return (Parse-SessionBlob $blob)
  } finally { [TejasAppStackCred]::CredFree($pointer) }
}

Write-Output ("utc|" + [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"))
Write-Output ("cm-target|" + $Target)

if ($Mode -eq "SelfTest") {
  function Assert-Step([bool]$c, [string]$n) {
    if (-not $c) { Write-Output ("rejected|" + $n); exit 5 }
    Write-Output ("checked|" + $n)
  }
  Assert-Step ((Test-IsolatedUrl "") -eq "empty") "reject-empty-url"
  Assert-Step ((Test-IsolatedUrl "http://x.supabase.co") -eq "not-https") "reject-http"
  Assert-Step ((Test-IsolatedUrl "https://$ProductionRef.supabase.co") -eq "production-ref-forbidden") "reject-production"
  Assert-Step ($null -eq (Test-IsolatedUrl "https://abcd1234xyz.supabase.co")) "accept-other-ref"
  Assert-Step ((Test-ServerKeyShape "short") -eq "too-short") "reject-short-key"
  Assert-Step ((Test-ServerKeyShape ("sb_secret_" + "shortvalue")) -eq "sb-secret-too-short-likely-truncated") "reject-truncated-secret"
  Assert-Step ((Test-ServerKeyShape "sb_publishable_aaaaaaaaaaaaaaaaaaaa_bbbbbbbb") -eq "publishable-not-server-key") "reject-publishable"
  Assert-Step ((Test-ServerKeyShape ("sb_secret_" + "bad!!format_____________________")) -eq "sb-secret-malformed") "reject-malformed-secret"

  # Documented length 41 (22 + _ + 8)
  $syn41 = New-SyntheticServerKey -BodyLen 22 -SuffixLen 8
  Assert-Step ($syn41.Length -eq 41) "syn-doc-length-41"
  Assert-Step ($null -eq (Test-ServerKeyShape $syn41)) "accept-doc-length-41"
  Write-Output ("syn-length-41|" + $syn41.Length)

  # Owner-reported display length ~43: slightly longer random segment still accepted
  $syn43 = New-SyntheticServerKey -BodyLen 24 -SuffixLen 8
  Assert-Step ($syn43.Length -eq 43) "syn-variant-length-43"
  Assert-Step ($null -eq (Test-ServerKeyShape $syn43)) "accept-variant-length-43"
  Write-Output ("syn-length-43|" + $syn43.Length)

  # Old incorrect rule (>=50) must not reject valid 41-char secrets
  Assert-Step ($null -eq (Test-ServerKeyShape $syn41)) "no-false-reject-under-50"

  # Whitespace / clipboard newlines: normalize then accept
  Assert-Step ($null -eq (Test-ServerKeyShape ("  " + $syn41 + "`r`n"))) "accept-padded-clipboard-newlines"
  Assert-Step ((Test-ServerKeyShape ($syn41.Substring(0, 20) + " " + $syn41.Substring(20))) -eq "contains-whitespace") "reject-internal-whitespace"
  Assert-Step ($null -eq (Test-ServerKeyShape ([char]0xFEFF + $syn41))) "accept-bom-stripped"

  # GUI NoShow trim + exact preservation (use 41-char doc key)
  $syn = $syn41
  $synSha = Get-SecretSha256Hex $syn
  $padded = "  `t" + $syn + "  `r`n"
  $fromGui = Read-GuiSecret -Title "selftest" -Label "selftest" -PresetText $padded -NoShow
  Assert-Step ($fromGui.Length -eq $syn.Length) "gui-noshow-length-preserved"
  Assert-Step ($fromGui -eq $syn) "gui-noshow-exact-match"
  Assert-Step ((Get-SecretSha256Hex $fromGui) -eq $synSha) "gui-noshow-sha256-match"
  Assert-Step ($null -eq (Test-ServerKeyShape $fromGui)) "gui-noshow-format-ok"
  $fromGui = $null; $padded = $null

  $clipSim = $syn + "`r`n"
  Assert-Step ((Normalize-ServerKeyInput $clipSim) -eq $syn) "clipboard-normalize-preserves-body"
  $clipSim = $null

  $blob = New-SessionBlob -Url "https://abcd1234xyz.supabase.co" -ServerKey $syn -DbPassword "dbpass-synthetic"
  $parsed = Parse-SessionBlob $blob
  Assert-Step ($parsed.ServerKey -eq $syn) "parse-key-exact"
  Assert-Step ($parsed.ServerKey.Length -eq 41) "parse-key-length-41"
  Assert-Step ((Get-SecretSha256Hex $parsed.ServerKey) -eq $synSha) "parse-key-sha256"
  Assert-Step ($parsed.DbPassword -eq "dbpass-synthetic") "parse-db"
  Assert-Step ($null -eq (Parse-SessionBlob "BAD")) "reject-bad-blob"
  $parsed = $null

  $testTarget = "tejas-app-stack-isolated/selftest"
  $testUser = "tejas-app-stack-isolated-selftest"
  [void][TejasAppStackCred]::CredDelete($testTarget, 1, 0)
  Assert-Step (Write-SessionToTarget -Blob $blob -CredTarget $testTarget -CredUser $testUser) "cm-selftest-write"
  $blob = $null
  $round = Read-SessionFromTarget -CredTarget $testTarget -CredUser $testUser
  Assert-Step ($round.ServerKey -eq $syn) "cm-selftest-exact"
  Assert-Step ($round.ServerKey.Length -eq 41) "cm-selftest-length-41"
  Assert-Step ((Get-SecretSha256Hex $round.ServerKey) -eq $synSha) "cm-selftest-sha256"
  $round = $null
  Assert-Step ([TejasAppStackCred]::CredDelete($testTarget, 1, 0)) "cm-selftest-delete"
  Assert-Step ($null -eq (Read-SessionFromTarget -CredTarget $testTarget -CredUser $testUser)) "cm-selftest-gone"

  $syn = $null; $syn41 = $null; $syn43 = $null; $synSha = $null
  Write-Output "self-test|ok"
  Write-Output "fix|accept-official-sb_secret-22-8-length-41"
  exit 0
}

Write-Output "prompt|isolated-https-url"
$url = Read-Host "Isolated SUPABASE_URL (https://<ref>.supabase.co, NOT production)"
$urlReason = Test-IsolatedUrl $url
if ($urlReason) {
  Write-Output ("rejected|url|" + $urlReason)
  exit 4
}
$url = $url.Trim().TrimEnd('/')

Write-Output "prompt|isolated-server-key-gui"
Write-Output "hint|use-Paste-from-Clipboard-button-then-confirm-Length"
$key = Read-GuiSecret -Title "TEJAS Isolated App Stack" -Label "Isolated server key (sb_secret_… or legacy service_role JWT) — use Paste from Clipboard"
if ($null -eq $key) { Write-Output "rejected|cancelled"; exit 4 }
$key = Normalize-ServerKeyInput $key
Write-Output ("input-length|" + $key.Length)
$keyReason = Test-ServerKeyShape $key
if ($keyReason) { $key = $null; Write-Output ("rejected|server-key|" + $keyReason); exit 4 }
Write-Output "input|server-key-accepted-format"

Write-Output "prompt|optional-db-password-gui"
$db = Read-GuiSecret -Title "TEJAS Isolated DB Password (optional)" -Label "Isolated DB password for pg_restore (optional — Cancel / empty to skip)" -Optional
if ($null -eq $db) { $db = "" }

$blob = New-SessionBlob -Url $url -ServerKey $key.Trim() -DbPassword $db
$key = $null; $db = $null
if (-not (Write-Session $blob)) { $blob = $null; Write-Output "rejected|cred-write"; exit 4 }
$blob = $null

$back = Read-Session
if ($null -eq $back) { Write-Output "rejected|cred-readback"; exit 4 }
$backUrlReason = Test-IsolatedUrl $back.Url
if ($backUrlReason) { Write-Output ("rejected|stored-url|" + $backUrlReason); exit 4 }
Write-Output ("stored-host|" + ([Uri]$back.Url).Host)
Write-Output ("stored-server-key-length|" + $back.ServerKey.Length)
Write-Output ("stored-has-db-password|" + (-not [string]::IsNullOrWhiteSpace($back.DbPassword)))
$back = $null
Write-Output "session|stored"
Write-Output "next|resume Phase 40B application-stack recovery"
exit 0
