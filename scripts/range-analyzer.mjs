#!/usr/bin/env node
// Astrophage Extender v1.0
// range-analyzer.mjs -- Backing script for /range

import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { join } from 'path';

const HOME = process.env.HOME || process.env.USERPROFILE || '';
const CWD = process.cwd();

function estimateTokens(text) { return Math.ceil(text.length / 4); }

function analyzeFile(path, label) {
  try {
    if (!existsSync(path) || statSync(path).isDirectory()) return null;
    const content = readFileSync(path, 'utf8');
    return { label, path, chars: content.length, tokens: estimateTokens(content) };
  } catch { return null; }
}

function main() {
  const results = [];

  for (const [p, label] of [
    [join(CWD, 'CLAUDE.md'), 'CLAUDE.md (project)'],
    [join(CWD, 'CLAUDE.local.md'), 'CLAUDE.local.md (local)'],
    [join(HOME, '.claude', 'CLAUDE.md'), 'CLAUDE.md (global)'],
  ]) { const r = analyzeFile(p, label); if (r) results.push(r); }

  let skillCount = 0, skillTokens = 0;
  for (const dir of [join(HOME, '.claude', 'skills'), join(HOME, '.agents', 'skills'), join(CWD, '.claude', 'skills')]) {
    try {
      if (!existsSync(dir)) continue;
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) {
          const r = analyzeFile(join(dir, e.name, 'SKILL.md'), 'Skill: ' + e.name);
          if (r) { skillCount++; skillTokens += r.tokens; }
        }
      }
    } catch {}
  }

  let cmdCount = 0, cmdTokens = 0;
  const cmdDir = join(CWD, '.claude', 'commands');
  try {
    if (existsSync(cmdDir)) {
      for (const f of readdirSync(cmdDir)) {
        if (f.endsWith('.md')) {
          const r = analyzeFile(join(cmdDir, f), 'Command: /' + f.replace('.md', ''));
          if (r) { cmdCount++; cmdTokens += r.tokens; }
        }
      }
    }
  } catch {}

  let mcpCount = 0;
  for (const p of [join(HOME, '.claude', 'settings.json'), join(CWD, '.claude', 'settings.json')]) {
    try { if (existsSync(p)) { const c = JSON.parse(readFileSync(p, 'utf8')); if (c.mcpServers) mcpCount += Object.keys(c.mcpServers).length; } } catch {}
  }

  let totalStaticTokens = results.reduce((a, r) => a + r.tokens, 0) + skillTokens + cmdTokens;

  const report = {
    static_context: {
      total_estimated_tokens: totalStaticTokens,
      breakdown: results.map(r => ({ label: r.label, tokens: r.tokens })),
      skills: { count: skillCount, estimated_tokens: skillTokens },
      commands: { count: cmdCount, estimated_tokens: cmdTokens },
      mcp_servers: mcpCount,
      note: 'Each MCP server adds ~500-2000 tokens of tool definitions per message.'
    },
    recommendations: []
  };

  for (const r of results) {
    if (r.label.includes('CLAUDE.md') && r.tokens > 2000) {
      report.recommendations.push(r.label + ' is ' + r.tokens + ' tokens. Target under 1500. Cut aspirational text and verbose examples.');
    }
  }
  if (skillCount > 10) report.recommendations.push(skillCount + ' skills (' + skillTokens + ' tokens). Remove unused skills.');
  if (mcpCount > 3) report.recommendations.push(mcpCount + ' MCP servers. Disable unused with /mcp.');
  if (report.recommendations.length === 0) report.recommendations.push('Fuel reserves look good. No immediate optimizations needed. Is good good good.');

  console.log(JSON.stringify(report, null, 2));
}

main();
