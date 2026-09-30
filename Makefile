# SAR France — Commandes de développement local
#
# `make` sans argument affiche l'aide (`make help`). Les lignes « ## » placées
# juste au-dessus d'une cible la documentent dans l'aide ; une ligne « ##@ »
# y ouvre une nouvelle section.

HUGO_VERSION_CI := 0.166.0

# Répertoire jetable pour les builds de vérification (hors public/)
CHECK_DIR := /tmp/sarfrance-build-check

# Extension gh Agentic Workflows (gh-aw)
GH_AW_REPO := github/gh-aw

# Fichiers que `make update` peut modifier : version Hugo épinglée (Makefile,
# deploy.yml, preview.yml) et workflows agentiques compilés (.lock.yml,
# .gitattributes, .github/aw/). `make push` committe leurs changements.
UPDATE_FILES := Makefile .gitattributes .github/workflows .github/aw

# Message du commit créé par `make push` lorsque `make update` a modifié ces fichiers
UPDATE_COMMIT_MSG := chore(ci): mise à jour de l'outillage (make update)

# Cible par défaut : l'aide, afin qu'un simple `make` ne lance rien
.DEFAULT_GOAL := help

.PHONY: help run serve build build-prod build-check clean version \
        update update-hugo update-gh update-gh-ext update-gh-aw \
        tools-version doctor \
        aw-compile aw-recompile \
        bump-hugo-ci \
        agenda-dates agenda-dates-check \
        push push-check

# ---------------------------------------------------------------------------
##@ Développement local
# ---------------------------------------------------------------------------

## Afficher cette aide (cible par défaut)
help:
	@awk 'BEGIN { printf "Usage : make \033[36m<cible>\033[0m\n" } \
		/^##@ / { printf "\n\033[1m%s\033[0m\n", substr($$0, 5); next } \
		/^## /  { doc[++n] = substr($$0, 4); next } \
		/^[a-zA-Z0-9_-]+:/ && n { \
			name = $$1; sub(/:.*/, "", name); \
			printf "  \033[36m%-20s\033[0m %s\n", name, doc[1]; \
			for (i = 2; i <= n; i++) printf "  %-20s %s\n", "", doc[i]; \
		} \
		{ n = 0 }' $(MAKEFILE_LIST)

## Lancer le site en local (alias de `serve`)
run: serve

## Serveur de développement (avec brouillons)
serve:
	hugo server --buildDrafts

## Build de production
build:
	hugo --minify

## Build de production avec le baseURL du site
build-prod:
	hugo --minify --baseURL "https://www.sarfrance.org/"

## Build propre (nettoyage du cache)
## ⚠️ N'utilisez PAS cette cible pendant qu'un `hugo server` tourne : le nettoyage
## de public/ et du cache d'assets casse les pages déjà servies par le serveur
## (empreintes de fichiers introuvables → pages sans CSS ni JS).
clean:
	hugo --gc --cleanDestinationDir

## Build de vérification isolé — sûr même avec un `hugo server` en cours
## car il n'écrit ni dans public/ ni dans le cache partagé.
build-check:
	hugo --minify --destination $(CHECK_DIR) --cacheDir $(CHECK_DIR)/cache
	@echo "✅ Build de vérification disponible dans $(CHECK_DIR)"

## Vérifier la version de Hugo (locale vs version épinglée en CI)
version:
	@echo "Version Hugo locale :"
	@hugo version
	@echo "Version épinglée en CI (deploy.yml / preview.yml) : $(HUGO_VERSION_CI)"

# ---------------------------------------------------------------------------
##@ Agenda — attribut technique `update`
# ---------------------------------------------------------------------------
## Recalculer l'attribut `update` de chaque événement depuis l'historique git
agenda-dates:
	@test -d .venv || { echo "❌ Environnement virtuel .venv manquant"; exit 1; }
	@. .venv/bin/activate && python scripts/agenda_update_dates.py --write
## Afficher les dates calculées sans modifier data/agenda.yaml
agenda-dates-check:
	@test -d .venv || { echo "❌ Environnement virtuel .venv manquant"; exit 1; }
	@. .venv/bin/activate && python scripts/agenda_update_dates.py --verbose
# ---------------------------------------------------------------------------
##@ Mise à jour de l'outillage (macOS / Homebrew)
# ---------------------------------------------------------------------------

## Tout mettre à jour : Hugo, GitHub CLI, ses extensions, la version CI, puis recompiler les workflows
update: update-hugo bump-hugo-ci update-gh update-gh-ext aw-compile
	@echo "✅ Outillage mis à jour."

## Mettre à jour Hugo (extended) via Homebrew
update-hugo:
	@command -v brew >/dev/null 2>&1 || { echo "❌ Homebrew requis (https://brew.sh)"; exit 1; }
	@echo "⬆️  Mise à jour de Hugo…"
	@brew update
	@brew upgrade hugo || brew install hugo
	@hugo version

## Mettre à jour la GitHub CLI (gh) via Homebrew
update-gh:
	@command -v brew >/dev/null 2>&1 || { echo "❌ Homebrew requis (https://brew.sh)"; exit 1; }
	@echo "⬆️  Mise à jour de GitHub CLI…"
	@brew update
	@brew upgrade gh || brew install gh
	@gh --version

## Mettre à jour toutes les extensions gh installées
update-gh-ext:
	@command -v gh >/dev/null 2>&1 || { echo "❌ GitHub CLI (gh) requise — lancez d'abord 'make update-gh'"; exit 1; }
	@echo "⬆️  Mise à jour des extensions gh…"
	@gh extension upgrade --all
	@gh extension list

## Installer ou mettre à jour l'extension Agentic Workflows (gh aw)
update-gh-aw:
	@command -v gh >/dev/null 2>&1 || { echo "❌ GitHub CLI (gh) requise — lancez d'abord 'make update-gh'"; exit 1; }
	@if gh extension list | grep -q "$(GH_AW_REPO)"; then \
		echo "⬆️  Mise à jour de l'extension $(GH_AW_REPO)…"; \
		gh extension upgrade $(GH_AW_REPO); \
	else \
		echo "📦 Installation de l'extension $(GH_AW_REPO)…"; \
		gh extension install $(GH_AW_REPO); \
	fi
	@gh aw version || true

## Afficher la version des outils installés localement
tools-version:
	@echo "Hugo   :"; hugo version 2>/dev/null || echo "  non installé"
	@echo "gh     :"; gh --version 2>/dev/null | head -n 1 || echo "  non installé"
	@echo "gh aw  :"; gh aw version 2>/dev/null || echo "  non installée"
	@echo "Extensions gh :"; gh extension list 2>/dev/null || echo "  aucune"

## Vérifier la présence des outils requis
doctor:
	@echo "🔎 Vérification de l'outillage…"
	@command -v brew >/dev/null 2>&1 && echo "  ✅ Homebrew" || echo "  ❌ Homebrew manquant"
	@command -v hugo >/dev/null 2>&1 && echo "  ✅ Hugo" || echo "  ❌ Hugo manquant"
	@command -v gh   >/dev/null 2>&1 && echo "  ✅ gh" || echo "  ❌ gh manquant"
	@gh extension list 2>/dev/null | grep -q "$(GH_AW_REPO)" && echo "  ✅ extension gh-aw" || echo "  ⚠️  extension gh-aw manquante (make update-gh-aw)"

# ---------------------------------------------------------------------------
##@ Synchronisation de la version Hugo épinglée en CI
# ---------------------------------------------------------------------------

## Aligner deploy.yml, preview.yml et le Makefile sur la version Hugo locale
bump-hugo-ci:
	@command -v hugo >/dev/null 2>&1 || { echo "❌ Hugo requis — lancez 'make update-hugo'"; exit 1; }
	@HUGO_LOCAL=$$(hugo version | sed -n 's/^hugo v\([0-9][0-9.]*\).*/\1/p'); \
	if [ -z "$$HUGO_LOCAL" ]; then echo "❌ Impossible de déterminer la version Hugo locale"; exit 1; fi; \
	echo "📌 Version Hugo locale : $$HUGO_LOCAL"; \
	sed -i '' -E "s/^([[:space:]]*HUGO_VERSION:[[:space:]]*).*/\1$$HUGO_LOCAL/" .github/workflows/deploy.yml; \
	sed -i '' -E "s/^([[:space:]]*HUGO_VERSION:[[:space:]]*).*/\1$$HUGO_LOCAL/" .github/workflows/preview.yml; \
	sed -i '' -E "s/^(HUGO_VERSION_CI[[:space:]]*:=[[:space:]]*).*/\1$$HUGO_LOCAL/" Makefile; \
	echo "✅ deploy.yml, preview.yml et Makefile alignés sur Hugo $$HUGO_LOCAL"

# ---------------------------------------------------------------------------
##@ Workflows agentiques GitHub (gh aw)
# ---------------------------------------------------------------------------

## Compiler les workflows agentiques (.md → .lock.yml)
aw-compile:
	@command -v gh >/dev/null 2>&1 || { echo "❌ GitHub CLI (gh) requise — lancez d'abord 'make update-gh'"; exit 1; }
	@gh extension list | grep -q "$(GH_AW_REPO)" || { echo "❌ Extension gh-aw manquante — lancez 'make update-gh-aw'"; exit 1; }
	@echo "🛠  Compilation des workflows agentiques…"
	@gh aw compile
	@echo "✅ Workflows compilés (fichiers .lock.yml régénérés)."

## Recompiler proprement (purge puis recompilation de tous les workflows)
aw-recompile:
	@command -v gh >/dev/null 2>&1 || { echo "❌ GitHub CLI (gh) requise — lancez d'abord 'make update-gh'"; exit 1; }
	@gh extension list | grep -q "$(GH_AW_REPO)" || { echo "❌ Extension gh-aw manquante — lancez 'make update-gh-aw'"; exit 1; }
	@echo "🛠  Recompilation des workflows agentiques…"
	@gh aw compile --purge
	@echo "✅ Workflows recompilés."

## Vérifier la présence des outils requis
doctor:
	@echo "🔎 Vérification de l'outillage…"
	@command -v brew >/dev/null 2>&1 && echo "  ✅ Homebrew" || echo "  ❌ Homebrew manquant"
	@command -v hugo >/dev/null 2>&1 && echo "  ✅ Hugo" || echo "  ❌ Hugo manquant"
	@command -v gh   >/dev/null 2>&1 && echo "  ✅ gh" || echo "  ❌ gh manquant"
	@gh extension list 2>/dev/null | grep -q "$(GH_AW_REPO)" && echo "  ✅ extension gh-aw" || echo "  ⚠️  extension gh-aw manquante (make update-gh-aw)"
# ---------------------------------------------------------------------------
##@ Publication
# ---------------------------------------------------------------------------

## Pousser la branche courante vers GitHub, après `update`
## Les changements que `update` apporte aux fichiers d'outillage (UPDATE_FILES :
## version Hugo de la CI, workflows compilés) sont committés automatiquement ;
## ces fichiers doivent donc être propres au départ.
push: push-check update
	@if [ -n "$$(git status --porcelain -- $(UPDATE_FILES))" ]; then \
		echo "📝 Commit des fichiers modifiés par make update…"; \
		git add -A -- $(UPDATE_FILES) && git commit -m "$(UPDATE_COMMIT_MSG)"; \
	else \
		echo "ℹ️  Aucun changement à committer après make update"; \
	fi
	@echo "⬆️  Envoi de la branche $$(git rev-parse --abbrev-ref HEAD) vers GitHub…"
	@git push

# Préalable interne à `push` (non listé dans l'aide) : les fichiers que `update`
# peut modifier ne doivent contenir aucun changement non committé, sans quoi le
# commit automatique les emporterait avec lui.
push-check:
	@if [ -n "$$(git status --porcelain -- $(UPDATE_FILES))" ]; then \
		echo "❌ Changements non committés dans les fichiers gérés par make update :"; \
		git status --short -- $(UPDATE_FILES); \
		echo "   Committez-les ou mettez-les de côté (git stash) avant make push."; \
		exit 1; \
	fi
