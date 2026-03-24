## 📅 Ajout d'un événement à l'agenda

### Informations de l'événement

- **Date** : <!-- AAAA-MM-JJ (ex : 2026-05-27) -->
- **Date de fin** : <!-- AAAA-MM-JJ si l'événement dure plusieurs jours, sinon laisser vide -->
- **Titre** : <!-- Titre de l'événement en français -->
- **Type** : <!-- conférence | assemblée | commémoration | nssar | réunion | visite | exposition -->
- **Lieu** : <!-- Nom du lieu ou de la ville (ex : Cimetière américain de Suresnes) -->
- **Heure** : <!-- HH:MM en format 24h (ex : 18:00), sinon laisser vide -->
- **Description** : <!-- Courte description en français (facultatif) -->
- **Coordonnées GPS** : <!-- lat, lon (ex : 48.8723, 2.2177) — utiliser https://nominatim.openstreetmap.org pour trouver les coordonnées -->

### Vérifications avant fusion

- [ ] L'événement est inséré dans l'ordre chronologique dans `data/agenda.yaml`
- [ ] Les 9 champs sont présents (`date`, `dateEnd`, `titre`, `type`, `description`, `lieu`, `heure`, `lat`, `lon`)
- [ ] Le type est valide : `conférence`, `assemblée`, `commémoration`, `nssar`, `réunion`, `visite` ou `exposition`
- [ ] La date est au format `AAAA-MM-JJ`
- [ ] L'heure est au format `HH:MM` (ou vide `""`)
- [ ] Les coordonnées GPS sont renseignées si un lieu est indiqué (sinon `0`)
- [ ] Le build Hugo passe sans erreur (vérifier l'onglet « Checks » ci-dessous)

### Remarques

<!-- Informations complémentaires, contexte, lien vers le programme, etc. -->
