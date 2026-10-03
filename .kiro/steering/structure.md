# Project Structure

```
.
├── config/                    # Site configuration (merged by Hugo)
│   ├── _default/
│   │   ├── hugo.yaml          # Core settings, markup, sitemap, output formats, services
│   │   ├── languages.yaml     # Multilingual languages block (per-language params, no menus)
│   │   ├── menus.fr.yaml      # French main menu
│   │   ├── menus.en.yaml      # English main menu
│   │   └── params.yaml        # Global params (agenda year, address, contact, fees, Turnstile)
│   └── development/
│       └── hugo.yaml          # Dev overrides (localhost baseURL, used by hugo server)
├── content/
│   ├── fr/                    # French content (default language)
│   │   ├── _index.md          # Homepage FR
│   │   ├── la-societe/        # La Société section (menu identifier stays "organisation")
│   │   ├── histoire/          # History section
│   │   │   ├── antilles/      # Antilles sub-section
│   │   │   ├── biographies/   # Biographies sub-section
│   │   │   └── ephemerides/   # Éphémérides sub-section
│   │   ├── activites/         # Activities section (agenda, events, publications)
│   │   └── contact/           # Contact section (forms, dues, donations, legal)
│   └── en/                    # English content (mirror of fr/)
│       ├── _index.md          # Homepage EN
│       ├── la-societe/
│       ├── histoire/
│       │   ├── antilles/
│       │   ├── biographies/
│       │   └── ephemerides/
│       ├── activites/
│       └── contact/
├── i18n/                      # UI string translations
│   ├── fr.yaml                # French labels (default)
│   └── en.yaml                # English labels
├── data/                      # YAML data files consumed by templates
│   ├── agenda.yaml            # Events with types, dates, titles
│   ├── books.yaml             # Library inventory (consumed by the books shortcode)
│   ├── carousel.yaml          # Homepage carousel images
│   ├── chronologie.yaml       # Historical timeline with periods and events
│   ├── notices.yaml           # Biographical notices for the dictionary
│   ├── fr/lieux-de-memoire.yaml  # Sites of remembrance — FR content data
│   ├── en/lieux-de-memoire.yaml  # Sites of remembrance — EN content data
│   └── metadata/              # Structural metadata (types/tags/categories): agenda.yaml, books.yaml, chronologie.yaml, lieux-de-memoire.yaml, notices.yaml
├── themes/sarfrance/          # Custom Hugo theme (git submodule, theme key: "sarfrance")
│   ├── layouts/
│   │   ├── _default/          # baseof.html, list.html, single.html
│   │   ├── partials/          # header.html, footer.html, head-meta.html, head-favicons.html, head-css.html, head-fonts.html, head-jsonld.html, site-scripts.html, page-contribute.html, page-header.html, lang-prefix.html, book.html, format-date.html, icon-wikipedia.html
│   │   ├── shortcodes/        # param.html, address.html, books.html, contact.html
│   │   ├── activites/         # agenda.html, agenda.ics.ics, notices.html, bibliotheque.html, bibliotheque.json.json, phototheque.html
│   │   ├── histoire/          # chronologie.html, notices.html, lieux-de-memoire.html
│   │   ├── contact/           # contact.html
│   │   ├── index.html         # Homepage template
│   │   ├── 404.html           # Error page
│   │   ├── robots.txt         # Robots template
│   │   └── sitemap.xml        # Sitemap template
│   ├── assets/css/            # style.css, colors.css, filters.css, agenda.css, bibliotheque.css, carousel.css, chronologie.css, contact.css, lieux-de-memoire.css, notices.css, phototheque.css (Hugo asset pipeline)
│   ├── assets/js/             # Vanilla JS, organised in tiers (Hugo asset pipeline):
│   │   ├── core.js            #   single bundle of global SAR helpers (DOM, lang, net, dom, leaflet)
│   │   ├── shared/            #   filter-engine.js, timeline-page.js (reusable cross-page modules)
│   │   └── pages/             #   main.js, carousel.js, agenda.js, chronologie.js, lieux-de-memoire.js, notices.js, bibliotheque.js, phototheque.js, contact.js
│   └── static/                # Theme-only static files (currently empty — content images live in root static/)
├── static/                    # Static assets copied as-is (site images, icons, favicons)
│   ├── images/carousel/       # Carousel photos (homepage)
├── layouts/                   # Override directory (empty — all layouts live in theme)
├── public/                    # Generated output (gitignored in production)
├── .github/
│   ├── workflows/             # CI: deploy.yml (deploy), preview.yml (PR checks) + agent-*.md/*.lock.yml, agentics-maintenance.yml, copilot-setup-steps.yml
│   ├── CONTRIBUTING.md        # Contributor guide (French, for non-technical users)
│   └── ISSUE_TEMPLATE/        # bug-site.yml, modification-contenu.yml, nouvelle-page.yml
├── infrastructure/            # AWS CloudFormation deployment scripts
├── deploy.sh                  # S3/CloudFront deployment script
└── TASKS.md                   # Task tracking log (completed site modifications)
```

## Key Conventions

- Content sections map 1:1 to top-level menu items in `config/_default/menus.fr.yaml` / `menus.en.yaml`
- Each section folder has an `_index.md` for the section landing page
- Agenda pages are year-based: `agenda-2024.md`, `agenda-2025.md`, `agenda-2026.md`
- The agenda menu link in `config/_default/menus.fr.yaml` / `menus.en.yaml` should point to the current year's agenda
- Custom layouts exist for `activites/agenda`, `activites/bibliotheque`, `activites/notices`, `histoire/chronologie`, `histoire/lieux-de-memoire`, `histoire/notices`, and `contact/contact`; all other pages use `_default/single.html`
- The theme directory is `themes/sarfrance/` and the theme key in `config/_default/hugo.yaml` is `sarfrance` — changes to templates/CSS/JS go there
- Content images (carousel photos, illustrations, etc.) live in the root `static/` directory, organized in topic subfolders (e.g. `static/images/carousel/`, `static/images/histoire-sar-france/`). Never put content images in `themes/sarfrance/static/` — the theme's `static/` is reserved for theme-intrinsic assets only. This keeps content assets in the main repo and avoids coupling them to the submodule.
- The root `layouts/` directory is empty and reserved for theme overrides if needed
- Data files in `data/` use structured YAML with typed entries (event types, tags, periods)
- Tag/type colors are defined as CSS classes in `colors.css`, named `tag-{key}` or `type-{key}` where `{key}` is the urlized YAML key (e.g., YAML key `révolte` → CSS class `tag-revolte`). Templates derive the class name via `{{ $key | urlize }}`. The `removePathAccents = true` setting in `config/_default/hugo.yaml` ensures `urlize` strips accents. Never use inline `style=` or `color:` fields in YAML — add a new CSS class in `colors.css` instead.
- `filters.css` defines shared UI components used across all data-driven pages (agenda, chronologie, notices, bibliothèque, lieux-de-memoire):
  - `.filter-btn` — pill-shaped filter buttons (base + `.active` state)
  - `.page-filters` — flex container for filter button groups
  - `.tag` — small colored pills inside cards
  - `.page-search-wrap` + `.page-search` — search input with focus ring
  - `.page-no-result` — "no results" message
  - `.page-meta` + `.page-meta-count` + `.page-meta-hint` — count/revision info in page headers
  - `.page-card` — card with border, radius, hover shadow (+ `.page-card-header`, `.page-card-title`, `.page-card-date`, `.page-card-desc`, `.page-card-tags`, `.page-card-link`)
  - `.tl-axis` — vertical timeline container (+ `.tl-row`, `.tl-dot`, `.tl-dot--lg`, `.tl-group-title`)
  - `.event-new` — "Nouveau / New" badge on recent agenda events (colours in `colors.css`)
  - `.filter-btn-count` — count pill inside a filter button, outlined in `currentColor` so it stays legible in every button state
  - `.filter-btn.filter-all` — icon of the "Tout / All" button: a 3×3 grid of squares drawn as an SVG mask tinted with `currentColor`. Every "Tout / All" filter button must carry this class
- Page-specific CSS files should not duplicate these shared styles — only add page-specific overrides
- Active filter color overrides (`.filter-btn.active.tag-xxx` / `.filter-btn.active.type-xxx`) are defined at the bottom of `colors.css`, keeping all color definitions in one place.
- Emoji icons for tags/types are defined in page-specific CSS using `::before` on both `.tag.xxx` and `.filter-btn.xxx` selectors — never scoped to a parent container
- CSS load order in `baseof.html`: `colors.css` → `style.css` → `filters.css` → page-specific CSS. This ensures variables are available, then base styles, then shared filter styles, then page overrides.
- CSS and JS files live in `themes/sarfrance/assets/` (not `static/`) and are processed through Hugo's asset pipeline with `resources.Get` + `resources.Fingerprint` for cache busting and SRI integrity hashes
- JavaScript rules (no inline JS, vanilla only, `SAR` helpers from `core.js`, JS load order, `FilterEngine`, `SAR.initTimelinePage`, `initPageCardMaps`) are defined in `tech.md` (§ Frontend and § JavaScript Rules): #[[file:.kiro/steering/tech.md]]
- Language prefix logic is centralized in the `lang-prefix.html` partial — use `{{ partial "lang-prefix.html" . }}` instead of inline `{{ if eq .Lang "en" }}/en{{ end }}` checks
- The `currentAgendaYear` param in `config/_default/params.yaml` drives the agenda year across menus, homepage, and 404 — update it once per year instead of searching for hardcoded years
- The `githubRepo` param in `config/_default/params.yaml` configures the GitHub repository URL used by the page-contribute widget
- The `footerText` param uses `{year}` placeholder, replaced at build time by `now.Format "2006"` — no manual year updates needed

## Multilanguage Architecture

- Hugo's built-in multilingual mode is configured in `config/_default/languages.yaml`
- Default language: `fr` (French, weight 1) — served at root `/`
- Secondary language: `en` (English, weight 2) — served under `/en/`
- `defaultContentLanguageInSubdir = false` means French pages have no `/fr/` prefix
- Content directories: `content/fr/` and `content/en/` (set via `contentDir` per language)
- Each language has its own full menu tree in its own file (`config/_default/menus.fr.yaml`, `config/_default/menus.en.yaml`)
- English menu URLs are prefixed with `/en/` (e.g. `/en/la-societe/nssar/`)
- Language-specific params (description, heroTitle, footerText, etc.) live under `languages.XX.params`
- UI strings (button labels, section titles, etc.) use `{{ i18n "key" }}` and are defined in `i18n/fr.yaml` and `i18n/en.yaml`
- Templates use `{{ .Lang }}` and `{{ eq .Lang "en" }}` to adapt behavior per language
- `hreflang` alternate links are generated automatically in `baseof.html` when translations exist, including `x-default` pointing to the French version
- Content files in `content/fr/` and `content/en/` are paired by identical file paths (e.g. `content/fr/histoire/chronologie.md` ↔ `content/en/histoire/chronologie.md`)

## Page Contribute Widget

- `page-header.html` partial renders the `<h1>`, optional description, and the page-contribute widget. It accepts either a plain page context (`{{ partial "page-header.html" . }}`) or a dict with overrides (`{{ partial "page-header.html" (dict "ctx" . "title" "X" "desc" "Y" "extra" "<p>...</p>") }}`)

## Page Contribute Widget

- `page-contribute.html` partial renders an edit icon in the page header of every `single.html` page
- On hover/focus, a dropdown shows links to open GitHub issues (bug report, content modification) pre-filled with the page title
- Links point to the GitHub repo configured via `params.githubRepo` in `config/_default/params.yaml`, using issue templates from `.github/ISSUE_TEMPLATE/`
- Labels are translated via i18n keys (`contribute_error`, `contribute_comment`, etc.)
- The widget is invoked automatically by `page-header.html` — do not call it directly in layout templates

## Shortcodes

- `{{< books genre="marine" >}}` — renders a filtered book grid from `data/books.yaml`; params: `genre`, `author`, `limit`
- `{{< contact >}}` or `{{< contact "phone" >}}` — inlines a contact value from `config/_default/params.yaml` `contact`
- `{{< param "key" >}}` — inlines any site param value
- `{{< address >}}` — renders the full address from `config/_default/params.yaml` `address`

## Agenda

- Agenda-specific conventions (event fields in `data/agenda.yaml`, `photos` and photo gallery highlighting, `update` field, "Nouveau / New" badge and filter) live in `structure-agenda.md`, included automatically when agenda files are open (`data/agenda.yaml`, agenda layouts, JS, CSS and partials, `scripts/agenda_update_dates.py`, `agent-agenda`).
