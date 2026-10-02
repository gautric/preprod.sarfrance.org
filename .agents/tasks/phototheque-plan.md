# Implementation Plan — Ajout de 7 photos 2026 à la photothèque (FR + EN)

## Findings from exploration (grounding)

- Gallery source = `content/{fr,en}/activites/phototheque.md`, layout `phototheque` (theme `themes/sarfrance/layouts/activites/phototheque.html`). No data file.
- The layout splits `.RawContent` on `## 20`, and for each year renders ONLY the lines containing `![`: `alt` → `<img alt>`, `src` → `<img src>` / `data-full`. The italic `*caption*` line is NOT rendered in the gallery. `pages/phototheque.js` uses the `alt` attribute as the lightbox caption. So alt text **is** the visible caption. Convention: alt = caption text (plain text, no `<sup>`), italic line repeats it.
- Entry format (verified with `cat -e`): `![alt](/images/phototheque/NAME.jpg)` line, then `*caption*` line, then one blank line.
- FR: `## 2026` is line 13, blank line 14, first entry (Guilford Court House, March 2026) starts line 15. EN: `## 2026` line 11, blank line 12, first entry line 13. Existing 2026 entries are March → February (most recent first), so both new events (30 Sept, then 20–22 June) go at the **top** of the `## 2026` block, before Guilford Court House.
- Neither `phototheque.md` has a `lastUpdate` front-matter field → do **not** add one.
- No i18n / metadata key is needed (pure content + static images).
- **No change to the `themes/sarfrance` submodule.** Images go in root `static/images/phototheque/`, text in `content/`.
- Existing similar names: `2024-10-ravivage-flamme-{1,2,3}.jpg`, `2018-06-puy-du-fou-{1,2,3}.jpg`. No `2026-09-*` / `2026-06-*` files exist → no collisions.
- `public/` is gitignored. Local Hugo is v0.166.0 extended (≥ 0.157 minimum). ImageMagick `magick` is at `/opt/homebrew/bin/magick`.
- Source images (inspected from the zip, previews viewed):

| Source | Size / dims | EXIF | Content seen | Target |
|---|---|---|---|---|
| IMG_5880.jpeg | 0.6 MB, 1280×960, Orientation **RightTop** (portrait once rotated) | no GPS | Arc de Triomphe, ceremony at its foot | `2026-09-ravivage-flamme-1.jpg` |
| IMG_5888.jpeg | 0.5 MB, 1135×961 | no GPS | Row of officials / association representatives on the cobblestones | `2026-09-ravivage-flamme-2.jpg` |
| IMG_5898bis.jpg | 5.1 MB, 4284×5015 | **GPS** | Wreaths (incl. ribbon « Coalition américaine ») on the Tomb of the Unknown Soldier, flame in background | `2026-09-ravivage-flamme-3.jpg` |
| 20260620_190447.jpg | 2.1 MB, 3979×2497 | **GPS** | Large crowd in a chandeliered reception hall | `2026-06-puy-du-fou-1.jpg` |
| 20260620_191256.jpg | 3.4 MB, 4080×3060 | **GPS** | Speakers (microphone) in front of US and French flags | `2026-06-puy-du-fou-2.jpg` |
| 20260620_195059.jpg | 4.3 MB, 4080×3060 | **GPS** | Buffet served by chefs | `2026-06-puy-du-fou-3.jpg` |
| 20260621_000132.jpg | 4.6 MB, 4080×3060 | **GPS** | Night show: fireworks, fountains, costumed performers | `2026-06-puy-du-fou-4.jpg` |

## Decisions

- **Process all 7 images with one uniform command** `magick SRC -auto-orient -strip -resize "2000x2000>" -quality 85 DEST`. Rationale: the skill's `-resize "2000x2000>" -quality 85` handles the 5 files > 2 MB; `-auto-orient` bakes the EXIF rotation of IMG_5880 into the pixels before `-strip` removes metadata, and `-strip` removes the GPS coordinates present in 5 phone photos (privacy; existing gallery images carry no GPS). Running the two small files through the same command (no resize triggered, since they are < 2000 px) keeps the set consistent and orientation-safe; the q85 re-encode loss is negligible. Every output is `.jpg` (lower-case, `.jpeg` normalised).
- **Numbering** follows source order for Ravivage, chronological capture order for Puy du Fou (the user's mapping), with entries listed in ascending number within each event (same as the 2024 Ravivage block).
- **Dates come from the agenda** (`data/agenda.yaml`: "Ravivage de la Flamme sous l'Arc de Triomphe", `2026-09-30T18:30:00`; "Centenaire de SAR France au Puy du Fou", `2026-06-20/2026-06-22`), not EXIF. The 00:01 fireworks shot is captioned « nuit du 20 au 21 juin 2026 », which matches both the agenda weekend and the capture time.
- **Captions name no individuals** (identities are not known from the material) and describe only what is visible. None contain `: ; ? !` or guillemets, so no non-breaking spaces are required; apostrophes stay straight `'` as everywhere else in the file.

## Plan

- [ ] 1. Extract the zip to a temp dir outside the repo and produce the 7 optimised JPEGs in `static/images/phototheque/`.
      Run from `/Users/gautric/Source/web-apps/sarfrance` (do not modify or delete the zip):
      ```bash
      cd /Users/gautric/Source/web-apps/sarfrance
      T=$(mktemp -d)
      unzip -q photospourlaphotothque.zip -d "$T"
      D=static/images/phototheque
      opt() { magick "$T/$1" -auto-orient -strip -resize "2000x2000>" -quality 85 "$D/$2"; }
      opt IMG_5880.jpeg        2026-09-ravivage-flamme-1.jpg
      opt IMG_5888.jpeg        2026-09-ravivage-flamme-2.jpg
      opt IMG_5898bis.jpg      2026-09-ravivage-flamme-3.jpg
      opt 20260620_190447.jpg  2026-06-puy-du-fou-1.jpg
      opt 20260620_191256.jpg  2026-06-puy-du-fou-2.jpg
      opt 20260620_195059.jpg  2026-06-puy-du-fou-3.jpg
      opt 20260621_000132.jpg  2026-06-puy-du-fou-4.jpg
      rm -rf "$T"
      ```
      Files: `static/images/phototheque/2026-09-ravivage-flamme-{1,2,3}.jpg`, `static/images/phototheque/2026-06-puy-du-fou-{1,2,3,4}.jpg` (new)
      Verify: `magick identify -format "%f %wx%h %[orientation] %b\n" static/images/phototheque/2026-0[69]-*.jpg` — 7 files, longest side ≤ 2000 px, each < 2 MB, orientation `Undefined`; `2026-09-ravivage-flamme-1.jpg` is portrait (960×1280); `exiftool`/`magick identify -verbose ... | grep -i gps` returns nothing. `ls "$T"` fails (temp dir removed); `photospourlaphotothque.zip` still present and unchanged.

- [ ] 2. Insert the 7 FR entries at the top of the `## 2026` block of `content/fr/activites/phototheque.md`, i.e. after line 14 (the blank line following `## 2026`) and before the line `![245e commémoration de la bataille de Guilford Court House, 15 mars 1781](...)`. Exact text to insert (each entry followed by one blank line):
      ```markdown
      ![L'Arc de Triomphe lors du Ravivage de la Flamme, 30 septembre 2026](/images/phototheque/2026-09-ravivage-flamme-1.jpg)
      *L'Arc de Triomphe lors du Ravivage de la Flamme, 30 septembre 2026*

      ![Les participants à la cérémonie du Ravivage de la Flamme sous l'Arc de Triomphe, 30 septembre 2026](/images/phototheque/2026-09-ravivage-flamme-2.jpg)
      *Les participants à la cérémonie du Ravivage de la Flamme sous l'Arc de Triomphe, 30 septembre 2026*

      ![Gerbes déposées sur la tombe du Soldat inconnu, 30 septembre 2026](/images/phototheque/2026-09-ravivage-flamme-3.jpg)
      *Gerbes déposées sur la tombe du Soldat inconnu, 30 septembre 2026*

      ![Réception du centenaire de SAR France au Puy du Fou, 20 juin 2026](/images/phototheque/2026-06-puy-du-fou-1.jpg)
      *Réception du centenaire de SAR France au Puy du Fou, 20 juin 2026*

      ![Allocutions lors de la célébration du centenaire de SAR France au Puy du Fou, 20 juin 2026](/images/phototheque/2026-06-puy-du-fou-2.jpg)
      *Allocutions lors de la célébration du centenaire de SAR France au Puy du Fou, 20 juin 2026*

      ![Buffet du centenaire de SAR France au Puy du Fou, 20 juin 2026](/images/phototheque/2026-06-puy-du-fou-3.jpg)
      *Buffet du centenaire de SAR France au Puy du Fou, 20 juin 2026*

      ![Feux d'artifice du spectacle nocturne du Puy du Fou, centenaire de SAR France, nuit du 20 au 21 juin 2026](/images/phototheque/2026-06-puy-du-fou-4.jpg)
      *Feux d'artifice du spectacle nocturne du Puy du Fou, centenaire de SAR France, nuit du 20 au 21 juin 2026*

      ```
      No front-matter change (no `lastUpdate` field exists).
      Files: `content/fr/activites/phototheque.md`
      Verify: `sed -n 13,37p content/fr/activites/phototheque.md` shows `## 2026`, blank, the 7 new entries, then the Guilford Court House entry; file still starts with `---` and has `title:`.

- [ ] 3. Insert the 7 EN entries at the top of the `## 2026` block of `content/en/activites/phototheque.md`, i.e. after line 12 (blank line following `## 2026`) and before `![245th commemoration of the Battle of Guilford Court House, March 15, 1781](...)`. Same image paths, same order. Exact text:
      ```markdown
      ![The Arc de Triomphe during the Rekindling of the Flame, September 30, 2026](/images/phototheque/2026-09-ravivage-flamme-1.jpg)
      *The Arc de Triomphe during the Rekindling of the Flame, September 30, 2026*

      ![Participants in the Rekindling of the Flame ceremony under the Arc de Triomphe, September 30, 2026](/images/phototheque/2026-09-ravivage-flamme-2.jpg)
      *Participants in the Rekindling of the Flame ceremony under the Arc de Triomphe, September 30, 2026*

      ![Wreaths laid on the Tomb of the Unknown Soldier, September 30, 2026](/images/phototheque/2026-09-ravivage-flamme-3.jpg)
      *Wreaths laid on the Tomb of the Unknown Soldier, September 30, 2026*

      ![Reception for the SAR France centennial at the Puy du Fou, June 20, 2026](/images/phototheque/2026-06-puy-du-fou-1.jpg)
      *Reception for the SAR France centennial at the Puy du Fou, June 20, 2026*

      ![Speeches during the SAR France centennial celebration at the Puy du Fou, June 20, 2026](/images/phototheque/2026-06-puy-du-fou-2.jpg)
      *Speeches during the SAR France centennial celebration at the Puy du Fou, June 20, 2026*

      ![Buffet for the SAR France centennial at the Puy du Fou, June 20, 2026](/images/phototheque/2026-06-puy-du-fou-3.jpg)
      *Buffet for the SAR France centennial at the Puy du Fou, June 20, 2026*

      ![Fireworks during the Puy du Fou night show, SAR France centennial, night of June 20–21, 2026](/images/phototheque/2026-06-puy-du-fou-4.jpg)
      *Fireworks during the Puy du Fou night show, SAR France centennial, night of June 20–21, 2026*

      ```
      ("Rekindling of the Flame" matches the existing 2019/2022/2024 EN captions; "Arc de Triomphe" and "Puy du Fou" keep French spelling; en dash in "20–21" matches "February 12–14, 2026" already in the file.)
      Files: `content/en/activites/phototheque.md`
      Verify: `sed -n 11,35p content/en/activites/phototheque.md` shows `## 2026`, blank, the 7 new entries, then the Guilford Court House entry.

- [ ] 4. Build and check the rendered output.
      From `/Users/gautric/Source/web-apps/sarfrance`: `hugo --minify`
      Verify:
      - Build exits 0 with no ERROR/WARN about the photothèque.
      - `grep -o '2026-0[69]-[a-z-]*[0-9]\.jpg' public/activites/phototheque/index.html | sort -u` and the same for `public/en/activites/phototheque/index.html` each list all 7 filenames; in both HTML files the first `gallery-item` under the 2026 `<h2>` is `2026-09-ravivage-flamme-1.jpg` and `2026-09-ravivage-flamme-3.jpg` precedes `2026-06-puy-du-fou-1.jpg`, which precedes `2026-03-guilford-court-house-2.jpg`.
      - Rendered `alt` attributes carry the FR captions on the FR page and the EN captions on the EN page (spot-check `alt="Gerbes déposées` / `alt="Wreaths laid`, minified HTML may drop quotes).
      - `ls public/images/phototheque/2026-0[69]-*.jpg` lists the 7 files.
      - Optional visual check: `hugo server --buildDrafts`, open `/activites/phototheque/` and `/en/activites/phototheque/`, confirm thumbnails display upright and the lightbox caption shows the alt text.

- [ ] 5. Final hygiene (no commit — the user commits himself).
      Verify: `git status --short` shows only the 7 new images under `static/images/phototheque/`, the two modified `phototheque.md` files and the pre-existing untracked `photospourlaphotothque.zip`; `git -C themes/sarfrance status --short` is empty (submodule untouched); no temp directory left behind.

## Out of scope / notes

- No i18n keys, no `data/` change, no theme/layout/JS/CSS change, no `lastUpdate` addition.
- `TASKS.md` logging is not requested by the user; leave it unchanged.
