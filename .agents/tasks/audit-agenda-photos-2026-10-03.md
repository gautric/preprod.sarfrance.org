# Audit des listes `photos` de `data/agenda.yaml` — 3 octobre 2026

Première itération (pas de `agenda-photos-review.json`). Application des étapes 1 à 3 de `agenda-photos-audit-plan.md`. Aucun champ `update` n'a été modifié et rien n'a été commité.

## Le cas signalé : Picpus (25 juin 2025) et Cercle Interallié (2 juillet 2025)

Le brief demandait de déplacer `2025-07-cercle-interallie-2` vers le dîner du Cercle Interallié, après vérification dans la galerie. La vérification contredit ce déplacement :

- la légende FR (L68) et EN (L66) dit « Relève du drapeau des États-Unis au cimetière de Picpus, 25 juin 2025 » ;
- dans la section 2025, la photo est rangée entre `2025-06-picpus-4` et `2025-06-picpus-3` ;
- l'image (examinée) montre le mur de Picpus, la plaque « Adrienne de N… Marquise de La… / Les Fils de la Révolution… » et une garde américaine qui replie un drapeau. Rien ne rappelle un dîner ;
- `2025-06-picpus-2` n'existe ni dans `static/` ni dans la galerie : la numérotation présente un trou.

L'incohérence vient du nom du fichier, pas du rattachement. Le fichier a donc été renommé (`git mv`) en `2025-06-picpus-2.jpg`, et la référence mise à jour en FR et en EN. Le dîner du 2 juillet garde ses deux photos, qui sont correctes.

## Corrections appliquées

### 1. `2025-06-25` « Cérémonie au cimetière de Picpus »

Fichier `static/images/phototheque/2025-07-cercle-interallie-2.jpg` renommé en `2025-06-picpus-2.jpg`. Le chemin de l'image a été changé dans `content/fr/activites/phototheque.md` et `content/en/activites/phototheque.md`, sans toucher aux légendes ni à la position.

- Avant : `["2025-06-picpus-1", "2025-06-picpus-4", "2025-07-cercle-interallie-2", "2025-06-picpus-3"]`
- Après : `["2025-06-picpus-1", "2025-06-picpus-4", "2025-06-picpus-2", "2025-06-picpus-3"]`

`2025-07-02` « Dîner des membres d'Île-de-France au Cercle Interallié » : inchangé (`["2025-07-cercle-interallie-1", "2025-07-cercle-interallie-diner"]`).

### 2. `2025-02-06` « Visite de la résidence de l'ambassadeur des États-Unis à Paris » et `2025-02-07` « Assemblée générale et dîner de SAR France au Palais du Luxembourg »

`2025-02-ag-senat-assemblee` montre la tribune de l'AG au Sénat (logos SÉNAT, drapeaux, écran de présentation), ce que confirme son nom. Sa légende « résidence de l'ambassadeur, 6 février 2025 » était recopiée de la photo suivante.

- 6 février, avant : `["2025-02-ag-senat-assemblee", "2025-02-residence-ambassadeur-usa"]`, après : `["2025-02-residence-ambassadeur-usa"]`
- 7 février, avant : `["2025-02-ag-diner-jeunes", "2025-02-ag-diner-president", "2025-02-ag-senat-salle-medicis", "2025-02-ag-senat-5"]`, après : la même liste suivie de `"2025-02-ag-senat-assemblee"`, ajoutée en dernier selon l'ordre de la galerie.
- Légendes corrigées (texte alternatif et légende) : FR « La tribune de l'assemblée générale au Sénat, 7 février 2025 », EN « The rostrum of the general assembly at the Senate, February 7, 2025 ».

### 3. `2024-03-22` « Dîner annuel de SAR France au Palais du Luxembourg »

`2024-03-ag-hommage-franklin` et `2024-03-ag-president-ambassade` (examinées) montrent les salons dorés du Luxembourg. Elles sont rangées dans la galerie entre les deux photos du dîner et n'étaient rattachées à aucun événement.

- Avant : `["2024-03-ag-diner-luxembourg", "2024-03-ag-palais-luxembourg"]`
- Après : `["2024-03-ag-diner-luxembourg", "2024-03-ag-hommage-franklin", "2024-03-ag-president-ambassade", "2024-03-ag-palais-luxembourg"]`

### Contrôles sur l'ensemble des événements

Un script temporaire a croisé chaque liste `photos` avec les deux galeries, avant et après les corrections. Il ne relève aucune photo pendante, aucune photo listée sous deux événements, aucun ordre fautif et aucun `photos` mal placé. Après correction : 30 événements avec photos, 87 photos rattachées (contre 85 avant).

## Questions ouvertes, à trancher par un humain (rien n'a été appliqué)

- **D1, 22 mars 2024, images de l'AG et du dîner inversées.** `2024-03-ag-institut-catholique` (rattachée à l'AG) montre une table de dîner au Luxembourg. `2024-03-ag-palais-luxembourg` (rattachée au dîner) montre une salle de cours, sans doute l'Institut Catholique. Deux options : échanger les noms des deux fichiers (option recommandée), ou modifier les rattachements et réécrire les légendes FR et EN.
- **D2, même image pour Picpus 2018 et Picpus 2020.** `2018-06-picpus-2.jpg` et `2020-07-picpus-2.jpg` ont le même `md5`. Le `warnf` ne le voit pas, puisqu'il compare les noms. Les officiers en grande tenue suggèrent 2018. Recommandation : retirer `2020-07-picpus-2` de l'événement `2020-07-08`, qui deviendrait `["2020-07-picpus-3", "2020-07-picpus-4", "2020-07-picpus-5", "2020-07-picpus-1"]`.
- **D3, `2026-02-crossing-dan` rattachée au Leadership Meeting du `2026-03-05`.** Le nom évoque le Crossing of the Dan, mais la légende et l'image correspondent au Leadership Meeting. Recommandation : garder le rattachement. Renommer le fichier est facultatif.
- **D4, `2025-05-villeneuve-sur-auvers` (27 mai 2025), sans rattachement.** Il faut choisir : l'ajouter en tête du Memorial Day `2025-05-25`, ce qui en ferait la cible du lien ; créer un événement, ce qui est un changement substantiel ; ou ne rien faire.
- **D5, avril 2024.** `2024-04-omaha-beach` et `2024-04-scouts-omaha-beach` pourraient relever du « Voyage en France du President General » (`2024-04-06/2024-04-20`), mais aucune légende ne le confirme. Si c'est confirmé, la liste serait `["2024-04-omaha-beach", "2024-04-scouts-omaha-beach"]`.

Hors du périmètre et non traité :
- Sanary 2019 : le préfixe `2019-08` et la légende « août 2019 » ne correspondent pas à l'événement du 7 septembre.
- Plusieurs photos n'ont pas d'événement correspondant dans l'agenda (liste complète dans le plan).
- Trois doublons binaires non référencés : `2025-05-escadrille-lafayette.jpg`, `2025-05-suresnes.jpg` et `2025-05-villeneuve.jpg`.

## Vérification

Toutes les commandes ont été lancées depuis `/Users/gautric/Source/web-apps/sarfrance`, après `source .venv/bin/activate`.

1. Build de référence avant correction : `hugo --minify -d /tmp/sar-before 2>&1 | grep -iE "warn|error"`, sans aucune sortie. Il n'y avait donc aucun WARN au départ.
2. `python -c "import yaml; yaml.safe_load(open('data/agenda.yaml'))"` donne `YAML OK`.
3. `hugo --minify --destination /tmp/sar-check --cacheDir /tmp/sar-check/cache` (Hugo v0.166.0+extended) : code de sortie 0, `grep -ciE "WARN|ERROR"` sur le journal donne `0`. FR : 82 pages, EN : 80 pages.
4. Dans le HTML généré, FR et EN donnent les mêmes résultats :
   - `id=photo-2025-06-picpus-2 data-event=2025-06-25-ceremonie-au-cimetiere-de-picpus`
   - `id=photo-2025-02-ag-senat-assemblee data-event=2025-02-07-assemblee-generale-et-diner-de-sar-france-au-palais-du-luxembourg`
   - `id=photo-2024-03-ag-hommage-franklin` et `id=photo-2024-03-ag-president-ambassade` : `data-event=2024-03-22-diner-annuel-de-sar-france-au-palais-du-luxembourg`
   - Il ne reste aucune occurrence de `cercle-interallie-2` dans les pages de la photothèque.
   - Liens 📷 : le 6 février 2025 vise `#photo-2025-02-residence-ambassadeur-usa`, le 7 février 2025 `#photo-2025-02-ag-diner-jeunes`, Picpus 2025 `#photo-2025-06-picpus-1`, le Cercle Interallié `#photo-2025-07-cercle-interallie-1` et le dîner 2024 `#photo-2024-03-ag-diner-luxembourg`.
   - Nombre de liens `agenda-card-photos` par page agenda, de 2018 à 2026 : 2, 4, 3, 1, 3, 0, 8, 5, 4. Cela fait 30 en FR comme en EN, le même total qu'avant.
5. Le script d'audit relancé après correction donne `issues 0 | events with photos 30 | total photos 87`.
6. `git diff data/agenda.yaml` (par rapport à HEAD, en incluant les ajouts `photos` antérieurs non commités) : aucune ligne modifiée en dehors des lignes `photos:` et `- "…"`, et `0` ligne `update:` touchée.
7. `git status` : `R static/images/phototheque/2025-07-cercle-interallie-2.jpg -> static/images/phototheque/2025-06-picpus-2.jpg` (indexé par `git mv`), avec `content/{fr,en}/activites/phototheque.md` modifiés.
8. `/tmp/sar-before`, `/tmp/sar-check`, `/tmp/sar-thumbs` et le journal de build ont été supprimés.
