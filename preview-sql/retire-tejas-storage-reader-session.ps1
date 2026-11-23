# Retire Phase 38 Storage-reader Credential Manager session (local only).
# Does NOT drop the production SELECT policy (see held SQL).
# Modes: Status | Retire | SelfTest

param()

$ErrorActionPreference = "Stop"
$ProjectRef = "zapccpipwxduzlnvjdmy"
$Target = "tejas-storage-reader/$ProjectRef"
$UserName = "tejas-storage-reader"

$Mode = "Status"
if ($args.Count -eq 1 -and $args[0] -in @("Status", "Retire", "SelfTest")) { $Mode = $args[0] }
elseif ($args.Count -gt 0) { Write-Output "rejected|arguments"; exit 2 }

if (-not ("TejasRetireStorCred" -as [type])) {
  Add-Type -TypeDefinition @"
using System; using System.Runtime.InteropServices;
public class TejasRetireStorCred {
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

function Test-Present {
  $p = [IntPtr]::Zero
  $f = [TejasRetireStorCred]::CredRead($Target, 1, 0, [ref]$p)
  if ($f -and $p -ne [IntPtr]::Zero) { [TejasRetireStorCred]::CredFree($p) }
  return [bool]$f
}

Write-Output ("utc|" + [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"))
Write-Output ("cm-target|" + $Target)

if ($Mode -eq "SelfTest") {
  Write-Output ("checked|target-name|" + ($Target -eq "tejas-storage-reader/$ProjectRef"))
  Write-Output "self-test|ok"
  Write-Output "note|SelfTest does not delete credentials"
  exit 0
}

$present = Test-Present
Write-Output ("storage-reader-cm|" + ($(if ($present) { "present" } else { "absent" })))

if ($Mode -eq "Status") {
  Write-Output "status|ok"
  Write-Output "held-policy-sql|preview-sql/PHASE38-RETIRE-STORAGE-READER-SELECT-POLICY.sql"
  exit 0
}

if (-not $present) {
  Write-Output "retire|already-absent"
  exit 0
}

if (-not [TejasRetireStorCred]::CredDelete($Target, 1, 0)) {
  Write-Output "rejected|cred-delete"
  exit 4
}
$still = Test-Present
Write-Output ("storage-reader-cm-after|" + ($(if ($still) { "present" } else { "absent" })))
if ($still) { Write-Output "rejected|still-present"; exit 4 }
Write-Output "retire|ok"
Write-Output "next|owner-may-apply-held-policy-drop-sql-after-review"
exit 0
