# FunnelFountain Website

Static, no-build agency website. Vanilla HTML + CSS + JS, deployable on Cloudflare Pages, with content editable via Decap CMS.

---

## 1. Tech stack

| Layer    | Tool / approach                                                       |
| -------- | --------------------------------------------------------------------- |
| Markup   | Plain HTML files (one per page)                                       |
| Styling  | A single `style.css` driven by CSS custom properties (design tokens)  |
| Scripts  | One `main.js` — injects header/footer, handles scroll & animations    |
| Fonts    | Google Fonts: **Inter** (body) + **Syne** (display)                   |
| CMS      | [Decap CMS](https://decapcms.org) via `git-gateway`                   |
| Hosting  | Cloudflare Pages, auto-deployed from GitHub                           |
| Build    | None. Files are served as-is.                                         |

---

## 2. File structure

```
FunnelFountain Website/
├── index.html              Homepage
├── services.html           All services overview
├── google-ads.html         Service detail page
├── meta-ads.html           Service detail page
├── social-media.html       Service detail page
├── ai-automation.html      Service detail page
├── about.html              About page
├── contact.html            Contact + booking page
├── style.css               Single global stylesheet (design tokens + components)
├── main.js                 Single global script (header/footer/animations)
├── admin/
│   ├── index.html          Decap CMS admin panel entry point
│   └── config.yml          Decap CMS configuration
├── content/                JSON content files Decap reads/writes
│   ├── homepage.json
│   ├── services.json
│   ├── about.json
│   ├── contact.json
│   └── global.json
├── Assets/                 Logo files & brand images
├── icons/                  (reserved for additional icons)
├── images/                 (reserved for additional photography)
├── robots.txt              SEO crawler directives (Phase 4)
├── sitemap.xml             SEO sitemap (Phase 4)
├── CONTEXT.md              Project brief
└── README.md               You are here
```

---

## 3. How the page is assembled at runtime

Each HTML page contains only the **page-specific content** (hero, sections, etc.). The header, footer, and mobile CTA bar are injected by `main.js` after the DOM loads. This keeps every page self-contained yet consistent.

The `<body>` carries two attributes:

| Attribute    | Purpose                                                              |
| ------------ | -------------------------------------------------------------------- |
| `data-page`  | Tells the nav which item to highlight (`home`, `services`, etc.)     |
| `data-depth` | How many directories deep the file is. Root pages use `0`.           |

**Why `data-depth`?** Asset paths in the injected header/footer are built relative to root. On a normal HTTP server, depth could be inferred from the URL — but Windows `file://` URLs include the drive letter, which inflates the count and breaks every link. The explicit attribute removes the ambiguity.

---

## 4. Editing content

You have **three** ways to edit copy. Pick whichever is easiest for the change you're making.

### 4a. Direct ctrl+F replacement (fastest for SEO copy pass)

Every editable string in the HTML is wrapped in a clearly marked all-caps placeholder, e.g.:

```html
<h1>[HERO_HEADLINE: INSERT BIG SEO-OPTIMIZED HEADLINE HERE — 6-12 WORDS]</h1>
```

Just open the file, ctrl+F the placeholder name, and replace it with real copy. Same pattern for SVG `aria-label`s, social URLs, the Formspree endpoint, etc.

**To find every placeholder still in the codebase:**
search for the regex `\[[A-Z_]+:`

### 4b. Decap CMS panel (best for non-technical edits)

Once the site is on Cloudflare Pages with Netlify Identity / git-gateway configured (see §6), visit `/admin/` to log in and edit fields through a friendly UI. Decap commits changes to the GitHub repo, which auto-deploys.

The CMS edits the JSON files in `/content/`. **Note:** these JSON files are not yet wired into the HTML. They are the canonical source of truth that the CMS reads and writes; until you hook them up (see §4c), changes there don't affect the rendered site automatically.

### 4c. Wiring `/content/` JSON into the HTML (optional)

If you want CMS edits to appear without manual HTML edits, add a small fetch step in `main.js`:

```js
fetch(asset('content/homepage.json'))
  .then(r => r.json())
  .then(data => {
    document.querySelector('[data-bind="hero.headline"]').textContent = data.hero.headline;
    // ...etc
  });
```

Then mark each placeholder element with `data-bind="hero.headline"` instead of (or in addition to) the bracketed text. This is a pure-JS approach with no build step. Until you do this, treat the JSON files as a structured place to draft copy that you then paste into HTML.

---

## 5. Editing the design

Every visual token is a CSS custom property defined at the top of `style.css`:

```css
:root {
  --color-bg:        #0a0a0a;   /* page background */
  --color-gold:      #fed907;   /* brand accent */
  --color-white:     #f5f5f5;   /* primary text */
  --r-card:          12px;      /* card corner radius */
  --r-pill:          999px;     /* button radius */
  --font-display:    'Syne', ...;
  --font-body:       'Inter', ...;
  /* ...spacing scale, glass, motion, etc. */
}
```

To change a brand color globally, edit the variable. To resize the spacing rhythm, edit `--s-1` through `--s-32` (4px base unit).

### Common tweaks

| To change…                              | Edit…                                                       |
| --------------------------------------- | ----------------------------------------------------------- |
| The accent color                        | `--color-gold` in `:root`                                   |
| Body or heading font                    | `--font-body` / `--font-display`                            |
| Card corner radius                      | `--r-card`                                                  |
| Header logo size                        | `.site-header__logo img { height: ... }`                    |
| Section vertical padding                | `.section { padding: var(--s-24) 0; }`                      |
| Hero gold-glow position                 | `.hero::after { ... }`                                      |
| 3D orb appearance                       | `.orb { ... }` (no image; pure CSS)                         |

---

## 6. Adding / removing a service

Services are managed in **one place**: the `SERVICES` array near the top of `main.js`.

```js
const SERVICES = [
  { slug: 'google-ads',    title: 'Google Ads',              icon: 'google' },
  { slug: 'meta-ads',      title: 'Meta Ads',                icon: 'meta'   },
  { slug: 'social-media',  title: 'Social Media Management', icon: 'social' },
  { slug: 'ai-automation', title: 'AI Automation',           icon: 'ai'     },
];
```

This array drives the **header dropdown**, the **mobile drawer sub-list**, and the **footer link list**. To add a new service:

1. Add an entry to the array (`slug` becomes the URL: `slug.html`).
2. Add a matching SVG to the `ICONS` object above the array, then reference it via the `icon` key.
3. Duplicate one of the existing `*.html` service files, rename it `<slug>.html`, swap the placeholders.
4. Optionally add a corresponding section to `services.html`.

---

## 7. Adding a new page

1. Duplicate `about.html` (it has the simplest layout) and rename.
2. Update `<title>`, `<meta name="description">`, the canonical link, and OG tags.
3. Set `<body data-page="something" data-depth="0">`.
4. Replace the page content. Use the existing components (`.page-hero`, `.section`, `.glass`, `.cta-banner`) — they're already styled.
5. If you want it in the main nav, edit the `buildHeader` and `buildFooter` functions in `main.js` to add the link.

---

## 8. Components you can reuse

These class patterns are already styled and animation-ready. Drop them into any page.

| Component        | Class(es)                              | Notes                              |
| ---------------- | -------------------------------------- | ---------------------------------- |
| Liquid glass card| `.glass`                               | Backdrop blur + gold border on hover |
| Hero (sub-page)  | `.page-hero`                           | Centered headline + gold glow      |
| Section wrapper  | `.section`, `.section--tight`          | Vertical rhythm                    |
| Container        | `.container`                           | Max width + horizontal padding     |
| Eyebrow text     | `.eyebrow`                             | Small caps gold tag above headlines|
| Button           | `.btn` + `.btn--gold` or `.btn--outline` + optional `.btn--lg` | Pill-shaped                        |
| FAQ accordion    | `<details class="faq-item">`           | Native HTML, no JS needed          |
| Benefit list     | `<ul class="benefit-list">`            | Gold check bullets                 |
| CTA banner       | `.cta-banner`                          | Gold-tinted full-width call-out    |
| Counter          | `<span data-counter="200" data-suffix="+">` | Animates on scroll-into-view       |
| Reveal animation | Add `.reveal` to any element           | Fades + slides up on scroll        |

---

## 9. Deploying

1. Push this directory to a GitHub repo (this README assumes `hassaanngr/FunnelFountain-Website`).
2. In Cloudflare Pages, create a new project from that repo. Build command: *(leave empty)*. Output directory: *(leave empty / `/`)*.
3. To enable Decap CMS, you'll need an authentication backend. The standard options:
   - **Netlify Identity + git-gateway** — even when hosting on Cloudflare, you can register an external Netlify "site" that points at the same repo just to provide auth.
   - **OAuth** — set up a GitHub OAuth app and point Decap at it (see Decap's docs).
4. After auth is configured, edit `admin/config.yml` if your branch isn't `main`, then visit `https://your-domain.com/admin/` to log in.

---

## 10. Performance notes

- All images use `loading="lazy"` (where you add real images — placeholders are SVG/CSS only).
- Critical CSS for the hero is inlined in each page's `<head>`.
- Google Fonts uses `preconnect` to start the TLS handshake early.
- Animations use IntersectionObserver, never scroll event listeners.
- The 3D orb, grain texture, glass cards, and trust-bar logos are all CSS/SVG — no image requests.
- `prefers-reduced-motion` is respected; all animations and transitions collapse to instant.

---

## 11. Things to wire up before going live

- [ ] Replace every `[BRACKETED_PLACEHOLDER]` with real copy.
- [ ] Drop a 1200×630 OG image at `assets/images/og-image.jpg` and update OG meta tags' canonical URLs.
- [ ] Replace `[FORMSPREE_ENDPOINT_PLACEHOLDER]` in `contact.html` with your real Formspree (or alternative) endpoint.
- [ ] Insert your Calendly / Cal.com embed where the comment marker is (`<!-- INSERT CALENDLY OR CAL.COM EMBED HERE -->`) inside `#booking-calendar`.
- [ ] Replace `[SOCIAL_*_URL]` placeholders with real social URLs (search `[SOCIAL_` in `main.js`).
- [ ] Configure CMS auth (see §9.3).
- [ ] Add `robots.txt` and `sitemap.xml` (Phase 4).

---

## 12. License

Proprietary — © FunnelFountain.
