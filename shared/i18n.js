/* ============================================================
   I18N — lightweight, self-contained English ⇄ Hebrew switch
   with controlled RTL. Loaded in every top-level page AND in
   every section iframe (before shell.js on parent pages).

   How content is translated: each element carries its Hebrew
   text next to it, and the engine swaps it in/out, keeping the
   original English so toggling back is lossless.

     • plain text:   <h2 data-he="שלום">Hello</h2>
     • inline markup: <h1 data-he-html='...<span>...'>Hello <span>x</span></h1>
     • attributes:   <img data-he-alt="תיאור" alt="desc">
                     (also data-he-title / -placeholder / -aria-label)

   RTL is applied by setting <html dir="rtl">, plus a small
   injected stylesheet that switches to a Hebrew-first font stack
   and neutralises the Latin-tuned negative letter-spacing — the
   layout itself is left to flow naturally rather than force-
   mirrored, so nothing "breaks".

   Language is stored in localStorage and, for iframes, also
   pushed down from the parent via an 'ih:lang' postMessage so it
   works even where iframe storage is restricted (e.g. file://).
============================================================ */
(function () {
  var STORE = 'ih-lang';
  var current = 'en';

  function getStored() { try { return localStorage.getItem(STORE) || ''; } catch (e) { return ''; } }
  function setStored(l) { try { localStorage.setItem(STORE, l); } catch (e) {} }

  /* inject the Hebrew/RTL stylesheet once per document */
  function ensureStyle() {
    if (document.getElementById('ih-rtl-style')) return;
    /* Force a Hebrew-first font everywhere in RTL. The design hard-codes Latin
       display fonts (Manrope/Sora/Newsreader/Fraunces) on headings — none of
       which carry Hebrew glyphs — so without this, Hebrew text would fall back
       to a browser default. Heebo also renders Latin cleanly, so brand words
       kept in English stay consistent. Latin-tuned negative letter-spacing is
       neutralised (it looks wrong on Hebrew). The site uses inline SVG icons,
       not an icon font, so the universal font override is safe. */
    var css =
      "html[dir=rtl] *{font-family:'Heebo','Assistant','Manrope',system-ui,sans-serif!important;" +
        "letter-spacing:normal!important}";
    var s = document.createElement('style');
    s.id = 'ih-rtl-style';
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }

  var ATTRS = ['alt', 'title', 'placeholder', 'aria-label'];

  function swapText(el, lang) {
    if (el.getAttribute('data-en') === null) el.setAttribute('data-en', el.textContent);
    el.textContent = (lang === 'he') ? el.getAttribute('data-he') : el.getAttribute('data-en');
  }
  function swapHtml(el, lang) {
    if (el.getAttribute('data-en-html') === null) el.setAttribute('data-en-html', el.innerHTML);
    el.innerHTML = (lang === 'he') ? el.getAttribute('data-he-html') : el.getAttribute('data-en-html');
  }
  function swapAttrs(el, lang) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i], key = 'data-he-' + a, enKey = 'data-en-' + a;
      if (!el.hasAttribute(key)) continue;
      if (!el.hasAttribute(enKey)) el.setAttribute(enKey, el.getAttribute(a) || '');
      el.setAttribute(a, (lang === 'he') ? el.getAttribute(key) : el.getAttribute(enKey));
    }
  }

  function apply(lang) {
    current = (lang === 'he') ? 'he' : 'en';
    ensureStyle();
    var root = document.documentElement;
    root.setAttribute('lang', current);
    root.setAttribute('dir', current === 'he' ? 'rtl' : 'ltr');
    if (document.body) document.body.classList.toggle('lang-he', current === 'he');

    /* inline-markup swaps first (they replace their subtree wholesale), then
       plain text, then attributes */
    var html = document.querySelectorAll('[data-he-html]');
    for (var i = 0; i < html.length; i++) swapHtml(html[i], current);
    var text = document.querySelectorAll('[data-he]');
    for (i = 0; i < text.length; i++) swapText(text[i], current);
    var attr = document.querySelectorAll('[data-he-alt],[data-he-title],[data-he-placeholder],[data-he-aria-label]');
    for (i = 0; i < attr.length; i++) swapAttrs(attr[i], current);

    /* let an iframe re-measure its height after the text (and its wrapping) changed */
    if (typeof window.__frameReport === 'function') { try { window.__frameReport(); } catch (e) {} }
  }

  window.IHI18N = {
    apply: apply,
    get: function () { return current; },
    set: function (l) { setStored(l); apply(l); },
    stored: getStored
  };

  /* iframe: apply what the parent pushes down */
  window.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d && d.t === 'ih:lang') apply(d.lang);
  });

  function boot() { apply(getStored() || 'en'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
