/* Cornerstone: spiral map of the course's thinkers + searchable bibliography.

   HOW TO ADD A CITATION (teammates):
   Find the thinker's entry in UNITS below and add one object to its `cites` array:
       { build: 3, who: 'Ian', thinker: 'Descartes', text: 'Meditations II', href: 'ian.html#build-3' }
   - build: the Build number (1-8); who: 'team' or a first name; thinker: which thinker in the unit
   - text: the work and section/page you cite; href: link to where the build is posted (optional)
   The node then shows "Where our builds use them" and gets a lit lamp on the map. Nothing else to change. */
var UNITS = [
  { id: 'jaynes', unit: 'I', short: 'Jaynes', title: 'Consciousness, an Illusion?',
    thinkers: [{ name: 'Julian Jaynes', work: 'The Origin of Consciousness in the Breakdown of the Bicameral Mind (1976)' }],
    cites: [{ build: 2, who: 'team', thinker: 'Jaynes', text: 'discussed in the Fanon paragraph (named, no passage cited)', href: 'team.html#build-2' }] },
  { id: 'descartes', unit: '1', short: 'Descartes', title: 'Descartes',
    thinkers: [{ name: 'René Descartes', work: 'Meditations (1641)' }],
    cites: [{ build: 2, who: 'team', thinker: 'Descartes', text: 'the Cartesian inner "I" (no passage cited)', href: 'team.html#build-2' }] },
  { id: 'time', unit: '2', short: 'Over Time', title: 'Consciousness over Time',
    thinkers: [
      { name: 'Plato', work: 'Republic (c. 380 BCE); Phaedo (c. 347 BCE)' },
      { name: 'The Bhagavad Gita', work: 'trans. Barbara Stoler Miller; trans. Shri Purohit Swami' },
      { name: 'Lucretius', work: 'De rerum natura, On the Nature of Things (54 BCE)' },
      { name: 'Michel de Montaigne', work: 'Essays (1580/1588/1592)' }],
    cites: [] },
  { id: 'scarry', unit: '3', short: 'Scarry', title: 'Scarry',
    thinkers: [{ name: 'Elaine Scarry', work: 'The Body in Pain: The Making and Unmaking of the World (1985)' }],
    cites: [
      { build: 5, who: 'Neve', thinker: 'Scarry', text: 'The Body in Pain (283), (289), (305), (307)', href: 'neve.html#build-5' },
      { build: 5, who: 'Kaylee', thinker: 'Scarry', text: 'The Body in Pain (281), (284)', href: 'kaylee.html#build-5' }] },
  { id: 'gell', unit: '4', short: 'Gell', title: 'Gell',
    thinkers: [{ name: 'Alfred Gell', work: 'Art and Agency: An Anthropological Theory (1989)' }], cites: [] },
  { id: 'milton', unit: '5', short: 'Milton', title: 'Milton',
    thinkers: [{ name: 'John Milton', work: 'Paradise Lost (1667)' }], cites: [] },
  { id: 'hegel', unit: '6', short: 'Hegel & Fanon', title: 'Hegel and Fanon',
    thinkers: [
      { name: 'G. W. F. Hegel', work: 'Phenomenology of Spirit (1807)' },
      { name: 'Frantz Fanon', work: 'Black Skin, White Masks (1952)' }],
    cites: [
      { build: 2, who: 'team', thinker: 'Hegel', text: 'Phenomenology of Spirit §167, §181, §187, §192-193 (and §195)', href: 'team.html#build-2' },
      { build: 2, who: 'team', thinker: 'Fanon', text: 'Black Skin, White Masks §222', href: 'team.html#build-2' },
      { build: 1, who: 'Jonah', thinker: 'Hegel', text: 'Phenomenology of Spirit §187, §189, §193, §194, §195, §196', href: 'jonah.html#build-1' },
      { build: 3, who: 'Jonah', thinker: 'Hegel', text: 'Phenomenology of Spirit §190, §193, §194, §195, §196, §199', href: 'jonah.html#build-3' },
      { build: 3, who: 'Jonah', thinker: 'Fanon', text: '(217), (220)', href: 'jonah.html#build-3' },
      { build: 4, who: 'Jonah', thinker: 'Hegel', text: 'Phenomenology of Spirit §193, §194, §195, §196', href: 'jonah.html#build-4' },
      { build: 4, who: 'Jonah', thinker: 'Fanon', text: '(217), (222), (225), (229), (250)', href: 'jonah.html#build-4' },
      { build: 1, who: 'Ian', thinker: 'Hegel', text: 'Phenomenology of Spirit §177, §195', href: 'ian.html#build-1' },
      { build: 3, who: 'Ian', thinker: 'Hegel', text: 'Phenomenology of Spirit §177, §182, §190, §195, §196, §198, §206', href: 'ian.html#build-3' },
      { build: 4, who: 'Ian', thinker: 'Hegel', text: 'Phenomenology of Spirit §187, §196, §198, §206', href: 'ian.html#build-4' },
      { build: 1, who: 'Neve', thinker: 'Hegel', text: 'Phenomenology of Spirit §181', href: 'neve.html#build-1' },
      { build: 3, who: 'Neve', thinker: 'Hegel', text: 'Phenomenology of Spirit §167, §181, §186, §189', href: 'neve.html#build-3' },
      { build: 3, who: 'Neve', thinker: 'Fanon', text: '(220), (229)', href: 'neve.html#build-3' },
      { build: 4, who: 'Neve', thinker: 'Hegel', text: 'Phenomenology of Spirit §193, §195, §196, §197, §206', href: 'neve.html#build-4' },
      { build: 4, who: 'Neve', thinker: 'Fanon', text: '(220), (229)', href: 'neve.html#build-4' },
      { build: 1, who: 'Kaylee', thinker: 'Hegel', text: 'Phenomenology of Spirit §192-193', href: 'kaylee.html#build-1' },
      { build: 3, who: 'Kaylee', thinker: 'Hegel', text: 'Phenomenology of Spirit §181', href: 'kaylee.html#build-3' },
      { build: 4, who: 'Kaylee', thinker: 'Hegel', text: 'Phenomenology of Spirit §184, §191, §194', href: 'kaylee.html#build-4' },
      { build: 5, who: 'Kaylee', thinker: 'Hegel', text: 'Phenomenology of Spirit §175, §196', href: 'kaylee.html#build-5' },
      { build: 5, who: 'Neve', thinker: 'Hegel', text: 'Phenomenology of Spirit §181, §193, §195', href: 'neve.html#build-5' },
      { build: 5, who: 'Neve', thinker: 'Fanon', text: '(221), (222)', href: 'neve.html#build-5' }] },
  { id: 'plutarch', unit: '7', short: 'Plutarch', title: 'Plutarch',
    thinkers: [{ name: 'Plutarch', work: 'Moralia (c. 95)' }], cites: [] },
  { id: 'elias', unit: '8', short: 'Elias', title: 'Elias',
    thinkers: [{ name: 'Norbert Elias', work: 'The Court Society (1933); The Society of Individuals (1939)' }], cites: [] },
  { id: 'augustine', unit: '9', short: 'Augustine', title: 'Augustine',
    thinkers: [{ name: 'Augustine of Hippo', work: 'Confessions (398)' }], cites: [] },
  { id: 'larmore', unit: '10', short: 'Larmore', title: 'Larmore',
    thinkers: [{ name: 'Charles Larmore', work: 'The Practices of the Self (2004)' }], cites: [] }
];
var EXTRA = { id: 'dennett', unit: '', short: 'Dennett', title: 'Also cited', extra: true,
  thinkers: [{ name: 'Daniel Dennett', work: 'Consciousness Explained (1991)' }],
  cites: [{ build: 2, who: 'team', thinker: 'Dennett', text: 'Dennett on consciousness and the homunculus (no passage cited)', href: 'team.html#build-2' }] };

/* Which bibliography entries belong to which node (matched on the start of the entry text). */
var BIB_KEYS = [
  ['Jaynes, Julian', 'jaynes'], ['Descartes', 'descartes'], ['Plato', 'time'], ['The Bhagavad Gita', 'time'],
  ['Lucretius', 'time'], ['Montaigne', 'time'], ['Scarry', 'scarry'], ['Gell, Alfred', 'gell'],
  ['Milton', 'milton'], ['Hegel', 'hegel'], ['Fanon', 'hegel'], ['Plutarchus', 'plutarch'],
  ['Elias', 'elias'], ['Augustine', 'augustine'], ['Larmore', 'larmore'], ['Dennett', 'dennett']
];

(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var ALL = UNITS.concat([EXTRA]);
  var byId = {};
  ALL.forEach(function (n) { byId[n.id] = n; });
  var W = 760, C = W / 2, R0 = 300, STEP = 23.5, TURN = 0.155, A0 = -Math.PI / 2;
  var svg = document.getElementById('map');
  var list = document.getElementById('map-list');
  var panel = document.getElementById('panel');
  var sel = null;

  function pt(t) { /* t = fractional index along the path */
    var r = t <= 9 ? R0 - STEP * t : (R0 - STEP * 9) * (10 - t);
    var a = A0 + t * TURN * 2 * Math.PI;
    return [C + r * Math.cos(a), C + r * Math.sin(a), r, a];
  }
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function cited(n) { return n.cites.length > 0; }

  /* --- SVG map --- */
  var d = '';
  for (var t = 0; t <= 10.001; t += 0.1) { var p = pt(t); d += (t === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }
  el('path', { d: d, class: 'trail-path' }, svg);
  var nodeEls = {};
  UNITS.forEach(function (n, i) {
    var p = pt(i), g = el('g', { class: 'cnode' + (cited(n) ? ' lit' : '') + (p[2] < 150 ? ' deep' : ''), tabindex: 0, role: 'button',
      'data-id': n.id, transform: 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')',
      'aria-label': 'Unit ' + n.unit + ', ' + n.short + (cited(n) ? ', cited in a build' : ', not yet cited') }, svg);
    el('circle', { class: 'glow', r: 34 }, g);
    el('circle', { class: 'dot', r: 17 }, g);
    var num = el('text', { class: 'num', y: 5, 'text-anchor': 'middle' }, g); num.textContent = n.unit;
    var lab = el('text', { class: 'lab', 'text-anchor': 'middle' }, g);
    var ox = Math.cos(p[3]), oy = Math.sin(p[3]);
    if (i === 10) { ox = 0; oy = 1; }
    var anc = ox > 0.45 ? 'start' : ox < -0.45 ? 'end' : 'middle';
    lab.setAttribute('text-anchor', anc);
    lab.setAttribute('x', (anc === 'middle' ? 0 : ox * 30).toFixed(1));
    lab.setAttribute('y', (anc === 'middle' ? oy * 38 + 5 : oy * 22 + 5).toFixed(1));
    lab.textContent = n.short;
    nodeEls[n.id] = g;
  });
  (function () { /* extra node, off the path */
    var g = el('g', { class: 'cnode extra lit', tabindex: 0, role: 'button', 'data-id': EXTRA.id, transform: 'translate(660 80)',
      'aria-label': 'Also cited: Dennett' }, svg);
    el('circle', { class: 'glow', r: 34 }, g);
    el('circle', { class: 'dot', r: 17 }, g);
    var num = el('text', { class: 'num', y: 5, 'text-anchor': 'middle' }, g); num.textContent = '+';
    var l1 = el('text', { class: 'lab', 'text-anchor': 'middle', y: 44 }, g); l1.textContent = 'Dennett';
    var l2 = el('text', { class: 'lab sub', 'text-anchor': 'middle', y: 62 }, g); l2.textContent = 'also cited';
    nodeEls[EXTRA.id] = g;
  })();

  /* --- list version (phones) --- */
  ALL.forEach(function (n) {
    var li = document.createElement('li');
    if (n.extra) li.className = 'extra-li';
    var b = document.createElement('button');
    b.type = 'button'; b.setAttribute('data-id', n.id);
    b.className = 'lnode' + (cited(n) ? ' lit' : '');
    b.innerHTML = '<span class="ln">' + (n.extra ? '+' : n.unit) + '</span><span class="lt"></span>';
    b.querySelector('.lt').textContent = n.extra ? 'Dennett (also cited)' : (n.short === n.title ? n.short : n.short + ' · ' + n.title);
    li.appendChild(b); list.appendChild(li);
  });

  /* --- panel --- */
  function esc(s) { var x = document.createElement('div'); x.textContent = s; return x.innerHTML; }
  function show(id, focusPanel) {
    var n = byId[id]; if (!n) return;
    sel = id;
    Object.keys(nodeEls).forEach(function (k) { nodeEls[k].classList.toggle('sel', k === id); });
    [].forEach.call(list.querySelectorAll('button'), function (b) { b.classList.toggle('sel', b.getAttribute('data-id') === id); });
    var h = '<p class="eyebrow">' + (n.extra ? 'Also cited' : 'Unit ' + esc(n.unit)) + '</p><h3>' + esc(n.extra ? n.thinkers[0].name : n.title) + '</h3><dl class="works">';
    n.thinkers.forEach(function (th) { h += '<div><dt>' + esc(th.name) + '</dt><dd>' + esc(th.work) + '</dd></div>'; });
    h += '</dl><h4>Where our builds use them</h4>';
    if (n.cites.length) {
      h += '<ul class="cites">';
      n.cites.forEach(function (c) {
        var lab = 'Build ' + c.build + (c.who === 'team' ? ' (team)' : ' (' + esc(c.who) + ')');
        h += '<li><b>' + (c.href ? '<a href="' + esc(c.href) + '">' + lab + '</a>' : lab) + '</b> cites ' + esc(c.thinker) + ': ' + esc(c.text) + '</li>';
      });
      h += '</ul>';
    } else h += '<p class="none">Not yet cited in a posted build.</p>';
    h += '<p class="jump"><a href="#bib" data-search="' + esc(n.thinkers[0].name.split(' ').pop()) + '">See in the bibliography</a></p>';
    panel.innerHTML = h;
    if (focusPanel) panel.focus({ preventScroll: false });
    var link = panel.querySelector('.jump a');
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var q = document.getElementById('bib-q'); q.value = link.getAttribute('data-search'); filter();
      document.getElementById('bib').scrollIntoView({ behavior: 'smooth' });
    });
  }
  function pick(e) {
    var g = e.target.closest('[data-id]'); if (!g) return;
    show(g.getAttribute('data-id'), g.tagName === 'button' || window.innerWidth < 840);
  }
  svg.addEventListener('click', pick);
  list.addEventListener('click', pick);
  svg.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(e); }
  });
  /* focusing a node also opens it, per brief */
  svg.addEventListener('focusin', function (e) { var g = e.target.closest && e.target.closest('[data-id]'); if (g) show(g.getAttribute('data-id'), false); });

  /* --- bibliography: markers + live filter --- */
  var bibList = document.getElementById('bib-list');
  var items = [].slice.call(bibList.querySelectorAll('li'));
  var lastKey = null;
  items.forEach(function (li) {
    var txt = li.textContent.trim(), key = null;
    li.setAttribute('data-text', txt.toLowerCase());
    if (/^-{3,}/.test(txt)) key = lastKey;
    else BIB_KEYS.forEach(function (k) { if (!key && txt.indexOf(k[0]) === 0) key = k[1]; });
    lastKey = key;
    if (key) {
      var a = document.createElement('a');
      a.className = 'bib-mark'; a.href = '#map-sec'; a.textContent = '◉ on the map';
      a.setAttribute('aria-label', 'Show ' + byId[key].short + ' on the map');
      a.addEventListener('click', function (e) {
        e.preventDefault(); show(key, false);
        document.getElementById('map-sec').scrollIntoView({ behavior: 'smooth' });
        (nodeEls[key]).focus({ preventScroll: true });
      });
      li.appendChild(document.createTextNode(' ')); li.appendChild(a);
    }
  });
  var q = document.getElementById('bib-q'), count = document.getElementById('bib-count'), none = document.getElementById('bib-none');
  function filter() {
    var terms = q.value.toLowerCase().split(/\s+/).filter(Boolean), shown = 0;
    items.forEach(function (li) {
      var t = li.getAttribute('data-text');
      var ok = terms.every(function (w) { return t.indexOf(w) !== -1; });
      li.hidden = !ok; if (ok) shown++;
    });
    count.textContent = shown + ' of ' + items.length + ' entries';
    none.hidden = shown !== 0;
  }
  q.addEventListener('input', filter);
  filter();

  var h = location.hash.replace('#unit-', '');
  show(byId[h] ? h : 'hegel', false);
})();
