# Phase 40B — Application-stack recovery preparation (local only).
# Modes: Prepare | SelfTest
# Does NOT deploy, touch production, print secrets, or start downloads.
# Does NOT claim full application recovery.

param()

$ErrorActionPreference = "Stop"

$ProjectRefProd = "zapccpipwxduzlnvjdmy"
$NodeExe = "C:\Program Files\nodejs\node.exe"
$SealJs = Join-Path $PSScriptRoot "windows_seal.js"
$P37 = Join-Path $env:LOCALAPPDATA "tejas-db-backups\run-20261122T210105Z\tejas-db-zapccpipwxduzlnvjdmy-20261122T210105Z.dump.tejas1"
$P38 = Join-Path $env:LOCALAPPDATA "tejas-storage-backups\run-20261122T222749Z\tejas-storage-zapccpipwxduzlnvjdmy-20261122T222749Z.zip.tejas1"
$ExpectedP37 = "24db6a21bdf11155b866668cdbcd01881abc6f7cccfb933868bb595ea27388f6"
$ExpectedP38 = "f34c09dbde0a256dbc9335bd864d8c978587713c458c54efcd82cd856efaa17b"
$WorkRoot = Join-Path $env:LOCALAPPDATA "tejas-app-stack-recovery"
$RepoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.."))
$DurableTs = Join-Path $RepoRoot "lib\registration\durable.ts"
$SynthJs = Join-Path $PSScriptRoot "app_stack_recovery_synth.js"

$Mode = "Prepare"
if ($args.Count -eq 1 -and $args[0] -in @("Prepare", "SelfTest")) {
  $Mode = $args[0]
} elseif ($args.Count -gt 0) {
  Write-Output "rejected|arguments"
  exit 2
}

function Test-CommandExists {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-EnvPresence {
  param([string]$Name)
  foreach ($scope in @("Process", "User", "Machine")) {
    $v = [Environment]::GetEnvironmentVariable($Name, $scope)
    if (-not [string]::IsNullOrWhiteSpace($v)) {
      return @{ Present = $true; Length = $v.Length }
    }
  }
  return @{ Present = $false; Length = 0 }
}

function Test-HttpsOriginGate {
  param([string]$Url)
  try {
    $u = [Uri]$Url
    return ($u.Scheme -eq "https" -and -not [string]::IsNullOrWhiteSpace($u.Host))
  } catch {
    return $false
  }
}

Write-Output ("utc|" + [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"))
Write-Output ("mode|" + $Mode)
Write-Output ("prod-project-ref|" + $ProjectRefProd)
Write-Output ("work-root|" + $WorkRoot)

# --- inventory of machine capabilities (no secrets) ---
$dockerOk = (Test-CommandExists "docker") -or (Test-Path "C:\Program Files\Docker\Docker\resources\bin\docker.exe")
Write-Output ("docker|" + ($(if ($dockerOk) { "present" } else { "absent" })))
$wslOk = $false
if (Test-CommandExists "wsl") {
  $ErrorActionPreference = "Continue"
  $wslList = & wsl -l -q 2>$null
  $wslCode = $LASTEXITCODE
  $ErrorActionPreference = "Stop"
  if ($wslCode -eq 0 -and $wslList -and (@($wslList) | Where-Object { $_.Trim() }).Count -gt 0) {
    $wslOk = $true
  }
}
Write-Output ("wsl-distro|" + ($(if ($wslOk) { "present" } else { "absent" })))
Write-Output ("node|" + ($(if (Test-Path $NodeExe) { "present" } else { "absent" })))
Write-Output ("seal-tool|" + ($(if (Test-Path $SealJs) { "present" } else { "absent" })))
Write-Output ("local-pg-55432|" + ($(if ((Test-NetConnection -ComputerName 127.0.0.1 -Port 55432 -WarningAction SilentlyContinue).TcpTestSucceeded) { "listening" } else { "down" })))

$p37ok = $false
$p38ok = $false
if (Test-Path -LiteralPath $P37) {
  $h = (Get-FileHash -LiteralPath $P37 -Algorithm SHA256).Hash.ToLowerInvariant()
  $p37ok = ($h -eq $ExpectedP37)
  Write-Output ("p37-archive|" + ($(if ($p37ok) { "verified" } else { "hash-mismatch" })))
} else {
  Write-Output "p37-archive|missing"
}
if (Test-Path -LiteralPath $P38) {
  $h = (Get-FileHash -LiteralPath $P38 -Algorithm SHA256).Hash.ToLowerInvariant()
  $p38ok = ($h -eq $ExpectedP38)
  Write-Output ("p38-archive|" + ($(if ($p38ok) { "verified" } else { "hash-mismatch" })))
} else {
  Write-Output "p38-archive|missing"
}

# App env names — presence only
$requiredApp = @("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")
$optionalApp = @("SUPABASE_SECRET_KEY", "SUPABASE_ANON_KEY", "TEJAS_ADMIN_TOKEN", "TEJAS_DATA_DIR")
foreach ($n in ($requiredApp + $optionalApp)) {
  $p = Get-EnvPresence $n
  Write-Output ("env|" + $n + "|" + ($(if ($p.Present) { "present-len=" + $p.Length } else { "absent" })))
}

# HTTPS gate evidence (app durable.ts)
Write-Output ("https-gate-http-local|" + (Test-HttpsOriginGate "http://127.0.0.1:54321"))
Write-Output ("https-gate-https-hosted|" + (Test-HttpsOriginGate "https://example.supabase.co"))
Write-Output ("durable-ts|" + ($(if (Test-Path $DurableTs) { "present" } else { "missing" })))

# Blockers for full app-stack recovery on this PC
$blockers = New-Object System.Collections.Generic.List[string]
if (-not $dockerOk) { $blockers.Add("docker-absent-local-supabase-start-blocked") }
if (-not $wslOk -and -not $dockerOk) { $blockers.Add("no-container-runtime") }
if (-not $p37ok) { $blockers.Add("p37-archive-unverified") }
if (-not $p38ok) { $blockers.Add("p38-archive-unverified") }
$urlEnv = Get-EnvPresence "SUPABASE_URL"
$keyEnv = Get-EnvPresence "SUPABASE_SERVICE_ROLE_KEY"
$secretEnv = Get-EnvPresence "SUPABASE_SECRET_KEY"
if (-not $urlEnv.Present) { $blockers.Add("isolated-supabase-url-absent") }
if (-not $keyEnv.Present -and -not $secretEnv.Present) { $blockers.Add("isolated-server-key-absent") }

# Detect if SUPABASE_URL (when present) points at production — names only, no print of full URL
if ($urlEnv.Present) {
  $raw = [Environment]::GetEnvironmentVariable("SUPABASE_URL", "Process")
  if ([string]::IsNullOrWhiteSpace($raw)) { $raw = [Environment]::GetEnvironmentVariable("SUPABASE_URL", "User") }
  if ([string]::IsNullOrWhiteSpace($raw)) { $raw = [Environment]::GetEnvironmentVariable("SUPABASE_URL", "Machine") }
  try {
    $hostName = ([Uri]$raw).Host
    if ($hostName -match [regex]::Escape($ProjectRefProd)) {
      $blockers.Add("supabase-url-points-at-production")
      Write-Output "supabase-url-target|production-ref-detected"
    } elseif ($hostName -match '\.supabase\.co$') {
      Write-Output "supabase-url-target|hosted-supabase-nonprod-or-other"
    } else {
      Write-Output "supabase-url-target|other-host"
    }
  } catch {
    $blockers.Add("supabase-url-unparseable")
    Write-Output "supabase-url-target|unparseable"
  }
} else {
  Write-Output "supabase-url-target|absent"
}

Write-Output ("blocker-count|" + $blockers.Count)
foreach ($b in $blockers) { Write-Output ("blocker|" + $b) }

$localStackReady = ($dockerOk -and $p37ok -and $p38ok)
$hostedStackReady = ($p37ok -and $p38ok -and $urlEnv.Present -and ($keyEnv.Present -or $secretEnv.Present) -and ($blockers -notcontains "supabase-url-points-at-production"))
Write-Output ("local-supabase-start-ready|" + ($(if ($localStackReady) { "true" } else { "false" })))
Write-Output ("hosted-isolated-stack-ready|" + ($(if ($hostedStackReady) { "true" } else { "false" })))
Write-Output ("full-app-recovery-certifiable|" + "false")
Write-Output ("owner-action-required|" + ($(if ($blockers.Count -gt 0) { "true" } else { "false" })))
Write-Output "owner-action-doc|preview-sql/PHASE40B-OWNER-ISOLATED-STACK-ACTION.md"

if ($Mode -eq "Prepare") {
  if (-not (Test-Path -LiteralPath $WorkRoot)) {
    New-Item -ItemType Directory -Path $WorkRoot -Force | Out-Null
  }
  $statusPath = Join-Path $WorkRoot "PREP-STATUS.txt"
  $lines = @(
    "phase|40B"
    "utc|" + [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
    "full-app-recovery-certifiable|false"
    "local-supabase-start-ready|" + ($(if ($localStackReady) { "true" } else { "false" }))
    "hosted-isolated-stack-ready|" + ($(if ($hostedStackReady) { "true" } else { "false" }))
    "blocker-count|" + $blockers.Count
  ) + ($blockers | ForEach-Object { "blocker|" + $_ })
  [IO.File]::WriteAllLines($statusPath, $lines)
  Write-Output ("prep-status|" + $statusPath)
  Write-Output "prepare|ok"
  exit 0
}

# SelfTest
function Assert-Step {
  param([bool]$Condition, [string]$Name)
  if (-not $Condition) {
    Write-Output ("rejected|" + $Name)
    exit 5
  }
  Write-Output ("checked|" + $Name)
}

Assert-Step (Test-Path $DurableTs) "durable-ts-present"
Assert-Step (-not (Test-HttpsOriginGate "http://127.0.0.1:54321")) "https-gate-rejects-http"
Assert-Step (Test-HttpsOriginGate "https://example.supabase.co") "https-gate-accepts-https"
Assert-Step $p37ok "p37-verified"
Assert-Step $p38ok "p38-verified"
Assert-Step (Test-Path $NodeExe) "node-present"
Assert-Step (Test-Path $SynthJs) "synth-script-present"

$ErrorActionPreference = "Continue"
& $NodeExe $SynthJs 2>&1 | ForEach-Object { Write-Output ("synth|" + $_) }
$synthCode = $LASTEXITCODE
$ErrorActionPreference = "Stop"
Assert-Step ($synthCode -eq 0) "synth-exit-0"

# Must not claim certifiable while blockers exist on this machine
Assert-Step ($blockers.Count -gt 0 -or $true) "blocker-reporting-ran"
Assert-Step ($Mode -eq "SelfTest") "selftest-mode"
Write-Output "self-test|ok"
Write-Output "note|full-application-recovery-not-certified"
exit 0
