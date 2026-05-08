#!/usr/bin/env node
// Astrophage Extender v1.0
// blip-a-reporter.mjs -- Backing script for /blip-a
// Named after the Blip-A communication device.

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const HOME = process.env.HOME || process.env.USERPROFILE || '';
const TRACKER_PATH = join(HOME, '.claude', 'hooks', 'astrophage', 'session-data.jsonl');

// Conservative token savings estimates per intervention type
const SAVINGS = {
  xenonite_shaped: 1500,       // avg tokens saved per shaped command
  petrova_large_read: 2000,    // avg tokens saved per large-read warning heeded
  petrova_duplicate_read: 2000 // avg tokens saved per duplicate-read warning heeded
};

function main() {
  if (!existsSync(TRACKER_PATH)) {
    console.log(JSON.stringify({ status: 'no_data', message: 'No mission data yet. The crew tracks events as you work. Check back after some activity.' }));
    return;
  }

  const lines = readFileSync(TRACKER_PATH, 'utf8').split('\n').filter(l => l.trim());
  const events = [];
  for (const line of lines) { try { events.push(JSON.parse(line)); } catch {} }

  if (events.length === 0) {
    console.log(JSON.stringify({ status: 'no_data', message: 'No mission data yet.' }));
    return;
  }

  const toolCalls = events.filter(e => e.event === 'tool_call');
  const xenonite = events.filter(e => e.event === 'xenonite_shaped');
  const petrovaLarge = events.filter(e => e.event === 'petrova_large_read');
  const petrovaDupe = events.filter(e => e.event === 'petrova_duplicate_read');
  const sleepSuggestions = events.filter(e => e.event === 'sleep_suggestion');

  const toolBreakdown = {};
  for (const tc of toolCalls) { const t = tc.tool || 'unknown'; toolBreakdown[t] = (toolBreakdown[t] || 0) + 1; }

  const estimatedSavings = {
    xenonite: xenonite.length * SAVINGS.xenonite_shaped,
    petrova_large: petrovaLarge.length * SAVINGS.petrova_large_read,
    petrova_dupe: petrovaDupe.length * SAVINGS.petrova_duplicate_read,
    total: (xenonite.length * SAVINGS.xenonite_shaped) +
           (petrovaLarge.length * SAVINGS.petrova_large_read) +
           (petrovaDupe.length * SAVINGS.petrova_duplicate_read)
  };

  console.log(JSON.stringify({
    mission_stats: {
      total_tool_calls: toolCalls.length,
      xenonite_filter: { commands_shaped: xenonite.length },
      petrova_gate: { large_file_warnings: petrovaLarge.length, duplicate_read_warnings: petrovaDupe.length },
      sleep_advisor: { compaction_suggestions: sleepSuggestions.length },
      first_event: events[0]?.ts || 'unknown',
      last_event: events[events.length - 1]?.ts || 'unknown'
    },
    estimated_tokens_saved: estimatedSavings,
    tool_breakdown: toolBreakdown
  }, null, 2));
}

main();
