/* ============================================================
   سجلّ الطيران — the look and the captain's tools
   (night sky, attitude indicator, route, boarding pass,
    pre-flight checklist, black box, wings)
   ============================================================ */
(function () {
'use strict';
var T = window.TRACKER;
var DAY = 864e5;
var A = null;                 /* engine API, set in init */
var pf = [];                  /* pre-flight switches — this session only */
var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var $ = function (s) { return document.querySelector(s); };
var tilt = { r: 0, p: 0 }, basePitch = 0;

function curWeek(C) { return Math.min(Math.max(C.week, 1), T.weeks); }

/* ---------------- night sky ---------------- */
function sky() {
  var c = $('#sky'); if (!c) return;
  var x = c.getContext('2d'), stars = [], clouds = [], W, H, dpr = Math.min(2, window.devicePixelRatio || 1), mx = 0, my = 0, on = true;
  function size() {
    W = c.clientWidth; H = c.clientHeight; c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = []; var n = Math.round(W * H / 5200);
    for (var i = 0; i < n; i++) stars.push({ x: Math.random() * W, y: Math.random() * H * .8, r: Math.random() * 1.3 + .25, p: Math.random() * 6.28, s: .4 + Math.random() * 1.6, d: Math.random() * .6 + .2 });
    clouds = []; for (var j = 0; j < 7; j++) clouds.push({ x: Math.random() * W, y: H * (.45 + Math.random() * .5), w: 180 + Math.random() * 320, h: 40 + Math.random() * 50, v: .08 + Math.random() * .22, d: .3 + Math.random() * .9, a: .05 + Math.random() * .08 });
  }
  function draw(t) {
    x.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i], a = .45 + .55 * Math.sin(s.p + t * .001 * s.s);
      x.globalAlpha = Math.max(.08, a); x.fillStyle = '#fff';
      x.beginPath(); x.arc(s.x + mx * s.d * 10, s.y + my * s.d * 6, s.r, 0, 6.283); x.fill();
    }
    x.globalAlpha = 1;
    for (var j = 0; j < clouds.length; j++) {
      var k = clouds[j]; k.x -= k.v; if (k.x < -k.w) k.x = W + k.w;
      var cx = k.x + mx * k.d * 30, cy = k.y + my * k.d * 14;
      var g = x.createRadialGradient(cx, cy, 0, cx, cy, k.w / 2);
      g.addColorStop(0, 'rgba(190,215,255,' + k.a + ')'); g.addColorStop(1, 'rgba(190,215,255,0)');
      x.fillStyle = g; x.save(); x.translate(cx, cy); x.scale(1, k.h / k.w); x.beginPath(); x.arc(0, 0, k.w / 2, 0, 6.283); x.restore(); x.fill();
    }
  }
  function loop(t) { if (on) draw(t); requestAnimationFrame(loop); }
  size(); addEventListener('resize', size);
  addEventListener('pointermove', function (e) { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { on = en[0].isIntersecting; }).observe(c);
  if (reduce) draw(0); else requestAnimationFrame(loop);
}

/* ---------------- attitude indicator ---------------- */
function paintHorizon() {
  var h = $('#adiHorizon'); if (!h) return;
  h.style.transform = 'translateY(' + (basePitch + tilt.p) + 'px) rotate(' + tilt.r + 'deg)';
}
function tiltInit() {
  if (reduce) return;
  var back;
  addEventListener('pointermove', function (e) {
    tilt.r = (e.clientX / innerWidth - .5) * -26; tilt.p = (e.clientY / innerHeight - .5) * 14; paintHorizon();
    clearTimeout(back); back = setTimeout(function () { tilt.r = 0; tilt.p = 0; paintHorizon(); }, 2200);
  });
}

/* ---------------- route ---------------- */
var pts = null;
function routeInit() {
  var base = $('#routeBase'), g = $('#routePts'); if (!base || !g) return;
  var L = base.getTotalLength(), total = T.end - T.start, ns = 'http://www.w3.org/2000/svg';
  pts = [];
  for (var k = 1; k <= T.weeks; k++) {
    var mid = Math.min(1, (((k - 1) * 7 + 3.5) * DAY) / total), p = base.getPointAtLength(L * mid);
    var el = document.createElementNS(ns, 'g'); el.setAttribute('class', 'rp');
    el.innerHTML = '<circle cx="' + p.x + '" cy="' + p.y + '" r="9"/><text x="' + p.x + '" y="' + (p.y - 20) + '" text-anchor="middle">W' + k + '</text><text class="rp-d" x="' + p.x + '" y="' + (p.y + 30) + '" text-anchor="middle">' + A.fmtShort(A.weekStart(k)) + '</text>';
    g.appendChild(el); pts.push(el);
  }
  var done = $('#routeDone'); done.style.strokeDasharray = L; done.style.strokeDashoffset = L;
}
function paintRoute(C) {
  var base = $('#routeBase'); if (!base || !pts) return;
  var L = base.getTotalLength(), f = Math.max(0, Math.min(1, (Date.now() - T.start) / (T.end - T.start)));
  if (C.allDone) f = 1;
  $('#routeDone').style.strokeDashoffset = L * (1 - f);
  var a = base.getPointAtLength(L * f), b = base.getPointAtLength(Math.min(L, L * f + 2)), c0 = base.getPointAtLength(Math.max(0, L * f - 2));
  var ang = Math.atan2(b.y - c0.y, b.x - c0.x) * 180 / Math.PI;
  $('#plane').setAttribute('transform', 'translate(' + a.x + ' ' + a.y + ') rotate(' + (ang - 180) + ')');
  C.weeksInfo.forEach(function (wi, i) { pts[i].setAttribute('class', 'rp ' + wi.state); });
}

/* ---------------- pre-flight checklist ---------------- */
function pfInit() {
  var el = $('#pfCard'); if (!el) return;
  pf = T.preflight.map(function () { return false; });
  el.innerHTML = '<div class="tool-h"><span class="tool-ico">✓</span><h3>قائمة ما قبل الإقلاع</h3></div>' +
    '<p class="tool-p">قبل كل تصوير، مرّ على القائمة بندًا بندًا. هكذا لا تُنسى البطارية، ولا الموافقة، ولا الشعور الذي جئت من أجله.</p>' +
    '<ul class="pf-list" id="pfList"></ul>' +
    '<div class="pf-foot"><button class="btn btn-main btn-sm" id="pfGo" disabled>جاهز للإقلاع ✈</button>' +
    '<span class="pf-meta">أكملتَ القائمة هذا الأسبوع <b class="pf-count en" id="pfCount">0</b> مرّة · المجموع <span class="en" id="pfTotal">0</span></span></div>';
  $('#pfList').addEventListener('click', function (e) {
    var li = e.target.closest('[data-pf]'); if (!li || !A.isMe()) return;
    var i = +li.getAttribute('data-pf'); pf[i] = !pf[i]; paintPf();
  });
  $('#pfList').addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && e.target.matches('[data-pf]')) { e.preventDefault(); e.target.click(); } });
  $('#pfGo').addEventListener('click', function () {
    if (!pf.every(Boolean)) return;
    var C = A.computed(), w = curWeek(C), b = $('#pfGo');
    pf = pf.map(function () { return false; });
    A.burst(b, 34);
    A.set('pf:' + w, (+A.get('pf:' + w, 0) || 0) + 1);
    if (!A.get('c:' + w + ':pf', false)) A.set('c:' + w + ':pf', 1);
    A.toast('القائمة مكتملة — رحلة موفّقة يا كابتن ✈');
  });
}
function pfTotal() { var n = 0; for (var k = 1; k <= T.weeks; k++) n += +A.get('pf:' + k, 0) || 0; return n; }
function paintPf(C) {
  var list = $('#pfList'); if (!list) return;
  C = C || A.computed();
  var me = A.isMe();
  list.innerHTML = T.preflight.map(function (t, i) {
    return '<li class="pf-item' + (pf[i] ? ' on' : '') + '" data-pf="' + i + '" role="switch" tabindex="' + (me ? 0 : -1) + '" aria-checked="' + pf[i] + '"' + (me ? '' : ' aria-disabled="true"') + '><span class="pf-sw"></span><span>' + A.esc(t) + '</span></li>';
  }).join('');
  var go = $('#pfGo'); go.disabled = !me || !pf.every(Boolean); go.classList.toggle('hidden', !me);
  $('#pfCount').textContent = +A.get('pf:' + curWeek(C), 0) || 0;
  $('#pfTotal').textContent = pfTotal();
}

/* ---------------- black box ---------------- */
function bbList() { var l = A.get('bb', []); return Array.isArray(l) ? l : []; }
function bbInit() {
  var el = $('#bbCard'); if (!el) return;
  el.innerHTML = '<div class="tool-h"><span class="tool-ico">◼</span><h3>الصندوق الأسود</h3></div>' +
    '<p class="tool-p">الصندوق الأسود في الطائرة لا يبحث عن مذنب — يبحث عمّا حدث، لكي لا يتكرّر. اكتب هنا أي خطأ أو موقف صعب، بلا قسوة على نفسك.</p>' +
    '<div class="bb-form" id="bbForm"><label for="bbA">ماذا حدث؟</label><textarea id="bbA" maxlength="600" placeholder="مثال: نسيت اختبار الميكروفون، فخرج الصوت ضعيفًا في المقابلة."></textarea>' +
    '<label for="bbB">ماذا تعلّمت؟ وماذا سأفعل في المرة القادمة؟</label><textarea id="bbB" maxlength="600" placeholder="مثال: أضفت «اختبار الصوت» إلى قائمتي، وسأسجّل 10 ثوانٍ تجريبية قبل كل مقابلة."></textarea>' +
    '<div><button class="btn btn-main btn-sm" id="bbSave">حفظ في الصندوق</button></div></div>' +
    '<div class="bb-lock hidden" id="bbLock"></div><div class="bb-list" id="bbList"></div>';
  $('#bbSave').addEventListener('click', function () {
    var a = $('#bbA').value.trim(), b = $('#bbB').value.trim();
    if (!a) { $('#bbA').focus(); return; }
    var C = A.computed(), w = curWeek(C);
    var list = bbList().concat([{ id: Date.now().toString(36), t: Date.now(), a: a.slice(0, 600), b: b.slice(0, 600) }]).slice(-60);
    $('#bbA').value = ''; $('#bbB').value = '';
    A.burst($('#bbSave'), 16);
    A.set('bb', list);
    if (!A.get('c:' + w + ':bb', false)) A.set('c:' + w + ':bb', 1);
    A.toast('سُجّل في الصندوق الأسود — هكذا يتعلّم الطيّارون المحترفون');
  });
  $('#bbList').addEventListener('click', function (e) {
    var x = e.target.closest('[data-bbdel]'); if (!x || !A.isMe()) return;
    var id = x.getAttribute('data-bbdel'); A.set('bb', bbList().filter(function (r) { return r.id !== id; }));
  });
}
function paintBb() {
  var form = $('#bbForm'); if (!form) return;
  var list = bbList(), me = A.isMe(), mgr = A.isMgr();
  form.classList.toggle('hidden', !me);
  var lock = $('#bbLock'); lock.classList.toggle('hidden', !mgr);
  if (mgr) lock.innerHTML = 'في الصندوق الأسود <b>' + list.length + '</b> تسجيلًا.<br>المحتوى لمهند وحده — لا نفتح الصندوق الأسود لنلوم، بل ليتعلّم الكابتن.';
  var el = $('#bbList'); el.classList.toggle('hidden', !me);
  if (!me) return;
  el.innerHTML = list.slice().reverse().map(function (r) {
    var d = new Date(r.t);
    return '<div class="bb-e"><div class="d">' + d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear() + '</div><p><b>ما حدث:</b> ' + A.esc(r.a) + '</p>' + (r.b ? '<p><b>ما تعلّمته:</b> ' + A.esc(r.b) + '</p>' : '') + '<button class="x" data-bbdel="' + A.esc(r.id) + '" aria-label="حذف">×</button></div>';
  }).join('');
}

/* ---------------- boarding pass + gauge + wings ---------------- */
function paintPass(C) {
  var w = curWeek(C), cur = C.chs[C.currentIdx].ch;
  var set = function (id, v) { var n = document.getElementById(id); if (n) n.textContent = v; };
  set('pGate', C.week === 0 ? 'W1' : 'W' + w);
  set('pLeg', C.allDone ? 'هبوط آمن' : (cur.name.split(':')[0] || cur.name));
  set('pStreak', C.streak);
  set('pStudy', C.studyWeeksMet + '/' + C.studyWeeksSoFar);
  set('pPct', C.pct + '%');
  var bar = $('#pBar'); if (bar) bar.style.width = C.pct + '%';
  set('pStatus', C.allDone ? 'LANDED' : C.week === 0 ? 'BOARDING' : C.week > T.weeks ? 'FINAL APPROACH' : 'IN FLIGHT');
  set('adiPct', C.pct + '%');
  var arc = $('#adiArc'); if (arc) arc.style.strokeDashoffset = 653.5 * (1 - C.pct / 100);
  basePitch = Math.round(C.pct * .32); paintHorizon();
  var wg = $('#wings');
  if (wg) {
    var legs = C.chs.filter(function (x) { return !x.ch.pre; }), done = legs.filter(function (x) { return x.complete; }).length;
    wg.classList.toggle('earned', C.allDone);
    set('wingsH', C.allDone ? 'الجناحان لك يا كابتن مهند' : 'جناحا الكابتن');
    var p = $('#wingsP');
    if (p) p.innerHTML = C.allDone ? 'أكملتَ المراحل الأربع وأوصلتَ ركّابك بأمان. هذا ليس آخر سجلّ طيران — إنه الأول.'
      : 'في نهاية الرحلة، حين تكتمل المراحل الأربع، يلمع هذان الجناحان باسمك. ليسا جائزة على السرعة — بل على أنك أوصلت ركّابك بأمان.<div class="wings-meter">اكتملت <b class="en">' + done + '</b> من ' + legs.length + ' مراحل</div>';
  }
}

/* ---------------- hooks ---------------- */
T.hooks = {
  init: function (api) { A = api; sky(); tiltInit(); routeInit(); pfInit(); bbInit(); },
  render: function (C) { paintPass(C); paintRoute(C); paintPf(C); paintBb(); },
  managerExtra: function (C, api) {
    var w = curWeek(C), habits = T.checks.filter(function (c) { return api.get('c:' + w + ':' + c.id, false); }).length;
    return '<div class="mgr-extra">' +
      '<div class="mgr-box"><b>قائمة ما قبل الإقلاع</b>' + (+api.get('pf:' + w, 0) || 0) + ' هذا الأسبوع · ' + pfTotal() + ' منذ البداية</div>' +
      '<div class="mgr-box"><b>الصندوق الأسود</b>' + bbList().length + ' تسجيلًا (المحتوى خاص بمهند)</div>' +
      '<div class="mgr-box"><b>عادات الأسبوع ' + w + '</b>' + habits + ' من ' + T.checks.length + '</div></div>';
  },
  celebration: function (ch) {
    return ({
      L1: { ico: '🛫', h: 'أقلعتَ يا كابتن!', p: 'اكتملت المرحلة الأولى. عرفتَ لماذا تصوّر — وهذا أصعب سؤال في الرحلة كلها.' },
      L2: { ico: '📡', h: 'الاتصال ثابت', p: 'اكتملت المرحلة الثانية. الناس قبل الكاميرا — وأنت الآن تعرف كيف تكسب ثقتهم.' },
      L3: { ico: '🎙', h: 'صوتك وصل', p: 'اكتملت المرحلة الثالثة. تعليقك لم يعد شرحًا للصورة، بل شعورًا يحملها.' },
      L4: { ico: '🛬', h: 'هبوط آمن — الجناحان لك', p: 'اكتملت الرحلة كلها. قصة الأثر صارت حقيقة، والجناحان يحملان اسمك.' }
    })[ch.id] || { ico: '✈', h: 'اكتملت المرحلة', p: '' };
  }
};
})();
