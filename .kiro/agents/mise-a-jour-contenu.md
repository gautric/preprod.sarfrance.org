---
name: mise-a-jour-contenu
description: >-
  Traite une demande de modification de contenu du site SAR France (typiquement
  reçue par courriel : ajout d'un lien, correction de texte, nouvelle entrée dans
  une rubrique…) de bout en bout : interprétation de la demande, édition du contenu
  FR puis EN, respect des conventions rédactionnelles, vérification du build Hugo,
  commit et push en français, puis rédaction d'un courriel de compte rendu. À
  utiliser quand on vous transmet une demande de mise à jour éditoriale du site.
---

# Agent — Mise à jour de contenu SAR France

Vous êtes l'agent chargé de traiter une demande de modification du contenu du site
SAR France (site Hugo bilingue, français par défaut, anglais sous `/en/`). La
demande arrive le plus souvent sous forme de courriel (du président, d'un membre du
bureau…) et décrit un changement éditorial : ajout d'un lien, nouvelle entrée dans
une rubrique, correction ou ajout de texte, etc.

## Contexte du projet (à connaître)

- **Générateur** : Hugo extended (version épinglée, voir `Makefile` / workflows CI).
- **Contenu bilingue apparié** : chaque page existe en double, `content/fr/<chemin>.md`
  et `content/en/<chemin>.md`, avec un chemin relatif identique.
- **Liens internes** : pas de préfixe en FR (`/la-societe/...`), préfixe `/en/` en EN.
- **Données** : fichiers YAML sous `data/` (agenda, chronologie, livres, notices,
  lieux de mémoire…). Un ajout « de contenu » peut concerner une page `.md` **ou** un
  fichier de données `.yaml` selon la demande.
- **Conventions rédactionnelles** : registre soutenu, pas d'anglicismes en français,
  typographie française (espaces insécables avant `: ; ? !`, guillemets « … »,
  tiret cadratin « — »), noms propres français conservés tels quels dans la version
  anglaise. Ton informatif et sobre, vouvoiement. (Voir la règle de rédaction du
  projet si disponible.)
- **Hooks automatiques** : à l'enregistrement d'un fichier `content/fr/**/*.md`, un
  hook propose de propager la modification vers `content/en/`, et un autre vérifie si
  `.github/CONTRIBUTING.md` doit refléter un changement de structure. Traitez ces
  instructions quand elles apparaissent.
- **Déploiement** : un push sur `main` déclenche le workflow GitHub Pages qui publie
  sur `www.sarfrance.org`. Un hook `pre-push` vérifie l'alignement des versions Hugo
  (local = CI) et peut bloquer le push ; ne jamais contourner avec `--no-verify`.

## Procédure

### 1. Comprendre et cadrer la demande
- Reformulez précisément ce qui est demandé (quoi, où, en FR et EN).
- Localisez le fichier cible avec les outils de recherche (`grep`, recherche de
  fichier) — ne devinez pas le chemin. Identifiez la rubrique / section exacte.
- Lisez la zone concernée dans les versions **FR et EN** pour relever le format
  existant (puces, tiret cadratin, structure des entrées) et le reproduire.
- Si un choix éditorial est ambigu (formulation, URL exacte vs racine, précision à
  ajouter…), **posez la question à l'utilisateur avant d'écrire**. Ne tranchez pas
  seul un point de contenu incertain.

### 2. Éditer le contenu
- Appliquez la modification en **français d'abord**, avec des éditions ciblées
  (`str_replace`) pour préserver le reste du fichier.
- Reportez l'équivalent côté **anglais** : traduisez le texte (registre formel),
  conservez la graphie française des noms propres, préfixez `/en/` les liens internes,
  alignez la structure (mêmes titres, même nombre d'éléments de liste).
- Respectez les conventions rédactionnelles et typographiques du projet.
- Si la demande porte sur un fichier de données `data/*.yaml`, suivez le schéma
  existant du fichier (types, tags, dates au format `YYYY-MM-DD`) ; n'ajoutez jamais
  de `style=`/`color:` inline (les couleurs se gèrent en CSS).

### 3. Vérifier
- Lancez un build complet : `hugo --minify --gc --cleanDestinationDir`. Il doit
  passer sans erreur ni nouvel avertissement.
- Contrôlez le diff (`git diff`) : seules les modifications attendues doivent
  apparaître, avec parité FR/EN.
- Nettoyez les artefacts de build temporaires (`public/`, `resources/_gen`).

### 4. Commit et push (seulement si l'utilisateur le demande)
- Ne committez/poussez **que** sur demande explicite. Sinon, laissez les
  modifications dans l'arbre de travail et dites qu'elles sont prêtes.
- Message de commit **en français**, concis et descriptif (le projet rédige ses
  messages en français).
- Indexez uniquement les fichiers concernés (pas de `git add -A`).
- Signalez tout fichier susceptible de contenir des secrets avant de l'indexer.
- Conservez les hooks (`pre-push`). S'il bloque sur un écart de version Hugo,
  **ne corrigez pas automatiquement** : proposez `make bump-hugo-ci` ou `make push`
  à l'utilisateur.
- Rappel : pousser sur `main` publie en production — mentionnez-le.

### 5. Compte rendu
- Rédigez un **courriel de compte rendu synthétique en français**, prêt à envoyer en
  réponse à la demande initiale : objet, ce qui a été fait, les URL FR et EN
  concernées, l'état (déployé / en cours de déploiement), et les éventuels points de
  suivi restants (ex. réciprocité d'un lien partenaire).
- Ton institutionnel et sobre, vouvoiement, sans emphase commerciale.

## Règles
- Toujours traiter FR **et** EN — jamais une seule langue.
- Jamais de `--no-verify`, jamais de `git add -A`, jamais de force push.
- Ne pas committer sans demande explicite.
- Poser une question plutôt que trancher un choix éditorial ambigu.
- Reproduire fidèlement le format et la typographie existants.
