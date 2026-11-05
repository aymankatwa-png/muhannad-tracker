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

function curWeek(C) { return Math.min(Math.max(C.week, 1), T.weeks); }

/* ---------------- the cockpit: sunset sky, clouds, take-off ---------------- */
var view = { roll: 0, pitch: 0, tr: 0, tp: 0 };
function cockpit() {
  var c = $('#sky'), hero = $('#hero'); if (!c) return;
  var x = c.getContext('2d'), W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  var sprites = [], clouds = [], stars = [], on = true, flash = 0, last = 0, t0 = 0;
  var intro = reduce ? 9 : 0, INTRO = 3.6, said = {};
  var fl = $('#flash'), co = $('#callout'), lad = $('#ladder');
  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  function makeCloud() {
    var w = 360, h = 190, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var g = cv.getContext('2d'), n = 18 + (Math.random() * 10 | 0);
    for (var i = 0; i < n; i++) {
      var px = w / 2 + rnd(-.36, .36) * w, py = h * .58 + rnd(-.22, .16) * h * (1 - Math.abs(px - w / 2) / (w * .6)), r = rnd(26, 62);
      var gr = g.createRadialGradient(px, py - r * .25, r * .1, px, py, r);
      gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.6, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(px, py, r, 0, 6.283); g.fill();
    }
    g.globalCompositeOperation = 'source-atop';
    var sh = g.createLinearGradient(0, 0, 0, h);
    sh.addColorStop(0, 'rgba(255,214,170,.55)'); sh.addColorStop(.45, 'rgba(255,190,170,.18)'); sh.addColorStop(1, 'rgba(70,86,140,.55)');
    g.fillStyle = sh; g.fillRect(0, 0, w, h);
    return cv;
  }
  function newCloud(far) {
    return { x: rnd(-2.2, 2.2), y: Math.random() < .7 ? rnd(-.55, -.04) : rnd(.04, .3), z: far ? rnd(5, 7) : rnd(.6, 7), s: rnd(.7, 1.5), k: (Math.random() * sprites.length) | 0 };
  }
  function size() {
    W = c.clientWidth; H = c.clientHeight; c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = []; for (var i = 0; i < Math.round(W * H / 9000); i++) stars.push({ x: rnd(-.3, 1.3), y: rnd(0, 1), r: rnd(.3, 1.2), p: rnd(0, 6.28) });
  }
  for (var s = 0; s < 6; s++) sprites.push(makeCloud());
  for (var k = 0; k < 46; k++) clouds.push(newCloud(false));
  size(); addEventListener('resize', size);

  addEventListener('pointermove', function (e) { view.tr = (e.clientX / innerWidth - .5) * -.32; view.tp = (e.clientY / innerHeight - .5) * .14; });
  if (window.DeviceOrientationEvent) addEventListener('deviceorientation', function (e) { if (e.gamma == null) return; view.tr = Math.max(-.3, Math.min(.3, -e.gamma / 90)); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { on = en[0].isIntersecting; }).observe(c);
  function skip() { if (intro < INTRO) intro = INTRO - .01; }
  hero.addEventListener('click', skip); addEventListener('wheel', skip, { passive: true }); addEventListener('keydown', skip);

  function say(txt) { if (!co) return; co.textContent = txt; co.classList.remove('pop'); void co.offsetWidth; co.classList.add('pop'); }
  function ease(t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }

  function draw(dt, time) {
    /* take-off: runway roll → rotate → climb through cloud → level off */
    var horizonF, speed;
    if (intro < INTRO) {
      intro += dt;
      var a = intro / INTRO;
      if (a > .18 && !said.v1) { said.v1 = 1; say('استعد للإقلاع'); }
      if (a > .40 && !said.r) { said.r = 1; say('إقلاع'); }
      if (a > .66 && !said.c) { said.c = 1; say('فوق الغيم ✈'); }
      horizonF = a < .42 ? .40 : a < .78 ? .40 + .62 * ease((a - .42) / .36) : 1.02 - .44 * ease((a - .78) / .22);
      speed = .4 + 3.4 * ease(a / .7);
      if (a >= .995) { hero.classList.add('live'); }
    } else { horizonF = .58; speed = .55; if (!hero.classList.contains('live')) hero.classList.add('live'); }

    view.roll += (view.tr + Math.sin(time * .0007) * .025 - view.roll) * Math.min(1, dt * 2.2);
    view.pitch += (view.tp + Math.sin(time * .0011) * .012 - view.pitch) * Math.min(1, dt * 2.2);
    var cx = W / 2, cy = H / 2, hy = H * horizonF + view.pitch * H, F = Math.max(W, 700) * .55, D = Math.hypot(W, H);

    x.save();
    x.translate(cx, cy); x.rotate(view.roll); x.translate(-cx, -cy);
    /* sky */
    var sg = x.createLinearGradient(0, hy - H * 1.25, 0, hy);
    sg.addColorStop(0, '#050d24'); sg.addColorStop(.42, '#1a2f63'); sg.addColorStop(.72, '#6c4f86'); sg.addColorStop(.88, '#e0866a'); sg.addColorStop(1, '#ffc58a');
    x.fillStyle = sg; x.fillRect(cx - D, hy - D * 2, D * 2, D * 2);
    /* stars */
    for (var i = 0; i < stars.length; i++) { var st = stars[i], sy = hy - H * 1.1 + st.y * H * .7; if (sy > hy - H * .25) continue; x.globalAlpha = .25 + .45 * Math.sin(st.p + time * .002); x.fillStyle = '#fff'; x.fillRect(st.x * W, sy, st.r, st.r); }
    x.globalAlpha = 1;
    /* sun */
    var sx = cx + W * .2, sy2 = hy - H * .05;
    var sun = x.createRadialGradient(sx, sy2, 0, sx, sy2, H * .55);
    sun.addColorStop(0, 'rgba(255,240,200,1)'); sun.addColorStop(.06, 'rgba(255,214,150,.95)'); sun.addColorStop(.22, 'rgba(255,160,110,.35)'); sun.addColorStop(1, 'rgba(255,140,100,0)');
    x.fillStyle = sun; x.fillRect(cx - D, hy - D, D * 2, D);
    /* sea */
    var gg = x.createLinearGradient(0, hy, 0, hy + H * .8);
    gg.addColorStop(0, '#d98a6e'); gg.addColorStop(.06, '#3b4a78'); gg.addColorStop(.5, '#16234a'); gg.addColorStop(1, '#0a1230');
    x.fillStyle = gg; x.fillRect(cx - D, hy, D * 2, D);
    /* sun glitter on the sea */
    x.fillStyle = 'rgba(255,200,150,.55)';
    for (var r = 0; r < 26; r++) { var yy = hy + 4 + r * r * 1.3, ww = (8 + r * 5) * (.6 + .4 * Math.sin(time * .004 + r * 1.7)); if (yy > hy + H) break; x.globalAlpha = .7 - r * .024; x.fillRect(sx - ww / 2, yy, ww, 1.6 + r * .08); }
    x.globalAlpha = 1;
    /* runway during the take-off roll */
    if (intro < INTRO * .8) {
      var ra = Math.max(0, 1 - intro / (INTRO * .8));
      x.globalAlpha = Math.min(1, ra * 2);
      x.fillStyle = '#2a2e38';
      x.beginPath(); x.moveTo(cx - 6, hy); x.lineTo(cx + 6, hy); x.lineTo(cx + W * .9, hy + D); x.lineTo(cx - W * .9, hy + D); x.closePath(); x.fill();
      var off = (time * .004 * speed) % 1;
      for (var d = 0; d < 14; d++) {
        var zz = 14 - d - off; if (zz <= .2) continue;
        var y1 = hy + (H * .9) / zz, y2 = hy + (H * .9) / (zz - .45), w1 = W * .9 / zz * .03;
        x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.moveTo(cx - w1, y1); x.lineTo(cx + w1, y1); x.lineTo(cx + w1 * 1.1, Math.min(y2, hy + D)); x.lineTo(cx - w1 * 1.1, Math.min(y2, hy + D)); x.fill();
        var ly = hy + (H * .9) / zz, lx = W * .9 / zz * .55;
        x.fillStyle = 'rgba(255,220,140,.95)'; x.beginPath(); x.arc(cx - lx, ly, Math.max(1, 6 / zz), 0, 6.283); x.arc(cx + lx, ly, Math.max(1, 6 / zz), 0, 6.283); x.fill();
      }
      x.globalAlpha = 1;
    }
    /* clouds rushing past */
    clouds.sort(function (p, q) { return q.z - p.z; });
    var near = 0;
    for (var j = 0; j < clouds.length; j++) {
      var cl = clouds[j];
      cl.z -= speed * dt * .55;
      if (cl.z < .18) { clouds[j] = newCloud(true); continue; }
      var px = cx + cl.x / cl.z * F, py = hy + cl.y / cl.z * F, w = 340 * cl.s / cl.z * (F / 700), h = w * .53;
      if (px + w < cx - D || px - w > cx + D) continue;
      var al = Math.min(1, (7 - cl.z) / 2.2) * Math.min(1, (cl.z - .18) / .5);
      if (cl.z < .7 && Math.abs(px - cx) < w * .35 && Math.abs(py - cy) < h * .6) near = Math.max(near, (.7 - cl.z) / .5);
      x.globalAlpha = al * .92; x.drawImage(sprites[cl.k], px - w / 2, py - h / 2, w, h);
    }
    x.globalAlpha = 1;
    x.restore();
    /* flying through a cloud */
    flash += (near * .75 - flash) * Math.min(1, dt * 6);
    if (fl) fl.style.opacity = flash.toFixed(3);
    /* HUD pitch ladder follows the horizon */
    if (lad) lad.setAttribute('transform', 'rotate(' + (view.roll * 57.3).toFixed(2) + ') translate(0 ' + ((hy - H * .58) * .5).toFixed(1) + ')');
  }
  function loop(time) {
    var dt = last ? Math.min(.05, (time - last) / 1000) : .016; last = time;
    if (on) draw(dt, time);
    requestAnimationFrame(loop);
  }
  if (reduce) { hero.classList.add('live'); draw(0, 0); } else requestAnimationFrame(loop);
}

/* ---------------- jet that flies with the scroll ---------------- */
function jet() {
  var lane = $('#jetLane'), j = $('#jet'); if (!lane || !j) return;
  function upd() {
    var r = lane.getBoundingClientRect(), vh = innerHeight;
    var p = 1 - (r.top + r.height) / (vh + r.height); p = Math.max(0, Math.min(1, p));
    var W = lane.clientWidth, jw = j.clientWidth;
    var xx = (W + jw) * (1 - p) - jw, yy = Math.sin(p * Math.PI) * -26;
    j.style.transform = 'translate(' + xx.toFixed(1) + 'px,' + yy.toFixed(1) + 'px) rotate(' + ((p - .5) * 8).toFixed(2) + 'deg)';
  }
  addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
}

/* ---------------- instrument panel (clear, readable, Arabic) ---------------- */
var BEZEL = '<circle cx="100" cy="100" r="96" fill="#0a0f19" stroke="#36425c" stroke-width="3"/><circle cx="100" cy="100" r="88" fill="#111827"/>';
function arcPath(r, a0, a1) {
  var p = function (a) { var t = (a - 90) * Math.PI / 180; return (100 + r * Math.cos(t)).toFixed(1) + ' ' + (100 + r * Math.sin(t)).toFixed(1); };
  return 'M' + p(a0) + ' A' + r + ' ' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + p(a1);
}
function gauge(id) {
  return BEZEL + '<path d="' + arcPath(72, -135, 135) + '" fill="none" stroke="#24304a" stroke-width="12" stroke-linecap="round"/>' +
    '<path id="' + id + 'A" d="' + arcPath(72, -135, 135) + '" fill="none" stroke="#F4B942" stroke-width="12" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100" class="garc"/>' +
    '<g class="needle" id="' + id + 'N"><path d="M100 40 L104.5 100 L100 110 L95.5 100Z" fill="#fff"/><circle cx="100" cy="100" r="9" fill="#F4B942"/></g>';
}
function dial(id, label) {
  return '<div class="g"><svg viewBox="0 0 200 200" id="' + id + '"></svg><div class="g-v" id="' + id + 'V">—</div><div class="g-l">' + label + '</div></div>';
}
function panelInit() {
  var g = $('#gauges'); if (!g) return;
  g.innerHTML = dial('gAdi', 'من الرحلة كلها') + dial('gSpd', 'أسابيع متتالية في وقتها') + dial('gAlt', 'ساعات دراسة هذا الأسبوع') + dial('gHdg', 'أين نحن الآن');
  $('#gAdi').innerHTML = '<defs><clipPath id="ac2"><circle cx="100" cy="100" r="74"/></clipPath><linearGradient id="sk2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2D7FC1"/><stop offset="1" stop-color="#8fd6ff"/></linearGradient><linearGradient id="gd2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8A5A2B"/><stop offset="1" stop-color="#3f2814"/></linearGradient></defs>' + BEZEL +
    '<g clip-path="url(#ac2)"><g id="adiH"><rect x="-60" y="-80" width="320" height="180" fill="url(#sk2)"/><rect x="-60" y="100" width="320" height="180" fill="url(#gd2)"/><line x1="-60" y1="100" x2="260" y2="100" stroke="#fff" stroke-width="2.5"/></g></g>' +
    '<circle id="adiArc2" cx="100" cy="100" r="84" fill="none" stroke="#F4B942" stroke-width="7" stroke-linecap="round" transform="rotate(-90 100 100)" stroke-dasharray="527.8" stroke-dashoffset="527.8"/>' +
    '<path d="M54 104 h28 l7 9 h22 l7 -9 h28" fill="none" stroke="#F4B942" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>';
  $('#gSpd').innerHTML = gauge('sp');
  $('#gAlt').innerHTML = gauge('al');
  var seg = '';
  for (var i = 0; i < 8; i++) seg += '<path class="wk" id="wk' + (i + 1) + '" d="' + arcPath(74, i * 45 + 4, i * 45 + 41) + '" fill="none" stroke="#24304a" stroke-width="14"/>';
  $('#gHdg').innerHTML = BEZEL + seg + '<g class="needle" id="hdN"><path d="M100 36 L106 100 L100 112 L94 100Z" fill="#fff"/><circle cx="100" cy="100" r="9" fill="#F4B942"/></g>';
}
var fmsLast = '';
function paintPanel(C) {
  if (!$('#gAdi')) return;
  var w = curWeek(C), goal = A.studyGoal(), h = A.hours(w), set = function (id, v) { var n = document.getElementById(id); if (n) n.innerHTML = v; };
  $('#adiArc2').style.strokeDashoffset = 527.8 * (1 - C.pct / 100);
  $('#adiH').style.transform = 'translateY(' + Math.round(C.pct * .3) + 'px)';
  set('gAdiV', '<bdi dir="ltr">' + C.pct + '%</bdi>');
  var sp = Math.min(1, C.streak / 8), al = Math.min(1, h / Math.max(1, goal));
  $('#spA').style.strokeDashoffset = 100 - sp * 100; $('#spN').style.transform = 'rotate(' + (-135 + 270 * sp) + 'deg)';
  $('#alA').style.strokeDashoffset = 100 - al * 100; $('#alN').style.transform = 'rotate(' + (-135 + 270 * al) + 'deg)';
  $('#alA').style.stroke = al >= 1 ? '#43B97F' : '#F4B942';
  set('gSpdV', C.streak + ' <small>' + (C.streak === 1 ? 'أسبوع' : 'أسابيع') + '</small>');
  set('gAltV', h + ' <small>من ' + goal + '</small>');
  for (var k = 1; k <= 8; k++) { var p = document.getElementById('wk' + k), st = C.weeksInfo[k - 1].state; p.setAttribute('class', 'wk ' + st); }
  $('#hdN').style.transform = 'rotate(' + ((w - 1) * 45 + 22.5) + 'deg)';
  set('gHdgV', C.week === 0 ? 'قبل الإقلاع' : 'الأسبوع ' + w + ' <small>من 8</small>');
  /* the flight screen — in plain Arabic */
  var cur = C.chs[C.currentIdx], nx = Math.min(T.weeks, w + 1);
  var lines = [
    '<b>الكابتن مهند · رحلة <bdi dir="ltr">MMC-2026</bdi></b>',
    'المرحلة الحالية: ' + (C.allDone ? 'هبوط آمن' : cur.ch.name),
    'المهام المعتمدة: ' + C.done + ' من ' + C.total,
    'المحطة القادمة: الأسبوع ' + nx + ' · ' + A.fmt(A.weekStart(nx)),
    C.allDone ? '<b>هبطنا — الجناحان لك ✈</b>' : 'موعد الهبوط: 31 ديسمبر'
  ];
  var full = lines.join('|');
  if (full === fmsLast) return; fmsLast = full;
  $('#fms').innerHTML = '<div class="fms-h"><span class="fms-dot"></span>شاشة الرحلة</div>' + lines.map(function (l, i) { return '<div class="fms-l" style="--i:' + i + '">' + l + '</div>'; }).join('');
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
  $('#plane').setAttribute('transform', 'translate(' + a.x + ' ' + a.y + ') rotate(' + ang + ')');
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
    '<div class="bb-form" id="bbForm"><label for="bbA">ماذا حدث؟</label><textarea id="bbA" maxlength="600" placeholder="مثال: صوّرت والشمس خلف الشخص، فخرج وجهه مظلمًا."></textarea>' +
    '<label for="bbB">ماذا تعلّمت؟ وماذا سأفعل في المرة القادمة؟</label><textarea id="bbB" maxlength="600" placeholder="مثال: أضفت «من أين يأتي الضوء؟» إلى قائمتي، وسألتقط صورة تجريبية قبل كل بورتريه."></textarea>' +
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


/* ---------------- the reels challenge (departures board) ---------------- */
var reelOpen = null;
function reel(w, i) { var v = A.get('reel:' + w + ':' + i, null); return v && typeof v === 'object' ? v : { s: 0, u: '' }; }
function reelCount(min) { var n = 0; for (var w = 1; w <= T.weeks; w++) for (var i = 0; i < 2; i++) if (reel(w, i).s >= min) n++; return n; }
var RS = [{ k: 'لم يبدأ', en: 'SCHEDULED', c: 'r0' }, { k: 'صُنع', en: 'READY', c: 'r1' }, { k: 'نُشر', en: 'DEPARTED', c: 'r2' }];
function reelInit() {
  var b = $('#reelBoard'); if (!b || !T.reels) return;
  b.addEventListener('click', function (e) {
    var st = e.target.closest('[data-rs]'), ln = e.target.closest('[data-rl]'), sv = e.target.closest('[data-rsave]');
    if (st && A.isMe()) {
      var k = st.getAttribute('data-rs').split(':'), w = +k[0], i = +k[1], v = reel(w, i);
      v.s = (v.s + 1) % 3; A.set('reel:' + w + ':' + i, v);
      var C = A.computed(), cw = curWeek(C);
      if (v.s === 1 && reel(w, 1 - i).s >= 1) { A.burst(st, 26); A.toast('ريلزا الأسبوع ' + w + ' جاهزان للإقلاع ✈ — انشرهما في الأسبوع القادم'); }
      if (v.s === 2) {
        A.burst(st, 18);
        if (reel(w, 1 - i).s === 2 && !A.get('c:' + cw + ':post', false)) A.set('c:' + cw + ':post', 1);
      }
    }
    if (ln && A.isMe()) { var id = ln.getAttribute('data-rl'); reelOpen = reelOpen === id ? null : id; paintReels(); var inp = b.querySelector('[data-rin="' + id + '"]'); if (inp) inp.focus(); }
    if (sv) saveLink(sv.getAttribute('data-rsave'));
  });
  b.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.matches('[data-rin]')) saveLink(e.target.getAttribute('data-rin')); });
  function saveLink(id) {
    var inp = b.querySelector('[data-rin="' + id + '"]'); if (!inp) return;
    var u = inp.value.trim(); if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u;
    var k = id.split(':'), v = reel(+k[0], +k[1]); v.u = u.slice(0, 400); if (u && v.s === 0) v.s = 1;
    reelOpen = null; A.set('reel:' + id, v); A.toast(u ? 'حُفظ رابط الريلز' : 'حُذف الرابط');
  }
}
function paintReels(C) {
  var b = $('#reelBoard'), top = $('#reelTop'); if (!b || !T.reels) return;
  C = C || A.computed();
  var cw = C.week, me = A.isMe(), made = reelCount(1), posted = reelCount(2), total = T.weeks * 2;
  var nowW = Math.min(Math.max(cw, 1), T.weeks), th = T.reels[nowW - 1];
  var nowMade = (reel(nowW, 0).s >= 1) + (reel(nowW, 1).s >= 1);
  var prevW = nowW - 1, prevPosted = prevW >= 1 ? (reel(prevW, 0).s === 2) + (reel(prevW, 1).s === 2) : null;
  top.innerHTML =
    '<div class="rt-stat"><span class="rt-n en">' + made + '<small>/' + total + '</small></span><span class="rt-l">صُنع</span></div>' +
    '<div class="rt-stat"><span class="rt-n en">' + posted + '<small>/' + total + '</small></span><span class="rt-l">نُشر</span></div>' +
    '<div class="rt-now"><div class="rt-k">' + (cw < 1 ? 'أول تحدٍّ يبدأ مع الرحلة' : 'هذا الأسبوع · W' + nowW) + '</div>' +
      '<div class="rt-h">«' + A.esc(th.t) + '» — جاهز <b class="en">' + nowMade + '</b> من 2 قبل نهاية الأسبوع</div>' +
      (prevPosted !== null ? '<div class="rt-p">ونشر ريلزَي الأسبوع ' + prevW + ': <b class="en">' + prevPosted + '</b> من 2</div>' : '') +
      '<div class="rt-rules">' + (T.reelRules || []).map(function (r) { return '<span>' + A.esc(r) + '</span>'; }).join('') + '</div></div>';
  b.innerHTML = T.reels.map(function (R, x) {
    var w = x + 1, state = cw < w ? 'future' : cw === w ? 'now' : 'past';
    var pub = w < T.weeks ? 'يُنشران في الأسبوع ' + (w + 1) : 'يُنشران في أول أسبوع من يناير';
    var rows = [R.a, R.b].map(function (idea, i) {
      var v = reel(w, i), S = RS[v.s], id = w + ':' + i;
      var late = state === 'past' && v.s === 0;
      return '<div class="rr ' + S.c + (late ? ' late' : '') + '">' +
        '<span class="rr-id en">' + (i ? 'B' : 'A') + '</span>' +
        '<span class="rr-t">' + A.esc(idea) + (v.u ? ' <a class="rr-go" href="' + A.esc(v.u) + '" target="_blank" rel="noopener">شاهد ↗</a>' : '') + '</span>' +
        '<button class="rr-s" data-rs="' + id + '"' + (me ? '' : ' disabled') + ' title="' + (me ? 'اضغط لتغيير الحالة' : '') + '"><b>' + S.k + '</b><i class="en">' + (late ? 'DELAYED' : S.en) + '</i></button>' +
        (me ? '<button class="rr-l" data-rl="' + id + '" aria-label="رابط الريلز">🔗</button>' : '') +
        (me && reelOpen === id ? '<div class="rr-in"><input type="url" dir="ltr" data-rin="' + id + '" placeholder="https://… رابط الريلز" value="' + A.esc(v.u || '') + '"><button class="btn btn-xs btn-main" data-rsave="' + id + '">حفظ</button></div>' : '') +
        '</div>';
    }).join('');
    return '<article class="rw ' + state + '"><header><span class="rw-g en">W' + w + '</span><h3>' + A.esc(R.t) + '</h3>' +
      (state === 'now' ? '<span class="rw-tag">الآن</span>' : '') + '</header>' + rows + '<footer>' + pub + '</footer></article>';
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
  init: function (api) { A = api; window.MUH_API = api; cockpit(); jet(); panelInit(); routeInit(); pfInit(); bbInit(); reelInit(); },
  render: function (C) { paintPass(C); paintPanel(C); paintRoute(C); paintPf(C); paintBb(); paintReels(C); },
  managerExtra: function (C, api) {
    var w = curWeek(C), habits = T.checks.filter(function (c) { return api.get('c:' + w + ':' + c.id, false); }).length;
    return '<div class="mgr-extra">' +
      '<div class="mgr-box"><b>قائمة ما قبل الإقلاع</b>' + (+api.get('pf:' + w, 0) || 0) + ' هذا الأسبوع · ' + pfTotal() + ' منذ البداية</div>' +
      '<div class="mgr-box"><b>الصندوق الأسود</b>' + bbList().length + ' تسجيلًا (المحتوى خاص بمهند)</div>' +
      '<div class="mgr-box"><b>تحدّي الريلز</b>صُنع ' + reelCount(1) + ' من ' + (T.weeks * 2) + ' · نُشر ' + reelCount(2) + '</div>' +
      '<div class="mgr-box"><b>تحدّي الكابتن</b>أفضل نتيجة: ' + (+api.get('gameBest', 0) || 0) + ' نقطة</div>' +
      '<div class="mgr-box"><b>عادات الأسبوع ' + w + '</b>' + habits + ' من ' + T.checks.length + '</div></div>';
  },
  celebration: function (ch) {
    return ({
      L1: { ico: '🛫', h: 'أقلعتَ يا كابتن!', p: 'اكتملت المرحلة الأولى. عرفتَ لماذا تصوّر — وهذا أصعب سؤال في الرحلة كلها.' },
      L2: { ico: '📡', h: 'الاتصال ثابت', p: 'اكتملت المرحلة الثانية. الناس قبل الكاميرا — وأنت الآن تعرف كيف تكسب ثقتهم.' },
      L3: { ico: '📷', h: 'عينك صارت تتكلّم', p: 'اكتملت المرحلة الثالثة. صرت تختار الزاوية والضوء بنيّة — والصورة تقول ما تريد دون شرح.' },
      L4: { ico: '🛬', h: 'هبوط آمن — الجناحان لك', p: 'اكتملت الرحلة كلها. قصة الأثر صارت حقيقة، والجناحان يحملان اسمك.' }
    })[ch.id] || { ico: '✈', h: 'اكتملت المرحلة', p: '' };
  }
};
})();
