#!/bin/bash
# Astrophage Extender v1.0 -- Uninstaller
# "Sleep good, friend."
CLAUDE_HOME="$HOME/.claude"
echo "Astrophage Extender -- Uninstall"
rm -rf "$CLAUDE_HOME/hooks/astrophage" && echo "  Removed crew"
for s in are-range-check are-hibernation are-xenonite-filter; do
    rm -rf "$CLAUDE_HOME/skills/$s" && echo "  Removed skill: $s"
done
if [ -f "$CLAUDE_HOME/settings.json" ]; then
    node -e "
    const fs = require('fs');
    const p = '$CLAUDE_HOME/settings.json';
    const s = JSON.parse(fs.readFileSync(p,'utf8'));
    if(s.hooks){
        const names = ['xenonite-filter','petrova-gate','sleep-advisor','launch-sequence','hibernation-prep'];
        for (const evt of Object.keys(s.hooks)) {
            s.hooks[evt] = s.hooks[evt].filter(h => !h.hooks?.some(x => names.some(n => x.command?.includes(n))));
        }
    }
    fs.writeFileSync(p, JSON.stringify(s,null,2));
    " && echo "  Cleaned settings.json"
fi
for c in range.md fuel-check.md blip-a.md; do rm -f ".claude/commands/$c"; done
echo "  Removed commands"
echo "Sleep good, friend."
