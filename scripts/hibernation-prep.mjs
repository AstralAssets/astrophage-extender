#!/usr/bin/env node
// Astrophage Extender v1.0
// hibernation-prep.mjs -- PreCompact hook
// "Before sleep, write down what important. Forget the rest."

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const HOME = process.env.HOME || process.env.USERPROFILE || '';
const STATE_PATH = join(HOME, '.claude', 'hooks', 'astrophage', 'advisor-state.json');
const READS_PATH = join(HOME, '.claude', 'hooks', 'astrophage', 'session-reads.json');

function main() {
  if (process.env.ASTROPHAGE_DISABLED === '1') process.exit(0);

  let toolCount = 0;
  try {
    if (existsSync(STATE_PATH)) {
      toolCount = JSON.parse(readFileSync(STATE_PATH, 'utf8')).call_count || 0;
    }
  } catch {}

  const guidance = [
    'Preserve: active task description, file architecture decisions, naming conventions, API contracts.',
    'Preserve: error patterns discovered and their fixes.',
    'Preserve: user preferences stated during this session.',
    'Drop: raw file contents (can be re-read), intermediate debugging output, exploratory dead ends.'
  ];

  if (toolCount > 30) {
    guidance.push('Long mission (' + toolCount + ' tool calls). Focus on decisions and outcomes, not process.');
  }

  // Inject list of files already read so post-compaction agent doesn't re-read them
  try {
    if (existsSync(READS_PATH)) {
      const reads = JSON.parse(readFileSync(READS_PATH, 'utf8'));
      const files = Object.keys(reads).filter(k => k !== '_ts');
      if (files.length > 0) {
        guidance.push('Files already read this session (do not re-read): ' + files.join(', '));
      }
    }
  } catch {}

  process.stdout.write(JSON.stringify({
    additionalContext: '[Hibernation Prep] ' + guidance.join(' ')
  }));

  process.exit(0);
}

main();
