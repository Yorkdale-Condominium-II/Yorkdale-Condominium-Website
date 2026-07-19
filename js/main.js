(function () {
  'use strict';

  var hamburger      = document.getElementById('hamburger');
  var mainNav        = document.getElementById('main-nav');
  var heroBtnEl      = document.getElementById('hero-portal-btn');
  var navBtnEl       = document.getElementById('nav-portal-btn');
  var portalTip      = document.getElementById('portal-tip');
  var navLinks       = document.querySelectorAll('.nav-link');
  var header         = document.getElementById('site-header');
  var portalBtns     = [heroBtnEl, navBtnEl].filter(Boolean);

  var PORTAL_KEY     = 'ycii_portalVisited';
  var THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  /* ---- Mobile nav toggle ---- */
  if (hamburger && mainNav) {
    hamburger.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      hamburger.setAttribute('aria-expanded', String(open));
    });

    mainNav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        document.body.classList.remove('nav-open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !mainNav.contains(e.target)) {
        document.body.classList.remove('nav-open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- Sticky header shadow ---- */
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  /* ---- Smart portal button (localStorage returning-visitor) ---- */
  function markPortalVisit() {
    try { localStorage.setItem(PORTAL_KEY, String(Date.now())); } catch (_) {}
  }

  function checkReturningVisitor() {
    var ts;
    try { ts = parseInt(localStorage.getItem(PORTAL_KEY), 10); } catch (_) { return; }
    if (!ts || (Date.now() - ts) > THIRTY_DAYS_MS) return;

    if (heroBtnEl) heroBtnEl.textContent = 'Return to Resident Portal →';
    if (portalTip) portalTip.hidden = false;
  }

  portalBtns.forEach(function (btn) {
    btn.addEventListener('click', markPortalVisit);
  });

  checkReturningVisitor();

  /* ---- Active nav highlight (IntersectionObserver) ---- */
  var sections = document.querySelectorAll('section[id]');

  if ('IntersectionObserver' in window && sections.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var targetId = '#' + entry.target.id;
          navLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === targetId);
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    sections.forEach(function (s) { observer.observe(s); });
  }

  /* ---- Contact form: mailto fallback message ---- */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      /* Form action is mailto: — browser handles it. No preventDefault needed.
         We just close any mobile nav in case it is open. */
      document.body.classList.remove('nav-open');
    });
  }

})();
