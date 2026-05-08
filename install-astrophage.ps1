# ==============================================================================
# Astrophage Extender v1.0 -- Installer (Windows)
# "You save Earth. I save Erid. Together, save everyone."
# ==============================================================================

$ErrorActionPreference = "Stop"
$script:passed = 0
$script:failed = 0
$script:warnings = 0

function Write-Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Write-Pass($msg) { Write-Host "  [PASS] $msg" -ForegroundColor Green; $script:passed++ }
function Write-Fail($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red; $script:failed++ }
function Write-Warn($msg) { Write-Host "  [WARN] $msg" -ForegroundColor Yellow; $script:warnings++ }

$ARE_HOME = $PSScriptRoot
$CLAUDE_HOME = Join-Path $env:USERPROFILE ".claude"
$HOOKS_DIR = Join-Path $CLAUDE_HOME "hooks" "astrophage"
$SKILLS_DIR = Join-Path $CLAUDE_HOME "skills"
$SETTINGS_GLOBAL = Join-Path $CLAUDE_HOME "settings.json"
$hooksDir_fwd = ($HOOKS_DIR -replace '\\', '/')

# --------------------------------------------------
# Launch Sequence Layer 0: Pre-flight
# --------------------------------------------------
Write-Step "Pre-flight checks"

$nodeVersion = $null
try { $nodeVersion = (node --version 2>$null) } catch {}
if ($nodeVersion) { Write-Pass "Node.js detected: $nodeVersion" }
else { Write-Fail "Node.js not found. Crew requires Node.js 18+."; exit 1 }

$claudeVersion = $null
try { $claudeVersion = (claude --version 2>$null) } catch {}
if ($claudeVersion) { Write-Pass "Claude Code detected: $claudeVersion" }
else { Write-Warn "Claude Code not in PATH. Hooks installed but cannot verify version." }

if (-not (Test-Path $CLAUDE_HOME)) {
    New-Item -ItemType Directory -Path $CLAUDE_HOME -Force | Out-Null
    Write-Pass "Created $CLAUDE_HOME"
} else { Write-Pass ".claude directory exists" }

# --------------------------------------------------
# Layer 1: Deploy crew (hook scripts)
# --------------------------------------------------
Write-Step "Deploying crew"

if (-not (Test-Path $HOOKS_DIR)) {
    New-Item -ItemType Directory -Path $HOOKS_DIR -Force | Out-Null
}

$hookFiles = @(
    "xenonite-filter.mjs",
    "petrova-gate.mjs",
    "sleep-advisor.mjs",
    "launch-sequence.mjs",
    "hibernation-prep.mjs",
    "range-analyzer.mjs",
    "blip-a-reporter.mjs",
    "are-config-default.json"
)

foreach ($f in $hookFiles) {
    $src = Join-Path $ARE_HOME "scripts" $f
    $dst = Join-Path $HOOKS_DIR $f
    if (Test-Path $src) {
        Copy-Item $src $dst -Force
        Write-Pass "Deployed $f"
    } else { Write-Fail "Missing source: $f" }
}

$configDst = Join-Path $HOOKS_DIR "are-config.json"
if (-not (Test-Path $configDst)) {
    Copy-Item (Join-Path $HOOKS_DIR "are-config-default.json") $configDst -Force
    Write-Pass "Created default are-config.json"
} else { Write-Warn "are-config.json exists -- not overwriting" }

# --------------------------------------------------
# Layer 2: Deploy skills
# --------------------------------------------------
Write-Step "Deploying skills"

$skillNames = @("are-range-check", "are-hibernation", "are-xenonite-filter")
foreach ($skill in $skillNames) {
    $srcDir = Join-Path $ARE_HOME "skills" $skill
    $dstDir = Join-Path $SKILLS_DIR $skill
    if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
    $skillMd = Join-Path $srcDir "SKILL.md"
    if (Test-Path $skillMd) {
        Copy-Item $skillMd (Join-Path $dstDir "SKILL.md") -Force
        Write-Pass "Skill: $skill"
    } else { Write-Fail "Missing SKILL.md for $skill" }
}

# --------------------------------------------------
# Layer 3: Configure hooks in settings.json
# --------------------------------------------------
Write-Step "Registering hooks"

if (Test-Path $SETTINGS_GLOBAL) {
    $settings = Get-Content $SETTINGS_GLOBAL -Raw | ConvertFrom-Json
} else { $settings = [PSCustomObject]@{} }

if (-not ($settings.PSObject.Properties.Name -contains "hooks")) {
    $settings | Add-Member -NotePropertyName "hooks" -NotePropertyValue ([PSCustomObject]@{})
}
$hooksObj = $settings.hooks

# Helper to register a hook
function Register-Hook($eventName, $matcherValue, $scriptName, $label) {
    if (-not ($hooksObj.PSObject.Properties.Name -contains $eventName)) {
        $hooksObj | Add-Member -NotePropertyName $eventName -NotePropertyValue @()
    }
    $existing = $hooksObj.$eventName | Where-Object {
        $_.hooks | Where-Object { $_.command -like "*$scriptName*" }
    }
    if (-not $existing) {
        $entry = @{ hooks = @( @{ type = "command"; command = "node `"$hooksDir_fwd/$scriptName`"" } ) }
        if ($matcherValue -ne $null) { $entry.matcher = $matcherValue }
        $hooksObj.$eventName = @($hooksObj.$eventName) + @($entry)
        Write-Pass "$label"
    } else { Write-Warn "$label already exists -- skipping" }
}

Register-Hook "PreToolUse" "Bash" "xenonite-filter.mjs" "PreToolUse -> Xenonite Filter"
Register-Hook "PreToolUse" "Read" "petrova-gate.mjs" "PreToolUse -> Petrova Gate"
Register-Hook "PostToolUse" "" "sleep-advisor.mjs" "PostToolUse -> Sleep Advisor"
Register-Hook "SessionStart" $null "launch-sequence.mjs" "SessionStart -> Launch Sequence"
Register-Hook "PreCompact" $null "hibernation-prep.mjs" "PreCompact -> Hibernation Prep"

$settings | ConvertTo-Json -Depth 10 | Set-Content $SETTINGS_GLOBAL -Encoding UTF8
Write-Pass "settings.json updated"

# --------------------------------------------------
# Layer 4: Deploy slash commands
# --------------------------------------------------
Write-Step "Deploying commands"

$repoCommandsDir = Join-Path (Get-Location) ".claude" "commands"
if (-not (Test-Path $repoCommandsDir)) {
    New-Item -ItemType Directory -Path $repoCommandsDir -Force | Out-Null
}

foreach ($cmd in @("range.md", "fuel-check.md", "blip-a.md")) {
    $src = Join-Path $ARE_HOME "commands" $cmd
    $dst = Join-Path $repoCommandsDir $cmd
    if (Test-Path $src) {
        Copy-Item $src $dst -Force
        Write-Pass "Command: /$($cmd -replace '\.md$','')"
    } else { Write-Fail "Missing: $cmd" }
}

Write-Host "`nNote: Commands are repo-level. Run installer from each repo where you want /range, /fuel-check, /blip-a." -ForegroundColor Yellow

# --------------------------------------------------
# Layer 5: Verify
# --------------------------------------------------
Write-Step "Verification"

$verifyPaths = @(
    (Join-Path $HOOKS_DIR "xenonite-filter.mjs"),
    (Join-Path $HOOKS_DIR "petrova-gate.mjs"),
    (Join-Path $HOOKS_DIR "sleep-advisor.mjs"),
    (Join-Path $HOOKS_DIR "launch-sequence.mjs"),
    (Join-Path $HOOKS_DIR "hibernation-prep.mjs"),
    (Join-Path $HOOKS_DIR "range-analyzer.mjs"),
    (Join-Path $HOOKS_DIR "blip-a-reporter.mjs"),
    (Join-Path $HOOKS_DIR "are-config.json"),
    (Join-Path $SKILLS_DIR "are-range-check" "SKILL.md"),
    (Join-Path $SKILLS_DIR "are-hibernation" "SKILL.md"),
    (Join-Path $SKILLS_DIR "are-xenonite-filter" "SKILL.md"),
    $SETTINGS_GLOBAL
)

foreach ($p in $verifyPaths) {
    if (Test-Path $p) { Write-Pass "Verified: $(Split-Path $p -Leaf)" }
    else { Write-Fail "Missing: $p" }
}

# --------------------------------------------------
# Summary
# --------------------------------------------------
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Astrophage Extender v1.0" -ForegroundColor Cyan
Write-Host "  Is good good good." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PASS: $($script:passed)  FAIL: $($script:failed)  WARN: $($script:warnings)" -ForegroundColor $(if ($script:failed -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($script:failed -eq 0) {
    Write-Host "  Run /range in Claude Code to verify." -ForegroundColor Green
    Write-Host ""
    Write-Host "  Crew:" -ForegroundColor White
    Write-Host "    Xenonite Filter  -> limits Bash output (PreToolUse)" -ForegroundColor Gray
    Write-Host "    Petrova Gate     -> guards file reads (PreToolUse)" -ForegroundColor Gray
    Write-Host "    Sleep Advisor    -> suggests /compact (PostToolUse)" -ForegroundColor Gray
    Write-Host "    Launch Sequence  -> budget briefing (SessionStart)" -ForegroundColor Gray
    Write-Host "    Hibernation Prep -> preserves context (PreCompact)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Commands: /range  /fuel-check  /blip-a" -ForegroundColor White
    Write-Host "  Config:   $HOOKS_DIR\are-config.json" -ForegroundColor Gray
    Write-Host "  Disable:  Set ASTROPHAGE_DISABLED=1 or edit config" -ForegroundColor Gray
} else {
    Write-Host "  Installation had failures. Review above." -ForegroundColor Red
}
Write-Host ""
