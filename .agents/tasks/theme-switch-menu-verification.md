# Vérification — restructuration du sélecteur de thème en menu (parité avec le sélecteur de langue)

Itération : **1re** (aucun `theme-switch-menu-review.json` présent dans `.agents/tasks/`).

## Ce qui a été changé

Le contrôle de thème (clair / sombre / système) passe d'un groupe de 3 `<button>` inline
(`<li class="theme-switch-item"><div class="theme-switch" role="group">`) à un **menu déroulant**
qui reproduit exactement le sélecteur de langue (`.has-submenu .lang-switch`).

Fichiers modifiés (uniquement) :

- `themes/sarfrance/layouts/partials/header.html`
  - Remplacement du groupe de boutons par `<li class="has-submenu theme-switch">` :
    - un déclencheur `<a href="#" class="theme-switch__trigger" aria-label aria-haspopup="true" aria-expanded="false">`
      affichant l'icône du choix courant (les 3 SVG sun/moon/monitor sont présents ; seul celui
      portant `.is-shown` est visible, piloté par le JS) ;
    - une `<ul class="submenu">` listant les 3 options en `<a class="theme-opt" data-theme-value="…">`
      (icône SVG + libellé i18n), l'option active recevant `li.active` + `aria-current="true"`
      — même convention que le sélecteur de langue.
  - Placé juste avant `<li class="has-submenu lang-switch">` : les deux contrôles sont voisins.
- `themes/sarfrance/assets/css/colors.css`
  - Remplacement de l'ancien bloc « THEME SWITCHER (nav control) » (styles du groupe de boutons)
    par les styles du menu. `.theme-switch` portant `.has-submenu`, tout le positionnement,
    bordures, hover, ouverture au survol et comportement mobile du `.submenu` sont hérités de
    `style.css` ; seules sont ajoutées : la présentation des icônes (`.theme-switch__current`,
    `.theme-switch__ico[.is-shown]`, `.submenu .theme-opt-ico`) et l'ouverture clavier/JS
    (`.theme-switch:focus-within .submenu`, `.theme-switch.is-open .submenu`).
  - **Aucune** valeur de token clair/sombre modifiée ; les deux blocs sombres sont intacts.
- `themes/sarfrance/assets/js/pages/theme-switcher.js`
  - Réécrit pour piloter le menu : `syncUI()` met à jour l'icône du déclencheur + l'option active
    sur toutes les instances ; clic sur une option → `writeChoice`/`applyTheme`/`syncUI` + fermeture ;
    ouverture/fermeture bureau (toggle au clic, Échap, clic extérieur) avec `aria-expanded` tenu à jour ;
    mobile laissé à `main.js` (`.has-submenu.active`), comme le sélecteur de langue.
  - Comportement préservé : clé localStorage `sar-theme`, pose/retrait de `data-theme` sur
    `document.documentElement`, synchro multi-instances, écoute `matchMedia` en mode système,
    `SAR.onReady`, aucun global fuité, chargé après `core.js`.

Non modifiés : `theme-init.js` (logique anti-FOUC), les valeurs de tokens clair/sombre,
le sélecteur de langue, le contenu, la config de menu, i18n (clés `theme_*` déjà présentes et réutilisées).

## Commandes exécutées et résultats

### `make build-check` → exit 0

```
hugo --minify --destination /tmp/sarfrance-build-check --cacheDir /tmp/sarfrance-build-check/cache
                  │ FR  │ EN
──────────────────┼─────┼─────
 Pages            │  84 │  82
...
Total in 340 ms
✅ Build de vérification disponible dans /tmp/sarfrance-build-check
Exit Code: 0
```

Pages : **FR 84 / EN 82** — conforme.

### Aucun `<script>` inline introduit dans un layout

```
grep -rn "<script>" themes/sarfrance/layouts/  → none
```

Les seuls scripts inline du HTML rendu (gtag GA4, JSON-LD) sont préexistants et non touchés.
Le sélecteur de thème est chargé via `<script src=…>` (déjà présent dans `site-scripts.html`).

### Stratégie CSS sombre inchangée

```
# @media (prefers-color-scheme: dark) réel (hors commentaire) : 1 (ligne 401)
grep -n "@media (prefers-color-scheme: dark)" colors.css
  295: ... (commentaire)
  401:@media (prefers-color-scheme: dark) {
```

- Un seul `@media (prefers-color-scheme: dark)` gaté `:root:not([data-theme="light"]):not([data-theme="dark"])`.
- Dark forcé via `:root[data-theme="dark"]`, clair forcé via le `:root` de base.
- Les deux blocs sombres (KEEP IN SYNC) sont **byte-identiques** (comparaison normalisée des
  corps de tokens → `True`).

### Rendu du menu (build de vérification)

```
theme-switch__trigger : 1
data-theme-value : light / dark / system (3)
option active par défaut : system (li.active + aria-current)
```

### `git status --short` — tout en working-tree, AUCUN commit

```
 M i18n/en.yaml
 M i18n/fr.yaml
 M themes/sarfrance/assets/css/colors.css
 M themes/sarfrance/layouts/_default/baseof.html
 M themes/sarfrance/layouts/partials/header.html
 M themes/sarfrance/layouts/partials/site-scripts.html
?? .agents/tasks/theme-switcher-plan.md
?? .agents/tasks/theme-switcher-review.json
?? .agents/tasks/theme-switcher-review.md
?? .github/workflows/deploy-s3.yml
?? themes/sarfrance/assets/js/pages/theme-switcher.js
?? themes/sarfrance/assets/js/theme-init.js
?? themes/sarfrance/layouts/partials/head-theme-init.html
```

Modifs propres à cette restructuration : `header.html`, `colors.css`, `theme-switcher.js`.
Les autres entrées (i18n, baseof, site-scripts, head-theme-init, theme-init.js, fichiers `.agents`)
proviennent de l'étape dark-mode précédente, elle aussi non commitée. **Aucun `git commit`,
`git add`, ni `--amend` n'a été exécuté.**
