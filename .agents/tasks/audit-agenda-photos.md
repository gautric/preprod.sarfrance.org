# Audit des rattachements agenda ↔ photothèque

Audit en lecture seule de l'arbre de travail au 2 octobre 2026 (HEAD `1b758ef`, modifications non committées sur `data/agenda.yaml`, `agenda.html`, `phototheque.html`, `phototheque.js`). Aucune correction n'a été appliquée.

## Réponse courte

Côté technique, le mécanisme est cohérent : le build Hugo passe sans WARN, il y a 30 liens « 📷 » en FR et 30 en EN, les 85 photos existent dans les deux langues, les ancres `photo-…` sont uniques et les valeurs `data-event` sont identiques en FR et en EN. Les incohérences viennent du **contenu**. Il y en a cinq qui touchent directement un lien posé :

1. **22 mars 2024** : les images `2024-03-ag-institut-catholique.png` et `2024-03-ag-palais-luxembourg.png` sont inversées. La première montre le dîner au Luxembourg, la seconde l'AG dans une salle de cours de l'Institut Catholique (crucifix au mur). Chaque événement reçoit donc une photo de l'autre. Deux autres photos du dîner ne sont rattachées à rien.
2. **Picpus 2018 / Picpus 2020** : `2018-06-picpus-2.jpg` et `2020-07-picpus-2.jpg` sont **le même fichier**, octet pour octet. La même photo est donc liée à deux cérémonies, et le contrôle `warnf` « photo rattachée à deux événements » ne la détecte pas, puisque les noms diffèrent.
3. **7 février 2025** : `2025-02-ag-senat-assemblee.jpg` montre bien l'AG au Sénat (logo SÉNAT, diapositive « Rapport moral »). Le rattachement à l'AG est **juste**, contrairement au plan (n° 22), mais la légende FR/EN « Visite de la résidence de l'ambassadeur, 6 février 2025 » est fausse. Cette photo est en outre placée en tête de la liste `photos`, alors qu'elle est affichée en dernier.
4. **Sanary 2019** : selon les EXIF, les photos ont été prises les 7 et 8 septembre 2019. L'agenda (7 septembre) a raison ; les légendes « août 2019 » sont fausses.
5. **Spring Leadership Meeting 2026** : la photo date du 7 mars 2026 (EXIF). Le rattachement est juste, mais la légende « février 2026 » est fausse et l'événement est daté d'un seul jour (`2026-03-05`).

S'y ajoutent des événements qui ont des photos mais pas d'entrée dans l'agenda (Crossing of the Dan et Guilford Court House 2026, Vaussieux 2019, Grasse 2020, Villeneuve-sur-Auvers 2025), deux doublons probables dans l'agenda (Chesapeake 2024, résidence de l'ambassadeur 2025) et quelques anomalies mineures.

## Méthode

- Lecture de `data/agenda.yaml` (169 événements), de `content/{fr,en}/activites/phototheque.md` (114 références chacun, même ordre), de `phototheque.html` et `agenda.html`, et des `git diff`. Le thème n'est pas un sous-module : `git -C themes/sarfrance diff` renvoie le diff du dépôt principal.
- Script Python (venv) de croisement : liste `photos` ↔ galerie, section d'année ↔ nom de fichier, ordre d'affichage ↔ premier élément de la liste, photos non rattachées.
- Build `hugo --minify` dans `/tmp`, puis comparaison des `href ?event=…#photo-…` de toutes les pages agenda avec les `id` et `data-event` de la photothèque, en FR et en EN. Le répertoire temporaire a été supprimé ensuite.
- Dates de prise de vue lues avec `mdls` (`kMDItemContentCreationDate`). `exiftool` n'est pas installé. Quand la date affichée est le 6 mai ou le 19 août 2026 (dates d'import ou de conversion), le fichier n'a plus d'EXIF et la date n'est pas exploitable.
- `md5` de tous les fichiers pour repérer les doublons.
- Examen visuel des images ambiguës (Picpus 2018/2020, AG 2024 et 2025, Leadership 2026, Guilford, Memorial Day 2024, Picpus 2025, Ravivage 2026).

## Incohérences constatées et corrections proposées

Les numéros de ligne renvoient à l'arbre de travail (`data/agenda.yaml` : ligne du `- date:` de l'événement ; `phototheque.md` : version FR. En EN, la ligne correspondante est environ 2 lignes plus haut, faute de bloc `aliases`).

### I-1. 22 mars 2024 : photos de l'AG et du dîner inversées (sévérité **élevée**)

- Événements : `2024-03-22` « Assemblée générale de SAR France à l'Institut Catholique de Paris » (L734, `photos` L742-743) et `2024-03-22` « Dîner annuel de SAR France au Palais du Luxembourg » (L745, `photos` L753-755).
- Ce que montrent réellement les images :

  | Fichier | Légende actuelle (FR L172-185) | Contenu réel |
  |---|---|---|
  | `2024-03-ag-institut-catholique.png` | AG à l'Institut Catholique | Table du dîner, salons dorés du Luxembourg |
  | `2024-03-ag-diner-luxembourg.png` | Dîner au Palais du Luxembourg | Allocution au pupitre, drapeaux FR/US/UE, salon doré (dîner) |
  | `2024-03-ag-hommage-franklin.png` | Hommage à Benjamin Franklin | Le Président avec deux officiers américains et trois invitées (dîner) |
  | `2024-03-ag-president-ambassade.png` | Le Président et les représentants de l'ambassade | Foule pendant la réception dans les salons (dîner) |
  | `2024-03-ag-palais-luxembourg.png` | Palais du Luxembourg, 22 mars 2024 | Salle de cours avec crucifix et projection : **l'AG à l'Institut Catholique** |

- Conséquence : le lien de l'AG met en évidence une photo du dîner, celui du dîner une photo de l'AG, et deux photos du dîner restent sans lien.
- Côté fautif : la **photothèque** (légendes) et, par voie de conséquence, l'**agenda** (listes `photos`).
- Correction proposée. Le contenu fait foi, les noms de fichiers restent inchangés pour préserver les identifiants :
  - `data/agenda.yaml`, AG (L742-743) :
    ```yaml
        photos:
          - "2024-03-ag-palais-luxembourg"
    ```
  - `data/agenda.yaml`, dîner (L753-755) :
    ```yaml
        photos:
          - "2024-03-ag-institut-catholique"
          - "2024-03-ag-diner-luxembourg"
          - "2024-03-ag-hommage-franklin"
          - "2024-03-ag-president-ambassade"
    ```
  - `content/fr/activites/phototheque.md` L172-185 (même ordre en EN) : placer d'abord le bloc de l'AG, puis ceux du dîner.
    ```markdown
    ![Assemblée générale du 22 mars 2024 à l'Institut Catholique de Paris](/images/phototheque/2024-03-ag-palais-luxembourg.png)
    *Assemblée générale du 22 mars 2024 à l'Institut Catholique de Paris*

    ![Dîner du 22 mars 2024 au Palais du Luxembourg](/images/phototheque/2024-03-ag-institut-catholique.png)
    *Dîner du 22 mars 2024 au Palais du Luxembourg*

    ![Allocution lors du dîner du 22 mars 2024 au Palais du Luxembourg](/images/phototheque/2024-03-ag-diner-luxembourg.png)
    *Allocution lors du dîner du 22 mars 2024 au Palais du Luxembourg*

    ![Le Président et les représentants de l'ambassade des États-Unis, 22 mars 2024](/images/phototheque/2024-03-ag-hommage-franklin.png)
    *Le Président et les représentants de l'ambassade des États-Unis, 22 mars 2024*

    ![Réception dans les salons du Palais du Luxembourg, 22 mars 2024](/images/phototheque/2024-03-ag-president-ambassade.png)
    *Réception dans les salons du Palais du Luxembourg, 22 mars 2024*
    ```
    EN : « General assembly of March 22, 2024 at the Institut Catholique de Paris » ; « Dinner of March 22, 2024 at the Palais du Luxembourg » ; « Address during the dinner of March 22, 2024 at the Palais du Luxembourg » ; « The President and the representatives of the United States Embassy, March 22, 2024 » ; « Reception in the salons of the Palais du Luxembourg, March 22, 2024 ».
  - À confirmer avec vous : si l'allocution au pupitre est l'« Hommage à Benjamin Franklin », reprendre cette légende pour `2024-03-ag-diner-luxembourg`.
  - Facultatif : renommer les fichiers (`git mv`) pour que les noms correspondent au contenu. Il faudrait alors mettre à jour les deux `phototheque.md` et les listes `photos`.

### I-2. Une même photo rattachée à Picpus 2018 et à Picpus 2020 (sévérité **élevée**)

- Événements : `2018-06-25` « Cérémonie au cimetière de Picpus en présence de l'ambassadeur des États-Unis » (L48, `photos` L56-58) et `2020-07-08` « Cérémonie au cimetière de Picpus sur la tombe de La Fayette (en petit comité) » (L331, `photos` L339-344).
- Preuve : `2018-06-picpus-2.jpg` et `2020-07-picpus-2.jpg` ont le même md5 (`41e2f8f4…`). Ils sont présents depuis le commit d'import `c2211b4`. La photo (salut militaire de quatre officiers américains en grande tenue, nombreux drapeaux) est très probablement de 2018 :
  - Les quatre autres photos de 2020 (EXIF du 8 juillet 2020) ne montrent que des civils, et du gel hydroalcoolique sur `2020-07-picpus-5`, ce qui correspond à la cérémonie « en petit comité » de la période Covid.
  - `2018-06-picpus-1` montre une garde d'honneur américaine et un officier à aiguillette dorée qui ressemble à celui de la photo litigieuse.
  - Les deux copies sont au format 1200×800 sans EXIF, contrairement aux photos de 2020 prises au téléphone.
- Conséquence : le lien 📷 de 2020 défile jusqu'à une photo de 2018 (c'est la cible `#photo-2020-07-picpus-2`), et le doublon échappe au `warnf` de `phototheque.html`.
- Côté fautif : la **photothèque** (photo de 2018 republiée sous le nom 2020) et l'**agenda** 2020.
- Correction proposée :
  - `phototheque.md` FR et EN : supprimer le bloc `2020-07-picpus-2` (FR L238-239) ; déplacer le bloc `2020-07-picpus-1` de la section `## 2021` (FR L215-216) en tête de la section `## 2020`, juste avant `2020-07-picpus-3`, avec la légende « Cérémonie au cimetière de Picpus, 8 juillet 2020 » / « Ceremony at Picpus Cemetery, July 8, 2020 ».
  - `data/agenda.yaml` L339-344 :
    ```yaml
        photos:
          - "2020-07-picpus-1"
          - "2020-07-picpus-3"
          - "2020-07-picpus-4"
          - "2020-07-picpus-5"
    ```
  - Facultatif : `git rm static/images/phototheque/2020-07-picpus-2.jpg`. La phrase de `.kiro/steering/structure.md` citant `2020-07-picpus-1` « shown in the 2021 section » serait alors à actualiser.
  - Si vous savez que cette photo est de 2020, faire l'inverse : la retirer de 2018 (FR L349-350 et `photos` L58).

### I-3. AG du 7 février 2025 : légende fausse et ordre de la liste (sévérité **moyenne**)

- Événements : `2025-02-07` « Assemblée générale et dîner de SAR France au Palais du Luxembourg » (L900, `photos` L908-913) et `2025-02-06` « Visite de la résidence de l'ambassadeur des États-Unis à Paris » (L889).
- Preuve : `2025-02-ag-senat-assemblee.jpg` montre la tribune de l'AG au Sénat (logo SÉNAT, diapositive « Rapport moral ») et se rapproche de `2025-02-ag-senat-5.jpg`, la salle vue de la tribune. Sa légende FR L95-96 (et EN) dit pourtant « Visite de la résidence de l'ambassadeur des États-Unis, 6 février 2025 ». La seule vraie photo de la résidence est `2025-02-residence-ambassadeur-usa.jpg`, un groupe sous le lustre devant les drapeaux. Le rattachement actuel à l'AG est correct ; le tableau n° 22 du plan, qui se fiait à la légende, était faux.
- Second problème : la liste `photos` commence par `2025-02-ag-senat-assemblee`, qui est la **dernière** photo de l'AG dans la galerie. Cela contredit la règle documentée (« the first item is the scroll target, so list first the photo shown first »). La page défile jusqu'au bas du groupe, et les quatre autres photos mises en évidence se retrouvent au-dessus de la zone visible.
- Côté fautif : la **photothèque** (légende) et l'**agenda** (ordre).
- Correction proposée :
  - `phototheque.md` FR L95-96 :
    ```markdown
    ![La tribune de l'assemblée générale au Sénat, 7 février 2025](/images/phototheque/2025-02-ag-senat-assemblee.jpg)
    *La tribune de l'assemblée générale au Sénat, 7 février 2025*
    ```
    EN : « The rostrum of the general assembly at the Senate, February 7, 2025 ».
  - `data/agenda.yaml` L908-913 :
    ```yaml
        photos:
          - "2025-02-ag-diner-jeunes"
          - "2025-02-ag-diner-president"
          - "2025-02-ag-senat-salle-medicis"
          - "2025-02-ag-senat-5"
          - "2025-02-ag-senat-assemblee"
    ```

### I-4. Sanary 2019 : légendes datées d'août au lieu de septembre (sévérité **moyenne**)

- Événement : `2019-09-07` « Vernissage de l'exposition de Sanary sur les marins et la guerre d'indépendance » (L219).
- Preuve : EXIF du 7 septembre 2019 (`-2`, `-3`) et du 8 septembre 2019 (`-1`). Les légendes FR L275-282 et EN indiquent « août 2019 » / « August 2019 », et les noms de fichiers portent `2019-08`.
- Côté fautif : la **photothèque**. L'agenda est juste.
- Correction proposée : dans les trois blocs, remplacer « Vernissage de l'exposition de Sanary, août 2019 » par « Vernissage de l'exposition de Sanary, 7 septembre 2019 », et en EN « Opening of the Sanary exhibition, September 7, 2019 ». Renommer les fichiers en `2019-09-…` est facultatif ; il faudrait alors mettre à jour la liste `photos` L227-230.

### I-5. Spring Leadership Meeting 2026 : légende en février, événement sur un seul jour (sévérité **moyenne**)

- Événement : `2026-03-05` « Spring leadership meeting de la NSSAR à Louisville (KY) » (L1111, `photos` L1119-1120).
- Preuve : la photo `2026-02-crossing-dan.jpg` (garde au drapeau tenant le drapeau français, salle d'hôtel) date du **7 mars 2026** (EXIF). Sa légende dit « Leadership Meeting, février 2026 » (FR L45-46, EN idem). La [brochure NSSAR du printemps 2026](https://www.sar.org/app/uploads/E-packet-SPRING-2026.pdf), d'après l'extrait du moteur de recherche, mentionne des activités le vendredi 6 mars 2026. La réunion couvre donc plusieurs jours, alors que l'agenda n'en retient qu'un. Le nom de fichier `crossing-dan` est trompeur : c'est `2026-03-guilford-court-house-1.jpg` qui montre le « Crossing of the Dan ».
- Côté fautif : la **photothèque** (légende) et l'**agenda** (date).
- Correction proposée :
  - `phototheque.md` : « Notre Trustee porte nos couleurs au Leadership Meeting, mars 2026 » / EN « … at the Leadership Meeting, March 2026 ».
  - `data/agenda.yaml` L1111 : `date: "2026-03-05/2026-03-07"`, après vérification dans la brochure. C'est un changement substantiel : passer `update` à la date du jour. L'identifiant de l'événement change, mais le lien et `data-event` sont recalculés automatiquement.
  - Facultatif : renommer `2026-02-crossing-dan.jpg` en `2026-03-leadership-meeting.jpg`, et `2026-03-guilford-court-house-1.jpg` en `2026-02-crossing-dan.jpg`, après avoir libéré ce nom.

### I-6. Photos d'événements absents de l'agenda (sévérité **moyenne à faible**)

Ces photos ne peuvent pas recevoir de lien tant que l'événement n'existe pas dans l'agenda. Pour chacun, il s'agit de créer l'entrée dans `data/agenda.yaml`, triée chronologiquement, avec `update` à la date du jour.

| Photos | Preuve | Proposition |
|---|---|---|
| `2026-03-guilford-court-house-1` (légende : « Crossing of the Dan », South Boston (VA), 12-14 février 2026) | Trois reconstituteurs devant un drapeau à 13 étoiles | Nouvel événement `"2026-02-12/2026-02-14"`, « 245e anniversaire du Crossing of the Dan à South Boston (Virginie) », type `commémoration`, location « South Boston, Virginie », lat 36.6985, lon -78.9014 (à vérifier), `photos: ["2026-03-guilford-court-house-1"]` |
| `2026-03-guilford-court-house-2` | Gerbe « S.A.R. France » devant le monument Nathanael Greene, Guilford Courthouse National Military Park. La légende donne la date de la bataille (15 mars 1781) et non celle de la commémoration | Nouvel événement en mars 2026 (date exacte à confirmer, vraisemblablement le 14 ou le 15 mars), « 245e commémoration de la bataille de Guilford Court House », location « Guilford Courthouse National Military Park, Greensboro (NC) », lat 36.1316, lon -79.8467 (à vérifier). Légende à corriger : « 245e commémoration de la bataille de Guilford Court House (15 mars 1781), mars 2026 » / EN « 245th commemoration of the Battle of Guilford Court House (March 15, 1781), March 2026 » |
| `2019-08-vaussieux-1/2/3` | EXIF des 17 et 18 août 2019. Pas d'événement en 2019, alors que l'agenda 2020 parle de « 3e édition ». `vaussieux-3` (FR L302) est séparée de `-1/-2` (FR L263-268) | Nouvel événement `"2019-08-17/2019-08-18"`, « 2e édition de la reconstitution du camp de Vaussieux (Calvados) » (numéro à confirmer), mêmes location et lat/lon que L346. Déplacer le bloc `2019-08-vaussieux-3` juste après `-2` dans les deux langues |
| `2020-09-journee-de-grasse` (27 septembre 2020) | Aucun événement à Grasse en 2020. Il en existe un en 2021 (L407) et en 2024 (L828) | Nouvel événement `"2020-09-27"`, « Journée franco-américaine à Grasse », location « Grasse », lat 43.6589, lon 6.9239 |
| `2025-05-villeneuve-sur-auvers` (27 mai 2025) | Hors de la date du Memorial Day 2025. L'agenda 2026 traite cette cérémonie comme un événement distinct (L1248) | Nouvel événement `"2025-05-27"`, « Cérémonie du Souvenir au Mémorial du Cimetière Américain », location « Villeneuve-sur-Auvers », lat 48.2809, lon 2.156 |
| `2024-04-omaha-beach`, `2024-04-scouts-omaha-beach` (20 avril 2024) | Dernier jour du « Voyage en France du President General » (L757, `2024-04-06/2024-04-20`), mais aucune légende ne cite le President General | À trancher par vous. Si c'est bien une étape du voyage, ajouter ces deux photos dans `photos` à L757 |

### I-7. Memorial Day 2025 : date trop courte et champs manquants (sévérité **faible**)

- Événement : `2025-05-25` « Memorial Day » (L963), sans `location`, `lat` ni `lon`.
- Preuve : les deux photos rattachées datent du 25 mai (Suresnes) et du **26 mai** (Marnes-la-Coquette), selon leurs légendes.
- Correction (agenda) :
  ```yaml
    - date: "2025-05-25/2025-05-26"
      title: "Memorial Day"
      type: commémoration
      description: "Cérémonies du Memorial Day à Suresnes et à Marnes-la-Coquette."
      location: "Cimetière américain de Suresnes et Mémorial de l'Escadrille La Fayette à Marnes-la-Coquette"
      link: ""
      lat: 48.8723
      lon: 2.2177
      photos: …   # inchangé
      update: "<date du jour>"
  ```
  Ce modèle reprend l'entrée `2026-05-24` (L1221).

### I-8. `2018-06-statues-yorktown` en double, au milieu de l'album 2018 (sévérité **faible**)

- Preuve : la photo est référencée deux fois (FR L284 en section 2019, FR L340 en section 2018). Elle montre Yorktown (États-Unis), alors que le Voyage du Centenaire (L33) se déroule en France. Placée entre `puy-du-fou-3` et `romagne-montfaucon`, elle forme une vignette non surlignée au milieu des dix photos mises en évidence du voyage.
- Correction (photothèque) : supprimer l'occurrence de la section 2018 (FR L340-341, EN idem). L'`id` `photo-2018-06-statues-yorktown` reste porté par la première occurrence, celle de la section 2019, qui est rendue en premier.

### I-9. Doublons probables dans l'agenda (sévérité **moyenne**, à confirmer)

- `2024-09-05` « 242e anniversaire de la bataille de Chesapeake par la Marine Nationale » (L817) et `2024-09-07` « 243e anniversaire de la Bataille des Caps en Virginie » (L821, avec photos). C'est la même bataille (5 septembre 1781) : en 2024, il s'agit du **243e** anniversaire, donc « 242e » est faux. La légende de la photo `2024-09-bataille-caps-marine` mentionne justement « avec la participation de la Marine nationale », et les EXIF datent du 7 septembre 2024. Correction proposée : supprimer le bloc L817-820 et compléter L821, par exemple avec `description: "Commémoration en Virginie avec la participation de la Marine nationale."`. Si ce sont bien deux cérémonies distinctes, corriger au moins « 242e » en « 243e » dans L818.
- `2025-03-20` « Visite de la résidence de l'ambassadeur des États-Unis à Paris » (L936) et `2025-02-06` (L889, avec photo) ont le même titre et le même lieu. Les deux proviennent de l'import initial (`f6e69e2`), sans autre source. Les photos ne justifient que le 6 février. Si la visite du 20 mars n'a pas eu lieu, supprimer L936-944.

### I-10. Anomalies mineures de la photothèque, sans effet sur les liens (sévérité **faible**)

- Doublons orphelins, identiques octet pour octet et non référencés : `2025-05-escadrille-lafayette.jpg` = `2024-05-suresnes-memorial-day.jpg` (l'image montre Suresnes, pas l'Escadrille), `2025-05-suresnes.jpg` = `2024-05-villeneuve-senateur.jpg`, `2025-05-villeneuve.jpg` = `2024-05-villeneuve-ambassade.jpg`. Proposition : `git rm` de ces trois fichiers.
- Dates de prise de vue en contradiction avec le nom ou la section : `2018-04-hermione-sete/-barre` (EXIF 27-28 mars 2018, légende « avril 2018 ») ; `2024-02-holker-grave-marking` (EXIF 2 avril 2022, rangée en 2024) ; `2026-03-tombe-lustrac-norfolk` (EXIF 11 juillet 2025, rangée en 2026) ; `2019-07-morristown-green` (EXIF 17 août 2019). À vérifier auprès des auteurs, car l'horloge de l'appareil peut être fausse.
- `2019-06-lafayette-regiment-virginia` montre un campement en plein air, pas Picpus : l'avoir exclue de Picpus 2019 est justifié.

### I-11. Incohérences internes de `data/agenda.yaml` (sévérité **faible**)

- Ordre chronologique rompu. Le template parcourt les événements dans l'ordre du fichier, donc ces cartes s'affichent dans le désordre sur `agenda-2026` :
  - `2026-06-14T15:00:00` (L1257) est placé avant `2026-06-13T15:00:00` (L1266) ;
  - `2026-09-07T18:00:00` « Commémoration de la Chesapeake » (L1343) est placé après `2026-09-17T18:00:00` (L1334).

  Correction : remonter les blocs L1266 et L1343 à leur place.
- `2022-07-02` « 240e anniversaire de la victoire de Yorktown à Rochambeau » (L499) : en juillet 2022, c'est le 241e anniversaire (le 240e tombait en octobre 2021). Numéro et intitulé à vérifier.
- `2024-05-25/2024-05-26` Memorial Day (L774) et `2024-09-07` Bataille des Caps (L821) n'ont ni `location` ni `lat`/`lon`, contrairement à la règle des champs étendus. Les photos situent Suresnes, Villeneuve-sur-Auvers et Draguignan pour le premier, la Virginie pour le second.

## Tableau récapitulatif

| # | Événement (ligne) | Photos | Côté fautif | Sévérité | Correction |
|---|---|---|---|---|---|
| I-1 | 2024-03-22 AG (L734) et dîner (L745) | `2024-03-ag-*` (5) | Photothèque + agenda | Élevée | Corriger les légendes ; AG → `ag-palais-luxembourg` ; dîner → 4 photos |
| I-2 | 2018-06-25 (L48) et 2020-07-08 (L331) | `2018-06-picpus-2` ≡ `2020-07-picpus-2` | Photothèque + agenda | Élevée | Retirer `2020-07-picpus-2` ; déplacer `2020-07-picpus-1` en section 2020, en tête |
| I-3 | 2025-02-07 (L900) | `2025-02-ag-senat-assemblee` | Photothèque (légende) + agenda (ordre) | Moyenne | Légende « tribune de l'AG au Sénat » ; mettre `ag-diner-jeunes` en tête |
| I-4 | 2019-09-07 (L219) | `2019-08-sanary-exposition-1/2/3` | Photothèque | Moyenne | « août 2019 » → « 7 septembre 2019 » (FR/EN) |
| I-5 | 2026-03-05 (L1111) | `2026-02-crossing-dan` | Photothèque + agenda | Moyenne | Légende « mars 2026 » ; date `2026-03-05/2026-03-07` |
| I-6 | Absents de l'agenda | Guilford 1 et 2, Vaussieux 2019, Grasse 2020, Villeneuve 2025, (Omaha 2024) | Agenda | Moyenne à faible | Créer 5 événements (6 avec Omaha si confirmé) ; regrouper `vaussieux-3` |
| I-7 | 2025-05-25 (L963) | `2025-05-memorial-day-*` | Agenda | Faible | Intervalle `25/26` + lieu et coordonnées |
| I-8 | 2018-06-10/20 (L33) | `2018-06-statues-yorktown` | Photothèque | Faible | Supprimer l'occurrence de la section 2018 |
| I-9 | 2024-09-05 (L817), 2025-03-20 (L936) | (sans photo) | Agenda | Moyenne | Fusionner ou supprimer les doublons ; « 242e » → « 243e » |
| I-10 | (aucun) | 3 orphelins 2025-05, dates EXIF | Photothèque | Faible | `git rm` des orphelins ; vérifier les dates |
| I-11 | L1257/L1266, L1334/L1343, L499 | (sans photo) | Agenda | Faible | Rétablir l'ordre chronologique ; vérifier le numéro d'anniversaire |

## Rattachements vérifiés et corrects

Pour chaque rattachement, la légende ou les EXIF concordent avec la date et le lieu de l'événement, et l'image a été examinée quand le doute était permis :

- `2018-06-10/2018-06-20` Voyage du Centenaire : 10 photos (EXIF Puy du Fou 16 juin, Colleville 18 juin). Seule réserve : I-8.
- `2018-06-25` Picpus : `picpus-1`, `picpus-2` (voir I-2 pour la copie de 2020).
- `2019-06-26` Picpus : `picpus-lafayette` (EXIF 26 juin 2019).
- `2019-07-05/2019-07-11` Costa Mesa : 4 photos (EXIF 7 et 10 juillet).
- `2019-09-07` Sanary : rattachement correct (seules les légendes sont fausses, voir I-4).
- `2019-10-02` Ravivage : 2 photos.
- `2020-03-06` AG et dîner à l'École militaire : 3 photos.
- `2020-07-08` Picpus : `picpus-1/3/4/5` (EXIF 8 juillet 2020). Ne pas garder `picpus-2` (I-2).
- `2020-08-22/2020-08-23` Vaussieux : 3 photos (EXIF 22 août 2020).
- `2021-10-18` Yorktown : 2 photos.
- `2022-07-05` Picpus : 2 photos (EXIF 5 juillet 2022).
- `2022-07-10/2022-07-15` Savannah : `grave-marking-savannah` (EXIF 10 juillet 2022).
- `2022-10-05` Ravivage avec les CAR : 3 photos.
- `2024-05-25/2024-05-26` Memorial Day : 6 photos. Suresnes est vérifiée visuellement, Villeneuve-sur-Auvers l'est par la banderole MACVA91.
- `2024-07-03` Picpus : 4 photos.
- `2024-09-07` Bataille des Caps : 2 photos (EXIF 7 septembre 2024).
- `2024-10-02` Ravivage : 3 photos.
- `2024-10-12/2024-10-13` Bordelais : 1 photo.
- `2024-11-09` Dentzel à Versailles : 1 photo.
- `2025-02-06` Résidence de l'ambassadeur : `residence-ambassadeur-usa`.
- `2025-02-07` AG et dîner : 5 photos (EXIF 7 février). Légende et ordre à corriger (I-3).
- `2025-05-25` Memorial Day : 2 photos (date à élargir, I-7).
- `2025-06-25` Picpus : 4 photos. `2025-07-cercle-interallie-2` montre bien la relève du drapeau à Picpus, malgré son nom.
- `2025-07-02` Cercle Interallié : 2 photos (EXIF 2 juillet 2025).
- `2026-02-06T18:00:00` AG et dîner : 2 photos (EXIF 6 février 2026).
- `2026-03-05` Spring Leadership Meeting : `2026-02-crossing-dan` (EXIF 7 mars 2026). Légende et date à corriger (I-5).
- `2026-06-20/2026-06-22` Centenaire au Puy du Fou : 4 photos.
- `2026-09-30T18:30:00` Ravivage de la Flamme : 3 photos datées du 30 septembre. Elles ne relèvent pas de la commémoration de la Chesapeake du 7 septembre.

## Recommandations

1. Appliquer d'abord I-1, I-2 et I-3. Ce sont les seules erreurs qui faussent un lien ou une mise en évidence aujourd'hui. Toutes se corrigent dans `data/agenda.yaml` et les deux `phototheque.md` ; aucun template n'est touché.
2. Trancher avec vous les questions ouvertes : origine de la photo `picpus-2` (I-2), Omaha Beach et le voyage du President General (I-6), doublons Chesapeake et résidence (I-9).
3. Pour fiabiliser le contrôle au build, envisager de comparer aussi le contenu des fichiers. Un `warnf` lorsque deux fichiers référencés dans les listes `photos` ont le même hash (`md5` via `resources.Get` n'est pas disponible depuis `static/`, mais `readFile` + `md5` l'est) aurait détecté I-2.
4. Après correction, relancer `make build-check` et vérifier l'absence de WARN ainsi que les 30 liens (ou plus) en FR et en EN.
