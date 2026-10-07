# Implementation Plan — Theme switcher (light / dark / system)

Extends the already-shipped **system-preference** dark mode (currently OS-only, in
`themes/sarfrance/assets/css/colors.css`) with a manual, persisted three-state
control placed in the nav next to the language flag switcher. Does **not** rebuild
dark mode; integrates with it.

## Scope note
Message 2 of the original request ("récupère `/images/sar-neo-transparent.png` pour
en faire `sar-logo-nav.png`") is **already satisfied**: `static/images/icons/sar-logo-nav.png`
exists and `header.html` references it. No logo work remains. This plan covers only
the theme switcher (messages 1 and 3).

## Verification command (authoritative)
All verification runs from `/Users/gautric/Source/web-apps/sarfrance`:
```
make build-check
```
It wraps `hugo --minify` into `/tmp/sarfrance-build-check` (safe alongside a running
`hugo server`). Baseline before any change: **exit 0, FR 84 pages / EN 82 pages**.
Every step below must keep that build green and the page counts unchanged.

## Key findings from exploration (ground truth)
- `colors.css`: base `:root` holds the light semantic tokens and `color-scheme: light`.
  A single `@media (prefers-color-scheme: dark) { :root { … } + .tag / .submenu li a /
  .leaflet-container overrides }` block at the bottom is the ONLY source of dark styling.
- `baseof.html`: `head-css.html` is included in `<head>`; `site-scripts.html` is included
  at the **end of `<body>`** (so it is too late to prevent FOUC — the init must go in `<head>`).
- `site-scripts.html`: loads `core.js` → `shared/filter-engine.js` → `pages/main.js`
  (+ carousel on home), each via `partial "asset.html" "js/…"` with `.RelPermalink` +
  `.Data.Integrity`. `core.js` must stay first.
- `asset.html`: `resources.Get` → `Fingerprint` (always) + `Minify` only in production.
  Returns a resource exposing `.RelPermalink` and `.Data.Integrity`.
- `header.html`: there is a SINGLE `.nav-menu` `<ul>`; the same markup serves desktop
  and the mobile menu (CSS-driven via `.menu-toggle` / `.nav-menu.active`). The language
  switcher is the last `<li class="has-submenu lang-switch">` in that `<ul>`. So the theme
  control is authored **once** (one instance), but the JS still updates all instances
  defensively via `SAR.selectAll`.
- `core.js` exposes `SAR.onReady`, `SAR.selectAll`, `SAR.activate`, etc. `core.js` loads
  at end of body, so the FOUC init script in `<head>` must be standalone (must NOT use `SAR`).
- i18n files are flat `- id: … / translation: …` lists; `change_language` / `main_nav`
  are the last entries. Add new keys to BOTH `i18n/fr.yaml` and `i18n/en.yaml` (FR primary).

## Design decisions
- **localStorage key**: `sar-theme`. Values: `light`, `dark`, `system`. Default when
  absent = system.
- **Attribute model**: for `light`/`dark`, set `data-theme` on `<html>`; for `system`,
  **remove** the attribute so the gated `@media` governs. The CSS gate
  `:root:not([data-theme="light"]):not([data-theme="dark"])` matches both the absent and
  `system` cases, so either is safe.
- **CSS lives in `colors.css`** (switcher tokens AND the small switcher layout rules),
  because the task's do-not-touch list restricts CSS edits to `colors.css` (`style.css`
  is excluded). Keep it in a clearly-commented dedicated section. Rationale recorded here
  so a reviewer does not expect switcher CSS in `style.css`.
- **No build-time DRY for the dark palette**: pure vanilla CSS cannot share a declaration
  block across a `@media` boundary, so the dark declarations are **duplicated once** into
  two clearly-commented, must-stay-in-sync entry points (forced-dark root + gated auto-dark
  root). This is the task-sanctioned approach.
- **Icons**: inline SVG in the template (sun / moon / monitor). No raster assets, no emoji.
- **FOUC init** is a dedicated render-blocking external script in `<head>`, added via a new
  `head-theme-init.html` partial (asset-pipeline, matching `asset.html`), included in
  `baseof.html` before `head-css.html`. Editing `baseof.html` is in scope: the task directs
  investigating where scripts wire into it, and a head include is required to beat first paint.

---

- [ ] 1. Restructure dark mode in `colors.css` to be `data-theme`-driven without changing light mode.
      In `themes/sarfrance/assets/css/colors.css`, replace the single bottom `@media (prefers-color-scheme: dark)` block with THREE coordinated pieces, keeping the base light `:root` and `color-scheme: light` untouched:
      (a) A commented "DARK PALETTE" section defining `:root[data-theme="dark"] { color-scheme: dark; …all dark tokens… }` plus the component overrides scoped under it: `:root[data-theme="dark"] .tag { opacity: 1 }`, `:root[data-theme="dark"] .submenu li a { border-bottom-color: var(--gray-border-light) }`, `:root[data-theme="dark"] .leaflet-container { background: var(--bg-surface) }`.
      (b) The existing `@media (prefers-color-scheme: dark)` block, but with its `:root` gated to `:root:not([data-theme="light"]):not([data-theme="dark"])` (both the token `:root` and each component override selector get the `:not(...)` gate), so it applies ONLY in system/auto mode.
      (c) A prominent comment at BOTH the forced-dark block and the gated-media block stating they are the two entry points to the same dark palette and MUST be kept in sync; the token values and overrides must be byte-identical between the two.
      Forced light needs no explicit block — the base `:root` already supplies light values and `color-scheme: light`, and the `:not([data-theme="light"])` gate keeps the media block from applying when OS is dark. Do NOT change any light token value; do NOT add `filter: invert` or touch maps/photos.
      Files: themes/sarfrance/assets/css/colors.css
      Verify: `make build-check` → exit 0, FR 84 / EN 82. Then confirm the gated selector exists: `grep -n ':root:not(\[data-theme="light"\]):not(\[data-theme="dark"\])' themes/sarfrance/assets/css/colors.css` returns the `@media` entry point, and `grep -n ':root\[data-theme="dark"\]' colors.css` returns the forced-dark entry point.

- [ ] 2. Add the switcher's visual styling to `colors.css`.
      In a new clearly-commented "THEME SWITCHER (nav control)" section of `themes/sarfrance/assets/css/colors.css`, style the segmented control to sit cleanly beside `.lang-switch` in the nav: a `.theme-switch` wrapper (inline-flex, small gap), `.theme-switch__btn` buttons (button reset — no default background/border, pointer cursor, padding, `color: var(--text-heading)`, inline SVG sized ~18px via `width/height` or `em`), and an active state `.theme-switch__btn.is-active` using existing tokens (e.g. `color: var(--accent)` and/or `background: var(--primary-tint-15)`, radius). Ensure it reads correctly in BOTH light and dark (tokens already flip). Keep rules minimal and token-based; add no new raw colors. Mobile: the shared `.nav-menu` becomes a vertical panel on `max-width:768px`, so verify the control still lays out (keep it `inline-flex`/`flex` and let it wrap).
      Files: themes/sarfrance/assets/css/colors.css
      Verify: `make build-check` → exit 0, FR 84 / EN 82.

- [ ] 3. Create the FOUC theme-init script (standalone, no `SAR`).
      Create `themes/sarfrance/assets/js/theme-init.js`: an IIFE with `'use strict'` that reads `localStorage.getItem('sar-theme')`; if the value is `'light'` or `'dark'` it sets `document.documentElement.setAttribute('data-theme', value)`; for `'system'`, absent, or any other value it removes the attribute (`removeAttribute('data-theme')`) so the `@media` governs. Must be tiny, self-contained, and reference neither `SAR` nor the DOM body (it runs in `<head>` before body parse). Wrap any `localStorage` access in try/catch so privacy modes don't break the page.
      Files: themes/sarfrance/assets/js/theme-init.js
      Verify: `make build-check` → exit 0 (asset compiles). (Behavioural check happens in step 8.)

- [ ] 4. Wire the init script render-blocking into `<head>` via a new partial.
      Create `themes/sarfrance/layouts/partials/head-theme-init.html` mirroring the `asset.html` usage pattern: `{{- $themeInit := partial "asset.html" "js/theme-init.js" }}<script src="{{ $themeInit.RelPermalink }}" integrity="{{ $themeInit.Data.Integrity }}"></script>` (plain `<script src>`, NOT `async`/`defer`, so it is render-blocking). Then in `themes/sarfrance/layouts/_default/baseof.html`, include it in `<head>` BEFORE `{{- partial "head-css.html" . }}` so `data-theme` is set before stylesheets apply. This is the only edit to `baseof.html`.
      Files: themes/sarfrance/layouts/partials/head-theme-init.html, themes/sarfrance/layouts/_default/baseof.html
      Verify: `make build-check` → exit 0, FR 84 / EN 82. Confirm the built head carries the script before the stylesheets: inspect `/tmp/sarfrance-build-check/index.html` and confirm the `theme-init` `<script>` appears in `<head>` and precedes the `colors.css` `<link>`.

- [ ] 5. Add the switcher markup to `header.html` next to the language switcher.
      In `themes/sarfrance/layouts/partials/header.html`, insert a new `<li class="theme-switch-item">` immediately BEFORE the `<li class="has-submenu lang-switch">` (or immediately after — pick adjacency that renders cleanly; before keeps flag last). Inside it render a `.theme-switch` group of three real `<button type="button">` elements (`.theme-switch__btn` with `data-theme-value="light"|"dark"|"system"`), each with a translated `aria-label` (`{{ i18n "theme_light" }}` etc.), an inline SVG icon (sun / moon / monitor, `aria-hidden="true"`, `focusable="false"`), and `aria-pressed` reflecting state (static default: `system` button `aria-pressed="true"`, others `false`; JS corrects on load). Add `aria-label="{{ i18n "theme_toggle" }}"` and `role="group"` on the `.theme-switch` wrapper. Do not alter the existing menu loop or lang-switch markup.
      Files: themes/sarfrance/layouts/partials/header.html
      Verify: `make build-check` → exit 0, FR 84 / EN 82. Confirm `/tmp/sarfrance-build-check/index.html` contains three `data-theme-value` buttons inside `.theme-switch`, and `/tmp/sarfrance-build-check/en/index.html` shows the English aria-labels.

- [ ] 6. Add i18n keys to BOTH language files.
      Append to `i18n/fr.yaml` and `i18n/en.yaml` (FR primary) four keys: `theme_toggle`, `theme_light`, `theme_dark`, `theme_system`. FR suggested: "Thème" / "Clair" / "Sombre" / "Système". EN: "Theme" / "Light" / "Dark" / "System". Keys must be present and identical in both files.
      Files: i18n/fr.yaml, i18n/en.yaml
      Verify: `make build-check` → exit 0 (missing-key would surface in rendered output). Confirm `grep -c 'theme_toggle\|theme_light\|theme_dark\|theme_system' i18n/fr.yaml i18n/en.yaml` returns 4 for each file.

- [ ] 7. Create the switcher behaviour module.
      Create `themes/sarfrance/assets/js/pages/theme-switcher.js` using `SAR.onReady(function () { 'use strict'; … })`, no leaked globals. On ready: read `localStorage.getItem('sar-theme')` (default `system`), then (a) apply active state to ALL `.theme-switch__btn` across every `.theme-switch` instance via `SAR.selectAll` — toggle `.is-active` and set `aria-pressed` to match the current value; (b) on each button click, read its `data-theme-value`, write it to `localStorage` (try/catch), set or remove `data-theme` on `document.documentElement` (remove for `system`, set for `light`/`dark`), and refresh active state on all instances. Nice-to-have: add a `window.matchMedia('(prefers-color-scheme: dark)')` `change` listener that is a no-op visually (CSS already reacts) but keeps logic consistent while in `system` mode. Reuse `SAR.selectAll`; do not re-implement helpers.
      Files: themes/sarfrance/assets/js/pages/theme-switcher.js
      Verify: `make build-check` → exit 0 (asset compiles and fingerprints).

- [ ] 8. Load the switcher module after `core.js`.
      In `themes/sarfrance/layouts/partials/site-scripts.html`, add `pages/theme-switcher.js` via the `asset.html` pattern AFTER `core.js` (placing it after `main.js` is fine; it only needs `SAR` present). Keep `core.js` first.
      Files: themes/sarfrance/layouts/partials/site-scripts.html
      Verify: `make build-check` → exit 0, FR 84 / EN 82. Confirm `/tmp/sarfrance-build-check/index.html` loads `theme-switcher` after `core` in body. Then functional smoke test with `make serve`: load a page, click Dark → `<html>` gets `data-theme="dark"` and the page darkens; reload → still dark (persisted); click System → attribute removed and page follows OS; click Light → `data-theme="light"` forces light even if OS is dark; `aria-pressed`/`.is-active` track the choice.

- [ ] 9. Final full verification and no-inline-script / regression checks.
      Run the authoritative build and confirm no project rule was broken.
      Files: (none — verification only)
      Verify:
      (1) `make build-check` → exit 0, FR 84 / EN 82 (counts unchanged from baseline).
      (2) No inline scripts introduced: `grep -rn '<script>' themes/sarfrance/layouts/` returns nothing (all scripts are `<script src=…>`).
      (3) Dark palette gate present and light untouched: `grep -n 'prefers-color-scheme' themes/sarfrance/assets/css/colors.css` shows the gated `:root:not([data-theme="light"]):not([data-theme="dark"])` selector; `git diff themes/sarfrance/assets/css/colors.css` shows NO change to any light token value in the base `:root`.
      (4) Only the intended files changed: `git status --short` lists only `colors.css`, `header.html`, `baseof.html`, `head-theme-init.html`, `site-scripts.html`, `theme-init.js`, `pages/theme-switcher.js`, `i18n/fr.yaml`, `i18n/en.yaml`.

## Commit (only after all steps verified)
A single clean commit, message in French, e.g.:
`feat(theme): sélecteur de thème clair/sombre/système dans la navigation`
Stage only the files listed in step 9(4). Do not push.
