#!/usr/bin/env node
// Astrophage Extender v1.0
// launch-sequence.mjs -- SessionStart hook
// "Spin up. Check fuel. Begin mission."

import { writeFileSync, existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const HOME = process.env.HOME || process.env.USERPROFILE || '';
const HOOKS_DIR = join(HOME, '.claude', 'hooks', 'astrophage');

function estimateTokens(text) { return Math.ceil(text.length / 4); }

function main() {
  if (process.env.ASTROPHAGE_DISABLED === '1') process.exit(0);

  // Reset session tracking
  try { writeFileSync(join(HOOKS_DIR, 'session-data.jsonl'), ''); } catch {}
  try { writeFileSync(join(HOOKS_DIR, 'session-reads.json'), JSON.stringify({ _ts: Date.now() })); } catch {}
  try { writeFileSync(join(HOOKS_DIR, 'advisor-state.json'), JSON.stringify({ call_count: 0, last_update: Date.now(), last_suggestion: 0, tools_since_suggestion: 0 })); } catch {}

  const CWD = process.cwd();
  let staticTokens = 0;
  for (const p of [join(CWD, 'CLAUDE.md'), join(CWD, 'CLAUDE.local.md'), join(HOME, '.claude', 'CLAUDE.md')]) {
    try { if (existsSync(p)) staticTokens += estimateTokens(readFileSync(p, 'utf8')); } catch {}
  }

  let skillCount = 0;
  for (const d of [join(HOME, '.claude', 'skills'), join(HOME, '.agents', 'skills')]) {
    try { if (existsSync(d)) skillCount += readdirSync(d, { withFileTypes: true }).filter(e => e.isDirectory()).length; } catch {}
  }

  let mcpCount = 0;
  for (const p of [join(HOME, '.claude', 'settings.json'), join(CWD, '.claude', 'settings.json')]) {
    try { if (existsSync(p)) { const c = JSON.parse(readFileSync(p, 'utf8')); if (c.mcpServers) mcpCount += Object.keys(c.mcpServers).length; } } catch {}
  }

  const notes = [];
  if (staticTokens > 3000) notes.push('CLAUDE.md files: ~' + staticTokens + ' tokens (consider trimming)');
  if (skillCount > 8) notes.push(skillCount + ' skills loaded');
  if (mcpCount > 3) notes.push(mcpCount + ' MCP servers active (disable unused with /mcp)');

  if (notes.length > 0) {
    process.stdout.write(JSON.stringify({
      additionalContext: '[Launch Sequence] Mission started. Fuel notes: ' + notes.join('. ') + '. Run /range for full breakdown.'
    }));
  }

  process.exit(0);
}

main();
