#!/usr/bin/env python3
"""Build each member's Journal section from journals/<name>.md.

Usage (from the site folder):
    python3 tools/build_journals.py            # rebuild every journal
    python3 tools/build_journals.py ian neve   # rebuild only these members

Each journals/<name>.md is turned into the Journal list on <name>.html,
written between the <!-- JOURNAL:START --> and <!-- JOURNAL:END --> markers.
Everything else on the page is left alone. See journals/README.md for the
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
INDENT = "      "


def inline(text):
    """Escape HTML, then allow **bold** and *italic*."""
    text = html.escape(text, quote=False)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)
    return text


def parse(source):
    """Return a list of entries: {title, status, blocks}."""
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
            continue  # comments and the member's name line
        if line.startswith("## "):
            flush()
            entry = {"title": line[3:].strip(), "status": "", "blocks": []}
            entries.append(entry)
        elif entry is None:
            continue
        elif line.lower().startswith("status:") and not entry["blocks"] and not para:
            entry["status"] = line.split(":", 1)[1].strip()
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
        for kind, body in e["blocks"]:
            if kind == "p":
                out.append(f"{INDENT}      <p>{inline(body)}</p>")
            elif kind == "quote":
                out.append(f"{INDENT}      <blockquote>{inline(body)}</blockquote>")
            else:
                out.append(f"{INDENT}      <ul>")
                out.extend(f"{INDENT}        <li>{inline(item)}</li>" for item in body)
                out.append(f"{INDENT}      </ul>")
        out.append(f"{INDENT}    </article>")
        out.append(f"{INDENT}  </li>")
    out.append(f"{INDENT}</ol>")
    return "\n".join(out)


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
        entries = parse(src.read_text(encoding="utf-8"))
        page.write_text(
            install(page.read_text(encoding="utf-8"), render(entries)), encoding="utf-8"
        )
        print(f"{page.name}: {len(entries)} entries")


if __name__ == "__main__":
    main(sys.argv[1:])
