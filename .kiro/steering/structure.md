# Project Structure

```
.
├── hugo.yaml                  # Site configuration (menus, params, markup, languages)
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
│   ├── chronologie.yaml       # Historical timeline with periods and events
│   └── notices.yaml           # Biographical notices for the dictionary
├── themes/sarfrance/          # Custom Hugo theme (git submodule, theme key: "sarfrance")
│   ├── layouts/
│   │   ├── _default/          # baseof.html, list.html, single.html
│   │   ├── partials/          # header.html, footer.html, head-meta.html, head-favicons.html, head-css.html, head-fonts.html, head-jsonld.html, site-scripts.html, page-contribute.html, page-header.html, lang-prefix.html
│   │   ├── shortcodes/        # param.html, address.html, books.html, contact.html
│   │   ├── activites/         # agenda.html, agenda.ics.ics, notices.html, bibliotheque.html, bibliotheque.json.json
│   │   ├── histoire/          # chronologie.html, notices.html, hauts-lieux.html
│   │   ├── contact/           # contact.html
│   │   ├── index.html         # Homepage template
│   │   ├── 404.html           # Error page
│   │   └── robots.txt         # Robots template
│   ├── assets/css/            # style.css, colors.css, filters.css, agenda.css, bibliotheque.css, carousel.css, chronologie.css, contact.css, hauts-lieux.css, notices.css (Hugo asset pipeline)
│   ├── assets/js/             # main.js, agenda.js, bibliotheque.js, carousel.js, chronologie.js, contact.js, hauts-lieux.js, notices.js (jQuery-based, Hugo asset pipeline)
│   └── static/                # Theme-only static files (currently empty — content images live in root static/)
├── static/                    # Static assets copied as-is (site images, icons, favicons)
│   ├── images/carousel/       # Carousel photos (homepage)
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

- Content sections map 1:1 to top-level menu items in `hugo.yaml`
- Each section folder has an `_index.md` for the section landing page
- Agenda pages are year-based: `agenda-2024.md`, `agenda-2025.md`, `agenda-2026.md`
- The agenda menu link in `hugo.yaml` should point to the current year's agenda
- Custom layouts exist for `activites/agenda`, `activites/bibliotheque`, `activites/notices`, `histoire/chronologie`, `histoire/hauts-lieux`, `histoire/notices`, and `contact/contact`; all other pages use `_default/single.html`
- The theme directory is `themes/sarfrance/` and the theme key in `hugo.yaml` is `sarfrance` — changes to templates/CSS/JS go there
- Content images (carousel photos, illustrations, etc.) live in the root `static/` directory, organized in topic subfolders (e.g. `static/images/carousel/`, `static/images/histoire-sar-france/`). Never put content images in `themes/sarfrance/static/` — the theme's `static/` is reserved for theme-intrinsic assets only. This keeps content assets in the main repo and avoids coupling them to the submodule.
- The root `layouts/` directory is empty and reserved for theme overrides if needed
- Data files in `data/` use structured YAML with typed entries (event types, tags, periods)
- Tag/type colors are defined as CSS classes in `colors.css`, named `tag-{key}` or `type-{key}` where `{key}` is the urlized YAML key (e.g., YAML key `révolte` → CSS class `tag-revolte`). Templates derive the class name via `{{ $key | urlize }}`. The `removePathAccents = true` setting in `hugo.yaml` ensures `urlize` strips accents. Never use inline `style=` or `color:` fields in YAML — add a new CSS class in `colors.css` instead.
- `filters.css` defines shared UI components used across all data-driven pages (agenda, chronologie, notices, bibliothèque, hauts-lieux):
  - `.filter-btn` — pill-shaped filter buttons (base + `.active` state)
  - `.page-filters` — flex container for filter button groups
  - `.tag` — small colored pills inside cards
  - `.page-search-wrap` + `.page-search` — search input with focus ring
  - `.page-no-result` — "no results" message
  - `.page-meta` + `.page-meta-count` + `.page-meta-hint` — count/revision info in page headers
  - `.page-card` — card with border, radius, hover shadow (+ `.page-card-header`, `.page-card-title`, `.page-card-date`, `.page-card-desc`, `.page-card-tags`, `.page-card-link`)
  - `.tl-axis` — vertical timeline container (+ `.tl-row`, `.tl-dot`, `.tl-dot--lg`, `.tl-group-title`)
- Page-specific CSS files should not duplicate these shared styles — only add page-specific overrides
- Active filter color overrides (`.filter-btn.active.tag-xxx` / `.filter-btn.active.type-xxx`) are defined at the bottom of `colors.css`, keeping all color definitions in one place.
- Emoji icons for tags/types are defined in page-specific CSS using `::before` on both `.tag.xxx` and `.filter-btn.xxx` selectors — never scoped to a parent container
- CSS load order in `baseof.html`: `colors.css` → `style.css` → `filters.css` → page-specific CSS. This ensures variables are available, then base styles, then shared filter styles, then page overrides.
- CSS and JS files live in `themes/sarfrance-theme/assets/` (not `static/`) and are processed through Hugo's asset pipeline with `resources.Get` + `resources.Fingerprint` for cache busting and SRI integrity hashes
- JavaScript must never be inlined in HTML templates — all JS lives in external `.js` files under `themes/sarfrance-theme/assets/js/`
- jQuery 4.x is loaded from CDN in `baseof.html` and is the standard JS framework — use `$()` selectors and jQuery methods, not vanilla DOM APIs
- JS load order in `baseof.html`: jQuery CDN → `main.js` (global). Page-specific scripts (e.g., `agenda.js`, `chronologie.js`, `notices.js`, `carousel.js`) are loaded in their respective layout templates.
- Language prefix logic is centralized in the `lang-prefix.html` partial — use `{{ partial "lang-prefix.html" . }}` instead of inline `{{ if eq .Lang "en" }}/en{{ end }}` checks
- The `currentAgendaYear` param in `hugo.yaml` drives the agenda year across menus, homepage, and 404 — update it once per year instead of searching for hardcoded years
- The `githubRepo` param in `hugo.yaml` configures the GitHub repository URL used by the page-contribute widget
- The `footerText` param uses `{year}` placeholder, replaced at build time by `now.Format "2006"` — no manual year updates needed

## Multilanguage Architecture

- Hugo's built-in multilingual mode is configured in `hugo.yaml` under `languages`
- Default language: `fr` (French, weight 1) — served at root `/`
- Secondary language: `en` (English, weight 2) — served under `/en/`
- `defaultContentLanguageInSubdir = false` means French pages have no `/fr/` prefix
- Content directories: `content/fr/` and `content/en/` (set via `contentDir` per language)
- Each language has its own full menu tree defined in `hugo.yaml` (`languages.fr.menus.main`, `languages.en.menus.main`)
- English menu URLs are prefixed with `/en/` (e.g. `/en/organisation/nssar/`)
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
- Links point to the GitHub repo configured via `params.githubRepo` in `hugo.yaml`, using issue templates from `.github/ISSUE_TEMPLATE/`
- Labels are translated via i18n keys (`contribute_error`, `contribute_comment`, etc.)
- The widget is invoked automatically by `page-header.html` — do not call it directly in layout templates

## Shortcodes

- `{{< books genre="marine" >}}` — renders a filtered book grid from `data/books.yaml`; params: `genre`, `author`, `limit`
- `{{< contact >}}` or `{{< contact "phone" >}}` — inlines a contact value from `hugo.yaml` `params.contact`
- `{{< param "key" >}}` — inlines any site param value
- `{{< address >}}` — renders the full address from `hugo.yaml` `params.address`

## Agenda Event Fields

Recent events in `data/agenda.yaml` support extended fields beyond the base `date`/`titre`/`type`:
- `dateEnd` — end date for multi-day events
- `description` — short text shown on the card
- `lieu` — venue name
- `heure` — time string (e.g. `"18:00"`)
- `lien` — external URL (wraps the title as a link)
- `lat` / `lon` — coordinates for the Leaflet mini-map on the card (set to `0` to suppress map)

Older events (pre-2026) may omit these fields — that is expected and valid.
