# Theme switcher restructured into a nav dropdown mirroring the language menu

The light/dark/system theme control, previously a 3-button inline group, is now a dropdown menu built as a structural twin of the language switcher. In `header.html` it is a `<li class="has-submenu theme-switch">` with an `<a class="theme-switch__trigger">` showing the current choice's icon and a `<ul class="submenu">` listing the three options, placed as the immediate sibling right before `<li class="has-submenu lang-switch">`. All submenu positioning, hover-open and mobile behaviour are inherited from the generic `.has-submenu` rules in `style.css`; `colors.css` only adds icon presentation plus a `:focus-within`/`.is-open` reveal rule. The rewritten `theme-switcher.js` keeps the existing data-theme / localStorage strategy intact and wires the menu (sync icon + active option, click-to-choose, click-toggle open, Escape, outside-click). The dark CSS was split into a forced `:root[data-theme="dark"]` block plus a gated `@media` block as part of the prior dark-mode step, carried unchanged here.

Watch for: nothing blocking. Two minor, non-blocking a11y nuances that also match the language switcher's own (absent) behaviour — `aria-expanded` is not updated on mobile (confirmed), and Space does not open the trigger since it is an `<a>` (confirmed). The dark-token duplication is a maintenance footgun by design, but the two copies are currently byte-identical (confirmed).

**Verdict**: APPROVED

## High-level view

The new control is a genuine sibling of the language switcher: same `has-submenu` wrapper, same trigger-plus-`submenu` shape, same `li.active` + `aria-current` convention for the selected option, dropped in right next to it. It reuses the generic submenu machinery rather than reinventing layout, which is why the CSS footprint is small and limited to icon sizing and the keyboard/JS reveal rule.

All three states remain selectable, the sun/moon/monitor inline SVGs are preserved, and the trigger shows the current choice via a single `.is-shown` icon toggled by JS — the parallel to the language switcher showing its current flag on its trigger.

The theme JS preserves every behaviour of the working switcher: `sar-theme` in localStorage, set/remove `data-theme` on `<html>`, multi-instance sync, `matchMedia` listening while in system mode, `SAR.onReady` with no leaked globals, loaded after `core.js`. It layers on the menu wiring (open/close, truthful `aria-expanded`, Escape, outside-click) that the language menu does not itself implement, so the theme control is slightly more accessible than its sibling rather than less.

The dark-mode CSS strategy is the required shape: forced light lives in the base `:root`, forced dark in `:root[data-theme="dark"]`, and exactly one `@media (prefers-color-scheme: dark)` gated with `:not([data-theme="light"]):not([data-theme="dark"])` so an explicit choice always wins over the OS. The dark values are duplicated across the forced and gated blocks (vanilla CSS can't share a block across a `@media` boundary); the duplication is loudly commented and the two copies are byte-identical today.

No dark/light token values changed, the FOUC init file and the language switcher's own behaviour are untouched, and the new `theme_*` i18n keys were added to both `fr.yaml` and `en.yaml`. No commit was made — all changes are working-tree only.

<details>
<summary>Issues (2)</summary>

1. **aria-expanded stale on mobile** — on viewports ≤768px the trigger handler returns early and leaves `main.js` to toggle `.active`, so `aria-expanded` stays `"false"` even when the submenu is open. Non-blocking (the language switcher exposes no `aria-expanded` at all), but could be synced for correctness.
2. **Space does not open the trigger** — the trigger is an `<a href="#">`, so Enter activates it but Space does not. Consistent with the language switcher (which opens on `:focus-within`, not key handlers), so acceptable; flagged only for awareness.

</details>

<details>
<summary>Details</summary>

## Structural parity with the language switcher

The markup is a faithful mirror. The language control is `<li class="has-submenu lang-switch"><a>…flag…</a><ul class="submenu">…</ul></li>`; the theme control is `<li class="has-submenu theme-switch"><a class="theme-switch__trigger">…icon…</a><ul class="submenu">…</ul></li>`, inserted directly before it so the two render as adjacent siblings. Both use `<a href="#">` triggers, both list options as `<li><a>` with the selected one carrying `li.active`, and the theme options add `aria-current="true"` on the active entry (the language switcher conveys current state via the trigger flag + active `li`). Because the wrapper carries the generic `.has-submenu` class, desktop hover-open, submenu borders/positioning and the mobile `.active` expansion all come from `style.css` for free — the same code path the language menu rides. The CSS added to `colors.css` is confined to icon sizing (`.theme-switch__ico`, `.submenu .theme-opt-ico`), the `.is-shown` single-icon toggle, and a `:focus-within, .is-open` reveal that mirrors the inherited hover rule for keyboard and JS-driven opening.

## States, icons and current-choice indication

All three options — light, dark, system — are present as `.theme-opt[data-theme-value]` entries, each with its sun / moon / monitor inline SVG preserved from the previous design. The trigger embeds all three icons inside an `aria-hidden` span; `syncUI()` toggles `.is-shown` so exactly one (matching the active choice) is visible, which is the structural equivalent of the language trigger showing the current flag. The default server-rendered state marks `system` active (`li.active` + `aria-current` + monitor icon shown), and `theme-switcher.js` re-syncs from `localStorage` on load.

## Accessibility posture

The trigger is a real `<a>` with a translated `aria-label="{{ i18n "theme_toggle" }}"`, `aria-haspopup="true"` and `aria-expanded`, and the options are real `<a>` elements. Active indication is conveyed both visually (`li.active`) and to assistive tech (`aria-current="true"`), and `syncUI()` keeps `aria-current` in sync as the choice changes. On desktop the module keeps `aria-expanded` truthful across click-toggle, hover and Escape, and Escape returns focus to the trigger. Two nuances, both non-blocking and both matching the language switcher's own behaviour: `aria-expanded` is not updated on mobile (the handler returns early so `main.js` can own `.active`), and Space does not open the trigger because it is an anchor rather than a `<button>`. The language menu exposes no `aria-expanded` and no key handlers at all, so the theme control is a strict superset of its accessibility — the restructure improves rather than regresses here.

## Theme behaviour preserved in the JS

The rewrite keeps the persistence and application contract identical: `STORAGE_KEY = 'sar-theme'`, `applyTheme()` sets `data-theme` to `light`/`dark` on `document.documentElement` and removes it for `system` so the gated `@media` governs. `syncUI()` updates every `.theme-switch` instance (icon + active option), so multiple instances stay in sync. The `matchMedia('(prefers-color-scheme: dark)')` listener is retained and only acts while the stored choice is `system`, clearing the attribute so the OS media query stays in charge. The module runs inside `SAR.onReady(function () { 'use strict'; … })` with no globals leaked, uses `SAR.selectAll`, and is loaded in `site-scripts.html` after `main.js` (hence after `core.js`), satisfying the SAR-helper ordering rule. Guarding against `localStorage` exceptions and bailing early when no `.theme-switch` exists are both carried over cleanly.

## Dark CSS strategy and the KEEP-IN-SYNC duplication

The required three-way shape is in place: the base `:root` holds the light tokens and `color-scheme: light` (forced light needs no block of its own), `:root[data-theme="dark"]` forces dark regardless of OS, and a single `@media (prefers-color-scheme: dark)` gated to `:root:not([data-theme="light"]):not([data-theme="dark"])` applies auto-dark only when no explicit choice is set. The three component overrides (`.tag` opacity, `.submenu li a` divider, `.leaflet-container` background) are duplicated with matching gates. Because vanilla CSS cannot share a declaration block across a `@media` boundary, the dark token values are duplicated between the forced-dark root and the gated media block — a maintenance hazard the author flags prominently with a "⚠️ TWO COPIES, KEEP IN SYNC ⚠️" comment. I read both blocks in full: the token bodies and the three overrides are byte-identical today (confirmed). No dark or light token value was changed by this restructure.

## Scope

No inline `<script>` was introduced in any layout — the switcher loads via `<script src=…>` with SRI in `site-scripts.html`. No inline `style=` toggling: the JS flips classes (`.is-shown`, `.is-open`, `.active`) and the `data-theme` attribute only, with all presentation in `colors.css` per the colors-centralized rule. The `theme_toggle` / `theme_light` / `theme_dark` / `theme_system` i18n keys were added to both `i18n/fr.yaml` and `i18n/en.yaml` (the verification note's claim that they were "already present" is inaccurate — the diff shows them added — but the requirement that any new key land in both files is satisfied). The FOUC init partial/file, the language switcher's behaviour, site content, and menu config are untouched. `git status` shows all changes as working-tree only; no commit, add or amend was made.

The diff also contains artifacts from the earlier dark-mode step that are not part of this restructure (`baseof.html` head-theme-init wiring, `theme-init.js`, `head-theme-init.html`, `deploy-s3.yml`, the `.agents/tasks/theme-switcher-*` files). They are out of scope for this review and were left as-is.

</details>

<details>
<summary>File map</summary>

- `themes/sarfrance/layouts/partials/header.html` — replaced the 3-button theme group with a `has-submenu theme-switch` dropdown mirroring `lang-switch`, placed as its sibling.
- `themes/sarfrance/assets/css/colors.css` — swapped the old button-group styles for menu icon styles + `:focus-within`/`.is-open` reveal; dark CSS split into forced-dark root + gated media block (token values unchanged, two copies byte-identical).
- `themes/sarfrance/assets/js/pages/theme-switcher.js` — rewritten to drive the dropdown (sync, choose, open/close, Escape, outside-click) while preserving the `sar-theme` / `data-theme` / matchMedia behaviour.
- `themes/sarfrance/layouts/partials/site-scripts.html` — loads `theme-switcher.js` with SRI after `main.js`.
- `i18n/fr.yaml`, `i18n/en.yaml` — added `theme_toggle` / `theme_light` / `theme_dark` / `theme_system` keys to both files.
- `themes/sarfrance/layouts/_default/baseof.html`, `head-theme-init.html`, `theme-init.js`, `deploy-s3.yml`, `.agents/tasks/*` — carried over from the earlier dark-mode step; out of scope here.

Full diff: `git -C /Users/gautric/Source/web-apps/sarfrance diff` plus the untracked files listed by `git status`.

</details>
