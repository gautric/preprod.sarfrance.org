# Comment contribuer au site SAR France

Ce document explique pas à pas comment proposer des modifications sur le site, directement depuis votre navigateur internet. Aucun logiciel à installer.

---

## Rôles

| Rôle | Qui | Ce qu'il peut faire |
|---|---|---|
| **Auteur / Rédacteur** | Membres du bureau, secrétariat, historien | Proposer des modifications de texte, signaler un problème |
| **Éditeur / Webmaster** | Webmaster | Relire, valider et publier les modifications |

---

## Se connecter à GitHub

1. Ouvrez votre navigateur (Chrome, Firefox, Safari, Edge)
2. Allez sur [https://github.com](https://github.com)
3. Cliquez sur **Sign in** en haut à droite
4. Entrez votre identifiant et votre mot de passe
5. Si vous n'avez pas de compte, demandez au webmaster de vous en créer un

---

## Accéder au projet du site

1. Allez à cette adresse : [https://github.com/gautric/preprod.sarfrance.org](https://github.com/gautric/preprod.sarfrance.org)
2. Vous voyez la liste des dossiers du site
3. Les textes du site se trouvent dans le dossier **content/**

---

## Où se trouvent les pages du site

Le site est organisé comme un classeur avec des dossiers. Chaque rubrique du menu correspond à un dossier, et chaque page correspond à un fichier à l'intérieur de ce dossier.

Les fichiers de texte portent l'extension `.md` (format Markdown, un format de texte simple).

### Rubrique « Organisation »

Dossier : `content/organisation/`

| Page sur le site | Fichier à modifier |
|---|---|
| NSSAR | `nssar.md` |
| Objet de SAR France | `objet.md` |
| Statuts & Règlement | `statuts.md` |
| Sociétés françaises | `societes.md` |
| Secrétariat | `secretariat.md` |

### Rubrique « Histoire »

Dossier : `content/histoire/`

| Page sur le site | Fichier à modifier |
|---|---|
| Chronologie | `chronologie.md` |
| Opérations militaires | `operations.md` |
| Chefs militaires | `chefs-militaires.md` |
| Hauts lieux en France | `hauts-lieux.md` |

### Rubrique « Activités »

Dossier : `content/activites/`

| Page sur le site | Fichier à modifier |
|---|---|
| Agenda 2026 | `agenda-2026.md` |
| Événements | `evenements.md` |
| Dictionnaire biographique | `dictionnaire.md` |
| Publications (revue annuelle) | `bulletins.md` |
| Autres publications | `publications.md` |

### Rubrique « Contact »

Dossier : `content/contact/`

| Page sur le site | Fichier à modifier |
|---|---|
| Nous contacter (formulaire) | `_index.md` |
| Nous rejoindre | `nous-rejoindre.md` |
| Paiement en ligne | `cotisation.md` |
| Faites un don | `donateur.md` |
| Mentions légales | `mentions-legales.md` |

### Diaporama de la page d'accueil

Le diaporama n'est pas un fichier texte classique. C'est un fichier de données au format JSON situé à un endroit différent :

`data/carousel.json`

Sa modification est expliquée plus bas dans la section « Modifier le diaporama ».

---

## Modifier une page du site (texte)

### Étape 1 — Trouver le fichier

1. Depuis la page du projet, cliquez sur le dossier `content`
2. Cliquez sur le sous-dossier correspondant à la rubrique (par exemple `activites`)
3. Cliquez sur le fichier de la page à modifier (par exemple `evenements.md`)

### Étape 2 — Ouvrir l'éditeur

1. Une fois le fichier affiché, cliquez sur l'icône en forme de **crayon** ✏️ en haut à droite du texte
2. Le bouton s'appelle **« Edit this file »**
3. Le texte du fichier apparaît dans une zone modifiable

### Étape 3 — Faire la modification

1. Modifiez le texte directement dans la zone d'édition
2. **Important** : ne touchez pas aux lignes entre `---` tout en haut du fichier — c'est l'en-tête technique
3. Vous pouvez cliquer sur l'onglet **Preview** au-dessus de la zone de texte pour voir un aperçu

### Étape 4 — Proposer la modification

Deux cas possibles selon vos droits d'accès :

**Si vous êtes webmaster (accès direct) :**
1. Descendez en bas de la page
2. Écrivez un court résumé dans le champ « Commit message » (par exemple : *Mise à jour de la page Événements*)
3. Cliquez sur le bouton vert **Commit changes**
4. Le site se met à jour automatiquement en quelques minutes

**Si vous êtes auteur/rédacteur (proposition de modification) :**
1. Descendez en bas de la page
2. Écrivez un court résumé dans le champ « Commit message »
3. Sélectionnez **« Create a new branch for this commit and start a pull request »**
4. Cliquez sur **Propose changes**
5. Sur la page suivante, cliquez sur **Create pull request**
6. Le webmaster sera automatiquement notifié et relira votre proposition avant de la publier

---

## Modifier le diaporama de la page d'accueil

1. Allez directement à cette adresse :
   [https://github.com/gautric/preprod.sarfrance.org/blob/main/data/carousel.json](https://github.com/gautric/preprod.sarfrance.org/blob/main/data/carousel.json)
2. Cliquez sur le **crayon** ✏️ pour modifier

Le fichier contient la liste des images du diaporama. Chaque image est décrite par un bloc comme celui-ci :

```json
{
  "image": "/images/carousel-yorktown.jpg",
  "alt": "Bataille de Yorktown",
  "caption": "Bataille de Yorktown",
  "credit": "Auguste Couder, 1836"
}
```

| Champ | Signification |
|---|---|
| `image` | Chemin de l'image sur le site |
| `alt` | Description de l'image (accessibilité) |
| `caption` | Titre affiché sous l'image |
| `credit` | Auteur et source |

- Pour **changer l'ordre** : déplacez un bloc entier avant ou après un autre
- Pour **supprimer une image** : supprimez le bloc correspondant
- Pour **ajouter une image** : demandez d'abord au webmaster de déposer l'image sur le site, puis ajoutez un nouveau bloc
- **Attention aux virgules** : chaque bloc est séparé par une virgule, sauf le dernier

Enregistrez comme pour une page (bouton **Commit changes**).

---

## Signaler un problème ou demander une modification

Si vous préférez ne pas modifier le fichier vous-même, vous pouvez créer une **demande** (appelée « Issue ») :

1. Allez sur le projet : [https://github.com/gautric/preprod.sarfrance.org](https://github.com/gautric/preprod.sarfrance.org)
2. Cliquez sur l'onglet **Issues** (en haut de la page)
3. Cliquez sur le bouton vert **New issue**
4. Choisissez le formulaire adapté :
   - 📝 **Demande de modification de contenu** — pour corriger ou mettre à jour du texte
   - 📄 **Demande de nouvelle page** — pour créer une nouvelle rubrique
   - 🐛 **Signaler un problème** — pour un lien cassé, un problème d'affichage, etc.
5. Remplissez le formulaire et cliquez sur **Submit new issue**
6. Le webmaster sera notifié et prendra en charge votre demande

---

## Aide rapide sur le format Markdown

Les pages du site utilisent le format Markdown. Voici les mises en forme les plus courantes :

| Ce que vous écrivez | Ce qui s'affiche |
|---|---|
| `## Mon titre` | Un titre de section |
| `### Mon sous-titre` | Un sous-titre |
| `**texte en gras**` | **texte en gras** |
| `*texte en italique*` | *texte en italique* |
| `- élément de liste` | • élément de liste |
| `[texte du lien](https://exemple.com)` | Un lien cliquable |

---

## Vérification automatique

Quand vous proposez une modification via une Pull Request, deux vérifications se lancent automatiquement :

- ✅ **Build Hugo** : vérifie que le site compile sans erreur
- ✅ **Validation du contenu** : vérifie que les fichiers sont bien formés (en-têtes, format JSON)

Si un contrôle échoue, vous verrez une croix rouge ❌ sur votre Pull Request. Consultez l'onglet **Checks** pour comprendre le problème, ou contactez le webmaster.

---

## En cas de problème

- **Vous avez fait une erreur ?** Pas de panique. Chaque modification est enregistrée dans l'historique. Le webmaster peut revenir en arrière à tout moment.
- **Le site ne se met pas à jour ?** Attendez 5 minutes. Si le problème persiste, contactez le webmaster.
- **Vous n'êtes pas sûr de votre modification ?** Créez une Issue plutôt que de modifier directement.

---

## Contact

Pour toute question : [webmaster@sarfrance.org](mailto:webmaster@sarfrance.org)
