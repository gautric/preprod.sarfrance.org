# System-preference dark mode via a single `@media` block in `colors.css`

The change adds an automatic dark theme to the SAR France Hugo theme, driven only by `@media (prefers-color-scheme: dark)` — no toggle, no JavaScript. The approach is a hybrid of two moves: first a *semantic-token promotion* in `colors.css` (`--bg-body`, `--bg-surface`, `--input-bg`, `--text-heading`, `--link`, `--link-hover`, `--accent`) that in light mode resolve to the exact palette values used today, with the overloaded `--white` / `--navy-blue` / `--primary` usages repointed to those tokens across `style.css`, `filters.css` and the page CSS; then a single commented dark `@media` block at the bottom of `colors.css` that redefines the tokens (plus a few component overrides that can't be a plain token swap). Only CSS files changed. The commit records a clean Hugo build and WCAG contrast ratios, and the plan's evidence section confirms exactly one `prefers-color-scheme:dark` strategy in the compiled output.

Watch for: two hover-state rules (`.read-more:hover`, `.notice-bio-link:hover`) were repointed from `--primary-dark` to `--accent`, which resolves to `--primary` in light mode — a subtle, deliberate, documented light-mode hover-shade change, not a value-preserving promotion (confirmed). Everything else preserves light values exactly.

**Verdict**: APPROVED

## High-level view

The dark strategy is consolidated exactly as the plan intended: one commented `@media (prefers-color-scheme: dark)` block at the end of `colors.css`, with `color-scheme: light` on the base `:root` and `color-scheme: dark` inside the media query so native widgets follow the mode. No typos, no competing `prefers-color-scheme` rules, no second block anywhere.

The light theme is preserved through indirection: the seven new semantic tokens are defined as `var(--white)` / `var(--navy-blue)` / `var(--primary)` in the base `:root`, so every repointed rule renders identically in light mode. The one exception is two hover rules that previously used `--primary-dark` and now use `--accent` (= `--primary`); the hover red is slightly lighter in light mode than before. This was called out in the plan and is cosmetically negligible, so it does not block.

The dark palette is sane: near-black slate backgrounds (`#15181f` / `#1e222b` / `#1a1e26`, never pure black), off-white text (`#e6e8ec`, never pure white). The recorded contrast ratios clear WCAG AA (body 14.5:1, headings 15.7:1, links 9.8:1, accent 7.2:1). Category pills consume `var(--color-*)` for both the pill fill and the active-filter overrides, so lightening the four darkest `--color-*` tokens in the dark block flows automatically to both; white-on-pill contrast was tuned during verification to stay ≥ 4.9:1.

Images and Leaflet tiles are never inverted — the only map rule is a load-state background on `.leaflet-container`. Scope is clean: only the eight CSS files named in the plan plus the plan doc itself changed; no templates, JS, menus, config, or new CSS file, so `head-css.html` correctly needed no wiring.

<details>
<summary>Issues (1)</summary>

1. **Hover-shade shift in light mode** — `.read-more:hover` and `.notice-bio-link:hover` moved from `--primary-dark` (#8b2310) to `--accent` (= `--primary` #ad2c11 in light mode), a small lightening of the hover red. Deliberate and documented in the plan; non-blocking. Optionally add a `--accent-strong: var(--primary-dark)` token for these two hovers if exact light-mode parity is wanted.

</details>

<details>
<summary>Details</summary>

## Single dark strategy, correctly gated

The dark rules live in one `@media (prefers-color-scheme: dark)` block at the bottom of `colors.css`, introduced by a header comment that states it is the single source of dark-mode styling. The media query is spelled correctly, and the plan's recorded grep over the compiled CSS (`grep -rho "prefers-color-scheme:[^)]*)" … | sort | uniq -c` → `1 prefers-color-scheme:dark)`) confirms there is no second block and no `prefers-color-scheme: light` competitor. `color-scheme: light` is set on the base `:root` and flipped to `dark` inside the media query, so native form controls and scrollbars follow the OS setting without JS.

## Light theme preserved through semantic-token indirection

The seven new tokens are defined in the base `:root` as aliases of the existing palette:

```
--bg-body: var(--white);  --bg-surface: var(--white);  --input-bg: var(--white);
--text-heading: var(--navy-blue);  --link: var(--navy-blue);
--link-hover: var(--primary);  --accent: var(--primary);
```

Every repointed rule — `body`/`.intro`/`.features`/`.events` backgrounds → `--bg-body`; nav/card/submenu/dropdown surfaces → `--bg-surface`; form fields → `--input-bg`; headings/nav/labels → `--text-heading`; `a` → `--link` / `a:hover` → `--link-hover`; red accent text → `--accent` — therefore computes to the same color in light mode. The `.tl-dot--lg` and `.tl-group-title` repointings (background `--navy-blue`→`--text-heading`, border `--white`→`--bg-body`, group-title background `--white`→`--bg-body`) likewise preserve their light values, which keeps the timeline dot and label legible on the dark axis without altering the light rendering.

The single genuine light-mode change: `.read-more:hover` and `.notice-bio-link:hover` were `--primary-dark` (#8b2310) and are now `--accent`, which is `--primary` (#ad2c11) in light mode. The hover red is marginally lighter than before on exactly these two link types. The plan explicitly specifies this repointing, and the shift is a hover-only, near-imperceptible shade change, so it is a note rather than a blocker. If exact parity matters, a `--accent-strong: var(--primary-dark)` token used by just these two hovers would restore it.

## Dark palette and contrast

Backgrounds are soft slate — `--bg-body #15181f`, `--bg-surface #1e222b`, `--input-bg #1a1e26` — none pure black; body text `--text-dark #e6e8ec` is off-white, not pure white. The recorded WCAG ratios all clear the 4.5:1 bar for body/pill text and 3:1 for UI: body copy 14.48:1, headings 15.69:1, muted text 6.26–6.98:1, links 8.77–9.78:1, accent 6.49–7.23:1. Shadows deepen (`rgba(0,0,0,.5–.6)`) and the focus ring switches to a tinted translucent accent, both appropriate on a dark page.

## Category pills and active filters on dark surfaces

The `type-/tag-/cat-` pills carry white text on a `var(--color-*)` fill, and the `.filter-btn.active.*` overrides reuse the same `var(--color-*)` tokens for both background and border (confirmed in `colors.css` lines 125–234). Lightening only the four darkest tokens in the dark block — `--color-navy #2d5aa0`, `--color-dark-blue #2a66ad`, `--color-brown #9e6016`, `--color-slate #5a7488` — therefore lifts both the resting pills and the active-filter buttons off the dark page in one move. White-on-pill contrast was tuned during verification (brown settled at #9e6016 → 5.07:1 after an earlier #b1701a draft fell to 4.04:1), and the final four all land ≥ 4.9:1. The `.tag { opacity: 1 }` override inside the media query restores full pill saturation (the light default 0.85 muddies the colors over dark).

## Images and maps not inverted

There is no `filter: invert()` anywhere. The only map-related dark rule is `.leaflet-container { background: var(--bg-surface) }`, which only changes the grey flash shown while tiles load; raster tiles and photos keep their real colors. The lightbox (`phototheque.css`) and carousel (`carousel.css`) were correctly left untouched since they are intentionally dark / sit over images.

## Scope

The commit touches the eight CSS files named in the plan (`colors.css`, `style.css`, `filters.css`, `agenda.css`, `bibliotheque.css`, `notices.css`, `lieux-de-memoire.css`, `contact.css`) plus the plan document. No templates, JS, menus, or config changed, and no new CSS file was added — so `head-css.html` correctly required no wiring, and no inline `style=` was introduced. `contact.css`'s six hardcoded feedback hex values were promoted to `--feedback-*` variables whose base-`:root` values equal the previous literals, preserving the light feedback appearance.

## Build and contrast evidence

The commit message and the plan's "Verification evidence" section record a clean `hugo --minify` build (0 errors, FR 84 / EN 82 pages) and the full WCAG ratio table. Per the review instructions this evidence was read, not re-run; the pill-tuning note and the single-strategy grep count are internally consistent with the diff (the dark `--color-*` values in the block match the ratios quoted), so no spot-check was warranted.

</details>

<details>
<summary>File map</summary>

- `themes/sarfrance/assets/css/colors.css` — adds `color-scheme: light`, the 7 semantic tokens + 6 `--feedback-*` vars to `:root`, and the single dark `@media` block (token overrides + `.tag` / `.submenu li a` / `.leaflet-container` component rules).
- `themes/sarfrance/assets/css/style.css` — repoints overloaded `--white` / `--navy-blue` / `--primary` surface/text/accent usages to semantic tokens.
- `themes/sarfrance/assets/css/filters.css` — same repointing for shared components (filter buttons, search, cards, timeline dots/title).
- `themes/sarfrance/assets/css/agenda.css` — accent-text repointing on year-nav hover and card links.
- `themes/sarfrance/assets/css/bibliotheque.css` — surface/text/accent repointing on sort buttons and book cards.
- `themes/sarfrance/assets/css/notices.css` — title/link/accent repointing (incl. the `--primary-dark`→`--accent` bio-link hover).
- `themes/sarfrance/assets/css/lieux-de-memoire.css` — `.hl-card-link` accent repointing.
- `themes/sarfrance/assets/css/contact.css` — six feedback hex values promoted to `--feedback-*` variables.
- `.agents/tasks/darkmode-plan.md` — implementation plan + recorded build/contrast evidence.

Full diff: `git show 2ba4afc`.

</details>
