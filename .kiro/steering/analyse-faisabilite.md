---
inclusion: manual
description: "Analyse une demande de modification du site SAR France et rédige un mail de réponse sur la faisabilité, en vérifiant la cohérence avec la structure du site, les bonnes pratiques Hugo et le positionnement institutionnel et historique de SAR France."
---

L'utilisateur soumet une demande de modification ou d'évolution du site SAR France. Analyse-la et rédige un mail de réponse sur la faisabilité.

## Contexte du site
SAR France (Société en France des Fils de la Révolution Américaine) est le chapitre français de la NSSAR. Le site est institutionnel et historique, bilingue (français par défaut, anglais sous /en/), construit avec Hugo. Il s'adresse aux membres, aux candidats à l'adhésion et aux passionnés d'histoire franco-américaine.

## Étape 1 : Comprendre la demande
Lis attentivement le dernier message de l'utilisateur. Identifie :
- Ce qui est demandé (nouvelle page, déplacement de contenu, modification de structure, nouvelle fonctionnalité, etc.)
- Les pages ou sections concernées
- Le contenu existant impliqué

## Étape 2 : Explorer le site
Pour évaluer la faisabilité, consulte les fichiers pertinents :
- `config/_default/hugo.yaml` pour la configuration, `config/_default/menus.fr.yaml` / `menus.en.yaml` pour les menus, et `config/_default/params.yaml` pour les paramètres
- Les fichiers `content/fr/` concernés par la demande
- Les layouts dans `themes/sarfrance/layouts/` si la demande implique un nouveau template
- Les fichiers `data/` si la demande implique des données structurées

## Étape 3 : Évaluer la faisabilité sur 4 axes

### 1. Cohérence éditoriale et institutionnelle
- La demande respecte-t-elle le ton institutionnel et historique du site ?
- Le contenu proposé est-il à sa place dans la section visée ?
- La longueur et le niveau de détail sont-ils proportionnés aux pages voisines ?
- Y a-t-il un risque de déséquilibre entre sections ?

### 2. Cohérence de la structure Hugo
- La demande s'inscrit-elle dans l'architecture de contenu existante (sections, _index.md, pages feuilles) ?
- Faut-il créer un nouveau layout ou peut-on réutiliser `_default/single.html` ?
- La demande implique-t-elle des données structurées (nouveau fichier `data/`) ou du Markdown pur ?
- Les menus (`config/_default/menus.fr.yaml` / `menus.en.yaml`) doivent-ils être mis à jour ?
- La contrainte bilingue est-elle respectée (fichier miroir dans `content/en/`) ?

### 3. Bonnes pratiques de gestion de contenu
- Le contenu est-il maintenable dans le temps (pas de dates en dur, pas de doublons) ?
- Les conventions du projet sont-elles respectées (front matter, nommage des fichiers, i18n) ?
- Y a-t-il des dépendances à anticiper (menus, liens internes, hreflang) ?

### 4. Complexité et effort
- La demande est-elle simple (modification de contenu Markdown) ou complexe (nouveau layout, nouveau JS, nouvelle CSS) ?
- Quelles sont les étapes concrètes de mise en œuvre ?
- Y a-t-il des risques ou des points d'attention ?

## Étape 4 : Rédiger le mail de réponse
Rédige un mail de réponse en français, sobre et professionnel, adapté à un interlocuteur non technique mais impliqué dans la vie de l'association. Le mail doit :
- Reformuler brièvement la demande pour montrer qu'elle a été comprise
- Donner un avis clair sur la faisabilité (oui / oui avec ajustements / non recommandé)
- Expliquer les points de vigilance ou les ajustements suggérés, sans jargon technique
- Proposer si besoin une ou plusieurs options concrètes avec leurs avantages et inconvénients
- Conclure par une invitation à valider ou à préciser

Le mail ne doit pas dépasser 25 lignes. Pas de bullet points excessifs. Ton : direct, bienveillant, expert.
