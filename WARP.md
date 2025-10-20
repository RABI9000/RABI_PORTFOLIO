# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project scope
- Static site: no build toolchain, package manager, or test framework. Everything runs from plain HTML/CSS/JS.

Commands
- Local preview (serve from repo root):
  - Python: python3 -m http.server 5173  # then open http://localhost:5173
- Build: not applicable (no build step).
- Lint/Format: not configured.
- Tests: none; single-test execution not applicable.
- Deploy to GitHub Pages (from README):
  1) Push this project to a GitHub repo
  2) Repo Settings → Pages → Build and deployment → Branch: main / Root → Save

High-level architecture
- Entry point: index.html
  - Loads styles.css and scripts.js; includes semantic sections (hero, projects, about, contact) and accessible affordances (skip link, aria-current on active nav).
  - Uses data-reveal attributes to opt sections into scroll-reveal animations.
- Styling: styles.css
  - Design system via CSS custom properties (colors, radius, shadows) with dark/light support and color-mix; responsive grid utilities; content-visibility and contain-intrinsic-size for perf.
  - Component sections for header/nav, hero (animated orb), project cards, about, contact, footer; prefers-reduced-motion respected.
- Behavior: scripts.js
  - IIFE with minimal, performance-minded interactions:
    - Smooth-scroll for in-page anchors (falls back when reduced motion is set), and sets aria-current on active nav links.
    - IntersectionObserver adds is-visible to [data-reveal] elements on first intersection.
    - Footer year autoupdated; idle task defers minor work; hover prefetch for external links via <link rel="prefetch">.
- Assets: assets/
  - icons/favicon.svg present. README suggests placing images in assets/img (create as needed). Hero links reference assets/Resume.pdf (add or update the link).

Customization notes (from README)
- Edit content in index.html (hero, projects, about, contact).
- Adjust theme via CSS variables in styles.css.
- Tweak micro-interactions in scripts.js.
