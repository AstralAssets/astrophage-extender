---
name: are-hibernation
description: Advises on strategic compaction timing. Knows when to hibernate and when to stay awake.
origin: Astrophage Extender v1.0
---

# Hibernation Guide

Invoke when: Deciding whether to suggest /compact.

## HIBERNATE NOW
- Planning complete (TodoWrite finished)
- Test suite passed after debugging
- Branch switch or git commit
- Switching to unrelated task
- 50+ tool calls without compaction

## STAY AWAKE
- Mid-implementation of multi-file change
- Debugging specific issue
- Code review in progress
- User explaining requirements

## HIBERNATE WITH CARE
- After implementation: /compact Preserve: architecture decisions, API contracts
- After debugging: /compact Preserve: root cause and fix
- After planning: /compact Preserve: implementation plan

## Integration
Defers to ECC strategic-compact when detected.
