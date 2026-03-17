# Project Structure

```
.
├── hugo.toml                  # Site configuration (menus, params, markup)
├── content/                   # Markdown content pages (one folder per section)
│   ├── _index.md              # Homepage
│   ├── organisation/          # Organisation section (NSSAR, statuts, etc.)
│   ├── histoire/              # History section (chronologie, operations, etc.)
│   ├── activites/             # Activities section (agenda, events, publications)
│   └── contact/               # Contact section (forms, dues, donations, legal)
├── data/                      # YAML data files consumed by templates
│   ├── agenda.yaml            # Events with types, dates, titles
│   ├── carousel.yaml          # Homepage carousel images
│   └── chronologie.yaml       # Historical timeline with periods and events
├── themes/sarfrance-theme/    # Custom Hugo theme (git submodule)
│   ├── layouts/               # All HTML templates
│   │   ├── _default/          # baseof.html, list.html, single.html
│   │   ├── partials/          # header.html, footer.html
│   │   ├── shortcodes/        # param.html
│   │   ├── activites/         # agenda.html (custom layout)
│   │   └── histoire/          # chronologie.html (custom layout)
│   ├── static/css/            # Stylesheets (style.css, colors.css, agenda.css, etc.)
│   └── static/js/             # Scripts (main.js, carousel.js)
├── static/                    # Static assets copied as-is to public/
│   └── images/                # Site images, icons, favicons
├── layouts/                   # Override directory (empty — all layouts in theme)
├── public/                    # Generated output (gitignored in production)
├── .github/
│   ├── workflows/             # CI: hugo.yml (deploy), hugo-preview.yml (PR checks)
│   ├── CONTRIBUTING.md        # Contributor guide (French, for non-technical users)
│   └── ISSUE_TEMPLATE/        # Issue templates
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
