// The walkable maze. A small amber lamp travels around a ring and passes between rings
// only through the gaps in the walls. The walls in the SVG are the single source of truth:
// gap and wall angles are read from their geometry, so movement always matches what is drawn.
// Depends on rings.js (RINGS, showRing, PREVIEW, TODAY), which loads first.
(function () {
  "use strict";
  const svg = document.getElementById("maze-svg");
  if (!svg || typeof RINGS === "undefined") return;

  const NS = "http://www.w3.org/2000/svg";
  const CX = 200, CY = 200, RAD = Math.PI / 180;
  const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SPEED = 125;          // viewBox units per second along a ring
  const TOKEN = 6;            // token half-width used for wall clearance
  const STORE = "logan-maze-v1";
  const mod = a => ((a % 360) + 360) % 360;
  const ang = (x, y) => mod(Math.atan2(y - CY, x - CX) / RAD);
  const hint = document.getElementById("maze-hint");
  const live = document.getElementById("maze-live");

  /* ---------- geometry, read from the drawn SVG ---------- */
  const outer = {};                       // ring n -> outer radius
  svg.querySelectorAll("circle.ring").forEach(c => { outer[+c.dataset.ring] = +c.getAttribute("r"); });
  const inner = n => (n < 8 ? outer[n + 1] : 0);
  const mid = n => (n < 8 ? (outer[n] + outer[n + 1]) / 2 : 0);
  const gaps = {};                        // boundary k (between ring k and k+1) -> {start, width, r}
  const rwall = {};                       // ring n -> angle of its radial wall
  svg.querySelectorAll("path.wall").forEach(p => {
    const m = p.getAttribute("d").match(/M([\d.-]+),([\d.-]+)\s*A([\d.-]+),[\d.-]+\s+0\s+(\d)\s+(\d)\s+([\d.-]+),([\d.-]+)/);
    if (!m) return;
    const r = +m[3];
    const k = Object.keys(outer).find(n => Math.abs(outer[+n + 1] - r) < 0.6);
    if (!k) return;
    const start = ang(+m[6], +m[7]);      // arc is drawn clockwise the long way round; the gap is from its end back to its start
    gaps[+k] = { start, width: mod(ang(+m[1], +m[2]) - start), r };
  });
  svg.querySelectorAll("line.wall").forEach(l => {
    const x = (+l.getAttribute("x1") + +l.getAttribute("x2")) / 2, y = (+l.getAttribute("y1") + +l.getAttribute("y2")) / 2;
    const d = Math.hypot(x - CX, y - CY);
    for (let n = 1; n < 8; n++) if (d < outer[n] && d > inner(n)) rwall[n] = ang(x, y);
  });
  const gapMid = k => mod(gaps[k].start + gaps[k].width / 2);
  const margin = n => (TOKEN / Math.max(mid(n), 14)) / RAD;   // wall clearance in degrees on ring n

  /* ---------- extra SVG parts: seals, center glow, flare, lamp ---------- */
  const mk = (tag, attrs, parent, before) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    (parent || svg).insertBefore(e, before || null);
    return e;
  };
  const defs = mk("defs", {}, svg, svg.firstChild);
  const grad = mk("radialGradient", { id: "lampGrad" }, defs);
  [["0", "#fff0c4", "1"], ["0.3", "#f3b24a", "0.9"], ["1", "#e8a53c", "0"]].forEach(s => mk("stop", { offset: s[0], "stop-color": s[1], "stop-opacity": s[2] }, grad));
  const grad2 = mk("radialGradient", { id: "coreGrad" }, defs);
  [["0", "#ffd58a", "0.95"], ["0.55", "#e8a53c", "0.45"], ["1", "#e8a53c", "0"]].forEach(s => mk("stop", { offset: s[0], "stop-color": s[1], "stop-opacity": s[2] }, grad2));

  const firstText = svg.querySelector("text");
  const ring8 = svg.querySelector('.ring[data-ring="8"]');
  const status = n => RINGS.find(r => r.n === n).status;
  const centerOpen = status(8) !== "locked" && status(8) === "reached";
  const centerGlow = mk("circle", { class: "center-glow", cx: CX, cy: CY, r: 34, fill: "url(#coreGrad)" }, svg, ring8.nextSibling);
  if (!centerOpen) centerGlow.style.display = "none";
  else ring8.classList.add("open");

  // A shut door across each gap that leads into a ring that is not yet open.
  const seals = {};
  for (let k = 1; k < 8; k++) {
    const g = gaps[k];
    if (!g || status(k + 1) !== "locked") continue;
    const a0 = g.start * RAD, a1 = (g.start + g.width) * RAD;
    const d = `M${(CX + g.r * Math.cos(a0)).toFixed(1)},${(CY + g.r * Math.sin(a0)).toFixed(1)} A${g.r},${g.r} 0 ${g.width > 180 ? 1 : 0} 1 ${(CX + g.r * Math.cos(a1)).toFixed(1)},${(CY + g.r * Math.sin(a1)).toFixed(1)}`;
    seals[k] = mk("path", { d, class: "seal" }, svg, firstText);
  }
  const flare = mk("circle", { class: "flare", cx: CX, cy: CY, r: 30 }, svg);
  const token = mk("g", { class: "lamp-token", "aria-hidden": "true" }, svg);
  const body = mk("g", { class: "lamp-body" }, token);
  mk("circle", { class: "lamp-glow", r: 15, fill: "url(#lampGrad)" }, body);
  mk("circle", { class: "lamp-core", r: 4.4 }, body);
  const hit = mk("circle", { class: "lamp-hit", r: 17 }, token);

  // Keyboard users walk the maze with the lamp; the rings themselves stay clickable.
  svg.querySelectorAll(".ring").forEach(r => r.setAttribute("tabindex", "-1"));

  /* ---------- state ---------- */
  let ring = 1, a = 270, vr = mid(1), va = 270;       // logical ring + angle, visual radius + angle
  let anim = null, auto = null, bumpT = 0, lastGap = "", lastTick = 0, running = false;
  const held = new Map();                             // key -> tangent direction (+1 clockwise)
  let drag = null, dragMoved = false;

  const ringOpen = n => status(n) !== "locked";
  const info = n => RINGS.find(r => r.n === n);
  const pos = (n, ang_) => mod(ang_ - rwall[n]);
  const clampPos = (n, p) => Math.min(360 - margin(n), Math.max(margin(n), p));

  function save() { try { localStorage.setItem(STORE, JSON.stringify({ ring, a })); } catch (e) {} }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE) || "null");
      if (s && s.ring >= 1 && s.ring <= 8 && typeof s.a === "number" && ringOpen(s.ring)) { ring = s.ring | 0; a = mod(s.a); }
    } catch (e) {}
    if (ring < 8) a = rwall[ring] + clampPos(ring, pos(ring, a));
    else a = gapMid(7);
  }
  function announce(t) { if (live) { live.textContent = ""; setTimeout(() => { live.textContent = t; }, 30); } }

  function place() {
    const r = vr, x = CX + r * Math.cos(va * RAD), y = CY + r * Math.sin(va * RAD);
    token.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
  }

  /* ---------- gaps ---------- */
  function inGap(k, ang_) {
    const g = gaps[k]; if (!g) return false;
    const rel = mod(ang_ - g.start), m = (TOKEN * 0.6 / g.r) / RAD; // clearance measured on the wall's own radius
    return rel >= m && rel <= g.width - m;
  }
  function gapNow() {
    if (anim) return "";
    const o = ring > 1 && inGap(ring - 1, a), i = ring < 8 && inGap(ring, a);
    return ring === 8 ? "out" : (o ? "out" : "") + (i ? "in" : "");
  }
  function watchGaps() {
    const g = gapNow();
    if (g !== lastGap) {
      lastGap = g;
      if (g.includes("in") || g.includes("out")) {
        const w = [g.includes("out") ? "outward" : "", g.includes("in") ? "inward" : ""].filter(Boolean).join(" and ");
        if (ring !== 8) announce("A gap opens " + w + ".");
      }
    }
  }

  /* ---------- moves ---------- */
  function light(n) {
    const el = svg.querySelector('.ring[data-ring="' + n + '"]');
    if (!el) return;
    el.classList.remove("lit"); void el.getBoundingClientRect(); el.classList.add("lit");
    setTimeout(() => el.classList.remove("lit"), 1100);
  }
  function doFlare() {
    flare.classList.remove("go"); void flare.getBoundingClientRect();
    if (!reduced) flare.classList.add("go");
    centerGlow.style.display = "";
  }
  function bump(msg) {
    body.classList.remove("shake"); void body.getBoundingClientRect();
    if (!reduced) body.classList.add("shake");
    clearTimeout(bumpT); bumpT = setTimeout(() => body.classList.remove("shake"), 450);
    if (msg) announce(msg);
  }
  function entered(n) {
    const r = info(n);
    showRing(n);
    light(n);
    if (n === 8 && status(8) === "reached") doFlare();
    announce((n === 8 ? "The center. " : "Ring " + n + ". ") + r.name + ". " + (r.status === "reached" ? "Reached." : "Approaching."));
    save();
  }

  // Pass through the gap on the boundary toward ring `to` (adjacent). Returns true if the move began.
  function pass(dir) {
    const to = ring + dir;
    if (to < 1 || to > 8 || anim) return false;
    const k = dir > 0 ? ring : ring - 1;
    if (ring !== 8 && !inGap(k, a)) { bump(); return false; }
    if (!ringOpen(to)) { showRing(to); bump("Ring " + to + ". Not yet reached."); light(to); return false; }
    const tgtA = to === 8 ? gapMid(7) : rwall[to] + clampPos(to, pos(to, a));
    let d = ((tgtA - va + 540) % 360) - 180;
    const dur = reduced ? 0 : 260;
    anim = { r0: vr, a0: va, r1: mid(to), da: d, t0: performance.now(), dur, to, a1: tgtA };
    ring = to; a = tgtA; auto = null;
    if (dur === 0) finishAnim(); else kick();
    return true;
  }
  function finishAnim() {
    vr = anim.r1; va = mod(anim.a0 + anim.da); const to = anim.to; anim = null;
    place(); entered(to); lastGap = gapNow();
  }

  function stepTangent(dir, deg) {
    if (ring === 8 || anim) return false;
    const p = pos(ring, a), np = clampPos(ring, p + dir * deg);
    const hit_ = Math.abs(np - (p + dir * deg)) > 1e-6;
    a = rwall[ring] + np; va = a;
    return !hit_;
  }

  /* ---------- decide what a key means (screen directions) ---------- */
  function decide(vx, vy) {
    if (anim) return null;
    if (ring === 8) return { type: "rad", dir: -1 };
    const c = Math.cos(a * RAD), s = Math.sin(a * RAD);
    const dc = -s * vx + c * vy;                       // clockwise tangent
    const dout = c * vx + s * vy;
    const rd = Math.abs(dout), rdir = dout > 0 ? -1 : 1;
    const k = rdir > 0 ? ring : ring - 1;
    const exists = ring + rdir >= 1 && ring + rdir <= 8;
    if (exists && rd >= Math.abs(dc) - 1e-6 && inGap(k, a)) return { type: "rad", dir: rdir };
    if (Math.abs(dc) > 0.2) return { type: "tan", dir: dc > 0 ? 1 : -1 };
    return { type: "wall" };
  }
  const KEYS = {
    ArrowUp: [0, -1], w: [0, -1], W: [0, -1], ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
    ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0], ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
  };

  svg.addEventListener("keydown", ev => {
    if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
    const v = KEYS[ev.key];
    if (!v) return;
    ev.preventDefault();
    if (ev.repeat && !reduced) return;
    auto = null;
    const d = decide(v[0], v[1]);
    if (!d) return;
    if (d.type === "rad") { held.clear(); pass(d.dir); }
    else if (d.type === "tan") {
      if (reduced) { if (!stepTangent(d.dir, 12)) bump(); place(); save(); watchGaps(); }
      else {
        // a quick tap still takes a visible step; holding the key keeps walking
        if (!ev.repeat) { if (!stepTangent(d.dir, 4)) bump(); place(); watchGaps(); }
        held.set(ev.key, d.dir); kick();
      }
    } else bump();
  });
  svg.addEventListener("keyup", ev => { if (held.delete(ev.key) && !held.size) save(); });
  svg.addEventListener("blur", () => { held.clear(); save(); });

  /* ---------- animation loop ---------- */
  function kick() { if (!running) { running = true; lastTick = performance.now(); requestAnimationFrame(tick); } }
  function tick(now) {
    const dt = Math.min(0.05, (now - lastTick) / 1000); lastTick = now;
    if (anim) {
      const t = anim.dur ? Math.min(1, (now - anim.t0) / anim.dur) : 1, e = t * t * (3 - 2 * t);
      vr = anim.r0 + (anim.r1 - anim.r0) * e; va = anim.a0 + anim.da * e; place();
      if (t >= 1) finishAnim();
    } else if (ring < 8) {
      let moved = false, blocked = false;
      if (held.size) {
        const dir = [...held.values()].pop(), deg = (SPEED * dt) / mid(ring) / RAD;
        if (stepTangent(dir, deg)) moved = true; else blocked = true;
      } else if (auto && auto.ang != null) {
        const p = pos(ring, a), tp = clampPos(ring, pos(ring, auto.ang)), diff = tp - p;
        const deg = reduced ? 360 : (SPEED * 1.4 * dt) / mid(ring) / RAD;
        if (Math.abs(diff) <= deg) {
          stepTangent(1, diff); moved = true;
          const then = auto.then; auto = null;
          if (then) { place(); pass(then); }
        } else { stepTangent(Math.sign(diff), deg); moved = true; }
      }
      if (blocked && !held.size) bump();
      if (moved || blocked) { place(); watchGaps(); }
    }
    if (anim || held.size || auto) requestAnimationFrame(tick); else { running = false; save(); }
  }

  /* ---------- pointer: click to walk, drag the lamp ---------- */
  function toSvg(ev) {
    const b = svg.getBoundingClientRect(), s = 400 / b.width;
    return { x: (ev.clientX - b.left) * s, y: (ev.clientY - b.top) * s };
  }
  svg.addEventListener("pointerdown", ev => { if (!ev.target.closest(".lamp-token")) svg.focus({ preventScroll: true }); });
  svg.addEventListener("click", ev => {
    if (dragMoved) { dragMoved = false; return; }
    const el = ev.target.closest && ev.target.closest(".ring");
    if (!el || anim) return;
    const n = +el.dataset.ring, p = toSvg(ev);
    held.clear(); svg.focus({ preventScroll: true });
    if (n === ring && ring < 8) { auto = { ang: ang(p.x, p.y) }; kick(); }
    else if (Math.abs(n - ring) === 1) {
      const dir = n > ring ? 1 : -1, k = dir > 0 ? ring : ring - 1;
      if (ring === 8) { pass(-1); return; }
      auto = { ang: gapMid(k), then: dir }; kick();
    }
  });
  hit.addEventListener("pointerdown", ev => {
    drag = { id: ev.pointerId, t: 0 }; dragMoved = false; held.clear(); auto = null;
    try { hit.setPointerCapture(ev.pointerId); } catch (e) {}
    token.classList.add("held"); svg.focus({ preventScroll: true });
    ev.preventDefault();
  });
  hit.addEventListener("pointermove", ev => {
    if (!drag || ev.pointerId !== drag.id || anim) return;
    const p = toSvg(ev), r = Math.hypot(p.x - CX, p.y - CY), t = ang(p.x, p.y);
    if (ring < 8 && r > 1) {
      const np = pos(ring, t), op = pos(ring, a);
      if (Math.abs(np - op) < 90) { const q = clampPos(ring, np); if (Math.abs(q - op) > 0.01) dragMoved = true; a = rwall[ring] + q; va = a; place(); watchGaps(); }
    }
    const now = performance.now();
    if (now - drag.t > 350) {
      if (r > outer[ring] - 1 && ring > 1) { drag.t = now; if (pass(-1)) dragMoved = true; }
      else if (ring < 8 && r < inner(ring) + 1) { drag.t = now; if (pass(1)) dragMoved = true; }
      else if (ring === 8 && r > 36) { drag.t = now; if (pass(-1)) dragMoved = true; }
    }
  });
  const endDrag = ev => { if (drag && ev.pointerId === drag.id) { drag = null; token.classList.remove("held"); save(); setTimeout(() => { dragMoved = false; }, 0); } };
  hit.addEventListener("pointerup", endDrag);
  hit.addEventListener("pointercancel", endDrag);
  hit.addEventListener("touchmove", ev => { if (drag) ev.preventDefault(); }, { passive: false });

  /* ---------- reset, hint, preview note ---------- */
  const resetBtn = document.getElementById("maze-reset");
  if (resetBtn) resetBtn.addEventListener("click", () => {
    held.clear(); auto = null; anim = null;
    ring = 1; a = 270; vr = mid(1); va = a; place();
    showRing(1); light(1); lastGap = gapNow(); announce("Back at the entrance. Ring 1, Build 1."); save();
  });
  if (hint) hint.textContent = (window.matchMedia && matchMedia("(pointer: coarse)").matches) ? "Tap a ring or drag the lamp to walk the maze" : "Use the arrow keys to walk the lamp inward";

  /* ---------- arrow keys work without clicking the maze first ----------
     While the maze is on screen, arrow keys pressed anywhere on the page (not in a form field)
     go to the maze instead of scrolling. Scroll past the maze and arrows scroll the page again. */
  const ARROWS = { ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1 };
  function mazeOnScreen() {
    const r = svg.getBoundingClientRect(), h = window.innerHeight;
    return r.height > 0 && r.top < h * 0.75 && r.bottom > h * 0.25;
  }
  function freeTarget(t) {
    return !t || t === document.body || t === document.documentElement ||
      !(t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest("details[open] summary, [role=slider]"));
  }
  document.addEventListener("keydown", ev => {
    if (!ARROWS[ev.key] || ev.altKey || ev.ctrlKey || ev.metaKey || svg.contains(ev.target)) return;
    if (!freeTarget(ev.target) || !mazeOnScreen()) return;
    ev.preventDefault();
    svg.focus({ preventScroll: true });
    svg.dispatchEvent(new KeyboardEvent("keydown", { key: ev.key, repeat: ev.repeat, bubbles: true, cancelable: true }));
  });
  const pv = document.getElementById("maze-preview");
  if (pv && typeof PREVIEW !== "undefined" && PREVIEW) {
    const d = new Date(TODAY + "T12:00:00");
    pv.hidden = false;
    pv.textContent = "Previewing as of " + d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + ". ";
    const back = document.createElement("a"); back.href = location.pathname; back.textContent = "Back to today"; pv.appendChild(back);
  }

  /* ---------- go ---------- */
  load();
  vr = mid(ring); va = a; place();
  showRing(ring);
  lastGap = gapNow();
  if (centerOpen) setTimeout(doFlare, reduced ? 0 : 500);
  window.__maze = { state: () => ({ ring, a, vr, va, anim: !!anim }), gaps, rwall, outer };
})();
