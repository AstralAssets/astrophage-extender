# Astrophage Extender v1.0

> *"You save Earth. I save Erid. Is good good good."*

A Claude Code plugin that extends your session range by reducing context bloat automatically. Named after the astrophage organism in Andy Weir's *Project Hail Mary* -- a microbe that converts stellar energy into stored fuel. This plugin converts token waste into session headroom.

**What it does:** Hooks into Claude Code's lifecycle to filter noisy tool outputs, guard against wasteful file reads, advise on strategic hibernation timing, and give you real-time visibility into your fuel reserves.

**What it is NOT:** A standalone CLI. A replacement for Claude Code. An agent framework. An IDE.

---

## The Crew

Like the Hail Mary, the Astrophage Extender runs a small crew. Each member has a job.

| Crew Member | Role | Hook Type |
|------------|------|-----------|
| **Xenonite Filter** | Shapes Bash output before it floods the hold | PreToolUse (Bash) |
| **Petrova Gate** | Warns on large or duplicate file reads | PreToolUse (Read) |
| **Sleep Advisor** | Suggests `/compact` at mission phase boundaries | PostToolUse |
| **Launch Sequence** | Resets tracking, fuel briefing at session start | SessionStart |
| **Hibernation Prep** | Preserves critical context before compaction | PreCompact |

Plus three slash commands: `/range`, `/fuel-check`, `/blip-a`.
Plus three on-demand skills for deeper analysis.

---

## Prerequisites

- Claude Code v2.1.0+ (hooks support required)
- Node.js 18+ (for hook scripts)
- PowerShell 5.1+ (Windows) or bash (macOS/Linux)
- Git (for repo-aware features)

### Windows Users

If you have never run a PowerShell script before:

```powershell
# Run ONCE in elevated PowerShell:
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

If you downloaded the zip from GitHub:

```powershell
Get-ChildItem -Path ".\astrophage-extender" -Recurse | Unblock-File
```

---

## CRITICAL: Verify Authenticity

> *"Trust, but verify. Especially when alien microbes are involved."*

**Only download Astrophage Extender from the official repository.**

If you found this in a different repo, a fork you did not create, or received it from an unknown source, **DO NOT INSTALL IT.** Malicious forks can modify hook scripts to exfiltrate data, inject commands, or compromise your codebase. Is not good. Is bad bad bad.

Verify SHA256 checksums in `SHA256SUMS.txt` against the release page before installing.

---

## Quick Start

### 1. Extract

Download the release zip. Extract it anywhere. The `astrophage-extender/` folder IS your Astrophage Extender home. Do not move files out of it.

> *"Question: Why folder not move? Answer: Installer needs know where crew lives."*

### 2. Install

```powershell
cd astrophage-extender
.\install-astrophage.ps1
```

The installer deploys all five crew members, three skills, and three commands. It does not overwrite existing hook configurations.

### 3. Verify

Open Claude Code in your project and run:

```
/range
```

You should see a fuel budget breakdown. If you do, the crew is awake and working.

> *"Amaze! Astrophage Extender is operational. Is good good good."*

---

## Slash Commands

| Command | What It Does |
|---------|-------------|
| `/range` | Shows context breakdown: system prompt, tools, memory, skills, conversation. Flags the biggest fuel consumers. The Petrova Line of your session. |
| `/fuel-check` | Quick estimate: how many turns remain before compaction fires. One-line answer. |
| `/blip-a` | Full session diagnostics. Tool calls, outputs shaped, reads gated, compaction suggestions, estimated savings. Named after the Blip-A communication device. |

---

## The Crew In Detail

### Xenonite Filter (PreToolUse / Bash)

> *"Xenonite very strong. Filter radiation. Keep crew safe inside."*

Rocky built his ship from xenonite -- a material that blocks harmful radiation. The Xenonite Filter blocks harmful output bloat before it enters your context.

**What it shapes:**

| Command | Modification |
|---------|-------------|
| `cat <file>` | Adds `\| head -300` |
| `grep <pattern>` | Adds `-m 30` (max matches) |
| `rg <pattern>` | Adds `-m 30` (max matches) |
| `find <path>` | Adds `\| head -50` |
| `git log` | Adds `-n 40` |
| `git diff` | Adds `\| head -400` |
| `tree` / `ls -R` | Adds `\| head -100` |
| `npm ls` / `pip list` / `cargo tree` / `apt list` | Adds `\| head -50` |

**What it never touches:**
- Test commands (jest, pytest, etc.) -- exit codes are sacred
- Build commands (npm run build, cargo build, etc.)
- Install commands (npm install, pip install, etc.)
- Commands with existing pipes, redirects, or limiters
- Docker and kubectl commands

### Petrova Gate (PreToolUse / Read)

> *"Petrova line show star getting dim. File read show context getting dim."*

Dr. Petrova discovered stars dimming from astrophage consumption. The Petrova Gate detects your context dimming from wasteful file reads.

**What it does:**
- Detects files over 200 lines / 8KB being read without a line range
- Warns Claude to use `view_range` instead of reading the entire file
- Tracks duplicate reads per session -- if the same file is read more than once, it flags it
- Never blocks reads, only adds advisory context

### Sleep Advisor (PostToolUse)

> *"Rocky go sleep now. Wake up when arrive. You do same -- compact when arrive at task boundary."*

Rocky hibernates between star systems. Your session should compact between task phases.

**What it does:**
- Counts tool calls per session
- At threshold (default: 40 calls), checks for task boundary signals:
  - TodoWrite completion (planning done)
  - Test suite execution (implementation done)
  - Branch switch (new task)
- Suggests `/compact` with a reason at logical boundaries
- Defers to ECC strategic-compact if installed (no duplicate nagging)

### Launch Sequence (SessionStart)

> *"Spin up. Check fuel. Begin mission."*

Runs at session open. Resets all tracking data and checks your static context budget. If your CLAUDE.md is bloated, you have too many skills, or too many MCP servers enabled, you get a heads-up before you start burning fuel.

### Hibernation Prep (PreCompact)

> *"Before sleep, write down what important. Forget the rest."*

Fires before compaction. Injects preservation instructions telling the compactor:
- **Keep:** Task descriptions, architecture decisions, naming conventions, API contracts, error patterns and fixes, user preferences
- **Drop:** Raw file contents (re-readable), intermediate debugging, exploratory dead ends
- Adjusts guidance based on session length (long sessions get "focus on outcomes, not process")
- Injects list of files already read this session so the post-compaction agent doesn't re-read them

---

## Configuration

Single config file: `~/.claude/hooks/astrophage/are-config.json`

> *"One file. Simple. Rocky approve."*

```json
{
  "output_shaper": {
    "enabled": true,
    "grep_max_matches": 30,
    "cat_max_lines": 300,
    "git_log_max": 40,
    "git_diff_max_lines": 400,
    "find_max_results": 50
  },
  "read_gate": {
    "enabled": true,
    "large_file_threshold_lines": 200,
    "large_file_threshold_bytes": 8000,
    "warn_on_reread": true,
    "max_reread_before_warn": 1
  },
  "compact_advisor": {
    "enabled": true,
    "tool_call_threshold": 40,
    "phase_detection": true,
    "ecc_deference": true
  }
}
```

**Do not put config in your repo.** It lives in your user-level Claude directory so repo contents cannot tamper with it.

To disable temporarily:

```bash
ASTROPHAGE_DISABLED=1
```

---

## How Much Fuel Does This Save?

Honest answer: it depends on your mission profile.

**Long-range missions (20-30% savings):**
- Sessions with 50+ tool calls
- Reading 10+ source files
- Running test suites with verbose output
- Large codebase grep sweeps
- Sessions that hit compaction

**Short hops (<10% savings):**
- Quick focused sessions under 20 tool calls
- Mostly editing, minimal reading
- Small repos with small files

> *"Question: How much save? Answer: Run /blip-a. Numbers not lie."*

---

## Compatibility

- **Claude Code v2.1.0+** -- Required for hooks
- **ECC (Everything Claude Code)** -- Compatible. Sleep Advisor defers to ECC's strategic-compact when detected.
- **Walls of Ba Sing Se** -- Compatible. Wall hooks run PreToolUse for security; Astrophage Extender's PreToolUse runs on different matchers (Bash, Read). No conflicts.
- **Custom hooks** -- Compatible. Astrophage Extender hooks use unique script paths. Installer appends, never overwrites.

---

## Uninstall

```powershell
cd astrophage-extender
.\uninstall-astrophage.ps1
```

> *"Sleep good, friend. Crew go home."*

Removes: skills, hook scripts, hook config entries, slash commands. Does not touch your Claude Code settings beyond removing Astrophage Extender entries.

---

## Security Model

> *"Rocky not trust unknown thing. You not trust unknown script. Is same."*

- **Hook scripts are plain JavaScript.** Read them before installing. Each is under 150 lines.
- **No network calls.** The Astrophage Extender never phones home, fetches updates, or sends telemetry. It is a closed system like the Hail Mary.
- **No model authority.** The agent cannot disable or reconfigure hooks through text. Config lives host-side.
- **No repo-level config.** All configuration is user-level (`~/.claude/`). Malicious repo contents cannot override settings.
- **Pinned dependencies: zero.** Hook scripts use only Node.js built-ins (fs, path). No npm packages.

---

## Troubleshooting

**"Hooks not firing"**
- Check Claude Code version: `claude --version` (need 2.1.0+)
- Run `/hooks` in Claude Code to see registered hooks
- Toggle verbose mode (Ctrl+O) to see hook stdout/stderr

**"Xenonite Filter too aggressive"**
- Increase thresholds in `are-config.json`
- Or: `ASTROPHAGE_DISABLED=1 <your command>` for one-off bypass

**"Petrova Gate warns on every file"**
- Increase `large_file_threshold_lines` (default 200)
- Set `warn_on_reread: false` if duplicate read warnings are noisy

**"Sleep Advisor suggests too often"**
- Increase `tool_call_threshold` (default 40)
- Set `phase_detection: false` for pure counter mode

---

## File Map

```
astrophage-extender/
  README.md
  install-astrophage.ps1
  install-astrophage.sh
  uninstall-astrophage.ps1
  uninstall-astrophage.sh
  SHA256SUMS.txt
  LICENSE
  scripts/
    xenonite-filter.mjs        # PreToolUse/Bash: output shaping
    petrova-gate.mjs           # PreToolUse/Read: file read guard
    sleep-advisor.mjs          # PostToolUse: compaction timing
    launch-sequence.mjs        # SessionStart: reset + briefing
    hibernation-prep.mjs       # PreCompact: context preservation
    range-analyzer.mjs         # Backing script for /range
    blip-a-reporter.mjs        # Backing script for /blip-a
    are-config-default.json    # Default configuration
  skills/
    are-range-check/SKILL.md   # Context budget analysis
    are-hibernation/SKILL.md   # Strategic compaction advice
    are-xenonite-filter/SKILL.md  # Output shaping documentation
  commands/
    range.md                   # /range
    fuel-check.md              # /fuel-check
    blip-a.md                  # /blip-a
```

---

## License

MIT. Use it, fork it, extend its range.

---

## Credits

> *"You save Earth. I save Erid. Together, save everyone."*

Named after the astrophage organism in Andy Weir's *Project Hail Mary*. The astrophage converts light into stored energy. The Astrophage Extender converts bloat into headroom.

Part of the Astral Assets developer tooling family.
