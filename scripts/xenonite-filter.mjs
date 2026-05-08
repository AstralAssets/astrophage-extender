#!/usr/bin/env node
// Astrophage Extender v1.0
// xenonite-filter.mjs -- PreToolUse hook (Bash)
// "Xenonite very strong. Filter radiation. Keep crew safe inside."
// Shapes Bash commands to limit output before execution.
// No npm dependencies. Node.js built-ins only.

import { readFileSync, existsSync, appendFileSync } from 'fs';
import { join } from 'path';

const HOME = process.env.HOME || process.env.USERPROFILE || '';
const CONFIG_PATH = join(HOME, '.claude', 'hooks', 'astrophage', 'are-config.json');
const TRACKER_PATH = join(HOME, '.claude', 'hooks', 'astrophage', 'session-data.jsonl');

const DEFAULTS = {
  enabled: true,
  grep_max_matches: 30,
  cat_max_lines: 300,
  git_log_max: 40,
  git_diff_max_lines: 400,
  find_max_results: 50,
  never_modify: [
    'jest', 'vitest', 'pytest', 'mocha', 'cargo test', 'go test',
    'npm test', 'npx test', 'npm run', 'cargo build', 'make',
    'cmake', 'webpack', 'rollup', 'tsc', 'npm install', 'pip install',
    'cargo add', 'apt', 'brew', 'docker', 'kubectl'
  ]
};

function loadConfig() {
  try {
    if (existsSync(CONFIG_PATH)) {
      const raw = readFileSync(CONFIG_PATH, 'utf8');
      const loaded = { ...DEFAULTS, ...(JSON.parse(raw).output_shaper || {}) };
      for (const k of ['grep_max_matches', 'cat_max_lines', 'git_log_max', 'git_diff_max_lines', 'find_max_results']) {
        if (typeof loaded[k] !== 'number' || loaded[k] <= 0) loaded[k] = DEFAULTS[k];
      }
      return loaded;
    }
  } catch { /* defaults */ }
  return DEFAULTS;
}

function track(event, data) {
  try {
    appendFileSync(TRACKER_PATH,
      JSON.stringify({ ts: new Date().toISOString(), event, ...data }) + '\n');
  } catch { /* non-critical */ }
}

function isSafeToModify(cmd, cfg) {
  const lower = cmd.toLowerCase().trim();
  for (const blocked of cfg.never_modify) {
    if (lower.includes(blocked)) return false;
  }
  if (cmd.includes('|') || cmd.includes('>') || cmd.includes('&&') || cmd.includes(';')) return false;
  if (/\b(head|tail|wc|less|more)\b/.test(cmd)) return false;
  return true;
}

function shapeBashCommand(cmd, cfg) {
  const t = cmd.trim();
  if (!isSafeToModify(t, cfg)) return null;

  if (/^(cat|type)\s+/.test(t)) return t + ' | head -' + cfg.cat_max_lines;
  if (/^(grep|rg)\b/.test(t) && !/\s-[clL]\b/.test(t) && !/-m\s*\d/.test(t))
    return t + ' -m ' + cfg.grep_max_matches;
  if (/^find\s+/.test(t)) return t + ' | head -' + cfg.find_max_results;
  if (/^git\s+log\b/.test(t) && !/-n\s*\d/.test(t) && !/--max-count/.test(t))
    return t + ' -n ' + cfg.git_log_max;
  if (/^git\s+diff\b/.test(t)) return t + ' | head -' + cfg.git_diff_max_lines;
  if (/^(ls\s+-[a-zA-Z]*R|tree)\b/.test(t)) return t + ' | head -100';
  if (/^(npm\s+ls|pip\s+list|cargo\s+tree|apt\s+list)\b/.test(t)) return t + ' | head -' + cfg.find_max_results;

  return null;
}

function main() {
  if (process.env.ASTROPHAGE_DISABLED === '1') process.exit(0);
  const cfg = loadConfig();
  if (!cfg.enabled) process.exit(0);

  let input;
  try { input = JSON.parse(readFileSync(0, 'utf8')); }
  catch { process.exit(0); }

  if (input.tool_name === 'Bash') {
    const orig = input.tool_input?.command;
    if (!orig) { process.exit(0); return; }

    const shaped = shapeBashCommand(orig, cfg);
    if (shaped && shaped !== orig) {
      track('xenonite_shaped', { original: orig.slice(0, 100), shaped: shaped.slice(0, 100) });
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'allow',
          permissionDecisionReason: 'Xenonite Filter: Output limited to preserve range.',
          updatedInput: { command: shaped },
          additionalContext: '[Xenonite Filter] Command output limited. Set ASTROPHAGE_DISABLED=1 to bypass.'
        }
      }));
      process.exit(0);
      return;
    }
  }

  process.exit(0);
}

main();
