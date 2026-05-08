#!/usr/bin/env node
// Astrophage Extender v1.0
// petrova-gate.mjs -- PreToolUse hook (Read)
// "Petrova line show star getting dim. File read show context getting dim."

import { readFileSync, existsSync, statSync, appendFileSync, writeFileSync } from 'fs';
import { join, basename } from 'path';

const HOME = process.env.HOME || process.env.USERPROFILE || '';
const CONFIG_PATH = join(HOME, '.claude', 'hooks', 'astrophage', 'are-config.json');
const READS_PATH = join(HOME, '.claude', 'hooks', 'astrophage', 'session-reads.json');
const TRACKER_PATH = join(HOME, '.claude', 'hooks', 'astrophage', 'session-data.jsonl');

const DEFAULTS = {
  enabled: true,
  large_file_threshold_lines: 200,
  large_file_threshold_bytes: 8000,
  warn_on_reread: true,
  max_reread_before_warn: 1
};

function loadConfig() {
  try {
    if (existsSync(CONFIG_PATH)) {
      const raw = readFileSync(CONFIG_PATH, 'utf8');
      const loaded = { ...DEFAULTS, ...(JSON.parse(raw).read_gate || {}) };
      for (const k of ['large_file_threshold_lines', 'large_file_threshold_bytes', 'max_reread_before_warn']) {
        if (typeof loaded[k] !== 'number' || loaded[k] <= 0) loaded[k] = DEFAULTS[k];
      }
      return loaded;
    }
  } catch { /* defaults */ }
  return DEFAULTS;
}

function loadReads() {
  try {
    if (existsSync(READS_PATH)) {
      const raw = readFileSync(READS_PATH, 'utf8');
      const data = JSON.parse(raw);
      if (Date.now() - (data._ts || 0) > 6 * 60 * 60 * 1000) return { _ts: Date.now() };
      return data;
    }
  } catch { /* fresh */ }
  return { _ts: Date.now() };
}

function saveReads(reads) {
  try { writeFileSync(READS_PATH, JSON.stringify(reads)); } catch {}
}

function track(event, data) {
  try {
    appendFileSync(TRACKER_PATH,
      JSON.stringify({ ts: new Date().toISOString(), event, ...data }) + '\n');
  } catch {}
}

function countLines(filePath) {
  try { return readFileSync(filePath, 'utf8').split('\n').length; } catch { return -1; }
}

function getFileSize(filePath) {
  try { return statSync(filePath).size; } catch { return -1; }
}

function main() {
  if (process.env.ASTROPHAGE_DISABLED === '1') process.exit(0);
  const cfg = loadConfig();
  if (!cfg.enabled) process.exit(0);

  let input;
  try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
  if (input.tool_name !== 'Read') process.exit(0);

  const filePath = input.tool_input?.file_path;
  if (!filePath) process.exit(0);

  const hasViewRange = input.tool_input?.view_range != null;
  const reads = loadReads();
  const fileName = basename(filePath);
  const warnings = [];

  reads[filePath] = (reads[filePath] || 0) + 1;
  reads._ts = Date.now();

  if (cfg.warn_on_reread && reads[filePath] > cfg.max_reread_before_warn + 1) {
    warnings.push(fileName + ' read ' + reads[filePath] + ' times this session. Content unchanged -- reference earlier read.');
    track('petrova_duplicate_read', { file: fileName, count: reads[filePath] });
  }

  if (!hasViewRange) {
    const lines = countLines(filePath);
    const bytes = getFileSize(filePath);
    if (lines > cfg.large_file_threshold_lines || bytes > cfg.large_file_threshold_bytes) {
      warnings.push(fileName + ' is ' + lines + ' lines (' + Math.round(bytes / 1024) + 'KB). Full read costs ~' + Math.ceil(bytes / 4) + ' tokens. Consider view_range.');
      track('petrova_large_read', { file: fileName, lines, bytes });
    }
  }

  saveReads(reads);

  if (warnings.length > 0) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        additionalContext: '[Petrova Gate] ' + warnings.join(' | ')
      }
    }));
  }

  process.exit(0);
}

main();
