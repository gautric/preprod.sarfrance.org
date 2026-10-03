# Plan d'implémentation — Lien « 📷 Photos » des cartes agenda vers la photothèque

## ⚠️ Exigence ajoutée par l'utilisateur en cours d'implémentation (prioritaire sur le reste du plan)

> Quand on arrive sur la photothèque depuis l'icône photo d'un événement de l'agenda, TOUTES les photos de cet événement doivent être surlignées (mises en évidence visuellement), pas seulement une photo ciblée par une ancre.

Ce qui remplace ou complète les sections (b), (c) et (d) ci-dessous :

- **`photos` devient une liste** (et non plus une chaîne) : toutes les photos de l'événement, colonne « Photos concernées » du tableau (a), 85 photos au total. Le premier élément est la cible de défilement (= l'ancienne « Photo cible »). Exception d'ordre : pour le n° 8 (Picpus 2020), `2020-07-picpus-2` est en tête et `2020-07-picpus-1` (rangée en section 2021) en dernier. Les éléments entre parenthèses dans la colonne « Photos concernées » (n° 3 `lafayette-regiment-virginia`, n° 14 `hommage-franklin`, `president-ambassade`) NE sont PAS inclus.
- **Lien agenda** : `{photothèque}?event=<id de l'événement>#photo-<première>`. L'id est celui de la carte agenda (`.tl-row`, `printf "%s-%s" .date (.title | urlize)`), échappé automatiquement dans la query string. L'ancre garde un repli sans JavaScript. Lien rendu seulement si la première photo existe, `warnf` pour chaque photo manquante.
- **Photothèque** (`phototheque.html`) : table photo → événement construite au build depuis `hugo.Data.agenda.events` ; `data-event="<id>"` sur chaque `.gallery-item` concerné ; `warnf` si une photo est rattachée à deux événements ; région `<p class="gallery-status" aria-live="polite">` portant `data-msg-one` / `data-msg-other` (i18n). Les vignettes reçoivent leurs `width`/`height` intrinsèques (`images.Config`) : sans cela, le chargement différé recompose les rangées et décalait la cible de plus de 1 000 px pour les années anciennes, ce qui a été mesuré en navigateur headless.
- **JS** (`pages/phototheque.js`, dans le `SAR.onReady` existant) : lecture de `?event=` via `URLSearchParams`, comparaison sur `dataset.event` (l'id contient `/` et `:`), ajout de `.photo--highlight` à toutes les photos correspondantes, `scrollIntoView` sur la cible de l'ancre (ou la première correspondance), annonce du nombre de photos dans la région `aria-live`. La photothèque n'a ni filtre ni pagination : rien à démasquer.
- **CSS** : `.gallery-item:target, .gallery-item.photo--highlight { outline: 4px solid var(--photo-highlight) }` dans `phototheque.css` (déplacé depuis `colors.css`) ; variable `--photo-highlight` dans `colors.css` ; `.gallery-status` visuellement masquée dans `phototheque.css`.
- **i18n** : en plus de `event_photos` / `event_photos_title`, `photo_highlight_one` / `photo_highlight_other` (`{n}` = nombre) dans les deux fichiers.
- **Fichier en plus** : `themes/sarfrance/assets/js/pages/phototheque.js`.

Ne rien committer : l'utilisateur valide d'abord. Le courriel de compte rendu viendra après sa validation et le commit (étape ultérieure, hors de ce plan).

## Constats d'exploration

- `data/agenda.yaml` contient 169 événements (2018 → 2026). Pages agenda FR et EN pour 2018 à 2026 (`content/{fr,en}/activites/agenda-YYYY.md`, layout `activites/agenda.html`).
- La photothèque (`content/{fr,en}/activites/phototheque.md`) est une galerie plate, découpée par année (`## 20xx`). Les deux langues référencent exactement les mêmes fichiers dans le même ordre. Aucun regroupement par événement, aucune ancre aujourd'hui (`themes/sarfrance/layouts/activites/phototheque.html` rend `<div class="gallery-item"><img …></div>` sans `id`).
- Les noms de fichiers ne sont PAS toujours fiables pour regrouper : `2025-07-cercle-interallie-2.jpg` est une photo de Picpus (25 juin 2025), `2025-02-ag-senat-assemblee.jpg` montre la résidence de l'ambassadeur (6 février 2025), `2026-02-crossing-dan.jpg` le Leadership Meeting, `2026-03-guilford-court-house-1.jpg` le « Crossing of the Dan ». `2020-07-picpus-1.jpg` est rangé dans la section `## 2021`. `2018-06-statues-yorktown.jpg` figure deux fois (sections 2019 et 2018). Trois fichiers du disque ne sont référencés nulle part (`2025-05-escadrille-lafayette.jpg`, `2025-05-suresnes.jpg`, `2025-05-villeneuve.jpg`).
- Précédent de mise en évidence par ancre : `colors.css` contient déjà `.tl-row:target .page-card { border-color: var(--primary); … }` et `agenda.css` `scroll-margin-top: 140px` pour l'en-tête collant (commit `c42cd0c`). On suit ce motif.
- `main.js` ne gère que les ancres internes (`a[href^="#"]`) ; une ancre arrivant d'une autre page est traitée nativement par le navigateur. Les vignettes ont une hauteur fixe (150 px / 100 px en mobile) : le `loading="lazy"` ne décale pas la position de l'ancre.
- `scripts/agenda_update_dates.py` compare uniquement `CANONICAL_FIELDS = ("date", "title", "type", "description", "location", "link", "lat", "lon")` : un nouveau champ `photos` n'est jamais compté comme changement substantiel, même si l'on relance `make agenda-dates`. Le contrôle CI `preview.yml` ne vérifie que la présence et le format de `update`.
- **Le thème n'est PAS un sous-module** malgré la mention des règles : pas de `.gitmodules`, `git ls-files themes/sarfrance` liste 62 fichiers suivis directement par le dépôt principal (`git -C themes/sarfrance log` renvoie l'historique du dépôt principal). Toutes les modifications se font et se committent donc dans le dépôt principal. À signaler dans le rapport final.
- Hugo local v0.166.0 extended. Build de vérification sûr : `make build-check` (écrit dans `/tmp/sarfrance-build-check`, n'interfère pas avec un `hugo server`).

## (a) Tableau de correspondance événement ↔ photos

Clé de repérage = valeur exacte du champ `date` dans `data/agenda.yaml` (plusieurs titres se répètent d'une année à l'autre). « Photo cible » = nom de fichier sans extension de la première photo de l'événement **dans l'ordre d'affichage de la galerie** ; c'est la valeur à écrire dans `photos:`.

### Correspondances retenues (30 événements)

| # | `date` | Titre agenda (abrégé) | Photo cible (`photos:`) | Photos concernées | Justification | Confiance |
|---|---|---|---|---|---|---|
| 1 | `2018-06-10/2018-06-20` | Voyage du Centenaire (Grande Guerre) | `2018-06-bois-belleau` | bois-belleau, flying-sammy-saint-nazaire, diner-adieu-paris, chateau-thierry-1/2, colleville-sur-mer, puy-du-fou-1/2/3, romagne-montfaucon | Juin 2018 ; Bois-Belleau, Château-Thierry, Romagne, Colleville, Saint-Nazaire = lieux de l'engagement américain de 1917-1918 ; « dîner d'adieu » = fin de voyage. Puy du Fou 2018 inclus par contiguïté (voir cas douteux) | Forte |
| 2 | `2018-06-25` | Cérémonie au cimetière de Picpus (ambassadeur) | `2018-06-picpus-1` | picpus-1/2 | Même lieu, même mois (« juin 2018 ») | Probable |
| 3 | `2019-06-26` | Cérémonie au cimetière de Picpus | `2019-06-picpus-lafayette` | picpus-lafayette (lafayette-regiment-virginia juste avant) | « Picpus avec le Groupe La Fayette, juin 2019 » | Probable |
| 4 | `2019-07-05/2019-07-11` | Congrès NSSAR à Costa Mesa (CA) | `2019-07-congres-costa-mesa-1` | congres-costa-mesa-1…4 | Lieu et mois identiques | Forte |
| 5 | `2019-09-07` | Vernissage de l'exposition de Sanary | `2019-08-sanary-exposition-1` | sanary-exposition-1/2/3 | Même intitulé ; écart de date : légende « août 2019 », agenda 7 septembre | Forte (date à signaler) |
| 6 | `2019-10-02` | Ravivage de la Flamme | `2019-10-ravivage-flamme-1` | ravivage-flamme-1/2 | Date exacte « 2 octobre 2019 » | Forte |
| 7 | `2020-03-06` | AG + dîner à l'École militaire | `2020-03-diner-ecole-militaire-1` | diner-ecole-militaire-1/2/3 | « Dîner du 6 mars 2020 à l'École militaire » | Forte |
| 8 | `2020-07-08` | Cérémonie au cimetière de Picpus (petit comité) | `2020-07-picpus-2` | picpus-2…5 (+ picpus-1, mal rangé en section 2021) | Date exacte « 8 juillet 2020 » ; cible = première photo de la section 2020 | Forte |
| 9 | `2020-08-22/2020-08-23` | 3e reconstitution du camp de Vaussieux | `2020-08-vaussieux-1` | vaussieux-1/2/3 | « Camp de Vaussieux, août 2020 » | Forte |
| 10 | `2021-10-18` | Inauguration statue de Rochambeau à Yorktown | `2021-10-yorktown-delegation` | yorktown-delegation, yorktown-statues | Date exacte « 18 octobre 2021 » | Forte |
| 11 | `2022-07-05` | Cérémonie au cimetière de Picpus | `2022-07-picpus-autorites` | picpus-autorites, picpus-ambassadrice | Date exacte « 5 juillet 2022 » | Forte |
| 12 | `2022-07-10/2022-07-15` | Congrès NSSAR à Savannah | `2022-07-grave-marking-savannah` | grave-marking-savannah | Savannah, juillet 2022 ; les *grave markings* se tiennent pendant les congrès | Probable |
| 13 | `2022-10-05` | Ravivage de la Flamme avec les CAR | `2022-10-ravivage-flamme-1` | ravivage-flamme-1/2/3 | Date exacte « 5 octobre 2022 » | Forte |
| 14 | `2024-03-22` (AG, Institut Catholique) | AG à l'Institut Catholique de Paris | `2024-03-ag-institut-catholique` | ag-institut-catholique (+ hommage-franklin, president-ambassade adjacentes) | « AG du 22 mars 2024 à l'Institut Catholique » | Forte |
| 15 | `2024-03-22` (Dîner, Luxembourg) | Dîner annuel au Palais du Luxembourg | `2024-03-ag-diner-luxembourg` | ag-diner-luxembourg, ag-palais-luxembourg | « Dîner du 22 mars au Palais du Luxembourg » | Forte |
| 16 | `2024-05-25/2024-05-26` | Cérémonies du Memorial Day (France, Belgique) | `2024-05-suresnes-porte-drapeau` | suresnes-porte-drapeau, suresnes-memorial-day, villeneuve-senateur, villeneuve-ambassade, villeneuve-sur-auvers, memorial-day-draguignan | Suresnes 26 mai, Villeneuve 25 mai, Draguignan 26 mai = cimetières américains, Memorial Day | Forte |
| 17 | `2024-07-03` | Cérémonie au cimetière de Picpus | `2024-07-picpus-4` | picpus-4/3/2/1 (ordre galerie) | Date exacte « 3 juillet 2024 » | Forte |
| 18 | `2024-09-07` | 243e anniversaire de la Bataille des Caps | `2024-09-bataille-caps-statue` | bataille-caps-statue, bataille-caps-marine | Intitulé et date « 7 septembre 2024 » | Forte |
| 19 | `2024-10-02` | Ravivage de la Flamme | `2024-10-ravivage-flamme-1` | ravivage-flamme-1/2/3 | Date exacte « 2 octobre 2024 » | Forte |
| 20 | `2024-10-12/2024-10-13` | Week-end SAR France dans le Bordelais | `2024-10-week-end-bordelais` | week-end-bordelais | « 12 et 13 octobre 2024 » | Forte |
| 21 | `2024-11-09` | Journée à Versailles sur les pas du général Dentzel | `2024-11-dentzel-versailles` | dentzel-versailles | « 9 novembre 2024 » | Forte |
| 22 | `2025-02-06` | Visite de la résidence de l'ambassadeur | `2025-02-ag-senat-assemblee` | ag-senat-assemblee (nom trompeur, légende « résidence… 6 février 2025 »), residence-ambassadeur-usa | Légendes datées du 6 février 2025 ; la visite du `2025-03-20` n'a pas de photo | Forte |
| 23 | `2025-02-07` | AG et dîner au Palais du Luxembourg | `2025-02-ag-diner-jeunes` | ag-diner-jeunes, ag-diner-president, ag-senat-salle-medicis, ag-senat-5 | « 7 février 2025 » | Forte |
| 24 | `2025-05-25` | Memorial Day | `2025-05-memorial-day-suresnes` | memorial-day-suresnes, memorial-day-escadrille | 25 et 26 mai 2025, Suresnes et Marnes-la-Coquette | Forte |
| 25 | `2025-06-25` | Cérémonie au cimetière de Picpus | `2025-06-picpus-1` | picpus-1, picpus-4, cercle-interallie-2 (nom trompeur), picpus-3 | « 25 juin 2025 » | Forte |
| 26 | `2025-07-02` | Dîner Île-de-France au Cercle Interallié | `2025-07-cercle-interallie-1` | cercle-interallie-1, cercle-interallie-diner | « 2 juillet 2025 » | Forte |
| 27 | `2026-02-06T18:00:00` | AG et dîner au Palais du Luxembourg | `2026-02-diner-luxembourg` | diner-luxembourg, assemblee-generale | « 6 février 2026 » | Forte |
| 28 | `2026-03-05` | Spring leadership meeting NSSAR (Louisville) | `2026-02-crossing-dan` | crossing-dan (légende « Leadership Meeting, février 2026 ») | Seul Leadership Meeting du début 2026 ; écart : légende « février », agenda 5 mars | Probable (à confirmer) |
| 29 | `2026-06-20/2026-06-22` | Centenaire de SAR France au Puy du Fou | `2026-06-puy-du-fou-1` | puy-du-fou-1…4 | Exemple de l'utilisateur ; « 20 juin 2026 » | Forte |
| 30 | `2026-09-30T18:30:00` | Ravivage de la Flamme sous l'Arc de Triomphe | `2026-09-ravivage-flamme-1` | ravivage-flamme-1/2/3 | Exemple de l'utilisateur ; « 30 septembre 2026 » | Forte |

### Cas douteux — NON liés (à soumettre à l'utilisateur)

- `2024-04-06/2024-04-20` « Voyage en France du President General de la NSSAR » ↔ `2024-04-omaha-beach`, `2024-04-scouts-omaha-beach` (20 avril 2024), `2024-04-drapeaux-sar-royal-deux-ponts` : coïncidence de dates plausible, mais aucune légende ne mentionne le President General. `2024-04-nato-parade-norfolk` se déroule aux États-Unis, donc hors du voyage.
- `2026-09-07T18:00:00` « Commémoration de la Chesapeake » (ravivage par le President General) : les photos `2026-09-ravivage-flamme-*` sont légendées 30 septembre → rattachées à l'événement du 30, pas à celui-ci.
- `2018-06-puy-du-fou-1/2/3` : aucun événement Puy du Fou en 2018 ; probablement une étape du Voyage du Centenaire (n° 1), qu'elles jouxtent dans la galerie. La « Réunion au Puy du Fou » du `2025-04-07` n'a pas de photo.
- `2025-05-villeneuve-sur-auvers` (27 mai 2025) : pas d'événement Villeneuve en 2025 ; il serait abusif de le rattacher au « Memorial Day » du 25 mai.
- `2024-05-journee-resistance-grasse` (27 mai 2024) : Journée nationale de la Résistance, pas le Memorial Day → non comptée dans le n° 16, même si elle est adjacente.

### Photos sans événement dans l'agenda

2017-10 Pershing-La Fayette (agenda démarre en 2018) ; 2018-04 Hermione (Sète) ; 2018-06 statues de Yorktown ; 2019-07 Morristown Green ; 2019-08 camp de Vaussieux (pas d'événement 2019) ; 2020-03 « No comment » ; 2020-09 Journée de Grasse (pas d'événement 2020) ; 2024-02 Le Ray de Chaumont, Holker ; 2024-04 NATO Parade ; 2024-05 locaux rue Bosquet ; 2026-03 Guilford Court House, Crossing of the Dan, tombe de Lustrac. Aucun événement 2023 n'a de photo.

### Anomalies de contenu observées (signaler, ne pas corriger)

`2020-07-picpus-1.jpg` rangé dans la section 2021 ; noms de fichiers trompeurs (`2025-07-cercle-interallie-2`, `2025-02-ag-senat-assemblee`, `2026-02-crossing-dan`, `2026-03-guilford-court-house-1`) ; trois fichiers non référencés en 2025-05.

## (b) Mécanisme de lien retenu

1. **Ancre par photo dans la photothèque.** `phototheque.html` ajoute `id="photo-{nom-de-fichier-sans-extension}"` sur chaque `.gallery-item` (première occurrence seulement, pour éviter l'`id` dupliqué de `2018-06-statues-yorktown`). Justification : une ligne de template, aucune métadonnée à ajouter au Markdown, valable dans les deux langues puisque les fichiers sont identiques, et sans JavaScript. Une ancre par année (option a) déposerait le lecteur en tête de 13 à 30 vignettes ; une ancre par album exigerait de regrouper par nom de fichier, ce qui est faux pour plusieurs photos mal nommées (voir anomalies). Les photos d'un même événement étant contiguës, viser la première suffit.
2. **Mise en évidence sans JS.** `.gallery-item:target` reçoit un contour `var(--primary)` (dans `colors.css`, à côté de `.tl-row:target`) et `.gallery-item[id]` un `scroll-margin-top: 140px` (dans `phototheque.css`) pour l'en-tête collant — même motif que le commit `c42cd0c`. Pas de modification de `phototheque.js` (option b écartée : inutile).
3. **Champ `photos` dans `data/agenda.yaml`.** Valeur : chaîne = nom de fichier sans extension de la photo cible (ex. `photos: "2026-09-ravivage-flamme-1"`), placé juste avant `update` (qui reste la dernière clé). `update` n'est PAS modifié : l'ajout n'est pas un changement substantiel, et `scripts/agenda_update_dates.py` l'ignore (`CANONICAL_FIELDS`), donc aucun badge « Nouveau » ne se déclenchera, même après `make agenda-dates`.
4. **URL** construite dans `agenda.html` à partir de `site.GetPage "/activites/phototheque"` (`.RelPermalink` → `/activites/phototheque/` en FR, `/en/activites/phototheque/` en EN) + `#photo-{photos}`. Choix plutôt que `lang-prefix.html` + chemin en dur : la page est résolue dans la langue courante par Hugo, et le même objet sert au contrôle ci-dessous.
5. **Contrôle au build.** Le lien n'est rendu que si le `RawContent` de la photothèque de la langue courante contient `/images/phototheque/{photos}.` ; sinon `warnf` (« agenda : photo « … » introuvable dans la photothèque (événement …) »). Ainsi une faute de frappe ne produit ni lien mort ni échec de build, mais reste visible dans la sortie de `hugo`.

## (c) Fichiers à modifier

Tous dans le **dépôt principal** (le thème `themes/sarfrance/` y est suivi directement ; ce n'est pas un sous-module, contrairement à ce qu'indiquent les règles — à noter dans le rapport).

| Fichier | Zone | Modification |
|---|---|---|
| `data/agenda.yaml` | données | `photos:` sur les 30 événements du tableau (a) |
| `i18n/fr.yaml`, `i18n/en.yaml` | i18n | 2 clés après `event_new_title` |
| `themes/sarfrance/layouts/activites/phototheque.html` | thème | `id="photo-…"` sur `.gallery-item` |
| `themes/sarfrance/assets/css/phototheque.css` | thème | `scroll-margin-top` sur `.gallery-item[id]` |
| `themes/sarfrance/assets/css/colors.css` | thème | `.gallery-item:target` (contour) |
| `themes/sarfrance/layouts/activites/agenda.html` | thème | lien « 📷 Photos » dans `.agenda-card-meta` + contrôle `warnf` |
| `themes/sarfrance/assets/css/agenda.css` | thème | style `.agenda-card-photos` |
| `.kiro/steering/structure.md` | doc | champ `photos` dans « Agenda Event Fields » + ancres photothèque |
| `TASKS.md` | doc | entrée n° 39 |

Aucun fichier JS modifié ; aucun fichier `content/` modifié.

## (d) Clés i18n

À insérer juste après `event_new_title` dans les deux fichiers (même ordre) :

| id | FR | EN |
|---|---|---|
| `event_photos` | `Photos` | `Photos` |
| `event_photos_title` | `Voir les photos de cet événement dans la photothèque` | `View photos of this event in the photo gallery` |

`event_photos` est le libellé visible (le nom accessible du lien, conforme au critère « label in name ») ; `event_photos_title` sert d'infobulle (`title`), sur le modèle de `event_new` / `event_new_title`. L'émoji 📷 est encapsulé dans `<span aria-hidden="true">` pour ne pas être vocalisé.

## (e) Page d'accueil

**Pas d'icône sur `index.html`.** Les cartes d'accueil ne listent que les événements à venir (`$compareDate >= $today`, trois premiers) ; un événement à venir ne peut, par définition, pas encore avoir de photos. Ajouter le code serait du code mort. Si un événement multi-jours en cours portait déjà `photos`, le lecteur l'atteint en un clic via le lien de titre vers la carte agenda, qui porte l'icône.

## Plan

- [ ] 1. Ancres et mise en évidence dans la photothèque.
      Dans `themes/sarfrance/layouts/activites/phototheque.html` : avant le `range` des sections, déclarer `{{ $seenIds := slice }}`. Dans la boucle, après le calcul de `$src` et à l'intérieur du `{{ if ne $src . }}`, calculer `{{ $photoId := printf "photo-%s" (path.BaseName $src) }}` puis rendre :
      ```go-html-template
      <div class="gallery-item"{{ if not (in $seenIds $photoId) }} id="{{ $photoId }}"{{ $seenIds = $seenIds | append $photoId }}{{ end }}>
      ```
      Ajouter un commentaire de template en français expliquant l'ancre (« cible des liens 📷 de l'agenda ; id posé sur la première occurrence seulement, une photo pouvant figurer deux fois »).
      Dans `themes/sarfrance/assets/css/phototheque.css`, après `.gallery-item:hover` : `/* Ancre depuis l'agenda : la photo ciblée n'est pas masquée par l'en-tête collant */ .gallery-item[id] { scroll-margin-top: 140px; }`.
      Dans `themes/sarfrance/assets/css/colors.css`, à la fin, à la suite du bloc `.tl-row:target` : `/* Photothèque — photo ciblée par l'ancre (lien 📷 depuis l'agenda) */ .gallery-item:target { outline: 3px solid var(--primary); outline-offset: 2px; }`.
      Files: `themes/sarfrance/layouts/activites/phototheque.html`, `themes/sarfrance/assets/css/phototheque.css`, `themes/sarfrance/assets/css/colors.css`
      Verify: `make build-check` réussit sans ERROR ; `grep -c 'id="\?photo-' /tmp/sarfrance-build-check/activites/phototheque/index.html` = 113 (une par fichier distinct référencé : 114 références dont un doublon ; `path.BaseName` vérifié sur Hugo 0.166) et idem pour `/tmp/sarfrance-build-check/en/activites/phototheque/index.html` ; `grep -o 'id="\?photo-2018-06-statues-yorktown' …/activites/phototheque/index.html | wc -l` = 1 ; `grep -o 'id="\?photo-2026-09-ravivage-flamme-1' …` présent dans FR et EN.

- [ ] 2. Clés i18n.
      Ajouter `event_photos` et `event_photos_title` (libellés de la section (d)) juste après `event_new_title` dans `i18n/fr.yaml` et `i18n/en.yaml`, au format existant (`- id: …` / `  translation: "…"`).
      Files: `i18n/fr.yaml`, `i18n/en.yaml`
      Verify: `source .venv/bin/activate && python -c "import yaml; [yaml.safe_load(open(f)) for f in ('i18n/fr.yaml','i18n/en.yaml')]"` sans erreur ; `make build-check` réussit.

- [ ] 3. Lien « 📷 Photos » sur les cartes agenda.
      Dans `themes/sarfrance/layouts/activites/agenda.html`, en tête du bloc `main` (à côté de `$prefix`), déclarer :
      ```go-html-template
      {{- /* Photothèque de la langue courante : cible des liens 📷 (champ `photos` des événements) */ -}}
      {{- $photoPage := site.GetPage "/activites/phototheque" -}}
      ```
      Dans la boucle des événements, remplacer la ligne vide qui suit `{{ with .location }}…{{ end }}` dans `<div class="agenda-card-meta">` par (le `$ev := .` est nécessaire pour le message d'avertissement) :
      ```go-html-template
      {{- $ev := . -}}
      {{ with .photos }}
        {{ if and $photoPage (strings.Contains $photoPage.RawContent (printf "/images/phototheque/%s." .)) }}
        <a class="agenda-card-photos" href="{{ $photoPage.RelPermalink }}#photo-{{ . }}" title="{{ i18n "event_photos_title" }}"><span aria-hidden="true">📷</span> {{ i18n "event_photos" }}</a>
        {{ else }}
        {{ warnf "agenda : photo %q introuvable dans la photothèque (événement %s « %s »)" . $ev.date $ev.title }}
        {{ end }}
      {{ end }}
      ```
      Garder `{{ with .location }}` inchangé et ne pas introduire d'espace parasite qui casserait `.agenda-card-meta:empty` pour les cartes sans lieu ni photos (utiliser les tirets `{{-`/`-}}` si besoin ; contrôler dans le HTML généré qu'une carte sans lieu ni photos garde un `agenda-card-meta` vide).
      Dans `themes/sarfrance/assets/css/agenda.css`, sous `.agenda-card-link:hover`, ajouter :
      ```css
      /* Lien vers les photos de l'événement dans la photothèque */
      .agenda-card-photos { white-space: nowrap; color: var(--primary); text-decoration: none; font-weight: 600; }
      .agenda-card-photos:hover,
      .agenda-card-photos:focus-visible { text-decoration: underline; }
      ```
      Aucun `style=` en ligne, aucun `<script>` ajouté.
      Files: `themes/sarfrance/layouts/activites/agenda.html`, `themes/sarfrance/assets/css/agenda.css`
      Verify: `make build-check` réussit, sans WARN (aucun événement n'a encore `photos`) ; `grep -c agenda-card-photos /tmp/sarfrance-build-check/activites/agenda-2026/index.html` = 0 à ce stade.

- [ ] 4. Renseigner `photos` dans `data/agenda.yaml` (dépend de 1 et 3).
      Pour chacun des 30 événements du tableau (a), identifiés par leur `date` exacte (et, pour les deux `2024-03-22`, par leur titre), insérer `    photos: "<photo cible>"` sur la ligne précédant `    update:`. Ne PAS modifier `update` ni aucune autre clé ; respecter l'indentation de 4 espaces des clés d'événement. Pour les blocs courts (ex. `2018-06-10/2018-06-20`, `2024-05-25/2024-05-26`) qui n'ont que `date`/`title`/`type`/`update`, insérer de même avant `update` sans ajouter d'autres champs.
      Files: `data/agenda.yaml`
      Verify :
      - `source .venv/bin/activate && python - <<'PY'` qui charge `data/agenda.yaml`, vérifie que 30 événements ont `photos`, que pour chacun la DERNIÈRE clé est `update`, et que `git diff -U0 data/agenda.yaml | grep '^[-+]' | grep -v '^+++\|^---'` ne contient que des lignes `+    photos: "…"` (30 lignes, aucune suppression).
      - Rejouer le contrôle CI `update` (copier le bloc Python de `.github/workflows/preview.yml`, étape « Vérifier l'attribut technique update de l'agenda ») : ✅.
      - `make agenda-dates-check` ne doit annoncer aucune nouvelle date pour ces événements (ou, à défaut si l'historique git ne le permet pas, consigner la sortie) — le champ `photos` est hors `CANONICAL_FIELDS`.

- [ ] 5. Documentation.
      Dans `.kiro/steering/structure.md`, section « Agenda Event Fields », ajouter avant la puce `update` :
      `- \`photos\` — optional: file name without extension (e.g. \`"2026-09-ravivage-flamme-1"\`) of the event's first photo in the photo gallery (\`content/{fr,en}/activites/phototheque.md\`). Renders a "📷 Photos" link on the agenda card pointing to \`/activites/phototheque/#photo-<name>\` (language-aware via \`site.GetPage\`). The link is only rendered when the photo is present in that language's gallery; otherwise Hugo logs a warning. Not a substantive change: adding or editing \`photos\` does not bump \`update\` (and \`scripts/agenda_update_dates.py\` ignores it).`
      Ajouter aussi, dans la liste des « Key Conventions » ou à la suite de cette section, une ligne : `- Photo gallery anchors: \`phototheque.html\` gives each \`.gallery-item\` the id \`photo-<file name without extension>\` (first occurrence only); \`.gallery-item:target\` is outlined in \`colors.css\`.`
      Dans `TASKS.md`, ajouter en fin de fichier une entrée au format existant :
      `- [x] 39. Activités > Agenda : lien « 📷 Photos » sur les cartes des événements disposant de photos, renvoyant à la première photo de l'événement dans la photothèque (ancre \`#photo-…\` mise en évidence) — nouveau champ optionnel \`photos\` dans \`data/agenda.yaml\` (30 événements de 2018 à 2026, dont le centenaire au Puy du Fou et le Ravivage de la Flamme du 30 septembre 2026), sans modification de l'attribut \`update\` ; libellés FR/EN \`event_photos\` / \`event_photos_title\``
      Files: `.kiro/steering/structure.md`, `TASKS.md`
      Verify: relecture ; `make build-check` toujours vert.

- [ ] 6. Vérification d'ensemble (dépend de 1 à 5).
      - `make build-check` (équivalent `hugo --minify` isolé) : code de sortie 0, **aucun** `WARN` « introuvable dans la photothèque », aucune ERROR.
      - Validation YAML de tout `data/` comme en CI : `source .venv/bin/activate && python -c "import yaml,glob; [yaml.safe_load(open(f)) for f in glob.glob('data/**/*.yaml', recursive=True)]"`.
      - Script Python (venv) de cohérence : pour chaque événement portant `photos`, calculer l'année (`date[:4]`), puis vérifier que `/tmp/sarfrance-build-check/activites/agenda-<année>/index.html` contient `/activites/phototheque/#photo-<photos>` et que `/tmp/sarfrance-build-check/en/activites/agenda-<année>/index.html` contient `/en/activites/phototheque/#photo-<photos>` ; et que `id=photo-<photos>` (avec ou sans guillemets, HTML minifié) existe dans `/tmp/sarfrance-build-check/activites/phototheque/index.html` et `/tmp/sarfrance-build-check/en/activites/phototheque/index.html`. Attendu : 30/30 en FR et 30/30 en EN.
      - Total des liens : `cat /tmp/sarfrance-build-check/activites/agenda-20*/index.html | grep -o 'class="\?agenda-card-photos' | wc -l` = 30, idem sous `/en/`.
      - Spot-check des exemples : la carte `2026-06-20/2026-06-22` (Puy du Fou) de `agenda-2026` contient `href=/activites/phototheque/#photo-2026-06-puy-du-fou-1` (FR) et `/en/activites/phototheque/#photo-2026-06-puy-du-fou-1` (EN) ; la carte `2026-09-30T18:30:00` contient `#photo-2026-09-ravivage-flamme-1` ; la carte `2026-09-07T18:00:00` (Chesapeake) n'en contient PAS.
      - `title` FR « Voir les photos de cet événement dans la photothèque » et EN « View photos of this event in the photo gallery » présents ; `aria-hidden` sur l'émoji.
      - Aucun `style=` ni `<script>` en ligne ajouté : `git diff themes/ | grep -E '^\+.*(style=|<script)'` vide.
      - Optionnel (visuel) : `hugo server --buildDrafts`, ouvrir `/activites/agenda-2026/`, cliquer « 📷 Photos » du Puy du Fou → la photothèque défile jusqu'à la première photo du centenaire, encadrée en rouge, non masquée par l'en-tête ; idem en `/en/`.
      - `git status --short` : uniquement les 9 fichiers listés en (c) modifiés (plus le présent plan sous `.agents/`) ; rien n'est committé ; nettoyer `/tmp/sarfrance-build-check` si souhaité.

## Points à présenter à l'utilisateur au moment de la validation

- Les correspondances « Probable » (n° 2, 3, 12, 28) et l'écart de date de Sanary (n° 5) ; les cas douteux non liés (voyage du President General 2024 ↔ Omaha Beach, etc.).
- `update` volontairement inchangé : pas de badge « Nouveau » parasite.
- Le thème n'est pas un sous-module : les fichiers modifiés sous `themes/sarfrance/` se committent dans le dépôt principal.
- Anomalies de contenu de la photothèque relevées mais non corrigées.
