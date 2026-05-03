/* =========================================================
   FunnelFountain — Global JS
   - Injects header, footer, and mobile CTA bar
   - Fetches /content/*.json and applies CMS content to DOM
   - Scroll behaviours, counter animation, reveal-on-scroll
   ========================================================= */

(() => {
  'use strict';

  /* -------------------------------------------------------
     Path helpers
     data-depth on <body> avoids Windows file:// drive-letter
     inflation that breaks relative paths.
  ------------------------------------------------------- */
  const depth = parseInt(document.body.dataset.depth || '0', 10);
  const root  = depth > 0 ? '../'.repeat(depth) : './';
  const asset = (p) => root + p.replace(/^\/+/, '');

  /* -------------------------------------------------------
     Content helpers
  ------------------------------------------------------- */

  async function fetchJSON(path) {
    const res = await fetch(asset(path), { cache: 'no-store' });
    if (!res.ok) throw new Error(`${res.status} fetching ${path}`);
    return res.json();
  }

  // Set textContent of first matching element
  function setText(sel, val) {
    if (val == null || val === '') return;
    const el = document.querySelector(sel);
    if (el) el.textContent = val;
  }

  // Set a meta tag's content attribute
  function setMeta(selector, val) {
    if (!val) return;
    const el = document.querySelector(selector);
    if (el) el.setAttribute('content', val);
  }

  // XSS-safe HTML escape for values inserted via innerHTML
  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Build FAQ accordion HTML from an array of {question, answer} objects
  function buildFaqHTML(faqs) {
    return (faqs || []).map(f => `
      <details class="faq-item">
        <summary>${esc(f.question)}</summary>
        <div class="faq-item__body">${esc(f.answer)}</div>
      </details>`).join('');
  }

  // Build benefit list items from an array of strings (or {item} objects)
  function buildBenefitListHTML(benefits) {
    return (benefits || []).map(b => {
      const text = (b && typeof b === 'object') ? (b.item || '') : (b || '');
      return `<li>${esc(text)}</li>`;
    }).join('');
  }

  // Five gold stars HTML (reused across testimonial cards)
  const STARS_HTML = Array(5).fill(
    '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
  ).join('');

  /* -------------------------------------------------------
     SVG icon library
  ------------------------------------------------------- */
  const ICONS = {
    arrow:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    star:      '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"/></svg>',
    facebook:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.5 9.87v-6.99H8v-2.88h2.5V9.83c0-2.47 1.49-3.83 3.74-3.83 1.08 0 2.21.19 2.21.19v2.43h-1.24c-1.23 0-1.61.76-1.61 1.54V12H16l-.43 2.88h-2.07v6.99A10 10 0 0 0 22 12z"/></svg>',
    linkedin:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14C2.24 0 0 2.24 0 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5V5c0-2.76-2.24-5-5-5zM8 19H5V8h3v11zM6.5 6.73C5.51 6.73 4.7 5.92 4.7 4.93s.81-1.8 1.8-1.8 1.8.81 1.8 1.8-.81 1.8-1.8 1.8zM20 19h-3v-5.6c0-1.34-.48-2.25-1.68-2.25-.92 0-1.46.62-1.7 1.21-.09.21-.11.5-.11.8V19h-3V8h3v1.27c.4-.62 1.11-1.51 2.7-1.51 1.97 0 3.45 1.29 3.45 4.06V19z"/></svg>',
    x:         '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2H21l-6.46 7.39L22 22h-6.59l-4.58-6.04L5.5 22H2.74l6.92-7.92L2 2h6.74l4.14 5.49L18.244 2zm-2.31 18h1.83L7.18 4h-1.9l10.66 16z"/></svg>',
    mail:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    phone:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    pin:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    google:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10A15.3 15.3 0 0 1 8 12 15.3 15.3 0 0 1 12 2z"/><line x1="2" y1="12" x2="22" y2="12"/></svg>',
    meta:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
    social:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    ai:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 8v8M15 8v8M9 12h6"/></svg>',
  };

  /* -------------------------------------------------------
     Service registry
     Drives nav dropdown, mobile drawer, and footer links.
     SERVICE_IDS maps JSON slug → HTML anchor id (used on
     services.html where ids differ from slugs).
  ------------------------------------------------------- */
  const SERVICES = [
    { slug: 'google-ads',    title: 'Google Ads',                icon: 'google' },
    { slug: 'meta-ads',      title: 'Meta Ads',                  icon: 'meta'   },
    { slug: 'social-media',  title: 'Social Media Management',   icon: 'social' },
    { slug: 'ai-automation', title: 'AI Automation',             icon: 'ai'     },
  ];

  const SERVICE_IDS = {
    'google-ads':    'google-ads',
    'meta-ads':      'meta-ads',
    'social-media':  'social',
    'ai-automation': 'ai',
  };

  // Reverse map: HTML anchor id → JSON slug
  const ID_TO_SLUG = Object.fromEntries(
    Object.entries(SERVICE_IDS).map(([slug, id]) => [id, slug])
  );

  /* -------------------------------------------------------
     Header
  ------------------------------------------------------- */
  function buildHeader(active) {
    const dropdownItems = SERVICES.map(s => `
      <a href="${asset(s.slug + '.html')}">
        <span class="dropdown__icon">${ICONS[s.icon]}</span>
        <span><span class="dropdown__title">${s.title}</span></span>
      </a>`).join('');

    const subList = SERVICES.map(s =>
      `<a href="${asset(s.slug + '.html')}">${s.title}</a>`
    ).join('');

    const caretSVG = '<svg class="dropdown-caret" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 4.5 6 7.5 9 4.5"/></svg>';
    const logoSrc  = asset('Assets/FunnelFountain White Text Logo Transparent.png').replace(/ /g, '%20');

    document.body.insertAdjacentHTML('afterbegin', `
      <header class="site-header" id="siteHeader">
        <div class="container site-header__inner">
          <a href="${asset('index.html')}" class="site-header__logo" aria-label="FunnelFountain home">
            <img src="${logoSrc}" alt="FunnelFountain" />
          </a>
          <nav class="site-nav" aria-label="Primary">
            <a href="${asset('index.html')}" class="${active === 'home' ? 'is-active' : ''}">Home</a>
            <span class="has-dropdown">
              <a href="${asset('services.html')}" class="dropdown-toggle ${active === 'services' ? 'is-active' : ''}">Services${caretSVG}</a>
              <div class="dropdown" role="menu">${dropdownItems}</div>
            </span>
            <a href="${asset('about.html')}" class="${active === 'about' ? 'is-active' : ''}">About</a>
            <a href="${asset('contact.html')}" class="${active === 'contact' ? 'is-active' : ''}">Contact</a>
          </nav>
          <div class="site-header__ctas">
            <a href="${asset('contact.html')}" class="btn btn--outline">Contact Us</a>
            <a href="${asset('contact.html#book')}" class="btn btn--gold">Schedule a Call</a>
            <button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false"><span></span></button>
          </div>
        </div>
      </header>
      <div class="mobile-drawer" id="mobileDrawer" aria-hidden="true">
        <a href="${asset('index.html')}">Home</a>
        <div class="drawer-group">
          <a href="${asset('services.html')}">Services</a>
          <div class="drawer-sub">${subList}</div>
        </div>
        <a href="${asset('about.html')}">About</a>
        <a href="${asset('contact.html')}">Contact</a>
        <div style="display:flex;gap:12px;margin-top:24px;">
          <a href="${asset('contact.html')}" class="btn btn--outline">Contact</a>
          <a href="${asset('contact.html#book')}" class="btn btn--gold">Schedule a Call</a>
        </div>
      </div>`);
  }

  /* -------------------------------------------------------
     Footer — accepts live data so placeholders never render
  ------------------------------------------------------- */
  function buildFooter(globalData = {}, contactData = {}) {
    const tagline   = globalData.tagline        || '';
    const copyright = globalData.copyright_note || 'All rights reserved.';
    const social    = globalData.social         || {};
    const email     = contactData.email         || '';
    const phone     = contactData.phone         || '';
    const logoSrc   = asset('Assets/FunnelFountain White Text Logo Transparent.png').replace(/ /g, '%20');

    const socialLink = (key, label) => {
      const href = social[key] || '#';
      return `<a href="${esc(href)}" aria-label="${label}">${ICONS[key]}</a>`;
    };

    document.body.insertAdjacentHTML('beforeend', `
      <footer class="site-footer">
        <div class="container">
          <div class="site-footer__top">
            <div class="site-footer__brand">
              <img src="${logoSrc}" alt="FunnelFountain" />
              <p>${esc(tagline)}</p>
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
                ${email ? `<li><a href="mailto:${esc(email)}">${esc(email)}</a></li>` : ''}
                ${phone ? `<li><a href="tel:${esc(phone)}">${esc(phone)}</a></li>` : ''}
                <li><a href="${asset('contact.html#book')}">Book a Strategy Call</a></li>
              </ul>
            </div>
          </div>
          <div class="site-footer__bottom">
            <span>&copy; <span id="copyYear"></span> FunnelFountain. ${esc(copyright)}</span>
            <div class="socials" aria-label="Social links">
              ${socialLink('instagram', 'Instagram')}
              ${socialLink('facebook', 'Facebook')}
              ${socialLink('linkedin', 'LinkedIn')}
              ${socialLink('x', 'X (Twitter)')}
            </div>
          </div>
        </div>
      </footer>`);

    const y = document.getElementById('copyYear');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* -------------------------------------------------------
     Mobile CTA bar
  ------------------------------------------------------- */
  function buildMobileCTA() {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="mobile-cta-bar" role="navigation" aria-label="Mobile actions">
        <a href="${asset('contact.html')}" class="btn btn--outline">Contact</a>
        <a href="${asset('contact.html#book')}" class="btn btn--gold">Book a Call</a>
      </div>`);
  }

  /* -------------------------------------------------------
     Content apply — Homepage (index.html)
     Binds homepage.json + blurbs from services.json
  ------------------------------------------------------- */
  function applyHomepage(home, services) {
    // SEO meta
    if (home.seo) {
      if (home.seo.meta_title) document.title = home.seo.meta_title;
      setMeta('meta[name="description"]',       home.seo.meta_description);
      setMeta('meta[property="og:title"]',      home.seo.og_title);
      setMeta('meta[property="og:description"]',home.seo.og_description);
    }

    // Hero
    setText('.hero .eyebrow',  home.hero_eyebrow);
    setText('.hero h1',        home.hero_headline);
    setText('.hero__sub',      home.hero_subheadline);

    // Stats — rebuild so counter data-attributes come from CMS
    if (home.stats && home.stats.length) {
      const container = document.querySelector('.stats');
      if (container) {
        container.innerHTML = home.stats.map(s => `
          <div class="stat reveal">
            <span class="stat__num">
              <span
                data-counter="${esc(s.number)}"
                data-suffix="${esc(s.suffix  || '')}"
                data-prefix="${esc(s.prefix  || '')}"
              >${esc(s.prefix || '')}0${esc(s.suffix || '')}</span>
            </span>
            <div class="stat__label">${esc(s.label)}</div>
          </div>`).join('');
      }
    }

    // Why choose us — headline + intro
    setText('.section--light .section-head h2', home.why_headline);
    setText('.section--light .section-head p',  home.why_intro);

    // Why grid — rebuild preserving existing icons
    if (home.why_items && home.why_items.length) {
      const grid = document.querySelector('.why-grid');
      if (grid) {
        const icons = [...grid.querySelectorAll('.why-card__icon')].map(el => el.outerHTML);
        grid.innerHTML = home.why_items.map((item, i) => `
          <div class="glass why-card reveal" style="padding:32px;">
            ${icons[i] || ''}
            <h3>${esc(item.title)}</h3>
            <p>${esc(item.body)}</p>
          </div>`).join('');
      }
    }

    // Testimonials — rebuild
    if (home.testimonials && home.testimonials.length) {
      const grid = document.querySelector('.testimonials-grid');
      if (grid) {
        grid.innerHTML = home.testimonials.map(t => {
          const initial = (t.name || '?').charAt(0).toUpperCase();
          return `
            <article class="glass testimonial reveal">
              <div class="testimonial__stars" aria-label="5 out of 5 stars">${STARS_HTML}</div>
              <p class="testimonial__quote">&ldquo;${esc(t.quote)}&rdquo;</p>
              <div class="testimonial__author">
                <div class="testimonial__avatar">${esc(initial)}</div>
                <div>
                  <div class="testimonial__name">${esc(t.name)}</div>
                  <div class="testimonial__role">${esc(t.role)}</div>
                </div>
              </div>
            </article>`;
        }).join('');
      }
    }

    // CTA banner
    setText('.cta-banner h2', home.cta_headline);
    setText('.cta-banner p',  home.cta_subheadline);

    // Service card blurbs (sourced from services.json)
    if (services && services.services) {
      services.services.forEach(svc => {
        if (!svc.blurb) return;
        // Each card has a link like services.html#google-ads — use that to find the card
        const anchorId = SERVICE_IDS[svc.slug];
        if (!anchorId) return;
        const link = document.querySelector(`.service-card a[href*="#${anchorId}"]`);
        if (!link) return;
        const p = link.closest('.service-card')?.querySelector('p');
        if (p) p.textContent = svc.blurb;
      });
    }
  }

  /* -------------------------------------------------------
     Content apply — Services overview (services.html)
     Binds services.json: descriptions, benefits, FAQs
  ------------------------------------------------------- */
  function applyServicesPage(data) {
    setText('.page-hero h1', data.page_headline);
    setText('.page-hero p',  data.page_subheadline);

    if (!data.services) return;

    data.services.forEach(svc => {
      const blockId = SERVICE_IDS[svc.slug];
      if (!blockId) return;

      // Service block
      const block = document.getElementById(blockId);
      if (block) {
        if (svc.description) {
          const p = block.querySelector('p');
          if (p) p.textContent = svc.description;
        }
        if (svc.benefits) {
          const ul = block.querySelector('.benefit-list');
          if (ul) ul.innerHTML = buildBenefitListHTML(svc.benefits);
        }
      }

      // Matching FAQ group — identified by .faq-group__title text matching service title
      if (svc.faqs && svc.faqs.length) {
        document.querySelectorAll('.faq-group').forEach(group => {
          const titleEl = group.querySelector('.faq-group__title');
          if (titleEl && titleEl.textContent.trim() === svc.title) {
            const faqContainer = group.querySelector('.faq');
            if (faqContainer) faqContainer.innerHTML = buildFaqHTML(svc.faqs);
          }
        });
      }
    });
  }

  /* -------------------------------------------------------
     Content apply — Service detail pages
     (google-ads.html, meta-ads.html, etc.)
     Uses data-slug on <body> to find the right service.
  ------------------------------------------------------- */
  function applyServiceDetail(data, slug) {
    const svc = (data.services || []).find(s => s.slug === slug);
    if (!svc) return;

    // Hero: use title as h1, description as sub-paragraph
    if (svc.title) setText('.page-hero h1', svc.title);
    if (svc.description) setText('.page-hero p', svc.description);

    // Benefit list
    if (svc.benefits) {
      const ul = document.querySelector('.benefit-list');
      if (ul) ul.innerHTML = buildBenefitListHTML(svc.benefits);
    }

    // FAQ accordion
    if (svc.faqs) {
      const faqContainer = document.querySelector('.faq');
      if (faqContainer) faqContainer.innerHTML = buildFaqHTML(svc.faqs);
    }
  }

  /* -------------------------------------------------------
     Content apply — About page (about.html)
     Binds about.json: headline, mission, values, team
  ------------------------------------------------------- */
  function applyAbout(data) {
    setText('.page-hero h1', data.page_headline);
    setText('.page-hero p',  data.page_subheadline);

    // Mission — preserve the opening/closing quotation marks
    if (data.mission) {
      const missionP = document.querySelector('.mission p');
      if (missionP) missionP.textContent = `“${data.mission}”`;
    }

    // Values grid — rebuild, preserving existing SVG icons
    if (data.values && data.values.length) {
      const grid = document.querySelector('.values-grid');
      if (grid) {
        const icons = [...grid.querySelectorAll('.value-card__icon')].map(el => el.outerHTML);
        grid.innerHTML = data.values.map((v, i) => `
          <article class="glass value-card reveal">
            ${icons[i] || ''}
            <h3>${esc(v.title)}</h3>
            <p>${esc(v.description)}</p>
          </article>`).join('');
      }
    }

    // Team grid — rebuild; show photo if provided, else initial
    if (data.team && data.team.length) {
      const grid = document.querySelector('.team-grid');
      if (grid) {
        grid.innerHTML = data.team.map(member => {
          const initial   = (member.name || '?').charAt(0).toUpperCase();
          const photoHTML = member.photo
            ? `<img loading="lazy" src="${esc(member.photo)}" alt="${esc(member.name)}" />`
            : esc(initial);
          return `
            <article class="glass team-card reveal">
              <div class="team-card__photo">${photoHTML}</div>
              <h3>${esc(member.name)}</h3>
              <div class="team-card__role">${esc(member.title)}</div>
              <p>${esc(member.bio)}</p>
            </article>`;
        }).join('');
      }
    }
  }

  /* -------------------------------------------------------
     Content apply — Contact page (contact.html)
     contactData is already fetched globally for the footer,
     so it's passed in — no extra network request.
  ------------------------------------------------------- */
  function applyContact(data) {
    setText('.page-hero h1', data.page_headline);
    setText('.page-hero p',  data.page_subheadline);

    // Helper: find a contact-info__item by its label text and call cb(valueEl)
    const patchItem = (label, cb) => {
      document.querySelectorAll('.contact-info__item').forEach(item => {
        const labelEl = item.querySelector('.contact-info__label');
        if (labelEl && labelEl.textContent.trim().toLowerCase() === label.toLowerCase()) {
          const valueEl = item.querySelector('.contact-info__value');
          if (valueEl) cb(valueEl);
        }
      });
    };

    if (data.email) {
      patchItem('Email', el => {
        el.innerHTML = `<a href="mailto:${esc(data.email)}">${esc(data.email)}</a>`;
      });
    }
    if (data.phone) {
      patchItem('Phone', el => {
        el.innerHTML = `<a href="tel:${esc(data.phone)}">${esc(data.phone)}</a>`;
      });
    }
    if (data.address) {
      patchItem('Location', el => { el.textContent = data.address; });
    }
    if (data.hours) {
      patchItem('Hours', el => { el.textContent = data.hours; });
    }

    // Form action (Formspree endpoint)
    if (data.form_endpoint) {
      const form = document.querySelector('form.contact-form');
      if (form) form.action = data.form_endpoint;
    }
  }

  /* -------------------------------------------------------
     Content loader — dispatches by page + slug
  ------------------------------------------------------- */
  async function loadPageContent(page, slug, contactData) {
    try {
      if (page === 'home') {
        const [homeData, servicesData] = await Promise.all([
          fetchJSON('content/homepage.json'),
          fetchJSON('content/services.json'),
        ]);
        applyHomepage(homeData, servicesData);

      } else if (page === 'services' && slug) {
        const data = await fetchJSON('content/services.json');
        applyServiceDetail(data, slug);

      } else if (page === 'services') {
        const data = await fetchJSON('content/services.json');
        applyServicesPage(data);

      } else if (page === 'about') {
        const data = await fetchJSON('content/about.json');
        applyAbout(data);

      } else if (page === 'contact') {
        // contactData is already available — no extra fetch needed
        applyContact(contactData);
      }
    } catch (err) {
      console.warn('[FF] Page content error:', err);
    }
  }

  /* -------------------------------------------------------
     Scroll — header shrink on scroll
  ------------------------------------------------------- */
  function initScroll() {
    const header  = document.getElementById('siteHeader');
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* -------------------------------------------------------
     Mobile menu
  ------------------------------------------------------- */
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

  /* -------------------------------------------------------
     Counter animation (easeOut cubic)
     Runs AFTER content is applied so dynamic stat elements
     created by applyHomepage() are included.
  ------------------------------------------------------- */
  function initCounters() {
    const els = document.querySelectorAll('[data-counter]');
    if (!els.length || !('IntersectionObserver' in window)) {
      els.forEach(el => {
        el.textContent = (el.dataset.prefix || '') + el.dataset.counter + (el.dataset.suffix || '');
      });
      return;
    }
    const animate = (el) => {
      const target   = parseFloat(el.dataset.counter);
      const suffix   = el.dataset.suffix || '';
      const prefix   = el.dataset.prefix || '';
      const duration = 1600;
      const start    = performance.now();
      const easeOut  = (t) => 1 - Math.pow(1 - t, 3);
      const tick = (now) => {
        const t       = Math.min(1, (now - start) / duration);
        const v       = target * easeOut(t);
        const display = target % 1 === 0 ? Math.floor(v) : v.toFixed(1);
        el.textContent = prefix + display + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { animate(entry.target); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.4 });
    els.forEach(el => obs.observe(el));
  }

  /* -------------------------------------------------------
     Reveal-on-scroll
     Runs AFTER content is applied so dynamically added
     .reveal elements (testimonials, team cards, etc.) animate.
  ------------------------------------------------------- */
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

  /* -------------------------------------------------------
     Page loader
  ------------------------------------------------------- */
  function buildLoader() {
    const logoSrc = asset('Assets/FunnelFountain White Text Logo Transparent.png').replace(/ /g, '%20');
    document.body.insertAdjacentHTML('afterbegin', `
      <div class="page-loader" id="pageLoader" aria-hidden="true">
        <div class="page-loader__inner">
          <img class="page-loader__logo" src="${logoSrc}" alt="" />
          <div class="page-loader__bar" role="presentation"></div>
        </div>
      </div>`);
  }

  function dismissLoader() {
    const loader = document.getElementById('pageLoader');
    if (!loader) return;
    const hide = () => {
      requestAnimationFrame(() => loader.classList.add('is-hidden'));
      setTimeout(() => loader.remove(), 800);
    };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => setTimeout(hide, 250));
    } else {
      setTimeout(hide, 450);
    }
  }

  /* -------------------------------------------------------
     Bootstrap — async so content is fetched before
     initCounters / initReveal run, ensuring dynamic
     elements (rebuilt stats, testimonials, etc.) are
     picked up by the observers.
  ------------------------------------------------------- */
  async function init() {
    const active = document.body.dataset.page || '';
    const slug   = document.body.dataset.slug  || '';

    buildLoader();
    buildHeader(active);

    // Fetch global + contact first so the footer renders with real data
    let globalData = {}, contactData = {};
    try {
      [globalData, contactData] = await Promise.all([
        fetchJSON('content/global.json'),
        fetchJSON('content/contact.json'),
      ]);
    } catch (e) {
      console.warn('[FF] Global content load failed:', e);
    }

    buildFooter(globalData, contactData);
    buildMobileCTA();
    initScroll();
    initMobileMenu();

    // Fetch and apply page-specific content
    await loadPageContent(active, slug, contactData);

    // Init animations only after DOM is fully populated
    initCounters();
    initReveal();

    if (document.readyState === 'complete') dismissLoader();
    else window.addEventListener('load', dismissLoader, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for inline use on pages
  window.FF = { ICONS, asset };
})();
