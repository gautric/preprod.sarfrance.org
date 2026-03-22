---
inclusion: manual
---

# Convention de messages de commit Git

## Format

Utiliser le format **Conventional Commits** :

```
<type>(<scope>): <description>
```

- La description commence par une majuscule, en anglais
- Pas de point final
- Longueur max de la première ligne : 72 caractères
- Si un corps est nécessaire, séparer par une ligne vide

## Types autorisés

| Type       | Usage                                                        |
|------------|--------------------------------------------------------------|
| `docs`     | Ajout ou modification de contenu Markdown (`content/`)       |
| `feat`     | Nouvelle fonctionnalité (layout, shortcode, JS, template)    |
| `fix`      | Correction de bug (template, CSS, JS, données)               |
| `style`    | Changement purement visuel (CSS, icônes, espacement)         |
| `refactor` | Restructuration sans changement fonctionnel                  |
| `chore`    | Configuration, CI, dépendances, scripts de déploiement       |
| `i18n`     | Ajout ou modification de clés de traduction (`i18n/`)        |
| `data`     | Modification de fichiers YAML dans `data/`                   |

## Scopes courants

| Scope          | Répertoire / zone concernée                        |
|----------------|----------------------------------------------------|
| `histoire`     | `content/*/histoire/`, chronologie, notices         |
| `activites`    | `content/*/activites/`, agenda, publications        |
| `organisation` | `content/*/organisation/`                           |
| `contact`      | `content/*/contact/`                                |
| `home`         | Page d'accueil, carousel                            |
| `theme`        | `themes/sarfrance-theme/` (layouts, CSS, JS)        |
| `config`       | `hugo.yaml`, menus, paramètres du site              |
| `ci`           | `.github/workflows/`, scripts de déploiement        |
| `steering`     | `.kiro/steering/`                                   |
| `i18n`         | `i18n/fr.yaml`, `i18n/en.yaml`                     |

Le scope est optionnel mais recommandé. Utiliser le scope le plus spécifique possible.

## Exemples

```
docs(histoire): Add French casualties page and update contributing guide
feat(theme): Add language switcher to header navigation
fix(activites): Correct agenda event date sorting order
style(notices): Add emoji icons to tag and filter button elements via CSS
refactor(organisation): Consolidate purpose and bylaws into unified statutes page
chore(config): Migrate Hugo configuration from TOML to YAML format
i18n: Add missing English translations for contact section
data: Update 2026 agenda with spring conference dates
```

## Règles supplémentaires

- Un commit = un changement logique. Ne pas mélanger contenu FR et refactoring de template dans le même commit.
- Quand un changement touche les deux langues (FR + EN), un seul commit suffit — pas besoin de séparer.
- Lang : le commit oit etre en francais si le changement est un changement sur les infos de l association, histoire, agenda etc... en anglais si cela touche les modification structurelles du site, hugo, framework, technique etc...
- Quand un changement correspond à une tâche de `TASKS.md`, mentionner le numéro dans le corps du commit :

```
docs(activites): Replace bulletin page content with annual review text

Tâche #5
```
