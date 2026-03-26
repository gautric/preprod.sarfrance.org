# Tech Stack

## Static Site Generator
- Hugo (extended) v0.157.0 minimum
- Configuration: `hugo.yaml` (YAML format)
- Theme: `sarfrance` (custom, in `themes/sarfrance/`, loaded as a git submodule — theme key in `hugo.yaml` is `sarfrance`)

## Frontend
- Plain HTML templates (Go templates / Hugo templating)
- Vanilla CSS (no preprocessor beyond Dart Sass available in CI)
- CSS and JS processed through Hugo's asset pipeline (`resources.Get` + `resources.Fingerprint`) for cache busting and SRI integrity
- jQuery 4.x (loaded from CDN in `baseof.html`) as the JavaScript framework
- JavaScript files: `main.js`, `agenda.js`, `bibliotheque.js`, `carousel.js`, `chronologie.js`, `contact.js`, `hauts-lieux.js`, `notices.js`
- Third-party CDN scripts loaded per-page (not bundled): Leaflet 1.9.4 (agenda, contact, hauts-lieux), Isotope 3 + Mustache 4 (bibliotheque)
- No npm dependencies in production

## JavaScript Rules
- All JavaScript must live in external `.js` files under `themes/sarfrance/assets/js/` — never inline `<script>` blocks in HTML templates
- Use jQuery (`$`) for DOM manipulation, event handling, and selectors — do not use vanilla `document.querySelector`, `addEventListener`, etc.
- Wrap page-specific code in `$(document).ready(function() { ... });`
- Templates load scripts via `<script src=...>` tags in `baseof.html` (global scripts) or in page-specific layout blocks (page scripts)
- When creating a new interactive page, create a dedicated `.js` file (e.g., `mypage.js`) and load it in the corresponding layout template
- Keep jQuery slim — avoid jQuery UI or heavy plugins unless explicitly approved

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
- CNAME: `preprod.sarfrance.org`

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
hugo --minify --baseURL "https://preprod.sarfrance.org/"

# Clean build
hugo --gc --cleanDestinationDir
```

## Content Validation Rules (enforced in CI)
- Every `.md` file in `content/` must start with `---` (YAML front matter)
- Every front matter block must contain a `title:` field
- All `.yaml` files in `data/` must be valid YAML
