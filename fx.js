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
  var pLabel = el('span', null, 'Main title');
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

  /* ---------- 4. Main title (the official HBO opening credits, embedded from YouTube) ----------
     Nothing plays until a visitor clicks. The video stays visible in a small card, as YouTube requires. */
  var TITLE_VIDEO = 'elkHuRROPfk'; // "Westworld Season 1 Opening Credits | HBO" on HBO's YouTube channel
  var playing = false, card = null;
  function openTitle() {
    card = el('div', 'fx-title');
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', 'Westworld main title');
    var head = el('div', 'fx-title-head');
    head.appendChild(el('span', null, 'Main title · Ramin Djawadi · HBO'));
    var x = el('button', 'fx-title-x', 'Close');
    x.type = 'button';
    x.setAttribute('aria-label', 'Stop and close the main title');
    x.addEventListener('click', function () { closeTitle(); paintPiano(); pBtn.focus(); });
    head.appendChild(x);
    var frame = document.createElement('iframe');
    frame.src = 'https://www.youtube-nocookie.com/embed/' + TITLE_VIDEO + '?autoplay=1&rel=0&playsinline=1&modestbranding=1';
    frame.title = 'Westworld Season 1 opening credits (HBO)';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture';
    frame.setAttribute('allowfullscreen', '');
    card.appendChild(head); card.appendChild(frame);
    document.body.appendChild(card);
    playing = true;
  }
  function closeTitle() { if (card) { card.remove(); card = null; } playing = false; }
  function paintPiano() {
    pBtn.classList.toggle('fx-playing', playing);
    pBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    pLabel.textContent = playing ? 'Main title on' : 'Main title';
    pBtn.title = playing ? 'Stop the Westworld main title' : 'Play the Westworld main title (HBO opening credits)';
    pBtn.setAttribute('aria-label', playing ? 'Main title: playing. Activate to stop.' : 'Play the Westworld main title');
  }
  pBtn.addEventListener('click', function () {
    if (playing) closeTitle(); else openTitle();
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
