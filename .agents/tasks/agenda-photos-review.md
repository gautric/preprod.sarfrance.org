# Correction des rattachements `photos` de l'agenda (Picpus 2025, AG 2025, dîner 2024)

L'audit corrige trois incohérences entre `data/agenda.yaml` et la photothèque. Pour le cas signalé par l'utilisateur, il ne déplace pas `2025-07-cercle-interallie-2` vers le dîner du Cercle Interallié comme le brief le prévoyait. Il renomme le fichier en `2025-06-picpus-2.jpg`, parce que la légende, la position dans la galerie et l'image elle-même désignent toutes la cérémonie de Picpus. Il rattache aussi `2025-02-ag-senat-assemblee` à l'AG du 7 février 2025 (au lieu de la visite du 6) et ajoute deux photos orphelines au dîner du 22 mars 2024. Les cas douteux (D1 à D5) sont listés sans être appliqués. Les preuves de vérification (chargement YAML, build sans WARN, contrôle du HTML généré, diff limité aux lignes `photos`) figurent dans le rapport.

Watch for : écart assumé avec le brief sur le cas Picpus/Cercle Interallié (confirmed par l'image : le renommage est la bonne correction) ; la légende FR/EN d'une photo de la galerie a été réécrite, ce qui sort du strict périmètre `agenda.yaml` (confirmed, non bloquant).

**Verdict**: APPROVED

## High-level view

Le cas Picpus/Cercle Interallié portait sur un nom de fichier, pas sur un rattachement. L'image `2025-06-picpus-2.jpg`, que j'ai vérifiée, montre la relève du drapeau américain devant le mur de Picpus, avec la plaque d'Adrienne de Noailles et celle des Fils de la Révolution. Déplacer la photo vers le dîner du 2 juillet aurait donc introduit une erreur. Le renommage comble aussi le trou de la série `2025-06-picpus-{1..4}`, et il ne reste aucune référence à `cercle-interallie-2` dans le dépôt en dehors de `.agents/`. La consigne de l'utilisateur, « trouve l'incohérence et corrige-la », est respectée. Le critère du brief, qui présumait un déplacement, ne l'est pas, mais il reposait sur un diagnostic erroné.

La correction de février 2025 retire `2025-02-ag-senat-assemblee` de la visite du 6 février et l'ajoute en dernier à l'AG du 7, ce qui respecte l'ordre de la galerie. La cible de défilement de la visite devient `2025-02-residence-ambassadeur-usa`, qui est désormais sa seule photo. Les légendes FR et EN de cette photo ont été réécrites. C'est un changement de contenu au-delà d'`agenda.yaml`, mais il se justifie : l'ancienne légende était recopiée de la photo voisine et contredisait l'image comme le nom du fichier.

Le dîner du 22 mars 2024 récupère `2024-03-ag-hommage-franklin` et `2024-03-ag-president-ambassade`, insérées dans l'ordre de la galerie. Leurs légendes ne donnent ni lieu ni date. Le rattachement repose donc sur leur position dans la galerie et sur le décor des salons dorés. Ce raisonnement se tient (likely), mais il est moins assuré que les deux autres corrections, d'autant que D1 signale une inversion probable entre les images de l'AG et celles du dîner du même jour.

Dans `agenda.yaml`, le diff ne touche que des lignes `photos:` et `- "…"`, et aucune ligne `update:`. Par rapport à HEAD, il inclut aussi les ajouts `photos` encore non commités de la fonctionnalité précédente ; la part propre à cette étape se limite aux trois corrections décrites. Les cas réellement ambigus (D1 inversion AG/dîner 2024, D2 doublon binaire Picpus 2018/2020, D3 nom `crossing-dan`, D4 Villeneuve-sur-Auvers 2025 sans rattachement, D5 Omaha Beach 2024) ne sont pas tranchés. Chacun est accompagné d'une recommandation à soumettre à un humain.

<details>
<summary>Issues (4)</summary>

1. **Écart avec le brief sur le cas signalé** — la photo reste rattachée à Picpus et le fichier est renommé, au lieu d'être déplacée vers le Cercle Interallié. L'image le justifie (confirmed). Le message final à l'utilisateur doit l'expliquer clairement, puisqu'il pensait que la photo appartenait au dîner.
2. **Légende de la galerie réécrite** — la légende FR/EN de `2025-02-ag-senat-assemblee` a changé, ce qui va au-delà d'une correction limitée à `photos` (confirmed). Elle est justifiée par l'image et par le nom du fichier : la conserver et la mentionner à l'utilisateur.
3. **Rattachement inféré pour le dîner 2024** — `2024-03-ag-hommage-franklin` et `2024-03-ag-president-ambassade` sont rattachées au dîner d'après leur position et leur décor, sans confirmation par une légende (likely correct). Les signaler à côté de D1 pour qu'un humain vérifie en même temps toutes les images du 22 mars 2024.
4. **Renommage indexé seul** — le `git mv` est indexé, mais les changements de chemin dans `content/{fr,en}/activites/phototheque.md` ne le sont pas (confirmed). Commiter le renommage avec ces deux fichiers et `data/agenda.yaml`, faute de quoi l'image sera cassée.

</details>

<details>
<summary>Details</summary>

### Effets de bord du renommage Picpus

Le `git mv` est déjà indexé alors que le reste du travail ne l'est pas. Un commit partiel pourrait donc embarquer le renommage sans les changements de chemin dans `phototheque.md`, ce qui casserait l'image. Par ailleurs, un éventuel lien externe vers `/images/phototheque/2025-07-cercle-interallie-2.jpg` renvoie désormais une erreur 404. Le risque est faible et n'exige aucune action.

### Février 2025 : la légende devait changer avec le rattachement

Si la légende n'avait pas été corrigée, la photo serait rattachée au 7 février tout en restant légendée « résidence de l'ambassadeur, 6 février ». Le lien 📷 de l'AG aurait alors mis en évidence une photo dont la légende contredit l'événement, ce qui reproduisait l'incohérence de départ sous une autre forme.

### Doublon binaire Picpus 2018/2020 (D2)

`2018-06-picpus-2.jpg` et `2020-07-picpus-2.jpg` ont le même contenu binaire. Le `warnf` du template compare des noms et ne peut pas le détecter. Si la recommandation est retenue, `2020-07-picpus-2` sera retiré de l'événement de 2020 et sa cible de défilement deviendra `2020-07-picpus-3`.

</details>

<details>
<summary>File map</summary>

- `data/agenda.yaml` — `photos` de Picpus 2025-06-25 (référence renommée), de la visite 2025-02-06 (retrait), de l'AG 2025-02-07 (ajout) et du dîner 2024-03-22 (deux ajouts).
- `static/images/phototheque/2025-07-cercle-interallie-2.jpg` → `2025-06-picpus-2.jpg` — renommage via `git mv` (indexé).
- `content/fr/activites/phototheque.md`, `content/en/activites/phototheque.md` — chemin de l'image renommée ; légende de `2025-02-ag-senat-assemblee`.
- `.agents/tasks/audit-agenda-photos-2026-10-03.md` — rapport, questions ouvertes D1 à D5, preuves de vérification.

Diff complet : `git diff data/agenda.yaml content/*/activites/phototheque.md` et `git diff --cached --stat`.

</details>
