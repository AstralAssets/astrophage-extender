---
name: are-range-check
description: Analyzes Claude Code context budget. Shows where fuel is going and how to extend range.
origin: Astrophage Extender v1.0
---

# Range Check

Invoke when: User asks about context usage, token budget, session headroom, or wants to optimize for longer sessions.

## How To Use

Run: `node ~/.claude/hooks/astrophage/range-analyzer.mjs`

Interpret the JSON. Key guidance:

### CLAUDE.md -- Target under 1500 tokens
Cut aspirational text, verbose examples, duplicate info. Keep architecture decisions, build commands, file paths. Every token costs you on EVERY message.

### MCP Servers -- Disable unused
Each adds tool definitions to every message. Use /mcp to toggle.

### Skills -- Remove unused
Catalog entries add to context. Remove skills you never invoke.

### General
- /clear between unrelated tasks
- /compact at task boundaries
- @file references instead of pasting
- Targeted file reads over broad grep sweeps
