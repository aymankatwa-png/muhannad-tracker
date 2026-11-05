/* ============================================================
   Moomken Media Center — tracker engine (shared by the Photography Unit trackers)
   - content comes from window.TRACKER (content.js)
   - the look comes from the theme (theme.js) through TRACKER.hooks
   - progress lives in one private GitHub Gist file per person
   - every value carries its own timestamp, so a manager approval and an
     employee update are merged key by key and never overwrite each other
   ============================================================ */
(function () {
'use strict';
var T = window.TRACKER;
var DAY = 864e5;
var MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

/* ---------------- state ---------------- */
var LS_CFG = T.id + '.cfg', LS_DOC = T.id + '.doc';
var S = { role: null, gistId: '', token: '', file: T.file, doc: { f: {}, ts: {}, updatedAt: 0 }, sync: 'local', lastSync: null, open: {}, just: {} };

function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function norm(d) { d = d || {}; return { f: d.f || {}, ts: d.ts || {}, updatedAt: d.updatedAt || 0 }; }
function loadLocal() {
  try { var c = JSON.parse(lsGet(LS_CFG) || '{}'); S.role = c.role || null; S.gistId = c.gistId || ''; S.token = c.token || ''; S.file = c.file || T.file; } catch (e) {}
  try { S.doc = norm(JSON.parse(lsGet(LS_DOC) || '{}')); } catch (e) {}
}
function saveCfg() { lsSet(LS_CFG, JSON.stringify({ role: S.role, gistId: S.gistId.trim(), token: S.token.trim(), file: (S.file || T.file).trim() })); }
function saveLocal() { lsSet(LS_DOC, JSON.stringify(S.doc)); }

function get(k, dflt) { var v = S.doc.f[k]; return v === undefined ? dflt : v; }
function set(k, v) {
  if (v === undefined || v === null || v === '') delete S.doc.f[k]; else S.doc.f[k] = v;
  S.doc.ts[k] = Date.now(); S.doc.updatedAt = Date.now();
  saveLocal(); render(); schedulePush();
}
function merge(a, b) {
  a = norm(a); b = norm(b);
  var out = { f: {}, ts: {}, updatedAt: Math.max(a.updatedAt, b.updatedAt) }, keys = {};
  Object.keys(a.ts).concat(Object.keys(b.ts), Object.keys(a.f), Object.keys(b.f)).forEach(function (k) { keys[k] = 1; });
  Object.keys(keys).forEach(function (k) {
    var src = (a.ts[k] || 0) >= (b.ts[k] || 0) ? a : b;
    if (src.f[k] !== undefined) out.f[k] = src.f[k];
    if (src.ts[k]) out.ts[k] = src.ts[k];
  });
  return out;
}
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

/* ---------------- gist sync ---------------- */
var pushTimer = null, pushPending = false;
function hdr(w) { var h = { Accept: 'application/vnd.github+json' }; if (S.token) h.Authorization = 'Bearer ' + S.token.trim(); if (w) h['Content-Type'] = 'application/json'; return h; }
function fetchGist() { return fetch('https://api.github.com/gists/' + S.gistId.trim(), { headers: hdr(), cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
function readFile(f) {
  if (!f) return Promise.resolve(null);
  if (f.truncated && f.raw_url) return fetch(f.raw_url, { cache: 'no-store' }).then(function (r) { return r.json(); });
  try { return Promise.resolve(JSON.parse(f.content || '{}')); } catch (e) { return Promise.resolve(null); }
}
function setSync(s) { S.sync = s; paintSync(); }
function pull(manual) {
  if (!S.gistId) { if (manual) setSync('local'); return Promise.resolve(); }
  setSync('syncing');
  return fetchGist().then(function (g) { return readFile((g.files || {})[S.file]); }).then(function (remote) {
    var m = merge(S.doc, remote || {}), changed = !same(m, S.doc);
    S.doc = m; saveLocal(); if (changed) render();
    if (!remote || !same(norm(remote), m)) schedulePush();
    S.lastSync = new Date(); setSync('ok');
  }).catch(function () { setSync('error'); });
}
function schedulePush() { pushPending = true; clearTimeout(pushTimer); pushTimer = setTimeout(push, 1400); }
function push() {
  pushPending = false;
  if (!S.gistId || !S.token) return;
  setSync('syncing');
  fetchGist().then(function (g) { return readFile((g.files || {})[S.file]); }).then(function (remote) {
    S.doc = merge(S.doc, remote || {}); saveLocal();
    var body = { files: {} }; body.files[S.file] = { content: JSON.stringify(S.doc, null, 1) };
    return fetch('https://api.github.com/gists/' + S.gistId.trim(), { method: 'PATCH', headers: hdr(true), body: JSON.stringify(body) });
  }).then(function (r) { if (!r.ok) throw new Error(r.status); S.lastSync = new Date(); setSync('ok'); }).catch(function () { setSync('error'); });
}

/* ---------------- dates ---------------- */
var START = T.start, WEEKS = T.weeks;
function weekStart(w) { return new Date(START.getTime() + (w - 1) * 7 * DAY); }
function weekEnd(w) { var e = new Date(START.getTime() + ((w - 1) * 7 + 6) * DAY); e.setHours(23, 59, 59); return w === WEEKS && T.end ? T.end : e; }
function currentWeek() { var n = Date.now(); if (n < START.getTime()) return 0; var w = Math.floor((n - START.getTime()) / (7 * DAY)) + 1; return w > WEEKS ? WEEKS + 1 : w; }
function fmt(d) { return d.getDate() + ' ' + MONTHS_AR[d.getMonth()]; }
function fmtShort(d) { return d.getDate() + '/' + (d.getMonth() + 1); }
function parseDate(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
function weekOfDate(d) { if (!d) return 0; var w = Math.floor((d.getTime() - START.getTime()) / (7 * DAY)) + 1; return w; }

/* ---------------- tasks ---------------- */
var ALL = [];
T.chapters.forEach(function (ch) { ch.tasks.forEach(function (t) { t.ch = ch; ALL.push(t); }); });
function stat(t) { return get('s:' + t.id, t.pre ? 'done' : 'todo'); }
function markedAt(t) { return S.doc.ts['s:' + t.id] || 0; }

/* ---------------- studies ---------------- */
function subjects() { var s = get('subj', []); return Array.isArray(s) ? s : []; }
function studyGoal() { return +get('goal', T.studyGoal || 8) || 8; }
function hours(w) { return +get('h:' + w, 0) || 0; }
function examWeeks() { var o = {}; subjects().forEach(function (s) { var w = weekOfDate(parseDate(s.exam)); if (w >= 1 && w <= WEEKS) o[w] = (o[w] || []).concat(s); }); return o; }
function studyMet(w) { return hours(w) >= studyGoal(); }

/* ---------------- computed snapshot ---------------- */
function computed() {
  var C = { chs: [], done: 0, pending: 0, total: 0, week: currentWeek() };
  T.chapters.forEach(function (ch) {
    var d = 0, p = 0;
    ch.tasks.forEach(function (t) { var s = stat(t); if (!ch.pre) { C.total++; if (s === 'done') C.done++; if (s === 'pending') C.pending++; } if (s === 'done') d++; else if (s === 'pending') p++; });
    C.chs.push({ ch: ch, done: d, pending: p, total: ch.tasks.length, pct: Math.round(d / ch.tasks.length * 100), complete: d === ch.tasks.length });
  });
  var idx = C.chs.findIndex(function (x) { return !x.complete; });
  C.currentIdx = idx === -1 ? C.chs.length - 1 : idx; C.allDone = idx === -1;
  /* studies: weeks that have already started count */
  var upto = Math.min(Math.max(C.week, 1), WEEKS), met = 0;
  for (var w = 1; w <= upto; w++) if (studyMet(w)) met++;
  C.studyWeeksMet = met; C.studyWeeksSoFar = upto;
  C.studyPct = Math.round(met / WEEKS * 100);
  C.taskPct = C.total ? Math.round(C.done / C.total * 100) : 0;
  /* overall: 75% the path, 25% studies */
  C.pct = Math.round(C.taskPct * 0.75 + C.studyPct * 0.25);
  C.exams = examWeeks();
  /* week-by-week ledger: on time, late, missed */
  C.weeksInfo = [];
  for (var k = 1; k <= WEEKS; k++) {
    var tasks = ALL.filter(function (t) { return t.w === k && !t.optional; });
    var end = weekEnd(k).getTime(), allMarked = true, onTime = true;
    tasks.forEach(function (t) { var s = stat(t); if (s === 'todo') { allMarked = false; onTime = false; } else if (markedAt(t) > end) onTime = false; });
    var exam = !!C.exams[k];
    var state;
    if (k > C.week) state = 'future';
    else if (k === C.week) state = allMarked ? 'ok' : 'now';
    else if (allMarked && onTime) state = 'ok';
    else if (exam && studyMet(k)) state = 'exam';           /* exam week: studying saves the week */
    else state = allMarked ? 'late' : 'missed';
    C.weeksInfo.push({ w: k, tasks: tasks, state: state, exam: exam, study: hours(k), met: studyMet(k) });
  }
  var streak = 0;
  for (var j = Math.min(C.week, WEEKS); j >= 1; j--) {
    var st = C.weeksInfo[j - 1].state;
    if (st === 'ok' || st === 'exam') streak++; else if (j === C.week && st === 'now') continue; else break;
  }
  C.streak = streak;
  return C;
}

/* ---------------- helpers ---------------- */
var $ = function (s) { return document.querySelector(s); };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
function txt(s) {
  return esc(s).replace(/[A-Za-z\u00C0-\u024F][0-9A-Za-z\u00C0-\u024F .,'’–—·()\-:+&;?!]*[0-9A-Za-z\u00C0-\u024F)?!]|\d+\s?[–\-]\s?\d+/g, function (m) { return '<bdi dir="ltr">' + m + '</bdi>'; });
}
function safeUrl(u) { u = String(u || '').trim(); return /^https?:\/\//i.test(u) ? u : ''; }
function isMgr() { return S.role === 'manager'; }
function isMe() { return S.role === 'me'; }

/* ---------------- render ---------------- */
var prevDone = null;
function render() {
  var C = computed();
  var doneNow = C.chs.filter(function (x) { return x.complete && !x.ch.pre; }).map(function (x) { return x.ch.id; });
  if (prevDone) doneNow.forEach(function (id) { if (prevDone.indexOf(id) === -1) { var ch = T.chapters.filter(function (c) { return c.id === id; })[0]; setTimeout(function () { celebrate(ch, C); }, 250); } });
  prevDone = doneNow;
  paintSync(); renderWeek(C); renderStudies(C); renderChecks(C); renderManager(C); renderChapters(C); renderResources();
  if (T.hooks && T.hooks.render) T.hooks.render(C, API);
  S.just = {};
}

function paintSync() {
  var m = { local: ['#8a96a8', 'حفظ محلي فقط — «إعدادات الحفظ» تربط تقدّمك بين الأجهزة'], idle: ['#C98A1B', 'جاهز للمزامنة'], syncing: ['#C98A1B', 'جارٍ المزامنة…'],
    ok: ['#3E8E5A', 'متزامن' + (S.lastSync ? ' · ' + S.lastSync.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '')], error: ['#C0392B', 'تعذّرت المزامنة — راجع الـ Gist ID والتوكن'] }[S.sync] || ['#8a96a8', ''];
  var d = $('#syncDot'); if (d) { d.style.background = m[0]; d.classList.toggle('pulse', S.sync === 'syncing'); }
  var t = $('#syncTxt'); if (t) t.textContent = m[1];
  var b = $('#roleBadge'); if (b) b.textContent = isMgr() ? 'المشرف' : isMe() ? T.name : '—';
}

function icon(st) {
  if (st === 'done') return '<svg class="t-ico" viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="var(--ok)"/><path d="M9.5 15.5l3.6 3.6 7.4-8" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  if (st === 'pending') return '<svg class="t-ico" viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="none" stroke="var(--warn)" stroke-width="2"/><path d="M15 8v7l4 3" stroke="var(--warn)" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>';
  return '<svg class="t-ico" viewBox="0 0 30 30"><circle cx="15" cy="15" r="12" fill="none" stroke="var(--line2)" stroke-width="1.6" stroke-dasharray="3 3"/></svg>';
}

function renderWeek(C) {
  var el = $('#weekCard'); if (!el) return;
  var w = Math.min(Math.max(C.week, 1), WEEKS);
  var items = ALL.filter(function (t) { return t.w === w; });
  var late = C.week > 1 ? ALL.filter(function (t) { return t.w < w && stat(t) === 'todo' && !t.optional; }) : [];
  var exam = C.exams[w];
  var head = C.week === 0 ? 'تبدأ الرحلة الأحد ' + fmt(START) : C.week > WEEKS ? 'انتهت الأسابيع الثمانية' : 'مهام هذا الأسبوع';
  var li = function (t) { var s = stat(t); return '<li class="' + s + '" data-jump="' + t.ch.id + '">' + icon(s) + '<span>' + txt(t.t) + '</span></li>'; };
  el.innerHTML = '<div class="wk-cal"><div class="w1">WEEK</div><div class="w2">' + w + '</div><div class="w3">من ' + WEEKS + '</div></div>' +
    '<div class="wk-main"><div class="wk-head"><h3>' + head + '</h3><span class="rng">' + fmt(weekStart(w)) + ' — ' + fmt(weekEnd(w)) + '</span></div>' +
    (exam ? '<div class="exam-banner">📚 أسبوع امتحانات (' + exam.map(function (s) { return esc(s.name); }).join('، ') + ') — <b>الدراسة أولًا.</b> إذا حقّقت هدف ساعات الدراسة هذا الأسبوع، يُحسب الأسبوع لك حتى لو تأجّلت بقية المهام.</div>' : '') +
    '<ul class="wk-list">' + items.map(li).join('') + '</ul>' +
    (late.length ? '<div class="wk-late">من الأسابيع الماضية (' + late.length + ')</div><ul class="wk-list">' + late.slice(0, 4).map(li).join('') + '</ul>' : '') + '</div>';
  el.querySelectorAll('[data-jump]').forEach(function (n) { n.addEventListener('click', function () { openChapter(n.getAttribute('data-jump')); }); });
}
function openChapter(id) { S.open[id] = true; render(); var c = document.getElementById('ch-' + id); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

/* ----- studies: a central part of the tracker ----- */
function renderStudies(C) {
  var el = $('#studies'); if (!el) return;
  var subs = subjects().slice().sort(function (a, b) { return (a.exam || '9') < (b.exam || '9') ? -1 : 1; });
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var w = Math.min(Math.max(C.week, 1), WEEKS), goal = studyGoal(), h = hours(w);
  var editable = isMe();
  var bars = '';
  for (var k = 1; k <= WEEKS; k++) {
    var hk = hours(k), pct = Math.min(100, Math.round(hk / goal * 100));
    bars += '<div class="sb' + (k === w ? ' now' : '') + (C.exams[k] ? ' exam' : '') + (hk >= goal ? ' met' : '') + '" title="الأسبوع ' + k + ': ' + hk + ' ساعة"><i style="height:' + pct + '%"></i><span>' + k + '</span></div>';
  }
  el.innerHTML =
    '<div class="st-grid">' +
      '<div class="st-card st-hours"><div class="st-k">ساعات دراسة هذا الأسبوع</div>' +
        '<div class="st-big"><b>' + h + '</b><span>/ ' + goal + ' ساعة</span></div>' +
        '<div class="st-meter"><i style="width:' + Math.min(100, Math.round(h / goal * 100)) + '%"></i></div>' +
        (editable ? '<div class="st-acts"><button class="btn btn-sm btn-ghost" data-h="-1"><bdi dir="ltr">−1</bdi></button><button class="btn btn-sm btn-main" data-h="1"><bdi dir="ltr">+1</bdi> ساعة</button><button class="btn btn-sm btn-ghost" data-h="2"><bdi dir="ltr">+2</bdi></button></div>' +
          '<label class="st-goal">هدفي الأسبوعي: <input type="number" min="2" max="40" id="goalIn" value="' + goal + '"> ساعة</label>' : '') +
        '<div class="st-bars">' + bars + '</div>' +
        '<div class="st-note">أسابيع حقّقت فيها هدفك: <b>' + C.studyWeeksMet + '</b> من ' + C.studyWeeksSoFar + ' · الدراسة = ربع تقدّمك الكامل</div></div>' +
      '<div class="st-card st-subjects"><div class="st-k">موادّي ومواعيد الامتحانات</div>' +
        (subs.length ? '<ul class="subj">' + subs.map(function (s) {
          var d = parseDate(s.exam), days = d ? Math.round((d - today) / DAY) : null;
          var badge = days === null ? '' : days < 0 ? '<span class="cd past">انتهى</span>' : days === 0 ? '<span class="cd hot">اليوم</span>' : '<span class="cd' + (days <= 7 ? ' hot' : '') + '">بعد ' + days + ' يوم</span>';
          return '<li><span class="sn">' + esc(s.name) + '</span><span class="sd">' + (d ? fmt(d) : 'بدون موعد') + '</span>' + badge + (editable ? '<button class="x" data-del="' + esc(s.id) + '" aria-label="حذف">×</button>' : '') + '</li>';
        }).join('') + '</ul>' : '<p class="muted">' + (editable ? 'أضف موادّك هذا الفصل ومواعيد امتحاناتها — أسبوع الامتحان يصبح تلقائيًا «أسبوع دراسة أولًا».' : 'لم تُضف المواد بعد.') + '</p>') +
        (editable ? '<div class="subj-add"><input id="subjName" placeholder="اسم المادة"><input id="subjDate" type="date"><button class="btn btn-sm btn-main" id="subjAdd">إضافة</button></div>' : '') +
        '<div class="st-tips"><b>ثلاث قواعد للمذاكرة:</b> استرجاع لا إعادة قراءة (اختبر نفسك بلا كتاب) · تكرار متباعد (راجع بعد يوم، ثم 3 أيام، ثم أسبوع) · جلسات 25 دقيقة بلا هاتف.</div></div>' +
    '</div>';
  el.querySelectorAll('[data-h]').forEach(function (b) { b.addEventListener('click', function () { var v = Math.max(0, Math.min(80, hours(w) + (+b.getAttribute('data-h')))); set('h:' + w, v); if (v >= goal && hours(w) >= goal) toast('🎯 حقّقت هدف الدراسة لهذا الأسبوع'); }); });
  var gi = $('#goalIn'); if (gi) gi.addEventListener('change', function () { var v = Math.max(2, Math.min(40, +gi.value || 8)); set('goal', v); });
  var add = $('#subjAdd'); if (add) add.addEventListener('click', function () {
    var n = ($('#subjName').value || '').trim(), d = $('#subjDate').value; if (!n) { $('#subjName').focus(); return; }
    var list = subjects().concat([{ id: Date.now().toString(36), name: n.slice(0, 40), exam: d || '' }]); set('subj', list);
  });
  el.querySelectorAll('[data-del]').forEach(function (b) { b.addEventListener('click', function () { var id = b.getAttribute('data-del'); set('subj', subjects().filter(function (s) { return s.id !== id; })); }); });
}

/* ----- weekly check-ins (sport, English, reflection…) ----- */
function renderChecks(C) {
  var el = $('#checks'); if (!el || !T.checks) return;
  var w = Math.min(Math.max(C.week, 1), WEEKS);
  el.innerHTML = '<div class="ck-head">عاداتي هذا الأسبوع <span>الأسبوع ' + w + '</span></div><div class="ck-list">' + T.checks.map(function (c) {
    var on = !!get('c:' + w + ':' + c.id, false);
    return '<button class="ck' + (on ? ' on' : '') + '" data-ck="' + c.id + '"' + (isMe() ? '' : ' disabled') + '><span class="ck-box">' + (on ? '✓' : '') + '</span><span><b>' + esc(c.t) + '</b><small>' + esc(c.d) + '</small></span></button>';
  }).join('') + '</div>';
  el.querySelectorAll('[data-ck]').forEach(function (b) { b.addEventListener('click', function () { var k = 'c:' + w + ':' + b.getAttribute('data-ck'); set(k, get(k, false) ? '' : 1); }); });
}

/* ----- chapters ----- */
var KIND = { lesson: 'درس', course: 'دورة', read: 'قراءة', watch: 'مشاهدة', practice: 'تمرين', project: 'مشروع', review: 'جلسة مع المشرف', mission: 'خطوة', milestone: 'محطة كبيرة', write: 'كتابة', ai: 'ذكاء اصطناعي' };
function renderChapters(C) {
  var el = $('#chapters'); if (!el) return;
  el.innerHTML = C.chs.map(function (x, i) {
    var ch = x.ch, cur = !C.allDone && i === C.currentIdx, open = S.open[ch.id] !== undefined ? S.open[ch.id] : cur;
    var dates = ch.weeks ? 'الأسبوعان ' + ch.weeks[0] + ' و' + ch.weeks[1] + ' · ' + fmt(weekStart(ch.weeks[0])) + ' – ' + fmt(weekEnd(ch.weeks[1])) : 'قبل الانطلاق';
    var tasks = ch.tasks.map(function (t) {
      var s = stat(t), link = get('l:' + t.id, ''), acts = '';
      if (isMe() && !t.pre) { if (s === 'todo') acts = btn('main', T.doneLabel || 'أنجزتُها', t.id, 'pending'); else if (s === 'pending') acts = btn('ghost', 'تراجع', t.id, 'todo'); }
      else if (isMgr() && !t.pre) { if (s === 'pending') acts = btn('ok', 'اعتماد ✓', t.id, 'done') + btn('ghost', 'إرجاع', t.id, 'todo'); else if (s === 'todo') acts = btn('ghost', 'اعتماد مباشر', t.id, 'done'); else acts = btn('ghost', 'إلغاء الاعتماد', t.id, 'pending'); }
      var sub = (t.sub && isMe() && s !== 'done') ? '<button class="t-attach" data-attach="' + t.id + '">📎 ' + (link ? 'تعديل الرابط' : 'إرفاق رابط العمل') + '</button><div class="t-sub" id="sub-' + t.id + '"><input type="url" dir="ltr" placeholder="https://…" data-linkin="' + t.id + '" value="' + esc(link) + '"><button class="btn btn-xs btn-main" data-linksave="' + t.id + '">حفظ</button></div>' : '';
      return '<div class="task k-' + t.k + ' ' + s + (S.just[t.id] ? ' just' : '') + (t.paid ? ' paid' : '') + '">' + icon(s) +
        '<div class="t-main"><div class="t-txt">' + txt(t.t) + '</div>' + (t.why ? '<div class="t-why">' + esc(t.why) + '</div>' : '') +
        '<div class="t-tags"><span class="tag k">' + (KIND[t.k] || '') + '</span>' + (t.paid ? '<span class="tag paid">مدفوعة</span>' : '') + (t.lang ? '<span class="tag lang">' + t.lang + '</span>' : '') + '<span class="tag wk">W' + t.w + '</span>' +
        (t.url ? '<a class="t-link" href="' + esc(t.url) + '" target="_blank" rel="noopener">افتح ↗</a>' : '') +
        (safeUrl(link) ? '<a class="t-link" href="' + esc(safeUrl(link)) + '" target="_blank" rel="noopener">📎 العمل المرفق</a>' : '') + '</div>' + sub + '</div>' +
        '<div class="t-act"><span class="stamp st-' + s + '">' + (s === 'done' ? 'معتمد' : s === 'pending' ? 'قيد المراجعة' : 'لم يبدأ') + '</span>' + acts + '</div></div>';
    }).join('');
    return '<article class="ch' + (x.complete ? ' done' : '') + (cur ? ' current' : '') + (open ? ' open' : '') + '" id="ch-' + ch.id + '" style="--cc:' + (ch.color || 'var(--accent)') + '">' +
      '<header class="ch-head" data-toggle="' + ch.id + '"><div class="ch-num">' + (ch.badge || ch.n) + '</div>' +
      '<div class="ch-titles"><div class="ch-en">' + esc(ch.en || '') + '</div><h3>' + esc(ch.name) + '</h3><div class="ch-meta">' + dates + '</div></div>' +
      '<div class="ch-prog"><div class="row"><span dir="ltr">' + x.done + ' / ' + x.total + '</span><span dir="ltr">' + x.pct + '%</span></div><div class="ch-bar"><i style="width:' + x.pct + '%"></i></div></div>' +
      '<button class="ch-toggle" aria-label="فتح أو طي">⌄</button></header>' +
      '<div class="ch-body"><div class="ch-inner">' + (ch.quote ? '<blockquote class="ch-quote">' + esc(ch.quote) + '</blockquote>' : '') + '<p class="ch-desc">' + esc(ch.desc) + '</p><div class="tasks">' + tasks + '</div></div></div></article>';
  }).join('');
  el.querySelectorAll('[data-toggle]').forEach(function (h) { h.addEventListener('click', function () { var id = h.getAttribute('data-toggle'), c = document.getElementById('ch-' + id), o = !c.classList.contains('open'); S.open[id] = o; c.classList.toggle('open', o); }); });
  bindTasks(el);
  el.querySelectorAll('[data-attach]').forEach(function (b) { b.addEventListener('click', function () { var x = document.getElementById('sub-' + b.getAttribute('data-attach')); if (x) x.classList.toggle('on'); }); });
  el.querySelectorAll('[data-linksave]').forEach(function (b) { b.addEventListener('click', function () { var id = b.getAttribute('data-linksave'), i = el.querySelector('[data-linkin="' + id + '"]'), u = safeUrl(i && i.value); if (i && i.value && !u) { toast('الرابط يجب أن يبدأ بـ https://'); return; } set('l:' + id, u); toast(u ? 'حُفظ الرابط 📎' : 'حُذف الرابط'); }); });
}
function btn(k, l, id, to) { return '<button class="btn btn-sm btn-' + k + '" data-task="' + id + '" data-to="' + to + '">' + l + '</button>'; }
function bindTasks(root) {
  root.querySelectorAll('[data-task]').forEach(function (b) { b.addEventListener('click', function (e) {
    var id = b.getAttribute('data-task'), to = b.getAttribute('data-to');
    burst(b, to === 'done' ? 24 : 10);
    if (to === 'done') S.just[id] = 1;
    if (to === 'pending' && isMe()) toast(T.pendingToast || 'أحسنت! المهمة الآن قيد المراجعة');
    set('s:' + id, to === 'todo' ? '' : to);
  }); });
}

/* ----- manager desk ----- */
function renderManager(C) {
  var sec = $('#mgrSec'), el = $('#mgrPanel'); if (!sec || !el) return;
  if (!isMgr()) { sec.classList.add('hidden'); return; }
  sec.classList.remove('hidden');
  var pend = ALL.filter(function (t) { return stat(t) === 'pending'; });
  var w = Math.min(Math.max(C.week, 1), WEEKS);
  el.innerHTML = '<h3>مكتب المشرف</h3><p class="mgr-lead">التقدّم الكامل <bdi dir="ltr">' + C.pct + '%</bdi> · المسار <bdi dir="ltr">' + C.taskPct + '%</bdi> · الدراسة: ' + C.studyWeeksMet + ' من ' + C.studyWeeksSoFar + ' أسابيع حقّق فيها هدفه · ساعات هذا الأسبوع: <bdi dir="ltr">' + hours(w) + ' / ' + studyGoal() + '</bdi></p>' +
    (T.hooks && T.hooks.managerExtra ? T.hooks.managerExtra(C, API) : '') +
    '<div class="mgr-sub">بانتظار مراجعتك (' + pend.length + ')</div><div class="mgr-list">' + (pend.length ? pend.map(function (t) {
      var l = safeUrl(get('l:' + t.id, ''));
      return '<div class="mgr-item"><span class="mi-txt">' + txt(t.t) + '<span class="mi-lvl">' + esc(t.ch.name) + ' · الأسبوع ' + t.w + '</span></span>' + (l ? '<a class="mi-link" href="' + esc(l) + '" target="_blank" rel="noopener">📎 فتح العمل</a>' : '') + btn('ok', 'اعتماد ✓', t.id, 'done') + btn('ghost-d', 'إرجاع', t.id, 'todo') + '</div>';
    }).join('') : '<div class="mgr-empty">لا شيء قيد المراجعة ✦</div>') + '</div>';
  bindTasks(el);
}

/* ----- resources shelf ----- */
function renderResources() {
  var el = $('#resources'); if (!el || !T.resources || el.dataset.done) return;
  el.dataset.done = 1;
  el.innerHTML = T.resources.map(function (g) {
    return '<div class="rs-group"><h4>' + esc(g.h) + '</h4><div class="rs-list">' + g.items.map(function (r) {
      var tag = r.url ? 'a' : 'div';
      return '<' + tag + ' class="rs' + (r.url ? '' : ' rs-lib') + '"' + (r.url ? ' href="' + esc(r.url) + '" target="_blank" rel="noopener"' : '') + '><span class="rs-t">' + txt(r.t) + '</span><span class="rs-m">' + txt(r.by) + '</span>' +
        '<span class="rs-tags"><i class="lang">' + r.lang + '</i>' + (r.paid ? '<i class="paid">' + esc(r.paid) + '</i>' : '') +(r.kind ? '<i>' + esc(r.kind) + '</i>' : '') + '</span>' + (r.d ? '<span class="rs-d">' + esc(r.d) + '</span>' : '') + '</' + tag + '>';
    }).join('') + '</div></div>';
  }).join('');
}

/* ---------------- delight ---------------- */
var cvs, ctx, parts = [], raf = null;
function burst(el, n) { if (!cvs) return; var r = el.getBoundingClientRect(); for (var i = 0; i < n; i++) parts.push({ x: r.left + r.width / 2, y: r.top + r.height / 2, vx: (Math.random() - .5) * 9, vy: -Math.random() * 8 - 3, g: .28, s: 3 + Math.random() * 5, c: T.confetti[(Math.random() * T.confetti.length) | 0] }); if (!raf) raf = requestAnimationFrame(step); }
function rain(n) { for (var i = 0; i < n; i++) parts.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * 300, vx: (Math.random() - .5) * 3, vy: Math.random() * 2, g: .12, s: 3 + Math.random() * 5, c: T.confetti[(Math.random() * T.confetti.length) | 0] }); if (!raf) raf = requestAnimationFrame(step); }
function step() { ctx.clearRect(0, 0, cvs.width, cvs.height); for (var i = parts.length - 1; i >= 0; i--) { var q = parts[i]; q.vy += q.g; q.x += q.vx; q.y += q.vy; if (q.y > cvs.height + 20) { parts.splice(i, 1); continue; } ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(q.x, q.y, q.s, 0, 6.283); ctx.fill(); } raf = parts.length ? requestAnimationFrame(step) : null; if (!raf) ctx.clearRect(0, 0, cvs.width, cvs.height); }
function toast(m) { var b = $('#toasts'); if (!b) return; var t = document.createElement('div'); t.className = 'toast'; t.textContent = m; b.appendChild(t); setTimeout(function () { t.classList.add('leave'); setTimeout(function () { t.remove(); }, 350); }, 4000); }
function celebrate(ch, C) {
  rain(120);
  var v = document.createElement('div'); v.className = 'cele';
  var c = T.hooks && T.hooks.celebration ? T.hooks.celebration(ch, C) : { h: 'اكتمل «' + ch.name + '»', p: '' };
  v.innerHTML = '<div class="cele-card"><div class="cele-ico">' + (c.ico || '✓') + '</div><h2>' + esc(c.h) + '</h2><p>' + esc(c.p) + '</p><button class="btn btn-main" id="celeX">متابعة</button></div>';
  document.body.appendChild(v);
  v.addEventListener('click', function (e) { if (e.target === v || e.target.id === 'celeX') v.remove(); });
}

/* ---------------- wiring ---------------- */
var API = { S: S, get: get, set: set, computed: computed, render: render, toast: toast, burst: burst, esc: esc, txt: txt, fmt: fmt, fmtShort: fmtShort, weekStart: weekStart, weekEnd: weekEnd, isMgr: isMgr, isMe: isMe, stat: stat, ALL: ALL, hours: hours, studyGoal: studyGoal, openChapter: openChapter };
window.TrackerAPI = API;

function showPicker(v) { var p = $('#rolePicker'); if (p) p.classList.toggle('hidden', !v); }
function init() {
  loadLocal();
  cvs = document.getElementById('confetti'); if (cvs) { ctx = cvs.getContext('2d'); var sz = function () { cvs.width = innerWidth; cvs.height = innerHeight; }; addEventListener('resize', sz); sz(); }
  if (S.gistId) S.sync = 'idle';
  $('#inGist').value = S.gistId; $('#inToken').value = S.token; $('#inFile').value = S.file;
  showPicker(!S.role);
  document.querySelectorAll('[data-role]').forEach(function (b) { b.addEventListener('click', function () {
    if (b.getAttribute('data-role') === 'manager') { $('#pinRow').classList.remove('hidden'); $('#pinInput').focus(); return; }
    S.role = 'me'; saveCfg(); showPicker(false); render(); burst(b, 30); toast(T.welcome);
    if (!S.gistId) setTimeout(function () { $('#setupPanel').classList.remove('hidden'); }, 900);
  }); });
  function tryPin() { if (($('#pinInput').value || '').trim() === (T.pin || '2001')) { S.role = 'manager'; saveCfg(); showPicker(false); render(); pull(); } else { $('#pinErr').classList.remove('hidden'); } }
  $('#pinGo').addEventListener('click', tryPin);
  $('#pinInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') tryPin(); });
  $('#btnSwitchRole').addEventListener('click', function () { showPicker(true); });
  $('#btnSyncNow').addEventListener('click', function () { pull(true); });
  $('#btnSetup').addEventListener('click', function () { $('#setupPanel').classList.toggle('hidden'); });
  $('#btnSaveSetup').addEventListener('click', function () {
    S.gistId = $('#inGist').value.trim(); S.token = $('#inToken').value.trim(); S.file = $('#inFile').value.trim() || T.file;
    saveCfg(); $('#setupPanel').classList.add('hidden'); S.sync = S.gistId ? 'idle' : 'local'; toast('تم الحفظ — جارٍ الاتصال…'); pull(true);
  });
  if (T.hooks && T.hooks.init) T.hooks.init(API);
  render();
  if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { threshold: .06 }); document.querySelectorAll('.rv').forEach(function (n) { io.observe(n); }); } else document.querySelectorAll('.rv').forEach(function (n) { n.classList.add('in'); });
  if (S.gistId) pull();
  setInterval(function () { if (S.gistId && !pushPending) pull(); }, 60000);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
