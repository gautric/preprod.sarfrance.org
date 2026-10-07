# Nav submenu white-gap fix — shrink the theme-switch icon to the text line height

The reported bug was a 7px white strip between every top-level nav item and its dropdown submenu — present on the content menus and the language switcher, but absent on the theme switcher, whose submenu sat flush. The root cause the plan diagnosed is a flex-stretch asymmetry: `.nav-menu` is a flex row with the default `align-items: stretch`, so every `<li>` is sized to the tallest trigger. The theme switcher's 22px SVG icon made its `<a>` 70px tall and stretched all `<li>` to 70px, but the shorter text/flag anchors stayed 63px, leaving a 7px dead strip at the `<li>` bottom where the submenu (`position: absolute; top: 100%`) anchors. The fix shrinks the theme-switch icon from 22px to 18px (and swaps `line-height: 0` for `vertical-align: middle`) so the icon fits inside the text line-box, the text links become the tallest items at 63.05px, and every `<li>` — and therefore every flush submenu — matches.

Watch for: the fix is indirect (it removes the tall element rather than correcting the stretch), so it holds only as long as no nav trigger exceeds the text line height — confirmed by measurement but worth remembering (possible). The approach was a deliberate user-directed change away from the originally planned `height: 100%`, which would have made the navbar taller than production.

**Verdict**: APPROVED

## High-level view

The change is one presentation block in `colors.css`: the `.theme-switch__current` / `.theme-switch__ico` rules size the trigger icon to 18px and align it to the middle of the text line-box. `style.css` carries an empty diff, confirming the earlier `height: 100%` idea was fully reverted; the shared submenu positioning (red `border-top`, shadow, slide transition, hover + `:focus-within`/`.is-open` open paths) is unchanged and inherited by all three menus through the generic `.has-submenu` class.

The coder's recorded browser evidence covers all three submenus. A measurement table shows content, lang, and theme `<li>` all at 63.05px with a 0.00px submenu gap, in both light (`data-theme="light"`) and dark (`data-theme="dark"`) themes, versus 7.00px before for content/lang. A hover dead-zone test (8-step pointer traverse across the trigger→submenu boundary) kept each submenu visible; mobile (`position: static`) is unaffected because `height`/icon size has no layout effect in the column layout; and the red border, shadow, and hover highlight were visually confirmed on all three.

Dark-mode token values, the FOUC init (`theme-init.js` / `head-theme-init.html`), and the theme-switcher JS were not touched by this fix — the only edit is icon presentation. `make build-check` returned exit 0 (FR 84 / EN 82), and `git status` shows `HEAD` unchanged at `6c53863` with only working-tree edits, so nothing was committed and the pre-existing uncommitted dark-mode/theme-switcher work is intact.

<details>
<summary>Issues (1)</summary>

1. **Indirect fix is sensitive to trigger height** (possible) — the gap stays closed only while no nav trigger exceeds the ~23px text line-box. The 18px icon with `vertical-align: middle` was measured to keep the theme `<a>` at 63.05px, so this is not blocking, but any future taller control in the bar would reintroduce the stretch. No action required now.

</details>

<details>
<summary>Details</summary>

## Fix placement and the reverted alternative

The entire change lives in the theme-switch presentation block of `colors.css`:

```css
.theme-switch__current {
    display: inline-flex;
    align-items: center;
    vertical-align: middle;   /* was: line-height: 0 */
}

.theme-switch__ico {
    display: none;
    width: 18px;              /* was: 22px */
    height: 18px;             /* was: 22px */
    vertical-align: middle;   /* added — keep icon inside the text line-box */
}
```

`git diff themes/sarfrance/assets/css/style.css` is empty, so the originally planned `.nav-menu > li > a { height: 100% }` was fully reverted — correct, since that approach was rejected for making the navbar taller (70px) than the live production text-link height (63px). Shrinking the tallest trigger instead keeps the bar at production height while closing the gap. The icon drops to 18px to match the dropdown option icons (`.theme-opt-ico`) and the lang flag footprint, so the trigger reads as a sibling of the other menus. This is minimal, vanilla CSS, no inline `style=`, and colors stay centralized in `colors.css`.

## Evidence that all three submenus are flush

The plan's §6 verification table (headless Chrome, 1280×900, transitions disabled, real `:hover`) records post-fix:

| item    | `<a>` h | `<li>` h | gap |
|---------|---------|----------|-----|
| content | 63.05   | 63.05    | 0.00px |
| lang    | 63.05   | 63.05    | 0.00px |
| theme   | 63.05   | 63.05    | 0.00px |

All three top-level `<li>` collapse to 63.05px (down from the 70.05px theme-driven stretch), the navbar matches production height, and the submenu top equals the anchor bottom everywhere. Dark theme (`data-theme="dark"`) was measured separately with identical results. This satisfies the requirement that the gap be gone for a content submenu, the lang submenu, and the theme submenu — the evidence is present and not missing, so no browser re-run was needed.

## No hover dead-zone, preserved submenu styling

With a 0.00px gap the `<a>` region is contiguous with the submenu, so there is no bare strip to cross. The coder's 8-step pointer traverse from each trigger down into its submenu kept `visibility: visible` / `opacity: 1` throughout. The `.has-submenu` markup is unchanged, so the red `border-top`, drop-shadow, and open/close slide transition still come from `style.css`, and the `.theme-switch:focus-within .submenu` / `.theme-switch.is-open .submenu` rule preserves keyboard and click open. Visual screenshots confirmed the red border, shadow, and hover highlight on all three.

## Scope: tokens, FOUC, and theme JS untouched

The nav-gap edit is icon presentation only. The large `colors.css` diff (forced-dark `:root[data-theme="dark"]` block, gated auto-dark media query, duplicated token values) is the pre-existing uncommitted dark-mode/theme-switcher work, not part of this fix — those token values are unchanged by the gap fix. `theme-init.js`, `head-theme-init.html`, and `theme-switcher.js` are untracked/pre-existing and were not modified for the gap. Light-theme colors are untouched. `make build-check` returned exit 0 with FR 84 / EN 82 pages.

## Nothing committed, prior work preserved

`git log -1` shows `HEAD` at `6c53863` (unchanged). `git status` lists only working-tree modifications (`colors.css`, plus the pre-existing `i18n/*.yaml`, `baseof.html`, `header.html`, `site-scripts.html`, and untracked theme files) with nothing staged. No commit, add, or amend was performed, and the pre-existing uncommitted dark-mode work is intact.

</details>

<details>
<summary>File map</summary>

- `themes/sarfrance/assets/css/colors.css` — nav-gap fix: `.theme-switch__ico` 22px→18px + `vertical-align: middle`, `.theme-switch__current` `line-height: 0`→`vertical-align: middle` (rest of the diff is pre-existing dark-mode/theme-switcher work).
- `themes/sarfrance/assets/css/style.css` — empty diff; the `height: 100%` alternative was reverted.
- `themes/sarfrance/layouts/partials/header.html` — unchanged by this fix (theme-switch `.has-submenu` markup is pre-existing).

Full diff: `git diff` in the repo; nav-gap fix isolated to the theme-switch presentation block of `colors.css`.

</details>
