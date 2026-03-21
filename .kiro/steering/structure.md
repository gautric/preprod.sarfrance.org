# Project Structure

```
.
├── hugo.toml                  # Site configuration (menus, params, markup, languages)
├── content/
│   ├── fr/                    # French content (default language)
│   │   ├── _index.md          # Homepage FR
│   │   ├── organisation/      # Organisation section
│   │   ├── histoire/          # History section
│   │   ├── activites/         # Activities section (agenda, events, publications)
│   │   └── contact/           # Contact section (forms, dues, donations, legal)
│   └── en/                    # English content (mirror of fr/)
│       ├── _index.md          # Homepage EN
│       ├── organisation/
│       ├── histoire/
│       ├── activites/
│       └── contact/
├── i18n/                      # UI string translations
│   ├── fr.yaml                # French labels (default)
│   └── en.yaml                # English labels
├── data/                      # YAML data files consumed by templates
│   ├── agenda.yaml            # Events with types, dates, titles
│   ├── carousel.yaml          # Homepage carousel images
│   └── chronologie.yaml       # Historical timeline with periods and events
├── themes/sarfrance-theme/    # Custom Hugo theme (git submodule)
│   ├── layouts/
│   │   ├── _default/          # baseof.html, list.html, single.html
│   │   ├── partials/          # header.html, footer.html, page-contribute.html
│   │   ├── shortcodes/        # param.html, address.html
│   │   ├── activites/         # agenda.html, agenda.ics.ics (custom layout + iCal)
│   │   ├── histoire/          # chronologie.html (custom layout)
│   │   ├── contact/           # (reserved, currently empty)
│   │   ├── index.html         # Homepage template
│   │   ├── 404.html           # Error page
│   │   └── robots.txt         # Robots template
│   ├── static/css/            # style.css, colors.css, filters.css, agenda.css, carousel.css, chronologie.css, notices.css
│   ├── static/js/             # main.js, carousel.js, agenda.js, chronologie.js, notices.js (jQuery-based)
│   └── static/images/         # Theme images (carousel photos)
├── static/                    # Static assets copied as-is (site images, icons, favicons)
├── layouts/                   # Override directory (empty — all layouts live in theme)
├── public/                    # Generated output (gitignored in production)
├── .github/
│   ├── workflows/             # CI: hugo.yml (deploy), hugo-preview.yml (PR checks)
│   ├── CONTRIBUTING.md        # Contributor guide (French, for non-technical users)
│   └── ISSUE_TEMPLATE/        # bug-site.yml, modification-contenu.yml, nouvelle-page.yml
├── infrastructure/            # AWS CloudFormation deployment scripts
├── deploy.sh                  # S3/CloudFront deployment script
└── TASKS.md                   # Task tracking log (completed site modifications)
```

## Key Conventions

- Content sections map 1:1 to top-level menu items in `hugo.toml`
- Each section folder has an `_index.md` for the section landing page
- Agenda pages are year-based: `agenda-2024.md`, `agenda-2025.md`, `agenda-2026.md`
- The agenda menu link in `hugo.toml` should point to the current year's agenda
- Custom layouts exist only for `activites/agenda` and `histoire/chronologie`; all other pages use `_default/single.html`
- The theme is a git submodule — changes to templates/CSS/JS go in `themes/sarfrance-theme/`
- The root `layouts/` directory is empty and reserved for theme overrides if needed
- Data files in `data/` use structured YAML with typed entries (event types, tags, periods)
- Tag/type colors are defined as CSS classes in `colors.css`, named `tag-{key}` or `type-{key}` where `{key}` is the urlized YAML key (e.g., YAML key `révolte` → CSS class `tag-revolte`). Templates derive the class name via `{{ $key | urlize }}`. The `removePathAccents = true` setting in `hugo.toml` ensures `urlize` strips accents. Never use inline `style=` or `color:` fields in YAML — add a new CSS class in `colors.css` instead.
- Filter buttons across agenda, chronologie, and notices share a common `filter-btn` class defined in `filters.css` (pill shape, font size, padding, hover/active states). Page-specific CSS files should not duplicate filter base styles.
- Active filter color overrides (`.filter-btn.active.tag-xxx` / `.filter-btn.active.type-xxx`) are defined at the bottom of `colors.css`, keeping all color definitions in one place.
- CSS load order in `baseof.html`: `colors.css` → `style.css` → `filters.css` → page-specific CSS. This ensures variables are available, then base styles, then shared filter styles, then page overrides.
- JavaScript must never be inlined in HTML templates — all JS lives in external `.js` files under `themes/sarfrance-theme/static/js/`
- jQuery 3.x is loaded from CDN in `baseof.html` and is the standard JS framework — use `$()` selectors and jQuery methods, not vanilla DOM APIs
- JS load order in `baseof.html`: jQuery CDN → `main.js` (global). Page-specific scripts (e.g., `agenda.js`, `chronologie.js`, `notices.js`, `carousel.js`) are loaded in their respective layout templates.

## Multilanguage Architecture

- Hugo's built-in multilingual mode is configured in `hugo.toml` under `[languages]`
- Default language: `fr` (French, weight 1) — served at root `/`
- Secondary language: `en` (English, weight 2) — served under `/en/`
- `defaultContentLanguageInSubdir = false` means French pages have no `/fr/` prefix
- Content directories: `content/fr/` and `content/en/` (set via `contentDir` per language)
- Each language has its own full menu tree defined in `hugo.toml` (`[[languages.fr.menus.main]]`, `[[languages.en.menus.main]]`)
- English menu URLs are prefixed with `/en/` (e.g. `/en/organisation/nssar/`)
- Language-specific params (description, heroTitle, footerText, etc.) live under `[languages.XX.params]`
- UI strings (button labels, section titles, etc.) use `{{ i18n "key" }}` and are defined in `i18n/fr.yaml` and `i18n/en.yaml`
- Templates use `{{ .Lang }}` and `{{ eq .Lang "en" }}` to adapt behavior per language
- `hreflang` alternate links are generated automatically in `baseof.html` when translations exist
- Content files in `content/fr/` and `content/en/` are paired by identical file paths (e.g. `content/fr/histoire/chronologie.md` ↔ `content/en/histoire/chronologie.md`)

## Page Contribute Widget

- `page-contribute.html` partial renders an edit icon in the page header of every `single.html` page
- On hover/focus, a dropdown shows links to open GitHub issues (bug report, content modification) pre-filled with the page title
- Links point to the GitHub repo `gautric/preprod.sarfrance.org` using issue templates from `.github/ISSUE_TEMPLATE/`
- Labels are translated via i18n keys (`contribute_error`, `contribute_comment`, etc.)
