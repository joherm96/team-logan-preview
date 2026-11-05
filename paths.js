/* paths.js: makes the [bracket] fact placeholders on member Path pages look intentional. */
(function () {
  'use strict';
  /* ---------- Facts: make [bracket] placeholders look intentional ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.fact dd'), function (dd) {
    if (/^\s*\[/.test(dd.textContent)) dd.classList.add('is-empty');
  });

})();
