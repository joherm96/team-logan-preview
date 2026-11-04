# Portfolio site template

Starter site for HNR 241 group portfolio sites. The group-provisioning
workflow generates each group's repo from this template and turns on GitHub
Pages for it; the site-builder agent then edits the files in response to
`@agent build` comments in the group's planning Doc.

- `index.html` — placeholder home page.
- `styles.css` — one shared stylesheet, linked from every page.
- `.nojekyll` — tells GitHub Pages to serve the files as-is.
- `images/`, `videos/` — empty to start. The agent copies files here from the
  group's Drive Assets folder. (The `.gitkeep` files only exist so Git keeps
  the empty folders.)

Changes to this template only affect repos generated afterward.

## Member journals

Journals are written in `journals/<name>.md` and built into each member page
with `python3 tools/build_journals.py`. See `journals/README.md` for the steps
and format.

## The Maze design (Oct 2026)

The site is built as a maze: each ring is a build (Build 1 outside, Build 8 at
the center), in the "Lamplight" palette.

- `rings.js` — the ring list. When a build is posted, set its `status` to
  `"reached"` (others: `"near"`, `"locked"`) and give it a `link`. The maze
  panel and the "Rings not yet reached" tiles update from this one list.
- `team.html` — "The Rings": team builds (Build 2, Build 6) and the
  Cornerstone bibliography.
- `<name>.html` — each member's Path: intro, builds, and Reveries (journals,
  built from `journals/<name>.md`).
- Text in `[square brackets]` is a placeholder for the team to write.
