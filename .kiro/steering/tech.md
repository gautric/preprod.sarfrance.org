# Tech Stack

## Static Site Generator
- Hugo (extended) v0.163.3 (version épinglée en CI dans `deploy.yml` / `preview.yml` ; v0.157.0 minimum)
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
- JavaScript files are organised in three tiers under `themes/sarfrance/assets/js/`:
  - `core.js` — single bundle of cross-cutting helpers on the global `SAR` namespace, loaded first and globally: `SAR.onReady` / `SAR.selectAll` (DOM), `SAR.isEnglish` / `SAR.lang` / `SAR.homeUrl` (language), `SAR.fetchJSON` (network), `SAR.activate` (single-active-button), `SAR.map` (OSM tile config + `SAR.map.create`) and the global `initPageCardMaps`. The Leaflet helpers stay inert until Leaflet's `L` global is present, so the bundle is safe on every page
  - `shared/` — reusable cross-page modules: `filter-engine.js` (`FilterEngine`) and `timeline-page.js` (`SAR.initTimelinePage` — mutualises maps + FilterEngine setup for agenda/chronologie/lieux-de-memoire)
  - `pages/` — one module per page/feature: `main.js`, `carousel.js`, `agenda.js`, `chronologie.js`, `lieux-de-memoire.js`, `notices.js`, `bibliotheque.js`, `phototheque.js`, `contact.js`
- Third-party CDN scripts loaded per-page (not bundled): Leaflet 1.9.4 (agenda, contact, lieux-de-memoire), Moment.js 2.30 (agenda), Isotope 3 + Mustache 4 (bibliotheque)
- No npm dependencies in production

## JavaScript Rules
- All JavaScript must live in external `.js` files under `themes/sarfrance/assets/js/` — never inline `<script>` blocks in HTML templates. Files are organised in three tiers: `core.js` (single bundle of global `SAR` helpers), `shared/` (reusable cross-page modules), `pages/` (one module per page)
- Vanilla JavaScript only — no jQuery, no framework. Use native DOM APIs (`document.querySelector`, `addEventListener`, `classList`, `dataset`, `fetch`, etc.)
- Use the shared `SAR` helpers from `core.js` (loaded globally before any page module): `SAR.onReady(fn)` to run code once the DOM is ready, `SAR.selectAll(selector[, ctx])` for a real `Array` of elements, `SAR.isEnglish()` / `SAR.lang()` / `SAR.homeUrl()` for language detection, `SAR.fetchJSON(url)` for JSON requests, and `SAR.activate(group, btn)` to toggle the single active button in a bar. Do not re-implement these in each file
- For Leaflet maps, use `SAR.map.create(el, opts)` (from `core.js`) rather than calling `L.map`/`L.tileLayer` directly — it centralises the OSM tile URL and attribution. Card mini-maps use the shared `initPageCardMaps()`
- For agenda/chronologie/lieux-de-memoire-style pages, call `SAR.initTimelinePage(config)` (from `shared/timeline-page.js`) instead of wiring `initPageCardMaps` + `FilterEngine` by hand
- Wrap page/module code so it does not leak globals: either `SAR.onReady(function () { 'use strict'; ... })` for entry points, or an IIFE for files that define internal helpers. Only deliberately shared functions (`FilterEngine`, `initPageCardMaps`) stay global
- Reuse the shared `FilterEngine` (`shared/filter-engine.js`) for filter/search/group-visibility behaviour rather than writing bespoke filtering. Toggle visibility via the `.hidden` class (defined generically in `filters.css`) — never inline `style="display:none"`, which the class-based toggle cannot override
- Use `fetch` (via `SAR.fetchJSON` or directly with `async/await`/promises) for network requests, never `XMLHttpRequest`
- Templates load scripts via `<script src=...>` tags: `core.js` + shared modules + `main.js` in `site-scripts.html` (loaded as a partial in `baseof.html`), page scripts in the layout's `{{ define "scripts" }}` block. `core.js` must stay first so `SAR` is defined before any consumer
- When creating a new interactive page, create a dedicated module under `pages/` (e.g., `pages/mypage.js`), use `SAR.onReady`, lean on the `core`/`shared` helpers, and load it in the corresponding layout template

## Data
- YAML files in `data/` drive dynamic content (agenda, carousel, chronologie)
- Content pages use Markdown with YAML front matter

## Internationalization (i18n)
- UI string files: `i18n/fr.yaml` (French) and `i18n/en.yaml` (English)
- Templates call `{{ i18n "key" }}` to render translated labels
- When adding a new UI string, always add the key to both `i18n/fr.yaml` and `i18n/en.yaml`

## Hosting & Deployment
- Primary: GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`)
- Alternative: S3 + CloudFront (`deploy.sh`, `infrastructure/deploy.sh`)
- CNAME: `www.sarfrance.org`

## CI/CD
- On push to `main`: build + deploy to GitHub Pages (`.github/workflows/deploy.yml`)
- Daily rebuild at 06:00 UTC (cron, in `deploy.yml`) to keep upcoming events current
- On PR: preview build + content validation (front matter check, YAML validation) (`.github/workflows/preview.yml`)
- Agentic workflows: `agent-agenda` (issue agenda → géocodage → PR sur `data/agenda.yaml`) and `agent-translate` (traduction FR→EN, déclenchement manuel), each with a `.md` source and a compiled `.lock.yml`
- Maintenance: `agentics-maintenance.yml` (fermeture des issues/PR/discussions expirées) and `copilot-setup-steps.yml` (installation de la CLI gh-aw)

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
