# Tech Stack

## Static Site Generator
- Hugo (extended) v0.157.0 minimum
- Configuration: `hugo.toml` (TOML format)
- Theme: `sarfrance-theme` (custom, in `themes/sarfrance-theme/`, loaded as a git submodule)

## Frontend
- Plain HTML templates (Go templates / Hugo templating)
- Vanilla CSS (no preprocessor beyond Dart Sass available in CI)
- Vanilla JavaScript (`carousel.js`, `main.js`)
- No frontend framework, no npm dependencies in production

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
