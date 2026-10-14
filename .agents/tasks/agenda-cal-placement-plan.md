# Implementation Plan — Agenda « Ajouter au calendrier » : placement + menu global + masquage passé

Worktree ABSOLU : `/Users/gautric/Source/web-apps/sarfrance/.worktrees/agenda-cal-placement`
Tous les chemins ci-dessous sont relatifs à ce worktree. Commits en français (voir `.kiro/steering/git-commit.md`).

## Contexte vérifié (lecture du code)

- Carte agenda : `themes/sarfrance/layouts/activites/agenda.html`. Dans `.agenda-card-meta`, ordre actuel : `.agenda-card-location` (`📍`) → `.agenda-card-photos` (`📷`) → `{{ partial "event-calendar.html" ... }}` (DERNIER). Année : `$agendaYear := .Site.Params.currentAgendaYear | default (now.Format "2006")` puis `$year := .Params.year | default $agendaYear`. En-tête : `{{ partial "page-header.html" (dict "ctx" . "title" ... "ics" $ics) }}` avec `$ics := .OutputFormats.Get "ics"` → `.RelPermalink`.
- Partial par carte : `themes/sarfrance/layouts/partials/event-calendar.html` — bloc `.agenda-cal` (`flex: 1 1 100%` = pleine largeur), bouton `.agenda-cal-btn` + panneau `.agenda-cal-panel.hidden` à 4 entrées. URL Google/Outlook construites au build via `querify` + `event-dates.html`. **Inchangé par le point 1 sauf le CSS du conteneur/déclencheur.**
- En-tête : `themes/sarfrance/layouts/partials/page-header.html` — branche `reflect.IsMap` : si `$ics` fourni, rend `.page-header-actions` > `a.page-header-ics` (icône calendrier SVG, `data-copied-label`) + `span.page-header-ics-feedback.hidden`.
- Dropdown de référence (POINT 2) : `themes/sarfrance/layouts/partials/page-contribute.html` — `div.page-contribute` > `button.page-contribute-toggle[aria-expanded]` (SVG) + `ul.page-contribute-dropdown` de `li > a[target=_blank][rel=noopener]`. Ouverture **CSS pur** : `style.css` lignes ~1321-1340 (`.page-contribute-dropdown { display:none; position:absolute; top:calc(100%+8px); right:0; ... }` + `.page-contribute:hover/:focus-within .page-contribute-dropdown { display:block }`). Toggle rond 36×36 `.page-contribute-toggle` identique visuellement à `.page-header-ics`.
- JS : `themes/sarfrance/assets/js/pages/agenda.js` (copie `.page-header-ics` + filtres) ; `themes/sarfrance/assets/js/pages/add-to-calendar.js` (panneau par carte). Helpers `SAR` dans `core.js`.
- CSS : `themes/sarfrance/assets/css/agenda.css` (styles `.agenda-cal*`), `themes/sarfrance/assets/css/style.css` (`.page-header-actions`, `.page-header-ics*`, `.page-contribute*`). Variables couleur dans `colors.css` — AUCUNE couleur en dur.
- i18n : `i18n/fr.yaml` / `i18n/en.yaml`. Clés existantes réutilisables : `cal_google`, `cal_outlook`, `cal_icloud`, `copy_calendar_link`, `ics_copied`, `ics_hint`, `add_to_calendar`, `add_to_calendar_title`. `cal_apple` conservée mais inutilisée.
- `baseURL: https://www.sarfrance.org/` (`config/_default/hugo.yaml`). Hôte pour `webcal://` = `www.sarfrance.org`.
- Flux annuel `themes/sarfrance/layouts/activites/agenda.ics.ics` : NE PAS modifier (diff byte-identique attendu).

## URL d'abonnement annuel exactes à générer (POINT 2)

Soit, au build dans `page-header.html` :
- `$icsRel` = `.RelPermalink` de l'OutputFormat `ics` (ex. `/activites/agenda-2026.ics`) — déjà passé en paramètre `ics`.
- `$icsAbs` = URL absolue https : `{{ (.OutputFormats.Get "ics").Permalink }}` ou `absURL $icsRel` → `https://www.sarfrance.org/activites/agenda-2026.ics`. **Passer aussi `.Permalink` du flux ICS à la partial** (nouveau paramètre `icsAbs`) car `page-header.html` reçoit un dict et n'a pas accès à la page ; sinon reconstruire via `absURL`.
- `$icsWebcal` = `$icsAbs` avec le schéma remplacé : `replace $icsAbs "https://" "webcal://"` → `webcal://www.sarfrance.org/activites/agenda-2026.ical`.

Entrées (ABONNEMENT au flux annuel, PAS création d'événement) :

a. **Copier l'URL du .ics annuel** — `<button class="page-header-cal-copy" data-ics-url="{{ $icsRel }}" data-copied-label="{{ i18n "ics_copied" }}">` ; le Jys fait `new URL(data-ics-url, location.href).href` et copie (réutilise le mécanisme de `pages/agenda.js`). Libellé : `copy_calendar_link`.

b. **Google (abonnement)** — `href="https://calendar.google.com/calendar/r?cid={{ $icsWebcal | querify ... }}"`. Forme exacte :
   `https://calendar.google.com/calendar/r?cid=<webcal URL encodée>`
   Construire : `{{ printf "https://calendar.google.com/calendar/r?cid=%s" (querify "cid" $icsWebcal | strings.TrimPrefix "cid=") }}` — plus simple et robuste : `{{ printf "https://calendar.google.com/calendar/r?cid=%s" ($icsWebcal | urlquery) }}`. Utiliser `urlquery` pour encoder le `webcal://…`. (La forme `cid=<webcal>` déclenche l'ajout d'un calendrier par abonnement ; la variante `cid=<https ics>` est connue pour échouer parfois côté Google, d'où le choix de `webcal://`.) `target="_blank" rel="noopener"`. Libellé `cal_google`.

c. **Outlook (abonnement)** — `href="https://outlook.live.com/calendar/0/addfromweb?url={{ $icsAbs | urlquery }}&name={{ $calName | urlquery }}"` où `$calName` = `printf "SAR France – Agenda %s" $year`. C'est le deep link du flux « Subscribe from web » d'Outlook. `target="_blank" rel="noopener"`. Libellé `cal_outlook`.

d. **iCloud / Apple (abonnement)** — `href="{{ $icsWebcal }}"` (schéma `webcal://www.sarfrance.org/activites/agenda-<année>.ical`). Le schéma `webcal` déclenche l'abonnement OS (Apple Calendar / iCloud). PAS de `target="_blank"` (schéma applicatif) ; `rel="noopener"` sans danger. Libellé `cal_icloud`.

> Note vérif. : les trois formes (Google `/calendar/r?cid=<webcal>`, Outlook `/0/addfromweb?url=…&name=…`, Apple `webcal://`) sont les formes d'ABONNEMENT à un flux (pas `render?action=TEMPLATE` qui crée un événement unique). Vérifier le rendu `.ical` vs `.ics` : contrôler l'extension réelle produite par l'OutputFormat `ics` dans le `public/` buildé (étape 7) et aligner `$icsWebcal`/`$icsAbs` dessus.

## Logique Hugo passé / année antérieure (POINT 3)

Calculée AU BUILD (jamais en JS).

- Année courante de référence : `$agendaYear` (déjà calculé dans `agenda.html`). L'année affichée est `$year`.
- **Drapeau année : `$yearIsCurrentOrFuture := ge $year $agendaYear`** (comparaison de chaînes « AAAA » = OK pour l'ordre). Si FAUX (année strictement antérieure), ne rendre AUCUN bouton : ni les boutons par carte, ni le menu global de l'en-tête.
- **Événement passé (par carte)** : comparer la date de FIN de l'événement à aujourd'hui `now.Format "2006-01-02"`.
  - Intervalle `début/fin` → base = `fin` (partie date de l'après-`/`, tronquée au `T`). Un événement en cours (fin ≥ aujourd'hui) garde son bouton.
  - Sinon (date simple ou date+heure) → base = `début` (partie date avant `T`).
  - Règle : rendre le bouton seulement si `base >= now.Format "2006-01-02"`. Implémenter cette extraction dans le template `agenda.html` (ou mieux : exposer `endDate`/`startDate` en « AAAA-MM-JJ » depuis `partials/event-dates.html` pour réutiliser la source unique de dates — AJOUTER deux clés `startDay` et `endDay` au dict retourné par `event-dates.html`, format `2006-01-02`, sans toucher au reste).
- Combinaison : le partial `event-calendar.html` n'est appelé que si `$yearIsCurrentOrFuture ET (eventNotPast)`.
- Le menu global de l'en-tête n'est rendu que si `$yearIsCurrentOrFuture`.
- Cas carte sans location/photos/bouton : `.agenda-card-meta:empty { display:none }` existe déjà dans `agenda.css` — vérifier qu'une carte passée (plus de bouton, pas de 📷) sans location n'affiche pas de méta vide cassée. (Les cartes passées ont généralement une location, donc la ligne reste.)

---

## Étapes

- [ ] 1. **`event-dates.html` : exposer les jours début/fin** pour la détection passé.
      Ajouter au dict retourné deux clés : `startDay` (= `$startDateStr`, déjà en `AAAA-MM-JJ`) et `endDay` (partie date de fin en `AAAA-MM-JJ` : pour un intervalle, `index (split $endRaw "T") 0` ; sinon = `startDay`). Ne modifier AUCUNE autre clé ni la logique UTC/all-day existante.
      Fichiers : `themes/sarfrance/layouts/partials/event-dates.html`
      Verify : `cd /Users/gautric/Source/web-apps/sarfrance/.worktrees/agenda-cal-placement && hugo --gc` — build OK sans erreur ; aucun changement de rendu des liens Google/Outlook/.ics existants.

- [ ] 2. **`agenda.html` : calcul des drapeaux + repositionnement + conditions de rendu.**
      (a) Après `$year` : `{{ $yearIsCurrentOrFuture := ge $year $agendaYear }}`.
      (b) Déplacer l'appel `{{ partial "event-calendar.html" ... }}` : le sortir de la fin de `.agenda-card-meta` et le placer JUSTE APRÈS le bloc `{{ with .location }}…{{ end }}` (donc avant le lien `📷`).
      (c) L'entourer d'une garde : calculer dans la boucle `{{ $d := partial "event-dates.html" (dict "date" .date) }}` puis `{{ $notPast := ge $d.endDay (now.Format "2006-01-02") }}` et ne rendre le partial que si `and $yearIsCurrentOrFuture $notPast`.
      (d) Passer `$yearIsCurrentOrFuture` à `page-header.html` : ajouter au dict `"icsMenu" $yearIsCurrentOrFuture` (et conserver `"ics" $ics`). Passer aussi l'URL absolue : `"icsAbs" $ics.Permalink`-équivalent — récupérer via `{{ with .OutputFormats.Get "ics" }}{{ $ics = .RelPermalink }}{{ $icsAbs = .Permalink }}{{ end }}` et passer `"icsAbs" $icsAbs`.
      Fichiers : `themes/sarfrance/layouts/activites/agenda.html`
      Verify : `hugo --gc` OK ; sur `public/activites/agenda-<annéeCourante>/index.html` le bouton `.agenda-cal` apparaît après `.agenda-card-location` et avant `.agenda-card-photos` ; sur une page d'année passée (`agenda-<n-1>`) aucun `.agenda-cal` ni menu d'en-tête.

- [ ] 3. **`page-header.html` : menu déroulant global annuel** sur le modèle `page-contribute`.
      Dans la branche `reflect.IsMap`, lire `$icsMenu := .icsMenu | default false`, `$icsAbs := .icsAbs | default ""`. Ne rendre `.page-header-actions` QUE si `$ics ET $icsMenu`. Remplacer le `a.page-header-ics` + `span.page-header-ics-feedback` par :
      `div.page-header-cal` > `button.page-header-cal-toggle[aria-expanded="false"][aria-label]` (GARDER l'icône calendrier SVG actuelle) + `ul.page-header-cal-dropdown` de 4 `li` :
        1. `li > button.page-header-cal-copy[data-ics-url="{{ $ics }}"][data-copied-label="{{ i18n "ics_copied" }}"]` → `{{ i18n "copy_calendar_link" }}` ;
        2. `li > a[target=_blank][rel=noopener]` Google (URL point 2.b, `cid=<webcal urlquery>`) → `{{ i18n "cal_google" }}` ;
        3. `li > a[target=_blank][rel=noopener]` Outlook (URL 2.c) → `{{ i18n "cal_outlook" }}` ;
        4. `li > a[rel=noopener]` iCloud (`$icsWebcal`, 2.d) → `{{ i18n "cal_icloud" }}`.
      Construire en tête de bloc : `{{ $icsWebcal := replace $icsAbs "https://" "webcal://" }}`, `{{ $calName := printf "SAR France – Agenda %s" ... }}` (le titre contient déjà l'année ; dériver depuis `$title` ou passer `"year" $year`). Ajouter `span.page-header-cal-feedback.hidden[role=status][aria-live=polite]` pour le retour de copie. Conserver `aria-expanded` géré par JS (toggle clavier) tout en gardant l'ouverture CSS :hover/:focus-within.
      Fichiers : `themes/sarfrance/layouts/partials/page-header.html`
      Verify : `hugo --gc` OK ; `public/activites/agenda-<annéeCourante>/index.html` contient `.page-header-cal-dropdown` avec les 4 entrées et les URL ci-dessus ; page année n-1 : aucun `.page-header-cal`.

- [ ] 4. **CSS point 1 — déclencheur inline par carte.** Dans `agenda.css`, retirer `flex: 1 1 100%` de `.agenda-cal` (le rendre inline comme `.agenda-card-location`/`.agenda-card-photos`) ; réduire le gabarit de `.agenda-cal-btn` pour coller à la taille/police des éléments inline voisins (même `font-size`/`line-height`, pas de pleine largeur). GARDER le panneau `.agenda-cal-panel` en `flex-basis: 100%` (reste dans le flux, non rogné par `overflow:hidden`). Conserver le comportement responsive `@media (max-width:768px)`. Variables couleur uniquement.
      Fichiers : `themes/sarfrance/assets/css/agenda.css`
      Verify : `hugo server` ou build + ouverture `public/.../agenda-<annéeCourante>/` ; à ~375 px le déclencheur reste sur la ligne de méta sans débordement, le panneau s'ouvre toujours en pleine largeur, clair ET sombre.

- [ ] 5. **CSS point 2 — menu global.** Dans `style.css`, ajouter les règles `.page-header-cal` / `.page-header-cal-toggle` / `.page-header-cal-dropdown` / `.page-header-cal-copy` / `.page-header-cal-feedback` en RÉUTILISANT le patron `.page-contribute*` (toggle rond 36×36, dropdown `position:absolute; top:calc(100%+8px); right:0; display:none`, ouverture `.page-header-cal:hover .page-header-cal-dropdown, .page-header-cal:focus-within .page-header-cal-dropdown { display:block }`). `.page-header-cal-copy` : `<button>` nu stylé comme un lien du dropdown (hériter du style `a` du dropdown). Reprendre la pastille de retour copie du modèle `.page-header-ics-feedback` pour `.page-header-cal-feedback`. Variables couleur uniquement ; `@media (prefers-reduced-motion)` conservé. Ne PAS dupliquer `filters.css`. Supprimer/garder les anciennes règles `.page-header-ics*` seulement si plus référencées (le flux annuel garde son icône via le nouveau toggle ; `.page-header-ics` n'est plus émis → régles supprimables, mais vérifier qu'aucune autre page ne les utilise avant suppression — `grep` `page-header-ics`).
      Fichiers : `themes/sarfrance/assets/css/style.css`
      Verify : build + navigateur : le toggle calendrier de l'en-tête ouvre le dropdown au survol ET au focus clavier (Tab) ; 4 entrées lisibles clair/sombre ; à ~375 px le dropdown ne déborde pas de la fenêtre.

- [ ] 6. **JS — copie dans le menu global.** Dans `pages/agenda.js`, remplacer le bloc qui cible `.page-header-ics` par un bloc ciblant `.page-header-cal-copy` (bouton) : au clic, copier `new URL(dataset.icsUrl, location.href).href` via `navigator.clipboard.writeText` (repli `document.execCommand` comme `add-to-calendar.js`), afficher `.page-header-cal-feedback` ~2 s (`data-copied-label`). Gérer aussi `aria-expanded` du `.page-header-cal-toggle` au clic clavier (toggle), sans casser l'ouverture CSS au survol. Vanilla + helpers `SAR` uniquement ; pas de global fuité ; `fetch`/clipboard, jamais `XMLHttpRequest`.
      Fichiers : `themes/sarfrance/assets/js/pages/agenda.js`
      Verify : build + navigateur : clic « Copier l'URL du .ics » copie l'URL absolue `https://www.sarfrance.org/activites/agenda-<année>.ics` et affiche « Lien copié »/« Link copied » ; au clavier, Entrée sur le toggle ouvre/ferme le menu ; aucune erreur console.

- [ ] 7. **i18n — libellés du menu global** (parité FR/EN obligatoire). Réutiliser `copy_calendar_link`, `cal_google`, `cal_outlook`, `cal_icloud`, `ics_copied`. Ajouter si besoin : `cal_menu_label` (aria-label du toggle global, ex. FR « Ajouter l'agenda à votre calendrier » / EN « Add this agenda to your calendar »). Ajouter la clé dans `i18n/fr.yaml` ET `i18n/en.yaml`.
      Fichiers : `i18n/fr.yaml`, `i18n/en.yaml`
      Verify : `hugo --gc` OK (aucun `i18n` manquant) ; comparer le nombre d'`- id:` entre fr.yaml et en.yaml (`grep -c '^- id:'`) — doit être égal.

- [ ] 8. **Doc — `structure-agenda.md`.** Mettre à jour la section « Adding an Event to a Personal Calendar » : (a) nouveau placement du bouton par carte (après `📍`, avant `📷`, style inline, non plus dernier enfant pleine largeur) ; (b) menu déroulant global annuel dans l'en-tête (toggle calendrier + dropdown CSS pur, 4 entrées d'ABONNEMENT au flux annuel : copie URL .ics, Google `cid=<webcal>`, Outlook `addfromweb`, iCloud `webcal://`) ; (c) règle de non-affichage : aucun bouton pour un événement dont la date de fin est passée, aucun bouton (ni carte ni en-tête) pour une année strictement antérieure à `currentAgendaYear` ; mentionner les clés `startDay`/`endDay` ajoutées à `event-dates.html` et que la détection est faite au build avec `now`. Mentionner que `.page-header-ics*` est remplacé par `.page-header-cal*`.
      Fichiers : `.kiro/steering/structure-agenda.md`
      Verify : relecture ; cohérence avec les fichiers modifiés (noms de classes, clés i18n, chemins).

- [ ] 9. **Non-régression flux annuel + build complet.**
      Vérifier que `themes/sarfrance/layouts/activites/agenda.ics.ics` n'a PAS été modifié et que le `.ics`/`.ical` annuel buildé est byte-identique à `main` (diff du fichier généré dans `public/`).
      Fichiers : aucun (vérification)
      Verify :
      1. `hugo --gc --cleanDestinationDir` — build complet sans erreur ni warning nouveau.
      2. Diff du flux annuel : builder sur `main` et sur la branche, comparer `public/activites/agenda-<année>.ics` (ou `.ical`) → identiques. Ex. `git stash || true; git -C . worktree ...` — plus simple : `git show main:themes/sarfrance/layouts/activites/agenda.ics.ics` doit égaler le fichier courant, et le flux rendu ne doit pas changer.
      3. FilterEngine, badge « Nouveau », mini-cartes Leaflet, liens `📷`/titres : inchangés.

## Checklist de vérification finale (build + navigateur)

- [ ] `hugo --gc --cleanDestinationDir` : build propre, aucun warning i18n/photo nouveau.
- [ ] Parité i18n FR/EN (`grep -c '^- id:' i18n/fr.yaml` == `i18n/en.yaml`).
- [ ] Page année COURANTE : bouton `📅` par carte placé après `📍`, avant `📷`, style inline cohérent ; panneau à 4 entrées s'ouvre (clic/clavier/survol/double-clic/Échap/clic extérieur) ; menu global d'en-tête présent avec 4 entrées d'abonnement.
- [ ] Page année FUTURE (si existe) : boutons présents (cartes + en-tête).
- [ ] Page année N-1 : AUCUN bouton par carte, AUCUN menu global.
- [ ] Événement passé de l'année courante : pas de bouton par carte ; événement du jour / en cours (intervalle fin ≥ aujourd'hui) : bouton présent.
- [ ] Carte passée sans méta : pas de ligne `.agenda-card-meta` vide cassée.
- [ ] Copie URL .ics annuel (en-tête) et URL .ics par événement (carte) → URL absolue correcte, retour « Lien copié / Link copied ».
- [ ] URL Google (`calendar/r?cid=<webcal>`), Outlook (`addfromweb?url=…&name=…`), iCloud (`webcal://`) correctes et ouvrant un ABONNEMENT.
- [ ] Rendu correct en mode CLAIR et SOMBRE (variables colors.css, aucune couleur en dur).
- [ ] Pas de débordement à ~375 px (déclencheur inline, panneau pleine largeur, dropdown global dans la fenêtre).
- [ ] FR et EN testés (`/activites/agenda-<année>/` et `/en/activites/agenda-<année>/`).
- [ ] Flux `agenda.ics.ics` annuel inchangé (diff byte-identique).
- [ ] Aucune erreur console ; aucun global JS fuité.
