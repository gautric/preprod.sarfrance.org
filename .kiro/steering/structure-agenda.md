---
inclusion: fileMatch
fileMatchPattern: ["data/agenda.yaml", "themes/sarfrance/layouts/activites/**", "themes/sarfrance/assets/js/pages/agenda.js", "themes/sarfrance/assets/css/agenda.css", "themes/sarfrance/layouts/partials/event-*.html", "scripts/agenda_update_dates.py", ".github/workflows/agent-agenda.md", ".github/ISSUE_TEMPLATE/add-agenda-event.yml"]
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
