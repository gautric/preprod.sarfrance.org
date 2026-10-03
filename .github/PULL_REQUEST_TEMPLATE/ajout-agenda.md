## 📅 Ajout d'un événement à l'agenda

### Informations de l'événement

- **Date** : <!-- ISO 8601. Date seule : 2026-05-27 ; avec heure : 2026-02-06T18:00:00 ; intervalle : 2026-03-03/2026-03-31 ; intervalle avec heure : 2026-03-03T18:00:00/2026-03-31 -->
- **Titre** : <!-- Titre de l'événement en français -->
- **Type** : <!-- Une des clés de data/metadata/agenda.yaml : conférence | assemblée | commémoration | nssar | réunion | visite | exposition | 250freedom | 400ans-marine-nationale -->
- **Description** : <!-- Courte description en français (facultatif) -->
- **Lieu** : <!-- Nom du lieu ou de la ville (ex : Cimetière américain de Suresnes). Vide si pas de lieu physique (visioconférence) -->
- **Lien** : <!-- URL externe (annonce, programme, inscription). Laisser vide si aucun lien -->
- **Coordonnées GPS** : <!-- lat, lon (ex : 48.8723, 2.2177) via https://nominatim.openstreetmap.org. 0, 0 si pas de lieu physique -->
- **Photos** (facultatif) : <!-- Noms de fichiers (sans extension) de la photothèque, un par ligne, uniquement si l'évènement est déjà illustré. Détails : .kiro/steering/structure-agenda.md -->

### Vérifications avant fusion

- [ ] L'événement est inséré dans l'ordre chronologique dans `data/agenda.yaml`
- [ ] Les champs présents suivent l'ordre : `date`, `title`, `type`, `description`, `location`, `link`, `lat`, `lon`, `photos` (facultatif), `update`
- [ ] Le `type` figure bien dans `data/metadata/agenda.yaml` (sous la clé `types`)
- [ ] Le champ `date` suit l'un des formats ISO 8601 autorisés (date seule, date avec heure, intervalle, intervalle avec heure)
- [ ] Les coordonnées GPS sont renseignées pour un lieu physique (`0, 0` autorisé pour une visioconférence)
- [ ] Le champ technique `update` est le dernier champ du bloc et porte la date du jour (`AAAA-MM-JJ`)
- [ ] Le build Hugo passe sans erreur (vérifier l'onglet « Checks » ci-dessous)

### Remarques

<!-- Informations complémentaires, contexte, lien vers le programme, etc. -->
