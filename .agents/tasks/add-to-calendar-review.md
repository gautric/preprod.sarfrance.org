# « Ajouter au calendrier » sur les cartes d'agenda (Google / Outlook / .ics par événement)

Chaque carte des pages agenda reçoit un bouton « 📅 Ajouter au calendrier » qui déplie un panneau de trois destinations, avec le double-clic sur le corps de la carte en simple raccourci. Le choix structurant est que **les trois URL sont calculées au build par Hugo** (`querify` + une partial unique de normalisation des dates) et que le `.ics` par événement est une ressource publiée sous `/calendars/<langue>/<slug>.ics` : le module JS ne fait qu'ouvrir et fermer le panneau, il ne connaît ni date ni titre. Le flux annuel `agenda.ics.ics` n'est pas touché et reste le chemin sans JavaScript ; `diff` vide sur les 20 flux (2018→2027, FR et EN) entre le build de base et celui de la branche.

Watch for: l'ordre de tabulation du panneau ne suit plus l'ordre visuel sous 768 px (`.agenda-cal-close { order: -1 }` — confirmé) ; la croix de fermeture fait ~14×14 px, sous le seuil WCAG 2.2 SC 2.5.8 (confirmé) ; le focus retombe sur `<body>` quand un clic extérieur referme un panneau dans lequel le focus se trouvait (confirmé) ; l'étape 10 du plan — ouvrir réellement les trois destinations, plus le parcours clavier, le double-clic vs zoom Leaflet, le mode sombre et le rendu à 375 px — n'a pas pu être exécutée (aucun navigateur dans l'environnement), et reste donc à faire par un humain avant fusion (confirmé).

**Verdict**: APPROVED

## High-level view

La décision de tout calculer au build est ce qui tient cette implémentation : `event-dates.html` est la seule source du calcul de dates, `event-ics.html` et les deux liens externes la consomment, et il n'y a aucun attribut `data-*` de données d'événement à maintenir en parallèle. Les cinq formes du champ `date` présentes dans `data/agenda.yaml` sont couvertes et vérifiées sur les artefacts générés, y compris la conversion Paris→UTC (18:00 CET → 17:00 Z en janvier, 09:45 CEST → 07:45 Z en mai) et la fin exclusive J+1 des journées entières. Cette convention de fin exclusive est cohérente avec les trois cibles : Google l'exige, `DTEND;VALUE=DATE` aussi, et le modèle de Microsoft (Graph `isAllDay`) traite également la fin d'un événement journée entière comme minuit du lendemain.

L'accessibilité est traitée à la source plutôt que rattrapée : le déclencheur est un vrai `<button type="button">` avec `aria-expanded` et `aria-controls`, donc Entrée/Espace fonctionnent sans code, et le double-clic n'est qu'un raccourci supplémentaire. Le panneau porte `role="group"` et un `aria-label` traduit, est masqué par la classe partagée `.hidden` (donc retiré de l'arbre d'accessibilité quand il est fermé), et expose les trois liens plus une croix de fermeture dans l'ordre du DOM. Échap et le clic extérieur ferment ; un seul panneau peut être ouvert. Restent deux écarts concrets : la croix est réordonnée visuellement en mobile sans l'être dans le DOM, et sa cible de pointage est très petite. Un troisième, plus discret : le focus n'est pas rapatrié quand la fermeture vient d'un clic extérieur.

Le panneau est délibérément dans le flux et non en position absolue, parce que `.page-card--has-map` porte `overflow: hidden` dans `filters.css` et rognerait un popover sur toutes les cartes à mini-carte. Il occupe toute la largeur de la ligne de méta (`flex: 1 1 100%` + `min-width: 0`), ce qui le rend incapable d'élargir la carte. Toutes les couleurs sont des variables de `colors.css` (vérifié : les sept variables utilisées ont bien une redéfinition dans les deux blocs de thème sombre), donc le mode sombre suit sans règle dédiée, et rien de `filters.css` n'est redupliqué — la pastille du bouton emprunte l'esprit de `.filter-btn` avec ses propres valeurs plutôt que de redéclarer la classe.

Les règles JS du projet sont respectées sans écart : module dédié sous `pages/`, `SAR.onReady` + `'use strict'`, aucun global exporté, `SAR.selectAll` réutilisé plutôt que réécrit, aucun `<script>` inline, chargement via `partial "asset.html"` avec `integrity` après `pages/agenda.js`. Les huit clés i18n existent dans les deux fichiers, `make check` (parité FR/EN incluse) passe, et `structure-agenda.md` est mis à jour avec les nouveaux motifs en `fileMatchPattern` et l'effet de bord `.agenda-card-meta:empty`.

Deux fragilités structurelles méritent d'être connues sans être des défauts aujourd'hui. L'`id` du panneau et le chemin de la ressource `.ics` sont dérivés de `AAAAMMJJ + titre urlizé`, là où l'`id` de carte `$eventId` conserve l'heure : deux événements du même jour portant le même titre produiraient un `id` HTML dupliqué et deux appels `resources.FromString` sur le même chemin. Vérifié sur les 169 événements actuels : 169 slugs distincts, aucune collision. Et la détection « journée entière » ne regarde que le composant de début, donc une plage mixte du type `2026-03-03/2026-03-31T18:00` perdrait silencieusement son heure de fin — aucune donnée de ce type n'existe.

<details>
<summary>Issues (10)</summary>

1. **Ordre de focus mobile** — `.agenda-cal-close { order: -1 }` sous 768 px place la croix en premier visuellement alors qu'elle reste quatrième dans le DOM (WCAG 2.4.3 / 1.3.2). Supprimer `order: -1` ou déplacer le bouton de fermeture avant les trois liens dans `event-calendar.html`.
2. **Cible de la croix trop petite** — `.agenda-cal-close` avec `padding: 0 2px`, `font-size: 0.85rem` et `line-height: 1` fait ~14×14 px, sous les 24×24 px de WCAG 2.2 SC 2.5.8, et le `gap: 10px` du panneau mobile ne suffit probablement pas à bénéficier de l'exception d'espacement. Ajouter du padding ou une taille minimale.
3. **Focus perdu à la fermeture par clic extérieur** — le handler `click` sur `document` appelle `closeAll(null)` sans rapatrier le focus ; si le focus était sur un lien du panneau, il retombe sur `<body>`. Rendre le focus au bouton déclencheur quand le panneau fermé contenait `document.activeElement`.
4. **Vérification navigateur non faite** — l'étape 10 du plan (ouverture réelle des liens Google / Outlook / Apple pour les trois cas de date), le parcours clavier, le double-clic sur le corps de carte vs le zoom Leaflet de la mini-carte, le rendu en mode sombre et le rendu à 375 px n'ont pas été observés. À faire manuellement avant fusion.
5. **Collision possible de slug** — `id="cal-<AAAAMMJJ>-<titre urlizé>"` et le chemin `calendars/<lang>/<slug>.ics` perdent l'heure que `$eventId` conserve : deux événements du même jour au même titre donneraient un `id` HTML dupliqué et un second `resources.FromString` sur un chemin déjà pris. Zéro collision sur les 169 événements actuels ; à documenter comme invariant ou à désambiguïser avec un index.
6. **Journée entière déduite du seul début** — `$allDay := eq (len $sp) 1` ne regarde que le composant de début, donc `2026-03-03/2026-03-31T18:00` serait traité en journée entière et son heure de fin ignorée. Aucune donnée actuelle ; soit refuser ce cas via `warnf`, soit le gérer.
7. **Outlook limité aux comptes personnels** — le lien pointe sur `outlook.live.com` ; les utilisateurs Microsoft 365 / professionnels atterrissent sur l'hôte grand public au lieu de `outlook.office.com`. Soit renommer le libellé (« Outlook.com »), soit détecter/proposer les deux.
8. **Pliage au milieu d'une séquence échappée** — `ics-fold.html` peut couper entre le `\` et le `n` d'un `\n` : légal (RFC 5545 déplie avant d'interpréter), mais c'est une verrue d'interopérabilité avec les lecteurs permissifs. Ne pas couper quand le dernier caractère accumulé est une barre oblique inverse.
9. **Pas de `SEQUENCE`, `DTSTAMP` mouvant** — l'UID est partagé avec le flux annuel (voulu : mise à jour plutôt que doublon), mais `DTSTAMP` change à chaque build (reconstruction quotidienne par cron) et aucun `SEQUENCE` n'accompagne la ressource ; certains clients ignorent une mise à jour sans incrément de `SEQUENCE`. Ajouter `SEQUENCE:0`.
10. **Découvrabilité du raccourci et répétition de l'astuce** — le double-clic n'est annoncé que par l'attribut `title` du bouton (invisible au clavier et au tactile) et par `cal_hint`, qui n'apparaît qu'une fois le panneau ouvert et est dupliqué 43 fois sur la page 2026. Sortir l'astuce de la carte (en-tête de page) ou l'alléger.

</details>

<details>
<summary>Details</summary>

### Normalisation des dates : une partial, trois consommateurs

`event-dates.html` renvoie un dict (`allDay`, `gDates`, `oStart`/`oEnd`/`oAllDay`, `icsStart`/`icsEnd`, `uidDate`) consommé par les deux liens externes et par `event-ics.html`. C'est ce qui garantit qu'aucune des trois destinations ne peut dériver des autres, et la raison pour laquelle le JS n'a pas une ligne de logique de date.

Les cinq formes présentes dans `data/agenda.yaml` sont couvertes, et les valeurs relevées dans les artefacts générés :

| Cas | `date` | `DTSTART` | `DTEND` |
| --- | --- | --- | --- |
| Journée entière | `2026-01-17` | `DTSTART;VALUE=DATE:20260117` | `DTEND;VALUE=DATE:20260118` |
| Heure + fin | `2026-01-29T18:00:00/2026-01-29T20:00:00` | `DTSTART:20260129T170000Z` | `DTEND:20260129T190000Z` |
| Heure sans fin | `2026-02-06T18:00:00` | `DTSTART:20260206T170000Z` | `DTEND:20260206T190000Z` (+2 h) |
| Intervalle | `2026-03-03/2026-03-31` | `DTSTART;VALUE=DATE:20260303` | `DTEND;VALUE=DATE:20260401` |
| Heure sans secondes | `2026-05-20T09:45/2026-05-20T16:00` | `DTSTART:20260520T074500Z` | `DTEND:20260520T140000Z` |

La normalisation de l'heure sans secondes réutilise le même test que `format-date.html` (`len (findRE ":" $tp)`), ce qui évite une seconde convention de parsing dans le thème. Le choix de l'UTC plutôt que `TZID=Europe/Paris` pour le fichier par événement supprime le besoin d'un composant `VTIMEZONE`, au prix d'une divergence de forme avec le flux annuel qui garde son `TZID` — les deux désignent le même instant, donc l'UID partagé reste cohérent.

La branche « journée entière » construit ses dates nues en UTC (`printf "%sT00:00:00Z"`) et ne passe pas par le fuseau de Paris : une date nue convertie depuis Paris puis reformatée en UTC reculerait d'un jour. Le défaut de forme est la détection elle-même : `$allDay` ne dépend que du composant de début (issue 6).

### Panneau dans le flux plutôt que popover

```
.tl-row
└── .page-card[.page-card--has-map]      overflow: hidden  (filters.css)
    ├── .page-card-body
    │   └── .agenda-card-meta            display: flex; flex-wrap: wrap
    │       ├── .agenda-card-location    📍
    │       ├── .agenda-card-photos      📷  (lien)
    │       └── .agenda-cal              flex: 1 1 100%; min-width: 0
    │           ├── button.agenda-cal-btn        aria-expanded / aria-controls
    │           └── .agenda-cal-panel.hidden     flex: 1 1 100%; role=group
    └── .page-card-map                   (double-clic = zoom Leaflet)
```

`overflow: hidden` sur `.page-card--has-map` aurait rogné un popover absolu sur toutes les cartes géolocalisées ; le bloc prend donc sa propre ligne dans la ligne de méta et le panneau la suivante. Le `flex: 1 1 100%` est aussi ce qui empêche le panneau d'élargir l'élément flex qui le contient, d'où l'écart assumé par rapport au `position: relative` prévu par le plan.

### Garde-fous du double-clic

```js
timeline.addEventListener('dblclick', function (event) {
    if (event.target.closest('a, button, .agenda-cal, .page-card-map')) return;
    var card = event.target.closest('.page-card');
    ...
```

Les quatre exclusions couvrent le titre lié, le lien 📷, le bouton et sa croix, et la mini-carte dont le double-clic appartient à Leaflet. Le conteneur écouté est `.page-card` et non `.tl-row`, ce qui évite d'armer la puce de timeline.

La séquence réelle d'un double-clic est `click`, `click`, `dblclick` : les deux premiers passent par le handler `document` et referment tout, le troisième ouvre. L'état final est correct, mais c'est la raison pour laquelle un panneau déjà ouvert « clignote » sur un double-clic de sa propre carte.

### Données françaises exposées aux deux langues

Le contenu des événements (titre, description, lieu) vient de `data/agenda.yaml`, en français, et part tel quel vers les trois destinations y compris depuis `/en/` ; seuls les libellés d'interface sont traduits. Le chemin du `.ics` est néanmoins préfixé par la langue, ce qui laisse la porte ouverte à des données traduites plus tard sans collision de ressource.

### Non-régression

Preuves relevées dans le plan : `diff` vide sur les 20 flux annuels, aucun fichier de `FilterEngine`, du badge « Nouveau » ou des mini-cartes touché, aucun avertissement de conflit de publication malgré 338 `.ics` ajoutés, `data/agenda.yaml` intact. Le seul effet de bord est `.agenda-card-meta:empty { display: none }` qui ne se déclenche plus, puisque la ligne de méta contient désormais toujours le bouton — consigné dans le steering.

Le surcoût de build mesuré (537 ms → 841 ms) vient de la boucle de pliage appliquée à chaque ligne de chaque `.ics`. Acceptable à cette échelle, mais c'est le poste qui grossira linéairement avec l'historique de l'agenda.

### Couverture de test

Le projet n'a pas de suite de tests front ; la vérification repose sur `make check` (parité i18n, YAML, front matter), `make build-check`, `node --check` sur le module, et l'inspection des artefacts générés. Non testé : tout le comportement du module JS (aucun harnais DOM dans le dépôt), et l'ensemble des contrôles navigateur listés en issue 4.

</details>

<details>
<summary>Fichiers</summary>

- `themes/sarfrance/layouts/partials/event-dates.html` — nouveau ; normalisation du champ `date` vers les formats Google / Outlook / ICS
- `themes/sarfrance/layouts/partials/event-ics.html` — nouveau ; assemble et publie le `.ics` par événement
- `themes/sarfrance/layouts/partials/ics-escape.html` — nouveau ; échappement RFC 5545 des valeurs TEXT
- `themes/sarfrance/layouts/partials/ics-fold.html` — nouveau ; pliage des lignes à 75 octets sur frontière de rune
- `themes/sarfrance/layouts/partials/event-calendar.html` — nouveau ; bouton + panneau, construit les trois URL via `querify`
- `themes/sarfrance/assets/js/pages/add-to-calendar.js` — nouveau ; ouverture/fermeture du panneau (clic, clavier, double-clic, Échap, clic extérieur)
- `themes/sarfrance/layouts/activites/agenda.html` — appel de la partial en fin de `.agenda-card-meta` + chargement du module
- `themes/sarfrance/assets/css/agenda.css` — section du bouton et du panneau, variables de thème uniquement
- `i18n/fr.yaml`, `i18n/en.yaml` — 8 clés
- `.kiro/steering/structure-agenda.md` — section documentaire + `fileMatchPattern` élargi

Diff complet : `git diff main...agenda-add-to-calendar`

</details>
