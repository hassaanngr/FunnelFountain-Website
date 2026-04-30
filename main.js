/* =========================================================
   FunnelFountain — Global JS
   - Injects header, footer, and mobile CTA bar
   - Scroll behaviors
   - Counter animation (IntersectionObserver)
   - Reveal-on-scroll (IntersectionObserver)
   ========================================================= */

(() => {
  'use strict';

  /* ---------- Path helpers ---------- */
  // Use data-depth on <body> for reliable depth across file:// and http://.
  // file:// on Windows includes the drive letter in pathname which breaks
  // the computed length, so we always read the explicit attribute instead.
  const depth = parseInt(document.body.dataset.depth || '0', 10);
  const root = depth > 0 ? '../'.repeat(depth) : './';
  const asset = (p) => root + p.replace(/^\/+/, '');

  /* ---------- SVG icon library ---------- */
  const ICONS = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.5 9.87v-6.99H8v-2.88h2.5V9.83c0-2.47 1.49-3.83 3.74-3.83 1.08 0 2.21.19 2.21.19v2.43h-1.24c-1.23 0-1.61.76-1.61 1.54V12H16l-.43 2.88h-2.07v6.99A10 10 0 0 0 22 12z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14C2.24 0 0 2.24 0 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5V5c0-2.76-2.24-5-5-5zM8 19H5V8h3v11zM6.5 6.73C5.51 6.73 4.7 5.92 4.7 4.93s.81-1.8 1.8-1.8 1.8.81 1.8 1.8-.81 1.8-1.8 1.8zM20 19h-3v-5.6c0-1.34-.48-2.25-1.68-2.25-.92 0-1.46.62-1.7 1.21-.09.21-.11.5-.11.8V19h-3V8h3v1.27c.4-.62 1.11-1.51 2.7-1.51 1.97 0 3.45 1.29 3.45 4.06V19z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2H21l-6.46 7.39L22 22h-6.59l-4.58-6.04L5.5 22H2.74l6.92-7.92L2 2h6.74l4.14 5.49L18.244 2zm-2.31 18h1.83L7.18 4h-1.9l10.66 16z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    google: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10A15.3 15.3 0 0 1 8 12 15.3 15.3 0 0 1 12 2z"/><line x1="2" y1="12" x2="22" y2="12"/></svg>',
    meta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
    social: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    ai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 8v8M15 8v8M9 12h6"/></svg>',
  };

  /* ---------- Service registry (shared by nav, dropdown, footer) ---------- */
  const SERVICES = [
    { slug: 'google-ads',   title: 'Google Ads',                 icon: 'google' },
    { slug: 'meta-ads',     title: 'Meta Ads',                   icon: 'meta'   },
    { slug: 'social-media', title: 'Social Media Management',    icon: 'social' },
    { slug: 'ai-automation',title: 'AI Automation',              icon: 'ai'     },
  ];

  /* ---------- Header ---------- */
  function buildHeader(active) {
    const dropdownItems = SERVICES.map(s => `
      <a href="${asset(s.slug + '.html')}">
        <span class="dropdown__icon">${ICONS[s.icon]}</span>
        <span>
          <span class="dropdown__title">${s.title}</span>
        </span>
      </a>
    `).join('');

    const subList = SERVICES.map(s =>
      `<a href="${asset(s.slug + '.html')}">${s.title}</a>`
    ).join('');

    const caretSVG = '<svg class="dropdown-caret" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 4.5 6 7.5 9 4.5"/></svg>';

    const logoSrc = asset('Assets/FunnelFountain White Text Logo Transparent.png').replace(/ /g, '%20');

    const html = `
      <header class="site-header" id="siteHeader">
        <div class="container site-header__inner">
          <a href="${asset('index.html')}" class="site-header__logo" aria-label="FunnelFountain home">
            <img src="${logoSrc}" alt="FunnelFountain" />
          </a>
          <nav class="site-nav" aria-label="Primary">
            <a href="${asset('index.html')}" class="${active === 'home' ? 'is-active' : ''}">Home</a>
            <span class="has-dropdown">
              <a href="${asset('services.html')}" class="dropdown-toggle ${active === 'services' ? 'is-active' : ''}">Services${caretSVG}</a>
              <div class="dropdown" role="menu">
                ${dropdownItems}
              </div>
            </span>
            <a href="${asset('about.html')}" class="${active === 'about' ? 'is-active' : ''}">About</a>
            <a href="${asset('contact.html')}" class="${active === 'contact' ? 'is-active' : ''}">Contact</a>
          </nav>
          <div class="site-header__ctas">
            <a href="${asset('contact.html')}" class="btn btn--outline">Contact Us</a>
            <a href="${asset('contact.html#book')}" class="btn btn--gold">Schedule a Call</a>
            <button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false">
              <span></span>
            </button>
          </div>
        </div>
      </header>
      <div class="mobile-drawer" id="mobileDrawer" aria-hidden="true">
        <a href="${asset('index.html')}">Home</a>
        <div class="drawer-group">
          <a href="${asset('services.html')}">Services</a>
          <div class="drawer-sub">
            ${subList}
          </div>
        </div>
        <a href="${asset('about.html')}">About</a>
        <a href="${asset('contact.html')}">Contact</a>
        <div style="display:flex;gap:12px;margin-top:24px;">
          <a href="${asset('contact.html')}" class="btn btn--outline">Contact</a>
          <a href="${asset('contact.html#book')}" class="btn btn--gold">Schedule a Call</a>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', html);
  }

  /* ---------- Footer ---------- */
  function buildFooter() {
    const logoSrc = asset('Assets/FunnelFountain White Text Logo Transparent.png').replace(/ /g, '%20');
    const html = `
      <footer class="site-footer">
        <div class="container">
          <div class="site-footer__top">
            <div class="site-footer__brand">
              <img src="${logoSrc}" alt="FunnelFountain" />
              <p>[FOOTER_TAGLINE: INSERT BRAND TAGLINE — ONE SHORT SENTENCE DESCRIBING WHAT YOU DO]</p>
            </div>
            <div class="footer-col">
              <h4>Company</h4>
              <ul>
                <li><a href="${asset('about.html')}">About</a></li>
                <li><a href="${asset('services.html')}">Services</a></li>
                <li><a href="${asset('contact.html')}">Contact</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h4>Services</h4>
              <ul>
                <li><a href="${asset('services.html#google-ads')}">Google Ads</a></li>
                <li><a href="${asset('services.html#meta-ads')}">Meta Ads</a></li>
                <li><a href="${asset('services.html#social')}">Social Media</a></li>
                <li><a href="${asset('services.html#ai')}">AI Automation</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h4>Get in touch</h4>
              <ul>
                <li><a href="mailto:[FOOTER_EMAIL_PLACEHOLDER]">[FOOTER_EMAIL_PLACEHOLDER]</a></li>
                <li><a href="tel:[FOOTER_PHONE_PLACEHOLDER]">[FOOTER_PHONE_PLACEHOLDER]</a></li>
                <li><a href="${asset('contact.html#book')}">Book a Strategy Call</a></li>
              </ul>
            </div>
          </div>
          <div class="site-footer__bottom">
            <span>© <span id="copyYear"></span> FunnelFountain. [FOOTER_COPYRIGHT_NOTE: ALL RIGHTS RESERVED]</span>
            <div class="socials" aria-label="Social links">
              <a href="[SOCIAL_INSTAGRAM_URL]" aria-label="Instagram">${ICONS.instagram}</a>
              <a href="[SOCIAL_FACEBOOK_URL]" aria-label="Facebook">${ICONS.facebook}</a>
              <a href="[SOCIAL_LINKEDIN_URL]" aria-label="LinkedIn">${ICONS.linkedin}</a>
              <a href="[SOCIAL_X_URL]" aria-label="X (Twitter)">${ICONS.x}</a>
            </div>
          </div>
        </div>
      </footer>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    const y = document.getElementById('copyYear');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- Mobile CTA bar ---------- */
  function buildMobileCTA() {
    const html = `
      <div class="mobile-cta-bar" role="navigation" aria-label="Mobile actions">
        <a href="${asset('contact.html')}" class="btn btn--outline">Contact</a>
        <a href="${asset('contact.html#book')}" class="btn btn--gold">Book a Call</a>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  /* ---------- Scroll behaviors ---------- */
  function initScroll() {
    const header = document.getElementById('siteHeader');
    const onScroll = () => {
      if (window.scrollY > 24) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    };
    onScroll();
    // passive listener — necessary for header state, not animation
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  function initMobileMenu() {
    const toggle = document.getElementById('navToggle');
    const drawer = document.getElementById('mobileDrawer');
    if (!toggle || !drawer) return;
    toggle.addEventListener('click', () => {
      const open = drawer.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      drawer.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      drawer.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }));
  }

  /* ---------- Counter animation ---------- */
  function initCounters() {
    const els = document.querySelectorAll('[data-counter]');
    if (!els.length || !('IntersectionObserver' in window)) {
      els.forEach(el => el.textContent = el.dataset.counter + (el.dataset.suffix || ''));
      return;
    }
    const animate = (el) => {
      const target = parseFloat(el.dataset.counter);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const duration = 1600;
      const start = performance.now();
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const v = target * easeOut(t);
        const display = target % 1 === 0 ? Math.floor(v) : v.toFixed(1);
        el.textContent = prefix + display + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    els.forEach(el => obs.observe(el));
  }

  /* ---------- Reveal-on-scroll ---------- */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => obs.observe(el));
  }

  /* ---------- Bootstrap ---------- */
  function init() {
    const active = document.body.dataset.page || '';
    buildHeader(active);
    buildFooter();
    buildMobileCTA();
    initScroll();
    initMobileMenu();
    initCounters();
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose icon library for inline use on pages.
  window.FF = { ICONS, asset };
})();
