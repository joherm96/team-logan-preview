/* paths.js: Then/Now slider and fact placeholders on member Path pages. */
(function () {
  'use strict';
  /* ---------- Facts: make [bracket] placeholders look intentional ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.fact dd'), function (dd) {
    if (/^\s*\[/.test(dd.textContent)) dd.classList.add('is-empty');
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
