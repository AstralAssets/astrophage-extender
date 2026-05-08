---
name: are-xenonite-filter
description: Documents how the Xenonite Filter shapes output and how to bypass it.
origin: Astrophage Extender v1.0
---

# Xenonite Filter

Invoke when: User notices shaped output or needs raw output.

## What It Shapes
| Command | Modification |
|---------|-------------|
| cat file | pipe to head -300 |
| grep / rg pattern | -m 30 max matches |
| find path | pipe to head -50 |
| git log | -n 40 |
| git diff | pipe to head -400 |
| tree / ls -R | pipe to head -100 |
| npm ls / pip list / cargo tree / apt list | pipe to head -50 |

## Never Modifies
Test, build, install, docker, kubectl commands. Commands with pipes/redirects/semicolons. Commands with existing limiters.

## Bypass
- One command: ASTROPHAGE_DISABLED=1 cat large-file.txt
- Global: Set output_shaper.enabled to false in are-config.json
- Adjust: Increase limits in config
