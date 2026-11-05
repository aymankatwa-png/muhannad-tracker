/* ============================================================
   رفّ الكتب — an interactive bookcase (shared by both trackers)
   reads window.TRACKER.library = { folder, folderName, shelves[], books[] }
   every book opens its PDF directly (OneDrive copy or official free PDF)
   ============================================================ */
(function () {
'use strict';
var L = window.TRACKER && window.TRACKER.library; if (!L) return;
var el = document.getElementById('bookcase'), peek = document.getElementById('bookPeek'); if (!el || !peek) return;
var isTouch = window.matchMedia && matchMedia('(hover: none)').matches;
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var ltr = function (s) { return esc(s).replace(/(\d+)/g, '<bdi dir="ltr">$1</bdi>'); };
var url = function (b) { return b.url || (L.folder + encodeURIComponent(b.file)); };
var byId = function (id) { return L.books.filter(function (b) { return b.id === id; })[0]; };

var html = '<div class="case">';
L.shelves.forEach(function (sh, si) {
  var books = L.books.filter(function (b) { return b.s === sh.id; });
  html += '<div class="shelf"><div class="shelf-label"><span>' + esc(sh.ar) + '</span><span>' + esc(sh.en) + '</span></div><div class="shelf-row">';
  if (si === 0) html += '<span class="bookend"></span>';
  books.forEach(function (b, i) {
    html += '<a class="bk' + (i % 3 === 1 ? ' tilt-r' : '') + (b.lean ? ' lean' : '') + '" data-bk="' + b.id + '" href="' + esc(url(b)) + '" target="_blank" rel="noopener"' +
      ' style="--c:' + b.c + ';--h:' + b.h + 'px;--w:' + b.w + 'px' + (b.fg ? ';--fg:' + b.fg : '') + (b.fs ? ';--fs:' + b.fs + 'px' : '') + '"' +
      ' aria-label="' + esc(b.t + ' — ' + b.a) + '"><span class="pdf">PDF</span><span class="sp-ic">' + (sh.ic || '✦') + '</span>' +
      '<span class="sp-t">' + esc(b.t) + '</span><span class="sp-a">' + esc(b.pub) + '</span></a>';
  });
  (sh.deco || []).forEach(function (d) { html += '<span class="plant">' + d + '</span>'; });
  if (si === L.shelves.length - 1) html += '<span class="bookend" style="transform:scaleX(-1)"></span>';
  html += '</div><div class="shelf-plank"></div></div>';
});
el.innerHTML = html + '</div>';
var hint = function () { peek.innerHTML = '<div class="peek-hint">' + (isTouch ? 'المس أي كتاب لترى تفاصيله، ثم المسه مرة ثانية ليفتح ✦' : 'مرّر المؤشّر على أي كتاب ليخرج من الرفّ — واضغط عليه ليفتح ✦') + '</div>'; };
hint();

function show(id, mark) {
  var b = byId(id); if (!b) return;
  el.querySelectorAll('.bk.peek').forEach(function (x) { x.classList.remove('peek'); });
  if (mark) { var n = el.querySelector('[data-bk="' + id + '"]'); if (n) n.classList.add('peek'); }
  peek.innerHTML = '<div class="peek-card">' +
    '<div class="peek-cover" style="--c:' + b.c + ';--fg:' + (b.fg || '#fff') + '">' + esc(b.t) + '<small>' + esc(b.pub) + '</small></div>' +
    '<div><h4>' + esc(b.t) + '</h4><div class="pa">' + ltr(b.a) + '</div><p>' + ltr(b.d) + '</p>' +
    '<div class="pk"><a class="btn btn-main btn-sm" href="' + esc(url(b)) + '" target="_blank" rel="noopener">📖 اقرأ الآن (PDF)</a>' +
    (b.ch ? '<span class="pk-tag">رفيق ' + esc(b.ch) + '</span>' : '') + '<span class="pk-tag">' + esc(b.src) + '</span></div></div></div>';
}
el.querySelectorAll('[data-bk]').forEach(function (n) {
  var id = n.getAttribute('data-bk');
  n.addEventListener('mouseenter', function () { show(id); });
  n.addEventListener('focus', function () { show(id); });
  n.addEventListener('click', function (e) { if (isTouch && !n.classList.contains('peek')) { e.preventDefault(); show(id, true); } });
});
var fl = document.getElementById('libFolder'); if (fl && L.folderLink) fl.href = L.folderLink;
})();
