# Fix plan — white gap between top-level nav items and their submenus

Bug (user-visible): opening a top-level menu shows a white/blank strip between the
top-level item and its dropdown submenu for EVERY menu **except** the dark-mode
(theme) switcher, whose submenu sits flush under its trigger. Goal: make all
submenus attach flush like the theme one, keeping hover + click/focus open
behaviour, the red `border-top`, the drop-shadow, the open/close transition, the
light theme, and the mobile menu intact.

Status: **DIAGNOSED AND FIX VERIFIED IN A HEADLESS BROWSER** (Chrome, light theme,
`hugo server` on `http://localhost:1313/`, viewport 1280×900). This file is a plan
only — no code was changed and nothing was committed.

---

## 1. Measured root cause — Candidate 2 (li taller than its `<a>`), surfacing as Candidate 3

The nav is `.nav-menu { display: flex }` with the default `align-items: stretch`
(computed `align-items: normal` → stretch for flex items). So every
`.nav-menu > li` is stretched vertically to the **tallest** item.

The theme-switch trigger `<a>` wraps a **22px SVG icon** (`.theme-switch__ico`,
`width/height: 22px`), which makes its line box ~30px and its total `<a>` the
tallest nav element. The content links hold one line of 14.4px uppercase text
(line box 23.04px) and the lang link holds a 15px flag — both shorter. Flex
stretch then forces all `<li>` to the theme item's height, but each `<a>` keeps
its own (smaller) content height and is top-aligned, leaving a dead strip at the
bottom of the content/lang `<li>`.

The submenu is `position: absolute; top: 100%`, anchored to the **`<li>` bottom**,
not to the `<a>` bottom. On reveal, `transform: translateY(0)` is applied
identically to every menu (hover rule in `style.css`, and the
`.theme-switch:focus-within/.is-open` rule in `colors.css` — the current file
**does** reset `transform: translateY(0)`, contrary to the task's note, so
Candidate 1 is ruled out). The submenu therefore opens at the `<li>` bottom; for
content/lang that is 7px **below** the visible `<a>`, exposing the nav surface
colour (white in light theme) = the reported gap. The theme `<a>` already fills
its `<li>`, so its submenu is flush — exactly why only that menu looks right.

### Evidence — element rects / computed styles (true hover state: transition
disabled, `transform: translateY(0)` forced, i.e. what `:hover` renders)

| item         | `<a>` height | `<a>` bottom | `<li>` bottom | submenu top | gap (submenuTop − aBottom) |
|--------------|--------------|--------------|---------------|-------------|-----------------------------|
| content (×4) | 63.05px      | 63.05px      | 70.05px       | 70.05px     | **7.00px** (white strip)    |
| lang         | 63.05px      | 63.05px      | 70.05px       | 70.05px     | **7.00px** (white strip)    |
| theme        | 70.05px      | 70.05px      | 70.05px       | 70.05px     | **0.00px** (flush)          |

Supporting computed values: `.nav-menu` `display: flex`, `align-items: normal`
(→ stretch); `.nav-menu > li` `position: relative`, height 70.05px (all equal, so
the stretch is confirmed); `.submenu` `position: absolute`, `top: 100%`
(= 70.0469px), hidden-state `transform: matrix(1,0,0,1,0,10)` (translateY 10px)
reset to 0 on reveal for every menu. `li − a` height = **7px for content/lang, 0
for theme** — the single differentiator, matching the user report exactly.

---

## 2. The fix — one declaration, shared nav CSS

Make the top-level anchors fill their stretched `<li>` so the `<a>` bottom
coincides with the `<li>` bottom (where the submenu anchors).

File: `themes/sarfrance/assets/css/style.css`

In the existing rule `.nav-menu > li > a { … }` (the block that currently sets
`display: block; padding: 20px 18px; …`), add a single declaration:

```css
.nav-menu > li > a {
    display: block;
    padding: 20px 18px;
    /* …existing declarations unchanged… */
    height: 100%;   /* fill the flex-stretched <li> so the submenu (top:100%)
                       attaches flush under the link — see nav-gap-fix-plan.md */
}
```

That is the whole change. No markup change, no `colors.css` change, no JS change.

### Why this and not the alternatives
- **`height: 100%`** resolves against the `<li>`'s definite stretched cross-size
  (70.05px) on desktop → `<a>` becomes 70.05px, flush with the submenu. Verified
  below. `box-sizing: border-box` (global reset) keeps the 20/18px padding inside
  the height; the content box (~30px) still fits the 23px text line / 22px icon,
  and the 20px top padding is unchanged so **the labels do not move** — the anchor
  only extends 7px downward to meet the submenu.
- Rejected: changing `.nav-menu` `align-items` (would misalign the bar);
  `display: flex` on `.nav-menu > li` (would turn the mobile `position: static`
  submenu into a horizontal flex sibling unless separately reset — more invasive);
  shrinking the theme icon (changes the theme control's look, fragile, and does not
  fix the general `<li>`/`<a>` height mismatch).
- No hover dead-zone is introduced: the `<a>` (y 0–70.05) is now contiguous with
  the submenu (y 70.05+), so the pointer crosses from trigger to submenu with no
  bare strip. (Even before the fix there was no functional dead-zone — the `<li>`
  covered the strip and kept `:hover` true — the 7px was purely visual.)

### Mobile safety (`@media (max-width: 768px)`)
There `.nav-menu` is `flex-direction: column`, so each `<li>`'s height is
content-based (indefinite) → `height: 100%` on the `<a>` resolves to `auto` and has
**no effect**; the submenu there is `position: static` (not `top: 100%`). Mobile is
unaffected. The implementer must still confirm this (step 4).

---

## 3. Fix verification already performed (headless Chrome, light theme)

The fix was injected at runtime (`.nav-menu > li > a { height: 100% }`, transition
disabled, submenus forced to the real hover state) and re-measured:

| item         | before: gap | after: gap |
|--------------|-------------|------------|
| content (×4) | 7.00px      | **0.00px** |
| lang         | 7.00px      | **0.00px** |
| theme        | 0.00px      | **0.00px** (unchanged) |

All anchors become 70.05px; every submenu top (70.05px) equals its anchor bottom
(70.05px). Gap eliminated everywhere, theme menu unchanged.

---

## 4. Browser verification the implementer MUST perform

Run against a real browser; reproduce the gap first, then confirm it is gone.

1. Start the server: `make serve` from `/Users/gautric/Source/web-apps/sarfrance`
   (serves `http://localhost:1313/`). Open the homepage in light mode (OS light, or
   pick "Light" in the theme switcher).
2. **Reproduce (pre-fix):** hover a content top-level item (e.g. "LA SOCIÉTÉ") and
   the language flag — observe the white strip between the item and the opened
   submenu. Hover the theme (sun/monitor) icon — its submenu is flush (no strip).
   Optional precise check: in DevTools console, for a content `<li>` compare
   `li.querySelector('a').getBoundingClientRect().bottom` with
   `li.querySelector('.submenu').getBoundingClientRect().top` while the menu is open
   → expect ~7px difference; for the theme `<li>` → ~0px.
3. Apply the one-line change from §2 and let `hugo server` live-reload.
4. **Confirm (post-fix), light theme:**
   - A content submenu, the lang submenu, and the theme submenu all open flush
     under their trigger — no white strip on any (the `getBoundingClientRect`
     bottom/top difference is ~0 for all three).
   - Hover each trigger, then move the pointer down into the submenu: it stays open,
     no flicker/close (no dead-zone).
   - The red hover background, the red `border-top` on submenus, the drop-shadow,
     and the open/close slide transition are all still present.
5. **Regressions:**
   - Dark mode: switch the theme control to Dark and repeat step 4 — gap gone, no
     bright divider glare (dark submenu divider unchanged).
   - Mobile: narrow the window below 768px (or device emulation). The hamburger menu
     opens, submenus expand inline (`position: static`), and nothing shifts
     horizontally — the `height: 100%` has no effect there.
   - Click/focus (keyboard) open of the theme switcher still works (Tab to it,
     Enter/click to open, Escape to close).

---

## 5. Constraints honoured
- Vanilla CSS only; no preprocessor; no inline `style=`.
- Single declaration in the shared nav CSS (`style.css`); `colors.css` untouched
  (the theme reveal rule already resets `transform`); FOUC init and
  theme-switcher JS untouched.
- Light-theme colours and dark-mode token values unchanged.
- Markup unchanged — applies uniformly to all `.has-submenu` items.
- Mobile `position: static` submenu behaviour preserved.
- No git commit / add / amend — this task operates on uncommitted working-tree
  code and must not create commits.

---

## 6. APPROACH CHANGE + implementation verification (performed by implementer)

### Approach change (user directive)
The originally planned `.nav-menu > li > a { height: 100% }` was **rejected** by
the user: it would have stretched every nav item up to the theme switcher's 70px
height, making the navbar TALLER than the live production site
(`https://www.sarfrance.org/activites/`, whose text links are ~63.05px tall).

Correct approach instead: **shrink the theme-switch trigger** so it is the same
height as the text links. The 22px `.theme-switch__ico` SVG (inside
`.theme-switch__trigger`) was inflating that `<a>` to 70px via the flex stretch.
Shrinking the icon to 18px and aligning it to the text line-box makes the text
links the tallest items (~63.05px), so flex-stretch sizes every `<li>` to 63.05px
and every submenu (anchored at `top: 100%`) sits flush.

### Actual change applied — `themes/sarfrance/assets/css/colors.css` ONLY
`style.css` was left untouched (the `height: 100%` idea was fully reverted). In the
theme-switch presentation block:

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

Icon shrunk 22px → 18px (matches the dropdown `.theme-opt-ico`), `line-height: 0`
replaced by `vertical-align: middle` on both the current-choice span and the icon
so the inline-flex stays centred inside the `<a>`'s ~23px text line-box instead of
overflowing it on the baseline. No markup change, no JS change, no light/dark token
change.

### Verification — headless Chrome via Playwright (channel=chrome, viewport 1280×900)
`hugo server` on `http://localhost:1313/`, light theme forced
(`data-theme="light"`), transitions disabled for deterministic rects, each menu
revealed by real `:hover`.

Measured `<li>` heights and submenu gap (`submenuTop − aBottom`):

| item    | BEFORE (orig 22px icon) `<a>`h / `<li>`h / gap | AFTER (18px icon) `<a>`h / `<li>`h / gap |
|---------|-----------------------------------------------|------------------------------------------|
| content | 63.05 / **70.05** / **7.00px**                | 63.05 / **63.05** / **0.00px**           |
| lang    | 63.05 / **70.05** / **7.00px**                | 63.05 / **63.05** / **0.00px**           |
| theme   | 70.05 / 70.05 / 0.00px                        | 63.05 / **63.05** / **0.00px**           |
| nav bar | **70.05px** tall                              | **63.05px** tall (matches production)    |

- All three top-level `<li>` are now **63.05px** (NOT 70px); `.main-nav` /
  `.site-header` height = 63.05px, matching the live production text-link height.
- Submenu gap = **0.00px** for the content, lang AND theme submenus.
- **Dark theme** (`data-theme="dark"`): identical result — all `<li>` 63.05px,
  all gaps 0.00px.
- **Hover dead-zone test**: for each menu, moved the pointer from the trigger
  straight down across the boundary into the submenu in 8 steps — the submenu
  stayed `visibility: visible`, `opacity: 1` the whole way (no flicker/close).
- **Mobile** (`viewport 390×850`): `.submenu` computed `position: static` —
  unchanged, so the inline mobile expansion still works and the icon size has no
  layout effect there.
- Visual screenshots confirmed the red `border-top`, drop-shadow and hover
  highlight on all three submenus, each attaching flush under its trigger.

### Build check
`make build-check` → exit **0**, `hugo v0.166.0+extended`, Pages **FR 84 / EN 82**
(matches the required counts). Output in `/tmp/sarfrance-build-check`.

### git status (no commit made)
`git status --short` shows working-tree changes only; `HEAD` unchanged
(`6c53863 style(theme): …`). The only file this fix modified is
`themes/sarfrance/assets/css/colors.css` (`git diff --stat` on `style.css` is
empty). All the other modified/untracked entries are the pre-existing uncommitted
dark-mode + theme-switcher work, left intact. Nothing was staged, committed or
amended.
