# Portfolio — Dark Minimal

Static personal portfolio designed for GitHub Pages. No build step, just HTML/CSS/JS.

## Features
- Dark, minimal, modern design
- Responsive grid layouts
- Smooth hover and scroll interactions (respecting reduced motion)
- Performance-minded: lazy images, content-visibility, deferred JS

## Quick start
Open `index.html` directly in a browser, or serve locally:

```bash
# python
python3 -m http.server 5173
# then visit http://localhost:5173
```

## Deploy to GitHub Pages
1. Create a new GitHub repository (any name, or `USERNAME.github.io` for a user site).
2. Push this project to the repo.
3. In the repo: Settings → Pages → Build and deployment → Branch: `main` / Root.
4. Save. Your site will be live at the provided URL.

Tips
- Keep images in `assets/img` and use modern formats (WebP/AVIF). Include width/height to avoid layout shift.
- If using a custom domain, add a `CNAME` file with your domain.
- Avoid heavy libraries. This site uses no dependencies.

## Customize
- Edit text and links in `index.html` (hero, projects, about, contact).
- Tweak colors and spacing via CSS variables in `styles.css`.
- Add or remove micro-interactions in `scripts.js`.
