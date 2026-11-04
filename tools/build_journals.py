#!/usr/bin/env python3
"""Build each member's Journal section from journals/<name>.md.

Usage (from the site folder):
    python3 tools/build_journals.py            # rebuild every journal
    python3 tools/build_journals.py ian neve   # rebuild only these members

Each journals/<name>.md is turned into the Journal list on <name>.html,
written between the <!-- JOURNAL:START --> and <!-- JOURNAL:END --> markers,
and into the "Then / Now" slider, written between <!-- THENNOW:START --> and
<!-- THENNOW:END -->. Everything else on the page is left alone. See journals/README.md for the
source format.
"""

import html
import re
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
JOURNALS = SITE / "journals"
START = "<!-- JOURNAL:START -->"
END = "<!-- JOURNAL:END -->"
TN_START = "<!-- THENNOW:START -->"
TN_END = "<!-- THENNOW:END -->"
INDENT = "      "


def inline(text):
    """Escape HTML, then allow **bold** and *italic*."""
    text = html.escape(text, quote=False)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)
    return text


def parse(source):
    """Return a list of entries: {title, status, pair, blocks}."""
    entries, entry, para, lst, quote = [], None, [], [], []

    def flush():
        nonlocal para, lst, quote
        if entry is None:
            para, lst, quote = [], [], []
            return
        if para:
            entry["blocks"].append(("p", " ".join(para)))
        if lst:
            entry["blocks"].append(("ul", lst))
        if quote:
            entry["blocks"].append(("quote", " ".join(quote)))
        para, lst, quote = [], [], []

    for raw in source.splitlines():
        line = raw.strip()
        if line.startswith("<!--") or line.startswith("# "):
            continue  # comments and the member's name line (see member_name)
        if line.startswith("## "):
            flush()
            entry = {"title": line[3:].strip(), "status": "", "pair": "", "blocks": []}
            entries.append(entry)
        elif entry is None:
            continue
        elif line.lower().startswith("status:") and not entry["blocks"] and not para:
            entry["status"] = line.split(":", 1)[1].strip()
        elif line.lower().startswith("pair:") and not entry["blocks"] and not para:
            value = line.split(":", 1)[1].strip().lower()
            entry["pair"] = value if value in ("then", "now") else ""
        elif not line:
            flush()
        elif line.startswith("- "):
            if para or quote:
                flush()
            lst.append(line[2:].strip())
        elif line.startswith("> "):
            if para or lst:
                flush()
            quote.append(line[2:].strip())
        else:
            if lst or quote:
                flush()
            para.append(line)
    flush()
    return entries


def block_lines(e, ind):
    """The paragraphs, bullet lists and quotes of one entry."""
    out = []
    for kind, body in e["blocks"]:
        if kind == "p":
            out.append(f"{ind}<p>{inline(body)}</p>")
        elif kind == "quote":
            out.append(f"{ind}<blockquote>{inline(body)}</blockquote>")
        else:
            out.append(f"{ind}<ul>")
            out.extend(f"{ind}  <li>{inline(item)}</li>" for item in body)
            out.append(f"{ind}</ul>")
    return out


def render(entries):
    """Each entry is a Reverie: a stop on the member's trail, alternating sides."""
    if not entries:
        return f'{INDENT}<p class="trail-empty">The first Reverie is on its way.</p>'
    out = [f'{INDENT}<ol class="journal-list revs">']
    for i, e in enumerate(entries):
        side = "l" if i % 2 == 0 else "r"
        out.append(f'{INDENT}  <li class="journal-entry rev {side}">')
        out.append(f'{INDENT}    <span class="node" aria-hidden="true"></span>')
        out.append(f"{INDENT}    <article>")
        out.append(f'{INDENT}      <span class="no">Reverie {i + 1:02d}</span>')
        out.append(f"{INDENT}      <h3>{inline(e['title'])}</h3>")
        if e["status"]:
            out.append(f'{INDENT}      <p class="journal-status">{inline(e["status"])}</p>')
        out.extend(block_lines(e, f"{INDENT}      "))
        out.append(f"{INDENT}    </article>")
        out.append(f"{INDENT}  </li>")
    out.append(f"{INDENT}</ol>")
    return "\n".join(out)


def member_name(source, stem):
    """Full name from the '# Name' line, else the file name."""
    for raw in source.splitlines():
        if raw.strip().startswith("# "):
            return raw.strip()[2:].strip()
    return stem.title()


def pick_pair(entries):
    """Return (then_index, now_index), or None if there is no pair yet."""
    if len(entries) < 2:
        return None
    marked = {}
    for i, e in enumerate(entries):
        if e["pair"] and e["pair"] not in marked:
            marked[e["pair"]] = i
    then = marked.get("then", 0)
    if "now" in marked:
        now = marked["now"]
    else:
        done = [i for i, e in enumerate(entries) if "in progress" not in e["status"].lower()]
        now = done[-1] if done else None
    if now is None or now == then:
        return None
    return then, now


def render_thennow(entries, first_name):
    """The Then / Now slider (or a placeholder until there are two Reveries)."""
    pair = pick_pair(entries)
    if pair is None:
        return f'{INDENT}<p class="slot tn-empty">[Then / Now appears once there are two Reveries]</p>'
    then, now = pair

    def pane(cls, label, i):
        e = entries[i]
        lines = [
            f'{INDENT}    <article class="tn-pane {cls}">',
            f'{INDENT}      <span class="no">{label} · Reverie {i + 1:02d}</span>',
            f"{INDENT}      <h3>{inline(e['title'])}</h3>",
        ]
        if e["status"]:
            lines.append(f'{INDENT}      <p class="journal-status">{inline(e["status"])}</p>')
        lines.extend(block_lines(e, f"{INDENT}      "))
        lines.append(f"{INDENT}    </article>")
        return lines

    out = [f'{INDENT}<div class="tn" data-tn>', f'{INDENT}  <div class="tn-stage">']
    out += pane("tn-now", "Now", now)
    out += pane("tn-then", "Then", then)
    out += [
        f'{INDENT}    <div class="tn-handle" role="slider" tabindex="0" aria-orientation="horizontal"'
        ' aria-label="Then and Now divider" aria-valuemin="25" aria-valuemax="75"'
        ' aria-valuenow="50" aria-valuetext="Half Then, half Now">',
        f'{INDENT}      <span class="tn-grip" aria-hidden="true"></span>',
        f"{INDENT}    </div>",
        f"{INDENT}  </div>",
        f'{INDENT}  <p class="slot tn-caption">[A sentence by {html.escape(first_name)} on what changed]</p>',
        f"{INDENT}</div>",
    ]
    return "\n".join(out)


def install_thennow(page_html, block):
    """Replace the block between the THENNOW markers (they must exist)."""
    if TN_START not in page_html or TN_END not in page_html:
        raise ValueError("no THENNOW markers found")
    pattern = re.compile(re.escape(TN_START) + r".*?" + re.escape(TN_END), re.S)
    return pattern.sub(lambda m: f"{TN_START}\n{block}\n      {TN_END}", page_html, count=1)


def install(page_html, block):
    """Put the block between the markers, adding markers on first run."""
    if START in page_html and END in page_html:
        pattern = re.compile(re.escape(START) + r".*?" + re.escape(END), re.S)
    else:
        # First run: replace the template's placeholder list in the Journal section.
        pattern = re.compile(
            r'(?<=aria-labelledby="journal-heading">)(.*?)(?=\s*</section>)', re.S
        )
        if not pattern.search(page_html):
            raise ValueError("no Journal section found")
        block_with_heading = (
            '\n      <h2 id="journal-heading">Journal</h2>\n'
            f"      {START}\n{block}\n      {END}"
        )
        return pattern.sub(lambda m: block_with_heading, page_html, count=1)
    return pattern.sub(lambda m: f"{START}\n{block}\n      {END}", page_html, count=1)


def main(names):
    sources = sorted(JOURNALS.glob("*.md"))
    sources = [p for p in sources if p.stem != "README"]
    if names:
        sources = [p for p in sources if p.stem in names]
    if not sources:
        sys.exit("No matching journals/<name>.md files.")
    for src in sources:
        page = SITE / f"{src.stem}.html"
        if not page.exists():
            print(f"skip {src.name}: no {page.name}")
            continue
        text = src.read_text(encoding="utf-8")
        entries = parse(text)
        first = member_name(text, src.stem).split()[0]
        new_page = install(page.read_text(encoding="utf-8"), render(entries))
        if TN_START in new_page:
            new_page = install_thennow(new_page, render_thennow(entries, first))
        page.write_text(new_page, encoding="utf-8")
        print(f"{page.name}: {len(entries)} entries")


if __name__ == "__main__":
    main(sys.argv[1:])
