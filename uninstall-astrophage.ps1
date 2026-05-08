# Astrophage Extender v1.0 -- Uninstaller
# "Sleep good, friend."
$ErrorActionPreference = "SilentlyContinue"

$CLAUDE_HOME = Join-Path $env:USERPROFILE ".claude"
$HOOKS_DIR = Join-Path $CLAUDE_HOME "hooks" "astrophage"
$SKILLS_DIR = Join-Path $CLAUDE_HOME "skills"
$SETTINGS = Join-Path $CLAUDE_HOME "settings.json"

Write-Host "`nAstrophage Extender -- Uninstall" -ForegroundColor Cyan

if (Test-Path $HOOKS_DIR) {
    Remove-Item $HOOKS_DIR -Recurse -Force
    Write-Host "  Removed crew (hook scripts)" -ForegroundColor Green
}

foreach ($skill in @("are-range-check", "are-hibernation", "are-xenonite-filter")) {
    $p = Join-Path $SKILLS_DIR $skill
    if (Test-Path $p) { Remove-Item $p -Recurse -Force; Write-Host "  Removed skill: $skill" -ForegroundColor Green }
}

if (Test-Path $SETTINGS) {
    $s = Get-Content $SETTINGS -Raw | ConvertFrom-Json
    if ($s.hooks) {
        $scriptNames = @("xenonite-filter", "petrova-gate", "sleep-advisor", "launch-sequence", "hibernation-prep")
        foreach ($eventName in @("PreToolUse", "PostToolUse", "SessionStart", "PreCompact")) {
            if ($s.hooks.PSObject.Properties.Name -contains $eventName) {
                $s.hooks.$eventName = @($s.hooks.$eventName | Where-Object {
                    $dominated = $false
                    foreach ($sn in $scriptNames) { if ($_.hooks | Where-Object { $_.command -like "*$sn*" }) { $dominated = $true } }
                    -not $dominated
                })
            }
        }
        $s | ConvertTo-Json -Depth 10 | Set-Content $SETTINGS -Encoding UTF8
        Write-Host "  Cleaned settings.json" -ForegroundColor Green
    }
}

foreach ($cmd in @("range.md", "fuel-check.md", "blip-a.md")) {
    $p = Join-Path (Get-Location) ".claude" "commands" $cmd
    if (Test-Path $p) { Remove-Item $p -Force; Write-Host "  Removed command: $cmd" -ForegroundColor Green }
}

Write-Host "`nSleep good, friend. Crew has gone home.`n" -ForegroundColor Cyan
