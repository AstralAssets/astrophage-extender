#!/bin/bash
# Astrophage Extender v1.0 -- Installer (macOS/Linux)
# "You save Earth. I save Erid. Together, save everyone."
set -e

ARE_HOME="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_HOME="$HOME/.claude"
HOOKS_DIR="$CLAUDE_HOME/hooks/astrophage"
SKILLS_DIR="$CLAUDE_HOME/skills"
SETTINGS="$CLAUDE_HOME/settings.json"

PASS=0; FAIL=0; WARN=0
pass() { echo "  [PASS] $1"; ((PASS++)); }
fail() { echo "  [FAIL] $1"; ((FAIL++)); }
warn() { echo "  [WARN] $1"; ((WARN++)); }
step() { echo ""; echo "=== $1 ==="; }

step "Pre-flight"
if command -v node &>/dev/null; then pass "Node.js: $(node --version)"; else fail "Node.js not found"; exit 1; fi
if command -v claude &>/dev/null; then pass "Claude Code detected"; else warn "Claude Code not in PATH"; fi
mkdir -p "$CLAUDE_HOME" && pass ".claude ready"

step "Deploying crew"
mkdir -p "$HOOKS_DIR"
for f in xenonite-filter.mjs petrova-gate.mjs sleep-advisor.mjs launch-sequence.mjs hibernation-prep.mjs range-analyzer.mjs blip-a-reporter.mjs are-config-default.json; do
    if [ -f "$ARE_HOME/scripts/$f" ]; then cp "$ARE_HOME/scripts/$f" "$HOOKS_DIR/$f" && pass "$f"; else fail "Missing: $f"; fi
done
if [ ! -f "$HOOKS_DIR/are-config.json" ]; then
    cp "$HOOKS_DIR/are-config-default.json" "$HOOKS_DIR/are-config.json" && pass "Default config created"
else warn "are-config.json exists -- not overwriting"; fi

step "Deploying skills"
for skill in are-range-check are-hibernation are-xenonite-filter; do
    mkdir -p "$SKILLS_DIR/$skill"
    if [ -f "$ARE_HOME/skills/$skill/SKILL.md" ]; then
        cp "$ARE_HOME/skills/$skill/SKILL.md" "$SKILLS_DIR/$skill/SKILL.md" && pass "Skill: $skill"
    else fail "Missing: $skill"; fi
done

step "Registering hooks"
if command -v node &>/dev/null; then
node -e "
const fs = require('fs');
const p = '$SETTINGS';
let s = {};
try { s = JSON.parse(fs.readFileSync(p, 'utf8')); } catch {}
if (!s.hooks) s.hooks = {};

function reg(evt, matcher, script) {
  if (!s.hooks[evt]) s.hooks[evt] = [];
  if (!s.hooks[evt].some(h => h.hooks?.some(x => x.command?.includes(script)))) {
    const entry = { hooks: [{ type: 'command', command: 'node \"$HOOKS_DIR/' + script + '\"' }] };
    if (matcher !== null) entry.matcher = matcher;
    s.hooks[evt].push(entry);
  }
}

reg('PreToolUse', 'Bash', 'xenonite-filter.mjs');
reg('PreToolUse', 'Read', 'petrova-gate.mjs');
reg('PostToolUse', '', 'sleep-advisor.mjs');
reg('SessionStart', null, 'launch-sequence.mjs');
reg('PreCompact', null, 'hibernation-prep.mjs');

fs.writeFileSync(p, JSON.stringify(s, null, 2));
console.log('OK');
" && pass "Hooks registered"
fi

step "Deploying commands"
mkdir -p ".claude/commands"
for cmd in range.md fuel-check.md blip-a.md; do
    if [ -f "$ARE_HOME/commands/$cmd" ]; then
        cp "$ARE_HOME/commands/$cmd" ".claude/commands/$cmd" && pass "/${cmd%.md}"
    else fail "Missing: $cmd"; fi
done

echo ""
echo "============================================"
echo "  Astrophage Extender v1.0"
echo "  Is good good good."
echo "============================================"
echo "  PASS: $PASS  FAIL: $FAIL  WARN: $WARN"
if [ "$FAIL" -eq 0 ]; then echo "  Run /range in Claude Code to verify.";
else echo "  Installation had failures."; fi
echo ""
