/* fx: site-wide effects layer. Injects all of its own DOM; no HTML edits needed. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {}
    return null;
  }
  function typing(t) {
    return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  /* ---------- Dock ---------- */
  var dock = el('div', 'fx-dock');
  dock.setAttribute('role', 'group');
  dock.setAttribute('aria-label', 'Display and sound controls');
  var aBtn = el('button', 'fx-btn', 'Analysis');
  aBtn.type = 'button';
  aBtn.title = 'Freeze all motor functions: enter analysis mode';
  aBtn.setAttribute('aria-label', 'Freeze all motor functions: enter analysis mode');
  aBtn.setAttribute('aria-pressed', 'false');
  var pBtn = el('button', 'fx-btn');
  pBtn.type = 'button';
  var pLabel = el('span', null, 'Player piano');
  var roll = el('span', 'fx-roll');
  roll.setAttribute('aria-hidden', 'true');
  for (var i = 0; i < 4; i++) roll.appendChild(el('i'));
  pBtn.appendChild(pLabel); pBtn.appendChild(roll);
  pBtn.setAttribute('aria-pressed', 'false');
  dock.appendChild(aBtn); dock.appendChild(pBtn);

  /* ---------- 1. Analysis mode ---------- */
  var readout = el('div', 'fx-readout');
  readout.setAttribute('role', 'status');
  var DUE = [[8, 11], [8, 25], [9, 9], [9, 23], [10, 6], [10, 20], [11, 11], [11, 18]]; // month index, day (Build 1..8, 2026)
  function buildCount() {
    var now = new Date(), n = 0;
    for (var j = 0; j < DUE.length; j++) {
      if (now >= new Date(2026, DUE[j][0], DUE[j][1], 23, 59)) n++;
    }
    return n;
  }
  function pageName() {
    return (document.title || '').replace(/\s*[—-]\s*Team Logan\s*$/, '') || document.title;
  }
  function fillReadout() {
    readout.textContent = 'ANALYSIS · Team Logan · page: ' + pageName() + ' · build count: ' + buildCount() + ' of 8 due';
  }
  function tagElements() {
    var nodes = document.querySelectorAll('[data-thinkers],[data-analysis]');
    for (var j = 0; j < nodes.length; j++) {
      var n = nodes[j], parts = [];
      var th = n.getAttribute('data-thinkers');
      if (th) parts.push('Sources: ' + th.split(';').map(function (s) { return s.trim(); }).filter(Boolean).join(' / '));
      var an = n.getAttribute('data-analysis');
      if (an) parts.push(an);
      n.setAttribute('data-fx-tag', parts.join('\n'));
    }
  }
  function setAnalysis(on, persist) {
    root.classList.toggle('fx-analysis', on);
    aBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) fillReadout();
    if (persist !== false) store('fx-analysis', on ? '1' : '0');
  }
  var q = '';
  try { q = new URLSearchParams(location.search).get('analysis'); } catch (e) {}
  var startOn = q === '1' ? true : q === '0' ? false : store('fx-analysis') === '1';

  /* ---------- 4. Player piano (public domain: Scott Joplin, The Entertainer, 1902; written out by hand, approximate) ---------- */
  // Grid of sixteenths, 8 per bar (2/4). Notes: [midi-ish name, length in sixteenths]; null = rest.
  var N = { C4: 60, 'C#4': 61, D4: 62, 'D#4': 63, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71, C5: 72, 'C#5': 73, D5: 74, 'D#5': 75, E5: 76, F5: 77, 'F#5': 78, G5: 79 };
  var PICK = [['D4', 1], ['D#4', 1], ['E4', 1]];
  var MEL = [
    [['C5', 4], ['E4', 2], ['C5', 2]],
    [['E4', 2], ['C5', 6]],
    [['C5', 2], ['D5', 2], ['D#5', 2], ['E5', 2]],
    [['C5', 2], ['D5', 2], ['E5', 4]],
    [['B4', 2], ['D5', 6]],
    [['C5', 4], [null, 1]].concat(PICK),
    [['C5', 4], ['E4', 2], ['C5', 2]],
    [['E4', 2], ['C5', 4], [null, 2]],
    [['G4', 2], ['C5', 2], ['E5', 2], ['G5', 2]],
    [['E5', 4], ['C5', 4]],
    [['A4', 2], ['C5', 2], ['F5', 2], ['E5', 2]],
    [['D5', 4], ['C5', 2], ['A4', 2]],
    [['G4', 2], ['C5', 2], ['E5', 2], ['C5', 2]],
    [['A4', 2], ['C#5', 2], ['E5', 2], ['G5', 2]],
    [['F#5', 2], ['D5', 2], ['A4', 2], ['C5', 2]],
    [['B4', 4], [null, 1]].concat(PICK)
  ];
  // Left hand per bar: [bass midi, chord midis]
  var C_ = [48, [52, 55, 60]], G7 = [43, [53, 59, 62]], F_ = [41, [57, 60, 65]], A7 = [45, [55, 61, 64]], D7 = [50, [54, 57, 60]];
  var LH = [C_, C_, C_, C_, G7, C_, C_, C_, C_, C_, F_, F_, C_, A7, D7, G7];
  var SIXTEENTH = 0.16; // seconds (about 94 bpm)

  var ctx = null, master = null, timer = null, nextBar = 0, barIdx = 0, playing = false;
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function note(m, t, dur, vel) {
    var cents = (Math.random() - 0.5) * 10; // slight detune
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2600;
    lp.connect(master); g.connect(lp);
    [['triangle', 1, 1], ['sine', 2, 0.35]].forEach(function (o) {
      var osc = ctx.createOscillator(), og = ctx.createGain();
      osc.type = o[0]; osc.frequency.value = hz(m) * o[1]; osc.detune.value = cents;
      og.gain.value = o[2];
      osc.connect(og); og.connect(g);
      osc.start(t); osc.stop(t + dur + 0.05);
    });
  }
  function scheduleBar(t) {
    var pos = 0, mel = MEL[barIdx], lh = LH[barIdx];
    mel.forEach(function (n) {
      if (n[0]) note(N[n[0]], t + pos * SIXTEENTH, Math.max(0.35, n[1] * SIXTEENTH * 1.6), 0.5);
      pos += n[1];
    });
    note(lh[0], t, 0.55, 0.42);
    lh[1].forEach(function (m) { note(m, t + 4 * SIXTEENTH, 0.4, 0.22); });
    barIdx = (barIdx + 1) % MEL.length;
  }
  function pump() {
    while (nextBar < ctx.currentTime + 0.6) {
      scheduleBar(nextBar);
      nextBar += 8 * SIXTEENTH;
    }
  }
  function startPiano() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.07;
      master.connect(ctx.destination);
      if (ctx.resume) ctx.resume();
      barIdx = 0; nextBar = ctx.currentTime + 0.1;
      pump(); timer = setInterval(pump, 150);
      playing = true;
      return true;
    } catch (e) { ctx = null; return false; }
  }
  function stopPiano() {
    playing = false;
    if (timer) { clearInterval(timer); timer = null; }
    if (ctx) {
      try { master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08); } catch (e) {}
      var c = ctx; ctx = null;
      setTimeout(function () { try { c.close(); } catch (e) {} }, 500);
    }
  }
  function paintPiano() {
    var wanted = store('fx-piano') === '1';
    pBtn.classList.toggle('fx-playing', playing);
    pBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    pLabel.textContent = playing ? 'Piano on' : (wanted ? 'Resume piano' : 'Player piano');
    pBtn.title = playing ? 'Stop the player piano' : (wanted ? 'Resume the player piano (audio needs a click)' : 'Play a quiet public-domain player piano rag (Joplin, 1902)');
    pBtn.setAttribute('aria-label', playing ? 'Player piano: on. Activate to stop.' : (wanted ? 'Resume player piano' : 'Player piano: off. Activate to play a quiet rag.'));
  }
  pBtn.addEventListener('click', function () {
    if (playing) { stopPiano(); store('fx-piano', '0'); }
    else if (startPiano()) store('fx-piano', '1');
    paintPiano();
  });
  aBtn.addEventListener('click', function () { setAnalysis(!root.classList.contains('fx-analysis')); });

  /* ---------- 2. Easter eggs ---------- */
  var egg = null, eggTimers = [];
  function clearEgg() {
    eggTimers.forEach(clearTimeout); eggTimers = [];
    if (egg) { var e = egg; egg = null; e.classList.remove('fx-on'); setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, reduce ? 0 : 900); }
  }
  function later(fn, ms) { eggTimers.push(setTimeout(fn, ms)); }
  function showEgg(text, opts) {
    clearEgg();
    egg = el('div', 'fx-egg' + (opts.small ? ' fx-small' : ''));
    egg.setAttribute('role', 'status');
    var lamp = el('div', 'fx-egg-lamp'); lamp.setAttribute('aria-hidden', 'true');
    var tx = el('p', 'fx-egg-text');
    egg.appendChild(lamp); egg.appendChild(tx);
    document.body.appendChild(egg);
    void egg.offsetWidth;
    egg.classList.add('fx-on');
    if (reduce) {
      tx.textContent = text;
      later(clearEgg, 2200);
      return;
    }
    var k = 0, step = opts.small ? 40 : 65;
    function type() {
      k++; tx.textContent = text.slice(0, k);
      if (k < text.length) later(type, step);
      else {
        if (!opts.small) { egg.classList.add('fx-flare'); }
        later(clearEgg, opts.small ? 1800 : 2600);
      }
    }
    later(type, opts.small ? 250 : 900);
  }
  var buf = '', lastKey = 0;
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (egg) { clearEgg(); return; }
      if (root.classList.contains('fx-analysis')) setAnalysis(false);
      return;
    }
    if (typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    var now = Date.now(), fresh = now - lastKey > 1500; // a lone press, not part of typing a phrase
    lastKey = now;
    if ((e.key === 'a' || e.key === 'A') && fresh && !e.repeat) {
      setAnalysis(!root.classList.contains('fx-analysis'));
    }
    if (e.key.length !== 1 || e.key === "'" || e.key === '’') return;
    buf = (buf + e.key.toLowerCase()).slice(-40);
    if (/these violent delights$/.test(buf)) { buf = ''; showEgg('These violent delights have violent ends.', {}); }
    else if (/doesnt look like anything$/.test(buf)) { buf = ''; showEgg('Doesn’t look like anything to me.', { small: true }); }
  });
  try { console.log('%cSome doors only open for those who remember the words.', 'font-style:italic;color:#b07a3e'); } catch (e) {}

  /* ---------- 3. Reveries glitch-in ---------- */
  function initReveries() {
    var arts = document.querySelectorAll('.rev article');
    if (!arts.length || reduce || !('IntersectionObserver' in window)) return;
    root.classList.add('fx-rev');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var a = en.target; io.unobserve(a);
        a.classList.add('fx-glitch');
        setTimeout(function () { a.classList.add('fx-in'); a.classList.remove('fx-glitch'); }, 720);
      });
    }, { threshold: 0.12 });
    arts.forEach(function (a) { io.observe(a); });
  }

  /* ---------- boot ---------- */
  function boot() {
    document.body.insertBefore(readout, document.body.firstChild);
    document.body.appendChild(dock);
    tagElements();
    setAnalysis(startOn, false);
    paintPiano();
    initReveries();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
