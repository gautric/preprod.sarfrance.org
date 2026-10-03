# Plan de correction des listes `photos` de `data/agenda.yaml`

Audit fait le 2 octobre 2026 sur l'arbre de travail (HEAD `1b758ef`, `data/agenda.yaml` modifié et non commité). Rien n'a encore été modifié.

## Méthode

- Croisement automatique (script Python temporaire, dans le venv) de chaque liste `photos` avec `content/{fr,en}/activites/phototheque.md`. Points contrôlés : existence dans la galerie, section d'année, ordre d'affichage, photo rattachée à deux événements, photos de la galerie rattachées à aucun événement, préfixe `YYYY-MM` du nom comparé à la date de l'événement, place de `photos` juste avant `update`.
- Fichiers de `static/images/phototheque/` : liste complète et `md5` pour détecter les doublons binaires.
- Examen visuel de toutes les images douteuses, plus les dates de création (`mdls`) quand elles sont exploitables.
- Build de référence `make build-check CHECK_DIR=/tmp/sar-check` : aucun WARN avant correction.

Résultat mécanique : aucune photo pendante (toutes les entrées `photos` existent en FR et en EN), aucune photo listée sous deux événements par son nom, aucun ordre fautif, et `photos` est partout placé juste avant `update`. Les incohérences sont donc des erreurs de contenu : nom de fichier trompeur, photo rattachée au mauvais événement, photos oubliées, et un doublon binaire sous deux noms.

## Le cas signalé : Picpus du 25 juin 2025 et Cercle Interallié du 2 juillet 2025

L'incohérence, c'est le nom du fichier, pas le rattachement. Il ne faut **pas** déplacer `2025-07-cercle-interallie-2` vers le dîner du Cercle Interallié :

- L'image montre la relève du drapeau américain au cimetière de Picpus : mur de pierre, plaques « Marquise de La… » et « Les Fils de la Révolution… », garde militaire américaine. Rien ne rappelle un dîner au Cercle de l'Union interalliée.
- La légende FR et EN dit « Relève du drapeau des États-Unis au cimetière de Picpus, 25 juin 2025 ».
- La date de création du fichier est le 25 juin 2025 à 09 h 35 UTC (`mdls`), alors que `2025-07-cercle-interallie-1` date du 2 juillet 2025.
- Dans la galerie, la photo est rangée entre `2025-06-picpus-4` et `2025-06-picpus-3`, et le numéro `2025-06-picpus-2` manque : ni fichier ni entrée de galerie. Le fichier a manifestement été mal nommé à l'import.

Correction : renommer le fichier en `2025-06-picpus-2.jpg`, qui comble le trou de numérotation. La liste Picpus reste dans l'ordre de la galerie. Le dîner du 2 juillet reste inchangé, ses deux photos étant correctes (EXIF du 2 juillet 2025, salon tapissé du Cercle).

## Corrections à appliquer (ordre d'exécution)

Règles communes : ne modifier aucun champ `update`, puisque `photos` n'est pas un changement substantiel. Ne toucher à aucun autre champ, ne pas reformater le YAML, garder les diffs minimaux. Garder le même ordre et les mêmes fichiers dans `phototheque.md` FR et EN.

- [ ] 1. **Picpus 2025 : renommer la photo mal nommée.**
      `2025-06-25` « Cérémonie au cimetière de Picpus ».
      - `git mv static/images/phototheque/2025-07-cercle-interallie-2.jpg static/images/phototheque/2025-06-picpus-2.jpg`
      - `content/fr/activites/phototheque.md` L68 et `content/en/activites/phototheque.md` L66 : remplacer `/images/phototheque/2025-07-cercle-interallie-2.jpg` par `/images/phototheque/2025-06-picpus-2.jpg`. Légendes et position inchangées.
      - `data/agenda.yaml` (événement L979, liste L988-991) :
        ```yaml
        # avant
            photos:
              - "2025-06-picpus-1"
              - "2025-06-picpus-4"
              - "2025-07-cercle-interallie-2"
              - "2025-06-picpus-3"
        # après
            photos:
              - "2025-06-picpus-1"
              - "2025-06-picpus-4"
              - "2025-06-picpus-2"
              - "2025-06-picpus-3"
        ```
      - `2025-07-02` « Dîner des membres d'Île-de-France au Cercle Interallié » : aucune modification (`2025-07-cercle-interallie-1`, `2025-07-cercle-interallie-diner`).
      - Aucune autre référence à `2025-07-cercle-interallie-2` dans le dépôt, hors `public/` (généré) et les notes `.agents/`. L'ancre `#photo-2025-07-cercle-interallie-2` disparaît au profit de `#photo-2025-06-picpus-2`, et le lien de l'agenda est recalculé au build.
      Files: `static/images/phototheque/2025-07-cercle-interallie-2.jpg` → `2025-06-picpus-2.jpg`, `content/fr/activites/phototheque.md`, `content/en/activites/phototheque.md`, `data/agenda.yaml`
      Verify: `make build-check CHECK_DIR=/tmp/sar-check` sans WARN. Dans `/tmp/sar-check/activites/phototheque/index.html`, `id="photo-2025-06-picpus-2"` porte `data-event="2025-06-25-ceremonie-au-cimetiere-de-picpus"` (même vérification en `/tmp/sar-check/en/activites/phototheque/`). Le lien 📷 de `/tmp/sar-check/activites/agenda-2025/index.html` vise toujours `#photo-2025-06-picpus-1`. Supprimer ensuite `/tmp/sar-check`.

- [ ] 2. **AG du 7 février 2025 : la photo de la tribune du Sénat est rattachée à la visite de la résidence.**
      `2025-02-06` « Visite de la résidence de l'ambassadeur des États-Unis à Paris » (L889, liste L897-899) et `2025-02-07` « Assemblée générale et dîner de SAR France au Palais du Luxembourg » (L901, liste L909-913).
      Preuve : `2025-02-ag-senat-assemblee.jpg` montre la tribune de l'AG au Sénat, avec le logo SÉNAT sur les murs, les drapeaux français et américain et une diapositive « Rapport moral » à l'écran. Le nom du fichier va dans le même sens. Seule la légende (« Visite de la résidence de l'ambassadeur des États-Unis, 6 février 2025 ») est fausse : elle est recopiée mot pour mot de la photo suivante, `2025-02-residence-ambassadeur-usa`, qui montre bien un groupe sous un lustre devant les drapeaux américain et européen, dans un salon de résidence. Le rattachement au 6 février vient d'une revue précédente qui s'était fiée à cette légende erronée.
      - `data/agenda.yaml`, 6 février :
        ```yaml
        # avant
            photos:
              - "2025-02-ag-senat-assemblee"
              - "2025-02-residence-ambassadeur-usa"
        # après
            photos:
              - "2025-02-residence-ambassadeur-usa"
        ```
      - `data/agenda.yaml`, 7 février. La photo est ajoutée en dernier, car c'est la cinquième du groupe AG dans la galerie (FR L95, après `2025-02-ag-senat-5`) :
        ```yaml
        # avant
            photos:
              - "2025-02-ag-diner-jeunes"
              - "2025-02-ag-diner-president"
              - "2025-02-ag-senat-salle-medicis"
              - "2025-02-ag-senat-5"
        # après
            photos:
              - "2025-02-ag-diner-jeunes"
              - "2025-02-ag-diner-president"
              - "2025-02-ag-senat-salle-medicis"
              - "2025-02-ag-senat-5"
              - "2025-02-ag-senat-assemblee"
        ```
      - Légende à corriger, sinon la photo mise en évidence pour l'AG resterait légendée « résidence de l'ambassadeur » :
        - FR L95-96 : `![La tribune de l'assemblée générale au Sénat, 7 février 2025](/images/phototheque/2025-02-ag-senat-assemblee.jpg)` puis `*La tribune de l'assemblée générale au Sénat, 7 février 2025*`
        - EN L93-94 : `![The rostrum of the general assembly at the Senate, February 7, 2025](/images/phototheque/2025-02-ag-senat-assemblee.jpg)` puis `*The rostrum of the general assembly at the Senate, February 7, 2025*`
      Files: `data/agenda.yaml`, `content/fr/activites/phototheque.md`, `content/en/activites/phototheque.md`
      Verify: `make build-check CHECK_DIR=/tmp/sar-check` sans WARN. `id="photo-2025-02-ag-senat-assemblee"` porte `data-event="2025-02-07-assemblee-generale-et-diner-de-sar-france-au-palais-du-luxembourg"` en FR et en EN. Le lien 📷 du 6 février vise `#photo-2025-02-residence-ambassadeur-usa`, celui du 7 février `#photo-2025-02-ag-diner-jeunes`.

- [ ] 3. **Dîner du 22 mars 2024 : deux photos oubliées.**
      `2024-03-22` « Dîner annuel de SAR France au Palais du Luxembourg » (L745, liste L753-755).
      Preuve : `2024-03-ag-hommage-franklin.png` (le Président avec des officiers américains, deux en tenue de soirée) et `2024-03-ag-president-ambassade.png` (réception dans des salons dorés aux tapisseries) montrent les salons du Palais du Luxembourg. Leur préfixe `2024-03-ag-` les rattache au 22 mars 2024, et elles sont rangées dans la galerie entre les deux photos déjà liées au dîner. L'AG du même jour se tenait dans une salle de cours de l'Institut Catholique, ce qui exclut qu'elles s'y rattachent. Elles ne sont liées à aucun événement aujourd'hui.
      ```yaml
      # avant
          photos:
            - "2024-03-ag-diner-luxembourg"
            - "2024-03-ag-palais-luxembourg"
      # après
          photos:
            - "2024-03-ag-diner-luxembourg"
            - "2024-03-ag-hommage-franklin"
            - "2024-03-ag-president-ambassade"
            - "2024-03-ag-palais-luxembourg"
      ```
      Ce changement reste valable quelle que soit l'issue de la décision D1 ci-dessous, qui ne concerne que `2024-03-ag-institut-catholique` et `2024-03-ag-palais-luxembourg`.
      Files: `data/agenda.yaml`
      Verify: `make build-check CHECK_DIR=/tmp/sar-check` sans WARN. Les vignettes `photo-2024-03-ag-hommage-franklin` et `photo-2024-03-ag-president-ambassade` portent `data-event="2024-03-22-diner-annuel-de-sar-france-au-palais-du-luxembourg"` en FR et en EN.

- [ ] 4. **Vérification finale.**
      `source .venv/bin/activate && python -c "import yaml; yaml.safe_load(open('data/agenda.yaml'))"`, qui reprend le contrôle YAML de la CI. Puis `make build-check CHECK_DIR=/tmp/sar-check` sans aucun WARN (pas de « rattachée à deux événements », pas de photo manquante). Compter les liens 📷 (`agenda-card-photos`) sur toutes les pages agenda FR et EN : 30 événements avant comme après, le nombre total de photos rattachées passant de 85 à 87. Contrôler par `git diff data/agenda.yaml` qu'aucune ligne `update:` n'a changé. Supprimer `/tmp/sar-check`.

## Décisions à prendre par un humain (ne pas appliquer sans réponse)

### D1. 22 mars 2024 : images de l'AG et du dîner inversées

`2024-03-ag-institut-catholique.png` (légende « Assemblée générale… à l'Institut Catholique de Paris », liée à l'AG) montre une table du dîner sous un lustre, dans les salons dorés du Luxembourg. À l'inverse, `2024-03-ag-palais-luxembourg.png` (légende « Palais du Luxembourg, 22 mars 2024 », liée au dîner) montre une salle de cours avec un crucifix et un écran de projection, c'est-à-dire l'AG à l'Institut Catholique. Le nom et la légende concordent entre eux, mais tous deux contredisent l'image, et la correction ne se limite pas à `agenda.yaml`.
- **Option A, recommandée** : échanger le nom des deux fichiers (`git mv` croisé via un nom temporaire). Les légendes et les listes `photos` deviennent alors justes sans autre modification, étape 3 comprise.
- Option B : laisser les fichiers et faire suivre les rattachements à l'image. L'AG reçoit `["2024-03-ag-palais-luxembourg"]`, le dîner `["2024-03-ag-institut-catholique", "2024-03-ag-diner-luxembourg", "2024-03-ag-hommage-franklin", "2024-03-ag-president-ambassade"]`. Il faut alors réécrire les deux légendes en FR et en EN, faute de quoi le lien de l'AG met en évidence une photo légendée « Palais du Luxembourg ».

### D2. Picpus 2018 et Picpus 2020 : une même photo sous deux noms

`2018-06-picpus-2.jpg` et `2020-07-picpus-2.jpg` sont identiques octet pour octet (même `md5`). La même image est donc rattachée à `2018-06-25` et à `2020-07-08`, et le `warnf` de `phototheque.html` ne le voit pas, puisqu'il compare les noms. L'image montre quatre officiers américains en grande tenue qui saluent, devant de nombreux drapeaux : cela s'accorde mal avec la cérémonie « en petit comité » de 2020, dont les autres photos ne montrent que des civils. Le plus probable est que la photo date de 2018.
- Recommandation : retirer `2020-07-picpus-2` de l'événement 2020, dont la liste devient `["2020-07-picpus-3", "2020-07-picpus-4", "2020-07-picpus-5", "2020-07-picpus-1"]`, avec `picpus-3` comme première photo de la section 2020. En option, supprimer le bloc correspondant de la galerie FR et EN, ainsi que le fichier doublon.
- Si la photo est en réalité de 2020, faire l'inverse et la retirer de 2018.

### D3. Spring Leadership Meeting 2026 : nom de fichier contredit par la légende

`2026-02-crossing-dan` est rattachée à `2026-03-05` « Spring leadership meeting de la NSSAR à Louisville (KY) ». Le nom évoque le Crossing of the Dan de février, la légende dit « Notre Trustee porte nos couleurs au Leadership Meeting, février 2026 ». L'image (garde au drapeau en tenue d'époque avec le drapeau français, dans une salle d'hôtel) et sa date de création (7 mars 2026) vont dans le sens du Leadership Meeting.
- Recommandation : **garder le rattachement actuel**. Le renommage du fichier et la correction du mois dans la légende sont facultatifs et sortent du cadre des listes `photos`.

### D4. Villeneuve-sur-Auvers, 27 mai 2025

`2025-05-villeneuve-sur-auvers` (« Cérémonie du souvenir à Villeneuve-sur-Auvers, 27 mai 2025 ») n'est liée à rien. Le seul événement proche est `2025-05-25` « Memorial Day », sans lieu, à deux jours d'écart. En 2024, en revanche, les photos de Villeneuve figurent dans l'événement Memorial Day.
- Soit l'ajouter au Memorial Day 2025. Comme elle précède les deux autres dans la galerie (FR L74), elle passerait en **tête** et deviendrait la cible du lien : `["2025-05-villeneuve-sur-auvers", "2025-05-memorial-day-suresnes", "2025-05-memorial-day-escadrille"]`.
- Soit créer un événement distinct, ce qui est un changement substantiel avec `update` à la date du jour.
- Soit ne rien faire. Recommandation : ne rien faire sans confirmation.

### D5. Avril 2024 : Omaha Beach et voyage du President General

`2024-04-omaha-beach` et `2024-04-scouts-omaha-beach` (20 avril 2024) tombent le dernier jour de `2024-04-06/2024-04-20` « Voyage en France du President General de la NSSAR », mais aucune légende ne mentionne le President General. `2024-04-drapeaux-sar-royal-deux-ponts` n'a pas de date. `2024-04-nato-parade-norfolk` se passe en Virginie et ne peut pas relever d'un voyage en France.
- Recommandation : ne rien rattacher sans confirmation. Si le lien est confirmé, la liste de cet événement serait `["2024-04-omaha-beach", "2024-04-scouts-omaha-beach"]`, dans l'ordre de la galerie, placée juste avant `update`.

## Constatées, sans changement de `photos`

- `2019-09-07` Sanary : les trois photos portent le préfixe `2019-08` et les légendes disent « août 2019 », alors que l'événement et les EXIF datent de septembre. Le rattachement est juste (c'est le seul événement Sanary) ; seules les légendes sont à revoir, hors du périmètre de cette tâche.
- `2020-07-08` Picpus : `2020-07-picpus-1` est rangée dans la section 2021 de la galerie et figure à juste titre en dernier dans la liste, conformément à la règle d'ordre.
- Photos sans événement correspondant dans l'agenda : il est impossible de leur ajouter un champ `photos`, et créer l'événement serait un changement substantiel. Sont concernées `2026-03-guilford-court-house-1/2`, `2026-03-tombe-lustrac-norfolk`, `2024-05-journee-resistance-grasse`, `2024-05-locaux-rue-bosquet`, `2024-02-le-ray-chaumont`, `2024-02-holker-grave-marking`, `2020-09-journee-de-grasse`, `2020-03-no-comment`, `2019-08-vaussieux-1/2/3`, `2019-07-morristown-green`, `2018-06-statues-yorktown` (Yorktown, hors du voyage en France), `2018-04-hermione-sete/-barre` et `2017-10-pershing-lafayette-1…4` (l'agenda commence en 2018).
- `2019-06-lafayette-regiment-virginia` montre un campement en plein air et non Picpus : il est justifié de l'avoir exclue de `2019-06-26`.
- Trois fichiers ne sont pas référencés dans la galerie et sont des doublons binaires de photos de 2024 : `2025-05-escadrille-lafayette.jpg`, `2025-05-suresnes.jpg`, `2025-05-villeneuve.jpg`. Ils n'ont aucun effet sur les liens. Leur nettoyage est hors du périmètre.

## Rattachements vérifiés et conservés

`2018-06-10/20` Voyage du Centenaire (10) ; `2018-06-25` Picpus (2, voir D2) ; `2019-06-26` Picpus (1) ; `2019-07-05/11` Costa Mesa (4) ; `2019-09-07` Sanary (3) ; `2019-10-02` Ravivage (2) ; `2020-03-06` École militaire (3) ; `2020-07-08` Picpus (5, voir D2) ; `2020-08-22/23` Vaussieux (3) ; `2021-10-18` Yorktown (2) ; `2022-07-05` Picpus (2) ; `2022-07-10/15` Savannah (1) ; `2022-10-05` Ravivage (3) ; `2024-03-22` AG (1, voir D1) ; `2024-05-25/26` Memorial Day (6) ; `2024-07-03` Picpus (4) ; `2024-09-07` Bataille des Caps (2) ; `2024-10-02` Ravivage (3) ; `2024-10-12/13` Bordelais (1) ; `2024-11-09` Dentzel (1) ; `2025-05-25` Memorial Day (2) ; `2025-07-02` Cercle Interallié (2) ; `2026-02-06` AG et dîner (2) ; `2026-03-05` Leadership Meeting (1, voir D3) ; `2026-06-20/22` Puy du Fou (4) ; `2026-09-30` Ravivage (3).
