/* ============================================================
   تحدّي الكابتن — fly through the clouds of procrastination
   mouse, finger or arrow keys · best score syncs with the tracker
   ============================================================ */
(function () {
'use strict';
var box = document.getElementById('game'); if (!box) return;
var cv = box.querySelector('canvas'), x = cv.getContext('2d');
var ui = { score: box.querySelector('[data-g=score]'), best: box.querySelector('[data-g=best]'), lives: box.querySelector('[data-g=lives]'), over: box.querySelector('.g-over'), start: box.querySelector('.g-start'), msg: box.querySelector('[data-g=msg]'), final: box.querySelector('[data-g=final]'), rec: box.querySelector('[data-g=rec]') };
var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
var BAD = ['لاحقًا', 'سأبدأ غدًا', 'مقطع أخير فقط', 'إشعار جديد', 'الكمال أولًا', 'لا مزاج اليوم', 'تصفّح بلا هدف', 'خمس دقائق فقط', 'الخوف من البداية', 'مقارنة نفسي بغيري'];
var GOOD = [{ t: '📷', s: 10, l: 'لقطة' }, { t: '⭐', s: 5, l: 'فكرة' }, { t: '🎙', s: 10, l: 'سؤال جيد' }, { t: '📖', s: 15, l: 'ساعة دراسة' }];
var LINES = [
  'التسويف غيمة رمادية… لا تبدو خطيرة حتى تدخلها.',
  'كل «لاحقًا» تؤجّل صورة لن تتكرر.',
  'الطيّار لا ينتظر الطقس المثالي — يطير بما لديه، بحذر.',
  'أفضل علاج للتسويف: خطوة واحدة صغيرة الآن.',
  'من يبدأ اليوم بمهمة صغيرة، يسبق من يخطط لمهمة كبيرة غدًا.'
];

/* the airliner as an image (nose to the left — we fly toward the start of the line) */
var planeSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 90"><path d="M168 44 L196 74 H182 L146 46Z" fill="#B9C7DA"/><path d="M10 50 Q12 38 40 35 H206 L234 12 H248 L240 40 Q248 46 238 53 H40 Q14 58 10 50Z" fill="#F7F9FC"/><path d="M40 53 H238 Q226 58 200 58 H46 Q24 58 10 50 Q22 56 40 53Z" fill="#DCE4EF"/><path d="M110 47 H152 L198 76 H178Z" fill="#E6ECF4"/><rect x="128" y="55" width="32" height="10" rx="5" fill="#C3CEDD"/><path d="M220 43 H246 L254 52 H236Z" fill="#E6ECF4"/><path d="M234 12 H248 L240 40 H226Z" fill="#F4B942"/><g fill="#1B2B45"><circle cx="58" cy="42" r="2.2"/><circle cx="70" cy="42" r="2.2"/><circle cx="82" cy="42" r="2.2"/><circle cx="94" cy="42" r="2.2"/><circle cx="106" cy="42" r="2.2"/><circle cx="118" cy="42" r="2.2"/><circle cx="130" cy="42" r="2.2"/><circle cx="142" cy="42" r="2.2"/><circle cx="154" cy="42" r="2.2"/><circle cx="166" cy="42" r="2.2"/><circle cx="178" cy="42" r="2.2"/><circle cx="190" cy="42" r="2.2"/></g><path d="M16 46 Q20 40 30 40 L33 46Z" fill="#1B2B45"/><path d="M44 47 H200" stroke="#F4B942" stroke-width="1.6"/></svg>';
var plane = new Image(); plane.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(planeSvg);

/* storm-cloud sprite, drawn once */
function cloudSprite(w, h, dark) {
  var c = document.createElement('canvas'); c.width = w * dpr; c.height = h * dpr;
  var g = c.getContext('2d'); g.scale(dpr, dpr);
  for (var i = 0; i < 16; i++) {
    var px = w * (.18 + Math.random() * .64), py = h * (.4 + Math.random() * .3), r = h * (.22 + Math.random() * .2);
    var gr = g.createRadialGradient(px, py - r * .3, r * .1, px, py, r);
    gr.addColorStop(0, dark ? 'rgba(120,128,150,1)' : 'rgba(255,255,255,.95)');
    gr.addColorStop(.7, dark ? 'rgba(70,76,98,.95)' : 'rgba(255,255,255,.6)');
    gr.addColorStop(1, dark ? 'rgba(50,55,75,0)' : 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(px, py, r, 0, 6.283); g.fill();
  }
  return c;
}
var storms = [], fluff = [];
function sprites() { storms = [0, 1, 2].map(function () { return cloudSprite(220, 120, true); }); fluff = [0, 1, 2].map(function () { return cloudSprite(200, 100, false); }); }

var S = null, keys = {}, target = null, raf = 0, last = 0, visible = true, running = false;
function size() {
  var r = cv.getBoundingClientRect(); W = Math.max(280, r.width); H = Math.max(240, r.height);
  cv.width = W * dpr; cv.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!running) idle();
}
function newGame() {
  S = { t: 0, score: 0, lives: 3, speed: 230, py: H / 2, px: W * .8, vy: 0, inv: 0, obs: [], bg: [], spawn: .6, gspawn: 1.2, pops: [], shake: 0 };
  for (var i = 0; i < 6; i++) S.bg.push({ x: Math.random() * W, y: Math.random() * H, s: .3 + Math.random() * .5, k: i % 3 });
  target = null; paintHud();
}
function paintHud() {
  ui.score.textContent = S ? Math.floor(S.score) : 0;
  ui.lives.textContent = S ? '❤'.repeat(S.lives) + '♡'.repeat(3 - S.lives) : '❤❤❤';
  ui.best.textContent = best();
}
function best() { var b = 0; try { b = +localStorage.getItem('muhGameBest') || 0; } catch (e) {} var A = window.MUH_API; if (A) b = Math.max(b, +A.get('gameBest', 0) || 0); return b; }
function saveBest(v) {
  try { localStorage.setItem('muhGameBest', v); } catch (e) {}
  var A = window.MUH_API; if (A && A.isMe() && v > (+A.get('gameBest', 0) || 0)) A.set('gameBest', v);
}

function spawnBad() {
  var label = BAD[Math.random() * BAD.length | 0], sc = .75 + Math.random() * .45;
  if (W < 520) sc *= .8;
  S.obs.push({ bad: true, x: -140 * sc, y: 40 + Math.random() * (H - 80), w: 220 * sc, h: 120 * sc, r: 44 * sc, spr: storms[Math.random() * 3 | 0], label: label, wob: Math.random() * 6, vy: (Math.random() - .5) * 30 });
}
function spawnGood() {
  var g = GOOD[Math.random() * GOOD.length | 0];
  S.obs.push({ bad: false, x: -40, y: 40 + Math.random() * (H - 80), r: 20, g: g, wob: Math.random() * 6 });
}

function step(dt) {
  S.t += dt; S.speed = 230 + Math.min(260, S.t * 6); S.score += dt * 4;
  /* player follows the pointer (smooth), or the keys */
  var ky = (keys.ArrowDown || keys.s ? 1 : 0) - (keys.ArrowUp || keys.w ? 1 : 0), kx = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0);
  if (ky || kx) { S.py += ky * 360 * dt; S.px += kx * 300 * dt; target = null; }
  else if (target) { S.py += (target.y - S.py) * Math.min(1, dt * 9); S.px += (target.x - S.px) * Math.min(1, dt * 6); }
  S.py = Math.max(24, Math.min(H - 24, S.py)); S.px = Math.max(W * .35, Math.min(W - 60, S.px));
  S.spawn -= dt; if (S.spawn <= 0) { spawnBad(); S.spawn = Math.max(.45, 1.25 - S.t * .012) * (.7 + Math.random() * .6); }
  S.gspawn -= dt; if (S.gspawn <= 0) { spawnGood(); S.gspawn = 1 + Math.random() * 1.2; }
  S.inv = Math.max(0, S.inv - dt); S.shake = Math.max(0, S.shake - dt);
  for (var i = S.obs.length - 1; i >= 0; i--) {
    var o = S.obs[i]; o.x += S.speed * dt * (o.bad ? 1 : .9); o.wob += dt * 2;
    if (o.bad) { o.y += o.vy * dt; if (o.y < 30 || o.y > H - 30) o.vy *= -1; }
    var cx = o.bad ? o.x + o.w / 2 : o.x, cy = o.y + Math.sin(o.wob) * 4, dx = cx - S.px, dy = cy - S.py, rr = (o.r + 18);
    if (dx * dx + dy * dy < rr * rr) {
      if (o.bad) { if (!S.inv) { S.lives--; S.inv = 1.6; S.shake = .35; pop(S.px, S.py, '−❤', '#FF7A7A'); buzz(60); if (S.lives <= 0) { return end(); } } }
      else { S.score += o.g.s; pop(cx, cy, '+' + o.g.s + ' ' + o.g.l, '#F4B942'); buzz(15); S.obs.splice(i, 1); continue; }
    }
    if (o.x > W + 260) S.obs.splice(i, 1);
  }
  for (var k = 0; k < S.bg.length; k++) { var b = S.bg[k]; b.x += S.speed * b.s * dt; if (b.x > W + 220) { b.x = -220; b.y = Math.random() * H; } }
  for (var p = S.pops.length - 1; p >= 0; p--) { S.pops[p].t += dt; if (S.pops[p].t > 1) S.pops.splice(p, 1); }
  paintHud();
}
function pop(px, py, t, c) { S.pops.push({ x: px, y: py, t: 0, s: t, c: c }); }
function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

function sky() {
  var g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#16244a'); g.addColorStop(.55, '#3b4f8a'); g.addColorStop(1, '#e79a6d');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
}
function draw() {
  x.save();
  if (S.shake) x.translate((Math.random() - .5) * 10, (Math.random() - .5) * 10);
  sky();
  S.bg.forEach(function (b) { x.globalAlpha = .35; x.drawImage(fluff[b.k], b.x, b.y, 200 * b.s * 1.6, 100 * b.s * 1.6); });
  x.globalAlpha = 1;
  x.direction = 'rtl'; x.textAlign = 'center'; x.textBaseline = 'middle';
  S.obs.forEach(function (o) {
    var yy = o.y + Math.sin(o.wob) * 4;
    if (o.bad) {
      x.drawImage(o.spr, o.x, yy - o.h / 2, o.w, o.h);
      x.font = '700 ' + Math.round(15 * o.w / 220 + 2) + 'px Dahab, sans-serif';
      x.fillStyle = '#fff'; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 6;
      x.fillText(o.label, o.x + o.w / 2, yy + 4); x.shadowBlur = 0;
    } else {
      x.beginPath(); x.arc(o.x, yy, o.r + 6, 0, 6.283); x.fillStyle = 'rgba(244,185,66,.22)'; x.fill();
      x.font = '26px serif'; x.fillText(o.g.t, o.x, yy + 1);
    }
  });
  /* the captain's plane */
  var pw = W < 520 ? 96 : 130, ph = pw * 90 / 260, tilt = target ? Math.max(-.25, Math.min(.25, (target.y - S.py) / 300)) : 0;
  if (!(S.inv && Math.floor(S.inv * 10) % 2)) {
    x.save(); x.translate(S.px, S.py); x.rotate(-tilt);
    x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 3; x.setLineDash([4, 10]); x.beginPath(); x.moveTo(pw * .45, 0); x.lineTo(pw * 2.2, 0); x.stroke(); x.setLineDash([]);
    x.drawImage(plane, -pw / 2, -ph / 2, pw, ph); x.restore();
  }
  S.pops.forEach(function (p) { x.globalAlpha = 1 - p.t; x.font = '800 18px Dahab, sans-serif'; x.fillStyle = p.c; x.fillText(p.s, p.x, p.y - p.t * 40); });
  x.globalAlpha = 1; x.restore();
}
function idle() { if (!S) newGame(); draw(); }
function loop(t) {
  var dt = last ? Math.min(.05, (t - last) / 1000) : .016; last = t;
  if (running && visible) { step(dt); if (running) draw(); }
  if (running) raf = requestAnimationFrame(loop);
}
function start() {
  newGame(); running = true; last = 0; box.classList.add('playing'); box.classList.remove('over');
  ui.start.hidden = true; ui.over.hidden = true; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
}
function end() {
  running = false; box.classList.remove('playing'); box.classList.add('over');
  var sc = Math.floor(S.score), old = best(), rec = sc > old;
  if (rec) saveBest(sc);
  ui.final.textContent = sc; ui.rec.hidden = !rec; ui.msg.textContent = LINES[Math.random() * LINES.length | 0];
  ui.over.hidden = false; paintHud(); draw();
}

/* input: mouse, finger, keys */
function local(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
cv.addEventListener('pointermove', function (e) { if (running) target = local(e); });
cv.addEventListener('pointerdown', function (e) { if (running) { target = local(e); try { cv.setPointerCapture(e.pointerId); } catch (er) {} } });
addEventListener('keydown', function (e) {
  if (!running) return; if (/^Arrow/.test(e.key) || 'wasd'.indexOf(e.key) >= 0) { keys[e.key] = 1; if (/^Arrow/.test(e.key)) e.preventDefault(); }
  if (e.key === 'Escape') end();
});
addEventListener('keyup', function (e) { keys[e.key] = 0; });
box.querySelectorAll('[data-g=go]').forEach(function (b) { b.addEventListener('click', start); });
if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) last = 0; }, { threshold: .25 }).observe(box);
document.addEventListener('visibilitychange', function () { if (document.hidden) visible = false; else { visible = true; last = 0; } });
addEventListener('resize', size);
sprites(); size(); plane.onload = function () { if (!running) idle(); };
paintHud();
window.addEventListener('load', function () { setTimeout(paintHud, 1500); });
})();
