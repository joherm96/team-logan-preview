/* ==========================================================================
   paths.js  -  host cards, Then/Now sliders, home-page path cards.

   >>> HOW TO SET YOUR HOST ATTRIBUTES (the only thing teammates edit here) <<<
   Find your name in HOSTS below. Replace each `null` with a whole number from
   1 to 20 (1 = low, 20 = high). Leave `null` for any you have not chosen yet:
   that bar shows as "uncalibrated" with a [set by <you>] note. Save the file;
   your card on your Path page AND the mini card on the home page both update.
   Do not change the names in quotes or the commas. Example:
       'Candor': 14,
   Everything below the HOSTS block is code and does not need editing.
   ========================================================================== */
(function () {
  'use strict';

  var HOSTS = {
    ian:    { name: 'Ian Schwartz',   role: 'Ford', values: {
      'Bulk Apperception': null,
      'Candor': null,
      'Vivacity': null,
      'Coordination': null,
      'Imagination': null,
      'Humility': null,
      'Curiosity': null,
      'Self-Preservation': null
    } },
    kaylee: { name: 'Kaylee Schmid',  role: 'Charlotte', values: {
      'Bulk Apperception': null,
      'Candor': null,
      'Vivacity': null,
      'Coordination': null,
      'Imagination': null,
      'Humility': null,
      'Curiosity': null,
      'Self-Preservation': null
    } },
    neve:   { name: 'Neve Healy',     role: 'Bernard', values: {
      'Bulk Apperception': null,
      'Candor': null,
      'Vivacity': null,
      'Coordination': null,
      'Imagination': null,
      'Humility': null,
      'Curiosity': null,
      'Self-Preservation': null
    } },
    aaron:  { name: 'Aaron Mendoza',  role: 'Elsie', values: {
      'Bulk Apperception': null,
      'Candor': null,
      'Vivacity': null,
      'Coordination': null,
      'Imagination': null,
      'Humility': null,
      'Curiosity': null,
      'Self-Preservation': null
    } },
    noah:   { name: 'Noah Lowenthal', role: 'The Man in Black', values: {
      'Bulk Apperception': null,
      'Candor': null,
      'Vivacity': null,
      'Coordination': null,
      'Imagination': null,
      'Humility': null,
      'Curiosity': null,
      'Self-Preservation': null
    } },
    jonah:  { name: 'Jonah Herman',   role: 'Arnold', values: {
      'Bulk Apperception': null,
      'Candor': null,
      'Vivacity': null,
      'Coordination': null,
      'Imagination': null,
      'Humility': null,
      'Curiosity': null,
      'Self-Preservation': null
    } }
  };
  /* ======================= end of the editable block ======================= */

  var ATTRS = ['Bulk Apperception', 'Candor', 'Vivacity', 'Coordination',
               'Imagination', 'Humility', 'Curiosity', 'Self-Preservation'];
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function val(host, attr) {
    var v = host.values[attr];
    if (typeof v !== 'number' || isNaN(v)) return null;
    return Math.max(1, Math.min(20, Math.round(v)));
  }
  function firstName(host) { return host.name.split(' ')[0]; }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function onceVisible(node, fn) {
    if (reduce || !('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); fn(); }
    }, { threshold: 0.2 });
    io.observe(node);
  }

  /* ---------- Facts: make [bracket] placeholders look intentional ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.fact dd'), function (dd) {
    if (/^\s*\[/.test(dd.textContent)) dd.classList.add('is-empty');
  });

  /* ---------- Host card (Path pages) ---------- */
  function buildCard(mount, host) {
    var why = mount.querySelector('.host-why');
    var hostline = document.querySelector('.hostline');
    var hostlineText = hostline ? hostline.textContent : 'Host: ' + host.role;
    var vals = ATTRS.map(function (a) { return val(host, a); });
    var missing = vals.filter(function (v) { return v === null; }).length;
    var fname = firstName(host);

    var card = el('div', 'hc');
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-pressed', 'false');
    var summary = ATTRS.map(function (a, i) {
      return a + ' ' + (vals[i] === null ? 'uncalibrated' : vals[i] + ' of 20');
    }).join(', ');
    card.setAttribute('aria-label', 'Host profile for ' + host.name + ', ' + host.role + '. ' +
      summary + '. Press to flip the card.');

    var inner = el('div', 'hc-inner');
    var front = el('div', 'hc-face hc-front');
    var back = el('div', 'hc-face hc-back');

    var top = el('div', 'hc-top');
    top.appendChild(el('span', 'hc-tag', 'Host attribute matrix'));
    top.appendChild(el('span', 'hc-state', missing ? 'Uncalibrated' : 'Calibrated'));
    front.appendChild(top);
    front.appendChild(el('div', 'hc-name', host.name));
    front.appendChild(el('div', 'hc-role', host.role));

    var rows = el('div', 'hc-rows');
    ATTRS.forEach(function (a, i) {
      var v = vals[i];
      var row = el('div', 'hc-row' + (v === null ? ' empty' : ''));
      row.style.setProperty('--i', i);
      row.appendChild(el('span', 'hc-label', a));
      var track = el('span', 'hc-track');
      var fill = el('span', 'hc-fill');
      fill.style.setProperty('--v', v === null ? 0 : v / 20);
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el('span', 'hc-val', v === null ? '--' : String(v)));
      rows.appendChild(row);
    });
    front.appendChild(rows);
    front.appendChild(el('div', 'hc-note', missing ? '[set by ' + fname + ']' : 'All attributes set'));
    front.appendChild(el('div', 'hc-hint', 'Press to flip'));

    var btop = el('div', 'hc-top');
    btop.appendChild(el('span', 'hc-tag', 'Host narrative'));
    btop.appendChild(el('span', 'hc-state', 'Role'));
    back.appendChild(btop);
    back.appendChild(el('div', 'hc-role hc-role-big', host.role));
    back.appendChild(el('div', 'hc-hostline', hostlineText));
    if (why) { back.appendChild(why); } else { back.appendChild(el('p', 'slot host-why', '[One line by ' + fname + ': why this host]')); }
    back.appendChild(el('div', 'hc-hint', 'Press to flip back'));
    back.setAttribute('aria-hidden', 'true');

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);
    mount.appendChild(card);

    function flip() {
      var on = card.classList.toggle('flipped');
      card.setAttribute('aria-pressed', on ? 'true' : 'false');
      front.setAttribute('aria-hidden', on ? 'true' : 'false');
      back.setAttribute('aria-hidden', on ? 'false' : 'true');
    }
    card.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) return;
      flip();
    });
    card.addEventListener('keydown', function (e) {
      if (e.target !== card) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); flip(); }
    });
    onceVisible(card, function () {
      requestAnimationFrame(function () { requestAnimationFrame(function () { card.classList.add('on'); }); });
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('.host-mount[data-member]'), function (m) {
    var host = HOSTS[m.getAttribute('data-member')];
    if (host) buildCard(m, host);
  });

  /* ---------- Mini cards (home page Paths grid) ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.path-card[data-member]'), function (card) {
    var host = HOSTS[card.getAttribute('data-member')];
    var mini = card.querySelector('.mini');
    if (!host || !mini) return;
    var any = false;
    ATTRS.forEach(function (a, i) {
      var v = val(host, a);
      if (v !== null) any = true;
      var bar = el('i', v === null ? 'empty' : '');
      bar.style.setProperty('--v', v === null ? 0 : v / 20);
      bar.style.setProperty('--i', i);
      bar.title = a + (v === null ? ': uncalibrated' : ': ' + v + ' of 20');
      mini.appendChild(bar);
    });
    var note = card.querySelector('.mini-note');
    if (note) note.textContent = any ? 'Host attributes' : 'Uncalibrated';
    onceVisible(card, function () {
      requestAnimationFrame(function () { requestAnimationFrame(function () { card.classList.add('on'); }); });
    });
    if (reduce) return;
    card.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg');
      card.style.setProperty('--rx', (-y * 9).toFixed(2) + 'deg');
    });
    function reset() { card.style.removeProperty('--ry'); card.style.removeProperty('--rx'); }
    card.addEventListener('pointerleave', reset);
    card.addEventListener('blur', reset);
  });

  /* ---------- Then / Now slider ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-tn]'), function (tn) {
    var stage = tn.querySelector('.tn-stage');
    var handle = tn.querySelector('.tn-handle');
    if (!stage || !handle) return;
    var pos = 50, dragging = false;
    function set(p) {
      pos = Math.max(25, Math.min(75, p)); // columns reflow, so keep both readable
      stage.style.setProperty('--pos', pos + '%');
      var r = Math.round(pos);
      handle.setAttribute('aria-valuenow', String(r));
      handle.setAttribute('aria-valuetext',
        r === 0 ? 'All Now' : r === 100 ? 'All Then' : r + ' percent Then, ' + (100 - r) + ' percent Now');
    }
    function fromEvent(e) {
      var r = stage.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width) * 100);
    }
    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button > 0) return;
      dragging = true;
      tn.classList.add('dragging');
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      fromEvent(e);
      handle.focus({ preventScroll: true });
    });
    stage.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
    function end() { dragging = false; tn.classList.remove('dragging'); }
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    handle.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 20 : 5, k = e.key, handled = true;
      if (k === 'ArrowLeft' || k === 'ArrowDown') set(pos - step);
      else if (k === 'ArrowRight' || k === 'ArrowUp') set(pos + step);
      else if (k === 'PageDown') set(pos - 20);
      else if (k === 'PageUp') set(pos + 20);
      else if (k === 'Home') set(0);
      else if (k === 'End') set(100);
      else handled = false;
      if (handled) e.preventDefault();
    });
    set(50);
  });
})();
