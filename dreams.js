/* Dreams page: before/after reveal slider + loupe. Vanilla JS, no deps. */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Dream I: reveal slider (left of divider = original, right = dreamed) ---- */
  var reveal = document.getElementById('reveal');
  var handle = document.getElementById('handle');
  var btn = document.getElementById('dream-it');
  var pos = 50, raf = 0;

  function setPos(p) {
    pos = Math.max(0, Math.min(100, p));
    reveal.style.setProperty('--pos', pos + '%');
    handle.setAttribute('aria-valuenow', String(Math.round(pos)));
    handle.setAttribute('aria-valuetext', Math.round(pos) + ' percent original painting');
  }
  function stopAnim() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  function fromEvent(e) {
    var r = reveal.getBoundingClientRect();
    setPos(((e.clientX - r.left) / r.width) * 100);
  }
  var dragging = false;
  reveal.addEventListener('pointerdown', function (e) {
    stopAnim();
    dragging = true;
    try { reveal.setPointerCapture(e.pointerId); } catch (x) {}
    fromEvent(e);
    handle.focus({ preventScroll: true });
  });
  reveal.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
  function end() { dragging = false; }
  reveal.addEventListener('pointerup', end);
  reveal.addEventListener('pointercancel', end);
  handle.addEventListener('keydown', function (e) {
    var step = e.shiftKey ? 10 : 2, k = e.key, used = true;
    stopAnim();
    if (k === 'ArrowLeft' || k === 'ArrowDown') setPos(pos - step);
    else if (k === 'ArrowRight' || k === 'ArrowUp') setPos(pos + step);
    else if (k === 'PageDown') setPos(pos - 10);
    else if (k === 'PageUp') setPos(pos + 10);
    else if (k === 'Home') setPos(0);
    else if (k === 'End') setPos(100);
    else used = false;
    if (used) e.preventDefault();
  });
  btn.addEventListener('click', function () {
    stopAnim();
    if (reduce) { setPos(0); return; }
    /* start on the plain painting and sweep slowly until it has dreamed */
    var from = 100, to = 0, dur = 5000, t0 = null;
    setPos(from);
    function frame(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur);
      var eased = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      setPos(from + (to - from) * eased);
      raf = k < 1 ? requestAnimationFrame(frame) : 0;
    }
    raf = requestAnimationFrame(frame);
  });
  setPos(50);

  /* ---- Dream II: loupe ---- */
  var box = document.getElementById('loupe');
  var img = document.getElementById('loupe-img');
  var lens = document.getElementById('lens');
  var zbtn = document.getElementById('zoom-btn');
  var ZOOM = 2.6;

  function placeLens(e) {
    var ir = img.getBoundingClientRect(), br = box.getBoundingClientRect();
    var x = e.clientX - ir.left, y = e.clientY - ir.top;
    if (x < 0 || y < 0 || x > ir.width || y > ir.height) { box.classList.remove('lens-on'); return; }
    var size = lens.offsetWidth;
    box.classList.add('lens-on');
    lens.style.backgroundImage = 'url("' + img.getAttribute('src') + '")';
    lens.style.backgroundSize = (ir.width * ZOOM) + 'px ' + (ir.height * ZOOM) + 'px';
    lens.style.backgroundPosition = (-(x * ZOOM - size / 2)) + 'px ' + (-(y * ZOOM - size / 2)) + 'px';
    lens.style.left = (e.clientX - br.left - size / 2) + 'px';
    lens.style.top = (e.clientY - br.top - size / 2) + 'px';
  }
  function setZoomed(on) {
    box.classList.toggle('zoomed', on);
    box.classList.remove('lens-on');
    zbtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    zbtn.textContent = on ? 'Zoom out' : 'Zoom';
    if (on) { box.scrollTop = 0; }
  }
  box.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'mouse' && !box.classList.contains('zoomed')) placeLens(e);
  });
  box.addEventListener('pointerleave', function () { box.classList.remove('lens-on'); });
  box.addEventListener('click', function () { setZoomed(!box.classList.contains('zoomed')); });
  box.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setZoomed(!box.classList.contains('zoomed')); }
  });
  zbtn.addEventListener('click', function () { setZoomed(!box.classList.contains('zoomed')); });
})();
