(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var $ = function (id) { return document.getElementById(id); };

  // ---- Opt-in interface sounds (synthesized with Web Audio; nothing plays unless the visitor turns it on) ----
  var soundOn = false;
  try { soundOn = localStorage.getItem('sound') === '1'; } catch (e) {}
  var actx = null;
  window.__sfx = function (k) { sfx(k); };
  function sfx(kind) {
    if (!soundOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      var t = actx.currentTime;
      if (kind === 'whoosh') {
        // filtered noise sweep, like a hand moving through air
        var len = Math.round(actx.sampleRate * 0.28), nb = actx.createBuffer(1, len, actx.sampleRate), ch = nb.getChannelData(0);
        for (var n = 0; n < len; n++) ch[n] = (Math.random() * 2 - 1) * Math.sin(Math.PI * n / len);
        var src = actx.createBufferSource(), bp = actx.createBiquadFilter(), wg = actx.createGain();
        src.buffer = nb; bp.type = 'bandpass'; bp.Q.value = 0.9;
        bp.frequency.setValueAtTime(500, t); bp.frequency.exponentialRampToValueAtTime(1600, t + 0.26);
        wg.gain.value = 0.05;
        src.connect(bp); bp.connect(wg); wg.connect(actx.destination); src.start(t);
        return;
      }
      var o = actx.createOscillator(), g = actx.createGain();
      var f = { grab: 520, drop: 210, tick: 880, open: 660, tap: 1250 }[kind] || 440;
      o.type = kind === 'drop' ? 'triangle' : 'sine';
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * (kind === 'drop' ? 0.6 : 1.4), t + 0.08);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.07, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'tap' ? 0.05 : 0.12));
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + 0.14);
    } catch (e) {}
  }


  // ---- Device-aware experience: phone / tablet / desktop ----
  function detectDevice() {
    // Media queries, because reading innerWidth this early forces a full layout.
    function mq(q) { return window.matchMedia(q).matches; }
    if (mq('(max-width: 760px)')) return 'phone';
    if (mq('(max-width: 1100px)')) return 'tablet';
    if (mq('(hover: none) and (pointer: coarse)') && mq('(max-width: 1366px)')) return 'tablet';
    return 'desktop';
  }
  function applyDevice() {
    var d = detectDevice();
    root.setAttribute('data-device', d);
    root.setAttribute('data-touch', window.matchMedia('(hover: none)').matches ? '1' : '0');
  }
  applyDevice();
  var deviceTimer;
  window.addEventListener('resize', function () { clearTimeout(deviceTimer); deviceTimer = setTimeout(applyDevice, 150); });
  function isDesktop() { return root.getAttribute('data-device') === 'desktop'; }

  // Phone/tablet tab bar: highlight the section in view.
  var tabbar = $('tabbar');
  if (tabbar && 'IntersectionObserver' in window) {
    var tabs = {};
    tabbar.querySelectorAll('a[data-tab]').forEach(function (a) { tabs[a.getAttribute('data-tab')] = a; });
    var tabSpy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        Object.keys(tabs).forEach(function (k) { tabs[k].classList.remove('active'); tabs[k].removeAttribute('aria-current'); });
        if (!tabs[en.target.id]) return; // back in the hero: no tab is lit
        tabs[en.target.id].classList.add('active');
        tabs[en.target.id].setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(tabs).forEach(function (id) { var sec = $(id); if (sec) tabSpy.observe(sec); });
    var heroSec = document.querySelector('.stage');
    if (heroSec) tabSpy.observe(heroSec);
  }

  // ---- Work: cards / index view ----
  var workSec = $('work'), pindex = $('projIndex'), vtWork = $('viewToggleWork');
  if (workSec && pindex && vtWork) {
    var projItems = Array.prototype.slice.call(workSec.querySelectorAll('[data-cats]'));
    var list = document.createElement('ol');
    list.className = 'pindex__list';
    projItems.forEach(function (it, i) {
      var title = it.querySelector('h3') ? it.querySelector('h3').textContent.trim() : '';
      var kindEl = it.querySelector('.case__kicker') || it.querySelector('.tag');
      var kind = kindEl ? kindEl.textContent.trim() : '';
      var badge = it.querySelector('.badge');
      var chips = Array.prototype.slice.call(it.querySelectorAll('.chips li')).slice(0, 4).map(function (c) { return c.textContent.trim(); });
      var link = it.querySelector('.case__links a[href^="http"], a.link[href^="http"], .mini a[href^="http"]');
      var row = document.createElement('li');
      row.className = 'pindex__row';
      row.setAttribute('data-for', it.id);
      var n = document.createElement('span'); n.className = 'pindex__n'; n.textContent = ('0' + (i + 1)).slice(-2);
      var head = document.createElement('div');
      var t = document.createElement('button'); t.type = 'button'; t.className = 'pindex__title'; t.textContent = title;
      t.addEventListener('click', function () { setView('grid'); it.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }); });
      var k = document.createElement('span'); k.className = 'pindex__kind'; k.textContent = kind;
      head.appendChild(t); head.appendChild(k);
      var stack = document.createElement('div'); stack.className = 'pindex__stack';
      chips.forEach(function (c) { var s = document.createElement('span'); s.textContent = c; stack.appendChild(s); });
      var rec = document.createElement('div'); rec.className = 'pindex__rec';
      if (badge && !/Built during/.test(badge.textContent)) { var b = badge.cloneNode(true); b.classList.add('badge--inline'); rec.appendChild(b); }
      var go = document.createElement('div'); go.className = 'pindex__go';
      if (link) { var a = document.createElement('a'); a.className = 'link'; a.href = link.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'Open ↗'; go.appendChild(a); }
      [n, head, stack, rec, go].forEach(function (x) { row.appendChild(x); });
      list.appendChild(row);
    });
    pindex.appendChild(list);
    function syncIndex() {
      projItems.forEach(function (it) {
        var row = list.querySelector('[data-for="' + it.id + '"]');
        if (row) row.hidden = it.classList.contains('is-hidden');
      });
    }
    new MutationObserver(syncIndex).observe(workSec, { attributes: true, subtree: true, attributeFilter: ['class'] });
    var viewBtns = Array.prototype.slice.call(vtWork.querySelectorAll('button'));
    function setView(v) {
      workSec.classList.toggle('is-index', v === 'index');
      pindex.hidden = v !== 'index';
      viewBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === v)); });
      try { sessionStorage.setItem('workView', v); } catch (e) {}
    }
    viewBtns.forEach(function (b) { b.addEventListener('click', function () { setView(b.getAttribute('data-view')); }); });
    syncIndex();
    var savedView = null;
    try { savedView = sessionStorage.getItem('workView'); } catch (e) {}
    if (savedView === 'index') setView('index');
    vtWork.hidden = false;
  }

  // ---- Experience: timeline line fills as you scroll ----
  var timelines = Array.prototype.slice.call(document.querySelectorAll('.timeline'));
  if (timelines.length) {
    var tlTick = false;
    function fillTimelines() {
      tlTick = false;
      var vh = window.innerHeight;
      timelines.forEach(function (tl) {
        var r = tl.getBoundingClientRect();
        var p = Math.max(0, Math.min(1, (vh * 0.65 - r.top) / r.height));
        tl.style.setProperty('--p', reduceMotion ? 1 : p.toFixed(3));
      });
    }
    window.addEventListener('scroll', function () { if (!tlTick) { tlTick = true; requestAnimationFrame(fillTimelines); } }, { passive: true });
    // First fill waits until a timeline is on screen, so startup never lays out those sections.
    if ('IntersectionObserver' in window) {
      var tlSeen = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) fillTimelines();
      });
      timelines.forEach(function (tl) { tlSeen.observe(tl); });
    } else fillTimelines();
  }

  // ---- Desktop: spotlight that follows the cursor, magnetic primary buttons ----
  var spotSel = '.case, .card, .cred, .ctile, .timeline > li, .principles li, .skill-group, .resume__facts > div';
  Array.prototype.forEach.call(document.querySelectorAll(spotSel), function (el) { el.classList.add('spot'); });
  document.addEventListener('pointermove', function (e) {
    if (!isDesktop() || e.pointerType !== 'mouse') return;
    var el = e.target.closest && e.target.closest('.spot');
    if (!el) return;
    var r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
  if (!reduceMotion) {
    Array.prototype.forEach.call(document.querySelectorAll('.btn--primary, .nav__cta'), function (el) {
      el.classList.add('magnetic');
      el.addEventListener('pointermove', function (e) {
        if (!isDesktop() || e.pointerType !== 'mouse') return;
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.translate = (dx * 8).toFixed(1) + 'px ' + (dy * 6).toFixed(1) + 'px';
      });
      el.addEventListener('pointerleave', function () { el.style.translate = ''; });
    });
  }

  // ---- Contact: topic chips tailor the message hint ----
  var msgBox = $('f-msg');
  var topicHints = {
    'Internship': 'The role, dates, and how you’d like me to apply…',
    'Project': 'What you want to build, and your timeline…',
    'Hackathon team': 'Which hackathon, the dates, and who’s on the team…',
    'Just saying hi': 'Say hello!'
  };
  Array.prototype.forEach.call(document.querySelectorAll('.topics input'), function (r) {
    r.addEventListener('change', function () { if (msgBox && topicHints[r.value]) msgBox.placeholder = topicHints[r.value]; });
  });
  if (msgBox) msgBox.placeholder = topicHints.Internship;


  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    try { sessionStorage.removeItem('intro:seen'); } catch (e) {} // a replay always gets the full intro
  }

  // ---- Startup "live build": two hand cursors drag every hero element into place (first visit per session) ----
  var building = root.classList.contains('build-on');
  // The 3D hands (script + textures) are only fetched when the intro actually plays.
  var askLoad = null;
  function loadAsk() {
    if (askLoad) return askLoad;
    askLoad = new Promise(function (res) {
      if (window.AskMe) return res(window.AskMe);
      var sc = document.createElement('script');
      sc.src = '/ask.js';
      sc.onload = function () { res(window.AskMe || null); };
      sc.onerror = function () { res(null); };
      document.head.appendChild(sc);
    });
    return askLoad;
  }
  var handsLoad = null;
  function loadHands() {
    if (handsLoad) return handsLoad;
    handsLoad = new Promise(function (res) {
      if (window.RealHand) return res(window.RealHand);
      var sc = document.createElement('script');
      sc.src = '/hand3d.js';
      sc.onload = function () { res(window.RealHand || null); };
      sc.onerror = function () { res(null); };
      document.head.appendChild(sc);
    }).then(function (RH) { return RH ? RH.load().then(function () { return RH; }) : null; });
    return handsLoad;
  }
  if (building) loadHands();
  var buildDone = !building;
  function onBuilt(fn) { if (buildDone) fn(); else document.addEventListener('build:done', fn, { once: true }); }
  // Each hand works its own half of the page: my right hand ('design') takes whatever sits right of the
  // centre line, my left hand ('code') whatever sits left of it.
  function sideTone(r) { return r.left + r.width / 2 >= window.innerWidth / 2 ? 'design' : 'code'; }
  // A grip point on the hand's own half, even when the element spans the centre line.
  function gripX(tone, left, width, x, mid) {
    if (tone === 'design' && x < mid) return Math.min(left + width - 24, mid + 60);
    if (tone === 'code' && x > mid) return Math.max(left + 24, mid - 60);
    return x;
  }
  // My real 3D hand with its selection box, living inside an overlay layer. Callers check RealHand.ready first.
  function makeHand(layer, label, tone) {
    var sel = document.createElement('div');
    sel.className = 'bp__sel';
    sel.innerHTML = '<span class="bp__tag"></span><span class="bp__size"></span><i></i><i></i><i></i><i></i>';
    var boxFn = function (x, y, w, h, ms) {
      sel.style.transitionDuration = ms + 'ms';
      sel.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      sel.style.width = w + 'px'; sel.style.height = h + 'px';
    };
    // The labels draw their text from CSS: it looks the same, and a passing animation is never read as page text.
    var labelFn = function (tag, w, h) { sel.querySelector('.bp__tag').setAttribute('data-t', tag); sel.querySelector('.bp__size').setAttribute('data-t', Math.round(w) + ' × ' + Math.round(h)); };
    layer.appendChild(sel);
    var rh = window.RealHand.create(layer, label, tone);
    return { el: rh.el, sel: sel, move: rh.move, follow: rh.follow, tap: rh.tap, pose: rh.pose, grip: rh.grip, press: rh.press, wave: rh.wave, box: boxFn, label: labelFn };
  }

  function whenReady(fn) {
    var done = false;
    function go() { if (!done) { done = true; fn(); } }
    setTimeout(go, 10000); // a very slow connection gets the page without the intro, never a stand-in hand
    function fontsGo() {
      if (!document.fonts || !document.fonts.load) return go();
      Promise.all(['400 100px Anton', '600 40px Caveat', '700 40px "Space Grotesk"', '400 16px Inter'].map(function (f) {
        return document.fonts.load(f).catch(function () {});
      })).then(go, go);
    }
    loadHands().then(function () {
      setTimeout(go, 1800); // fonts alone never hold the hands back for long
      fontsGo();
    }, go);
  }
  // A tab opened in the background waits until it is actually seen before the hands start.
  function whenVisible(fn) {
    if (!document.hidden) return fn();
    document.addEventListener('visibilitychange', function on() { if (!document.hidden) { document.removeEventListener('visibilitychange', on); fn(); } });
  }
  // Every load starts fresh from the top (the intro plays each time), so don't restore the old scroll position.
  if (building && 'scrollRestoration' in history) history.scrollRestoration = 'manual';
  var startHash = location.hash;
  // A malformed link (#%E0%A4) must not throw, so decode it safely.
  function hashId(h) { try { return decodeURIComponent(h.slice(1)); } catch (e) { return h.slice(1); } }
  // Sections render lazily, so a smooth scroll aims at an estimated height and stops short of far targets.
  // Land directly, then re-aim while the sections in between settle.
  function landOn(el, block) {
    var opt = { behavior: 'instant', block: block || 'start' };
    el.scrollIntoView(opt);
    [120, 320, 700].forEach(function (ms) {
      setTimeout(function () {
        var t = el.getBoundingClientRect().top;
        if (t < 0 || t > (block === 'center' ? window.innerHeight * 0.7 : 160)) el.scrollIntoView(opt);
      }, ms);
    });
  }
  // A direct link (#contact, #credentials): sections not rendered yet only have estimated heights, so the browser's
  // own jump lands in the wrong place. Land again once the page has loaded, until it settles.
  (function () {
    var hash = location.hash;
    if (!hash || /^#project\//.test(hash)) return;
    function land() {
      var el = null;
      try { el = document.querySelector(hash); } catch (e) {}
      if (el && el.closest('main')) landOn(el);
    }
    if (document.readyState === 'complete') land(); else window.addEventListener('load', land, { once: true });
  })();
  var pace = 1;
  if (building) { try { if (sessionStorage.getItem('intro:seen') === '1') pace = 0.32; sessionStorage.setItem('intro:seen', '1'); } catch (e) {} }
  if (building) (function () {
    window.__bp = 1; // this script is running, so the head's safety timer stands down
    var D = 'design', K = 'code';
    // [selector, tag, hand, dx, dy, tilt, grip x, grip y, fast]
    var plan = [
      ['.stage__word', '<div.word>', D, -150, -70, -4, 0.16, 0.55],
      ['.stage .status', '<p.status>', K, 140, -60, -5, 0.5, 0.5],
      ['.stage__portrait', '<img#portrait>', D, 70, 40, 3, 0.5, 0.32], // keep in step with its first-paint offset in styles.css
      ['.stage .role', '<p.role>', D, 200, 40, 3, 0.3, 0.5],
      ['#hero-title', '<h1#hero-title>', D, -190, 110, -3, 0.32, 0.5],
      ['.stage .lede', '<p.lede>', K, -160, 120, 2, 0.4, 0.3],
      ['.stage__rail', '<dl.stats>', D, 170, -90, 4, 0.4, 0.18],
      ['.stage .hero__cta .btn--primary', '<a.btn--primary>', K, 120, 140, -8, 0.5, 0.5, 1],
      ['.stage__scroll', '<a.scroll>', D, 60, 90, 6, 0.5, 0.5, 1],
      ['.stage .hero__cta .btn--ghost', '<a.btn--ghost>', K, 210, 110, 7, 0.5, 0.5, 1],
      ['.stage .hero__contact', '<a.contact>', K, 160, -80, -6, 0.5, 0.5, 1],
      ['.stage .socials li:nth-child(1)', '<a.github>', K, -110, 90, -9, 0.5, 0.5, 1],
      ['.stage .socials li:nth-child(2)', '<a.linkedin>', K, 90, 120, 8, 0.5, 0.5, 1],
      ['.stage .socials li:nth-child(3)', '<a.instagram>', K, -60, 140, -7, 0.5, 0.5, 1],
      ['.stage .socials li:nth-child(4)', '<a.email>', K, 140, 80, 10, 0.5, 0.5, 1]
    ];
    var steps = plan.map(function (d) { return { el: document.querySelector(d[0]), tag: d[1], dx: d[3], dy: d[4], rot: d[5], gx: d[6], gy: d[7], fast: !!d[8] }; })
      .filter(function (st) { return st.el; });
    var stage = document.querySelector('.stage');
    var skipped = false, finished = false, layer = null, skipBtn = null, hands = null;

    // The normal entrance must not run: it would put pieces in place before a hand touches them.
    Array.prototype.forEach.call(document.querySelectorAll('.stage .enter'), function (e) { e.classList.remove('enter'); });
    if (stage) stage.classList.add('no-enter');
    window.scrollTo(0, 0);

    function wait(ms) { return new Promise(function (res) { setTimeout(res, skipped ? 0 : ms * pace); }); }
    async function halt(ms) { await wait(ms); return skipped; }

    function finish() {
      if (finished) return;
      finished = true;
      skipped = true;
      steps.forEach(function (st) {
        st.el.style.translate = ''; st.el.style.rotate = '';
        st.el.classList.remove('is-building', 'is-picked', 'is-scattered');
      });
      if (layer) { layer.classList.add('is-leaving'); setTimeout(function () { layer.remove(); }, 500); }
      if (skipBtn) skipBtn.remove();
      root.classList.remove('build-on');
      ['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach(function (ev) { window.removeEventListener(ev, userSkip, true); });
      buildDone = true;
      document.dispatchEvent(new Event('build:done'));
      if (startHash && startHash.length > 1) {
        if (window.__showCred) window.__showCred(hashId(startHash));
        var target = document.getElementById(hashId(startHash));
        // a deep link lands instantly (no smooth scroll through every section); sections settle their heights as they render, so re-aim twice
        if (target) setTimeout(function () { landOn(target); }, 60);
      }
    }
    function userSkip(e) {
      var hh = e && e.type === 'pointerdown' && e.target && e.target.closest && e.target.closest('.rhand');
      if (hh && hh._hand) { hh._hand.wave(1100); sfx('open'); return; }
      var link = e && e.target && e.target.closest && e.target.closest('a[href^="#"]');
      if (link && link.getAttribute('href').length > 1) startHash = link.getAttribute('href');
      finish();
    }

    // Someone following a link to a section or project wants that, not the intro.
    if (startHash.length > 1 && (/^#project\//.test(startHash) || document.getElementById(hashId(startHash)))) { setTimeout(finish, 0); return; }

    // Scatter everything now, before any hand exists, so nothing is ever seen in its final place early.
    var scale = Math.min(1, window.innerWidth / 1280);
    steps.forEach(function (st) {
      st.hand = sideTone(st.el.getBoundingClientRect()) === 'design' ? D : K;
      st.dx = Math.abs(st.dx) * scale * (st.hand === D ? 1 : -1); // scattered outward, toward its own hand
      st.dy *= scale;
    });
    if (stage) stage.classList.add('bp-still');
    steps.forEach(function (st) {
      st.el.classList.add('is-building', 'is-scattered');
      st.el.style.translate = st.dx + 'px ' + st.dy + 'px';
      st.el.style.rotate = st.rot + 'deg';
    });
    if (stage) { stage.classList.add('bp-live'); void stage.offsetWidth; stage.classList.remove('bp-still'); }

    layer = document.createElement('div');
    layer.className = 'bp is-on';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = '<div class="bp__grid"></div>';
    document.body.appendChild(layer);
    skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'bp__skip';
    skipBtn.textContent = 'Skip intro';
    document.body.appendChild(skipBtn);
    skipBtn.addEventListener('click', userSkip);
    ['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, userSkip, true); });

    // Resting places, read in one go with the scatter switched off (fonts have settled by now).
    function measure() {
      if (stage) stage.classList.add('bp-still', 'bp-measure');
      steps.forEach(function (st) {
        var r = st.el.getBoundingClientRect();
        st.rect = { x: r.left, y: r.top, w: r.width, h: r.height };
      });
      if (stage) { stage.classList.remove('bp-measure'); void stage.offsetWidth; stage.classList.remove('bp-still'); }
      steps.forEach(function (st, i) {
        // wide elements: grip them on the working hand's half
        var mid = window.innerWidth / 2, gx = st.rect.x + st.rect.w * st.gx, nx = gripX(st.hand, st.rect.x, st.rect.w, gx, mid);
        if (nx !== gx && st.rect.w) st.gx = (nx - st.rect.x) / st.rect.w;
        if (st.fast) return;
        var slot = document.createElement('div');
        slot.className = 'bp__slot';
        slot.style.transform = 'translate(' + st.rect.x + 'px,' + st.rect.y + 'px)';
        slot.style.width = st.rect.w + 'px';
        slot.style.height = st.rect.h + 'px';
        slot.style.transitionDelay = (i * 50) + 'ms';
        layer.appendChild(slot);
        st.slot = slot;
      });
    }

    // One hand works through its own list; both run at the same time.
    async function work(h, list, startX) {
      h.move(startX, window.innerHeight + 40, 0);
      if (await halt(80)) return;
      for (var i = 0; i < list.length; i++) {
        var st = list[i], R = st.rect;
        var T = st.fast ? { go: 130, grab: 30, drag: 190, drop: 30 } : { go: i === 0 ? 320 : 220, grab: 60, drag: 320, drop: 60 };
        if (pace !== 1) Object.keys(T).forEach(function (k) { T[k] = Math.round(T[k] * pace); });
        var sx = R.x + st.dx, sy = R.y + st.dy;
        var gx = sx + R.w * st.gx, gy = sy + R.h * st.gy;
        h.move(gx, gy, T.go);
        if (await halt(T.go + 10)) return;
        h.grip(true); sfx('grab');
        st.el.classList.add('is-picked');
        h.label(st.tag, R.w, R.h);
        h.box(sx, sy, R.w, R.h, 0);
        h.sel.classList.add('is-on');
        if (await halt(T.grab)) return;
        st.el.style.translate = '0px 0px';
        st.el.style.rotate = '0deg';
        h.move(gx - st.dx, gy - st.dy, T.drag);
        h.box(R.x, R.y, R.w, R.h, T.drag);
        if (await halt(T.drag + 10)) return;
        h.grip(false);
        st.el.classList.remove('is-picked', 'is-building', 'is-scattered');
        if (st.slot) st.slot.classList.add('is-filled');
        h.sel.classList.add('is-drop'); sfx('drop');
        if (await halt(T.drop)) return;
        h.sel.classList.remove('is-on', 'is-drop');
      }
    }

    async function run() {
      if (await halt(160)) return;
      await Promise.all([
        work(hands.design, steps.filter(function (s) { return s.hand === D; }), window.innerWidth * 0.62),
        work(hands.code, steps.filter(function (s) { return s.hand === K; }), window.innerWidth * 0.3)
      ]);
      if (skipped) return;
      var cta = document.querySelector('.stage .hero__cta .btn--primary');
      if (cta) {
        var c = cta.getBoundingClientRect(), presser = sideTone(c), waver = presser === 'design' ? 'code' : 'design';
        hands[presser].move(gripX(presser, c.left, c.width, c.left + c.width * 0.62, window.innerWidth / 2), c.top + c.height * 0.55, 260 * pace);
        hands[waver].wave(620);
        hands[waver].move(waver === 'design' ? window.innerWidth + 60 : -60, c.top - 120, 620 * pace);
        if (await halt(280)) return;
        hands[presser].press();
        cta.classList.add('is-poked');
        if (await halt(220)) return;
        cta.classList.remove('is-poked');
      }
      if (await halt(60)) return;
      finish();
    }

    whenVisible(function () { whenReady(function () {
      if (finished) return;
      if (!(window.RealHand && window.RealHand.ready)) return finish(); // no hand, no intro: never a stand-in
      window.scrollTo(0, 0);
      measure();
      hands = { design: makeHand(layer, 'Design', 'design'), code: makeHand(layer, 'Code', 'code') };
      run();
    }); });
  })();

  // The "Verified" stamp only goes on certificates a visitor can check for themselves; with the intro, the hands stamp each as they place it.
  function canVerify(c) { return !!c.querySelector('a[href*="coursera.org"]'); }
  if (!building) Array.prototype.forEach.call(document.querySelectorAll('.cred'), function (c) { if (canVerify(c)) c.classList.add('is-stamped'); });

  // A layer for one-off hands (resume hand-off), above the page, never catching clicks.
  var fxLayer = null;
  function fxHand(tone) {
    if (!window.RealHand || !window.RealHand.ready || reduceMotion) return null;
    if (!fxLayer) { fxLayer = document.createElement('div'); fxLayer.className = 'bp-fx'; fxLayer.setAttribute('aria-hidden', 'true'); document.body.appendChild(fxLayer); }
    return window.RealHand.create(fxLayer, '', tone);
  }

  // Back to top: a hand grabs the page and pulls it up.
  var toTopBtn = document.querySelector('.totop, #toTop, .back-to-top');
  if (toTopBtn) toTopBtn.addEventListener('click', function () {
    var r = toTopBtn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    var hd = fxHand(sideTone(r)); if (!hd) return;
    hd.move(x, y, 260);
    setTimeout(function () { hd.grip(true); hd.move(x - 30, 60, 620); }, 280);
    setTimeout(function () { hd.grip(false); hd.pose('open'); hd.move(x + (hd.side === 'r' ? 160 : -160), -160, 420); }, 940);
    setTimeout(function () { hd.el.remove(); }, 1420);
  });

  // Type "sonu" anywhere (outside a text field): both my hands pop up and say hi.
  var eggBuf = '';
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || /input|textarea|select/i.test((e.target && e.target.tagName) || '') || (e.target && e.target.isContentEditable)) return;
    eggBuf = (eggBuf + (e.key || '').toLowerCase()).slice(-4);
    if (eggBuf !== 'sonu') return;
    eggBuf = '';
    sayHi();
  });
  function sayHi() {
    var L = fxHand('code'), Rh = fxHand('design'); if (!L || !Rh) return;
    var H = window.innerHeight, Wd = window.innerWidth;
    L.move(Wd * 0.4, H + 40, 0); Rh.move(Wd * 0.6, H + 40, 0);
    L.move(Wd * 0.4, H - 150, 380); Rh.move(Wd * 0.6, H - 150, 380);
    setTimeout(function () { L.pose('peace'); Rh.pose('peace'); sfx('open'); }, 420);
    setTimeout(function () { L.wave(900); Rh.wave(900); }, 1100);
    setTimeout(function () { L.move(-160, H + 120, 520); Rh.move(Wd + 160, H + 120, 520); }, 2050);
    setTimeout(function () { L.el.remove(); Rh.el.remove(); }, 2650);
  }

  // ---- Sections: two hands place every block as it scrolls into view (on every page load) ----
  function sectionHands(phone) {
    // Phones: the hero and the big blocks only. Text you are reading and forms you are filling never wait.
    var SEL = phone ? [
      '.stage__word', '.stage__portrait', '.status', '#hero-title', '.role', '.lede', '.hero__cta', '.socials', '.stage__rail',
      '.section__head > *', '.group-title', '.certs__title', '.case', '.skill-group', '.cred-feature', '.journey__map', '.rvault__stack'
    ].join(',') : [
      '.section__head > *', '.group-title', '.filters', '.viewtoggle', '.case', '.cards > .card',
      '.prose > p', '.prose__sub', '.principles li', '.remarks .quote', '.skill-group',
      '.timeline > li', '.cred-stats > div', '.certs__title', '.medals > li', '.cred-feature',
      '.creds > .cred', '.creds__more', '.rvault__stack', '.rswitch', '.rinfo[data-info="dev"] .rinfo__lede', '.rinfo[data-info="dev"] .resume__facts > div', '.rinfo[data-info="dev"] .resume__title',
      '.rinfo[data-info="dev"] .resume__toc', '.rinfo[data-info="dev"] .resume__cta', '.contact__grid > div:first-child > :not(.ctiles)', '.ctiles > li', '.form', '.journey__map', '.journey__online', '.words'
    ].join(',');
    var all = Array.prototype.slice.call(document.querySelectorAll('main ' + SEL.split(',').join(', main ')));
    var set = new Set(all);
    // Never displace a block whose parent block is already displaced (offsets would stack).
    var blocks = all.filter(function (el) {
      for (var p = el.parentElement; p; p = p.parentElement) if (set.has(p)) return false;
      return phone || !el.closest('.stage');
    });
    var small = window.innerWidth <= 760, k = small ? 0.45 : 1;
    blocks.forEach(function (el, i) {
      el._dx = (i % 2 ? 1 : -1) * (40 + (i * 37) % 50) * k;
      el._dy = (22 + (i * 23) % 28) * k;
      el._rot = ((i * 7) % 7) - 3;
    });
    function prep(el) {
      if (el._prepped || el._placed) return;
      el._prepped = true;
      el._dx = Math.abs(el._dx) * (sideTone(el.getBoundingClientRect()) === 'design' ? 1 : -1); // wait on its own hand's side
      el.classList.add('hand-wait');
      el.style.translate = el._dx + 'px ' + el._dy + 'px';
      el.style.rotate = el._rot + 'deg';
    }
    var waiting = blocks;
    // Blocks get their "waiting" look ~1.5 screens before they are seen, so the page loads clean and light.
    var prepIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting && en.target.getClientRects().length) { prepIo.unobserve(en.target); prep(en.target); } });
    }, { rootMargin: '40% 0px 40% 0px' });
    blocks.forEach(function (el) { prepIo.observe(el); });

    function settle(el) {
      el._placed = true;
      if (el.classList.contains('cred') && canVerify(el)) el.classList.add('is-stamped');
      if (!el.classList.contains('hand-wait')) return;
      el.style.translate = ''; el.style.rotate = '';
      el.classList.remove('hand-wait');
    }
    // Keyboard users never wait: focusing inside a block places it at once.
    document.addEventListener('focusin', function (e) { var b = e.target.closest && e.target.closest('.hand-wait'); if (b) settle(b); });

    var layer = null, hands = [], queue = [];
    function ensure() {
      if (layer) return;
      layer = document.createElement('div');
      layer.className = 'bp bp--lite is-on';
      layer.setAttribute('aria-hidden', 'true');
      document.body.appendChild(layer);
      hands = [makeHand(layer, 'Design', 'design'), makeHand(layer, 'Code', 'code')];
      hands[0].tone = 'design'; hands[1].tone = 'code';
      hands.forEach(function (h) { h.el.classList.add('is-gone'); h.busy = false; });
    }
    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function visible(el) { var r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth; }

    async function place(h, el) {
      if (!el.classList.contains('hand-wait')) return;
      if (!visible(el)) { settle(el); return; }
      var r = el.getBoundingClientRect(), sx = window.scrollX, sy = window.scrollY;
      var x = r.left + sx, y = r.top + sy;
      var gx = gripX(h.tone, x, r.width, x + Math.min(r.width * 0.35, 150), sx + window.innerWidth / 2), gy = y + Math.min(r.height * 0.35, 70);
      var hx = x - el._dx, hy = y - el._dy;
      h.el.classList.remove('is-gone');
      h.move(gx, gy, 170);
      await sleep(180);
      if (!el.classList.contains('hand-wait')) return;
      h.grip(true); sfx('grab');
      h.label('<' + el.tagName.toLowerCase() + (el.classList[0] && el.classList[0] !== 'hand-wait' ? '.' + el.classList[0] : '') + '>', r.width, r.height);
      h.box(x, y, r.width, r.height, 0);
      h.sel.classList.add('is-on');
      el.classList.add('hand-held');
      await sleep(40);
      settle(el);
      h.move(gx - el._dx, gy - el._dy, 230);
      h.box(hx, hy, r.width, r.height, 230);
      await sleep(240);
      h.grip(false);
      el.classList.remove('hand-held');
      h.sel.classList.add('is-drop'); sfx('drop');
      if (el.classList.contains('cred') && canVerify(el) && h.press) {
        await sleep(60);
        h.press();
        el.classList.add('is-stamped', 'stamp-anim');
        await sleep(170);
      }
      await sleep(50);
      h.sel.classList.remove('is-on', 'is-drop');
    }
    function pump() {
      // Too much queued (fast scrolling)? Let the oldest settle on their own so nobody waits.
      while (queue.length > (phone ? 10 : 6)) settle(queue.shift());
      // the block's resting place (without its waiting offset) decides which hand takes it
      var sideOf = function (el) { var r = el.getBoundingClientRect(), dx = el.classList.contains('hand-wait') ? (el._dx || 0) : 0; return sideTone({ left: r.left - dx, width: r.width }); };
      var next = function (h) { for (var i = 0; i < queue.length; i++) if (sideOf(queue[i]) === h.tone) return queue.splice(i, 1)[0]; return queue.shift() || null; }; // its own side first, then whatever is left
      hands.forEach(function (h) {
        if (h.busy) return;
        var first = next(h);
        if (!first) return;
        h.busy = true;
        (async function loop() {
          var el = first;
          while (el) { await place(h, el); el = next(h); }
          h.busy = false;
          h.el.classList.add('is-gone');
        })();
      });
    }
    var io = new IntersectionObserver(function (entries) {
      var fresh = entries.filter(function (en) { return en.isIntersecting; }).map(function (en) { io.unobserve(en.target); prep(en.target); return en.target; });
      if (!fresh.length) return;
      var seenAt = Date.now();
      fresh.forEach(function (el) { el._seen = seenAt; });
      fresh.sort(function (a, b) { return a.getBoundingClientRect().top - b.getBoundingClientRect().top; });
      onBuilt(function () {
        if (!(window.RealHand && window.RealHand.ready)) { fresh.forEach(settle); return; } // no stand-in hand here either
        ensure();
        Array.prototype.push.apply(queue, fresh);
        pump();
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
    waiting.forEach(function (el) { io.observe(el); });
    // Safety net: however busy or slow the hands are, a block on screen never waits more than a few seconds.
    setInterval(function () {
      var now = Date.now();
      blocks.forEach(function (el) { if (el._seen && !el._placed && !el.classList.contains('hand-held') && now - el._seen > 5000) settle(el); });
    }, 1000);
  }
  if (building && 'IntersectionObserver' in window) sectionHands();

  // ---- Phones: the page shows finished first, and my hands arrive on the visitor's first touch or scroll ----
  // They cost the first load nothing at all: not one byte is fetched until someone starts using the page.
  if (root.classList.contains('intro-lite') && !(navigator.connection && navigator.connection.saveData) && 'IntersectionObserver' in window) (function () {
    var asked = false;
    function bringHands() {
      if (asked) return;
      asked = true;
      // The hands need the full stylesheet, which phones load alongside the page.
      var sheet = $('css');
      var styled = new Promise(function (done) {
        if (!sheet || root.classList.contains('css-ready')) return done();
        sheet.addEventListener('load', function () { done(); }, { once: true });
      });
      Promise.all([loadHands(), styled]).then(function (got) {
        var RH = got[0];
        if (!RH || !RH.ready) return;
        Array.prototype.forEach.call(document.querySelectorAll('.reveal'), function (e) { e.classList.remove('reveal', 'in'); });
        sectionHands(true);
      });
    }
    ['touchstart', 'pointerdown', 'scroll'].forEach(function (ev) {
      window.addEventListener(ev, bringHands, { once: true, passive: true });
    });
  })();

  // ---- Repeat visits: keep the site's files on the device, set up once someone starts using the page ----
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    var keepFiles = function () {
      ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) { window.removeEventListener(ev, keepFiles); });
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    };
    ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, keepFiles, { passive: true }); });
  }

  // ---- Horizontal rows: drag with a mouse, plus a visible bar and arrow buttons ----
  function enhanceScroller(row, label, withBar) {
    var down = false, moved = false, startX = 0, startLeft = 0;
    row.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0 || !row.classList.contains('is-draggable')) return;
      down = true; moved = false; startX = e.clientX; startLeft = row.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) { moved = true; row.classList.add('is-dragging'); }
      if (moved) row.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      row.classList.remove('is-dragging');
      setTimeout(function () { moved = false; }, 0);
    });
    row.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    row.addEventListener('dragstart', function (e) { e.preventDefault(); });

    var ui = null, bar = null;
    if (withBar) {
      ui = document.createElement('div');
      ui.className = 'scroller';
      ui.innerHTML = '<button type="button" class="scroller__btn" data-dir="-1" aria-label="Scroll ' + label + ' left"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>' +
        '<input type="range" class="scroller__bar" min="0" max="1000" value="0" aria-label="Scroll through ' + label + '">' +
        '<button type="button" class="scroller__btn" data-dir="1" aria-label="Scroll ' + label + ' right"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>';
      row.insertAdjacentElement('afterend', ui);
      bar = ui.querySelector('.scroller__bar');
      bar.addEventListener('input', function () { row.scrollLeft = bar.value / 1000 * (row.scrollWidth - row.clientWidth); });
      Array.prototype.forEach.call(ui.querySelectorAll('.scroller__btn'), function (b) {
        b.addEventListener('click', function () { row.scrollBy({ left: +b.getAttribute('data-dir') * row.clientWidth * 0.8, behavior: reduceMotion ? 'auto' : 'smooth' }); });
      });
    }
    function sync() {
      var max = row.scrollWidth - row.clientWidth;
      // Only a real sideways carousel (overflow-x: auto/scroll, e.g. phone layout) with hidden content gets the bar.
      var ox = getComputedStyle(row).overflowX;
      var scrollable = (ox === 'auto' || ox === 'scroll') && max > 8;
      row.classList.toggle('is-draggable', scrollable);
      if (!ui) return;
      ui.hidden = !scrollable;
      if (scrollable) {
        bar.value = Math.round(row.scrollLeft / max * 1000);
        bar.style.setProperty('--fill', (row.scrollLeft / max * 100).toFixed(1) + '%');
        ui.querySelector('[data-dir="-1"]').disabled = row.scrollLeft < 4;
        ui.querySelector('[data-dir="1"]').disabled = row.scrollLeft > max - 4;
      }
    }
    row.addEventListener('scroll', sync, { passive: true });
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-device'] });
    // ResizeObserver also fires once the row is first laid out, so startup doesn't have to measure it.
    if ('ResizeObserver' in window) { if (ui) ui.hidden = true; new ResizeObserver(sync).observe(row); }
    else sync();
  }
  [['.cards', 'more projects', true], ['.medals', 'awards and badges', true], ['#filters', 'project filters', false], ['#credFilters', 'certificate filters', false]].forEach(function (d) {
    var row = document.querySelector(d[0]);
    if (row) enhanceScroller(row, d[1], d[2]);
  });

  // ---- Hero stats: count up once when they come into view ----
  var counters = Array.prototype.slice.call(document.querySelectorAll('.stage__rail .count'));
  if (counters.length && !reduceMotion && 'IntersectionObserver' in window) {
    var countIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        countIo.unobserve(en.target);
        var el = en.target, to = +el.getAttribute('data-to'), t0 = null;
        onBuilt(function () { setTimeout(function () {
          requestAnimationFrame(function step(now) {
            if (t0 === null) t0 = now;
            var p = Math.min(1, (now - t0) / 1000);
            el.textContent = ('0' + Math.round((1 - Math.pow(1 - p, 3)) * to)).slice(-2);
            if (p < 1) requestAnimationFrame(step);
          });
        }, 250); });
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { countIo.observe(c); });
  }

  // ---- Portrait: tap to switch between black-and-white and colour on touch screens ----
  var portrait = document.querySelector('.stage__portrait');
  if (portrait && window.matchMedia('(hover: none)').matches) {
    portrait.addEventListener('click', function () { portrait.classList.toggle('is-colour'); });
  }

  // ---- Hero word drifts slower than the page (depth without 3D) ----
  var stageWord = document.querySelector('.stage__word');
  if (stageWord && !reduceMotion) {
    var wordTicking = false;
    window.addEventListener('scroll', function () {
      if (wordTicking) return;
      wordTicking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < window.innerHeight * 1.2) stageWord.style.setProperty('--py', (y * 0.3).toFixed(1) + 'px');
        wordTicking = false;
      });
    }, { passive: true });
  }

  // ---- Theme toggle (remembers the choice; falls back to the OS setting) ----
  var themeBtn = $('themeToggle');
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function currentTheme() {
    return root.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  function syncTheme() {
    var dark = currentTheme() === 'dark';
    if (themeMeta) themeMeta.setAttribute('content', dark ? '#0b0d12' : '#fbf8f3');
    if (themeBtn) themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }
  syncTheme();
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.classList.add('theme-anim');
    root.setAttribute('data-theme', next);
    syncTheme();
    setTimeout(function () { root.classList.remove('theme-anim'); }, 450);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  // ---- Mobile menu (keyboard and screen-reader friendly) ----
  var menuBtn = $('menuToggle');
  var links = $('navLinks');
  function menuOpen() { return links && links.classList.contains('open'); }
  function setMenu(open, returnFocus) {
    if (!links || !menuBtn) return;
    links.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) { var first = links.querySelector('a'); if (first) first.focus(); }
    else if (returnFocus) menuBtn.focus();
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(!menuOpen(), false); });
  if (links) links.addEventListener('click', function (e) { if (e.target.closest('a') && menuOpen()) setMenu(false, false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen()) setMenu(false, true); });
  document.addEventListener('click', function (e) {
    if (menuOpen() && !e.target.closest('#navLinks') && !e.target.closest('#menuToggle')) setMenu(false, false);
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 960 && menuOpen()) setMenu(false, false); });

  // ---- Brand ("S" + name) jumps to the very top ----
  var brand = $('brandHome');
  if (brand) brand.addEventListener('click', function (e) { e.preventDefault(); setMenu(false, false); scrollToTop(); });

  // ---- Scroll effects: progress bar, nav shadow, back-to-top button ----
  var nav = document.querySelector('.nav');
  var progress = $('progress');
  var toTop = $('toTop');
  var toTopBar = $('toTopBar');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var pct = max > 0 ? Math.min(1, y / max) : 0;
    if (progress) progress.style.transform = 'scaleX(' + pct + ')';
    if (toTopBar) toTopBar.style.strokeDashoffset = String(100 - pct * 100);
    if (nav) nav.classList.toggle('scrolled', y > 8);
    // Show only once the whole first screen has scrolled out of view.
    if (toTop) toTop.classList.toggle('show', y >= window.innerHeight);
    ticking = false;
  }
  // Reads the page height inside an animation frame, so the browser never has to work out the layout twice.
  var queueScroll = function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  };
  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', queueScroll);
  requestAnimationFrame(onScroll);
  if (toTop) toTop.addEventListener('click', scrollToTop);

  // ---- Highlight the nav link for the section in view ----
  if (links && 'IntersectionObserver' in window) {
    var navMap = {};
    links.querySelectorAll('a[href^="#"]').forEach(function (a) { navMap[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var a = navMap[entry.target.id];
        if (!a) return;
        if (entry.isIntersecting) {
          Object.keys(navMap).forEach(function (k) { navMap[k].classList.remove('active'); navMap[k].removeAttribute('aria-current'); });
          a.classList.add('active');
          a.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(navMap).forEach(function (id) { var s = $(id); if (s) spy.observe(s); });
  }

  // ---- Toast + copy email ----
  var toast = $('toast');
  var toastTimer;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 3500);
  }
  var copyBtn = $('copyEmail');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    var email = copyBtn.getAttribute('data-email');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(function () { showToast('Email copied'); }, function () { showToast(email); });
    } else { showToast(email); }
  });

  // ---- Project filters ----
  var filterBar = $('filters');
  if (filterBar) {
    var items = Array.prototype.slice.call(document.querySelectorAll('#work [data-cats]'));
    var buttons = Array.prototype.slice.call(filterBar.querySelectorAll('.filter'));
    var status = $('filterStatus');
    var empty = $('filterEmpty');
    var groups = { cases: document.querySelector('#work .cases'), more: document.querySelector('#work .cards') };
    function matches(item, cat) { return cat === 'all' || (' ' + item.getAttribute('data-cats') + ' ').indexOf(' ' + cat + ' ') > -1; }
    buttons.forEach(function (b) {
      var cat = b.getAttribute('data-filter');
      var n = items.filter(function (it) { return matches(it, cat); }).length;
      var badge = b.querySelector('.filter__n');
      if (badge) {
        badge.textContent = n;
        var sr = document.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = n === 1 ? ' project' : ' projects';
        badge.after(sr);
      }
      if (n === 0) b.hidden = true; // never offer a filter that returns nothing
    });
    function apply(cat, label) {
      var shown = 0;
      items.forEach(function (it) {
        var on = matches(it, cat);
        var wasHidden = it.classList.contains('is-hidden');
        it.classList.toggle('is-hidden', !on);
        if (on) {
          shown++;
          if (wasHidden && !reduceMotion) { it.classList.remove('fade-in'); void it.offsetWidth; it.classList.add('fade-in'); }
        }
      });
      Object.keys(groups).forEach(function (g) {
        var box = groups[g];
        var title = document.querySelector('#work .group-title[data-group="' + g + '"]');
        var any = box && box.querySelector('[data-cats]:not(.is-hidden)');
        if (box) box.classList.toggle('is-hidden', !any);
        if (title) title.classList.toggle('is-hidden', !any);
      });
      if (empty) empty.hidden = shown > 0;
      if (status) status.textContent = 'Showing ' + shown + (shown === 1 ? ' project' : ' projects') + (cat === 'all' ? '' : ' in ' + label);
    }
    function choose(b, fromUrl) {
      var cat = b.getAttribute('data-filter');
      buttons.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      apply(cat, b.firstChild.textContent.trim());
      if (fromUrl) return;
      // Keep the choice in the address bar so the filtered view can be shared or restored.
      try {
        var url = new URL(location.href);
        if (cat === 'all') url.searchParams.delete('filter'); else url.searchParams.set('filter', cat);
        history.replaceState(null, '', url.pathname + url.search + url.hash);
      } catch (e) {}
    }
    buttons.forEach(function (b) { b.addEventListener('click', function () { choose(b); }); });
    try {
      var wanted = new URLSearchParams(location.search).get('filter');
      var match = wanted && buttons.filter(function (b) { return !b.hidden && b.getAttribute('data-filter') === wanted; })[0];
      if (match) choose(match, true);
    } catch (e) {}
    filterBar.hidden = false; // filters only appear when JavaScript can run them
  }

  // ---- Certification filters ----
  var credBar = $('credFilters');
  if (credBar) {
    var creds = Array.prototype.slice.call(document.querySelectorAll('.creds > .cred'));
    var credBtns = Array.prototype.slice.call(credBar.querySelectorAll('.filter'));
    var credStatus = $('credStatus');
    credBtns.forEach(function (b) {
      var cat = b.getAttribute('data-filter');
      var n = creds.filter(function (c) { return cat === 'all' || c.getAttribute('data-cat') === cat; }).length;
      var badge = document.createElement('span');
      badge.className = 'filter__n';
      badge.textContent = n;
      b.appendChild(document.createTextNode(' '));
      b.appendChild(badge);
      var sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = n === 1 ? ' certificate' : ' certificates';
      b.appendChild(sr);
      b.addEventListener('click', function () {
        var shown = 0;
        credBtns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        creds.forEach(function (c) {
          var on = cat === 'all' || c.getAttribute('data-cat') === cat;
          var was = c.classList.contains('is-hidden');
          c.classList.toggle('is-hidden', !on);
          if (on) {
            shown++;
            if (was && !reduceMotion) { c.classList.remove('fade-in'); void c.offsetWidth; c.classList.add('fade-in'); }
          }
        });
        collapse(cat === 'all' && !expanded);
        if (credStatus) credStatus.textContent = 'Showing ' + shown + (shown === 1 ? ' certificate' : ' certificates') + (cat === 'all' ? '' : ' in ' + b.firstChild.textContent.trim());
      });
    });
    credBar.hidden = false;

    // Show the first 12 under "All"; the rest behind a button.
    var LIMIT = 6, expanded = false, moreBtn = $('credMore');
    function collapse(on) {
      creds.forEach(function (c, i) { c.classList.toggle('is-collapsed', on && i >= LIMIT); });
      if (moreBtn) moreBtn.hidden = !on;
    }
    if (moreBtn && creds.length > LIMIT) {
      moreBtn.textContent = 'Show all ' + creds.length + ' certificates';
      moreBtn.addEventListener('click', function () {
        expanded = true;
        collapse(false);
        var next = creds[LIMIT];
        if (next) { var f = next.querySelector('a, button'); if (f) f.focus({ preventScroll: true }); }
      });
      collapse(true);
    }
    // A link to one certificate has to work even when that certificate is folded away or filtered out.
    var showCred = function (id) {
      var c = document.getElementById(id);
      if (!c || !c.classList.contains('cred')) return;
      if (c.classList.contains('is-hidden')) { var all = document.querySelector('#credFilters [data-filter="all"]'); if (all) all.click(); }
      if (c.classList.contains('is-collapsed') && moreBtn) moreBtn.click();
    };
    window.__showCred = showCred;
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#cert-"]');
      if (a) showCred(a.getAttribute('href').slice(1));
    }, true);
    window.addEventListener('hashchange', function () {
      var id = hashId(location.hash), c = document.getElementById(id);
      if (!c || !c.classList.contains('cred')) return;
      showCred(id);
      c.scrollIntoView({ behavior: 'instant' });
    });
    if (!building && /^#cert-/.test(location.hash)) {
      showCred(hashId(location.hash));
      var linked = document.getElementById(hashId(location.hash));
      if (linked) setTimeout(function () { linked.scrollIntoView({ behavior: 'instant' }); }, 120);
    }
  }

  // ---- Contact form: validated, consented, sent in-page with an honest result ----
  var form = $('contactForm');
  if (form) {
    var note = $('formNote');
    var submit = form.querySelector('.form__submit');
    var label = form.querySelector('.form__label');
    var w3fKey = form.getAttribute('data-w3f') || '';
    var endpoint = w3fKey ? 'https://api.web3forms.com/submit' : form.getAttribute('data-endpoint');
    var fallbackEmail = form.getAttribute('data-fallback');
    var fields = {
      name: { el: $('f-name'), err: $('f-name-err'), check: function (v) { return v.trim() ? '' : 'Please enter your name.'; } },
      email: { el: $('f-email'), err: $('f-email-err'), check: function (v, el) {
        if (!v.trim()) return 'Please enter your email address.';
        return (el.validity && el.validity.typeMismatch) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? 'Please enter a valid email address, like name@example.com.' : '';
      } },
      message: { el: $('f-msg'), err: $('f-msg-err'), check: function (v) {
        v = v.trim();
        if (!v) return 'Please write a message.';
        return v.length < 10 ? 'Please write a little more (at least 10 characters).' : '';
      } },
      consent: { el: $('f-consent'), err: $('f-consent-err'), check: function (v, el) {
        return el.checked ? '' : 'Please tick the box so I can use your details to reply.';
      } }
    };
    function showError(f, msg) {
      f.el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      f.err.textContent = msg;
      f.err.hidden = !msg;
    }
    function validate() {
      var firstBad = null;
      Object.keys(fields).forEach(function (k) {
        var f = fields[k];
        var msg = f.check(f.el.value, f.el);
        showError(f, msg);
        if (msg && !firstBad) firstBad = f.el;
      });
      return firstBad;
    }
    Object.keys(fields).forEach(function (k) {
      var f = fields[k];
      var evt = f.el.type === 'checkbox' ? 'change' : 'blur';
      f.el.addEventListener(evt, function () { if (f.el.getAttribute('aria-invalid') === 'true' || f.el.value) showError(f, f.check(f.el.value, f.el)); });
    });
    function setNote(text, kind, withFallback) {
      note.textContent = text;
      note.className = 'form__note' + (kind ? ' is-' + kind : '');
      if (withFallback && fallbackEmail) {
        // Nothing typed is lost: send the same message from the visitor's own email app, or copy it.
        var from = fields.email.el.value.trim();
        var body = fields.message.el.value.trim() + '\n\n— ' + fields.name.el.value.trim() + (from ? ' (' + from + ')' : '');
        var row = document.createElement('span');
        row.className = 'form__fallback';
        var a = document.createElement('a');
        a.className = 'btn btn--primary btn--sm';
        a.href = 'mailto:' + fallbackEmail + '?subject=' + encodeURIComponent('Portfolio: ' + topicValue()) + '&body=' + encodeURIComponent(body);
        a.textContent = 'Send from my email app';
        var c = document.createElement('button');
        c.type = 'button';
        c.className = 'btn btn--ghost btn--sm';
        c.textContent = 'Copy message';
        c.addEventListener('click', function () {
          if (!navigator.clipboard) return;
          navigator.clipboard.writeText('To: ' + fallbackEmail + '\n\n' + body).then(function () {
            c.textContent = 'Copied ✓';
            setTimeout(function () { c.textContent = 'Copy message'; }, 2000);
          }, function () {});
        });
        row.appendChild(a);
        row.appendChild(c);
        note.appendChild(document.createTextNode(' Your message is still here, so you can send it another way:'));
        note.appendChild(row);
      }
    }
    function sending(on) {
      form.classList.toggle('is-sending', on);
      submit.disabled = on;
      submit.setAttribute('aria-busy', String(on));
      label.textContent = on ? 'Sending…' : 'Send message';
    }
    // Web3Forms needs an hCaptcha token with each message. The widget loads only once someone starts
    // using the form, so people who just read the site never connect to hCaptcha.
    var captchaBox = $('f-captcha');
    var captchaId = null, captchaState = w3fKey && captchaBox ? 'idle' : 'off';
    function loadCaptcha() {
      if (captchaState !== 'idle') return;
      captchaState = 'loading';
      captchaBox.parentNode.hidden = false;
      window.onCaptchaReady = function () {
        var theme = root.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        captchaId = window.hcaptcha.render(captchaBox, {
          sitekey: '50b2fe65-b00b-4b9e-ad62-3ba471098be2', // Web3Forms' shared key for free plans
          theme: theme,
          size: captchaBox.clientWidth < 304 ? 'compact' : 'normal'
        });
        captchaState = 'ready';
      };
      var s = document.createElement('script');
      s.src = 'https://js.hcaptcha.com/1/api.js?render=explicit&recaptchacompat=off&onload=onCaptchaReady';
      s.async = true;
      s.onerror = function () { captchaState = 'failed'; captchaBox.parentNode.hidden = true; };
      document.head.appendChild(s);
    }
    form.addEventListener('focusin', loadCaptcha);
    form.addEventListener('pointerdown', loadCaptcha);
    function topicValue() { var t = form.querySelector('input[name="topic"]:checked'); return t ? t.value : 'General enquiry'; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = validate();
      if (bad) { setNote('Please fix the highlighted fields.', 'err', false); bad.focus(); return; }
      if ($('f-honey').value) { setNote('Your message could not be sent.', 'err', true); return; }
      if (!window.fetch || !endpoint) { form.submit(); return; } // plain POST fallback
      var token = '';
      if (captchaState !== 'off') {
        token = captchaState === 'ready' ? window.hcaptcha.getResponse(captchaId) : '';
        if (!token) {
          if (captchaState === 'failed') { setNote('The spam check didn’t load, so the form can’t send right now.', 'err', true); return; }
          loadCaptcha();
          setNote('Please complete the “I am human” check above the button.', 'err', false);
          return;
        }
      }
      sending(true);
      setNote('Sending your message…', '', false);
      var payload = {
        name: fields.name.el.value.trim(),
        email: fields.email.el.value.trim(),
        message: fields.message.el.value.trim(),
        consent: 'Agreed to the use of this information to respond to the enquiry',
        topic: topicValue(),
        _subject: 'Portfolio: ' + topicValue(),
        _template: 'table',
        _honey: ''
      };
      if (w3fKey) payload = { access_key: w3fKey, name: payload.name, email: payload.email, message: payload.message, topic: payload.topic, consent: payload.consent, subject: payload._subject, from_name: 'Portfolio contact form', botcheck: '' };
      if (token) payload['h-captcha-response'] = token;
      var controller = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (controller) controller.abort(); }, 9000);
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller ? controller.signal : undefined
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) { return { ok: res.ok, data: data }; });
      }).then(function (r) {
        var success = r.ok && (r.data.success === true || r.data.success === 'true');
        if (success) {
          setNote('Thanks, ' + payload.name + ' — your message was sent. I’ll reply to ' + payload.email + '.', 'ok', false);
          (function () {
            var r = submit.getBoundingClientRect(), tone = sideTone(r);
            var hd = fxHand(tone); if (!hd) return;
            hd.move(r.right + 60, r.top + 20, 0); hd.move(r.right + 40, r.top - 10, 360);
            setTimeout(function () { hd.wave(1000); }, 380);
            setTimeout(function () { hd.move(tone === 'design' ? window.innerWidth + 140 : -140, r.top - 120, 560); }, 1500);
            setTimeout(function () { hd.el.remove(); }, 2100);
          })();
          form.reset();
          Object.keys(fields).forEach(function (k) { fields[k].el.removeAttribute('aria-invalid'); });
        } else {
          setNote('Sorry, the message service didn’t accept it' + (r.data.message ? ' (' + String(r.data.message).slice(0, 140) + ')' : '') + '.', 'err', true);
        }
      }).catch(function () {
        setNote('The message service isn’t reachable right now.', 'err', true);
      }).then(function () {
        clearTimeout(timer);
        sending(false);
        if (token) window.hcaptcha.reset(captchaId); // each token works only once
      });
    });
  }

  // ---- Hero entrance: hand transforms back once the animation ends ----
  document.querySelectorAll('.enter').forEach(function (el) {
    el.addEventListener('animationend', function done(e) {
      if (e.target !== el) return;
      el.classList.remove('enter');
      el.removeEventListener('animationend', done);
    });
  });

  // ---- Reveal on scroll (staggered) and eyebrow lines ----
  if (building) {
    Array.prototype.forEach.call(document.querySelectorAll('.reveal'), function (e) { e.classList.remove('reveal'); });
  } else {
    document.querySelectorAll('.timeline.reveal').forEach(function (list) {
      list.classList.remove('reveal');
      Array.prototype.forEach.call(list.children, function (li) { li.classList.add('reveal'); });
    });
    document.querySelectorAll('#about .section__head, #experience .section__head, #credentials .section__head').forEach(function (h) { h.classList.add('reveal'); });
  }
  var revealItems = document.querySelectorAll('.reveal');
  var eyebrows = document.querySelectorAll('.eyebrow');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.filter(function (en) { return en.isIntersecting; }).forEach(function (entry, i) {
        var el = entry.target;
        el.style.setProperty('--d', (i * 0.07).toFixed(2) + 's');
        el.classList.add('in');
        io.unobserve(el);
        setTimeout(function () { el.classList.remove('reveal', 'in'); el.style.removeProperty('--d'); }, 1100 + i * 70);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    revealItems.forEach(function (el) { io.observe(el); });
    var eo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('drawn'); eo.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    eyebrows.forEach(function (el) { eo.observe(el); });
  } else {
    revealItems.forEach(function (el) { el.classList.remove('reveal'); });
    eyebrows.forEach(function (el) { el.classList.add('drawn'); });
  }

  // ---- Gentle hover lift on cards ----
  document.querySelectorAll('.case, .card, .timeline > li, .facts > div, .certs, .email-box, .cred-rows').forEach(function (el) { el.classList.add('lift'); });

  // ---- Gallery viewer: arrows, keyboard, swipe and a counter across a section's images ----
  var box = $('lightbox');
  if (box && typeof box.showModal === 'function') {
    var boxImg = $('lightboxImg'), boxCap = $('lightboxCap'), opener = null, group = [], gi = 0, swiped = false, baseScale = 1;
    var chev = function (d) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (d < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7') + '"/></svg>'; };
    var prevB = document.createElement('button'), nextB = document.createElement('button'), count = document.createElement('p');
    prevB.type = nextB.type = 'button';
    prevB.className = 'lightbox__nav lightbox__nav--prev'; prevB.setAttribute('aria-label', 'Previous image'); prevB.innerHTML = chev(-1);
    nextB.className = 'lightbox__nav lightbox__nav--next'; nextB.setAttribute('aria-label', 'Next image'); nextB.innerHTML = chev(1);
    count.className = 'lightbox__count mono'; count.setAttribute('aria-live', 'polite');
    box.appendChild(prevB); box.appendChild(nextB); box.appendChild(count);
    // Full demos open here with player controls; a[data-play] falls back to the plain file without JS.
    var boxVid = null;
    function stopVideo() {
      if (!boxVid) return;
      boxVid.pause(); boxVid.removeAttribute('src'); boxVid.load(); boxVid.remove(); boxVid = null;
      boxImg.hidden = false;
    }
    function playVideo(a) {
      opener = a; group = [a]; gi = 0;
      stopVideo();
      boxVid = document.createElement('video');
      boxVid.controls = true; boxVid.playsInline = true; boxVid.muted = true; boxVid.preload = 'metadata';
      boxVid.src = a.getAttribute('href');
      boxImg.hidden = true;
      boxImg.parentNode.insertBefore(boxVid, boxImg);
      boxCap.textContent = a.getAttribute('data-caption') || a.textContent;
      count.textContent = '';
      prevB.hidden = nextB.hidden = true;
      if (!box.open) box.showModal();
      $('lightboxClose').focus();
      if (!reduceMotion) boxVid.play().catch(function () {}); // started inside the tap, as iPhones require
    }
    function show(i) {
      gi = (i + group.length) % group.length;
      var a = group[gi], img = a.querySelector('img');
      boxImg.src = a.getAttribute('href');
      boxImg.alt = (img && img.alt) || 'Enlarged view of the selected image';
      boxCap.textContent = a.getAttribute('data-caption') || (img ? img.alt : '');
      count.textContent = group.length > 1 ? (gi + 1) + ' / ' + group.length : '';
      prevB.hidden = nextB.hidden = group.length < 2;
      [gi + 1, gi - 1].forEach(function (j) { var n = group[(j + group.length) % group.length]; if (n) (new Image()).src = n.getAttribute('href'); });
    }
    function openFrom(a) {
      var scope = a.closest('section') || document;
      group = Array.prototype.slice.call(scope.querySelectorAll('a.zoom')).filter(function (z) { return !z.closest('.is-hidden'); });
      if (group.indexOf(a) < 0) group = [a];
      opener = a;
      baseScale = window.visualViewport ? visualViewport.scale : 1;
      show(group.indexOf(a));
      if (!box.open) box.showModal();
      $('lightboxClose').focus();
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a.zoom, a[data-play]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      if (a.hasAttribute('data-play')) playVideo(a); else openFrom(a);
    });
    prevB.addEventListener('click', function () { show(gi - 1); });
    nextB.addEventListener('click', function () { show(gi + 1); });
    box.addEventListener('keydown', function (e) {
      if (boxVid) return; // arrow keys belong to the video player
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(gi - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(gi + 1); }
    });
    var sx = null;
    function zoomed() { return window.visualViewport && visualViewport.scale > baseScale * 1.1; } // a pinched photo pans, it doesn't swipe
    box.addEventListener('pointerdown', function (e) { sx = zoomed() ? null : e.clientX; });
    box.addEventListener('pointercancel', function () { sx = null; });
    box.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 50 && group.length > 1) { swiped = true; show(gi + (dx < 0 ? 1 : -1)); setTimeout(function () { swiped = false; }, 0); }
    });
    $('lightboxClose').addEventListener('click', function () { box.close(); });
    box.addEventListener('click', function (e) { if (e.target === box && !swiped) box.close(); });
    box.addEventListener('close', function () { stopVideo(); boxImg.removeAttribute('src'); if (opener) opener.focus(); });
  }

  // ---- Live GitHub data on project cards (public API, cached for an hour) ----
  if ('fetch' in window && 'IntersectionObserver' in window) {
    var ago = function (iso) {
      var s = (Date.now() - new Date(iso).getTime()) / 1000;
      var rtf = window.Intl && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' }) : null;
      var units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
      for (var i = 0; i < units.length; i++) if (s >= units[i][1]) { var n = Math.floor(s / units[i][1]); return rtf ? rtf.format(-n, units[i][0]) : n + ' ' + units[i][0] + 's ago'; }
      return 'just now';
    };
    // Each card gets its GitHub line right away (repo name), so nothing below ever shifts when live data arrives.
    // All of Somya's public repos in a single request, cached for an hour (GitHub allows 60 requests/hour per visitor).
    var ghAll = null;
    // GitHub gets eight seconds to answer, so "Checking GitHub…" can never stay on screen.
    function ghGet(url) {
      var ctl = window.AbortController ? new AbortController() : null;
      if (ctl) setTimeout(function () { ctl.abort(); }, 8000);
      return fetch(url, { headers: { Accept: 'application/vnd.github+json' }, signal: ctl ? ctl.signal : undefined });
    }
    function ghRepos() {
      if (ghAll) return ghAll;
      var c = null;
      try { c = JSON.parse(localStorage.getItem('gh:all') || 'null'); } catch (e) {}
      if (c && Date.now() - c.t < 3600000) return (ghAll = Promise.resolve(c.d));
      ghAll = ghGet('https://api.github.com/users/somyaranjansahoo6422/repos?per_page=100&sort=pushed')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (list) {
          if (!list) return null;
          var d = list.map(function (x) { return { full: x.full_name.toLowerCase(), name: x.name, fork: x.fork, lang: x.language, stars: x.stargazers_count, pushed: x.pushed_at, url: x.html_url }; });
          try { localStorage.setItem('gh:all', JSON.stringify({ t: Date.now(), d: d })); } catch (e) {}
          return d;
        }).catch(function () { return null; });
      return ghAll;
    }
    window.__ghRepos = ghRepos;
    var GHICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.3 11.3 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5z"/></svg>';
    var ghCards = [];
    Array.prototype.forEach.call(document.querySelectorAll('#work [data-cats]'), function (it) {
      if (it.querySelector('.mini')) return;
      var m = Array.prototype.slice.call(it.querySelectorAll('a[href*="github.com/"]')).map(function (a) { return a.href.match(/github\.com\/([^/?#]+)\/([^/?#]+)/); }).filter(Boolean)[0];
      if (!m) return;
      var repo = m[1] + '/' + m[2];
      var p = document.createElement('a');
      p.className = 'gh'; p.href = 'https://github.com/' + repo; p.target = '_blank'; p.rel = 'noopener noreferrer';
      p.innerHTML = GHICON + '<span class="gh__repo"></span>';
      p.querySelector('.gh__repo').textContent = repo;
      var where = it.querySelector('.case__links') || it.querySelector(':scope > .link:last-of-type');
      if (where) where.insertAdjacentElement('beforebegin', p); else it.appendChild(p);
      it._gh = { repo: repo, el: p };
      ghCards.push(it);
    });
    var ghIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        ghIo.unobserve(en.target);
        var repo = en.target._gh.repo, p = en.target._gh.el, key = 'gh:' + repo, cached = null;
        try { cached = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
        var mine = /^somyaranjansahoo6422\//i.test(repo);
        var got = mine ? ghRepos().then(function (list) { var r = (list || []).filter(function (x) { return x.full === repo.toLowerCase(); })[0]; return r ? { lang: r.lang, stars: r.stars, pushed: r.pushed, url: r.url } : null; })
          : cached && Date.now() - cached.t < 3600000 ? Promise.resolve(cached.d)
          : ghGet('https://api.github.com/repos/' + repo)
              .then(function (r) { return r.ok ? r.json() : null; })
              .then(function (d) {
                if (!d) return null;
                var slim = { lang: d.language, stars: d.stargazers_count, pushed: d.pushed_at, url: d.html_url };
                try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: slim })); } catch (e) {}
                return slim;
              });
        got.then(function (d) {
          if (!d) return;
          var parts = [];
          if (d.lang) parts.push('<span class="gh__lang"><i></i>' + String(d.lang).replace(/[<>&]/g, '') + '</span>');
          parts.push('<span>★ ' + (+d.stars || 0) + '</span>');
          parts.push('<span>updated ' + ago(d.pushed) + '</span>');
          p.innerHTML = GHICON + parts.join('<b aria-hidden="true">·</b>') + '<span class="gh__live" aria-hidden="true">live</span>';
          p.setAttribute('aria-label', 'GitHub: ' + repo + (d.lang ? ', mostly ' + d.lang : '') + ', ' + d.stars + ' stars, updated ' + ago(d.pushed));
        }).catch(function () {});
      });
    }, { rootMargin: '200px 0px' });
    ghCards.forEach(function (c) { ghIo.observe(c); });
  }

  // ---- Interactive terminal (opened from the "$ whoami" tag or the palette) ----
  var term = document.createElement('dialog');
  term.className = 'term'; term.id = 'term'; term.setAttribute('aria-label', 'Interactive terminal');
  term.innerHTML = '<div class="term__bar"><span class="codecard__dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="mono">somya@portfolio: ~</span>' +
    '<button type="button" class="term__close" aria-label="Close terminal"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
    '<div class="term__out mono" role="log" aria-live="polite"></div>' +
    '<form class="term__form"><label class="sr-only" for="termIn">Type a command</label><span class="term__ps mono" aria-hidden="true">somya@portfolio:~$</span>' +
    '<input id="termIn" class="mono" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="send"></form>';
  document.body.appendChild(term);
  var tOut = term.querySelector('.term__out'), tIn = $('termIn'), tHist = [], tPos = 0, termOpener = null;
  function tLine(text, cls) { var d = document.createElement('div'); if (cls) d.className = cls; d.textContent = text; tOut.appendChild(d); tOut.scrollTop = tOut.scrollHeight; return d; }
  function tLink(label, href) { var d = document.createElement('div'); var a = document.createElement('a'); a.href = href; a.textContent = label; if (/^http/.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } d.appendChild(a); tOut.appendChild(d); }
  function txt(sel) { var e = document.querySelector(sel); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function goTo(id) { term.close(); var s = $(id); if (s) setTimeout(function () { landOn(s); }, 60); }
  var projs = function () { return Array.prototype.slice.call(document.querySelectorAll('#work [data-cats]')); };
  var CMDS = {
    help: function () { tLine('Commands:'); [['whoami', 'who I am'], ['about', 'the short story'], ['projects', 'list my projects'], ['open <n>', 'jump to project n'], ['skills', 'what I work with'], ['experience', 'internships'], ['education', 'where I studied'], ['certs', 'certificates & badges'], ['resume [placement]', 'download my resume'], ['contact', 'how to reach me'], ['socials', 'profiles'], ['ls / cd <section>', 'browse sections'], ['theme [light|dark]', 'switch theme'], ['clear', 'clear the screen'], ['replay', 'replay the intro'], ['exit', 'close']].forEach(function (c) { tLine('  ' + (c[0] + '                  ').slice(0, 19) + c[1]); }); },
    whoami: function () { tLine('Somya Ranjan Sahoo (Sonu)'); tLine('Aspiring data analyst · Software developer · Python · SQL · Excel'); tLine('B.Tech CSE, GITA Autonomous College ’29 · Team ASTRA-X'); },
    about: function () { tLine(txt('#about .prose > p')); },
    projects: function () { projs().forEach(function (p, i) { tLine(('0' + (i + 1)).slice(-2) + '  ' + txt('#' + p.id + ' h3')); }); tLine('Type "open <number>" to jump to one.', 'term__dim'); },
    open: function (arg) {
      var list = projs(), n = parseInt(arg, 10), p = n ? list[n - 1] : list.filter(function (x) { return arg && x.textContent.toLowerCase().indexOf(arg.toLowerCase()) > -1; })[0];
      if (!p) return tLine('No such project. Try "projects".', 'term__err');
      tLine('Opening ' + txt('#' + p.id + ' h3') + '…'); goTo(p.id);
    },
    skills: function () { Array.prototype.forEach.call(document.querySelectorAll('.skill-group'), function (g) { tLine(g.querySelector('h3').textContent + ': ' + Array.prototype.map.call(g.querySelectorAll('li'), function (l) { return l.textContent; }).join(', ')); }); },
    experience: function () { Array.prototype.forEach.call(document.querySelectorAll('#experience .wrap:first-child .timeline > li'), function (li) { tLine(li.querySelector('h3').textContent + ' — ' + li.querySelector('.org').textContent); }); },
    education: function () { Array.prototype.forEach.call(document.querySelectorAll('.edu .timeline > li h3'), function (h) { var org = h.parentElement.querySelector('.org'); tLine(h.textContent + (org ? ' — ' + org.textContent : '')); }); },
    certs: function () { tLine(document.querySelectorAll('.cred').length + ' certificates · ' + document.querySelectorAll('.medal').length + ' awards & badges'); Array.prototype.slice.call(document.querySelectorAll('.medal')).slice(0, 6).forEach(function (m) { tLine('  ★ ' + m.querySelector('.medal__big').textContent + ' — ' + m.querySelector('.medal__what').textContent); }); tLine('Type "cd credentials" to see them all.', 'term__dim'); },
    resume: function (arg) { var pl = /^pl|^place|^campus/i.test(arg || ''); tLine('Downloading resume' + (pl ? ' (placement format)…' : '…')); var a = document.createElement('a'); a.href = pl ? '/assets/Somya-Ranjan-Sahoo-Resume-Placement.pdf' : '/assets/Somya-Ranjan-Sahoo-Resume.pdf'; a.download = ''; document.body.appendChild(a); a.click(); a.remove(); },
    contact: function () { tLink('6422somyaranjansahoo@gmail.com', 'mailto:6422somyaranjansahoo@gmail.com'); tLine('Or type "hire" to jump straight to the form.', 'term__dim'); },
    socials: function () { tLink('github.com/somyaranjansahoo6422', 'https://github.com/somyaranjansahoo6422'); tLink('linkedin.com/in/somya-ranjan-sahoo-109599312', 'https://www.linkedin.com/in/somya-ranjan-sahoo-109599312/'); tLink('instagram.com/somya_ranjan__22', 'https://www.instagram.com/somya_ranjan__22/'); },
    ls: function () { tLine('work/  data/  about/  experience/  credentials/  resume/  contact/'); },
    cd: function (arg) { var id = (arg || '').replace(/\/$/, '').toLowerCase(); if (!$(id) || !/^(work|data|about|experience|credentials|resume|contact)$/.test(id)) return tLine('cd: no such section: ' + (arg || ''), 'term__err'); goTo(id); },
    theme: function (arg) { var cur = root.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); if (!arg || arg !== cur) $('themeToggle').click(); tLine('Theme: ' + (root.getAttribute('data-theme') || cur)); },
    hire: function () { tLine('Permission granted ✓ Taking you to the contact form…', 'term__ok'); goTo('contact'); setTimeout(function () { var f = $('f-name'); if (f) f.focus({ preventScroll: true }); }, 700); },
    sudo: function (arg) { if (/hire/.test(arg || '')) return CMDS.hire(); tLine('Nice try. Only Somya has sudo here.', 'term__err'); },
    date: function () { tLine(new Date().toString()); },
    echo: function (arg) { tLine(arg || ''); },
    clear: function () { tOut.textContent = ''; },
    exit: function () { term.close(); }
  };
  // A mistyped command still runs: the closest command wins if it is only a slip away.
  function nearCommand(w) {
    if (w.length < 3) return null;
    var best = null, bestD = w.length <= 4 ? 2 : 3;
    Object.keys(CMDS).forEach(function (c) {
      var i, j, row = [], prev;
      for (j = 0; j <= c.length; j++) row[j] = j;
      for (i = 1; i <= w.length; i++) { prev = row.slice(); row[0] = i; for (j = 1; j <= c.length; j++) row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (w[i - 1] === c[j - 1] ? 0 : 1)); }
      var d = w.split('').sort().join('') === c.split('').sort().join('') ? 1 : row[c.length];
      if (d < bestD) { bestD = d; best = c; }
    });
    return best;
  }
  // Anything else is a question: the same brain as the "Ask me anything" chat answers it here.
  var tState = {};
  function tAsk(q) {
    loadAsk().then(function (A) {
      if (!A) return tLine('I couldn’t load that just now. Type "help" for the commands, or "contact" to reach me.', 'term__dim');
      var r = A.reply(q, tState);
      if (r.read) tLine('(read as: ' + r.read + ')', 'term__dim');
      tLine(r.text);
      if (r.links && r.links.length) {
        var row = tLine('', 'term__links');
        r.links.forEach(function (l) {
          var a = document.createElement('a');
          a.href = l.href; a.textContent = l.label + (l.ext ? ' ↗' : ' →');
          if (l.ext) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } else a.addEventListener('click', function () { term.close(); });
          row.appendChild(a);
        });
      }
      if (r.next && r.next.length) tLine('try: ' + r.next.slice(0, 2).join('  ·  '), 'term__dim');
      tOut.scrollTop = tOut.scrollHeight;
    });
  }
  function run(line) {
    var parts = line.trim().split(/\s+/), cmd = (parts.shift() || '').toLowerCase(), arg = parts.join(' ');
    tLine('somya@portfolio:~$ ' + line, 'term__cmd');
    if (!cmd) return;
    var words = line.trim().split(/\s+/).length;
    if (CMDS[cmd] && words <= 2 && !/\?\s*$/.test(line)) return CMDS[cmd](arg);
    var near = words === 1 ? nearCommand(cmd) : null;
    if (near) { tLine('(you meant "' + near + '")', 'term__dim'); return CMDS[near](arg); }
    tAsk(line);
  }
  term.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = tIn.value; tIn.value = '';
    if (v.trim()) { tHist.push(v); tPos = tHist.length; }
    run(v);
  });
  tIn.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp' && tHist.length) { e.preventDefault(); tPos = Math.max(0, tPos - 1); tIn.value = tHist[tPos]; }
    else if (e.key === 'ArrowDown' && tHist.length) { e.preventDefault(); tPos = Math.min(tHist.length, tPos + 1); tIn.value = tHist[tPos] || ''; }
    else if (e.key === 'Tab') {
      var m = Object.keys(CMDS).filter(function (c) { return c.indexOf(tIn.value.trim().toLowerCase()) === 0; });
      if (m.length === 1 && tIn.value.trim()) { e.preventDefault(); tIn.value = m[0] + ' '; }
    }
  });
  term.querySelector('.term__close').addEventListener('click', function () { term.close(); });
  term.addEventListener('click', function (e) { if (e.target === term) term.close(); });
  term.addEventListener('close', function () { if (termOpener) termOpener.focus(); });
  function openTerminal(from) {
    termOpener = from || document.activeElement;
    if (!tOut.childNodes.length) { tLine('Welcome! This terminal runs on the portfolio itself.', 'term__ok'); tLine('Ask me anything in plain words, or type "help" for the commands.', 'term__dim'); }
    loadAsk();
    if (!term.open) term.showModal();
    tIn.focus();
  }
  var tag = document.querySelector('.stage__tag');
  // The page ships the button already built, so the first paint has its final size and nothing jumps.
  var tb = tag && tag.querySelector('.tag__btn');
  if (tb) tb.addEventListener('click', function () { openTerminal(tb); });
  else if (tag) {
    tb = document.createElement('button');
    tb.type = 'button'; tb.className = 'tag__btn';
    var extra = tag.querySelector('.tag__extra');
    tb.innerHTML = '<span class="tag__top"><span class="tag__cmd mono">$ whoami</span><span class="tag__run">run ↵</span></span>' +
      '<span class="tag__out">Somya Ranjan Sahoo' + (extra ? '<span class="tag__extra"> · a.k.a. Sonu</span>' : '') + ' · B.Tech CSE, GITA ’29</span>' +
      '<span class="sr-only"> (opens an interactive terminal)</span>';
    tag.innerHTML = ''; tag.appendChild(tb);
    tb.addEventListener('click', function () { openTerminal(tb); });
  }

  // ---- Command palette (Ctrl+K / ⌘K / "/") ----
  var cmdk = document.createElement('dialog');
  cmdk.className = 'cmdk'; cmdk.id = 'cmdk'; cmdk.setAttribute('aria-label', 'Command palette');
  cmdk.innerHTML = '<div class="cmdk__head"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
    '<input id="cmdkIn" type="text" role="combobox" aria-expanded="true" aria-controls="cmdkList" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="Search sections, projects, certificates and actions…" aria-label="Search">' +
    '<kbd>Esc</kbd></div><ul class="cmdk__list" id="cmdkList" role="listbox" aria-label="Results"></ul>' +
    '<p class="cmdk__foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></p>';
  document.body.appendChild(cmdk);
  var cIn = $('cmdkIn'), cList = $('cmdkList'), cItems = [], cShown = [], cActive = 0, cmdkOpener = null;
  function flash(el) { el.classList.remove('is-flash'); void el.offsetWidth; el.classList.add('is-flash'); }
  function scrollToEl(el) { setTimeout(function () { landOn(el, 'center'); flash(el); }, 80); }
  function buildItems() {
    var it = [];
    var act = function (label, hint, fn, kw) { it.push({ g: 'Actions', label: label, hint: hint, run: fn, kw: kw || '' }); };
    act('Copy email address', '6422somyaranjansahoo@gmail.com', function () { var b = $('copyEmail'); if (b) b.click(); }, 'mail contact');
    act('Download resume (PDF)', 'Developer · ATS', function () { CMDS.resume(); }, 'cv');
    act('Download placement resume (PDF)', 'Campus format', function () { CMDS.resume('placement'); }, 'cv college tpo campus');
    act('Open the terminal', 'Type commands', function () { openTerminal(); }, 'shell console cli');
    act('Switch light / dark theme', 'Theme', function () { $('themeToggle').click(); }, 'mode color');
    act('Replay the intro', 'Reload the page', function () { location.reload(); }, 'animation hands');
    [['work', 'Work'], ['data', 'Data lab'], ['about', 'About'], ['experience', 'Experience'], ['credentials', 'Credentials'], ['resume', 'Resume'], ['contact', 'Contact']].forEach(function (s) {
      it.push({ g: 'Sections', label: s[1], hint: 'Section', run: function () { var el = $(s[0]); if (el) landOn(el); } });
    });
    projs().forEach(function (p) {
      var kind = (p.querySelector('.case__kicker') || p.querySelector('.tag') || {}).textContent || '';
      it.push({ g: 'Projects', label: txt('#' + p.id + ' h3'), hint: kind.trim(), run: function () { var ci = p.classList.contains('case') && window.__openDeep ? window.__openDeep(p.id) : false; if (!ci) scrollToEl(p); }, kw: Array.prototype.map.call(p.querySelectorAll('.chips li'), function (c) { return c.textContent; }).join(' ') });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.cred'), function (c) {
      it.push({ g: 'Certificates', label: c.querySelector('h4').textContent, hint: c.querySelector('.cred__issuer').textContent, run: function () {
        if (c.classList.contains('is-hidden')) { var all = document.querySelector('#credFilters [data-filter="all"]'); if (all) all.click(); }
        if (c.classList.contains('is-collapsed')) { var more = $('credMore'); if (more) more.click(); }
        scrollToEl(c);
      } });
    });
    [['GitHub', 'https://github.com/somyaranjansahoo6422'], ['LinkedIn', 'https://www.linkedin.com/in/somya-ranjan-sahoo-109599312/'], ['Instagram', 'https://www.instagram.com/somya_ranjan__22/']].forEach(function (l) {
      it.push({ g: 'Links', label: l[0], hint: 'Opens in a new tab', run: function () { window.open(l[1], '_blank', 'noopener'); } });
    });
    (window.__extraCmds || []).forEach(function (x) { it.splice(1, 0, x); });
    return it;
  }
  function render() {
    var q = cIn.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    cShown = cItems.filter(function (x) { var hay = (x.label + ' ' + x.hint + ' ' + x.g + ' ' + (x.kw || '')).toLowerCase(); return q.every(function (w) { return hay.indexOf(w) > -1; }); }).slice(0, 60);
    cList.textContent = '';
    var lastG = null;
    cShown.forEach(function (x, i) {
      if (x.g !== lastG) { var h = document.createElement('li'); h.className = 'cmdk__group'; h.setAttribute('role', 'presentation'); h.textContent = x.g; cList.appendChild(h); lastG = x.g; }
      var li = document.createElement('li');
      li.id = 'cmdk-' + i; li.className = 'cmdk__item'; li.setAttribute('role', 'option');
      var l = document.createElement('span'); l.className = 'cmdk__label'; l.textContent = x.label;
      var h2 = document.createElement('span'); h2.className = 'cmdk__hint'; h2.textContent = x.hint;
      li.appendChild(l); li.appendChild(h2);
      li.addEventListener('mousemove', function () { if (cActive !== i) { cActive = i; mark(); } });
      li.addEventListener('click', function () { choose(i); });
      cList.appendChild(li);
    });
    if (!cShown.length) { var e = document.createElement('li'); e.className = 'cmdk__empty'; e.textContent = 'Nothing found. Try "projects", "python" or "resume".'; cList.appendChild(e); }
    cActive = 0; mark();
  }
  function mark() {
    Array.prototype.forEach.call(cList.querySelectorAll('.cmdk__item'), function (li, i) {
      var on = i === cActive; li.classList.toggle('is-active', on); li.setAttribute('aria-selected', String(on));
      if (on) { cIn.setAttribute('aria-activedescendant', li.id); li.scrollIntoView({ block: 'nearest' }); }
    });
  }
  function choose(i) { var x = cShown[i]; if (!x) return; cmdkOpener = null; cmdk.close(); x.run(); }
  cIn.addEventListener('input', render);
  cIn.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); cActive = Math.min(cShown.length - 1, cActive + 1); mark(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); cActive = Math.max(0, cActive - 1); mark(); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(cActive); }
  });
  cmdk.addEventListener('click', function (e) { if (e.target === cmdk) cmdk.close(); });
  cmdk.addEventListener('close', function () { if (cmdkOpener) cmdkOpener.focus(); });
  function openPalette(from) {
    if (cmdk.open) return;
    cmdkOpener = from || document.activeElement;
    cItems = buildItems();
    cIn.value = '';
    render();
    cmdk.showModal();
    cIn.focus();
  }
  document.addEventListener('keydown', function (e) {
    var typing = /input|textarea|select/i.test((e.target.tagName || '')) || e.target.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if (cmdk.open) cmdk.close(); else openPalette(); }
    else if (e.key === '/' && !typing && !document.querySelector('dialog[open]')) { e.preventDefault(); openPalette(); }
  });
  var tools = document.querySelector('.nav__tools');
  if (tools) {
    var kb = document.createElement('button');
    kb.type = 'button'; kb.className = 'icon-btn cmdk-btn'; kb.id = 'cmdToggle';
    kb.title = 'Search and quick actions (Ctrl+K)';
    kb.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span class="sr-only">Search </span><span class="cmdk-btn__k">Ctrl K</span>';
    tools.insertBefore(kb, tools.firstChild);
    kb.addEventListener('click', function () { openPalette(kb); });
  }


  // Keep the theme in step across open tabs.
  window.addEventListener('storage', function (e) {
    if (e.key !== 'theme') return;
    if (e.newValue) root.setAttribute('data-theme', e.newValue); else root.removeAttribute('data-theme');
    syncTheme();
  });

  // ---- Project deep dives: full-screen, shareable (#project/<id>) story for each flagship project ----
  var cases = Array.prototype.slice.call(document.querySelectorAll('#work .case'));
  var deep = document.createElement('dialog');
  deep.className = 'deep'; deep.id = 'deep'; deep.setAttribute('aria-labelledby', 'deepTitle');
  document.body.appendChild(deep);
  var deepIdx = -1, deepOpener = null;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function renderDeep(i) {
    var c = cases[i];
    deepIdx = i;
    deep.textContent = '';
    var bar = el('div', 'deep__bar');
    var crumb = el('p', 'deep__crumb mono', 'Project ' + ('0' + (i + 1)).slice(-2) + ' / ' + ('0' + cases.length).slice(-2));
    var share = el('button', 'deep__btn', 'Copy link'); share.type = 'button';
    share.addEventListener('click', function () {
      var url = location.origin + location.pathname + '#project/' + c.id;
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { share.textContent = 'Link copied ✓'; }, function () { share.textContent = url; });
      setTimeout(function () { share.textContent = 'Copy link'; }, 2200);
    });
    var close = el('button', 'deep__close'); close.type = 'button'; close.setAttribute('aria-label', 'Close project');
    close.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    close.addEventListener('click', function () { deep.close(); });
    bar.appendChild(crumb); bar.appendChild(share); bar.appendChild(close);
    deep.appendChild(bar);

    var body = el('div', 'deep__body');
    // Media column: main image + every other image of this project, switchable.
    var media = el('div', 'deep__media');
    var shots = [];
    var main = c.querySelector('.case__media');
    if (main) shots.push({ href: main.getAttribute('href'), alt: (main.querySelector('img') || {}).alt || '', cap: main.getAttribute('data-caption') || '' });
    Array.prototype.forEach.call(c.querySelectorAll('.study__gallery a'), function (a) { shots.push({ href: a.getAttribute('href'), alt: (a.querySelector('img') || {}).alt || '', cap: a.getAttribute('data-caption') || '' }); });
    var big = el('figure', 'deep__shot');
    var bigImg = el('img'); bigImg.decoding = 'async';
    var bigCap = el('figcaption');
    big.appendChild(bigImg); big.appendChild(bigCap);
    function showShot(k) { bigImg.src = shots[k].href; bigImg.alt = shots[k].alt; bigCap.textContent = shots[k].cap; Array.prototype.forEach.call(thumbs.children, function (t, j) { t.setAttribute('aria-pressed', String(j === k)); }); }
    var thumbs = el('div', 'deep__thumbs');
    shots.forEach(function (s, k) {
      var t = el('button', 'deep__thumb'); t.type = 'button'; t.setAttribute('aria-label', 'Show image ' + (k + 1) + ': ' + (s.cap || s.alt));
      var ti = el('img'); ti.src = s.href; ti.alt = s.alt || s.cap || 'Project screenshot ' + (k + 1); ti.loading = 'lazy'; t.appendChild(ti);
      t.addEventListener('click', function () { showShot(k); });
      thumbs.appendChild(t);
    });
    media.appendChild(big);
    if (shots.length > 1) media.appendChild(thumbs);
    // Story column
    var story = el('div', 'deep__story');
    var kicker = c.querySelector('.case__kicker');
    story.appendChild(el('p', 'deep__kicker mono', kicker ? kicker.textContent : ''));
    var h = el('h2', 'deep__title', (c.querySelector('h3') || {}).textContent || ''); h.id = 'deepTitle';
    story.appendChild(h);
    var badge = c.querySelector('.case__media .badge');
    if (badge) { var bb = badge.cloneNode(true); bb.classList.add('badge--inline'); story.appendChild(bb); }
    var purpose = c.querySelector('.case__purpose');
    if (purpose) story.appendChild(el('p', 'deep__lede', purpose.textContent));
    var chips = c.querySelector('.chips'); if (chips) story.appendChild(chips.cloneNode(true));
    var steps = el('ol', 'deep__steps');
    Array.prototype.forEach.call(c.querySelectorAll('.study__grid > div'), function (d, k) {
      var li = el('li', 'deep__step');
      li.appendChild(el('span', 'deep__n', ('0' + (k + 1)).slice(-2)));
      var box = el('div');
      box.appendChild(el('h3', null, d.querySelector('dt').textContent));
      var dd = el('p'); dd.innerHTML = d.querySelector('dd').innerHTML; box.appendChild(dd);
      li.appendChild(box);
      steps.appendChild(li);
    });
    story.appendChild(steps);
    var links = el('div', 'deep__links');
    Array.prototype.forEach.call(c.querySelectorAll('.case__links a, .gh'), function (a) { links.appendChild(a.cloneNode(true)); });
    story.appendChild(links);
    body.appendChild(media); body.appendChild(story);
    deep.appendChild(body);

    var nav = el('div', 'deep__nav');
    var prev = el('button', 'deep__pn'); prev.type = 'button';
    var next = el('button', 'deep__pn deep__pn--next'); next.type = 'button';
    var pc = cases[(i - 1 + cases.length) % cases.length], nc = cases[(i + 1) % cases.length];
    prev.innerHTML = '<span class="mono">← Previous</span>'; prev.appendChild(el('strong', null, (pc.querySelector('h3') || {}).textContent));
    next.innerHTML = '<span class="mono">Next →</span>'; next.appendChild(el('strong', null, (nc.querySelector('h3') || {}).textContent));
    prev.addEventListener('click', function () { openDeep(cases.indexOf(pc)); });
    next.addEventListener('click', function () { openDeep(cases.indexOf(nc)); });
    nav.appendChild(prev); nav.appendChild(next);
    deep.appendChild(nav);
    if (shots.length) showShot(0);
    deep.scrollTop = 0;
    close.focus();
  }
  function openDeep(i, from) {
    if (i < 0 || !cases[i]) return;
    if (!deep.open) deepOpener = from || document.activeElement;
    renderDeep(i);
    var want = '#project/' + cases[i].id;
    if (location.hash !== want) history.replaceState(null, '', location.pathname + location.search + want);
    if (!deep.open) { deep.showModal(); document.body.classList.add('deep-open'); }
  }
  deep.addEventListener('close', function () {
    document.body.classList.remove('deep-open');
    if (/^#project\//.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
    if (deepOpener && deepOpener.focus) deepOpener.focus();
  });
  deep.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowRight') openDeep((deepIdx + 1) % cases.length);
    else if (e.key === 'ArrowLeft') openDeep((deepIdx - 1 + cases.length) % cases.length);
  });
  cases.forEach(function (c, i) {
    var links = c.querySelector('.case__links');
    if (!links) return;
    var b = el('button', 'btn btn--sm deep-open-btn');
    b.type = 'button';
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h7M4 4v7M20 20h-7M20 20v-7M4 4l6 6M20 20l-6-6"/></svg>Deep dive';
    b.setAttribute('aria-label', 'Open the deep dive for ' + ((c.querySelector('h3') || {}).textContent || 'this project'));
    b.addEventListener('click', function () { openDeep(i, b); });
    links.insertBefore(b, links.firstChild);
  });
  function routeDeep() {
    var m = location.hash.match(/^#project\/([\w-]+)/);
    if (!m) { if (deep.open) deep.close(); return; }
    var i = cases.map(function (c) { return c.id; }).indexOf(m[1]);
    if (i > -1) openDeep(i);
  }
  window.addEventListener('hashchange', routeDeep);
  window.__openDeep = function (id) { var i = cases.map(function (c) { return c.id; }).indexOf(id); if (i < 0) return false; openDeep(i); return true; };
  onBuilt(function () { setTimeout(routeDeep, 120); });

  // ---- Skills map: every skill chip shows the projects, certificates and jobs that prove it ----
  var skillsBox = document.querySelector('#about .skills');
  if (skillsBox) {
    var evidence = [];
    Array.prototype.forEach.call(document.querySelectorAll('#work [data-cats]'), function (p) {
      evidence.push({ type: 'Projects', label: (p.querySelector('h3') || {}).textContent || '', chips: Array.prototype.map.call(p.querySelectorAll('.chips li, .mini span'), function (x) { return x.textContent.toLowerCase(); }), text: p.textContent.toLowerCase(), go: function () { var i = cases.indexOf(p); if (i > -1) openDeep(i); else scrollToEl(p); } });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.cred'), function (c) {
      evidence.push({ type: 'Certificates', label: c.querySelector('h4').textContent, chips: [], text: (c.querySelector('h4').textContent + ' ' + c.querySelector('.cred__issuer').textContent).toLowerCase(), go: function () { if (c.classList.contains('is-collapsed')) { var mb = $('credMore'); if (mb) mb.click(); } if (c.classList.contains('is-hidden')) { var all = document.querySelector('#credFilters [data-filter="all"]'); if (all) all.click(); } scrollToEl(c); } });
    });
    var feat = document.getElementById('cred-featured');
    if (feat) evidence.push({ type: 'Certificates', label: 'Google Data Analysis with Python (6 courses)', chips: Array.prototype.map.call(feat.querySelectorAll('.chips li'), function (x) { return x.textContent.toLowerCase(); }), text: feat.textContent.toLowerCase(), go: function () { scrollToEl(feat); } });
    Array.prototype.forEach.call(document.querySelectorAll('#experience .timeline > li'), function (li) {
      var h3 = li.querySelector('h3'); if (!h3) return;
      evidence.push({ type: 'Experience & education', label: h3.textContent + (li.querySelector('.org') ? ' · ' + li.querySelector('.org').textContent : ''), chips: [], text: li.textContent.toLowerCase(), go: function () { scrollToEl(li); } });
    });
    var esc = function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, function (m) { return '\\' + m; }); };
    function tokensOf(label) {
      return label.toLowerCase().replace(/\s*\(basics\)/, '').split(/\s*(?:&|\/|,|\band\b)\s*/).map(function (t) { return t.trim(); }).filter(Boolean);
    }
    function proves(item, tokens) {
      return tokens.some(function (t) {
        if (t.length <= 2) return item.chips.some(function (c) { return c === t; }); // single letters only count as an exact tag
        if (item.chips.some(function (c) { return c === t || c.indexOf(t) === 0 || (t.length > 3 && c.indexOf(t) > -1); })) return true;
        return new RegExp('(^|[^a-z0-9])' + esc(t) + '([^a-z0-9]|$)').test(item.text);
      });
    }
    var panel = el('div', 'skillmap__panel'); panel.id = 'skillPanel'; panel.setAttribute('aria-live', 'polite');
    panel.innerHTML = '<p class="skillmap__hint">Tap or hover a skill to see where I’ve used it.</p>';
    skillsBox.insertAdjacentElement('afterend', panel);
    skillsBox.classList.add('skillmap');
    var pinned = null;
    function showSkill(btn, label) {
      var tokens = tokensOf(label);
      var hits = evidence.filter(function (e) { return proves(e, tokens); });
      panel.textContent = '';
      var head = el('p', 'skillmap__head');
      head.appendChild(el('strong', null, label));
      head.appendChild(document.createTextNode(hits.length ? ' — ' + hits.length + ' place' + (hits.length === 1 ? '' : 's') + ' on this page' : ' — not tagged on a project here yet'));
      panel.appendChild(head);
      ['Projects', 'Certificates', 'Experience & education'].forEach(function (g) {
        var gh = hits.filter(function (x) { return x.type === g; });
        if (!gh.length) return;
        var wrap = el('div', 'skillmap__group');
        wrap.appendChild(el('p', 'skillmap__gt mono', g + ' · ' + gh.length));
        var ul = el('ul');
        gh.forEach(function (x) { var li = el('li'); var b = el('button', 'skillmap__item', x.label.replace(/\s+/g, ' ').trim()); b.type = 'button'; b.addEventListener('click', x.go); li.appendChild(b); ul.appendChild(li); });
        wrap.appendChild(ul); panel.appendChild(wrap);
      });
    }
    Array.prototype.forEach.call(skillsBox.querySelectorAll('.chips li'), function (li) {
      var label = li.textContent.trim();
      var n = evidence.filter(function (e) { return proves(e, tokensOf(label)); }).length;
      var b = el('button', 'skillchip'); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-controls', 'skillPanel');
      b.appendChild(el('span', null, label));
      if (n) b.appendChild(el('span', 'skillchip__n', String(n)));
      li.textContent = ''; li.appendChild(b);
      b.addEventListener('click', function () {
        var same = pinned === b;
        if (pinned) pinned.setAttribute('aria-pressed', 'false');
        pinned = same ? null : b;
        if (pinned) { b.setAttribute('aria-pressed', 'true'); showSkill(b, label); }
      });
      b.addEventListener('mouseenter', function () { if (!pinned && root.getAttribute('data-touch') !== '1') showSkill(b, label); });
      b.addEventListener('focus', function () { if (!pinned) showSkill(b, label); });
    });
  }

  // ---- "Now building": the most recently pushed public repo ----
  (function () {
    var repoEl = $('nowRepo'), metaEl = $('nowMeta');
    if (!repoEl || !('fetch' in window)) return;
    // Waits for the page to finish loading, so this never competes with the first screen.
    var pageLoaded = new Promise(function (done) { if (document.readyState === 'complete') done(); else window.addEventListener('load', done, { once: true }); });
    var got = pageLoaded.then(function () { return window.__ghRepos ? window.__ghRepos() : null; }).then(function (list) {
      var r = (list || []).filter(function (x) { return !x.fork; })[0];
      return r ? { name: r.name, url: r.url, lang: r.lang, pushed: r.pushed } : null;
    });
    got.then(function (d) {
      if (!d) { metaEl.textContent = 'Live activity is on GitHub'; return; }
      repoEl.textContent = d.name.replace(/[-_]+/g, ' ');
      repoEl.href = d.url;
      metaEl.textContent = 'pushed ' + ago(d.pushed) + (d.lang ? ' · ' + d.lang : '');
    }).catch(function () { metaEl.textContent = 'Live activity is on GitHub'; });
  })();

  // ---- Hackathon journey map ----
  (function () {
    var j = document.querySelector('.journey');
    if (!j) return;
    var pins = Array.prototype.slice.call(j.querySelectorAll('.journey__pin'));
    function pick(id) {
      pins.forEach(function (p) { p.setAttribute('aria-pressed', String(p.getAttribute('data-city') === id)); });
      Array.prototype.forEach.call(j.querySelectorAll('.journey__card'), function (c) { c.hidden = c.getAttribute('data-card') !== id; });
      sfx('tick');
    }
    pins.forEach(function (p) { p.addEventListener('click', function () { pick(p.getAttribute('data-city')); }); });
    pick('bbsr');
    if ('IntersectionObserver' in window) {
      var jo = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { j.classList.add('is-drawn'); jo.disconnect(); } }, { threshold: 0.35 });
      jo.observe(j);
    } else j.classList.add('is-drawn');
  })();

  // ---- Kind words: a gentle rotating quote wall ----
  (function () {
    var wrap = $('words'), nav = $('wordsNav');
    if (!wrap || !nav) return;
    var items = Array.prototype.slice.call(wrap.querySelectorAll('.word')), dots = nav.querySelector('.words__dots'), pauseB = nav.querySelector('.words__pause');
    var cur = 0, timer = null, paused = reduceMotion, hover = false;
    items.forEach(function (it, i) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Quote ' + (i + 1) + ' of ' + items.length);
      b.addEventListener('click', function () { go(i, true); });
      dots.appendChild(b);
    });
    function go(i, user) {
      cur = (i + items.length) % items.length;
      items.forEach(function (it, k) { it.classList.toggle('is-active', k === cur); it.setAttribute('aria-hidden', String(k !== cur)); });
      Array.prototype.forEach.call(dots.children, function (d, k) { d.setAttribute('aria-current', String(k === cur)); });
      if (user) restart();
    }
    function restart() { clearInterval(timer); if (!paused) timer = setInterval(function () { if (!hover && !document.hidden) go(cur + 1); }, 6500); }
    nav.querySelectorAll('[data-w]').forEach(function (b) { b.addEventListener('click', function () { go(cur + +b.getAttribute('data-w'), true); }); });
    pauseB.addEventListener('click', function () { paused = !paused; pauseB.setAttribute('aria-pressed', String(paused)); pauseB.textContent = paused ? 'Play' : 'Pause'; restart(); });
    if (paused) { pauseB.setAttribute('aria-pressed', 'true'); pauseB.textContent = 'Play'; }
    wrap.addEventListener('mouseenter', function () { hover = true; });
    wrap.addEventListener('mouseleave', function () { hover = false; });
    wrap.addEventListener('focusin', function () { hover = true; });
    wrap.addEventListener('focusout', function () { hover = false; });
    var sx = null;
    wrap.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    wrap.addEventListener('pointerup', function (e) { if (sx !== null && Math.abs(e.clientX - sx) > 50) go(cur + (e.clientX < sx ? 1 : -1), true); sx = null; });
    nav.hidden = false;
    go(0); restart();
  })();

  // ---- Recruiter quick view: the whole profile in 60 seconds ----
  var qv = document.createElement('dialog');
  qv.className = 'qv'; qv.id = 'qv'; qv.setAttribute('aria-labelledby', 'qvName');
  qv.innerHTML = '<div class="qv__head"><img class="qv__avatar" src="/assets/img/profile-240.webp" loading="lazy" alt="Somya Ranjan Sahoo" width="64" height="64">' +
    '<div><h2 class="qv__name" id="qvName">Somya Ranjan Sahoo</h2><p class="qv__role">Aspiring data analyst · Software developer · Python · SQL · Excel</p></div>' +
    '<button type="button" class="qv__close" aria-label="Close summary"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
    '<div class="qv__body">' +
    '<div class="qv__block"><h3>Studying</h3><ul><li><strong>B.Tech CSE</strong> <span>· GITA Autonomous College, Bhubaneswar · 2025–2029</span></li><li><strong>Sainik School Bhubaneswar</strong> <span>· Class VI–XII · NCC A &amp; B</span></li></ul></div>' +
    '<div class="qv__block"><h3>Top results</h3><ul><li><strong>Best Innovation Team</strong> <span>· CHAKRAVYUH 1.0, Jan 2026</span></li><li><strong>National hackathon finalist</strong> <span>· India Innovates 2026</span></li><li><strong>8 hackathons</strong> <span>· 7 national, 3 shortlists</span></li></ul></div>' +
    '<div class="qv__block qv__wide"><h3>Top projects</h3><ul>' +
      '<li><strong>GOD VIEW</strong> <span>· live flight + satellite digital twin; I built the back-end data ingestion (FastAPI, Neo4j)</span></li>' +
      '<li><strong>UNSPOKEN</strong> <span>· assistive wearable on a Raspberry Pi with TensorFlow Lite; Best Innovation Team</span></li>' +
      '<li><strong>Smart Toll Plaza</strong> <span>· real-time number-plate recognition + Pan-India GIS dashboard (Python, OpenCV)</span></li></ul></div>' +
    '<div class="qv__block"><h3>Experience</h3><ul><li><strong>Python Developer Intern</strong> <span>· The Entrepreneurship Network · 3 months · letter of recommendation</span></li><li><strong>Python Programming Intern</strong> <span>· InternPe · 6 weeks</span></li></ul></div>' +
    '<div class="qv__block"><h3>Skills</h3><ul><li><strong>Languages</strong> <span>· Python, SQL, Node.js, C, HTML/CSS</span></li><li><strong>Tools</strong> <span>· FastAPI, Streamlit, OpenCV, pandas, Git, Excel</span></li><li><strong>Certificates</strong> <span>· 30, incl. Google Data Analysis with Python</span></li></ul></div>' +
    '<div class="qv__block qv__wide"><h3>Contact</h3><ul><li><a class="link" href="mailto:6422somyaranjansahoo@gmail.com">6422somyaranjansahoo@gmail.com</a> · <a class="link" href="https://www.linkedin.com/in/somya-ranjan-sahoo-109599312/" target="_blank" rel="noopener noreferrer">LinkedIn</a> · <a class="link" href="https://github.com/somyaranjansahoo6422" target="_blank" rel="noopener noreferrer">GitHub</a></li></ul></div>' +
    '</div><div class="qv__foot"><a class="btn btn--primary btn--sm" href="/assets/Somya-Ranjan-Sahoo-Resume.pdf" download>Download resume</a>' +
    '<button type="button" class="btn btn--ghost btn--sm" id="qvCopy">Copy as text</button><button type="button" class="btn btn--ghost btn--sm" id="qvPrint">Print</button>' +
    '<a class="btn btn--ghost btn--sm" href="#contact" id="qvContact">Contact me</a></div>';
  document.body.appendChild(qv);
  var qvOpener = null;
  function openQuickView(from) { qvOpener = from || document.activeElement; qv.showModal(); qv.querySelector('.qv__close').focus(); sfx('open'); }
  qv.querySelector('.qv__close').addEventListener('click', function () { qv.close(); });
  qv.addEventListener('click', function (e) { if (e.target === qv) qv.close(); });
  qv.addEventListener('close', function () { if (qvOpener && qvOpener.focus) qvOpener.focus(); });
  $('qvContact').addEventListener('click', function () { qv.close(); });
  $('qvCopy').addEventListener('click', function () {
    var text = Array.prototype.map.call(qv.querySelectorAll('.qv__name, .qv__role, .qv__block'), function (b) { return b.innerText.trim(); }).join('\n\n');
    var b = $('qvCopy');
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { b.textContent = 'Copied ✓'; }, function () { b.textContent = 'Copy failed'; });
    setTimeout(function () { b.textContent = 'Copy as text'; }, 2000);
  });
  $('qvPrint').addEventListener('click', function () {
    document.body.classList.add('qv-printing');
    window.print();
    setTimeout(function () { document.body.classList.remove('qv-printing'); }, 500);
  });
  var qvBtn = $('qvOpen');
  if (qvBtn) qvBtn.addEventListener('click', function () { openQuickView(qvBtn); });

  // ---- Section colour transitions: the page tint follows the section in view ----
  if ('IntersectionObserver' in window) {
    var secIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) root.setAttribute('data-sec', en.target.id || 'hero'); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Array.prototype.forEach.call(document.querySelectorAll('main > section'), function (sec) { if (!sec.id) sec.id = sec.classList.contains('stage') ? 'home' : ''; secIo.observe(sec); });
  }

  // ---- Particle code background in the hero (pauses when off-screen or hidden) ----
  (function () {
    var stageEl = document.querySelector('.stage');
    if (!stageEl || reduceMotion || !window.HTMLCanvasElement || root.classList.contains('intro-lite')) return; // phones skip it to stay smooth
    var cv = document.createElement('canvas'); cv.className = 'particles'; cv.setAttribute('aria-hidden', 'true');
    stageEl.insertBefore(cv, stageEl.firstChild);
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, parts = [], mouse = { x: -9999, y: -9999 }, running = false, raf = 0;
    var GLYPHS = ['{', '}', '<', '/>', ';', '()', '=>', '[]', '#', '&&', '01', 'fn'];
    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = stageEl.clientWidth; H = stageEl.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(W < 760 ? 24 : 56, W * H / 26000));
      parts = [];
      for (var i = 0; i < n; i++) parts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .5, vy: -.2 - Math.random() * .5, g: GLYPHS[i % GLYPHS.length], s: [12, 15, 18][i % 3], a: .12 + Math.random() * .22 });
    }
    function color() { return getComputedStyle(root).getPropertyValue('--accent').trim() || '#ff7a4d'; }
    var col = color();
    var sprites = {}, last = 0;
    function sprite(g, size) {
      var k = g + '|' + size + '|' + col;
      if (sprites[k]) return sprites[k];
      var c = document.createElement('canvas'), x = c.getContext('2d');
      x.font = '500 ' + size + 'px "JetBrains Mono", monospace';
      var w = Math.ceil(x.measureText(g).width) + 4;
      c.width = w * dpr; c.height = (size + 6) * dpr;
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      x.font = '500 ' + size + 'px "JetBrains Mono", monospace'; x.fillStyle = col; x.textBaseline = 'top';
      x.fillText(g, 2, 2);
      return (sprites[k] = { c: c, w: w, h: size + 6 });
    }
    function frame(now) {
      if (running) raf = requestAnimationFrame(frame);
      if (now - last < 33) return; // ~30 fps is plenty for drifting symbols
      last = now;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 14400) { var f = (14400 - d2) / 14400 * .9; var d = Math.sqrt(d2) || 1; p.x += dx / d * f * 2.2; p.y += dy / d * f * 2.2; }
        p.x += p.vx; p.y += p.vy;
        if (p.y < -20) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < -20) p.x = W + 10; else if (p.x > W + 20) p.x = -10;
        ctx.globalAlpha = p.a;
        var sp = sprite(p.g, p.s);
        ctx.drawImage(sp.c, p.x, p.y, sp.w, sp.h);
      }
      ctx.globalAlpha = 1;
    }
    function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; cancelAnimationFrame(raf); }
    size();
    window.addEventListener('resize', function () { size(); });
    stageEl.addEventListener('pointermove', function (e) { var r = stageEl.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    stageEl.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
    new MutationObserver(function () { var c = color(); if (c !== col) { col = c; sprites = {}; } }).observe(root, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    onBuilt(function () {
      if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { if (en[0].isIntersecting && !document.hidden) start(); else stop(); }).observe(stageEl);
      else start();
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (stageEl.getBoundingClientRect().bottom > 0) start(); });
  })();

  // ---- Opt-in sound (off by default; tiny synthesized clicks, no audio files) ----
  var soundBtn = document.createElement('button');
  soundBtn.type = 'button'; soundBtn.className = 'sound-btn'; soundBtn.id = 'soundToggle';
  soundBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path class="sw" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg><span>Sound</span>';
  function syncSound() { soundBtn.setAttribute('aria-pressed', String(soundOn)); soundBtn.title = soundOn ? 'Interface sounds are on' : 'Interface sounds are off'; }
  syncSound();
  soundBtn.addEventListener('click', function () { soundOn = !soundOn; try { localStorage.setItem('sound', soundOn ? '1' : '0'); } catch (e) {} syncSound(); sfx('drop'); showToast(soundOn ? 'Sounds on' : 'Sounds off'); });
  var footLinks = document.querySelector('.footer__links');
  if (footLinks) footLinks.appendChild(soundBtn);

  // ---- Easter eggs ----
  (function () {
    var KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    var pos = 0, typed = '';
    document.addEventListener('keydown', function (e) {
      if (/input|textarea|select/i.test(e.target.tagName || '') || document.querySelector('dialog[open]')) return;
      var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = k === KONAMI[pos] ? pos + 1 : (k === KONAMI[0] ? 1 : 0);
      if (pos === KONAMI.length) { pos = 0; root.classList.toggle('retro'); sfx('open'); showToast(root.classList.contains('retro') ? 'Retro mode unlocked 👾' : 'Back to the future'); }
      if (e.key.length === 1) {
        typed = (typed + e.key.toLowerCase()).slice(-5);
        if (typed === 'astra') { showToast('Rebuilding the page…'); setTimeout(function () { location.reload(); }, 600); }
      }
    });
    try {
      console.log('%cHey, developer 👋', 'font: 700 20px system-ui; color: #ff6a3d');
      console.log('%cYou opened the console, so you’re my kind of person. I’m Somya, I’m open to internships, and this whole site is hand-written HTML, CSS and JavaScript.\nSay hi: 6422somyaranjansahoo@gmail.com\n(Psst: try the Konami code, or type "astra".)', 'font: 14px/1.5 system-ui; color: #888');
    } catch (e) {}
  })();

  // ---- Extra commands for the palette and the terminal ----
  if (typeof CMDS === 'object') {
    CMDS.summary = function () { tLine('Opening the 60-second summary…'); term.close(); setTimeout(function () { openQuickView(); }, 80); };
    CMDS.sound = function (arg) { var want = arg ? arg === 'on' : !soundOn; if (want !== soundOn) soundBtn.click(); tLine('Sound: ' + (soundOn ? 'on' : 'off')); };
    CMDS.retro = function () { root.classList.toggle('retro'); tLine('Retro mode: ' + (root.classList.contains('retro') ? 'on' : 'off'), 'term__ok'); };
  }
  function replayIntro() {
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    location.reload();
  }
  if (typeof CMDS === 'object') CMDS.replay = function () { tLine('Replaying the intro…', 'term__ok'); setTimeout(replayIntro, 350); };
  window.__extraCmds = [
    { g: 'Actions', label: 'Replay the intro', hint: 'Watch the hands build the page', run: replayIntro, kw: 'intro animation again restart hands' },
    { g: 'Actions', label: '60-second summary', hint: 'For recruiters', run: function () { openQuickView(); }, kw: 'recruiter quick view overview' },
    { g: 'Actions', label: 'Turn sounds on / off', hint: 'Off by default', run: function () { soundBtn.click(); }, kw: 'audio mute' },
    { g: 'Actions', label: 'Hackathon journey map', hint: 'Section', run: function () { var s = $('journey'); if (s) landOn(s); }, kw: 'map cities india' }
  ];

  // ---- Resume vault: two versions, only the top of each is previewed ----
  var vault = $('rvault');
  if (vault) {
    var rBtns = vault.querySelectorAll('.rswitch__btn');
    var setVersion = function (v, focus) {
      if (vault.getAttribute('data-version') === v) return;
      vault.setAttribute('data-version', v);
      Array.prototype.forEach.call(rBtns, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === v)); if (focus && b.getAttribute('data-v') === v) b.focus(); });
      Array.prototype.forEach.call(vault.querySelectorAll('.rinfo'), function (p) {
        var on = p.getAttribute('data-info') === v;
        p.hidden = !on;
        if (on) p.querySelectorAll('.hand-wait').forEach(function (el) { el.classList.remove('hand-wait'); el.style.translate = ''; el.style.rotate = ''; });
      });
      sfx('tick');
    };
    var handing = false;
    var handOff = function (v) {
      if (vault.getAttribute('data-version') === v || handing) return;
      var paper = vault.querySelector('[data-paper="' + v + '"]');
      var hd = paper ? fxHand(sideTone(paper.getBoundingClientRect())) : null;
      if (!hd || !paper) { setVersion(v); return; }
      handing = true;
      Array.prototype.forEach.call(rBtns, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === v)); });
      var right = hd.side === 'r', r0 = paper.getBoundingClientRect();
      var gx = gripX(right ? 'design' : 'code', r0.left, r0.width, r0.left + r0.width * (right ? 0.78 : 0.3), window.innerWidth / 2), gy = r0.top + r0.height * 0.2;
      (async function () {
        var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
        hd.move(gx, gy, 340); await wait(350);
        hd.grip(true); sfx('grab'); await wait(90);
        setVersion(v);
        var r1 = paper.getBoundingClientRect();
        hd.move(r1.left + r1.width * (right ? 0.7 : 0.32), r1.top + r1.height * 0.24, 520); await wait(560);
        hd.grip(false); sfx('drop'); await wait(140);
        hd.move(right ? window.innerWidth + 120 : -120, r1.top - 80, 420); await wait(440);
        hd.el.remove(); handing = false;
      })();
    };
    Array.prototype.forEach.call(rBtns, function (b) { b.addEventListener('click', function () { handOff(b.getAttribute('data-v')); }); });
    // Clicking the paper peeking from behind brings it to the front.
    Array.prototype.forEach.call(vault.querySelectorAll('.rpaper'), function (p) {
      p.addEventListener('click', function () { handOff(p.getAttribute('data-paper')); });
    });
    // The browser does the download; the button just confirms it.
    Array.prototype.forEach.call(vault.querySelectorAll('.rdl'), function (a) {
      var t = a.querySelector('.rdl__t'), timer;
      a.addEventListener('click', function () {
        clearTimeout(timer);
        a.classList.remove('is-done');
        a.classList.add('is-loading');
        timer = setTimeout(function () {
          a.classList.remove('is-loading'); a.classList.add('is-done'); t.textContent = 'Saved ✓';
          sfx('open');
          timer = setTimeout(function () { a.classList.remove('is-done'); t.textContent = 'Download PDF'; }, 2600);
        }, reduceMotion ? 0 : 900);
      });
    });
  }

  // ---- Data lab: charts and the SQL playground load only when someone gets near them ----
  var dataSec = $('data');
  if (dataSec) {
    var labAsked = false;
    var loadLab = function () { if (labAsked) return; labAsked = true; var sc = document.createElement('script'); sc.src = '/data-lab.js'; document.head.appendChild(sc); };
    if ('IntersectionObserver' in window) {
      var labIo = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { labIo.disconnect(); loadLab(); } }, { rootMargin: '900px 0px' });
      labIo.observe(dataSec);
      // Phones keep the section out of the layout until the stylesheet is in, and the observer can miss it appearing:
      // once the page has loaded, the lab loads anyway (it is small).
      var labLater = function () { setTimeout(function () { labIo.disconnect(); loadLab(); }, 300); };
      if (document.readyState === 'complete') labLater(); else window.addEventListener('load', labLater, { once: true });
    } else loadLab();
  }

  // ---- Ask me anything: the chat (ask.js) loads only when someone gets near it ----
  var askBox = $('ask');
  if (askBox) {
    if ('IntersectionObserver' in window) {
      var askIo = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { askIo.disconnect(); loadAsk(); } }, { rootMargin: '900px 0px' });
      askIo.observe($('resume') || askBox);
    } else loadAsk();
    // a question asked before the script arrives still gets its answer
    var askEarly = function (q) { var f = $('askForm'); if (window.AskMe || !q.trim()) return; f._pending = q; loadAsk(); };
    $('askForm').addEventListener('submit', function (e) { if (!window.AskMe) { e.preventDefault(); askEarly($('askIn').value); } });
    Array.prototype.forEach.call(document.querySelectorAll('#askChips .ask__chip'), function (c) { c.addEventListener('click', function () { askEarly(c.textContent); }); });
  }

  // ---- Share this portfolio: QR code (drawn on demand) + share buttons ----
  var share = $('share');
  if (share) {
    var canon = document.querySelector('link[rel="canonical"]');
    var shareUrl = canon ? canon.href : location.origin + location.pathname;
    var shareText = 'Somya Ranjan Sahoo · Aspiring data analyst and software developer';
    $('shareUrl').textContent = shareUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    $('shareWa').href = 'https://wa.me/?text=' + encodeURIComponent(shareText + ' ' + shareUrl);
    $('shareLi').href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(shareUrl);
    var copyBtn = $('shareCopy');
    var copyLink = function () {
      var done = function () { copyBtn.textContent = 'Link copied ✓'; setTimeout(function () { copyBtn.textContent = 'Copy link'; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(shareUrl).then(done, function () {});
    };
    copyBtn.addEventListener('click', copyLink);
    $('shareBtn').addEventListener('click', function () {
      if (navigator.share) navigator.share({ title: document.title, text: shareText, url: shareUrl }).catch(function () {});
      else copyLink();
    });
    // the QR encoder (24 KB) loads only when the footer comes near
    var drawQr = function () {
      var sc = document.createElement('script');
      sc.src = '/assets/js/qrcode.min.js';
      sc.onload = function () {
        if (!window.qrcode) return;
        var qr = window.qrcode(0, 'M'); qr.addData(shareUrl); qr.make();
        $('shareQr').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
      };
      document.head.appendChild(sc);
    };
    if ('IntersectionObserver' in window) {
      var qio = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { qio.disconnect(); drawQr(); } }, { rootMargin: '600px 0px' });
      qio.observe(share);
    } else drawQr();
  }

  // ---- Demo clips: a project card with data-video plays a short muted loop while it is on screen ----
  var conn = navigator.connection;
  var lowData = conn && (conn.saveData || /2g|3g/.test(conn.effectiveType || '')); // keep slow mobile data for the page itself
  var clips = document.querySelectorAll('[data-video]');
  if (clips.length && !reduceMotion && !lowData && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var m = en.target, v = m.querySelector('video');
        if (en.isIntersecting) {
          if (!v) {
            v = document.createElement('video');
            v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
            v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
            v.className = 'case__video';
            var im = m.querySelector('img'); if (im) v.poster = im.currentSrc || im.src;
            v.src = m.getAttribute('data-video');
            v.addEventListener('playing', function () { m.classList.add('is-playing'); });
            if (im) m.insertBefore(v, im.nextSibling); else m.appendChild(v);
          }
          v.play().catch(function () {});
        } else if (v) v.pause();
      });
    }, { threshold: 0.35 });
    Array.prototype.forEach.call(clips, function (c) { vio.observe(c); });
  }

  // In-page links: nearby targets keep the smooth scroll, far ones land directly (see landOn).
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.closest('dialog')) return;
    var h = a.getAttribute('href');
    if (h.length < 2 || /^#project\//.test(h)) return;
    var el = document.getElementById(hashId(h));
    if (!el || Math.abs(el.getBoundingClientRect().top) < window.innerHeight * 1.5) return;
    e.preventDefault();
    history.pushState(null, '', h);
    landOn(el);
  });

  // Gallery: tiles run oldest to newest; a short mosaic first, event filters and "show all" for the rest.
  (function moments() {
    var grid = $('momentGrid'), bar = $('momentFilters'), more = $('momentMore');
    if (!grid || !bar || !more) return;
    var FIRST = 12; // fills five full rows of the mosaic
    var items = Array.prototype.slice.call(grid.querySelectorAll('.moments__item'));
    var buttons = Array.prototype.slice.call(bar.querySelectorAll('.filter'));
    var expanded = false;
    function count(set) { return set === 'all' ? items.length : items.filter(function (i) { return i.getAttribute('data-set') === set; }).length; }
    function apply(set) {
      var all = set === 'all';
      if (all) grid.removeAttribute('data-set'); else grid.setAttribute('data-set', set);
      items.forEach(function (it, n) {
        var on = all ? (expanded || n < FIRST) : it.getAttribute('data-set') === set;
        it.classList.toggle('is-hidden', !on);
      });
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-set') === set)); });
      more.hidden = !all || expanded;
    }
    buttons.forEach(function (b) {
      b.querySelector('.filter__n').textContent = count(b.getAttribute('data-set'));
      b.addEventListener('click', function () { apply(b.getAttribute('data-set')); });
    });
    more.textContent = 'Show all ' + items.length + ' moments';
    more.addEventListener('click', function () {
      expanded = true;
      apply('all');
      if (items[FIRST]) items[FIRST].focus();
    });
    bar.hidden = false;
    apply('all');
  })();

  var year = $('year');
  if (year) year.textContent = new Date().getFullYear();
})();
