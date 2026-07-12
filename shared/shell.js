/* ============================================================
   SHARED SHELL — injects the nav, accessibility panel, side-dot
   nav, footer and contact modal into every top-level page, then
   wires up all shared chrome behaviour (scroll state, language
   toggle, modal, dot-nav, section reveals, arrow-key nav, page-
   leave transition, iframe auto-height bus).

   Each page declares ONLY its own data before loading this file:

     <script>window.IH_PAGE = {
       base: '../',                 // '' for the root page, '../' for a sub-page
       active: 'about',             // which nav item is current
       sections: [{id,label}, ...], // dot-nav + arrow-key targets
       darkIds: ['about-hero']      // section ids that use a dark background
     };</script>
     <script src="../shared/shell.js"></script>

   The nav/footer/modal are injected directly into the document
   (NOT an iframe) so fixed positioning, the scroll effect and the
   dropdown all behave natively.
============================================================ */
(function () {
  var CFG = window.IH_PAGE || {};
  var base = CFG.base || '';
  var active = CFG.active || '';
  var SECTIONS = CFG.sections || [];
  var darkIds = new Set(CFG.darkIds || []);

  var isCompiled = !document.querySelector('script[src*="shell.js"]');
  if (isCompiled) {
    base = '';
  }

  function url(p) {
    if (isCompiled && p) {
      if (p.indexOf('index.html') !== -1) {
        if (p === 'index.html') return 'index.html';
        var parts = p.split('/');
        if (parts.length >= 2) {
          return parts[parts.length - 2] + '.html';
        }
      }
    }
    return base + p;
  }
  var homeHref = (active === 'home') ? '#top' : url('index.html');

  function topLink(key, label, he, page) {
    return '<li><a href="' + url(page) + '"' + (active === key ? ' class="active"' : '') + ' data-he="' + he + '">' + label + '</a></li>';
  }
  function footLink(key, label, he, page) {
    return '<a href="' + url(page) + '"' + (active === key ? ' class="active"' : '') + ' data-he="' + he + '">' + label + '</a>';
  }

  /* ---------- shared contact + program data (single source of truth) ---------- */
  var CONTACT = {
    email: 'Rh.innovationhub@gmail.com',
    phone: '+972 50-976-0346',
    phoneHref: 'tel:+972509760346',
    linkedin: 'https://il.linkedin.com/company/resilience-health-innovation-hub',
    facebook: 'https://www.facebook.com/profile.php?id=61560256910952'
  };
  var EXT = {
    shebaSderot: 'https://www.resiliencetechhub.org/sheba-sderot',
    accelerator: 'https://www.resilience-accelerator.com/',
    immediate: 'https://www.resiliencetechhub.org/blank-7'
  };
  var COMMUNITY = 'https://airtable.com/appHB9IBY4SgouZXE/pagjtsdMuzaYRU6Ft/form';
  function extLink(href, label, he) {
    return '<a href="' + href + '" target="_blank" rel="noopener noreferrer"' + (he ? ' data-he="' + he + '"' : '') + '>' + label + '</a>';
  }

  /* ---------- markup ---------- */
  var navHTML =
    '<a class="skip-link" href="#ih-main">Skip to main content</a>' +
    '<nav class="nav" id="nav" aria-label="Main navigation">' +
      '<a href="' + homeHref + '" class="brand"><img src="' + url('assets/logo.png') + '" alt="Innovation Hub logo"><span>Innovation Hub</span></a>' +
      '<ul class="nav-links">' +
        '<li><a href="' + homeHref + '"' + (active === 'home' ? ' class="active"' : '') + ' data-he="בית">Home</a></li>' +
        topLink('about', 'About', 'אודות', 'about/index.html') +
        '<li><a href="' + url('programs/index.html') + '"' + (active === 'programs' ? ' class="active"' : '') + ' data-he-html="תוכניות <span class=&quot;caret&quot;>▾</span>">Programs <span class="caret">▾</span></a>' +
          '<div class="menu">' +
            '<a href="' + url('programs/index.html') + '" data-he="סקירת התוכניות">Programs Overview</a>' +
            extLink(EXT.shebaSderot, 'Sheba to Sderot ↗', 'שיבא לשדרות ↗') +
            extLink(EXT.accelerator, 'Resilience Accelerator ↗', 'אקסלרטור החוסן ↗') +
            extLink(EXT.immediate, 'Immediate Implementation ↗', 'יישום מיידי ↗') +
          '</div>' +
        '</li>' +
        topLink('team', 'Team', 'צוות', 'team/index.html') +
        topLink('events', 'Events', 'אירועים', 'events/index.html') +
        topLink('updates', 'Updates', 'עדכונים', 'updates/index.html') +
        topLink('ecosystem', 'Ecosystem', 'אקוסיסטם', 'ecosystem/index.html') +
        '<li class="nav-cta-li"><button type="button" data-action="open-modal" data-he="צרו קשר">Contact Us</button></li>' +
      '</ul>' +
      '<div class="tools">' +
        '<button class="lang" id="langBtn" aria-label="Switch to Hebrew" title="Switch to Hebrew">עב</button>' +
        '<button class="cta-nav" data-action="open-modal" data-he="צרו קשר">Contact Us</button>' +
        '<button class="burger" aria-label="Open menu"><span></span></button>' +
      '</div>' +
    '</nav>';

  var dotnavHTML = '<nav class="dotnav" id="dotnav" aria-label="Section navigation"></nav>';

  var footerHTML =
    '<footer class="footer">' +
      '<div class="foot-grid">' +
        '<div>' +
          '<div class="foot-brand"><img src="' + url('assets/logo.png') + '" alt="">Innovation Hub</div>' +
          '<p class="foot-about" data-he="מרכז חדשנות עולמי לחוסן, ההופך את האתגרים האנושיים הקשים ביותר לדור הבא של טכנולוגיות פורצות דרך.">A global resilience innovation hub turning the hardest human challenges into the next generation of breakthrough technologies.</p>' +
          '<div class="social">' +
            '<a href="' + CONTACT.linkedin + '" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14M8.34 18.34V10.67H5.67v7.67h2.67M7 9.5a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1m11.34 8.84v-4.2c0-2.32-1.24-3.4-2.9-3.4-1.34 0-1.94.74-2.27 1.26v-1.07h-2.67v7.67h2.67v-4.28c0-.39.03-.77.14-1.04.31-.77 1.01-1.57 2.19-1.57 1.55 0 2.17 1.18 2.17 2.91v3.98h2.67"/></svg></a>' +
            '<a href="' + CONTACT.facebook + '" target="_blank" rel="noopener noreferrer" aria-label="Facebook" title="Facebook"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.91 3.78-3.91 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.57v1.88h2.78l-.45 2.9h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z"/></svg></a>' +
            '<a href="' + url('index.html') + '#ecosystem-bridge" aria-label="Watch our video" title="Watch our video"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.27 5 12 5 12 5s-6.27 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26.2 26.2 0 0 0 2 12a26.2 26.2 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.73 19 12 19 12 19s6.27 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26.2 26.2 0 0 0 22 12a26.2 26.2 0 0 0-.4-4.8M10 15V9l5.2 3-5.2 3Z"/></svg></a>' +
            '<a href="mailto:' + CONTACT.email + '" aria-label="Email us" title="Email us"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6L22 7"/></svg></a>' +
          '</div>' +
        '</div>' +
        '<div class="foot-col">' +
          '<h5 data-he="ניווט">Explore</h5>' +
          footLink('home', 'Home', 'בית', 'index.html') +
          footLink('about', 'About', 'אודות', 'about/index.html') +
          footLink('programs', 'Programs', 'תוכניות', 'programs/index.html') +
          footLink('team', 'Team', 'צוות', 'team/index.html') +
          footLink('events', 'Events', 'אירועים', 'events/index.html') +
        '</div>' +
        '<div class="foot-col">' +
          '<h5 data-he="התוכניות שלנו">Our Programs</h5>' +
          '<a href="' + url('programs/index.html') + '" data-he="קרן השקעות">Investments Fund</a>' +
          '<a href="' + url('programs/index.html') + '" data-he="מו״פ">R&amp;D</a>' +
          '<a href="' + url('programs/index.html') + '" data-he="הקמת מיזמים">Venture Creation</a>' +
          '<a href="' + url('programs/index.html') + '" data-he="תוכנית מיט״ל">MEITAL Program</a>' +
          extLink(EXT.accelerator, 'Resilience Accelerator ↗', 'אקסלרטור החוסן ↗') +
          extLink(EXT.shebaSderot, 'Sheba to Sderot ↗', 'שיבא לשדרות ↗') +
        '</div>' +
        '<div class="foot-col">' +
          '<h5 data-he="יצירת קשר">Contact</h5>' +
          '<a class="foot-contact" href="mailto:' + CONTACT.email + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6L22 7"/></svg>' + CONTACT.email + '</a>' +
          '<a class="foot-contact" href="https://maps.google.com/?q=Ahavat+Yisrael+9+Sderot" target="_blank" rel="noopener noreferrer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span data-he="אהבת ישראל 9, שדרות">Ahavat Israel 9, Sderot</span></a>' +
          '<a class="foot-contact" href="https://www.shebaonline.org/" target="_blank" rel="noopener noreferrer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span data-he="המרכז הרפואי שיבא, רמת גן">Sheba Medical Center, Ramat Gan</span></a>' +
        '</div>' +
      '</div>' +
      '<div class="foot-bottom">' +
        '<span data-he="© 2026 Innovation Hub. כל הזכויות שמורות.">© 2026 Innovation Hub. All rights reserved.</span>' +
        '<span class="credit" data-he-html="עוצב ופותח על ידי <b><a href=&quot;https://www.linkedin.com/in/shilo-shvartz/&quot; target=&quot;_blank&quot; rel=&quot;noopener noreferrer&quot; class=&quot;credit-link&quot;>Shilo Shvartz</a></b>, <b>Ori Asher</b>, <b>Shai Ozer</b>, <b>Yosef Ozeri</b>">Designed &amp; developed by <b><a href="https://www.linkedin.com/in/shilo-shvartz/" target="_blank" rel="noopener noreferrer" class="credit-link">Shilo Shvartz</a></b>, <b>Ori Asher</b>, <b>Shai Ozer</b>, <b>Yosef Ozeri</b></span>' +
      '</div>' +
    '</footer>';

  var modalHTML =
    '<div class="modal-back" id="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
      '<div class="modal-card">' +
        '<button class="close" aria-label="Close" data-action="close-modal">×</button>' +
        '<div class="star"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg></div>' +
        '<div class="tag" data-he="הצטרפו לתנועה">Join the movement</div>' +
        '<h3 id="modalTitle" data-he-html="הצטרפו אלינו בעיצוב מחדש של עתיד <span class=&quot;b&quot;>חדשנות החוסן.</span>">Join us in redefining the future of <span class="b">resilience innovation.</span></h3>' +
        '<p data-he="אנחנו תמיד מחפשים אנשי מקצוע רפואיים, יזמים, שותפים ובעלי חזון שחולקים את המשימה שלנו. דברו איתנו. בואו נבנה יחד את מה שיבוא.">We\'re always looking for clinicians, founders, partners and visionaries who share our mission. Get in touch. Let\'s build what comes next together.</p>' +
        '<div class="row">' +
          '<a class="btn-primary" href="' + COMMUNITY + '" target="_blank" rel="noopener noreferrer" data-he="הצטרפו לקהילה ←">Join our community →</a>' +
          '<a class="ghost-btn" href="' + CONTACT.linkedin + '" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center" data-he="התחברו בלינקדאין">Connect on LinkedIn</a>' +
        '</div>' +
      '</div>' +
    '</div>';

  /* ---------- accessibility effect CSS (shared with section iframes) ---------- */
  var A11Y_CSS =
    ':focus-visible{outline:3px solid #38B6FF!important;outline-offset:2px!important}' +
    'html.a11y-links a{text-decoration:underline!important;outline:2px solid #ffbf00!important;outline-offset:1px}' +
    'html.a11y-readable,html.a11y-readable *{font-family:Arial,"Helvetica Neue",Helvetica,sans-serif!important;letter-spacing:.01em!important;line-height:1.65!important}' +
    'body.reduce-motion *,html.a11y-motion *{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}';
  (function () { var s = document.createElement('style'); s.id = 'ih-a11y-css'; s.textContent = A11Y_CSS; document.head.appendChild(s); })();

  var a11yHTML =
    '<button id="a11yBtn" class="a11y-btn" aria-label="Accessibility menu" aria-haspopup="dialog" aria-expanded="false" title="נגישות">' +
      '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="3.6" r="2.1"/><path d="M20.5 8.4c-2.5.9-5.2 1.2-8.5 1.2s-6-.3-8.5-1.2l.5 2.1c1.9.7 3.8 1 5.8 1.1l-1.1 9.1 2.1.3 1.2-6.4h.5l1.2 6.4 2.1-.3-1.1-9.1c2-.1 3.9-.4 5.8-1.1l.5-2.1z"/></svg>' +
    '</button>' +
    '<div id="a11yPanel" class="a11y-panel" role="dialog" aria-modal="true" aria-labelledby="a11yTitle" hidden>' +
      '<div class="a11y-head"><h2 id="a11yTitle" data-he="תפריט נגישות">Accessibility</h2>' +
        '<button class="a11y-x" id="a11yClose" aria-label="Close accessibility menu">×</button></div>' +
      '<button class="a11y-tog" data-tog="links" aria-pressed="false"><span data-he="הדגשת קישורים">Highlight links</span></button>' +
      '<button class="a11y-tog" data-tog="readable" aria-pressed="false"><span data-he="גופן קריא">Readable font</span></button>' +
      '<button class="a11y-tog" data-tog="motion" aria-pressed="false"><span data-he="עצירת אנימציות">Pause animations</span></button>' +
      '<button class="a11y-resetall" id="a11yResetAll" data-he="איפוס הכל">Reset all</button>' +
      '<a class="a11y-statement" href="' + url('accessibility/index.html') + '" data-he="הצהרת נגישות">Accessibility statement</a>' +
    '</div>';

  document.body.insertAdjacentHTML('afterbegin', navHTML + dotnavHTML);
  document.body.insertAdjacentHTML('beforeend', footerHTML + modalHTML + a11yHTML);

  /* ---------- language toggle ---------- */
  var langBtn = document.getElementById('langBtn');
  function refreshLangBtn() {
    if (!langBtn) return;
    var he = curLang() === 'he';
    langBtn.textContent = he ? 'EN' : 'עב';
    langBtn.setAttribute('aria-label', he ? 'Switch to English' : 'Switch to Hebrew');
    langBtn.setAttribute('title', he ? 'Switch to English' : 'עברית');
  }
  /* translate the just-injected chrome to the stored language, then sync the button */
  if (window.IHI18N) IHI18N.apply(IHI18N.stored() || 'en');
  refreshLangBtn();
  if (langBtn) {
    langBtn.addEventListener('click', function () {
      var next = curLang() === 'he' ? 'en' : 'he';
      if (window.IHI18N) IHI18N.set(next);
      refreshLangBtn();
      broadcastLang();
    });
  }

  /* ---------- mobile menu (burger) ---------- */
  var burger = document.querySelector('.burger');
  var navEl = document.getElementById('nav');
  function setMenu(open) {
    if (!navEl || !burger) return;
    navEl.classList.toggle('menu-open', open);
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  function closeMenu() { setMenu(false); }
  if (burger && navEl) {
    burger.setAttribute('aria-expanded', 'false');
    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      setMenu(!navEl.classList.contains('menu-open'));
    });
    /* close after tapping a real navigation link (but not the Programs parent
       that only expands its sub-menu) */
    navEl.addEventListener('click', function (e) {
      var a = e.target.closest('.nav-links a');
      if (a && a.getAttribute('href') && a.getAttribute('href').charAt(0) !== '#') closeMenu();
    });
    document.addEventListener('click', function (e) {
      if (navEl.classList.contains('menu-open') && !navEl.contains(e.target)) closeMenu();
    });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    addEventListener('resize', function () { if (innerWidth > 1200) closeMenu(); }, { passive: true });
  }

  /* skip-link target: first content screen */
  var firstScreen = document.querySelector('.screen, main, section');
  if (firstScreen && !document.getElementById('ih-main')) {
    firstScreen.insertAdjacentHTML('beforebegin', '<span id="ih-main" tabindex="-1"></span>');
  }

  /* ---------- page-leave transition for internal navigation ---------- */
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  function leave(go) {
    if (reduce) { go(); return; }
    document.body.classList.add('ih-leaving');
    setTimeout(go, 220);
  }
  window.ihLeave = leave;
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    if (a.target && a.target !== '_self') return;
    if (/^(mailto:|tel:|javascript:|https?:)/i.test(href)) return;
    if (href.indexOf('.html') === -1) return;
    e.preventDefault();
    leave(function () { window.location.href = a.href; });
  }, true);
  window.addEventListener('pageshow', function (ev) { if (ev.persisted) document.body.classList.remove('ih-leaving'); });

  /* ---------- iframe registry + messaging ---------- */
  var frames = {};
  document.querySelectorAll('iframe[data-id]').forEach(function (f) { frames[f.dataset.id] = f; });
  function post(frame, msg) { if (frame && frame.contentWindow) { try { frame.contentWindow.postMessage(msg, '*'); } catch (e) {} } }

  /* ---------- language (EN ⇄ HE) shared with section iframes ---------- */
  function curLang() { return (window.IHI18N && IHI18N.get()) || 'en'; }
  function sendLangTo(frame) { post(frame, { t: 'ih:lang', lang: curLang() }); }
  function broadcastLang() { Object.keys(frames).forEach(function (k) { sendLangTo(frames[k]); }); }

  /* resolve a root-relative nav target to this page's depth */
  function resolveTarget(to) {
    var t = to.replace(/^(\.\.\/)+/, '');
    return url(t);
  }

  var visible = new Set();
  addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.t === 'ih:h') { var f = frames[d.id]; if (f && !f.hasAttribute('data-fixed')) f.style.height = d.h + 'px'; }
    else if (d.t === 'ih:ready') { var fr = frames[d.id]; if (fr) { sendLangTo(fr); if (window.__a11yApplyFrame) window.__a11yApplyFrame(fr); if (visible.has(d.id)) post(fr, { t: 'ih:enter' }); } }
    else if (d.t === 'ih:key') { moveSection(d.key); }
    else if (d.t === 'ih:nav') {
      if (d.to.indexOf('.html') !== -1) {
        var target = resolveTarget(d.to);
        ihLeave(function () { window.location.href = target; });
      } else {
        scrollToId(d.to);
      }
    }
    else if (d.t === 'ih:modal') { openModal(); }
  });

  /* ---------- enter/leave reveals ---------- */
  var io = new IntersectionObserver(function (ents) {
    ents.forEach(function (en) {
      var f = en.target.querySelector('iframe'); if (!f) return;
      var id = f.dataset.id;
      if (en.isIntersecting) { if (!visible.has(id)) { visible.add(id); post(f, { t: 'ih:enter' }); } }
      else if (visible.has(id)) { visible.delete(id); post(f, { t: 'ih:leave' }); }
    });
  }, { threshold: 0.01 });
  document.querySelectorAll('.screen').forEach(function (s) { io.observe(s); });

  /* ---------- nav scroll state ---------- */
  var nav = document.getElementById('nav');
  addEventListener('scroll', function () { nav.classList.toggle('scrolled', scrollY > 40); }, { passive: true });

  /* ---------- modal ---------- */
  var modal = document.getElementById('modal');
  function openModal() { closeMenu(); modal.classList.add('open'); document.body.classList.add('no-scroll'); }
  function closeModal() { modal.classList.remove('open'); document.body.classList.remove('no-scroll'); }
  document.querySelectorAll('[data-action="open-modal"]').forEach(function (b) { b.addEventListener('click', openModal); });
  document.querySelectorAll('[data-action="close-modal"]').forEach(function (b) { b.addEventListener('click', closeModal); });
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  /* ---------- accessibility panel ---------- */
  var A11Y_KEY = 'ihA11y';
  var a11y = { links: false, readable: false, motion: false };
  try { a11y = Object.assign(a11y, JSON.parse(localStorage.getItem(A11Y_KEY) || '{}')); } catch (e) {}

  function a11yApplyLocal() {
    var h = document.documentElement, b = document.body;
    h.classList.toggle('a11y-links', a11y.links);
    h.classList.toggle('a11y-readable', a11y.readable);
    h.classList.toggle('a11y-motion', a11y.motion);
    b.classList.toggle('reduce-motion', a11y.motion);
  }
  /* same-origin iframes: inject the a11y stylesheet + classes straight into each */
  function a11yApplyToFrame(frame) {
    try {
      var doc = frame && frame.contentDocument; if (!doc || !doc.documentElement) return;
      var st = doc.getElementById('ih-a11y-css');
      if (!st) { st = doc.createElement('style'); st.id = 'ih-a11y-css'; st.textContent = A11Y_CSS; (doc.head || doc.documentElement).appendChild(st); }
      var h = doc.documentElement, b = doc.body;
      h.classList.toggle('a11y-links', a11y.links);
      h.classList.toggle('a11y-readable', a11y.readable);
      h.classList.toggle('a11y-motion', a11y.motion);
      if (b) b.classList.toggle('reduce-motion', a11y.motion);
      /* the readable font changes text height — nudge the frame to re-measure so
         the iframe grows to fit (no zoom here, so there's no vh feedback loop) */
      var win = frame.contentWindow;
      if (win) {
        try {
          if (typeof win.__frameReport === 'function') win.__frameReport();
          else if (win.dispatchEvent && win.Event) win.dispatchEvent(new win.Event('resize'));
        } catch (e) {}
      }
    } catch (e) {}
  }
  window.__a11yApplyFrame = a11yApplyToFrame;
  function a11yBroadcast() { Object.keys(frames).forEach(function (k) { a11yApplyToFrame(frames[k]); }); }
  function a11ySyncUI() {
    document.querySelectorAll('.a11y-tog').forEach(function (btn) {
      var on = !!a11y[btn.dataset.tog];
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function a11yApply(save) {
    a11yApplyLocal(); a11yBroadcast(); a11ySyncUI();
    if (save !== false) { try { localStorage.setItem(A11Y_KEY, JSON.stringify(a11y)); } catch (e) {} }
  }

  var a11yBtn = document.getElementById('a11yBtn');
  var a11yPanel = document.getElementById('a11yPanel');
  function a11yOpen(o) {
    a11yPanel.hidden = !o;
    a11yBtn.setAttribute('aria-expanded', o ? 'true' : 'false');
    if (o) { var c = document.getElementById('a11yClose'); if (c) c.focus(); } else { a11yBtn.focus(); }
  }
  if (a11yBtn && a11yPanel) {
    a11yBtn.addEventListener('click', function () { a11yOpen(a11yPanel.hidden); });
    document.getElementById('a11yClose').addEventListener('click', function () { a11yOpen(false); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && !a11yPanel.hidden) a11yOpen(false); });
    document.addEventListener('click', function (e) {
      if (!a11yPanel.hidden && !a11yPanel.contains(e.target) && !a11yBtn.contains(e.target)) a11yOpen(false);
    });
    document.querySelectorAll('.a11y-tog').forEach(function (btn) {
      btn.addEventListener('click', function () { a11y[btn.dataset.tog] = !a11y[btn.dataset.tog]; a11yApply(); });
    });
    document.getElementById('a11yResetAll').addEventListener('click', function () { a11y = { links: false, readable: false, motion: false }; a11yApply(); });
    a11yApply(false); /* apply stored prefs on load */
  }

  /* ---------- side dot nav + arrow-key navigation ---------- */
  var els = SECTIONS.map(function (s) { return document.getElementById(s.id); });
  var dotnav = document.getElementById('dotnav');
  dotnav.innerHTML = SECTIONS.map(function (s, i) { return '<button data-i="' + i + '" data-label="' + s.label + '" aria-label="' + s.label + '"></button>'; }).join('');
  var dots = [].slice.call(dotnav.querySelectorAll('button'));
  function scrollToId(id) { var el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
  dots.forEach(function (d, i) { d.addEventListener('click', function () { if (els[i]) els[i].scrollIntoView({ behavior: 'smooth' }); }); });
  function currentIndex() {
    var mid = scrollY + innerHeight * 0.4; var idx = 0;
    els.forEach(function (el, i) { if (el && el.offsetTop <= mid) idx = i; });
    return idx;
  }
  function syncDots() {
    var idx = currentIndex();
    dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
    if (SECTIONS[idx]) dotnav.classList.toggle('on-dark', darkIds.has(SECTIONS[idx].id));
  }
  syncDots();
  addEventListener('scroll', syncDots, { passive: true });
  addEventListener('resize', syncDots, { passive: true });

  var locking = false;
  function moveSection(key) {
    if (locking) return; locking = true; setTimeout(function () { locking = false; }, 650);
    var idx = currentIndex();
    var dir = (key === 'ArrowDown' || key === 'PageDown') ? 1 : -1;
    var next = Math.max(0, Math.min(els.length - 1, idx + dir));
    if (els[next]) els[next].scrollIntoView({ behavior: 'smooth' });
  }
  addEventListener('keydown', function (e) {
    if (['ArrowDown', 'PageDown', 'ArrowUp', 'PageUp'].indexOf(e.key) !== -1) {
      var tag = document.activeElement && document.activeElement.tagName;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
      e.preventDefault(); moveSection(e.key);
    }
  });
})();
