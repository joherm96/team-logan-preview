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
  dock.setAttribute('aria-label', 'Sound control');
  var pBtn = el('button', 'fx-btn');
  pBtn.type = 'button';
  var pLabel = el('span', null, 'Music');
  var roll = el('span', 'fx-roll');
  roll.setAttribute('aria-hidden', 'true');
  for (var i = 0; i < 4; i++) roll.appendChild(el('i'));
  pBtn.appendChild(pLabel); pBtn.appendChild(roll);
  pBtn.setAttribute('aria-pressed', 'false');
  dock.appendChild(pBtn);

  /* ---------- Music: the Westworld main title on a synthesized piano, looping ----------
     Notes come from theme-notes.js (transcribed from the soundtrack). It starts on its own; browsers
     only allow sound after a visitor's first click, tap or key press, so if the page is blocked it
     starts at that first interaction. The small button mutes it, and the choice is remembered. */
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null, master = null, startAt = 0, nextIdx = 0, loopN = 0, timer = null, loaded = false;
  var muted = store('fx-music') === 'off';
  function resumeOffset() {
    try { var o = parseFloat(sessionStorage.getItem('fx-music-pos')); return isFinite(o) ? o : 0; } catch (e) { return 0; }
  }
  function songTime() { return ctx ? ctx.currentTime - startAt : 0; }
  function makeVerb() {
    var len = ctx.sampleRate * 2.2, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var j = 0; j < len; j++) d[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / len, 3);
    }
    var v = ctx.createConvolver(); v.buffer = buf; return v;
  }
  function setup() {
    if (ctx || !AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 4;
    var dry = ctx.createGain(); dry.gain.value = .85;
    var wet = ctx.createGain(); wet.gain.value = .28;
    var verb = makeVerb();
    master.connect(dry); master.connect(verb); verb.connect(wet);
    dry.connect(comp); wet.connect(comp); comp.connect(ctx.destination);
  }
  function note(t, dur, p, vel) {
    var f = 440 * Math.pow(2, (p - 69) / 12);
    var amp = Math.pow(vel / 127, 1.7) * (p < 40 ? .5 : p < 52 ? .75 : 1) * .32;
    var decay = Math.max(.35, 2.6 - (p - 30) * .03);              // low strings ring longer
    var end = t + Math.min(dur + .35, decay * 2.5);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(amp, t + .006);
    g.gain.setTargetAtTime(amp * .35, t + .006, decay * .35);   // hammer thump fades
    g.gain.setTargetAtTime(0, t + dur, .12);                     // key release
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(9000, f * 6 + vel * 25), t);
    lp.frequency.setTargetAtTime(f * 2.2 + 300, t, .25);
    lp.connect(g); g.connect(master);
    [[1, 1, 'triangle'], [2.003, .32, 'sine'], [3.01, .12, 'sine'], [.5, p < 50 ? 0 : .06, 'sine']].forEach(function (h) {
      if (!h[1]) return;
      var o = ctx.createOscillator(), og = ctx.createGain();
      o.type = h[2]; o.frequency.value = f * h[0]; o.detune.value = (Math.random() - .5) * 6;
      og.gain.value = h[1]; o.connect(og); og.connect(lp);
      o.start(t); o.stop(end + .5);
    });
  }
  function schedule() {
    var horizon = songTime() + .35, base = loopN * THEME_END / 100;
    while (true) {
      if (nextIdx * 4 >= THEME.length) { loopN++; nextIdx = 0; base = loopN * THEME_END / 100; continue; }
      var t = THEME[nextIdx * 4] / 100 + base;
      if (t > horizon) break;
      if (t >= songTime() - .02) note(startAt + t, THEME[nextIdx * 4 + 1] / 100, THEME[nextIdx * 4 + 2], THEME[nextIdx * 4 + 3]);
      nextIdx++;
    }
  }
  function begin() {
    if (!ctx || timer || muted || ctx.state !== 'running' || !loaded) return;
    var off = resumeOffset() % (THEME_END / 100);
    startAt = ctx.currentTime + .1 - off; loopN = 0; nextIdx = 0;
    while (nextIdx * 4 < THEME.length && THEME[nextIdx * 4] / 100 < off) nextIdx++;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5);
    schedule(); timer = setInterval(schedule, 100);
    paintPiano();
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    if (ctx) { try { sessionStorage.setItem('fx-music-pos', String(songTime())); } catch (e) {} ctx.close(); ctx = null; }
    paintPiano();
  }
  function tryStart() {
    if (muted) return;
    setup(); if (!ctx) return;
    var r = ctx.resume(); if (r && r.then) r.then(begin, function () {}); else begin();
    setTimeout(begin, 60);
  }
  ['pointerdown', 'keydown', 'touchstart', 'click'].forEach(function (ev) {
    window.addEventListener(ev, function (e) {
      if (e.target && e.target.closest && e.target.closest('.fx-dock')) return;
      if (!timer) tryStart();
    }, { capture: true, passive: true });
  });
  window.addEventListener('pagehide', function () {
    if (ctx && timer) try { sessionStorage.setItem('fx-music-pos', String(songTime())); } catch (e) {}
  });
  function paintPiano() {
    var on = !!timer;
    pBtn.classList.toggle('fx-playing', on);
    pBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    pLabel.textContent = muted ? 'Unmute' : (on ? 'Mute' : 'Music');
    pBtn.title = muted ? 'Turn the music back on' : (on ? 'Mute the music' : 'The music starts with your first click or key press');
    pBtn.setAttribute('aria-label', muted ? 'Music muted. Activate to turn it on.' : 'Mute the background music');
  }
  pBtn.addEventListener('click', function () {
    if (timer) { muted = true; store('fx-music', 'off'); stop(); }
    else { muted = false; store('fx-music', 'on'); tryStart(); }
    paintPiano();
  });
  function loadNotes() {
    var sc = document.createElement('script');
    var me = document.querySelector('script[src$="fx.js"]');
    sc.src = me ? me.src.replace(/fx\.js(\?.*)?$/, 'theme-notes.js') : 'theme-notes.js';
    sc.onload = function () { loaded = true; tryStart(); };
    document.head.appendChild(sc);
  }

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
      if (egg) clearEgg();
      return;
    }
    if (typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length !== 1 || e.key === "'" || e.key === '’') return;
    buf = (buf + e.key.toLowerCase()).slice(-40);
    if (/these violent delights$/.test(buf)) { buf = ''; showEgg('These violent delights have violent ends.', {}); }
    else if (/doesnt look like anything$/.test(buf)) { buf = ''; showEgg('Doesn’t look like anything to me.', { small: true }); }
  });
  try { console.log('%cSome doors only open for those who remember the words.', 'font-style:italic;color:#b07a3e'); } catch (e) {}

  /* ---------- boot ---------- */
  function boot() {
    document.body.appendChild(dock);
    paintPiano();
    loadNotes();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
