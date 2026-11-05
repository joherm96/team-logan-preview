# Builds: how to update

Each member's individual Builds live in `builds/<name>.md` (the team's Builds 2 and 6 live on `team.html`).
The source of truth is the team Google Doc "Team Logan Builds and Journal". Copy the text in exactly.

1. `git pull`
2. Edit `builds/<name>.md` (format is at the top of `tools/build_builds.py`): `## Build 5`, then `due:` and `about:` lines, then paragraphs separated by blank lines.
3. From the site folder: `python3 tools/build_builds.py` (or `python3 tools/build_builds.py ian`)
4. Commit and push.
