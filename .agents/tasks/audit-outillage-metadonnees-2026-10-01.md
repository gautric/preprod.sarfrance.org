# Audit de l'outillage (.claude, .github, .kiro) et des métadonnées — SAR France

Audit en lecture seule, réalisé le 2026-10-01 sur `main` (HEAD `a7db905`). Aucun fichier du dépôt n'a été modifié en dehors du présent rapport. Les valeurs secrètes ne sont pas reproduites.

## Synthèse

Le site est sain sur le fond : le build Hugo 0.166.0 passe sans avertissement, les 272 blocs JSON-LD générés sont valides, la parité FR/EN est exacte (60 = 60 fichiers, 147 = 147 clés i18n), toutes les clés de types/tags/catégories utilisées dans `data/` sont déclarées dans `data/metadata/` et traduites. Les problèmes sont essentiellement de dérive documentaire et d'outillage :

1. **Bug fonctionnel dans l'agent agenda** : `agent-agenda.md` n'autorise que 7 types et rejette `250freedom` et `400ans-marine-nationale`, pourtant proposés dans le formulaire d'issue. Il se déclenche en outre sur toutes les issues, pas seulement celles de l'agenda.
2. **La CI de PR ne couvre pas tout** : `preview.yml` ne se déclenche pas sur `themes/**`, `i18n/**` ni `scripts/**`. Une PR qui ne touche que le thème ou les traductions n'est pas compilée avant fusion.
3. **Le `lastmod` du sitemap est probablement faux en production** : `enableGitInfo: true` avec un checkout superficiel (`fetch-depth` par défaut à 1) dans `deploy.yml`. Le champ `lastUpdate` du front matter n'est lu par aucun template.
4. **Documentation des agents divergente** : thème décrit comme « git submodule » alors qu'il n'y en a pas, Hugo 0.163.3 dans `tech.md` contre 0.166.0 en CI, `make doctor` documenté mais supprimé, steering `ajout-evenement-agenda.md` sans le champ `update`, section dupliquée dans `structure.md`, règles de commit contradictoires.
5. **Hooks Kiro en double** : 6 hooks existent aux deux formats. 3 paires sont actives des deux côtés (risque de double exécution), et les deux paires `sync-fr-to-en-*` ont des états `enabled` inversés.
6. **Skill Claude inopérant** : `.claude/skills/optimize-images.md` n'a ni le bon emplacement (`skills/<nom>/SKILL.md`) ni de front matter, donc il n'est pas chargé.
7. **SEO** : balises `og:image` émises deux fois sur chaque page, aucune action pinée par SHA, pas de `dependabot.yml`, pas de contrôle de liens ni de cohérence des données en CI.

Gains rapides en fin de document.

---

## Périmètre 1 — `.claude/` et `CLAUDE.md`

Vérifié par lecture de `.claude/settings.json`, `.claude/settings.local.json` (clés seulement), `.claude/skills/optimize-images.md`, `CLAUDE.md`, `Makefile`, et par `git ls-files` / `git check-ignore`.

### 1.1 Skill au mauvais format — priorité haute, effort S
- **Fichier** : `.claude/skills/optimize-images.md`
- **Constat** : Claude Code attend `.claude/skills/<nom>/SKILL.md` avec un front matter `name` + `description`. Ce fichier est à plat et commence directement par `# Optimize Images`, donc il n'est pas découvert. Le contenu utilise aussi `sed -i ''` (propre à macOS) et `content/**/*.md`, qui exige `globstar` sous bash.
- **Proposition** : déplacer le fichier vers `.claude/skills/optimize-images/SKILL.md` et ajouter :
  ```yaml
  ---
  name: optimize-images
  description: Détecte et optimise les images de static/images de plus de 2 Mo (PNG photo → JPG, 2000 px max, qualité 85) et met à jour les références dans content/.
  ---
  ```
  Remplacer le `sed` par une commande portable (`grep -rl … content | xargs sed -i.bak …`, ou un petit script Python).

### 1.2 Hook `PostToolUseFailure` à effets de bord — priorité moyenne, effort S
- **Fichier** : `.claude/settings.json` (versionné)
- **Constat** : quand un `git push` échoue sur « Hugo version mismatch », le hook lance `make bump-hugo-ci` puis **committe automatiquement** `deploy.yml`, `preview.yml` et `Makefile`. Le sens est discutable : c'est la CI qui s'aligne sur la version locale, quelle qu'elle soit. Le hook ne se déclenche d'ailleurs que si `core.hooksPath=.githooks` est configuré. La validité du champ `"if": "Bash(git push*)"` dans le schéma des hooks Claude Code n'a pas été vérifiée.
- **Proposition** : remplacer le commit automatique par un `additionalContext` qui propose `make bump-hugo-ci` à l'utilisateur, ou se contenter de `make push`, qui couvre déjà ce flux.

### 1.3 Permissions locales obsolètes — priorité basse, effort S
- **Fichier** : `.claude/settings.local.json`
- **Constat** : la clé `permissions.allow` contient deux entrées ponctuelles. L'une pointe vers un ancien chemin (`/Users/gautric/Source/git/sarfrance/...`, le dépôt est désormais sous `Source/web-apps`). Aucun secret n'y figure. Le fichier est ignoré **uniquement par le gitignore global de l'utilisateur** (`~/.config/git/ignore:1`), pas par le `.gitignore` du projet.
- **Proposition** : purger ces entrées et ajouter `.claude/settings.local.json` ainsi que `.claude/worktrees/` au `.gitignore` du dépôt, pour protéger les autres contributeurs.

### 1.4 `CLAUDE.md` diverge du code et des steering — priorité haute, effort S
- **Fichier** : `CLAUDE.md`
- **Constats vérifiés** :
  - `make doctor` est documenté, mais le commit `a7db905` a supprimé **les deux** définitions de la cible. `make -n doctor` renvoie « Nothing to be done », et `doctor` reste listé dans `.PHONY`.
  - « Theme — git submodule » est inexact : il n'y a pas de `.gitmodules`, et les 62 fichiers de `themes/sarfrance/` sont suivis directement dans le dépôt. La même erreur figure dans `tech.md`, `structure.md` (lignes 45 et 84) et dans `CODEOWNERS` (entrée `.gitmodules`).
  - La règle de commit (« French for association content, English for technical ») reprend `git-commit.md`, mais celui-ci impose aussi « description commence par une majuscule, en anglais ». C'est contradictoire, et les commits récents sont en minuscules (`chore(build): remove duplicate…`).
  - `CLAUDE.md` résume `tech.md`/`structure.md`/`redaction.md` en ~100 lignes : c'est une troisième source de vérité qui dérive déjà.
- **Proposition (mutualisation)** : créer un `AGENTS.md` racine court, source unique des règles transverses (commandes, conventions, commit, rédaction), lu nativement par Copilot coding agent et par d'autres agents. `CLAUDE.md` se réduirait alors à des imports :
  ```markdown
  @AGENTS.md
  @.kiro/steering/structure.md
  @.kiro/steering/redaction.md
  ```
  Côté Kiro, `AGENTS.md` peut être référencé depuis un steering via `#[[file:AGENTS.md]]`. À vérifier selon la version de Kiro : AGENTS.md est peut-être déjà pris en charge nativement.

### 1.5 `.claude/worktrees/` vide — priorité basse, effort S
Le dossier est vide et non suivi. L'ignorer explicitement (voir 1.3).

---

## Périmètre 2 — `.github/`

Vérifié par lecture de tous les fichiers listés, `gh aw compile --no-emit` (« 2 succeeded, 0 warnings »), `gh aw status` (les deux workflows sont « compiled: Yes ») et `git log` sur les `.md`/`.lock.yml`.

### 2.1 Agent agenda : liste de types périmée — priorité haute, effort S
- **Fichiers** : `.github/workflows/agent-agenda.md` (lignes 103 et 155), `.github/ISSUE_TEMPLATE/add-agenda-event.yml` (lignes 43–52), `data/metadata/agenda.yaml`
- **Constat** : le formulaire propose 9 types, `data/metadata/agenda.yaml` en déclare 9, mais l'agent n'en accepte que « 7 types valides » (sans `250freedom` ni `400ans-marine-nationale`). Toute demande portant sur ces deux types est rejetée par la règle de validation stricte.
- **Proposition** : mettre la liste à jour (ou demander à l'agent de lire `data/metadata/agenda.yaml`, l'outil `cat` étant autorisé), puis lancer `make aw-compile`. Ajouter en CI un contrôle qui compare les `options` du formulaire à `data/metadata/agenda.yaml` (voir 4.6).

### 2.2 Agent agenda déclenché sur toutes les issues — priorité haute, effort S
- **Fichier** : `.github/workflows/agent-agenda.md`, front matter `on: issues: types: [opened, edited]`
- **Constat** : la description annonce « issue with the "agenda" label », mais rien ne filtre ni dans le déclencheur ni dans le prompt (aucune vérification du label ou du préfixe `[Agenda]`). Une issue « Bug » ou « Livre » lance donc un agent Claude (coût, et risque de commentaire d'erreur hors sujet).
- **Proposition** : ajouter une condition d'activation sur le label `agenda` (par exemple `if: contains(github.event.issue.labels.*.name, 'agenda')`, syntaxe gh-aw à vérifier) et, en défense supplémentaire, demander à l'agent de faire un `noop` si le label est absent.
- **Incohérence annexe** : `tools.bash` autorise `cat`, `ls`… alors que le prompt interdit « AUCUNE commande shell ». Aligner l'un sur l'autre.

### 2.3 `preview.yml` ne couvre pas thème, i18n et scripts — priorité haute, effort S
- **Fichier** : `.github/workflows/preview.yml`, `on.pull_request.paths`
- **Constat** : la liste se limite à `content/`, `data/`, `static/`, `layouts/`, `config/` et `assets/`, alors que `deploy.yml` inclut aussi `scripts/**`, `themes/**` et `i18n/**`. `layouts/**` et `assets/**` n'existent pas à la racine.
- **Proposition** : aligner sur `deploy.yml` et ajouter `.github/workflows/**`. Avec les règles de protection de branche, on peut aussi supprimer complètement le filtre `paths` pour que le contrôle soit toujours requis.

### 2.4 `lastmod` faussé par le checkout superficiel — priorité haute, effort S
- **Fichier** : `.github/workflows/deploy.yml` (étape `actions/checkout@v5`), `config/_default/hugo.yaml` (`enableGitInfo: true`)
- **Constat (déduit, non vérifié sur un run CI)** : sans `fetch-depth: 0`, Hugo ne voit qu'un commit, donc toutes les pages reçoivent la date du dernier commit en `<lastmod>`. En local, avec l'historique complet, les dates sont bien variées (29 pages au 2026-06-11, 12 au 2026-03-29…).
- **Proposition** : `with: { fetch-depth: 0 }` dans `deploy.yml`, et dans `preview.yml` si l'on veut un rendu identique.

### 2.5 Actions non épinglées par SHA, pas de Dependabot — priorité moyenne, effort S
- **Constat** : `deploy.yml` et `preview.yml` utilisent des tags (`actions/checkout@v5`, `setup-node@v5`, `configure-pages@v6`, `setup-python@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5`). `copilot-setup-steps.yml` utilise `checkout@v6`, ce qui est incohérent. Seuls les `.lock.yml` (générés) et `setup-cli` sont épinglés par SHA. Il n'y a pas de `.github/dependabot.yml`.
- **Proposition** : épingler par SHA avec commentaire de version, et ajouter :
  ```yaml
  version: 2
  updates:
    - package-ecosystem: github-actions
      directory: /
      schedule: { interval: monthly }
      groups: { actions: { patterns: ["*"] } }
    - package-ecosystem: pip
      directory: /scripts
      schedule: { interval: monthly }
  ```
  Aucun sous-module n'existe, donc pas d'écosystème `gitsubmodule`. Attention : Dependabot ne doit pas toucher les `.lock.yml` (voir `.github/agents/agentic-workflows.agent.md`, qui prévoit déjà ce cas).

### 2.6 Hygiène des workflows — priorité moyenne, effort S
- **Hugo** : `HUGO_VERSION: 0.166.0` est identique dans `deploy.yml`, `preview.yml` et `Makefile`, et égal à la version locale. La valeur attendue dans la consigne (0.163.3) est celle, périmée, de `tech.md` (voir 3.5). Le `.deb` est téléchargé sans vérification de somme de contrôle.
- **Étapes inutiles** : Dart Sass (aucun fichier `.scss`, aucun `css.Sass` dans le thème), Node.js et `npm ci` (aucun `package.json`). Les supprimer accélère les builds et réduit la surface d'attaque.
- **Permissions** : `preview.yml` demande `pull-requests: write` au niveau workflow sans jamais commenter. Le passer à `contents: read` seul. Dans `deploy.yml`, déplacer `pages: write` et `id-token: write` au niveau du job `deploy`.
- **Cache et robustesse** : `HUGO_CACHEDIR` est défini mais pas persisté (pas d'`actions/cache`). Aucun `timeout-minutes`, pas de `concurrency` dans `preview.yml` (`group: preview-${{ github.ref }}`, `cancel-in-progress: true`). La boucle `for f in $(find …)` casse sur les noms contenant des espaces.
- **gh-aw** : `copilot-setup-steps.yml` installe `setup-cli` **v0.76.1** alors que le compilateur et les lock files sont en **v0.89.21**. `.github/aw/actions-lock.json` contient d'anciennes images (0.25.x) absentes des lock files actuels (0.28.23) : à purger via `make aw-recompile`. Les `.lock.yml` sont **à jour** (`gh aw status`, hash de front matter cohérent, commit `8a2e477` commun pour `agent-agenda`).

### 2.7 Validation CI insuffisante — priorité moyenne, effort M
- **Existant** (`preview.yml`, job `validate-content`) : présence de `---` et `title:`, parsing YAML de `data/`, présence et format de `update` dans l'agenda.
- **Manques observés** (chacun confirmé par un défaut réel trouvé lors de l'audit) :
  - Ordre chronologique de `data/agenda.yaml` : 2 inversions (`2026-06-14` → `2026-06-13` « Conférence de Patrick Villiers » ; `2026-09-17` → `2026-09-07` « Commémoration de la Chesapeake »).
  - Format des dates : 10 valeurs `début/fin` avec heure de fin (`2025-12-18T18:00:00/2025-12-18T20:00:00`) non documentées, dont une sans secondes (`2026-05-20T09:45/2026-05-20T16:00`). `format-date.html` et `head-jsonld.html` les gèrent, mais la forme n'est pas spécifiée.
  - Cohérence metadata ↔ données ↔ i18n ↔ `colors.css` (aujourd'hui correcte, rien ne la garantit).
  - Parité FR/EN des fichiers `content/` et des clés i18n (aujourd'hui correcte).
  - Liens internes et externes : ajouter `lychee` ou `htmltest` sur `public/` (liens externes en tâche planifiée hebdomadaire pour éviter les faux positifs).
  - `yamllint` sur `data/`, `i18n/`, `config/`, `.github/`.
- **Proposition** : un seul script `scripts/check_data.py` (voir 4.6), appelé en CI et via `make check`.

### 2.8 Modèles d'issues et de PR — priorité moyenne, effort S
- **`PULL_REQUEST_TEMPLATE/ajout-agenda.md` est périmé** : il cite 7 types et « 9 champs (`date`, `dateEnd`, `titre`, `type`, `description`, `lieu`, `heure`, `lat`, `lon`) ». C'est l'ancien schéma : il n'y a plus de `dateEnd`/`heure`, les noms sont `title`/`location`, et il manque `link` et `update`.
- Les 5 formulaires d'issue sont bien documentés dans `CONTRIBUTING.md` (tableau lignes 396–402, y compris `add-agenda-event.yml` et `ajout-livre.yml`). En revanche, l'arborescence de `structure.md` (ligne `ISSUE_TEMPLATE/`) ne liste que `bug-site`, `modification-contenu` et `nouvelle-page`.
- Pas de `ISSUE_TEMPLATE/config.yml` : ajouter `blank_issues_enabled: false` et un lien de contact, pour orienter les contributeurs non techniques.
- `CONTRIBUTING.md` (ligne 464) affirme que le badge « Nouveau » apparaît « sur la page d'accueil ». Selon `structure.md`, l'accueil ne montre pas de badge mais colore la date (`.event-date--new`). À reformuler.

### 2.9 Fichiers parasites — priorité basse
`.github/.DS_Store`, `.kiro/.DS_Store`, `.kiro/hooks/.DS_Store` et `/.DS_Store` sont présents localement mais **non versionnés** (`git ls-files | grep DS_Store` est vide, et `.DS_Store` est dans `.gitignore`). Aucune action requise côté dépôt.
`.gitignore` contient deux fois `.gitignore` (qui ignore donc le fichier lui-même, sans effet puisqu'il est suivi) ainsi qu'une entrée redondante `.kiro/tmp/public_audit` (couverte par `.kiro/tmp/*`). À nettoyer.

---

## Périmètre 3 — `.kiro/`

Vérifié par lecture de tous les steering et hooks, et par une comparaison programmatique des paires de hooks (prompts, `enabled`, déclencheurs).

### 3.1 Hooks en double format — priorité haute, effort S
Comparaison legacy (`*.kiro.hook`) / v2 (`*.json`) :

| Hook | Legacy | v2 | Prompt identique | Risque |
|---|---|---|---|---|
| check-hugo-version | userTriggered, actif | `Manual`, actif | oui | doublon dans l'UI |
| export-books-excel | fileEdited, actif | PostFileSave, actif | oui | **double exécution** |
| sync-contributing-docs | fileEdited, actif | PostFileSave, actif | oui | **double exécution** (agent) |
| sync-lieux-de-memoire-data | fileEdited, actif | PostFileSave, actif | oui | **double exécution** (agent) |
| sync-fr-to-en-create | fileCreated, **actif** | PostFileCreate, **inactif** | oui | incohérent avec la paire suivante |
| sync-fr-to-en-update | fileEdited, **inactif** | PostFileSave, **actif** | oui | — |
| ajout-evenement-agenda | userTriggered | absent | — | — |
| analyse-faisabilite | userTriggered | absent | — | — |
| process-tasks-input | userTriggered | absent | — | — |

- **Proposition** : migrer tout en v2 et supprimer les 9 `*.kiro.hook`. Un fichier par domaine suffit, par exemple `.kiro/hooks/sync.json` qui regroupe les hooks de synchronisation, puisque le schéma accepte une liste `hooks`.
- **À vérifier** : `check-hugo-version.json` utilise `"trigger": "Manual"`, absent de la liste de déclencheurs PascalCase fournie (PreToolUse, PostToolUse, SessionStart, Stop, UserPromptSubmit, PreTaskExec, PostTaskExec, PostFileCreate, PostFileSave, PostFileDelete). Si `Manual` n'est pas reconnu, les trois hooks « userTriggered » (agenda, faisabilité, tâches) n'ont pas d'équivalent v2. Leur prompt existe déjà en steering `manual` : c'est l'invocation du steering (`#ajout-evenement-agenda`) qui devient le mécanisme, et les hooks peuvent disparaître.
- Les prompts des hooks sont des copies intégrales des steering (`analyse-faisabilite` et `process-tasks-input` identiques). Une seule source suffit : le steering. Si un hook est conservé, son prompt se réduit à « Applique `.kiro/steering/<nom>.md` ».

### 3.2 Steering `ajout-evenement-agenda.md` périmé — priorité haute, effort S
- **Constat** (diff avec le prompt du hook, plus récent, du 27/09) : le steering ne mentionne pas le champ `update`, ni dans l'exemple ni dans les règles. Il affirme aussi que « `link` reste toujours vide », ce qui contredit `structure.md` (`link` = URL externe), et que les anciens évènements n'ont « que 3 champs » (ils en ont 4 avec `update`). La liste de types y est en dur.
- **Proposition** : resynchroniser le steering sur le hook, remplacer la liste de types par « lire `data/metadata/agenda.yaml` », puis supprimer le hook.

### 3.3 Modes d'inclusion — priorité moyenne, effort S
47 Ko de steering ; `product.md`, `structure.md` (18,6 Ko) et `tech.md` n'ont pas de front matter, donc sont inclus en permanence.

| Fichier | Actuel | Proposé |
|---|---|---|
| `python.md` (348 o) | always | `fileMatch` `{scripts/**,**/*.py,Makefile}` |
| `redaction.md` | always | `fileMatch` `{content/**/*.md,data/**/*.yaml,i18n/*.yaml,.github/CONTRIBUTING.md}` |
| `data-metadata.md` | fileMatch | conserver (correct) |
| `git-commit.md` | manual | `auto` avec `name`/`description` (« rédiger un message de commit »), car le besoin est récurrent |
| `ajout-evenement-agenda.md`, `analyse-faisabilite.md`, `process-tasks-input.md` | manual | conserver `manual`, ou `auto` avec `name` |
| `structure.md` | always | scinder : noyau `always` (~60 lignes) + `structure-agenda.md` en `fileMatch` `{data/agenda.yaml,themes/sarfrance/layouts/activites/**,themes/sarfrance/assets/**/agenda*,**/phototheque*}` |
| `tech.md`, `product.md` | always | conserver |

### 3.4 `structure.md` : doublons et informations périmées — priorité moyenne, effort M
Vérifié en confrontant l'arborescence décrite au système de fichiers réel :
- `## Page Contribute Widget` apparaît deux fois (lignes 129 et 133) : la première section décrit en fait `page-header.html`.
- « git submodule » (lignes 45 et 84) est faux, voir 1.4.
- `layouts/ # Override directory (empty)` : le dossier racine `layouts/` **n'existe pas**.
- La liste des partials de l'arbre omet `asset.html`, `event-is-new.html` et `event-new-badge.html`, qui existent pourtant et sont décrits plus bas.
- La ligne `ISSUE_TEMPLATE/` omet `add-agenda-event.yml` et `ajout-livre.yml`.
- La convention de couleurs annonce des classes `tag-{key}` / `type-{key}`, mais la bibliothèque utilise `cat-{key}` (`partials/book.html` ligne 16 ; `colors.css` lignes 207–221). Toutes les clés `cat-*` existent, mais la règle documentée est incomplète.
- La section « Agenda Event Fields » ne documente ni la forme `début avec heure/fin avec heure`, ni l'heure sans secondes (voir 2.7).
- Les fichiers JS, CSS et layouts listés existent tous (vérifié avec `find themes/sarfrance`).
- **Redondance avec `tech.md`** : l'ordre de chargement JS, les helpers `SAR`, `FilterEngine` et `initPageCardMaps` sont décrits presque mot pour mot dans `tech.md` (§ JavaScript Rules) et dans `structure.md` (§ Key Conventions). Garder le détail dans `tech.md` et ne laisser qu'un renvoi `#[[file:.kiro/steering/tech.md]]` dans `structure.md`.

### 3.5 `tech.md` périmé — priorité moyenne, effort S
- « Hugo (extended) v0.163.3 (version épinglée en CI) » est faux : la CI, le `Makefile` et la version locale sont en **0.166.0**. Remplacer la version en dur par « voir `HUGO_VERSION_CI` dans `Makefile` », pour ne plus avoir à la maintenir.
- « Dart Sass available in CI » : Sass n'est pas utilisé (voir 2.6).
- « Leaflet (agenda, contact, lieux-de-memoire) » : `histoire/chronologie.html` charge aussi Leaflet.

### 3.6 `git-commit.md` incohérent — priorité moyenne, effort S
Le fichier impose « majuscule, en anglais » puis, dans les règles supplémentaires, « en français si le changement porte sur l'association ». La règle de langue contient des fautes (« oit etre en francais »), ce qui contraste avec `redaction.md`. `process-tasks-input.md` impose des commits en français, et le `Makefile` (`UPDATE_COMMIT_MSG`) aussi, en minuscules. L'historique récent utilise l'anglais en minuscules. Il faut trancher une règle unique, la placer dans `AGENTS.md` (1.4) et la faire respecter par `.githooks/` (hook `commit-msg` avec une simple expression régulière Conventional Commits).

### 3.7 `.kiro/tmp/` et `.kiro/audits/` — priorité basse, effort S
- Ces dossiers sont non versionnés (`.gitignore` lignes 38–39). `.kiro/tmp/public_audit` occupe **464 Mo** : c'est une copie d'un ancien `public/`, à supprimer.
- `audits/audit-2026-07-09.md` cite un hook `weekly-steering-audit` qui n'existe plus.
- `tmp/audit_check.py` contient déjà une ébauche de contrôle i18n et metadata : le promouvoir en `scripts/check_data.py` (voir 4.6).
- `bordereau-verif-histoire.md` et `courriel-verif-histoire.txt` sont des livrables ponctuels : les archiver hors du dépôt.

### 3.8 `agents/` vide — opportunité, priorité basse, effort M
Deux agents personnalisés apporteraient de la valeur :
- **relecteur-redaction** : outils en lecture seule, qui applique `#[[file:.kiro/steering/redaction.md]]` (typographie, anglicismes, terminologie d'époque) et produit une liste de corrections, sans écrire.
- **traducteur-fr-en** : écriture limitée à `content/en/**`, `data/en/**` et `i18n/en.yaml`. Il reprendrait le prompt de `agent-translate.md` (règles « Contenu anglais » de `redaction.md`) et remplacerait les prompts dupliqués des hooks `sync-fr-to-en-*` et `sync-lieux-de-memoire-data`, qui deviendraient un simple appel.

---

## Périmètre 4 — Métadonnées

### 4a. Métadonnées de données

Vérifié par un script Python temporaire (venv activé, supprimé ensuite) qui croise données, `data/metadata/*.yaml`, `i18n/*.yaml` et `colors.css`, avec des clés urlisées sans accents.

**4.1 Déclaration des clés — conforme.** Pour agenda (9), books (11), notices (15), chronologie (13) et lieux-de-mémoire (10) : aucune clé utilisée non déclarée, aucune clé déclarée inutilisée, libellés FR et EN présents pour chaque clé.

**4.2 Classes CSS — conforme, avec un écart de convention.** `type-*` (agenda) et `tag-*` (notices, chronologie, lieux) sont présentes. Les 11 catégories de livres utilisent `cat-*` (présentes), et non `tag-*` comme l'indique la règle (voir 3.4). `marine` existe dans les deux préfixes. — Priorité basse : documenter.

**4.3 Agenda — champs.** 169 évènements, `update` toujours en dernière position. Les champs étendus manquent sur 33 évènements, tous antérieurs ou égaux à 2025 (2018 : 2, 2019 : 3, 2020 : 5, 2021 : 2, 2022 : 6, 2023 : 3, 2024 : 6, **2025 : 6**). `structure.md` demande de les compléter « as the information becomes available » : les 6 évènements de 2025 sont prioritaires. Un seul `lat: 0`, cohérent (« Réunion des délégués régionaux en visioconférence »). Le champ `photos` (30 évènements) est documenté dans `structure.md` mais ni dans `agent-agenda.md` ni dans le steering d'ajout. — Priorité moyenne, effort M (contenu).

**4.4 Agenda — ordre et formats.** 2 inversions chronologiques et 10 dates `T…/…T…` non documentées (voir 2.7). — Priorité moyenne, effort S.

**4.5 Compteurs en dur.** `data/notices.yaml` indique `count: 156` alors qu'il y a **158** notices. Le template utilise `len` et ne lit pas `count`, qui est donc une métadonnée morte et fausse. `data/books.yaml` : `count: 453` est exact, mais `scripts/export_books_excel.py` (ligne 76) lit `count` au lieu de `len(books)`, d'où un risque de valeur fausse dans l'onglet « Résumé » du fichier Excel. — Priorité moyenne, effort S : supprimer `count` ou le calculer.

**4.6 Proposition : schéma et contrôle automatisé — priorité moyenne, effort M.**
- `scripts/schemas/agenda.schema.json` (et équivalents) : `date` avec motif `^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?(/\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?)?$`, `type` en `enum` alimenté depuis la metadata, `update` obligatoire, `additionalProperties: false`.
- `scripts/check_data.py` (dépendances `pyyaml` et `jsonschema` épinglées dans `scripts/requirements.txt`), qui contrôle :
  1. la validation par schéma ;
  2. clé utilisée ⊆ metadata, et metadata ⊆ i18n FR ∩ EN ;
  3. la présence de la classe CSS `type-`/`tag-`/`cat-` ;
  4. l'ordre chronologique de l'agenda et la place de `update` en dernier ;
  5. la parité des fichiers `content/fr` ↔ `content/en` et des clés i18n ;
  6. la structure de `data/fr/lieux-de-memoire.yaml` ↔ `data/en/…` (aujourd'hui identique : 12 régions, mêmes coordonnées et tags) ;
  7. les `options` des formulaires d'issue ↔ la metadata.
- Appel depuis `preview.yml` (job `validate-content`), `make check` et, éventuellement, un hook Kiro `PostFileSave` sur `data/**`.

### 4b. Métadonnées SEO / web

Vérifié par lecture des partials et de la configuration, puis par un build réel `hugo --minify --destination /tmp/sarfrance-audit` (FR 82 pages, EN 80, 0 avertissement ; dossier supprimé ensuite). Pages inspectées : `/`, `/en/`, `/activites/agenda-2026/`, `/histoire/biographies/bouille/`.

**4.7 Front matter — bon état.** 60 fichiers FR et 60 EN appariés 1:1. `title` et `description` sont présents partout, aucune description dupliquée, toutes entre 50 et 160 caractères, sauf `en/histoire/chronologie.md` (41 caractères, un peu court).

**4.8 `lastUpdate` inutilisé — priorité moyenne, effort S.** `redaction.md` l'exige dans le squelette des `_index.md`, mais seuls 6 fichiers par langue le portent et **aucun template ni la configuration ne le lit** (`grep lastUpdate themes config` ne renvoie rien). Proposition :
```yaml
# config/_default/hugo.yaml
frontmatter:
  lastmod: [lastUpdate, lastmod, ":git", ":fileModTime"]
```
Combinée à `fetch-depth: 0` (2.4), cette configuration rend `<lastmod>` du sitemap fiable. On peut ensuite exposer `article:modified_time` et `dateModified` en JSON-LD.

**4.9 `og:image` dupliqué — priorité moyenne, effort S.** `partials/head-favicons.html` (3 dernières lignes) réémet `og:image`, `og:image:width` et `og:image:height`, déjà produits par `head-meta.html`. Chaque page a donc deux `og:image`, et si une page définit `image:`, le doublon par défaut la contredit. Supprimer ces lignes de `head-favicons.html`. Dans `head-meta.html`, n'émettre `width`/`height` 1200×630 que pour l'image par défaut (dont les dimensions réelles, vérifiées, sont bien 1200×630).

**4.10 Balises présentes et correctes.** `canonical`, `robots` (`noindex` automatique sur preprod et localhost), `hreflang` fr/en + `x-default` → FR sur toutes les pages (aucune page sans hreflang), Open Graph et Twitter `summary_large_image`, `og:locale` `fr_FR`/`en_US`, sitemap index → `/fr/sitemap.xml` + `/en/sitemap.xml` (58 URL chacun, avec `xhtml:link` alternates), et `robots.txt` pointant vers le sitemap.

**4.11 Améliorations JSON-LD — priorité basse à moyenne, effort S à M.**
- Les 272 blocs générés sont du JSON valide.
- `Event` : `eventAttendanceMode` vaut toujours `OfflineEventAttendanceMode`, y compris pour la visioconférence (`lat: 0`). Le passer à `OnlineEventAttendanceMode` dans ce cas. Ajouter une `url` par évènement (ancre de la carte, désormais disponible depuis `c42cd0c`) et `location.address` (Google recommande une adresse pour les résultats enrichis). Le filtre `where … "date" "le" "AAAA-12-31"` compare des chaînes : un évènement du 31 décembre avec une heure serait exclu.
- `Organization` : `sameAs` ne contient que `sar.org`, déjà `parentOrganization`. Ajouter les profils officiels, s'ils existent, et `foundingDate`. `logo` pointe vers l'image Open Graph au lieu d'un logo carré.
- `Person` (biographies) : pas de `birthDate`/`deathDate`, et `mainEntityOfPage` n'est ajouté que si `author` est présent, logique sans rapport. Exposer des champs de front matter optionnels (`birthDate`, `deathDate`, `sameAs` Wikipédia).
- `og:type` vaut `article` partout hors accueil. Ajouter `og:locale:alternate`.
- `Organization` et `WebSite` sont construits à la main par interpolation de chaînes, alors que le reste du fichier utilise `dict | jsonify`. Unifier pour éviter tout problème d'échappement.

**4.12 Google Analytics — à examiner, priorité moyenne.** `services.googleAnalytics.ID` est configuré et `baseof.html` charge `_internal/google_analytics.html` sans mécanisme de consentement visible dans le thème. Au regard des recommandations de la CNIL, vérifier la présence d'un recueil de consentement ou basculer vers une mesure exemptée. Non vérifié : contenu de `contact/mentions-legales.md` sur les témoins.

**4.13 Description par langue.** `languages.yaml` fournit une `params.description` FR et EN, mais elle est quasi inutilisée puisque toutes les pages ont une description. Elle reste le repli JSON-LD de `Organization`. Pas d'action requise.

---

## Tableau récapitulatif

| # | Constat | Fichier(s) | Priorité | Effort |
|---|---|---|---|---|
| 2.1 | Agent agenda : 7 types au lieu de 9 | `.github/workflows/agent-agenda.md` | Haute | S |
| 2.2 | Agent agenda déclenché sur toute issue | `agent-agenda.md` | Haute | S |
| 2.3 | `preview.yml` ignore themes, i18n et scripts | `.github/workflows/preview.yml` | Haute | S |
| 2.4 | `lastmod` faussé (checkout superficiel) | `deploy.yml` | Haute | S |
| 1.1 | Skill Claude non chargé | `.claude/skills/` | Haute | S |
| 1.4 | `CLAUDE.md` : `make doctor` absent, faux sous-module | `CLAUDE.md`, `Makefile` | Haute | S |
| 3.1 | Hooks Kiro en double, double exécution | `.kiro/hooks/` | Haute | S |
| 3.2 | Steering ajout-agenda sans `update` | `.kiro/steering/ajout-evenement-agenda.md` | Haute | S |
| 2.8 | PR template agenda périmé | `.github/PULL_REQUEST_TEMPLATE/ajout-agenda.md` | Moyenne | S |
| 2.5 | Actions non pinées, pas de Dependabot | workflows, `dependabot.yml` | Moyenne | S |
| 2.6 | Étapes CI inutiles, permissions, version gh-aw | workflows | Moyenne | S |
| 2.7 / 4.6 | Contrôles données/parité/liens absents en CI | `scripts/check_data.py`, `preview.yml` | Moyenne | M |
| 3.3 | Steering toujours inclus sans nécessité | `.kiro/steering/*.md` | Moyenne | S |
| 3.4 | `structure.md` : doublons et faits périmés | `.kiro/steering/structure.md` | Moyenne | M |
| 3.5 | `tech.md` : Hugo 0.163.3 périmé | `.kiro/steering/tech.md` | Moyenne | S |
| 3.6 | Règle de commit contradictoire | `git-commit.md`, `CLAUDE.md` | Moyenne | S |
| 1.4 | Pas de source unique `AGENTS.md` | racine | Moyenne | M |
| 4.5 | `count` des notices faux (156/158) | `data/notices.yaml`, `export_books_excel.py` | Moyenne | S |
| 4.8 | `lastUpdate` non exploité | `config/_default/hugo.yaml` | Moyenne | S |
| 4.9 | `og:image` émis deux fois | `partials/head-favicons.html` | Moyenne | S |
| 4.12 | GA sans consentement visible | `hugo.yaml`, `baseof.html` | Moyenne | M |
| 4.3 / 4.4 | Agenda : 6 évènements 2025 incomplets, 2 inversions | `data/agenda.yaml` | Moyenne | S/M |
| 1.2 | Hook Claude qui committe seul | `.claude/settings.json` | Moyenne | S |
| 4.11 | JSON-LD Event, Person, Organization perfectibles | `partials/head-jsonld.html` | Basse | M |
| 3.7 | 464 Mo dans `.kiro/tmp/public_audit` | `.kiro/tmp/` | Basse | S |
| 3.8 | Agents Kiro relecteur et traducteur | `.kiro/agents/` | Basse | M |
| 1.3 / 1.5 / 2.9 | `.gitignore` : local Claude, doublons | `.gitignore` | Basse | S |

## Gains rapides (moins d'une heure chacun)

1. Ajouter `250freedom` et `400ans-marine-nationale` dans `agent-agenda.md` (lignes 103 et 155), filtrer sur le label `agenda`, puis `make aw-compile`.
2. Aligner `on.pull_request.paths` de `preview.yml` sur `deploy.yml` et retirer `pull-requests: write`.
3. Ajouter `fetch-depth: 0` au checkout de `deploy.yml`, et `frontmatter.lastmod: [lastUpdate, lastmod, ":git"]` dans `hugo.yaml`.
4. Supprimer les 3 lignes `og:*` de `head-favicons.html`.
5. Supprimer les 6 `*.kiro.hook` qui ont un équivalent `.json`, et harmoniser `enabled` sur `sync-fr-to-en-create.json`.
6. Déplacer le skill vers `.claude/skills/optimize-images/SKILL.md`, avec son front matter.
7. Corriger `CLAUDE.md`, `tech.md` et `structure.md` : retirer « git submodule » et `make doctor` (ou restaurer la cible), remplacer « Hugo 0.163.3 » par un renvoi au `Makefile`, et supprimer le titre « Page Contribute Widget » en double.
8. Mettre à jour `PULL_REQUEST_TEMPLATE/ajout-agenda.md` (champs et types actuels) et ajouter `update` au steering `ajout-evenement-agenda.md`.
9. Supprimer `count` de `data/notices.yaml` (faux et inutilisé), et calculer `len(books)` dans `export_books_excel.py`.
10. Supprimer `.kiro/tmp/public_audit` (464 Mo) et ajouter `.claude/settings.local.json` au `.gitignore`.

## Ce qui n'a pas été vérifié

- Comportement réel en CI : `lastmod` en clone superficiel, présence de PyYAML sur le runner, exécution effective de l'agent agenda sur les issues hors agenda. Ces points sont déduits de la configuration.
- Prise en charge du déclencheur `Manual` et d'`AGENTS.md` par la version de Kiro installée, ainsi que la validité du champ `if` dans les hooks Claude Code.
- Contenu rédactionnel des pages (typographie, anglicismes), liens externes et mentions légales relatives aux témoins.
