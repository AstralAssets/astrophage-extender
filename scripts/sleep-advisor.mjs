#!/usr/bin/env node
// Astrophage Extender v1.0
// sleep-advisor.mjs -- PostToolUse hook
// "Rocky go sleep now. Wake up when arrive."

import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'fs';
import { join } from 'path';

const HOME = process.env.HOME || process.env.USERPROFILE || '';
const CONFIG_PATH = join(HOME, '.claude', 'hooks', 'astrophage', 'are-config.json');
const STATE_PATH = join(HOME, '.claude', 'hooks', 'astrophage', 'advisor-state.json');
const TRACKER_PATH = join(HOME, '.claude', 'hooks', 'astrophage', 'session-data.jsonl');

const DEFAULTS = { enabled: true, tool_call_threshold: 40, phase_detection: true, ecc_deference: true };

function loadConfig() {
  try {
    if (existsSync(CONFIG_PATH)) {
      const loaded = { ...DEFAULTS, ...(JSON.parse(readFileSync(CONFIG_PATH, 'utf8')).compact_advisor || {}) };
      if (typeof loaded.tool_call_threshold !== 'number' || loaded.tool_call_threshold <= 0) loaded.tool_call_threshold = DEFAULTS.tool_call_threshold;
      return loaded;
    }
  } catch {} return DEFAULTS;
}

function loadState() {
  try {
    if (existsSync(STATE_PATH)) {
      const s = JSON.parse(readFileSync(STATE_PATH, 'utf8'));
      if (Date.now() - (s.last_update || 0) > 6 * 60 * 60 * 1000)
        return { call_count: 0, last_update: Date.now(), last_suggestion: 0, tools_since_suggestion: 0 };
      return s;
    }
  } catch {} return { call_count: 0, last_update: Date.now(), last_suggestion: 0, tools_since_suggestion: 0 };
}

function saveState(s) { try { writeFileSync(STATE_PATH, JSON.stringify(s)); } catch {} }

function track(event, data) {
  try { appendFileSync(TRACKER_PATH, JSON.stringify({ ts: new Date().toISOString(), event, ...data }) + '\n'); } catch {}
}

function detectECC() {
  return [join(HOME, '.claude', 'skills', 'strategic-compact'), join(HOME, '.agents', 'skills', 'strategic-compact')]
    .some(p => existsSync(p));
}

function detectBoundary(input) {
  const cmd = (input.tool_input?.command || '').toLowerCase();
  if (input.tool_name === 'TodoWrite' || /todo/i.test(cmd)) return 'planning_complete';
  if (/\b(jest|vitest|pytest|mocha|npm test|cargo test)\b/.test(cmd)) return 'test_run';
  if (/\bgit\s+(checkout|switch|commit|merge)\b/.test(cmd)) return 'git_operation';
  return null;
}

function main() {
  if (process.env.ASTROPHAGE_DISABLED === '1') process.exit(0);
  const cfg = loadConfig();
  if (!cfg.enabled) process.exit(0);
  if (cfg.ecc_deference && detectECC()) process.exit(0);

  let input;
  try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }

  const state = loadState();
  state.call_count++;
  state.tools_since_suggestion++;
  state.last_update = Date.now();

  if (state.call_count >= cfg.tool_call_threshold && state.tools_since_suggestion >= 15) {
    let reason = 'Fuel check: ' + state.call_count + ' tool calls this mission.';
    let suggest = true;

    if (cfg.phase_detection) {
      const b = detectBoundary(input);
      if (b === 'planning_complete') reason = 'Planning phase complete. Good time to hibernate before implementation.';
      else if (b === 'test_run') reason = 'Test run complete. Good boundary for hibernation.';
      else if (b === 'git_operation') reason = 'Git operation. Stale context can be compacted.';
      else if (state.call_count < cfg.tool_call_threshold * 1.5) suggest = false;
    }

    if (suggest) {
      track('sleep_suggestion', { call_count: state.call_count, reason });
      state.last_suggestion = Date.now();
      state.tools_since_suggestion = 0;
      process.stdout.write(JSON.stringify({
        additionalContext: '[Sleep Advisor] ' + reason + ' Consider /compact to extend range.'
      }));
    }
  }

  track('tool_call', { tool: input.tool_name || 'unknown', count: state.call_count });
  saveState(state);
  process.exit(0);
}

main();
