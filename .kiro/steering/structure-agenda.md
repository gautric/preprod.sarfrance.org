---
inclusion: fileMatch
fileMatchPattern: ["data/agenda.yaml", "themes/sarfrance/layouts/activites/**", "themes/sarfrance/assets/js/pages/agenda.js", "themes/sarfrance/assets/js/pages/add-to-calendar.js", "themes/sarfrance/assets/css/agenda.css", "themes/sarfrance/layouts/partials/event-*.html", "themes/sarfrance/layouts/partials/ics-*.html", "scripts/agenda_update_dates.py", ".github/workflows/agent-agenda.md", ".github/ISSUE_TEMPLATE/add-agenda-event.yml"]
---

# Project Structure — Agenda

## Agenda Event Fields

Events in `data/agenda.yaml` use a single `date` field in ISO 8601 format:
- Date only: `"2026-01-17"`
- Date with time: `"2026-02-06T18:00:00"`
- Date interval: `"2026-03-03/2026-03-31"` (multi-day events)

Templates and JS parse the `/` separator for intervals and the `T` component for times automatically.

Additional fields:
- `title` — event title (French)
- `type` — event type key (matches `data/metadata/agenda.yaml`)
- `description` — short text shown on the card
- `location` — venue name
- `link` — external URL (wraps the title as a link)
- `lat` / `lon` — coordinates for the Leaflet mini-map on the card (set to `0` to suppress map)
- `photos` — optional: list of the event's photos in the photo gallery (`content/{fr,en}/activites/phototheque.md`), as file names without extension (e.g. `- "2026-09-ravivage-flamme-1"`). The first item is the scroll target, so list first the photo shown first in the gallery section of the event's year (photos filed under another year's section, e.g. `2020-07-picpus-1` shown in the 2021 section, go after). A photo belongs to one event at most (Hugo warns otherwise). Renders a "📷 Photos" link on the agenda card pointing to `/activites/phototheque/?event=<agenda event id>#photo-<first>` (language-aware via `site.GetPage`; the event id is the agenda card's `.tl-row` id, `<date>-<urlized title>`). The link is only rendered when the first photo is present in that language's gallery; every missing photo triggers a Hugo warning. Placed just before `update`. Not a substantive change: adding or editing `photos` does not bump `update` (and `scripts/agenda_update_dates.py` ignores it). Labels: `event_photos` / `event_photos_title` in `i18n/fr.yaml` and `i18n/en.yaml`; style `.agenda-card-photos` in `agenda.css`.
- `update` — technical field: date (`"YYYY-MM-DD"`) of the last substantive change to the event. Always last in the block. Drives the "Nouveau / New" badge.

All events should include the extended fields (`description`, `location`, `link`, `lat`, `lon`) whenever the information is available, regardless of date. For a physical venue, always provide `location` and the corresponding `lat`/`lon` coordinates so the Leaflet mini-map can render. Use `lat: 0` / `lon: 0` only for events with no physical location (e.g. videoconferences). Older events that still lack these fields should be completed as the information becomes available.

Photo gallery highlighting: `phototheque.html` gives each `.gallery-item` the id `photo-<file name without extension>` (first occurrence only, since a photo may appear twice) and, when an agenda event lists it in `photos`, `data-event="<agenda event id>"`. Thumbnails carry their intrinsic `width`/`height` (read with `images.Config`) so lazy loading does not reflow the rows and shift the target. On `?event=<id>`, `pages/phototheque.js` adds `.photo--highlight` to every matching photo, scrolls to the `#photo-…` target (or the first match) and fills the visually hidden `aria-live` region `.gallery-status` (labels `photo_highlight_one` / `photo_highlight_other`, `{n}` = count). Without JavaScript, the `#photo-…` anchor still scrolls to and outlines the first photo. Styles: `.gallery-item:target, .gallery-item.photo--highlight` (thick outline) and `.gallery-item[id]` `scroll-margin-top` in `phototheque.css`; colour `--photo-highlight` in `colors.css`.

## Agenda `update` Field, "Nouveau / New" Badge and Filter

- Every event in `data/agenda.yaml` carries a technical `update` field holding the date of its last substantive change (creation counts as a change). It is the last key of each event block.
- When adding or editing an event by hand, set `update` to the current date. Automated flows (`agent-agenda`, the `ajout-evenement-agenda` Kiro hook) do the same.
- The historical baseline was reconstructed from the git history of `data/agenda.yaml` (and its `data/agenda.json` predecessor) by `scripts/agenda_update_dates.py`. Re-run it with `make agenda-dates` (or `python scripts/agenda_update_dates.py --write`) to recompute every date from git; schema-only refactors are ignored by the comparison, so they do not reset the dates.
- `partials/event-is-new.html` is the single source of truth for the freshness rule: it returns `true` when `update` falls within `params.newEventDays` (15 days by default, in `config/_default/params.yaml`). Never re-implement the comparison — call the partial.
- `partials/event-new-badge.html` renders the badge via that partial. Used on the agenda pages (`activites/agenda.html`). The homepage upcoming-events cards (`index.html`) show no badge: they call `event-is-new.html` directly and add `.event-date--new` to the date block, which takes the `--event-new-bg` / `--event-new-text` colours (rule in `colors.css`).
- Freshness is computed at build time. The daily rebuild scheduled in `deploy.yml` (06:00 UTC) makes the badge and the filter expire on their own, so no client-side JavaScript is involved in the date logic.
- The agenda filter bar carries a "Nouveau / New" pill (`.filter-btn.filter-new`) with a count, rendered only when the displayed year holds at least one fresh event — same conditional pattern as `$usedTypes` for the type pills.
- Adding `?new` to an agenda URL preselects that filter (e.g. `/activites/agenda-2026/?new`). Any form works: `?new`, `?new=1`, `?a=1&new`. When the displayed year holds no fresh event the pill is absent and the page falls back to "Tout / All" rather than showing an empty list. `pages/agenda.js` implements this by clicking the pill, so the `FilterEngine` binding stays the single place that owns active-button and visibility logic.
- Agenda filter attributes: buttons carry `data-filter` (single value), rows carry `data-filters` (comma-separated: the event type, plus `nouveau` when fresh) and `pages/agenda.js` runs the shared `FilterEngine` with `multiValue: true`. The plural attribute name reflects that a row now holds several filterable values; do not put the freshness flag back into a `data-type` attribute.
- Styles: `.event-new`, `.filter-btn.filter-new::before` and `.filter-btn-count` in `filters.css`; colours `--event-new-bg` / `--event-new-text` plus the `.filter-btn.filter-new.active` override in `colors.css`; labels `event_new`, `event_new_title` and `filter_events` in `i18n/fr.yaml` and `i18n/en.yaml`.

## Adding an Event to a Personal Calendar

- Every agenda card carries a "📅 Ajouter au calendrier / Add to calendar" button (last child of `.agenda-card-meta`) opening a panel with three destinations: Google Calendar, Outlook, Apple Calendar (per-event `.ics` download). A double-click on the card body is a shortcut to the same panel, not the only way in — the button is focusable and works with Enter/Space.
- `partials/event-calendar.html` renders the block. **The three URLs are built at build time**, not in JS: `querify` encodes accented titles, descriptions and venues, and `partials/event-dates.html` is the single source of the date normalisation. No event data is exposed in `data-*`, and the links stay valid without JavaScript once the panel is open. `pages/add-to-calendar.js` only opens and closes the panel (click, Enter/Space, double-click, Escape, outside click, `✕`) by toggling `aria-expanded` and the shared `.hidden` class — never re-implement date parsing there.
- `partials/event-dates.html` returns `allDay`, `gDates`, `oStart` / `oEnd` / `oAllDay`, `icsStart` / `icsEnd` and `uidDate`. Rules: times in `data/agenda.yaml` are Paris times, converted to UTC (`…Z`) so no `VTIMEZONE` is needed; an all-day event uses an **exclusive** end date (J+1) for Google, Outlook and `DTEND;VALUE=DATE`; a start time without an end gets +2 h.
- `partials/event-ics.html` publishes the per-event file under `/calendars/<lang>/<AAAAMMJJ>-<urlized title>.ics` via `resources.FromString`. Its `UID` reuses *exactly* the annual feed's slug expression (`title | lower | replaceRE "[^a-z0-9]+" "-"`, **not** `urlize`), so a client that already imported the annual feed updates the event instead of duplicating it. Unlike the annual feed, this file escapes TEXT values (`partials/ics-escape.html`) and folds content lines to 75 octets (`partials/ics-fold.html`).
- The annual feed `activites/agenda.ics.ics` (and its `.page-header-ics` copy-link icon) is **unchanged** and keeps its `TZID=Europe/Paris`: it remains the no-JavaScript path to the whole year.
- `pages/add-to-calendar.js` is loaded by `activites/agenda.html` in its `{{ define "scripts" }}` block, after `pages/agenda.js`. The double-click ignores `a, button, .agenda-cal, .page-card-map`, so linked titles, the "📷 Photos" link and Leaflet's double-click zoom keep their behaviour.
- Styles in `agenda.css`: `.agenda-cal` (full-width row inside the meta flex line), `.agenda-cal-btn`, `.agenda-cal-panel`, `.agenda-cal-link` + `--google` / `--outlook` / `--apple`, `.agenda-cal-close`, `.agenda-cal-hint`. The panel stays **in the flow** rather than absolutely positioned: `.page-card--has-map` has `overflow: hidden` (`filters.css`), which would clip a popover. Colours are `colors.css` variables only, so dark mode follows with no extra rule.
- Labels in `i18n/fr.yaml` and `i18n/en.yaml`: `add_to_calendar`, `add_to_calendar_title`, `add_to_calendar_panel`, `cal_google`, `cal_outlook`, `cal_apple`, `cal_close`, `cal_hint`.
- Side effect to keep in mind: the button is always rendered, so `.agenda-card-meta:empty { display: none }` no longer fires on any card.
