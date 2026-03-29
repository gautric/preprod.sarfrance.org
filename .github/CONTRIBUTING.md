# Comment contribuer au site SAR France

Ce document explique pas à pas comment proposer des modifications sur le site, directement depuis votre navigateur internet. **Aucun logiciel à installer.**

---

## Sommaire

1. [Rôles et droits](#rôles-et-droits)
2. [Se connecter à GitHub](#se-connecter-à-github)
3. [Accéder au projet](#accéder-au-projet)
4. [Comment fonctionne le site](#comment-fonctionne-le-site)
5. [Où se trouvent les fichiers](#où-se-trouvent-les-fichiers)
6. [Aide rapide sur le format Markdown](#aide-rapide-sur-le-format-markdown)
7. [Modifier une page de texte](#modifier-une-page-de-texte)
8. [Utiliser l'éditeur complet github.dev](#utiliser-léditeur-complet-githubdev)
9. [Ajouter un événement à l'agenda](#ajouter-un-événement-à-lagenda)
10. [Ajouter un livre à la bibliothèque](#ajouter-un-livre-à-la-bibliothèque)
11. [Modifier le diaporama de la page d'accueil](#modifier-le-diaporama-de-la-page-daccueil)
12. [Signaler un problème ou demander une modification](#signaler-un-problème-ou-demander-une-modification)
13. [Ce qui se passe après votre modification](#ce-qui-se-passe-après-votre-modification)
14. [Automatismes du site](#automatismes-du-site)
15. [En cas de problème](#en-cas-de-problème)
16. [Contact](#contact)

---

## Rôles et droits

| Rôle | Qui | Ce qu'il peut faire |
|---|---|---|
| **Auteur / Rédacteur** | Membres du bureau, secrétariat, historiens | Proposer des modifications, signaler un problème, remplir des formulaires |
| **Webmaster** | Webmaster | Relire, valider, publier les modifications, gérer la configuration |

Si vous n'avez pas de compte GitHub, demandez au webmaster de vous en créer un.

---

## Se connecter à GitHub

1. Ouvrez votre navigateur (Chrome, Firefox, Safari, Edge)
2. Allez sur [https://github.com](https://github.com)
3. Cliquez sur **Sign in** en haut à droite
4. Entrez votre identifiant et votre mot de passe

---

## Accéder au projet

L'adresse du projet est :
**[https://github.com/gautric/preprod.sarfrance.org](https://github.com/gautric/preprod.sarfrance.org)**

Depuis cette page, vous voyez tous les dossiers et fichiers du site.

---

## Comment fonctionne le site

Le site SAR France est un site **statique** : il est généré automatiquement à partir de fichiers texte et de données. Voici le principe en quelques mots :

```
Vous modifiez un fichier  →  GitHub détecte le changement
       ↓
Un robot vérifie que tout est correct (build Hugo)
       ↓
Si tout va bien, le site est mis à jour automatiquement
       ↓
Le résultat est visible sur preprod.sarfrance.org en quelques minutes
```

Le site est **bilingue** (français et anglais). Quand vous modifiez un fichier français, un robot traduit automatiquement la version anglaise et soumet une proposition de traduction pour relecture.

### Les deux types de fichiers

| Type | Où | Pour quoi |
|---|---|---|
| **Pages de texte** (`.md`) | `content/fr/` et `content/en/` | Textes des rubriques du site |
| **Fichiers de données** (`.yaml`) | `data/` | Agenda, bibliothèque, chronologie, diaporama, notices biographiques |

---

## Où se trouvent les fichiers

### Pages de texte — Rubrique « Organisation »

Dossier : `content/fr/organisation/`

| Page sur le site | Fichier |
|---|---|
| NSSAR | `nssar.md` |
| Objet de SAR France | `objet-et-histoire.md` |
| Statuts & Règlement | `statuts.md` |
| Autres sociétés françaises | `societes.md` |

### Pages de texte — Rubrique « Histoire »

Dossier : `content/fr/histoire/`

| Page sur le site | Fichier |
|---|---|
| Histoire de SAR France | `histoire-de-sar-france.md` |
| Chronologie | `chronologie.md` |
| Opérations militaires | `operations.md` |
| Chefs militaires et volontaires | `chefs-militaires.md` |
| Hauts lieux en France | `hauts-lieux.md` |
| Dictionnaire biographique | `notices.md` |
| Pertes françaises | `pertes-francaises.md` |
| Stratégies et politique françaises | `strategies-et-politique-francaises.md` |

### Pages de texte — Rubrique « Histoire / Antilles »

Dossier : `content/fr/histoire/antilles/`

| Page sur le site | Fichier |
|---|---|
| Les Antilles françaises (index) | `_index.md` |
| Le soutien des Antilles françaises | `soutien-antilles.md` |
| Régiments et Corps des Colonies | `regiments-colonies.md` |

### Pages de texte — Rubrique « Histoire / Biographies »

Dossier : `content/fr/histoire/biographies/`

| Page sur le site | Fichier |
|---|---|
| Biographies (index) | `_index.md` |
| Le marquis de Bouillé | `bouille.md` |
| Le comte de Vaux | `comte-de-vaux.md` |
| Le vicomte de Damas | `damas.md` |
| Le comte de Grasse | `de-grasse.md` |
| La Légion de Lauzun | `lauzun.md` |
| Le comte de Rochambeau | `rochambeau.md` |
| Jean-Baptiste de Tastes de Lilancour | `tastes-de-lilancour.md` |

### Pages de texte — Rubrique « Activités »

Dossier : `content/fr/activites/`

| Page sur le site | Fichier |
|---|---|
| Agenda (année en cours) | `agenda-2026.md` |
| Dictionnaire biographique | `dictionnaire.md` |
| Revue et publications | `publications.md` |
| Prix Jacques de Trentinian | `prix-trentinian.md` |
| Bibliothèque | `bibliotheque.md` |

### Pages de texte — Rubrique « Contact »

Dossier : `content/fr/contact/`

| Page sur le site | Fichier |
|---|---|
| Nous contacter | `_index.md` |
| Nous rejoindre | `nous-rejoindre.md` |
| Cotisation et don | `cotisation.md` |
| Mentions légales | `mentions-legales.md` |

### Fichiers de données

Dossier : `data/`

| Contenu | Fichier | Comment modifier |
|---|---|---|
| Agenda des événements | `data/agenda.yaml` | Via le formulaire dédié (voir section [Ajouter un événement](#ajouter-un-événement-à-lagenda)) |
| Diaporama de la page d'accueil | `data/carousel.yaml` | Directement (voir section [Diaporama](#modifier-le-diaporama-de-la-page-daccueil)) |
| Chronologie historique | `data/chronologie.yaml` | Directement ou via le webmaster |
| Notices biographiques | `data/notices.yaml` | Via le webmaster |
| Bibliothèque (inventaire) | `data/books.yaml` | Via le formulaire dédié (voir section [Bibliothèque](#ajouter-un-livre-à-la-bibliothèque)) |
| Hauts lieux en France | `data/fr/hauts-lieux.yaml` | Via le webmaster |

---

## Aide rapide sur le format Markdown

Les pages de texte utilisent le format **Markdown**. C'est un format simple : vous écrivez du texte avec quelques symboles pour la mise en forme.

| Ce que vous écrivez | Ce qui s'affiche |
|---|---|
| `## Mon titre` | Un titre de section |
| `### Mon sous-titre` | Un sous-titre |
| `**texte en gras**` | **texte en gras** |
| `*texte en italique*` | *texte en italique* |
| `- élément de liste` | • élément de liste |
| `[texte du lien](https://exemple.com)` | Un lien cliquable |

> **Important** : chaque fichier `.md` commence par un bloc entre `---` appelé « en-tête » (front matter). **Ne modifiez pas ces lignes** — elles contiennent des informations techniques pour le site.
>
> Exemple d'en-tête à ne pas toucher :
> ```
> ---
> title: "Événements"
> layout: "single"
> ---
> ```

---

## Modifier une page de texte

### Méthode rapide — un seul fichier

**Étape 1 — Trouver le fichier**

1. Depuis la page du projet, cliquez sur le dossier `content/fr`
2. Naviguez jusqu'au fichier à modifier (par exemple `activites/publications.md`)

**Étape 2 — Ouvrir l'éditeur**

1. Cliquez sur l'icône **crayon** ✏️ en haut à droite du texte affiché
2. Le texte devient modifiable

**Étape 3 — Faire la modification**

1. Modifiez le texte dans la zone d'édition
2. Cliquez sur l'onglet **Preview** pour voir un aperçu de votre modification

**Étape 4 — Enregistrer**

- **Si vous êtes webmaster** : descendez en bas, écrivez un résumé dans « Commit message », cliquez sur **Commit changes**. Le site se met à jour en quelques minutes.
- **Si vous êtes auteur/rédacteur** : descendez en bas, écrivez un résumé, sélectionnez **« Create a new branch »**, cliquez sur **Propose changes**, puis **Create pull request**. Le webmaster sera notifié.

---

## Utiliser l'éditeur complet github.dev

Quand vous devez modifier **plusieurs fichiers en même temps**, utilisez l'éditeur en ligne complet.

**Comment y accéder :**

1. Allez sur la page du projet
2. Appuyez sur la touche **`.`** (point) de votre clavier — l'éditeur s'ouvre dans le navigateur
3. Ou remplacez `github.com` par `github.dev` dans la barre d'adresse

**Ce que vous pouvez faire :**

- Naviguer dans tous les dossiers (panneau gauche)
- Modifier plusieurs fichiers avant de valider
- Voir un aperçu Markdown (clic droit sur un `.md` → *Open Preview*)
- Rechercher du texte dans tout le projet (`Ctrl+Shift+F` ou `Cmd+Shift+F`)

**Enregistrer depuis github.dev :**

1. Cliquez sur l'icône **Source Control** dans la barre gauche (icône avec des branches)
2. Écrivez un résumé de vos modifications dans le champ en haut
3. Cliquez sur **Commit & Push** (webmaster) ou **Commit & Create Pull Request** (auteur/rédacteur)

---

## Ajouter un événement à l'agenda

L'ajout d'un événement à l'agenda est **automatisé** : vous remplissez un formulaire, et un robot se charge d'insérer l'événement dans le bon fichier et de créer une proposition de modification pour relecture.

**Étape 1 — Ouvrir le formulaire**

1. Allez sur le projet : [https://github.com/gautric/preprod.sarfrance.org](https://github.com/gautric/preprod.sarfrance.org)
2. Cliquez sur l'onglet **Issues**
3. Cliquez sur **New issue**
4. Choisissez **📅 Ajout d'un événement à l'agenda**

**Étape 2 — Remplir le formulaire**

| Champ | Obligatoire | Format | Exemple |
|---|---|---|---|
| Date | ✅ | AAAA-MM-JJ | `2026-09-15` |
| Date de fin | Non | AAAA-MM-JJ | `2026-09-16` |
| Titre | ✅ | Texte, 50 car. max | `Cérémonie au cimetière de Picpus` |
| Type | ✅ | Voir liste ci-dessous | `commémoration` |
| Lieu | Non | Texte, 50 car. max | `Cimetière de Picpus, Paris` |
| Heure | Non | HH:MM | `18:00` |
| Description | Non | Texte, 200 car. max | `Cérémonie annuelle en présence de l'ambassadeur.` |

**Types d'événements disponibles :**
`conférence` · `assemblée` · `commémoration` · `nssar` · `réunion` · `visite` · `exposition`

**Étape 3 — Soumettre**

Cliquez sur **Submit new issue**. Le robot prend en charge la suite :

```
Vous soumettez le formulaire
       ↓
Le robot lit vos informations, corrige les fautes évidentes,
géolocalise le lieu automatiquement (coordonnées GPS)
       ↓
Il insère l'événement dans data/agenda.yaml au bon endroit (ordre chronologique)
       ↓
Il crée une Pull Request pour relecture par le webmaster
       ↓
Le webmaster valide → l'événement apparaît sur le site
```

> **Note** : si une information est invalide (date mal formatée, titre trop long…), le robot laisse un commentaire sur votre issue pour vous expliquer le problème. Aucune modification n'est faite.

> **Durée de vie** : les issues non traitées sont automatiquement fermées après 14 jours.

---

## Ajouter un livre à la bibliothèque

**Étape 1 — Ouvrir le formulaire**

1. Allez sur l'onglet **Issues** du projet
2. Cliquez sur **New issue**
3. Choisissez **📚 Ajout d'un livre à la bibliothèque**

**Étape 2 — Remplir le formulaire**

| Champ | Obligatoire | Exemple |
|---|---|---|
| Auteur | ✅ | `VILLIERS Patrick` |
| Titre | ✅ | `La Marine de Louis XVI` |
| Éditeur | Non | `Éditions Fayard` |
| Année de publication | Non | `2005` |
| Langue | ✅ | `fr` ou `en` |
| Nombre de pages | Non | `341` |
| Format | Non | `Broché`, `Cartonné`, `Relié` |
| Catégorie | ✅ | `marine`, `biographie`, `gia`… |
| ISBN | Non | `978-2-07-036024-1` |
| Source / provenance | Non | `Don Vergennes`, `Acquisition` |
| Lien Gallica / BnF | Non | URL vers la notice BnF |
| Description | Non | Courte note sur l'ouvrage |

**Catégories disponibles :**
`biographie` · `marine` · `gia` · `histoire-generale` · `lieux-historiques` · `genealogie` · `repertoires` · `sources` · `catalogues` · `revues` · `divers`

**Étape 3 — Soumettre**

Cliquez sur **Submit new issue**. Le webmaster traitera la demande et ajoutera le livre dans `data/books.yaml`.

---

## Modifier le diaporama de la page d'accueil

Le diaporama de la page d'accueil est géré par le fichier `data/carousel.yaml`.

1. Accédez directement au fichier :
   [https://github.com/gautric/preprod.sarfrance.org/blob/main/data/carousel.yaml](https://github.com/gautric/preprod.sarfrance.org/blob/main/data/carousel.yaml)
2. Cliquez sur le **crayon** ✏️ pour modifier

Chaque image est décrite par un bloc :

```yaml
- image: /images/carousel-yorktown.jpg
  alt: "Bataille de Yorktown, Auguste Couder (1836)"
  caption: Bataille de Yorktown
  credit: "Auguste Couder, 1836 — Galerie des Batailles, Versailles, domaine public"
```

| Champ | Signification |
|---|---|
| `image` | Chemin de l'image sur le site |
| `alt` | Description de l'image (accessibilité) |
| `caption` | Titre affiché sous l'image |
| `credit` | Auteur et source de l'image |

- Pour **changer l'ordre** : déplacez un bloc entier avant ou après un autre
- Pour **supprimer une image** : supprimez le bloc correspondant
- Pour **ajouter une image** : demandez d'abord au webmaster de déposer l'image, puis ajoutez un nouveau bloc

---

## Signaler un problème ou demander une modification

Si vous préférez ne pas modifier les fichiers vous-même, créez une **demande** (« Issue ») :

1. Allez sur le projet et cliquez sur l'onglet **Issues**
2. Cliquez sur **New issue**
3. Choisissez le formulaire adapté :

| Formulaire | Pour quoi |
|---|---|
| 📅 **Ajout d'un événement à l'agenda** | Ajouter un événement dans l'agenda |
| 📚 **Ajout d'un livre à la bibliothèque** | Ajouter un ouvrage à la bibliothèque |
| 📝 **Demande de modification de contenu** | Corriger ou mettre à jour du texte existant |
| 📄 **Demande de nouvelle page** | Créer une nouvelle rubrique ou page |
| 🐛 **Signaler un problème** | Lien cassé, problème d'affichage, erreur |

4. Remplissez le formulaire et cliquez sur **Submit new issue**
5. Le webmaster sera notifié et prendra en charge votre demande

---

## Ce qui se passe après votre modification

### Si vous avez modifié directement (webmaster)

```
Commit sur main
     ↓
Vérification automatique : build Hugo + validation des fichiers
     ↓
Si tout est correct → déploiement sur preprod.sarfrance.org (≈ 3 min)
     ↓
Si un fichier français a été modifié → traduction automatique FR→EN
proposée en Pull Request pour relecture
```

### Si vous avez proposé une modification (Pull Request)

```
Vous créez une Pull Request
     ↓
Vérifications automatiques :
  ✅ Build Hugo (le site compile sans erreur)
  ✅ Validation du contenu (en-têtes, format YAML)
     ↓
Le webmaster relit et valide (ou demande des corrections)
     ↓
Fusion → déploiement automatique sur le site
```

Vous verrez le résultat des vérifications dans l'onglet **Checks** de votre Pull Request :
- ✅ vert = tout va bien
- ❌ rouge = un problème a été détecté (cliquez sur **Details** pour voir lequel)

---

## Automatismes du site

Le site bénéficie de plusieurs automatismes qui fonctionnent sans intervention humaine :

### Reconstruction quotidienne

Chaque jour à 6h00 (UTC), le site est reconstruit automatiquement. Cela permet de mettre à jour l'affichage des événements passés et à venir dans l'agenda sans aucune action de votre part.

### Ajout automatique d'événements à l'agenda

Quand vous soumettez le formulaire **📅 Ajout d'un événement à l'agenda**, un robot :
- Lit et valide vos informations
- Corrige les fautes d'orthographe évidentes
- Géolocalise le lieu (coordonnées GPS via OpenStreetMap)
- Insère l'événement dans le fichier `data/agenda.yaml` au bon endroit
- Crée une Pull Request pour relecture par le webmaster

### Traduction automatique FR → EN

Quand un fichier français (`content/fr/`) ou une clé de traduction (`i18n/fr.yaml`) est modifié sur le site, un robot traduit automatiquement le contenu en anglais et crée une Pull Request pour relecture humaine avant publication.

### Fermeture automatique des demandes expirées

Les issues et Pull Requests non traitées sont automatiquement fermées après un délai (14 jours pour les ajouts d'agenda, 30 jours pour les traductions). Cela évite l'accumulation de demandes obsolètes.

---

## En cas de problème

**Vous avez fait une erreur ?**
Pas de panique. Chaque modification est enregistrée dans l'historique. Le webmaster peut revenir en arrière à tout moment.

**Le site ne se met pas à jour ?**
Attendez 5 minutes. Si le problème persiste, vérifiez l'onglet **Actions** du projet pour voir si une erreur s'est produite, ou contactez le webmaster.

**Votre Pull Request affiche une croix rouge ❌ ?**
Cliquez sur **Details** dans l'onglet **Checks** pour lire le message d'erreur. Les causes les plus fréquentes sont :
- Un fichier `.md` sans en-tête `---`
- Un fichier YAML mal formaté (indentation incorrecte, guillemets manquants)

**Vous n'êtes pas sûr de votre modification ?**
Créez une Issue plutôt que de modifier directement. Le webmaster vous guidera.

---

## Contact

Pour toute question technique : contactez le webmaster via une Issue ou par email.
