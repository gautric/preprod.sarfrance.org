---
name: mise-a-jour-contenu
description: Traite une demande de modification de contenu du site SAR France (ajout d'un lien, nouvelle entrée dans une rubrique, correction de texte) de bout en bout — édition FR puis EN, respect des conventions rédactionnelles, build Hugo, commit/push en français, puis courriel de compte rendu. Use when on vous transmet une demande de mise à jour éditoriale du site (souvent par courriel).
---

# Mise à jour de contenu SAR France

Traite une demande de modification du contenu du site SAR France (site Hugo bilingue : français par défaut, anglais sous `/en/`) de bout en bout. La demande arrive le plus souvent sous forme de courriel décrivant un changement éditorial : ajout d'un lien, nouvelle entrée dans une rubrique, correction ou ajout de texte.

## When to use

Dès qu'on vous transmet une demande de mise à jour éditoriale du site (contenu `content/**` ou données `data/**`), typiquement issue d'un courriel du président ou d'un membre du bureau.

## Contexte du projet

- **Contenu bilingue apparié** : chaque page existe en double, `content/fr/<chemin>.md` et `content/en/<chemin>.md`, chemin relatif identique.
- **Liens internes** : pas de préfixe en FR (`/la-societe/...`), préfixe `/en/` en EN.
- **Données** : fichiers YAML sous `data/` (agenda, chronologie, livres, notices, lieux de mémoire). Un ajout de contenu peut concerner une page `.md` ou un `.yaml`.
- **Conventions rédactionnelles** : registre soutenu, pas d'anglicismes en français, typographie française (espaces insécables avant `: ; ? !`, guillemets « … », tiret cadratin « — »), noms propres français conservés tels quels en anglais, ton informatif et sobre, vouvoiement.
- **Déploiement** : un push sur `main` publie sur `www.sarfrance.org` via GitHub Pages. Un hook `pre-push` vérifie l'alignement des versions Hugo et peut bloquer ; ne jamais contourner avec `--no-verify`.

## Steps

1. **Cadrer la demande** — reformuler précisément (quoi, où, FR + EN). Localiser le fichier cible avec `grep`/recherche (ne pas deviner le chemin). Lire la zone concernée dans les versions FR **et** EN pour reproduire le format existant (puces, tiret cadratin, structure des entrées). Si un choix éditorial est ambigu (formulation, URL exacte vs racine, précision à ajouter), **poser la question avant d'écrire**.

2. **Éditer le français d'abord** — éditions ciblées (`str_replace`) pour préserver le reste du fichier ; respecter conventions et typographie.

3. **Reporter côté anglais** — traduire le texte (registre formel), conserver la graphie française des noms propres, préfixer `/en/` les liens internes, aligner la structure (mêmes titres, même nombre d'éléments). Pour un `data/*.yaml`, suivre le schéma du fichier (types, tags, dates `YYYY-MM-DD`) ; jamais de `style=`/`color:` inline.

4. **Vérifier le build** — `hugo --minify --gc --cleanDestinationDir`, sans erreur ni nouvel avertissement. Contrôler le `git diff` (seules les modifications attendues, parité FR/EN). Nettoyer `public/` et `resources/_gen`.

5. **Commit et push (sur demande explicite seulement)** — message **en français**, concis ; indexer uniquement les fichiers concernés (pas de `git add -A`) ; conserver les hooks. Si `pre-push` bloque sur un écart de version Hugo, ne pas corriger automatiquement : proposer `make bump-hugo-ci` ou `make push`. Rappeler qu'un push sur `main` publie en production.

6. **Compte rendu** — rédiger un courriel de compte rendu synthétique **en français**, prêt à envoyer en réponse : objet, ce qui a été fait, URL FR et EN, état (déployé / en cours), points de suivi restants. Ton institutionnel et sobre, vouvoiement.

## Rules

- Toujours traiter FR **et** EN — jamais une seule langue.
- Jamais de `--no-verify`, jamais de `git add -A`, jamais de force push.
- Ne pas committer sans demande explicite ; sinon laisser les modifications prêtes dans l'arbre de travail.
- Poser une question plutôt que trancher un choix éditorial ambigu.
- Reproduire fidèlement le format et la typographie existants.
- Respecter les hooks de propagation FR→EN et de mise à jour de `CONTRIBUTING.md` lorsqu'ils se déclenchent.
