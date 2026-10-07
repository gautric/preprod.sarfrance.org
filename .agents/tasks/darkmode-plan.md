---
title: Dark mode (prefers-color-scheme) — implementation plan
---

# Dark mode via system preference — implementation plan

## Goal

Add an automatic dark theme to the SAR France Hugo site, driven only by the OS
setting through `@media (prefers-color-scheme: dark)`. No toggle, no JavaScript,
no new CSS file. The light theme must stay **byte-for-byte identical**. Dark-mode
rules are consolidated in a single commented block at the bottom of
`themes/sarfrance/assets/css/colors.css`, plus a handful of unavoidable
component overrides kept inside that same block.

## Chosen approach — hybrid: mostly variable-override, with a small, surgical
"semantic token" promotion first

The site already routes nearly all colors through CSS custom properties on
`:root` in `colors.css`; `style.css`, `filters.css` and the page CSS consume
them with `var(--…)`. A pure "redefine the variables in a dark `@media` block"
approach is **not** sufficient on its own, because three palette variables are
**semantically overloaded** — the same token is used both as a *light surface /
white-text-on-dark* color and as a *dark background / dark-text-on-light* color:

- `--white` — used as page/card/nav **surface** backgrounds AND as **white text**
  on dark/colored surfaces (hero, header, buttons, `.tag`, active filters).
- `--navy-blue` — used as **heading / link / nav text** on light surfaces AND as
  a **dark background** (hero, page-header gradient, mobile nav, timeline dots).
- `--primary` (#ad2c11) — used as **accent text** (content `h3`, link hover,
  `.read-more`, required marks) AND as a **button/badge background** with white
  text, AND as decorative **borders/dots**.

Flipping any of those three directly in the dark block would break the other
role (e.g. flipping `--white` to dark would turn hero/button text dark and
unreadable). So the plan **promotes the overloaded roles to new semantic tokens
first** (role-named: surface / text-heading / link / accent), repoints the
affected rules to them, and leaves the palette tokens for their intrinsically
colored roles. In **light mode the new tokens resolve to the exact same palette
values**, so the light theme does not change. Only then is the dark `@media`
block added, overriding the semantic tokens plus the non-overloaded palette
tokens (grays, muted text, tints, shadows) that are safe to redefine directly.

Verified during exploration (grep over `themes/sarfrance/assets/css/*.css`):
- Hardcoded colors outside `colors.css` exist only in **`contact.css`** (6 hex
  values for form feedback — will be promoted to variables) and **`phototheque.css`**
  (lightbox: `rgba(0,0,0,…)` overlay + `#fff` text — intentionally dark, left
  untouched).
- `chronologie.css` uses only `var(--text-muted)`; `carousel.css` uses only
  overlay/white tokens over images (left untouched — it sits over photos).
- No named colors (`white`, `black`, …) bypass variables anywhere.

Images and maps are **never inverted**. No `filter: invert()`. Leaflet raster
tiles and photos keep their colors; only the Leaflet container's load-state
background is softened in dark mode.

## Files touched

| File | Change |
|------|--------|
| `themes/sarfrance/assets/css/colors.css` | Add semantic tokens + feedback vars to `:root` (step 1); add the dark `@media` block at the bottom (step 6) |
| `themes/sarfrance/assets/css/style.css` | Repoint overloaded `var(--white)` / `var(--navy-blue)` / `var(--primary)` usages to semantic tokens (step 2) |
| `themes/sarfrance/assets/css/filters.css` | Same repointing for shared components (step 3) |
| `themes/sarfrance/assets/css/agenda.css` | Repoint `--primary` accent-text + `.agenda-type` stays `--white` (step 4) |
| `themes/sarfrance/assets/css/bibliotheque.css` | Repoint surface/text/accent usages (step 4) |
| `themes/sarfrance/assets/css/notices.css` | Repoint title/link/accent usages (step 4) |
| `themes/sarfrance/assets/css/lieux-de-memoire.css` | Repoint `--primary` link accent (step 4) |
| `themes/sarfrance/assets/css/contact.css` | Promote 6 feedback hex values to `var(--feedback-*)` (step 5) |

No template, JS, config or new CSS file changes. CSS load order
(`colors.css → style.css → filters.css → page CSS`, from
`themes/sarfrance/layouts/partials/head-css.html`) is unchanged, so the dark
overrides in `colors.css` are defined before every consumer — correct, because
they are `@media`-guarded `:root` variable redefinitions and component rules
that only need to win inside the dark media context.

## Build / verification commands (discovered)

- Hugo extended `v0.166.0` (pinned via `HUGO_VERSION_CI` in `Makefile`).
- Build check: `make build-check` → runs `hugo --minify --destination
  /tmp/sarfrance-build-check --cacheDir /tmp/sarfrance-build-check/cache`.
- Dev server for manual inspection: `make serve` → `hugo server --buildDrafts`
  (default `http://localhost:1313/`).
- Note on verification scope: Hugo's asset pipeline (`resources.Get` +
  `Fingerprint`) copies/fingerprints CSS but does **not** lint CSS syntax, so a
  green build only proves templates + pipeline are intact. Correctness of the
  styling itself is verified **manually in a browser**: load key pages, then
  toggle the OS/DevTools "Emulate prefers-color-scheme: dark" and confirm the
  result. For the light-theme-unchanged steps (1–5), the check is that pages
  look identical with dark emulation **off** (tokens resolve to the same palette
  values). Fingerprinted filenames change between builds, so do not diff
  `public/` CSS to prove "no change".

## Dark palette — foreground/background variable pairs

All contrast ratios are approximate and target **WCAG AA (≥ 4.5:1 for body
text, ≥ 3:1 for large text / UI)**. Backgrounds are soft near-black slate (not
pure `#000`); text is off-white (not pure `#fff`).

### New semantic tokens (added in step 1; light value = current palette, so light theme is unchanged)

| Token | Role | Light value | Dark value |
|-------|------|-------------|------------|
| `--bg-body` | page background (`body`, full-width sections) | `#ffffff` (`--white`) | `#15181f` |
| `--bg-surface` | cards, nav bar, submenu, inputs, dropdowns, pills | `#ffffff` (`--white`) | `#1e222b` |
| `--input-bg` | form fields, search box | `#ffffff` (`--white`) | `#1a1e26` |
| `--text-heading` | headings, nav/card titles, labels | `#1a2a4a` (`--navy-blue`) | `#eef1f6` |
| `--link` | default body links | `#1a2a4a` (`--navy-blue`) | `#a9c2e8` |
| `--link-hover` | link hover | `#ad2c11` (`--primary`) | `#ef8a73` |
| `--accent` | red accent **text** (`h3`, `.read-more`, required, bio links) | `#ad2c11` (`--primary`) | `#ef8a73` |

### Non-overloaded palette tokens redefined directly in the dark block

| Token | Light | Dark |
|-------|-------|------|
| `--text-dark` (body copy) | `#1a1a1a` | `#e6e8ec` |
| `--text-light` (muted paragraphs) | `#555555` | `#b4bac4` |
| `--text-muted` (meta/captions) | `#718096` | `#9aa3b2` |
| `--primary-tint-15` (tinted sections, contact form, submenu hover) | `#f3dfdb` | `#3a2420` |
| `--gray-light` (event/book card alt surface) | `#f5f5f5` | `#262b36` |
| `--gray-border` | `#c8c8c8` | `#3a4150` |
| `--gray-border-light` (card/timeline borders) | `#e2e8f0` | `#2b313c` |
| `--gray-border-medium` (inputs/filter borders) | `#d1d5db` | `#3a4150` |
| `--gray-border-hover` | `#a0aec0` | `#556070` |
| `--gray-timeline` (axis + dot ring) | `#cbd5e0` | `#3a4150` |
| `--gray-placeholder` | `#aaa` | `#70788a` |
| `--shadow` | `rgba(0,0,0,.1)` | `rgba(0,0,0,.5)` |
| `--shadow-subtle` | `rgba(0,0,0,.06)` | `rgba(0,0,0,.4)` |
| `--shadow-dark` | `rgba(0,0,0,.3)` | `rgba(0,0,0,.6)` |
| `--focus-ring` | `rgba(173,44,17,.15)` | `rgba(239,138,115,.35)` |

### Category pill colors — lighten only the darkest few (dark block, `:root`)

The `type-/tag-/cat-` pills carry white text on a saturated `--color-*` fill and
stay readable on a dark page, but the darkest four sit too close to the page
background. Lighten them in the dark block (white text contrast stays ≥ 6:1):

| Token | Light | Dark |
|-------|-------|------|
| `--color-navy` | `#143d78` | `#2d5aa0` |
| `--color-dark-blue` | `#1c5590` | `#2f71bd` |
| `--color-brown` | `#96590e` | `#b1701a` |
| `--color-slate` | `#4a6070` | `#5f7a8e` |

### Form-feedback tokens (new in step 5; light = current `contact.css` hex)

| Token | Light | Dark |
|-------|-------|------|
| `--feedback-error-text` | `#c0392b` | `#f3a79b` |
| `--feedback-error-bg` | `#fdecea` | `#3a1f1d` |
| `--feedback-error-border` | `#f5c6cb` | `#5c2b27` |
| `--feedback-success-text` | `#1e7e34` | `#86d49b` |
| `--feedback-success-bg` | `#d4edda` | `#16301f` |
| `--feedback-success-border` | `#c3e6cb` | `#2c5c3a` |

### Expected contrast (dark mode)

- `--text-dark #e6e8ec` on `--bg-body #15181f` ≈ **14.5:1** (AAA); on
  `--bg-surface #1e222b` ≈ **12.8:1**.
- `--text-heading #eef1f6` on `--bg-body` ≈ **15.3:1**.
- `--text-light #b4bac4` on `--bg-body` ≈ **8.7:1**.
- `--text-muted #9aa3b2` on `--bg-body` ≈ **6.0:1**.
- `--link #a9c2e8` on `--bg-body` ≈ **9.7:1**; on `--bg-surface` ≈ **8.5:1**.
- `--accent #ef8a73` on `--bg-body` ≈ **7.3:1**; on `--bg-surface` ≈ **6.4:1**.
- White text on `--primary #ad2c11` (buttons/badges, unchanged) ≈ **6.7:1**.
- White text on lightened `--color-navy #2d5aa0` ≈ **6.9:1**.
- `--feedback-error-text` on its dark bg ≈ **7:1**; success ≈ **8:1**.

All body-text pairs clear 4.5:1; all UI/large-text pairs clear 3:1.

### Tokens kept as-is in dark mode (intrinsically colored, backgrounds stay dark both modes)

`--primary` (button/badge/border/dot fill — white text already AA on it),
`--primary-dark`, `--navy-blue` / `--navy-dark` **as backgrounds** (hero,
page-header, top-bar, footer, mobile nav), `--gold`, `--cream`, `--white` **as
white-text-on-dark**, `--white-85`, `--hero-gradient-*`, `--overlay-*`,
`--event-new-bg/-text`, `--photo-highlight`, and all `--color-*` not listed above.

---

# Implementation steps

- [ ] 1. **Add the semantic tokens and feedback vars to `:root` in `colors.css`.**
      In the existing `:root` block add a new commented section "Semantic
      surface / text roles" defining `--bg-body`, `--bg-surface`, `--input-bg`,
      `--text-heading`, `--link`, `--link-hover`, `--accent` — each set to the
      current palette value shown in the table above (e.g. `--text-heading: var(--navy-blue);`),
      and the six `--feedback-*` vars set to the current `contact.css` hex
      values. This is additive and changes nothing visually yet.
      Files: `themes/sarfrance/assets/css/colors.css`
      Verify: `make build-check` succeeds; `make serve` and confirm every page
      renders unchanged (dark emulation OFF).

- [ ] 2. **Repoint overloaded usages in `style.css` to the semantic tokens.**
      Replace only the *role* usages, leaving white-text-on-dark and
      dark-background usages on their palette tokens:
      - Surface backgrounds `var(--white)` → `var(--bg-body)` for `body`,
        `.intro`, `.features`, `.events`; → `var(--bg-surface)` for `.main-nav`,
        `.main-nav .container`, `.submenu`, `.feature-card`, `.list-item`,
        `.page-contribute-dropdown`; form `input/textarea/select` background →
        `var(--input-bg)`.
      - Heading/nav/label text `var(--navy-blue)` → `var(--text-heading)` for
        `h1–h6`, `.nav-menu > li > a`, `.submenu li a`, `.feature-card h3`,
        `.event-info h3`, `.list-item h2 a`, `.form-group label`,
        `.page-contribute-dropdown a`. Default link `a { color }` →
        `var(--link)`.
      - Accent text `var(--primary)` → `var(--accent)` for `a:hover`, global
        `h3`, `.content h3`, `.read-more` (and its `:hover` currently
        `--primary-dark` → `var(--accent)`), `.form-group .required`,
        `.error-404 .error-lead`, `.submenu li a:hover`, `.submenu li.active a`,
        `.page-contribute-dropdown a:hover`, `.list-item h2 a:hover`.
      - **Leave unchanged:** `.hero*`, `.page-header*`, `.top-bar`,
        `.site-footer*`, `.cta*`, `.btn-*` colors, `.event-date`, `.skip-link`,
        hamburger, `.hero h1 { color: var(--primary) }`, all `--navy-blue`
        *backgrounds* and all `--primary` *borders/dots*.
      Files: `themes/sarfrance/assets/css/style.css`
      Verify: `make build-check` succeeds; in browser (dark OFF) the home,
      a content page, header/footer and contact form look identical to before.

- [ ] 3. **Repoint shared components in `filters.css`.**
      - `.filter-btn` background `var(--white)` → `var(--bg-surface)`;
        `.filter-btn` text `var(--navy-blue)` → `var(--text-heading)`;
        `.filter-btn:hover` `border-color`+`color` `var(--navy-blue)` →
        `var(--text-heading)`.
      - `.page-search` background `var(--white)` → `var(--input-bg)`; its text
        `var(--navy-blue)` → `var(--text-heading)`.
      - `.page-card` background `var(--white)` → `var(--bg-surface)`.
      - `.page-card-title`, `.page-card-link`, `.tl-group-title`
        `var(--navy-blue)` → `var(--text-heading)`.
      - `.tl-dot` border `var(--white)` → `var(--bg-body)`; `.tl-dot--lg` border
        `var(--white)` → `var(--bg-body)`, and its `background`+`box-shadow`
        `var(--navy-blue)` → `var(--text-heading)` (so the group dot stays
        visible on a dark axis).
      - **Leave unchanged:** `.tag { color: var(--white) }`,
        `.filter-btn.active { color: var(--white) }` (white text on colored/red
        fill), `.event-new`, the `--primary` active-fill and focus borders.
      Files: `themes/sarfrance/assets/css/filters.css`
      Verify: `make build-check` succeeds; agenda / chronologie / notices /
      bibliothèque / lieux-de-memoire pages look identical (dark OFF): filter
      pills, cards and timeline unchanged.

- [ ] 4. **Repoint the page CSS accent/surface/text usages.** Same rules as
      step 2, scoped per file:
      - `agenda.css`: `.agenda-nav .filter-btn:hover` `border-color`+`color`
        `var(--primary)` → `var(--accent)`; `.agenda-card-link`,
        `.agenda-card-photos` `color: var(--primary)` → `var(--accent)`. **Leave**
        `.agenda-type { color: var(--white) }` (white on colored pill).
      - `bibliotheque.css`: `.book-sort-btn` background `var(--white)` →
        `var(--bg-surface)`; `.book-sort-btn:hover` + `.book-download a:hover`
        `var(--navy-blue)` → `var(--text-heading)`; `.book-sort-btn.active`
        `var(--primary)` → `var(--accent)`; `.book-card` background
        `var(--white)` → `var(--bg-surface)`; `.book-name`, `.book-name a`
        `var(--navy-blue)` → `var(--text-heading)`; `.book-name a:hover`
        `var(--primary)` (color + border) → `var(--accent)`. (`.book-card:hover`
        and `.book-author` use `--gray-light` / `--text-dark`, overridden
        directly in step 6 — no change here.)
      - `notices.css`: `.notice-title`, `.notice-firstname` `var(--navy-blue)` →
        `var(--text-heading)`; `.notice-bio-link` `var(--primary)` →
        `var(--accent)` and its `:hover` `--primary-dark` → `var(--accent)`;
        `.notice-wiki-link:hover` `var(--navy-blue)` → `var(--text-heading)`.
        **Leave** `.notice-card` `border-left: … var(--primary)` /
        `:hover … var(--primary-dark)` (decorative border).
      - `lieux-de-memoire.css`: `.hl-card-link { color: var(--primary) }` →
        `var(--accent)`. (`.hl-card-* { background: var(--gray-light) }`
        overridden directly in step 6 — no change here.)
      Files: `themes/sarfrance/assets/css/agenda.css`,
      `themes/sarfrance/assets/css/bibliotheque.css`,
      `themes/sarfrance/assets/css/notices.css`,
      `themes/sarfrance/assets/css/lieux-de-memoire.css`
      Verify: `make build-check` succeeds; the four pages look identical
      (dark OFF).

- [ ] 5. **Promote the form-feedback colors in `contact.css` to variables.**
      Replace the six hardcoded hex values in `.form-feedback.feedback-error`
      and `.form-feedback.feedback-success` with `var(--feedback-error-text)`,
      `var(--feedback-error-bg)`, `var(--feedback-error-border)`,
      `var(--feedback-success-text)`, `var(--feedback-success-bg)`,
      `var(--feedback-success-border)` (defined in step 1). Leave `phototheque.css`
      (lightbox) and `carousel.css` untouched — intentionally dark / over-image.
      Files: `themes/sarfrance/assets/css/contact.css`
      Verify: `make build-check` succeeds; contact page feedback messages (can be
      toggled by inspecting with `.feedback-error`/`.feedback-success` classes)
      look identical (dark OFF).

- [ ] 6. **Add the consolidated dark-mode block at the bottom of `colors.css`.**
      One clearly commented `@media (prefers-color-scheme: dark) { … }` block
      containing:
      1. A `:root { … }` override of every token in the "Dark value" columns
         above — the 7 semantic tokens, the non-overloaded palette tokens
         (texts, tint, grays, placeholder, shadows, focus-ring), the four
         lightened `--color-*`, the six `--feedback-*`, plus
         `color-scheme: dark;` (and add `color-scheme: light;` to the main
         `:root` in step 1 if not already present, so native controls/scrollbars
         follow the mode).
      2. Component overrides that cannot be expressed as a plain token swap,
         kept here (not scattered) and commented:
         - `.tag { opacity: 1; }` — restore pill vibrancy on dark (default is
           `0.85`, which muddies colors over a dark page).
         - `.submenu li a { border-bottom-color: var(--gray-border-light); }` —
           the light-mode divider is `var(--cream)`, a bright line on a dark
           submenu; this does not touch the light theme.
         - `.leaflet-container { background: var(--bg-surface); }` — avoid a
           light-grey flash while tiles load. **No `filter: invert()`** anywhere;
           map tiles and photos keep their real colors.
      Files: `themes/sarfrance/assets/css/colors.css`
      Verify: `make build-check` succeeds. Then `make serve` and, in the browser
      DevTools, emulate `prefers-color-scheme: dark` (or switch the OS theme) and
      walk the key pages — home (hero/carousel/cards), a content page, header +
      mobile nav + submenus, footer, agenda, chronologie, notices, bibliothèque,
      lieux-de-memoire, and contact (incl. feedback messages + Leaflet map).
      Confirm: dark slate backgrounds, off-white text, legible links/accents,
      category pills + active filters readable, images/maps NOT inverted, and —
      with dark emulation OFF — the light theme is unchanged. Spot-check a couple
      of text/background pairs with the DevTools contrast tool against the ratios
      in the table above.

## Notes / assumptions

- No automated CSS/contrast test exists in the repo; the contrast targets are
  verified by construction (table above) and spot-checked manually in DevTools.
  If the team later wants automation, a `prefers-color-scheme` visual-regression
  check could be added to `preview.yml`, but that is out of scope here.
- `color-scheme` is set so the browser themes native widgets (the `<select>` in
  the contact form, scrollbars, text-field internals) to match — no JS needed.
- A `<meta name="theme-color">` with a dark `media` variant could be added to
  `head-meta.html` for mobile browser chrome, but it is optional and outside the
  CSS-only scope of this task; not planned.

---

# Verification evidence (recorded after implementation)

## What was run

- **Production build** (Hugo extended v0.166.0, pinned in `Makefile`):
  `hugo --minify --destination /tmp/sarfrance-build-check --cacheDir /tmp/sarfrance-build-check/cache`
  → **success**, 0 errors (FR 84 pages / EN 82 pages, `Total in ~0.2s`).
- **Single dark strategy check** on the compiled output:
  `grep -rho "prefers-color-scheme:[^)]*)" /tmp/sarfrance-build-check/css/ | sort | uniq -c`
  → exactly **`1 prefers-color-scheme:dark)`**, present in a single file
  (`css/colors.min.<hash>.css`). No `prefers-color-scheme: light` strategy, no
  typos. (A clean destination is required for this count — a stale fingerprinted
  file from a previous build would otherwise be counted too.)
- Temporary build dir `/tmp/sarfrance-build-check` removed after verification.

## Computed WCAG contrast ratios (dark mode)

Ratios computed with the WCAG 2.x relative-luminance formula. Normal body text
needs ≥ 4.5:1; large/UI text needs ≥ 3:1. Pill labels are small bold text, so
they are held to the 4.5:1 bar.

| Foreground | Background | Ratio | Bar | Pass |
|------------|-----------|-------|-----|------|
| `--text-dark` #e6e8ec | `--bg-body` #15181f | 14.48:1 | 4.5 | ✅ |
| `--text-dark` #e6e8ec | `--bg-surface` #1e222b | 12.98:1 | 4.5 | ✅ |
| `--text-heading` #eef1f6 | `--bg-body` | 15.69:1 | 4.5 | ✅ |
| `--text-light` #b4bac4 | `--bg-body` | 9.10:1 | 4.5 | ✅ |
| `--text-muted` #9aa3b2 | `--bg-body` | 6.98:1 | 4.5 | ✅ |
| `--text-muted` #9aa3b2 | `--bg-surface` | 6.26:1 | 4.5 | ✅ |
| `--link` #a9c2e8 | `--bg-body` | 9.78:1 | 4.5 | ✅ |
| `--link` #a9c2e8 | `--bg-surface` | 8.77:1 | 4.5 | ✅ |
| `--accent` #ef8a73 | `--bg-body` | 7.23:1 | 4.5 | ✅ |
| `--accent` #ef8a73 | `--bg-surface` | 6.49:1 | 4.5 | ✅ |
| white #fff on `--primary` #ad2c11 (button, unchanged) | — | 6.68:1 | 4.5 | ✅ |
| white on `--color-navy` #2d5aa0 (pill) | — | 6.81:1 | 4.5 | ✅ |
| white on `--color-dark-blue` #2a66ad (pill) | — | 5.83:1 | 4.5 | ✅ |
| white on `--color-brown` #9e6016 (pill) | — | 5.07:1 | 4.5 | ✅ |
| white on `--color-slate` #5a7488 (pill) | — | 4.90:1 | 4.5 | ✅ |
| `--feedback-error-text` #f3a79b | #3a1f1d | 7.76:1 | 4.5 | ✅ |
| `--feedback-success-text` #86d49b | #16301f | 8.06:1 | 4.5 | ✅ |

All normal-text pairs clear 4.5:1; all UI/pill pairs clear 4.5:1.

> Note vs. the planned palette: the four lightened category pills were tuned
> during verification. The plan's first draft (`--color-dark-blue #2f71bd`,
> `--color-brown #b1701a`, `--color-slate #5f7a8e`) dropped white-on-pill
> contrast below 4.5:1 for brown (4.04:1) and left thin margins elsewhere, since
> pill labels are small bold text. Final values `#2a66ad` / `#9e6016` / `#5a7488`
> (navy `#2d5aa0` unchanged) keep white text ≥ 4.9:1 while still sitting slightly
> off the dark page.

> `.tl-group-title` background was repointed `--white` → `--bg-body` (not just
> its text color). It masks the vertical timeline axis behind the label, so it
> must follow the page background; `--bg-body` resolves to `#ffffff` in light
> mode, so the light theme is unchanged.
