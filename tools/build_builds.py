#!/usr/bin/env python3
"""Build each member's "Rings walked" Build cards from builds/<name>.md.

Usage (from the site folder):
    python3 tools/build_builds.py            # rebuild every member who has a builds file
    python3 tools/build_builds.py ian neve   # rebuild only these members

The cards go between <!-- BUILDS:START --> and <!-- BUILDS:END --> on <name>.html
(on the first run they replace the placeholder build list). A card for the team's
Build 2 (which lives on team.html) is added automatically after Build 1.

Format of builds/<name>.md:

    # Full Name

    ## Build 1
    due: Sep 11
    about: Individual · Hegel, *Phenomenology of Spirit* §187
    passage-label: Passage · Hegel, Phenomenology of Spirit §187   (optional)
    passage: The quoted passage, on one line.                      (optional)

    First paragraph of the essay.

    Second paragraph.

    ### A subheading inside the essay (optional)

    ## Build 3
    ...

Text is copied exactly as written; *word* makes italics.
"""

import html
import re
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
SRC = SITE / "builds"
START, END = "<!-- BUILDS:START -->", "<!-- BUILDS:END -->"
I = "        "

# Everyone on the team, in the order the home page lists them: file stem -> (name, host role)
MEMBERS = [
    ("ian", "Ian Schwartz", "Ford"),
    ("kaylee", "Kaylee Schmid", "Charlotte"),
    ("neve", "Neve Healy", "Bernard"),
    ("aaron", "Aaron Mendoza", "Elsie"),
    ("noah", "Noah Lowenthal", "The Man in Black"),
    ("jonah", "Jonah Herman", "Arnold"),
]
INDIVIDUAL = [1, 3, 4, 5, 7, 8]

TEAM = {
    2: ("Sep 25", "Team · Hegel and Fanon on recognition", "team.html#build-2", "Read Team Build 2 →"),
    6: ("Nov 20", "Team conclusion", "team.html#build-6", "Read Team Build 6 →"),
}


def inline(t):
    t = html.escape(t, quote=False)
    return re.sub(r"\*(.+?)\*", r"<em>\1</em>", t)


def parse(text):
    builds, cur = [], None
    for raw in text.splitlines():
        line = raw.rstrip()
        if line.startswith("# ") or line.startswith("<!--"):
            continue
        m = re.match(r"## Build (\d+)\s*$", line)
        if m:
            cur = {"n": int(m.group(1)), "meta": {}, "blocks": [], "para": []}
            builds.append(cur)
            continue
        if cur is None:
            continue
        mm = re.match(r"(due|about|passage-label|passage):\s*(.*)$", line)
        if mm and not cur["blocks"] and not cur["para"]:
            cur["meta"][mm.group(1)] = mm.group(2).strip()
            continue
        if not line.strip():
            if cur["para"]:
                cur["blocks"].append(("p", " ".join(cur["para"])))
                cur["para"] = []
            continue
        if line.startswith("### "):
            if cur["para"]:
                cur["blocks"].append(("p", " ".join(cur["para"])))
                cur["para"] = []
            cur["blocks"].append(("h4", line[4:].strip()))
            continue
        cur["para"].append(line.strip())
    for b in builds:
        if b["para"]:
            b["blocks"].append(("p", " ".join(b["para"])))
    return builds


def first_sentence(t):
    m = re.match(r"(.+?[.?!][”\"’)]?)\s", t)
    return m.group(1) if m else t


def card(b):
    n, meta = b["n"], b["meta"]
    paras = [x for k, x in b["blocks"] if k == "p"]
    lead = first_sentence(paras[0]) if paras else ""
    out = [
        f'{I}  <li class="build-card essay-card" id="build-{n}">',
        f'{I}    <span class="no">Ring {n} · {inline(meta.get("due", ""))}</span>',
        f"{I}    <h3>Build {n}</h3>",
        f'{I}    <p class="build-kind">{inline(meta.get("about", ""))}</p>',
        f'{I}    <p class="build-lead">{inline(lead)}</p>',
        f'{I}    <details class="build-full">',
        f"{I}      <summary>Read Build {n}</summary>",
        f'{I}      <div class="build-text">',
    ]
    if meta.get("passage"):
        out.append(
            f'{I}        <blockquote class="build-passage"><span class="bp-label">'
            f'{inline(meta.get("passage-label", "Passage"))}</span>{inline(meta["passage"])}</blockquote>'
        )
    for k, x in b["blocks"]:
        out.append(f"{I}        <h4>{inline(x)}</h4>" if k == "h4" else f"{I}        <p>{inline(x)}</p>")
    out += [f"{I}      </div>", f"{I}    </details>", f"{I}  </li>"]
    return "\n".join(out)


def team_card(n):
    due, about, href, label = TEAM[n]
    return "\n".join([
        f'{I}  <li class="build-card essay-card team-card" id="build-{n}">',
        f'{I}    <span class="no">Ring {n} · {due}</span>',
        f"{I}    <h3>Build {n}</h3>",
        f'{I}    <p class="build-kind">{about}</p>',
        f'{I}    <p class="build-lead">Written together by Team Logan, so it lives on the Rings page.</p>',
        f'{I}    <a class="more" href="{href}">{label}</a>',
        f"{I}  </li>",
    ])


def render(builds, team_has_6=False):
    items = {b["n"]: card(b) for b in builds}
    items[2] = team_card(2)
    if team_has_6:
        items[6] = team_card(6)
    body = "\n".join(items[k] for k in sorted(items))
    return f'{START}\n{I}<ul class="build-list essays">\n{body}\n{I}</ul>\n{I}{END}'


def install(page, block):
    if START in page:
        return re.sub(re.escape(START) + r".*?" + re.escape(END), lambda m: block, page, count=1, flags=re.S)
    new, n = re.subn(r'<ul class="build-list[^"]*">.*?</ul>', lambda m: block, page, count=1, flags=re.S)
    if not n:
        raise ValueError("no build list found")
    return new


def team_paper(n):
    """Read a team build's text straight from team.html (it stays the place teammates edit it)."""
    page = (SITE / "team.html").read_text(encoding="utf-8")
    m = re.search(r'<section[^>]*id="build-%d".*?</section>' % n, page, re.S)
    if not m or 'class="slot"' in m.group(0):
        return None
    sec = m.group(0)
    text = lambda h: html.unescape(re.sub(r"<[^>]+>", "", h)).strip()
    title = re.search(r"<h2[^>]*>(.*?)</h2>", sec, re.S)
    paras = [text(x) for x in re.findall(r"<p(?:\s[^>]*)?>(.*?)</p>", sec, re.S)]
    paras = [x for x in paras if x and not x.startswith("Ring ") and "Cornerstone" not in x]
    return {"who": "Team Logan", "first": "Team", "host": "", "page": f"team.html#build-{n}",
            "about": TEAM[n][1], "title": text(title.group(1)) if title else "",
            "blocks": [["p", x] for x in paras]}


def write_papers():
    """papers.js: every posted paper grouped by Build, for the maze's "Read the papers" panel."""
    import json
    papers, missing = {}, {}
    for n in (2, 6):
        t = team_paper(n)
        papers[str(n)] = [t] if t else []
    for n in INDIVIDUAL:
        papers[str(n)], missing[str(n)] = [], []
    for stem, name, host in MEMBERS:
        src = SRC / f"{stem}.md"
        builds = {b["n"]: b for b in parse(src.read_text(encoding="utf-8"))} if src.exists() else {}
        for n in INDIVIDUAL:
            b = builds.get(n)
            if not b:
                missing[str(n)].append(name.split()[0])
                continue
            papers[str(n)].append({
                "who": name, "first": name.split()[0], "host": host, "page": f"{stem}.html#build-{n}",
                "about": b["meta"].get("about", "").replace("*", ""),
                "passageLabel": b["meta"].get("passage-label", ""), "passage": b["meta"].get("passage", ""),
                "blocks": [[k, x] for k, x in b["blocks"]],
            })
    out = ("/* Generated by tools/build_builds.py from builds/<name>.md and team.html. Do not edit by hand. */\n"
           "var PAPERS = " + json.dumps(papers, ensure_ascii=False) + ";\n"
           "var PAPERS_MISSING = " + json.dumps(missing, ensure_ascii=False) + ";\n")
    (SITE / "papers.js").write_text(out, encoding="utf-8")
    print("papers.js: " + ", ".join(f"B{k} {len(v)}" for k, v in papers.items()))


def main(names):
    team6 = "slot" not in (SITE / "team.html").read_text(encoding="utf-8").split('id="build-6"')[1][:600]
    files = [p for p in sorted(SRC.glob("*.md")) if p.stem != "README" and (not names or p.stem in names)]
    if not files:
        sys.exit("No matching builds/<name>.md files.")
    for src in files:
        page = SITE / f"{src.stem}.html"
        builds = parse(src.read_text(encoding="utf-8"))
        page.write_text(install(page.read_text(encoding="utf-8"), render(builds, team6)), encoding="utf-8")
        print(f"{page.name}: Builds {', '.join(str(b['n']) for b in builds)}")
    write_papers()


if __name__ == "__main__":
    main(sys.argv[1:])
