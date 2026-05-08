---
name: blip-a
description: Full session diagnostics from the crew
are_version 1.0
---

Generate a mission report. Run `node ~/.claude/hooks/astrophage/blip-a-reporter.mjs` and interpret the results. Show:
1. Total tool calls this mission
2. Xenonite Filter: commands shaped
3. Petrova Gate: large file warnings, duplicate read warnings
4. Sleep Advisor: compaction suggestions
5. Tool call breakdown by type
6. Any anomalies (one tool dominating, rapid call acceleration)
If no data exists yet, explain the crew tracks events as you work.
