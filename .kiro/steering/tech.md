# Tech Stack

## Static Site Generator
- Hugo (extended) v0.157.0 minimum
- Configuration: split across the `config/` directory (YAML format), merged automatically by Hugo:
  - `config/_default/hugo.yaml` — core settings, markup, sitemap, output formats, services
  - `config/_default/languages.yaml` — multilingual `languages` block (per-language params, without menus)
  - `config/_default/menus.fr.yaml` / `config/_default/menus.en.yaml` — main menu per language
  - `config/_default/params.yaml` — global `params` (agenda year, address, contact, fees, Turnstile key…)
  - `config/development/hugo.yaml` — development overrides (localhost `baseURL`, used by `hugo server`)
- Theme: `sarfrance` (custom, in `themes/sarfrance/`, loaded as a git submodule — theme key in `config/_default/hugo.yaml` is `sarfrance`)

## Frontend
- Plain HTML templates (Go templates / Hugo templating)
- Vanilla CSS (no preprocessor beyond Dart Sass available in CI)
- CSS and JS processed through Hugo's asset pipeline (`resources.Get` + `resources.Fingerprint`) for cache busting and SRI integrity
- Vanilla JavaScript only — no framework, no jQuery, no npm runtime dependencies
- JavaScript files: `utils.js` (shared `SAR` helpers), `main.js`, `filter-engine.js`, `map.js`, `agenda.js`, `bibliotheque.js`, `carousel.js`, `chronologie.js`, `contact.js`, `hauts-lieux.js`, `notices.js`, `phototheque.js`
- Third-party CDN scripts loaded per-page (not bundled): Leaflet 1.9.4 (agenda, contact, hauts-lieux), Moment.js 2.30 (agenda), Isotope 3 + Mustache 4 (bibliotheque)
- No npm dependencies in production

## JavaScript Rules
- All JavaScript must live in external `.js` files under `themes/sarfrance/assets/js/` — never inline `<script>` blocks in HTML templates
- Vanilla JavaScript only — no jQuery, no framework. Use native DOM APIs (`document.querySelector`, `addEventListener`, `classList`, `dataset`, `fetch`, etc.)
- Use the shared `SAR` helpers from `utils.js` (loaded first, globally): `SAR.onReady(fn)` to run code once the DOM is ready, and `SAR.selectAll(selector[, ctx])` to get a real `Array` of elements. Do not re-implement the `DOMContentLoaded` guard or `Array.prototype.slice.call(querySelectorAll(...))` in each file
- Wrap page/module code so it does not leak globals: either `SAR.onReady(function () { 'use strict'; ... })` for entry points, or an IIFE for files that define internal helpers. Only deliberately shared functions (`FilterEngine`, `initPageCardMaps`) stay global
- Reuse the shared `FilterEngine` (`filter-engine.js`) for filter/search/group-visibility behaviour rather than writing bespoke filtering. Toggle visibility via the `.hidden` class (defined generically in `filters.css`) — never inline `style="display:none"`, which the class-based toggle cannot override
- Use `fetch` (with `async/await` or promises) for network requests, never `XMLHttpRequest`
- Templates load scripts via `<script src=...>` tags: global scripts in `site-scripts.html` (loaded as a partial in `baseof.html`), page scripts in the layout's `{{ define "scripts" }}` block. `utils.js` must stay first so `SAR` is defined before any consumer
- When creating a new interactive page, create a dedicated `.js` file (e.g., `mypage.js`), use `SAR.onReady`, and load it in the corresponding layout template

## Data
- YAML files in `data/` drive dynamic content (agenda, carousel, chronologie)
- Content pages use Markdown with YAML front matter

## Internationalization (i18n)
- UI string files: `i18n/fr.yaml` (French) and `i18n/en.yaml` (English)
- Templates call `{{ i18n "key" }}` to render translated labels
- When adding a new UI string, always add the key to both `i18n/fr.yaml` and `i18n/en.yaml`

## Hosting & Deployment
- Primary: GitHub Pages via GitHub Actions (`.github/workflows/hugo.yml`)
- Alternative: S3 + CloudFront (`deploy.sh`, `infrastructure/deploy.sh`)
- CNAME: `www.sarfrance.org`

## CI/CD
- On push to `main`: build + deploy to GitHub Pages
- Daily rebuild at 06:00 UTC (cron) to keep upcoming events current
- On PR: preview build + content validation (front matter check, YAML validation)

## Common Commands

```bash
# Local development server
hugo server --buildDrafts

# Production build
hugo --minify

# Build with custom base URL
hugo --minify --baseURL "https://www.sarfrance.org/"

# Clean build
hugo --gc --cleanDestinationDir
```

## Content Validation Rules (enforced in CI)
- Every `.md` file in `content/` must start with `---` (YAML front matter)
- Every front matter block must contain a `title:` field
- All `.yaml` files in `data/` must be valid YAML
