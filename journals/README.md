# Journals — how to update

Each member's journal lives in its own text file here (`aaron.md`, `ian.md`,
`kaylee.md`, `neve.md`, `noah.md`, and later `jonah.md`). The member pages are
built from these files, so **edit the `.md` file, never the journal part of the
`.html` page** (it gets overwritten).

## Steps

1. `git pull` (the LRC site agent also commits to this repo).
2. Edit `journals/<name>.md`: fix an entry or add a new `## ` section at the bottom.
3. From the site folder, run `python3 tools/build_journals.py`
   (or `python3 tools/build_journals.py ian` to rebuild just one person).
4. Commit and push. GitHub Pages updates in about a minute.

To add a new member (e.g. Jonah), create `journals/jonah.md` and run step 3.
It fills in the Journal section already on `jonah.html`.

## Format

```
# Full Name

## Consciousness & Freedom
One paragraph per block of lines. Leave a blank line between paragraphs.

## Wittgenstein on Consciousness
status: In progress
Text of an entry that isn't finished yet.

- a bullet point
- another bullet point

> A quotation, shown as a pull quote.
```

- `## Title` starts an entry. Use the shared prompt titles below so every
  page reads the same: **Consciousness & Freedom · Continuity of Identity ·
  Repetitive Behavior That Changed Me · Detachment vs. Discipline · Scarry on
  Consciousness · Wittgenstein on Consciousness**. For a new prompt, pick a
  short title and give it to everyone in the same words.
- `status: ...` (optional, right under the title) shows a small tag, such as
  "In progress". Delete the line once the entry is done.
- `**bold**` and `*italic*` work inside text.
- Keep entries in prompt order, oldest first.
