# Vérification — Agenda : menu « Ajouter au calendrier » au survol + 4 entrées

Branche : `agenda-cal-hover-menu` (worktree). Hugo v0.166.0+extended (version CI épinglée).

## 1. Build Hugo propre

- `make build-check` (écrit dans `/tmp/sarfrance-build-check`, n'altère pas `public/`) :
  **0 erreur, 0 warning** (aucun warning i18n manquant pour `cal_copy` / `cal_copied` / `cal_icloud`).
- Les 169 fichiers `.ics` par événement sont régénérés (FR et EN) sous `/calendars/<lang>/`.

## 2. Non-régression du flux ICS annuel

- Template `themes/sarfrance/layouts/activites/agenda.ics.ics` : **inchangé** (identique à `main`).
- Partial `themes/sarfrance/layouts/partials/event-dates.html` : **inchangé** (diff vide vs `main`).
- Sortie construite du flux annuel `activites/agenda-2026/index.ics` :
  `diff` entre un build `main` et un build de la branche → **ANNUAL-FEED-IDENTICAL** (byte-à-byte).

## 3. Markup rendu (build `/tmp/sarfrance-build-check/activites/agenda-2026/index.html`)

Chaque carte expose le panneau avec les **4 entrées dans l'ordre exigé** :
1. `<button class="agenda-cal-copy" data-ics-url="…" data-copied-label="Lien copié !">Copier l'URL du .ics</button>`
2. `a.agenda-cal-link--google` (`target="_blank" rel="noopener"`)
3. `a.agenda-cal-link--outlook` (`target="_blank" rel="noopener"`)
4. `a.agenda-cal-link--icloud` (`download="sar-<slug>.ics"`, pointe vers le `.ics` de l'événement)

+ `span.agenda-cal-feedback.hidden[role=status][aria-live=polite]` pour le retour de copie.

### URL .ics absolue copiée (exemple — événement du 17/01/2026)

- `data-ics-url` (relatif) = `/calendars/fr/20260117-conference-de-patrick-villiers-a-versailles.ics`
- URL **absolue** copiée en production (baseURL `https://www.sarfrance.org/`) =
  `https://www.sarfrance.org/calendars/fr/20260117-conference-de-patrick-villiers-a-versailles.ics`
  (le JS applique `new URL(data-ics-url, location.href).href`).
- En dev (`http://localhost:1313/`), l'URL absolue est préfixée du host local ; le contexte
  non sécurisé déclenche le repli `document.execCommand('copy')`.

### URL Google / Outlook pour les 3 formes de date (relevées dans le HTML construit)

| Cas | Date YAML | Google `dates` | Outlook `startdt`/`enddt` + `allday` |
|-----|-----------|----------------|--------------------------------------|
| Journée entière | `2026-01-17` | `20260117/20260118` | `2026-01-17` / `2026-01-18`, `allday=true` |
| Avec heure | `2026-02-06T18:00:00` (Paris) | `20260206T170000Z/20260206T190000Z` | `2026-02-06T17:00:00Z` / `2026-02-06T19:00:00Z`, `allday=false` |
| Multi-jours | `2026-03-03/2026-03-31` | `20260303/20260401` | `2026-03-03` / `2026-04-01`, `allday=true` |

Cohérent avec `event-dates.html` (inchangé) : fin exclusive J+1 en journée entière, Paris→UTC
pour les horaires (18:00 Paris = 17:00 UTC), +2 h quand l'heure de fin manque.

## 4. Vérifié par revue de code (comportement JS — non exécuté en navigateur ici)

`themes/sarfrance/assets/js/pages/add-to-calendar.js` conserve clic / Entrée-Espace (natif
`<button>`), double-clic (ignore toujours `a, button, .agenda-cal, .page-card-map`), Échap
(ferme + focus rendu), clic extérieur (ferme), un seul panneau ouvert. Ajouts :
- survol conditionné à `window.matchMedia('(hover: hover)')` → inactif sur tactile ;
- fermeture différée ~200 ms (`GRACE`) annulée au retour du pointeur (grace period) ;
- `data-opened-by-hover` : un panneau ouvert au clic n'est jamais refermé par la sortie de survol ;
- copie : API Clipboard puis repli `textarea` + `execCommand('copy')`, retour `aria-live` ~2 s ;
- aucune requête réseau, aucun global, pas de `XMLHttpRequest`.

CSS (`agenda.css`) : `--apple` renommé `--icloud` (icône ☁️), `.agenda-cal-copy` (icône 🔗)
et `.agenda-cal-feedback` ajoutés ; couleurs via variables de `colors.css` uniquement (clair+sombre) ;
`@media (max-width: 768px)` empile `.agenda-cal-copy` + liens en pleine largeur (pas de débordement à 375 px).

## À confirmer en navigateur (hors environnement d'exécution de ce step)

Lancer `make serve` puis, sur `/activites/agenda-2026/` (FR) et `/en/activites/agenda-2026/` (EN) :
survol ouvre / grace period bouton→panneau / clic + clavier / Échap + focus / clic extérieur /
copie « Lien copié ! » et collage de l'URL .ics / Google+Outlook en nouvel onglet / iCloud ouvre
le `.ics` / rendu clair+sombre + 375 px / FilterEngine, badge Nouveau, mini-cartes Leaflet intacts.
