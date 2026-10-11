# Plan d'implémentation — « Ajouter au calendrier » sur les cartes de l'agenda

Worktree : `/Users/gautric/Source/web-apps/sarfrance/.worktrees/agenda-add-to-calendar`
**Tous les chemins ci-dessous sont relatifs à ce worktree.** Le cwd d'une session peut être la racine du dépôt : utiliser des chemins absolus préfixés par le worktree.

Objectif : sur chaque carte d'événement des pages agenda, un bouton visible « 📅 Ajouter au calendrier » (focusable, Entrée/Espace) et un raccourci **double-clic sur la carte** ouvrent un panneau offrant trois destinations : Google Agenda, Outlook, Apple Calendar (téléchargement `.ics` de l'événement seul).

---

## Décisions de conception (prises après lecture du code, à appliquer telles quelles)

1. **Les trois URL sont construites par Hugo, pas par le JS.** `querify` encode correctement titres, descriptions et lieux accentués (vérifié : `querify "text" "Café, « été » & co"` → `text=Caf%C3%A9%2C+%C2%AB+%C3%A9t%C3%A9...`). Les `<a href>` sont donc rendus complets au build ; le JS ne fait qu'ouvrir/fermer le panneau. Cela satisfait l'exigence « pas de duplication de la logique de parsing de date en JS » sous sa forme la plus forte : **aucun attribut `data-*` de données d'événement n'est nécessaire** (seuls `id` / `aria-controls` relient le bouton au panneau).
2. **Le `.ics` par événement est généré au build** via `resources.FromString "calendars/<lang>/<id>.ics" $content` : appeler `.RelPermalink` publie le fichier (vérifié par un build de sonde : `/calendars/fr/test-event.ics`, CRLF préservés). Pas de `Blob` client : zéro JS, fonctionne sans JS une fois le panneau ouvert, et le fichier est cacheable.
3. **Une seule partial normalise les dates** (`event-dates.html`) et alimente à la fois les liens Google/Outlook et le `.ics`. Formats de `date` gérés : `"2026-01-17"`, `"2026-02-06T18:00:00"`, `"2026-01-29T18:00:00/2026-01-29T20:00:00"`, `"2026-03-03/2026-03-31"`, `"2026-05-20T09:45/2026-05-20T16:00"` (heure sans secondes).
4. **Fuseau** : les heures de `data/agenda.yaml` sont des heures de Paris. `time.AsTime $s "Europe/Paris"` puis `.UTC.Format` (vérifié : `2026-02-06T18:00:00` → `20260206T170000Z`). Le `.ics` par événement émet donc des **DTSTART/DTEND en UTC (`…Z`)** plutôt que `TZID=Europe/Paris` : pas de composant `VTIMEZONE` à fournir, et aucune ambiguïté côté client. Le flux annuel `agenda.ics.ics` n'est **pas** modifié (il garde son `TZID`).
5. **Durée par défaut** : événement avec heure de début sans fin → **+2 h** (`$t.Add (time.Duration "h" 2)`). Événement sans heure → journée entière, **date de fin exclusive J+1** (Google et Outlook), `DTEND;VALUE=DATE` J+1 dans le `.ics`.
6. **UID identique au flux annuel.** Le `.ics` par événement réutilise *exactement* l'expression du slug de `agenda.ics.ics` (`.title | lower | replaceRE "[^a-z0-9]+" "-" | replaceRE "^-+|-+$" ""`), **pas `urlize`** : les deux slugs diffèrent sur les accents (`conférence` → `conf-rence` côté flux, `conference` côté `urlize`). Même UID = un client qui a importé le flux annuel *met à jour* l'événement au lieu de le dupliquer. Le nom de fichier, lui, utilise l'id de carte (`urlize`), déjà garanti unique par le template.
7. **Échappement et pliage ICS** : le flux annuel n'échappe rien (les titres contenant des `,` et `;` y produisent du texte non conforme RFC 5545). Le nouveau fichier par événement **échappe** (`\` → `\\`, puis `;` → `\;`, `,` → `\,`, retours ligne → `\n`) et **plie** les lignes de contenu à ≤ 75 octets. Le pliage est fait sur frontière de rune avec un budget en octets : `len "été"` renvoie 5 (octets) et `len (split "été" "")` renvoie 3 (runes) — vérifié —, donc un accumulateur à 73 octets + continuation préfixée d'une espace reste sous 75. `agenda.ics.ics` reste inchangé.
8. **Panneau dans le flux, pas en position absolue.** `filters.css` donne `overflow: hidden` à `.page-card--has-map` : un popover positionné en absolu serait rogné sur toutes les cartes avec mini-carte. Le panneau est donc un bloc dépliable **dans le flux** de `.page-card-body`, visuellement traité en panneau (bordure, rayon, ombre). Il est masqué par la classe partagée `.hidden` de `filters.css` (`display: none !important`) — d'où un basculement par `classList`, jamais par `style.display`.
9. **Déclencheur et a11y** : un vrai `<button type="button" aria-expanded aria-controls>` (Entrée/Espace natifs) + panneau `role="group"` `aria-label`. Le `dblclick` est écouté sur `.page-card` et ne fait qu'**ouvrir** le même panneau. Contrepartie assumée : sans JavaScript le panneau reste fermé ; le lien du calendrier **annuel** de l'en-tête de page (`.page-header-ics`, déjà en place) reste la solution sans JS.
10. **Conteneur du double-clic** : `.page-card` (la carte visible), pas `.tl-row` (qui inclut la puce de timeline). Garde-fou : on ignore le double-clic si `e.target.closest('a, button, .agenda-cal, .page-card-map')` — ce qui protège le titre lié, le lien « 📷 Photos », le bouton lui-même, et le double-clic de zoom Leaflet de la mini-carte.
11. **Nouveau module JS dédié** `assets/js/pages/add-to-calendar.js`, chargé par `layouts/activites/agenda.html` dans `{{ define "scripts" }}` via `partial "asset.html"` (comme `agenda.js`). `pages/agenda.js` garde sa responsabilité actuelle (filtres, cartes, copie du lien ICS).

**Hypothèses** : un seul événement par couple (date, titre urlizé) et par année — sinon deux événements partageraient le même chemin de ressource `.ics` ; c'est déjà l'hypothèse de l'`id` de `.tl-row`. Le contenu du `.ics` est en français (les données le sont) quelle que soit la langue de la page ; le chemin inclut la langue pour éviter toute collision si une traduction y est introduite plus tard.

---

## Étapes

- [ ] 1. **Partials utilitaires ICS** : créer `themes/sarfrance/layouts/partials/ics-escape.html` (reçoit une chaîne, renvoie la valeur TEXT échappée RFC 5545 : `\` → `\\`, `;` → `\;`, `,` → `\,`, `\n`/`\r\n` → `\n` littéral) et `themes/sarfrance/layouts/partials/ics-fold.html` (reçoit une ligne de contenu, renvoie la ligne pliée : accumuler les runes via `range (split $line "")`, vider l'accumulateur dès que `add (len $cur) (len $rune)` dépasse 73 octets, puis `delimit $out "\r\n "`). Les deux renvoient leur résultat avec `{{ return … }}` et portent un en-tête de commentaire expliquant l'usage, comme `asset.html` et `format-date.html`.
      Files: `themes/sarfrance/layouts/partials/ics-escape.html`, `themes/sarfrance/layouts/partials/ics-fold.html`
      Verify: `make build-check` — build sans erreur ni avertissement nouveau (les partials ne sont pas encore appelées, l'étape garantit seulement qu'elles compilent).

- [ ] 2. **Partial de normalisation des dates** : créer `themes/sarfrance/layouts/partials/event-dates.html`. Entrée : `(dict "date" .date)`. Elle découpe sur `/` puis sur `T`, normalise une heure sans secondes avec le même test que `format-date.html` (`$colonCount := len (findRE ":" $tp)` ; si `1`, suffixer `":00"`), construit les temps avec `time.AsTime … "Europe/Paris"` et **renvoie un dict** :
      `allDay` (bool), `gDates` (`20260117/20260118` ou `20260206T170000Z/20260206T190000Z`), `oStart` / `oEnd` (`2026-01-17` / `2026-01-18`, ou `2026-02-06T17:00:00Z` / `2026-02-06T19:00:00Z`), `oAllDay` (`"true"`/`"false"`), `icsStart` / `icsEnd` (`20260117` / `20260118` en journée entière, `20260206T170000Z` / `20260206T190000Z` sinon), `uidDate` (`20260117`).
      Règles : fin absente + heure → début +2 h ; fin absente sans heure → J+1 ; fin date seule dans un intervalle → J+1 (`AddDate 0 0 1`) ; fin avec heure → telle quelle.
      Files: `themes/sarfrance/layouts/partials/event-dates.html`
      Verify: `make build-check` — build sans erreur. Le contrôle des valeurs produites se fait à l'étape 6 sur les fichiers générés.

- [ ] 3. **Partial `.ics` par événement** : créer `themes/sarfrance/layouts/partials/event-ics.html`. Entrée : `(dict "event" . "id" $eventId "lang" $ctx.Lang "url" $absUrl)`. Elle appelle `event-dates.html`, assemble les lignes `BEGIN:VCALENDAR` / `VERSION:2.0` / `PRODID:-//SAR France//Agenda//FR` / `CALSCALE:GREGORIAN` / `METHOD:PUBLISH` / `BEGIN:VEVENT` / `UID:<uidDate>-<slug flux>@sarfrance.org` / `DTSTAMP:{{ now.UTC.Format "20060102T150405Z" }}` / `DTSTART…` / `DTEND…` / `SUMMARY:` / `DESCRIPTION:` (repli `<titre> – SAR France` comme le flux annuel) / `LOCATION:` (seulement si renseigné) / `URL:<url>` / `END:VEVENT` / `END:VCALENDAR`. Chaque valeur texte passe par `ics-escape.html`, chaque ligne de contenu par `ics-fold.html` ; les lignes sont jointes par `delimit $lines "\r\n"` avec un `"\r\n"` final. Pour les journées entières : `DTSTART;VALUE=DATE:` / `DTEND;VALUE=DATE:`. La partial termine par `{{ return (resources.FromString (printf "calendars/%s/%s.ics" $lang $id) $content) }}`.
      Files: `themes/sarfrance/layouts/partials/event-ics.html`
      Verify: `make build-check` — build sans erreur (la partial n'est appelée qu'à l'étape 5).

- [ ] 4. **Clés i18n** : ajouter les huit clés dans **les deux** fichiers, à la suite du bloc `event_photos` / `photo_highlight_*` : `add_to_calendar` (« Ajouter au calendrier » / « Add to calendar »), `add_to_calendar_title` (« Ajouter cet événement à votre calendrier (double-clic sur la carte) » / « Add this event to your calendar (double-click the card) »), `add_to_calendar_panel` (« Choisir un calendrier » / « Choose a calendar »), `cal_google` (« Google Agenda » / « Google Calendar »), `cal_outlook` (« Outlook » / « Outlook »), `cal_apple` (« Apple Calendar (.ics) » / « Apple Calendar (.ics) »), `cal_close` (« Fermer » / « Close »), `cal_hint` (« Astuce : double-cliquez sur une carte pour ouvrir ce menu. » / « Tip: double-click a card to open this menu. »).
      Files: `i18n/fr.yaml`, `i18n/en.yaml`
      Verify: `python3 -m venv .venv && . .venv/bin/activate && python -m pip install -q -r scripts/requirements.txt` (une seule fois dans le worktree, le `.venv` n'existe pas encore) puis `make check` — la vérification de parité i18n FR/EN passe.

- [ ] 5. **Partial de rendu du bloc calendrier** : créer `themes/sarfrance/layouts/partials/event-calendar.html`. Entrée : `(dict "event" . "ctx" $ "id" $eventId)`. Elle appelle `event-dates.html`, calcule l'URL absolue de l'événement (`printf "%s#%s" $ctx.Permalink $id`), le texte de détails (description ou repli, puis l'URL absolue, puis `link` s'il est renseigné, séparés par `"\n"`), obtient la ressource via `event-ics.html`, et rend :

      ```html
      <div class="agenda-cal">
        <button type="button" class="agenda-cal-btn" aria-expanded="false" aria-controls="cal-{{ $id }}" title="{{ i18n "add_to_calendar_title" }}">
          <span aria-hidden="true">📅</span> {{ i18n "add_to_calendar" }}
        </button>
        <div class="agenda-cal-panel hidden" id="cal-{{ $id }}" role="group" aria-label="{{ i18n "add_to_calendar_panel" }}">
          <a class="agenda-cal-link agenda-cal-link--google" href="{{ $googleUrl }}" target="_blank" rel="noopener">{{ i18n "cal_google" }}</a>
          <a class="agenda-cal-link agenda-cal-link--outlook" href="{{ $outlookUrl }}" target="_blank" rel="noopener">{{ i18n "cal_outlook" }}</a>
          <a class="agenda-cal-link agenda-cal-link--apple" href="{{ $icsRes.RelPermalink }}" download="sar-{{ $id }}.ics">{{ i18n "cal_apple" }}</a>
          <button type="button" class="agenda-cal-close" aria-label="{{ i18n "cal_close" }}"><span aria-hidden="true">✕</span></button>
          <p class="agenda-cal-hint">{{ i18n "cal_hint" }}</p>
        </div>
      </div>
      ```

      URL Google : `printf "https://calendar.google.com/calendar/render?%s" (querify "action" "TEMPLATE" "text" .title "dates" $d.gDates "details" $details "location" (.location | default ""))`.
      URL Outlook : `printf "https://outlook.live.com/calendar/0/deeplink/compose?%s" (querify "path" "/calendar/action/compose" "rru" "addevent" "subject" .title "startdt" $d.oStart "enddt" $d.oEnd "body" $details "location" (.location | default "") "allday" $d.oAllDay)`.
      Ne pas marquer ces URL `safeURL` : l'échappement HTML de `&` en `&amp;` dans l'attribut est correct et attendu.
      Files: `themes/sarfrance/layouts/partials/event-calendar.html`
      Verify: `make build-check` — build sans erreur (appel branché à l'étape 6).

- [ ] 6. **Brancher la partial dans le gabarit agenda** : dans `themes/sarfrance/layouts/activites/agenda.html`, appeler `{{ partial "event-calendar.html" (dict "event" . "ctx" $ "id" $eventId) }}` comme **dernier enfant de `.agenda-card-meta`**, juste après le bloc du lien 📷. Ne toucher à rien d'autre (filtres, badge, mini-carte, flux ICS d'en-tête). Noter que `.agenda-card-meta:empty { display: none }` ne s'appliquera plus : la ligne de méta devient toujours présente puisqu'elle contient désormais le bouton — c'est voulu, le bouton doit être visible sur chaque carte.
      Files: `themes/sarfrance/layouts/activites/agenda.html`
      Verify: `make build-check` puis contrôler les **artefacts générés** dans `/tmp/sarfrance-build-check` pour les cinq cas de date de l'agenda 2026 :
      - journée entière : `2026-01-17` « Conférence de Patrick Villiers à Versailles » → `.ics` avec `DTSTART;VALUE=DATE:20260117` et `DTEND;VALUE=DATE:20260118` ; `dates=20260117/20260118` dans l'URL Google ; `allday=true` dans l'URL Outlook ;
      - avec heure et fin : `2026-01-29T18:00:00/2026-01-29T20:00:00` → `DTSTART:20260129T170000Z`, `DTEND:20260129T190000Z` ;
      - avec heure sans fin : `2026-02-06T18:00:00` → fin à `20260206T190000Z` (+2 h) ;
      - intervalle multi-jours : `2026-03-03/2026-03-31` « Exposition sur le Royal-Deux-Ponts à Lyon » → `DTEND;VALUE=DATE:20260401` (J+1 exclusif) ;
      - heure sans secondes : `2026-05-20T09:45/2026-05-20T16:00` → `DTSTART:20260520T074500Z`, `DTEND:20260520T140000Z`.
      Contrôler aussi qu'aucune ligne des `.ics` générés ne dépasse 75 octets (`awk 'length($0) > 75' <fichier>` ne renvoie rien) et que les fichiers sont bien publiés sous `/tmp/sarfrance-build-check/calendars/fr/` et `/calendars/en/`. Vérifier enfin que `/tmp/sarfrance-build-check/activites/agenda-2026/index.ics` (flux annuel) est **inchangé** par rapport à un build de la branche de base.

- [ ] 7. **Module JS d'interaction** : créer `themes/sarfrance/assets/js/pages/add-to-calendar.js`, enveloppé dans `SAR.onReady(function () { 'use strict'; … })`, sans aucun global. Comportement :
      - sortir immédiatement si `document.querySelector('.agenda-tl')` est absent ;
      - helpers internes `openPanel(btn)`, `closePanel(btn)`, `closeAll(except)` : basculent `aria-expanded` sur le bouton et la classe `hidden` sur `document.getElementById(btn.getAttribute('aria-controls'))` ; `openPanel` appelle `closeAll` d'abord (un seul panneau ouvert) ;
      - délégation `click` sur `.agenda-tl` : `.agenda-cal-btn` → bascule ; `.agenda-cal-close` → ferme et redonne le focus au bouton ;
      - délégation `dblclick` sur `.agenda-tl` : ignorer si `e.target.closest('a, button, .agenda-cal, .page-card-map')` ; sinon remonter à `.page-card`, ouvrir son `.agenda-cal-btn`, lui donner le focus et vider la sélection de texte (`window.getSelection().removeAllRanges()`) pour que le double-clic ne surligne pas la carte ;
      - `keydown` sur `document` : `Escape` ferme le panneau ouvert et rend le focus à son bouton ;
      - `click` sur `document` : fermer si `!e.target.closest('.agenda-cal')`.
      Utiliser `SAR.selectAll` pour les parcours de boutons ; ne pas réimplémenter de helper de `core.js`. Commentaires en français, comme les modules existants.
      Files: `themes/sarfrance/assets/js/pages/add-to-calendar.js`
      Verify: étape 8 (le script n'est pas encore chargé).

- [ ] 8. **Charger le module** : dans le bloc `{{ define "scripts" }}` de `themes/sarfrance/layouts/activites/agenda.html`, ajouter après `js/pages/agenda.js` :
      `{{- $calJS := partial "asset.html" "js/pages/add-to-calendar.js" }}` + la balise `<script src=… integrity=…>`, exactement sur le modèle des lignes voisines.
      Files: `themes/sarfrance/layouts/activites/agenda.html`
      Verify: `make build-check`, puis `hugo server` et contrôle manuel sur `http://localhost:1313/activites/agenda-2026/` : le bouton « 📅 Ajouter au calendrier » apparaît sur chaque carte ; un clic ouvre le panneau et `aria-expanded` passe à `true` ; ouvrir un second panneau ferme le premier ; `Échap` et un clic extérieur ferment ; `Tab` atteint les trois liens puis le bouton de fermeture ; `Entrée` et `Espace` sur le bouton ouvrent le panneau ; un double-clic sur le corps d'une carte ouvre le panneau sans surligner le texte ; un double-clic sur la mini-carte zoome Leaflet **sans** ouvrir le panneau ; un double-clic sur le titre lié ou sur « 📷 Photos » n'ouvre pas le panneau ; la console du navigateur reste vide. Vérifier aussi `/en/activites/agenda-2026/` (libellés anglais).

- [ ] 9. **Styles du panneau** : ajouter une section « Ajouter au calendrier » à la fin de `themes/sarfrance/assets/css/agenda.css`, avant le bloc `@media (max-width: 768px)` existant (et compléter ce bloc si besoin) : `.agenda-cal { position: relative }`, `.agenda-cal-btn` (pastille en ligne reprenant l'esprit de `.filter-btn` sans dupliquer ses règles : `display:inline-flex`, `gap`, `border: 1px solid var(--gray-border-medium)`, `border-radius: 20px`, `background: var(--bg-surface)`, `color: var(--text-heading)`, `font-family: inherit`, `font-size: .78rem`, `cursor: pointer`), états `:hover` / `:focus-visible` / `[aria-expanded="true"]` en `var(--accent)`, `.agenda-cal-panel` (`display:flex`, `flex-wrap`, `gap`, `margin-top`, `padding`, `border: 1px solid var(--gray-border-light)`, `border-radius: 6px`, `background: var(--bg-surface)`, `box-shadow: 0 2px 8px var(--shadow-subtle)`), `.agenda-cal-link` (`color: var(--accent)`, `font-weight: 600`, soulignement au `:hover`/`:focus-visible`), icônes par fournisseur en `::before` sur `.agenda-cal-link--google` / `--outlook` / `--apple`, `.agenda-cal-close` (bouton nu, `color: var(--text-muted)`), `.agenda-cal-hint` (`flex-basis: 100%`, `font-size: .75rem`, `color: var(--text-muted)`), et un `@media (prefers-reduced-motion: reduce)` neutralisant les transitions ajoutées. **Aucune couleur en dur** : uniquement des `var(--…)` de `colors.css`, ce qui fait suivre le mode sombre sans règle dédiée. Ne pas redéfinir `.hidden` (déjà dans `filters.css`).
      Files: `themes/sarfrance/assets/css/agenda.css`
      Verify: `make build-check`, puis `hugo server` et contrôle visuel sur `/activites/agenda-2026/` dans les trois réglages du sélecteur de thème (clair, sombre, système) : bouton et panneau lisibles, contraste suffisant, panneau **non rogné** sur une carte avec mini-carte (p. ex. `2026-01-17`), rendu correct en largeur mobile (≤ 768 px, outils de développement).

- [ ] 10. **Vérification fonctionnelle des trois destinations** (manuelle, après les étapes 6 et 9) : depuis `/activites/agenda-2026/`, pour l'événement journée entière `2026-01-17`, l'événement horaire `2026-02-06T18:00:00` et l'intervalle `2026-03-03/2026-03-31` — ouvrir le lien Google (nouvel onglet, formulaire pré-rempli avec le bon titre, les bonnes dates et le bon lieu), ouvrir le lien Outlook (même contrôle, `allday` cohérent), cliquer le lien Apple (téléchargement du `.ics`, ouverture dans l'application Calendrier sans erreur, titre/dates/lieu/URL corrects). Consigner le résultat dans le compte rendu de l'étape de revue.
      Files: aucun
      Verify: les trois destinations créent un événement correct pour les trois cas de date.

- [ ] 11. **Documenter dans le steering** : ajouter à `.kiro/steering/structure-agenda.md` une section courte « Ajout au calendrier d'un événement » dans le style concis des sections existantes : partials concernées (`event-calendar.html`, `event-dates.html`, `event-ics.html`, `ics-escape.html`, `ics-fold.html`), module `pages/add-to-calendar.js` chargé par `activites/agenda.html`, classes CSS (`.agenda-cal`, `.agenda-cal-btn`, `.agenda-cal-panel`, `.agenda-cal-link--google|--outlook|--apple`, `.agenda-cal-close`, `.agenda-cal-hint` dans `agenda.css`), clés i18n (`add_to_calendar`, `add_to_calendar_title`, `add_to_calendar_panel`, `cal_google`, `cal_outlook`, `cal_apple`, `cal_close`, `cal_hint`), chemin des `.ics` générés (`/calendars/<lang>/<id de carte>.ics`), UID aligné sur celui du flux annuel, et la règle « les URL sont construites par Hugo, le JS ne gère que l'ouverture/fermeture » (donc aucun attribut `data-*` de données d'événement à ajouter).
      Files: `.kiro/steering/structure-agenda.md`
      Verify: relecture ; `make check` passe toujours.

- [ ] 12. **Vérification finale d'intégration** : `make check` puis `make build-check` sur un arbre propre ; contrôler qu'aucun nouvel avertissement Hugo n'apparaît (notamment pas de conflit de publication de ressource `calendars/…`), que le flux `agenda.ics.ics` de chaque année est identique à celui de la branche de base, que les pages agenda des autres années (2018 → 2027, FR et EN) se construisent, et que le temps de build reste comparable à celui de la branche de base (le pliage ICS ajoute une boucle par ligne et par événement).
      Files: aucun
      Verify: `make check` et `make build-check` réussissent ; `diff` des flux annuels vide ; aucun avertissement nouveau dans la sortie de build.

---

## Fichiers touchés (récapitulatif)

| Fichier | Nature |
| --- | --- |
| `themes/sarfrance/layouts/partials/ics-escape.html` | nouveau |
| `themes/sarfrance/layouts/partials/ics-fold.html` | nouveau |
| `themes/sarfrance/layouts/partials/event-dates.html` | nouveau |
| `themes/sarfrance/layouts/partials/event-ics.html` | nouveau |
| `themes/sarfrance/layouts/partials/event-calendar.html` | nouveau |
| `themes/sarfrance/assets/js/pages/add-to-calendar.js` | nouveau |
| `themes/sarfrance/layouts/activites/agenda.html` | modifié (appel partial + chargement du script) |
| `themes/sarfrance/assets/css/agenda.css` | modifié (section panneau) |
| `i18n/fr.yaml`, `i18n/en.yaml` | modifiés (8 clés) |
| `.kiro/steering/structure-agenda.md` | modifié (section documentaire) |

**Intouchés** : `data/agenda.yaml`, `themes/sarfrance/layouts/activites/agenda.ics.ics`, `themes/sarfrance/assets/js/pages/agenda.js`, `themes/sarfrance/assets/js/shared/*`, `themes/sarfrance/assets/css/filters.css`, `themes/sarfrance/assets/css/colors.css`.

---

## Vérification

Exécutée depuis le worktree `/Users/gautric/Source/web-apps/sarfrance/.worktrees/agenda-add-to-calendar`, Hugo `v0.166.0+extended` (= `HUGO_VERSION_CI`).

### Écart assumé par rapport au plan

Le plan (§ 9) prévoyait `.agenda-cal { position: relative }`. Le bloc est en réalité `flex: 1 1 100%` **à l'intérieur** de la ligne de méta (`.agenda-card-meta`, elle-même `display: flex; flex-wrap: wrap`) : sans cela, le panneau élargirait l'élément flex qui le contient et déborderait de la carte. Le bouton occupe donc sa propre ligne sous `📍`/`📷`, et le panneau la ligne suivante. La décision n° 8 du plan (panneau dans le flux, pas de popover absolu, masquage par `.hidden`) est respectée.

L'`id` du panneau et le nom du `.ics` utilisent le **slug de ressource** (`<AAAAMMJJ>-<titre urlizé>`) et non l'`id` de carte `$eventId` : ce dernier contient `/` et `:` pour les intervalles et les horaires (`2026-03-03/2026-03-31-…`), ce qui produirait un chemin de fichier avec sous-répertoire. `$eventId` reste utilisé tel quel pour l'ancre (`URL:` du `.ics` et `details`/`body` des liens), comme avant.

### 1. Builds

```bash
make build-check          # worktree  → Total in 841 ms, 0 erreur, 0 avertissement
make check                # → « ✅ Toutes les vérifications sont passées. » (parité i18n FR/EN incluse)
node --check themes/sarfrance/assets/js/pages/add-to-calendar.js   # → syntaxe OK
```

Build de référence (dépôt principal, commit de base `54a17d6`, intouché) pour comparaison :

```bash
hugo --minify --destination /tmp/sarfrance-base-check --cacheDir /tmp/sarfrance-base-check/cache
# → Total in 537 ms
```

Pages produites identiques de part et d'autre (84 FR / 82 EN). Le surcoût (~300 ms, 338 fichiers `.ics` dont chaque ligne longue passe par la boucle de pliage) reste dans l'épaisseur du trait pour un build de 0,8 s. Le `.venv` du worktree a été créé pour `make check` (il est ignoré par git).

### 2. Artefacts générés

Publication : `/calendars/fr/` et `/calendars/en/`, **169 fichiers par langue**, nommés `<AAAAMMJJ>-<titre urlizé>.ics`. Aucun avertissement de conflit de ressource.

Cinq cas de date de l'agenda 2026 (`DTSTART` / `DTEND` relevés dans les fichiers générés) :

| Cas | `date` dans `data/agenda.yaml` | `DTSTART` | `DTEND` |
| --- | --- | --- | --- |
| Journée entière | `2026-01-17` | `DTSTART;VALUE=DATE:20260117` | `DTEND;VALUE=DATE:20260118` |
| Heure + fin | `2026-01-29T18:00:00/2026-01-29T20:00:00` | `DTSTART:20260129T170000Z` | `DTEND:20260129T190000Z` |
| Heure sans fin (+2 h) | `2026-02-06T18:00:00` | `DTSTART:20260206T170000Z` | `DTEND:20260206T190000Z` |
| Intervalle multi-jours | `2026-03-03/2026-03-31` | `DTSTART;VALUE=DATE:20260303` | `DTEND;VALUE=DATE:20260401` |
| Heure sans secondes | `2026-05-20T09:45/2026-05-20T16:00` | `DTSTART:20260520T074500Z` | `DTEND:20260520T140000Z` |

Les heures de Paris sont bien converties en UTC (18:00 CET → 17:00 Z en janvier ; 09:45 CEST → 07:45 Z en mai).

Contenu complet vérifié, exemple `calendars/fr/20260117-conference-de-patrick-villiers-a-versailles.ics` :

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SAR France//Agenda//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:20260117-conf-rence-de-patrick-villiers-versailles@sarfrance.org
DTSTAMP:20261011T072829Z
DTSTART;VALUE=DATE:20260117
DTEND;VALUE=DATE:20260118
SUMMARY:Conférence de Patrick Villiers à Versailles
DESCRIPTION:Conférence de Patrick Villiers à Versailles – SAR France\
 nhttps://www.sarfrance.org/activites/agenda-2026/#2026-01-17-conference-d
 e-patrick-villiers-a-versailles
LOCATION:Versailles
URL:https://www.sarfrance.org/activites/agenda-2026/#2026-01-17-conferenc
 e-de-patrick-villiers-a-versailles
END:VEVENT
END:VCALENDAR
```

- UID aligné sur le flux annuel : même expression de slug, donc `conf-rence` (sans `urlize`) — un client qui a importé le flux met l'événement à jour au lieu de le dupliquer.
- Échappement vérifié : `LOCATION:Service historique de la Défense\, Vincennes` (virgule échappée) dans `20260129-…ics`.
- Pliage vérifié : `LC_ALL=C awk '{sub(/\r$/,"")} length($0) > 75' calendars/{fr,en}/*.ics` ne renvoie **aucune** ligne (attention, sans `sub(/\r$/,"")` awk compte le CR terminal et annonce 76 à tort). La coupure peut tomber entre `\` et `n` d'un `\n` échappé : c'est conforme, un lecteur iCalendar déplie les lignes avant d'interpréter les échappements.

### 3. URL générées (relevées dans le HTML produit, entités `&amp;` décodées)

`/activites/agenda-2026/` — journée entière `2026-01-17` :

```
https://calendar.google.com/calendar/render?action=TEMPLATE&dates=20260117%2F20260118&details=Conf%C3%A9rence+de+Patrick+Villiers+%C3%A0+Versailles+%E2%80%93+SAR+France%0Ahttps%3A%2F%2Fwww.sarfrance.org%2Factivites%2Fagenda-2026%2F%232026-01-17-conference-de-patrick-villiers-a-versailles&location=Versailles&text=Conf%C3%A9rence+de+Patrick+Villiers+%C3%A0+Versailles

https://outlook.live.com/calendar/0/deeplink/compose?allday=true&body=…&enddt=2026-01-18&location=Versailles&path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&startdt=2026-01-17&subject=Conf%C3%A9rence+de+Patrick+Villiers+%C3%A0+Versailles

/calendars/fr/20260117-conference-de-patrick-villiers-a-versailles.ics
```

`/activites/agenda-2026/` — avec heure `2026-02-06T18:00:00` :

```
https://calendar.google.com/calendar/render?action=TEMPLATE&dates=20260206T170000Z%2F20260206T190000Z&details=…&location=Palais+du+Luxembourg%2C+Paris&text=Assembl%C3%A9e+g%C3%A9n%C3%A9rale+de+SAR+France+et+d%C3%AEner+au+Palais+du+Luxembourg

https://outlook.live.com/calendar/0/deeplink/compose?allday=false&body=…&enddt=2026-02-06T19%3A00%3A00Z&location=Palais+du+Luxembourg%2C+Paris&path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&startdt=2026-02-06T17%3A00%3A00Z&subject=…

/calendars/fr/20260206-assemblee-generale-de-sar-france-et-diner-au-palais-du-luxembourg.ics
```

`/activites/agenda-2026/` — intervalle `2026-03-03/2026-03-31` :

```
https://calendar.google.com/calendar/render?action=TEMPLATE&dates=20260303%2F20260401&details=…&location=Lyon&text=Exposition+sur+le+Royal-Deux-Ponts+%C3%A0+Lyon

https://outlook.live.com/calendar/0/deeplink/compose?allday=true&body=…&enddt=2026-04-01&location=Lyon&path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&startdt=2026-03-03&subject=Exposition+sur+le+Royal-Deux-Ponts+%C3%A0+Lyon

/calendars/fr/20260303-exposition-sur-le-royal-deux-ponts-a-lyon.ics
```

`/en/activites/agenda-2026/` : les trois mêmes cas vérifiés. Les libellés sont en anglais (« Add to calendar », « Google Calendar », « Apple Calendar (.ics) »…), le `.ics` pointe vers `/calendars/en/…` et les détails/URL utilisent l'ancre `…/en/activites/agenda-2026/#…`. Les dates et paramètres sont identiques (les données d'événement sont françaises dans les deux langues, par conception).

Compte des blocs rendus sur `/activites/agenda-2026/` : 43 `.agenda-cal` / 43 `.agenda-cal-btn` / 43 `.agenda-cal-panel` / 129 `.agenda-cal-link` (= 43 × 3), soit un bloc complet par événement de l'année. Les trois liens externes portent bien `target="_blank" rel="noopener"` ; le lien Apple porte `download="sar-<slug>.ics"`.

### 4. Non-régression

- Flux annuel `activites/agenda.ics.ics` : `diff` **vide** pour les 20 flux (2018 → 2027, FR et EN) entre le build de base et celui du worktree.
- `pages/add-to-calendar.min.<hash>.js` chargé avec son `integrity`, après `pages/agenda.js`, dans le bloc `scripts` de la page agenda.
- `FilterEngine`, badge « Nouveau », mini-cartes Leaflet, lien ICS de l'en-tête : aucun fichier touché.

### 5. Restes à vérifier dans un navigateur

Non couvert par cette vérification statique (aucun navigateur dans l'environnement d'exécution) :

- rendu visuel du panneau dans les trois réglages du sélecteur de thème (les couleurs sont exclusivement des `var(--…)` de `colors.css`, donc le mode sombre suit par construction) ;
- absence de débordement à 375 px — garantie par construction (panneau **dans le flux**, `flex: 1 1 100%` + `min-width: 0`, liens en `flex: 1 1 100%; white-space: normal` sous 768 px) mais non observée ;
- parcours clavier réel (Tab, Entrée/Espace, Échap), double-clic sur le corps de carte vs sur la mini-carte Leaflet, et ouverture effective des trois destinations (étape 10 du plan).

### 6. Nettoyage

`/tmp/sarfrance-build-check` et `/tmp/sarfrance-base-check` supprimés ; aucun fichier temporaire laissé dans le dépôt (`git status` ne liste que les fichiers de la tâche et ce plan).
