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

  /* ---------- Music: the Westworld main title (Ramin Djawadi), looping in the background ----------
     On by default. Browsers only allow sound after a visitor's first click, tap or key press on the
     page, so it starts at that first interaction, then keeps playing until someone presses Mute.
     Links inside the site swap the page in place (see "In-place page changes" below), so the song
     carries on from page to page without restarting. The file is audio/main-title.mp3. */
  var AC = window.AudioContext || window.webkitAudioContext;
  var VOLUME = 0.55;
  var AUDIO_URL = (function () {
    var me = document.querySelector('script[src$="fx.js"]');
    return me ? me.src.replace(/fx\.js(\?.*)?$/, 'audio/main-title.mp3') : 'audio/main-title.mp3';
  })();
  var ctx = null, master = null, buffer = null, source = null, startedAt = 0, loading = null;
  var muted = store('fx-music') === 'off';
  function savedPos() {
    try { var o = parseFloat(sessionStorage.getItem('fx-music-pos')); return isFinite(o) ? o : 0; } catch (e) { return 0; }
  }
  function position() {
    return (ctx && source && buffer) ? (ctx.currentTime - startedAt) % buffer.duration : savedPos();
  }
  function isPlaying() { return !!(ctx && source && ctx.state === 'running'); }
  function setup() {
    if (ctx || !AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    ctx.onstatechange = function () { paintPiano(); };
  }
  // Schedule the loop. If the browser is still holding audio back, it begins the moment it is allowed.
  function startSource() {
    if (muted || source || !buffer || !ctx) return;
    var off = savedPos() % buffer.duration, t = ctx.currentTime;
    source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(master);
    startedAt = t - off;
    source.start(0, off);
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(0, t);
    master.gain.linearRampToValueAtTime(VOLUME, t + 1.2);
  }
  function prepare() {
    if (muted || !AC) return;
    setup();
    if (buffer) { startSource(); return; }
    if (loading) return;
    loading = fetch(AUDIO_URL)
      .then(function (r) { if (!r.ok) throw new Error('music ' + r.status); return r.arrayBuffer(); })
      .then(function (d) { return new Promise(function (res, rej) { ctx.decodeAudioData(d, res, rej); }); })
      .then(function (b) { buffer = b; startSource(); paintPiano(); })
      .catch(function () { loading = null; });
  }
  function unlock() {
    if (muted) return;
    prepare();
    if (ctx && ctx.state !== 'running') {
      var p = ctx.resume();
      if (p && p.then) p.then(paintPiano, function () {});
    }
  }
  function stopMusic() {
    if (source) {
      try { sessionStorage.setItem('fx-music-pos', String(position())); } catch (e) {}
      try { source.stop(); } catch (e) {}
      source.disconnect();
      source = null;
    }
    if (ctx && ctx.state === 'running') ctx.suspend();
  }
  ['pointerdown', 'keydown', 'touchstart', 'click'].forEach(function (ev) {
    window.addEventListener(ev, function (e) {
      if (e.target && e.target.closest && e.target.closest('.fx-dock')) return;
      if (!isPlaying()) unlock();
    }, { capture: true, passive: true });
  });
  window.addEventListener('pagehide', function () {
    if (source) try { sessionStorage.setItem('fx-music-pos', String(position())); } catch (e) {}
  });
  function paintPiano() {
    var on = isPlaying();
    pBtn.classList.toggle('fx-playing', on);
    pBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    pLabel.textContent = muted ? 'Unmute' : 'Mute';
    pBtn.title = muted ? 'Turn the music back on'
      : (on ? 'Mute the music' : 'Music is on. It starts with your first click or key press. Press to turn it off.');
    pBtn.setAttribute('aria-label', muted ? 'Music muted. Activate to turn it back on.' : 'Mute the background music');
  }
  pBtn.addEventListener('click', function () {
    if (muted) { muted = false; store('fx-music', 'on'); unlock(); }
    else { muted = true; store('fx-music', 'off'); stopMusic(); }
    paintPiano();
  });
  // Read-only status, used by the site's own browser test.
  window.__music = function () {
    return { state: ctx ? ctx.state : 'none', playing: isPlaying(), muted: muted, position: +position().toFixed(2), loaded: !!buffer };
  };

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

  /* ---------- In-place page changes ----------
     Clicking a link to another page of this site fetches that page and swaps its content in,
     instead of a full page load, so the music never stops. The address bar, Back/Forward and
     #section links work as usual. If anything goes wrong it falls back to a normal page load. */
  var pagePath = location.pathname + location.search, navBusy = false, queued = null;
  function internalUrl(a) {
    if (!a || !a.getAttribute('href') || a.hasAttribute('download')) return null;
    if (a.target && a.target !== '_self') return null;
    var u;
    try { u = new URL(a.href, location.href); } catch (e) { return null; }
    if (u.origin !== location.origin) return null;
    if (!/(\.html|\/)$/.test(u.pathname)) return null;
    if (u.pathname + u.search === pagePath) return null;   // just a #section on this page
    return u;
  }
  function scrollToHash(hash) {
    var t = hash && document.getElementById(decodeURIComponent(hash.slice(1)));
    if (t) t.scrollIntoView(); else window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function goTo(href, push) {
    if (navBusy) { queued = { href: href, push: push }; return; }   // e.g. Back pressed twice quickly
    navBusy = true;
    fetch(href, { credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw new Error('page ' + r.status); return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var srcs = Array.prototype.map.call(doc.body.querySelectorAll('script[src]'), function (s) {
          return new URL(s.getAttribute('src'), href).href;
        }).filter(function (s) { return !/\/fx\.js(\?|$)/.test(s); });
        return Promise.all(srcs.map(function (s) {
          return fetch(s).then(function (r) { if (!r.ok) throw new Error('script ' + r.status); return r.text(); });
        })).then(function (code) { return { doc: doc, code: code }; });
      })
      .then(function (p) {
        var swap = function () {
          if (push) history.pushState({}, '', href);
          pagePath = location.pathname + location.search;
          document.title = p.doc.title;
          Array.prototype.slice.call(document.body.children).forEach(function (n) { if (n !== dock) n.remove(); });
          Array.prototype.slice.call(p.doc.body.childNodes).forEach(function (n) {
            if (n.nodeName !== 'SCRIPT') document.body.insertBefore(document.importNode(n, true), dock);
          });
          document.body.className = p.doc.body.className;
          // Run the new page's own scripts together in one scope (they share names like RINGS).
          try { new Function(p.code.join('\n;\n'))(); } catch (e) { console.error(e); }
          scrollToHash(new URL(href).hash);
          var main = document.getElementById('main');
          if (main) { main.setAttribute('tabindex', '-1'); main.focus({ preventScroll: true }); }
        };
        var done = (document.startViewTransition && !reduce)
          ? document.startViewTransition(swap).updateCallbackDone
          : Promise.resolve().then(swap);
        return done.then(function () {
          navBusy = false;
          if (queued) { var q = queued; queued = null; goTo(q.href, q.push); }
          else if (!push && location.pathname + location.search !== pagePath) goTo(location.href, false);
        });
      })
      .catch(function () { navBusy = false; location.href = href; });
  }
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    var u = internalUrl(a);
    if (!u) return;
    e.preventDefault();
    goTo(u.href, true);
  });
  window.addEventListener('popstate', function () {
    if (location.pathname + location.search === pagePath) { scrollToHash(location.hash); return; }
    goTo(location.href, false);
  });

  /* ---------- boot ---------- */
  function boot() {
    document.body.appendChild(dock);
    paintPiano();
    prepare();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
