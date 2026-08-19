# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SAR France (Société en France des Fils de la Révolution Américaine) institutional website. A bilingual (FR/EN) Hugo static site about the French chapter of the Sons of the American Revolution, hosted on GitHub Pages at `www.sarfrance.org`.

## Commands

```bash
# Development server (with drafts)
make serve          # or: hugo server --buildDrafts

# Production build
make build          # or: hugo --minify

# Clean build (purge cache)
make clean          # or: hugo --gc --cleanDestinationDir

# Check tooling versions (Hugo local vs CI pinned)
make version

# Verify all required tools are installed
make doctor

# Update Hugo + CI version pins + gh extensions
make update

# Python scripts (activate venv first)
source .venv/bin/activate
pip install -r scripts/requirements.txt
python scripts/export_books_excel.py
```

## Architecture

**Hugo (extended)** — version pinned in `Makefile` (`HUGO_VERSION_CI`), `.github/workflows/deploy.yml`, and `.github/workflows/preview.yml`. These three must stay in sync (use `make bump-hugo-ci`).

**Configuration** — split across `config/` (Hugo merges automatically):
- `config/_default/hugo.yaml` — core settings, markup, output formats
- `config/_default/languages.yaml` — multilingual config (FR default at `/`, EN at `/en/`)
- `config/_default/menus.fr.yaml` / `menus.en.yaml` — navigation menus per language
- `config/_default/params.yaml` — global params (agenda year, address, fees, Turnstile key)
- `config/development/hugo.yaml` — localhost baseURL override for dev server

**Theme** — `themes/sarfrance/` (git submodule, theme key: `sarfrance`). All templates, CSS, and JS live here.

**Content** — `content/fr/` and `content/en/` mirror each other by path. Sections: `la-societe/`, `histoire/`, `activites/`, `contact/`.

**Data** — two-file pattern separating content from structure:
- `data/<name>.yaml` — content entries (events, books, notices...)
- `data/metadata/<name>.yaml` — structural metadata (types, tags, categories as key lists)
- Labels resolved via i18n keys with domain prefix (e.g. `agenda_type_conférence`)

**i18n** — `i18n/fr.yaml` and `i18n/en.yaml`. Templates use `{{ i18n "key" }}`. Always add keys to both files.

**Assets** — processed through Hugo's pipeline (`resources.Get` + `resources.Fingerprint` for cache busting + SRI). CSS and JS live in `themes/sarfrance/assets/`, NOT in `static/`.

**JavaScript** — vanilla only, no frameworks. Three tiers in `themes/sarfrance/assets/js/`:
- `core.js` — global `SAR` namespace helpers (DOM, lang, fetch, Leaflet maps)
- `shared/` — reusable modules (`filter-engine.js`, `timeline-page.js`)
- `pages/` — one file per page feature

**Static files** — content images go in root `static/` (e.g. `static/images/carousel/`), never in `themes/sarfrance/static/`.

## CI/CD

- **Push to main** → build + deploy to GitHub Pages (`deploy.yml`), triggered only by changes to content/data/config/themes paths
- **Daily cron 06:00 UTC** → rebuild to keep upcoming events current
- **PR** → Hugo build verification + content validation (`preview.yml`): front matter check, YAML validation
- **Pre-push hook** — `scripts/check-hugo-version.sh` verifies Hugo version sync. Install with: `git config core.hooksPath .githooks`

## Commit Conventions

Conventional Commits format: `<type>(<scope>): <description>`

Types: `docs`, `feat`, `fix`, `style`, `refactor`, `chore`, `i18n`, `data`

Language rule: French for association content changes (histoire, agenda, etc.), English for structural/technical changes (Hugo, framework, CI).

## Content Rules

- Every `.md` in `content/` must start with `---` front matter containing a `title:` field
- All `.yaml` in `data/` must be valid YAML
- Tag/type colors: CSS classes in `colors.css` named `tag-{urlized-key}` — never inline styles
- Visibility toggling: use `.hidden` class (from `filters.css`), never `style="display:none"`
- `currentAgendaYear` in `params.yaml` drives the current agenda year site-wide — update once per year

## Writing Style

French content uses a formal, institutional register (soutenu but not academic). No anglicisms — use French equivalents (courriel, en ligne, lettre d'information). Traditional orthography (not 1990 reforms). French typographic rules apply (insecable spaces before `:;?!`, guillemets « »).

## Python

Always activate the project venv before running scripts: `source .venv/bin/activate`
