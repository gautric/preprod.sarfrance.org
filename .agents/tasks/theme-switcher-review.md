# Nav theme switcher (light / dark / system) over system-preference dark mode

Adds a manual three-state theme control to the nav, beside the language flag switcher, layered on top of the already-shipped OS-preference dark mode without rebuilding it and without touching the light theme. The dark palette in `colors.css` is split into two coordinated entry points — a forced `:root[data-theme="dark"]` block and the existing `@media (prefers-color-scheme: dark)` block now gated to `:root:not([data-theme="light"]):not([data-theme="dark"])` — so a forced choice wins over the OS while system mode falls through to the media query. A render-blocking external init script in `<head>` applies the persisted choice before first paint; a `SAR.onReady` module wires the buttons, persists to `localStorage`, and syncs button state.

Watch for: the two dark declaration blocks are duplicated by necessity (CSS can't share a block across a `@media` boundary) and must stay in sync — they are byte-identical today (confirmed) and both carry a prominent sync warning. One unrelated untracked file (`.github/workflows/deploy-s3.yml`) sits in the tree and must not be swept into the feature commit (confirmed, non-blocking).

**Verdict**: APPROVED

## High-level view

The CSS strategy is sound and non-destructive. The base `:root` light tokens and `color-scheme: light` are untouched (the diff's first hunk starts at the dark-mode comment, nothing above it changed). Dark styling now has exactly one `prefers-color-scheme` block, gated so it only fires when no theme is forced, plus an explicit forced-dark root. Forced light correctly needs no block of its own — the base root supplies it and the `:not([data-theme="light"])` gate stops the media block from overriding when the OS is dark. `color-scheme` is correct in every case: light (base), dark (forced root), dark (gated media). The two dark blocks are duplicated but verified byte-identical and loudly commented as must-stay-in-sync.

No-FOUC is handled correctly. `theme-init.js` is an external, dependency-free IIFE wired render-blocking (plain `<script src>`, no async/defer) via `head-theme-init.html`, included in `<head>` before `head-css.html`. The build output confirms the init script precedes the `colors.css` link. It reads `localStorage`, sets `data-theme` for light/dark, removes it for system/absent/garbage, and wraps storage access in try/catch. No inline `<script>` exists anywhere in the theme (confirmed by grep), honoring the strict project rule.

The nav control is accessible and correctly scoped. Three real `<button type="button">` elements carry translated `aria-label`s and `aria-pressed`, wrapped in a `role="group"` labelled region, placed immediately before the `.lang-switch` item. Icons are inline SVG (sun / moon / monitor), `aria-hidden` + `focusable="false"`, no emoji. A single `.nav-menu` serves both desktop and mobile, so the control is authored once; the JS still syncs all instances defensively.

The behaviour module follows the project's JS conventions: `SAR.onReady` with `'use strict'`, `SAR.selectAll`, no leaked globals, persistence with try/catch, attribute removed for system, and it is loaded after `core.js` (order confirmed in build output: core → main → theme-switcher). i18n keys exist in both `fr.yaml` and `en.yaml` and render correctly (FR "Thème/Clair/Sombre/Système", EN "Theme/Light/Dark/System", both confirmed in build output).

The three required flows hold: a fresh OS=dark visitor has no `data-theme`, so the gated media block applies (dark); picking Light writes `sar-theme=light` and sets `data-theme="light"`, which the gate honours over OS dark and the init script re-applies on reload; picking System removes the attribute and reverts to the OS.

<details>
<summary>Issues (2)</summary>

1. **Duplicated dark block maintenance** — the forced-dark root and the gated media block hold the same 34 declarations by necessity; they are byte-identical now (confirmed) and both carry a sync warning, but any future dark-value edit must touch both. Non-blocking; inherent to vanilla CSS and sanctioned by the plan.
2. **Stray untracked workflow file** — `.github/workflows/deploy-s3.yml` is present but unrelated to this feature (confirmed: not referenced in the diff). Stage only the nine feature files when committing so it isn't swept in. Non-blocking.

</details>

<details>
<summary>Details</summary>

### CSS: one gated media block, explicit forced roots, light untouched

`colors.css` now carries exactly one `@media (prefers-color-scheme: dark)` rule, and its root selector is gated to `:root:not([data-theme="light"]):not([data-theme="dark"])` (verified). The forced-dark entry point `:root[data-theme="dark"]` is explicit, with `color-scheme: dark`. Forced light relies on the base `:root` (`color-scheme: light`) plus the gate, which is the correct minimal approach — a redundant `:root[data-theme="light"]` block would only restate base values. The three component overrides (`.tag` opacity, `.submenu li a` border, `.leaflet-container` background) are mirrored under both entry points with the matching gate, so a forced choice overrides the OS for those too.

A programmatic comparison of the two dark declaration lists (token + `color-scheme` lines) returned 34 declarations each and IDENTICAL. Both blocks open with a prominent "⚠️ TWO COPIES, KEEP IN SYNC ⚠️" comment and cross-reference each other. The duplication is the plan-sanctioned tradeoff; the risk is purely future drift, mitigated by the comments.

The base light `:root` is unchanged — the diff's first colors.css hunk begins at the dark-mode header comment, and no hunk touches any light token value. The switcher's own styling (`.theme-switch`, `.theme-switch__btn`, `.is-active`) is token-based (`--text-heading`, `--accent`, `--primary-tint-15`), adding no raw colors, so it flips with the palette.

### No-FOUC init runs before paint, no inline script

```
<head>
  head-meta → head-favicons → head-theme-init (render-blocking)  → head-css (colors.css …)
                               reads localStorage, sets data-theme on <html>
```

`head-theme-init.html` uses the `asset.html` pipeline (fingerprint + SRI integrity) and emits a plain `<script src>` — intentionally not deferred so it executes before the stylesheets. Build output confirms `theme-init.min.<hash>.js` appears in `<head>` ahead of `colors.min.<hash>.css`. `theme-init.js` references neither `SAR` nor the body, guards `localStorage` in try/catch, and treats system/absent/unknown uniformly by removing the attribute. A grep of `themes/sarfrance/layouts/` found zero inline `<script>` blocks.

### Accessible three-state control adjacent to the flag

The new `<li class="theme-switch-item">` is inserted immediately before `<li class="has-submenu lang-switch">`, keeping the flag last. The wrapper is `role="group"` with `aria-label="{{ i18n "theme_toggle" }}"`; each button is a real `<button type="button">` with a translated `aria-label`, `data-theme-value`, and `aria-pressed` (static default: system `true`, others `false`; JS corrects on load). Icons are inline SVG with `aria-hidden="true"` and `focusable="false"`. No emoji. Because one `.nav-menu` drives both desktop and mobile layouts, the control exists once in markup; `theme-switcher.js` syncs across all `.theme-switch__btn` via `SAR.selectAll`, so a future second instance would stay consistent.

### Behaviour module honors JS conventions and load order

`pages/theme-switcher.js` runs inside `SAR.onReady(function () { 'use strict'; … })`, leaking no globals. It reads the persisted choice (defaulting to `system`), reflects it on all buttons, and on click writes `localStorage`, sets or removes `data-theme`, and re-syncs. A `matchMedia('(prefers-color-scheme: dark)')` change listener re-asserts the cleared attribute while in system mode — a visual no-op that keeps state coherent. It is wired in `site-scripts.html` after `main.js`; build output confirms the body load order core → main → theme-switcher, so `SAR` is defined first.

### Scope

Tracked edits: `colors.css`, `header.html`, `baseof.html`, `site-scripts.html`, `i18n/fr.yaml`, `i18n/en.yaml`. New files: `theme-init.js`, `pages/theme-switcher.js`, `head-theme-init.html`. This matches the plan's nine-file scope; `baseof.html` and `head-theme-init.html` are the script-wiring templates the plan explicitly authorized. No content, menu, or config changes. The only out-of-scope artifact is the untracked `.github/workflows/deploy-s3.yml`, which is unrelated to the feature and should be excluded from the commit.

### Verification evidence

Per instructions, the build suite was not re-run. The coder's `make build-check` artifact in `/tmp/sarfrance-build-check` is present and timestamped after the source edits (build 18:32:48 vs `header.html` 18:32:03), and renders the feature end to end: FR and EN `index.html` each contain the `.theme-switch` group with three `data-theme-value` buttons, correct per-language `aria-label`s, no static `data-theme` on `<html>` (correct system default), the init script before `colors.css`, and the body script order above. The i18n grep returns 4 keys in each file. These reads are artifact inspection, not a rebuild. (A raw `index.html` file count is not comparable to Hugo's reported 84/82 page metric, so it is not treated as a discrepancy; the artifact is complete and current.)

</details>

<details>
<summary>File map</summary>

- `themes/sarfrance/assets/css/colors.css` — split dark mode into forced-dark root + gated media block; added token-based switcher styling. Light tokens untouched.
- `themes/sarfrance/assets/js/theme-init.js` (new) — standalone no-FOUC init, sets/removes `data-theme` from `localStorage` before paint.
- `themes/sarfrance/assets/js/pages/theme-switcher.js` (new) — `SAR.onReady` module: button sync, persistence, apply/remove attribute, matchMedia listener.
- `themes/sarfrance/layouts/partials/head-theme-init.html` (new) — render-blocking `<script src>` for the init, via asset pipeline.
- `themes/sarfrance/layouts/_default/baseof.html` — include head-theme-init before head-css.
- `themes/sarfrance/layouts/partials/header.html` — three-button `role="group"` switcher before the lang-switch, inline SVG icons.
- `themes/sarfrance/layouts/partials/site-scripts.html` — load theme-switcher.js after core/main.
- `i18n/fr.yaml`, `i18n/en.yaml` — theme_toggle / theme_light / theme_dark / theme_system.

Full diff: `git diff` + the three untracked files under `themes/sarfrance/assets/js/` and `layouts/partials/head-theme-init.html`.

</details>
