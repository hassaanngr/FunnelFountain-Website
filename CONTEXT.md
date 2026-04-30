# FunnelFountain — Project Context

## Business
Digital marketing agency. Services: Google Ads, Meta Ads, 
Social Media Management, AI Automation.
Target clients: SMBs, e-commerce brands, local businesses.
Tone: Professional, trustworthy, modern, results-driven.

## Brand
Name: FunnelFountain
Colors:
  - Primary background: #0a0a0a (near black)
  - Gold accent: #fed907
  - White: #f5f5f5
  - Surface/card: #111111
Logo files: All located in the assets folder, named accordingly 
Favicon: Located in the Assets folder as FunnelFountain Monogram.png

## Tech Constraints
- Vanilla HTML + CSS + JS only (no React, no Vue, no build tools)
- Must be deployable as static files on Cloudflare Pages
- Content managed via Decap CMS (admin/config.yml + admin/index.html)
- All editable content must be in /content/ as JSON or Markdown files
  that Decap CMS can read and write
- GitHub repo will be connected to Cloudflare Pages for auto-deploy

## Performance Rules
- No external font requests except Google Fonts (preconnect)
- All images lazy loaded
- CSS custom properties for all design tokens
- No jQuery, no Bootstrap
- PageSpeed target: 90+ on mobile