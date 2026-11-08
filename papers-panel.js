/* The maze's "Read the papers" button and panel (home page).
   Whatever ring the info panel shows (the ring the lamp is in, or one you clicked),
   the button opens every paper posted for that Build. Data comes from papers.js,
   which tools/build_builds.py generates; nothing here needs editing when papers change. */
(function () {
  "use strict";
  if (typeof PAPERS === "undefined") return;
  const $ = id => document.getElementById(id);
  const btn = $("ri-papers"), link = $("ri-link"), dlg = $("papers-dlg");
  if (!btn || !dlg) return;
  let current = null;

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  function update(n) {
    current = n;
    const list = PAPERS[String(n)] || [];
    const r = (typeof RINGS !== "undefined") ? RINGS.find(x => x.n === n) : null;
    const locked = r && r.status === "locked";
    btn.hidden = locked && !list.length;           // rings far ahead stay quiet
    btn.disabled = !list.length;
    btn.textContent = list.length
      ? (n === 8 ? "Read the Build 8 papers" : "Read the Build " + n + " papers") + " (" + list.length + ")"
      : "No Build " + n + " papers yet";
    if (list.length && link) link.hidden = true;   // the papers button replaces the old link
  }

  function paperCard(p, n) {
    const art = el("article", "pd-paper");
    const head = el("header", "pd-head");
    head.appendChild(el("h3", "pd-who", p.who));
    if (p.host) head.appendChild(el("span", "pd-host", p.host));
    art.appendChild(head);
    if (p.title) art.appendChild(el("p", "pd-title", p.title));
    if (p.about) art.appendChild(el("p", "pd-about", p.about));
    const firstP = (p.blocks.find(b => b[0] === "p") || [, ""])[1];
    const m = firstP.match(/^(.+?[.?!][”"’)]?)\s/);
    art.appendChild(el("p", "pd-lead", m ? m[1] : firstP));

    const det = el("details", "pd-full");
    det.appendChild(el("summary", null, p.first === "Team" ? "Read the team's Build " + n : "Read " + p.first + "'s Build " + n));
    const body = el("div", "pd-text");
    if (p.passage) {
      const q = el("blockquote", "pd-passage");
      q.appendChild(el("span", "pd-plabel", p.passageLabel || "Passage"));
      q.appendChild(document.createTextNode(p.passage));
      body.appendChild(q);
    }
    p.blocks.forEach(b => body.appendChild(el(b[0] === "h4" ? "h4" : "p", null, b[1])));
    det.appendChild(body);
    art.appendChild(det);

    const go = el("a", "pd-go", p.first === "Team" ? "Open on the Rings page →" : "Open on " + p.first + "'s Path →");
    go.href = p.page;
    art.appendChild(go);
    return art;
  }

  function open() {
    const n = current, list = PAPERS[String(n)] || [];
    if (!list.length) return;
    const r = (typeof RINGS !== "undefined") ? RINGS.find(x => x.n === n) : null;
    $("pd-eyebrow").textContent = (n === 8 ? "The center" : "Ring " + n) + (r ? " · " + r.kind + " · Due " + r.due : "");
    $("pd-heading").textContent = "The Build " + n + " papers";
    const box = $("pd-list");
    box.textContent = "";
    list.forEach(p => box.appendChild(paperCard(p, n)));
    const miss = (typeof PAPERS_MISSING !== "undefined" && PAPERS_MISSING[String(n)]) || [];
    const note = $("pd-missing");
    note.hidden = !miss.length;
    note.textContent = miss.length ? "Not posted yet: " + miss.join(", ") + "." : "";
    dlg.showModal();
    dlg.scrollTop = 0;
    $("pd-close").focus();
  }

  btn.addEventListener("click", open);
  $("pd-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });   // click outside the sheet
  dlg.addEventListener("close", () => btn.focus());
  document.addEventListener("ringshown", e => update(e.detail.n));
  const shown = document.querySelector(".ring.sel");
  update(shown ? +shown.dataset.ring : 1);
})();
