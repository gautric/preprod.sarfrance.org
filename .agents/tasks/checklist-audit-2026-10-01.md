# Checklist de validation — audit outillage et métadonnées (2026-10-01)

Source : `.agents/tasks/audit-outillage-metadonnees-2026-10-01.md`, repasse de contrôle le 2026-10-03 (HEAD `57c5ed7`).

Mode d'emploi : cochez `[x]` les modifications à appliquer, laissez `[ ]` celles à écarter. Pour les points « Décision », gardez une seule option. Effort : S (moins d'une heure), M (une demi-journée).

## État des lieux depuis la première checklist

Depuis la contre-vérification du 2026-10-01, trois commits ont été poussés :

- `472823f` **chore(.kiro): consolidate hooks and steering** — couvre **D1, D2, D3, D4**, crée `structure-agenda.md` (début de **D5**) et touche aussi partiellement **C3** / **C5**.
- `e956020` **chore(.claude): Hugo mismatch hook en français** — couvre **E2** (plus de commit automatique, le hook propose `make bump-hugo-ci` ou `make push`).
- `57c5ed7` **chore(.claude): optimize-images skill + .gitignore** — couvre **E1** et **E3**.

Résultat : lot D et lot E sont finis. Le **lot C reste largement ouvert**, et aucun point des lots A, B, F, G, H n'a été traité.

Corrections sur les constats initiaux après cette repasse :

- **C7** retiré de la liste : `CONTRIBUTING.md` dit maintenant « sur la page d'agenda et sur la page d'accueil », c'est cohérent avec `structure.md`.
- **E4** retiré : `.claude/settings.local.json` est désormais dans `.gitignore` (commit `57c5ed7`), le contenu local n'engage plus le dépôt.
- **D5** laissé ouvert : `structure-agenda.md` est bien créé et scopé, mais `structure.md` lui-même n'a pas été allégé.

---

## Lot A — Corrections fonctionnelles (priorité haute)

- [x] **A1.** Agent agenda : lecture de `data/metadata/agenda.yaml` au step 0, plus de liste de types en dur. Recompilation `make aw-compile` : 2 workflows, 0 warning (`8464469` + `ccbc391`).
- [x] **A2.** Filtre `if: contains(github.event.issue.labels.*.name, 'agenda')` au niveau workflow, `types: [opened, edited, labeled]`, safe-output `noop` et garde-fou dans le prompt (`8464469` + `ccbc391`).
- [x] **A3.** Incohérence bash corrigée en passant : la règle « AUCUNE commande shell » est carvée pour autoriser `cat`/`ls` sur `data/metadata/agenda.yaml` et `data/agenda.yaml` uniquement (`8464469`).
- [x] **A4.** `preview.yml` aligné sur `deploy.yml` : ajout de `scripts/**`, `themes/**`, `i18n/**` et `.github/workflows/**` dans `on.pull_request.paths`.
- [x] **A5.** `fetch-depth: 0` ajouté au checkout de `deploy.yml` (nécessaire pour `enableGitInfo: true` → `<lastmod>` du sitemap). Commentaire explicatif inline.
- [x] **A6.** 3 lignes `og:image`/`og:image:width`/`og:image:height` retirées de `head-favicons.html` (émises déjà par `head-meta.html` avec un alt). Vérifié sur 3 pages (`/`, `/en/`, `/activites/agenda-2026/`) : une seule balise par page.

## Lot B — Données

- [ ] **B1. Agenda, juin 2026** — deux « Conférence de Patrick Villiers » (13 et 14 juin). — S
  - Décision : [ ] doublon, en supprimer une (laquelle : ____)  [ ] deux séances distinctes, il suffit de les remettre dans l'ordre
- [x] **B2.** « Commémoration de la Chesapeake » (2026-09-07) déplacée avant « Conférence du cercle France-Amériques » (2026-09-14). Ordre chronologique de septembre 2026 restauré.
- [x] **B3.** `count: 156` supprimé de `data/notices.yaml` (il n'est lu par aucun template ; `revision` conservé).
- [x] **B4.** `scripts/export_books_excel.py` utilise `len(data["books"])` au lieu de `data["count"]` ; `count: 453` supprimé de `data/books.yaml`. Script relancé, les 14 feuilles sont bien produites.
- [ ] **B5. Événements 2025 incomplets** — 6 cas identifiés, en attente de contenu éditorial. À compléter (`description`, `location`, `link`, `lat`/`lon`) :
  - `2025-01-16` — Conférence sur le futur maréchal Berthier (Cincinnati)
  - `2025-02-11` — Validation des nouveaux statuts de SAR France
  - `2025-02-24` — Réunion des délégués régionaux de SAR France à Paris
  - `2025-02-27` — Spring leadership meeting à Louisville (KY)
  - `2025-05-25` — Memorial Day
  - `2025-11-26` — Réunion préparatoire du 250e anniversaire de la Déclaration d'Indépendance

## Lot C — Documentation des agents (dérive) — **traité**

- [x] **C1.** `doctor` retiré de `Makefile` (`.PHONY`) et de `CLAUDE.md` (bloc « Verify all required tools »).
- [x] **C2.** « git submodule » remplacé par « vendored directly in the repo » dans `CLAUDE.md`, `.kiro/steering/tech.md` et `.kiro/steering/structure.md` ; la phrase sur `static/` reformulée (plus de référence au sous-module) ; entrée `.gitmodules` retirée de `.github/CODEOWNERS`.
- [x] **C3.** `tech.md` : `v0.163.3` → renvoi à `HUGO_VERSION_CI` dans `Makefile` + `make bump-hugo-ci` ; « Dart Sass available in CI » retiré ; `chronologie` ajouté à la liste des pages chargeant Leaflet.
- [x] **C4.** `structure.md` : les deux titres fusionnés en « Page Header and Contribute Widget » ; entrée `layouts/` racine supprimée de l'arborescence et sa note reformulée en « No root `layouts/` directory exists today — if needed, create it » ; partials complétés (`asset.html`, `event-is-new.html`, `event-new-badge.html`) ; `ISSUE_TEMPLATE/` complété (`add-agenda-event.yml`, `ajout-livre.yml`) ; convention `cat-{key}` (bibliothèque) documentée à côté de `tag-`/`type-`.
- [x] **C5.** `ajout-evenement-agenda.md` : phrase « Le champ `link` reste toujours vide » retirée (link devient facultatif, non inventé) ; mention « 3 champs » corrigée en « quatre champs techniques (`date`, `title`, `type`, `update`) » ; bloc `photos` ajouté avec renvoi à `structure-agenda.md` et consigne de ne pas deviner les noms.
- [x] **C6.** `.github/PULL_REQUEST_TEMPLATE/ajout-agenda.md` réécrit : champ unique `date` ISO 8601 (toutes les formes), `type` renvoie à la metadata, `link`/`lat`/`lon`/`photos`/`update` ajoutés, checklist alignée.
- [x] **C8.** `git-commit.md` : règle de langue unique (FR pour `docs`/`data`/`i18n` + scopes éditoriaux ; EN pour `chore`/`refactor` + scopes techniques `theme`, `config`, `ci`, `steering`), typo « oit etre » corrigée, règle « majuscule initiale » conservée dans les deux langues. `CLAUDE.md` resynchronisé pour pointer `git-commit.md` comme source unique.
- [ ] *Optionnel* — hook `.githooks/commit-msg` qui vérifie le format Conventional Commits. Pas fait, dis-moi si tu le veux.

> C7 (phrase sur le badge « Nouveau » dans `CONTRIBUTING.md`) : retiré, déjà correct à la relecture.

## Lot D — Kiro (hooks et steering) — **traité, un reste**

- [x] **D1.** 6 doublons `*.kiro.hook` supprimés (`472823f`).
- [x] **D2.** `sync-fr-to-en-create.json` mis à jour (`472823f`).
- [x] **D3.** 3 hooks manuels (`ajout-evenement-agenda`, `analyse-faisabilite`, `process-tasks-input`) retirés de `.kiro/hooks/` ; les steering `inclusion: manual` correspondants servent de point d'entrée (`#ajout-evenement-agenda`, etc.) (`472823f`).
- [x] **D4.** Modes d'inclusion posés : `python.md` → `fileMatch` (`scripts/**`, `**/*.py`, `Makefile`), `redaction.md` → `fileMatch` (`content/**`, `data/**`, `i18n/*`, `CONTRIBUTING.md`), `git-commit.md` → `auto` (`472823f`).
- [ ] **D5. Scinder `structure.md`** — `structure-agenda.md` est créé et scopé proprement. Reste à alléger `structure.md` lui-même (il fait encore ~155 lignes, toujours inclus, et duplique `tech.md` sur l'ordre de chargement JS, les helpers `SAR` et `FilterEngine`). Garder un noyau toujours inclus + renvois vers `tech.md` et `structure-agenda.md`. — M

## Lot E — Claude — **traité**

- [x] **E1.** `.claude/skills/optimize-images/SKILL.md` avec front matter + commande portable (Python au lieu de `sed -i ''`) (`57c5ed7`).
- [x] **E2.** `PostToolUseFailure` ne committe plus rien : il envoie `additionalContext` qui propose `make bump-hugo-ci` ou `make push` (`e956020`).
- [x] **E3.** `.gitignore` nettoyé (doublons retirés, `.claude/settings.local.json` et `.claude/worktrees/` ajoutés) (`57c5ed7`).

> E4 (`settings.local.json`) : **retiré**, le fichier est désormais ignoré par le dépôt — c'est votre fichier local, hors périmètre.

## Lot F — Hygiène CI

- [x] **F1.** `deploy.yml` et `preview.yml` : étapes « Install Dart Sass », « Setup Node.js » et « Install Node.js dependencies » retirées ; variable d'env `NODE_VERSION` supprimée.
- [x] **F2.** `deploy.yml` : permissions baseline en `contents: read`, les droits `pages: write` + `id-token: write` ne portent que sur le job `deploy`. `preview.yml` : `permissions: contents: read` seulement (plus de `pull-requests: write`).
- [x] **F3.** `preview.yml` : `concurrency: { group: "preview-${{ github.ref }}", cancel-in-progress: true }` + `timeout-minutes` sur les deux jobs. `deploy.yml` : `timeout-minutes` sur `build` et `deploy`.
- [x] **F4.** Actions épinglées par SHA avec commentaire de version (`fbc6f3992d…` v5 pour `checkout`, `45bfe0192c…` v6 pour `configure-pages`, `ece7cb06ca…` v6 pour `setup-python`, `fc324d3547…` v5 pour `upload-pages-artifact`, `368f825286…` v5 pour `deploy-pages`).
- [x] **F5.** `.github/dependabot.yml` créé : `github-actions` et `pip` (`/scripts`), mensuel, groupé par écosystème. Exclusion des `github/gh-aw-actions/*` (pilotées par `gh aw`).
- [x] **F6.** `copilot-setup-steps.yml` : `setup-cli` passée en v0.89.21 (SHA `924af5fdc6…`) et `checkout` passé de `@v6` à `@fbc6f3992d…` (v5). `actions-lock.json` purgé : 2 entrées utiles restantes, plus de containers périmés 0.25.x / mcpg v0.2.6-v0.3.19 / github-mcp-server v0.32.0.
- [x] **F7.** `.github/ISSUE_TEMPLATE/config.yml` créé : `blank_issues_enabled: false` + 2 `contact_links` (PR directe pour les contributeurs techniques, formulaire de contact du site pour le reste).

## Lot G — Chantiers de fond (à planifier séparément)

- [x] **G1.** `scripts/check_data.py` + 5 schémas `scripts/schemas/*.schema.json` (`agenda`, `books`, `notices`, `chronologie`, `lieux-de-memoire`). 7 vérifications : (1) validation par schéma, (2) clé utilisée ⊆ metadata, (3) metadata ⊆ i18n FR ∩ EN, (4) classe CSS `type-`/`tag-`/`cat-` présente dans `colors.css`, (5) ordre chronologique de l'agenda + place de `update`, (6) parité `content/fr` ↔ `content/en` et clés i18n, (7) options du dropdown `type` dans `add-agenda-event.yml` ↔ `data/metadata/agenda.yaml`. `jsonschema` ajouté à `scripts/requirements.txt`. Nouvelle cible `make check`. Appel câblé dans `preview.yml` (job `validate-content` : setup-python + install deps + exécution, rapport Markdown redirigé vers `$GITHUB_STEP_SUMMARY`). Sur l'état courant, le script remonte **une seule erreur** : la violation chronologique Villiers (= B1), qui restera signalée tant que B1 n'est pas tranché.
- [ ] **G2. Contrôle des liens** (`lychee` ou `htmltest`) : liens internes à chaque PR, liens externes chaque semaine. — M
- [ ] **G3. Exploiter `lastUpdate`** — ajouter `frontmatter.lastmod: [lastUpdate, lastmod, ":git", ":fileModTime"]` dans `hugo.yaml` (complète A5). — S
- [ ] **G4. `AGENTS.md` racine** comme source unique, avec `CLAUDE.md` réduit à des imports `@…`. — M
- [ ] **G5. JSON-LD** — `Event` (mode en ligne pour les visioconférences, `url`, `address`, borne du 31 décembre), `Person` (`birthDate`/`deathDate`), `Organization` (logo carré, `sameAs`). — M
- [ ] **G6. Agents Kiro** — `relecteur-redaction` (lecture seule) et `traducteur-fr-en`. — M
- [ ] **G7. Google Analytics et consentement (CNIL)** — GA4 est chargé sans recueil de consentement visible. — M
  - Décision : [ ] ajouter un bandeau de consentement  [ ] passer à une mesure d'audience exemptée de consentement  [ ] retirer GA

## Lot H — Nettoyage local (hors dépôt, irréversible)

- [x] **H1.** `.kiro/tmp/public_audit` supprimé (464 Mo libérés). Dossier non versionné (gitignored via `.kiro/tmp/*`), aucun impact sur le dépôt.
- [ ] **H2. Archiver hors du dépôt** `bordereau-verif-histoire.md` et `courriel-verif-histoire.txt`, et transformer `audit_check.py` en base de G1.

---

## Ordre d'exécution proposé

1. **Vague 1** — Finir le lot C (C1 à C8 sauf C7) et lot A : correction fonctionnelle de l'agent agenda, hygiène de la doc, PR unique, build `hugo --minify`, `make aw-compile`. Un seul workflow.
2. **Vague 2** — Lot B + lot F : données propres et CI robuste. Un workflow par lot.
3. **Vague 3** — Lot G, chantier par chantier (G3 et G1 d'abord, le reste à planifier).
4. **Lot H** — je peux le faire directement après votre accord.
