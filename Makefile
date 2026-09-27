# SAR France — Commandes de développement local

HUGO_VERSION_CI := 0.165.0

# Répertoire jetable pour les builds de vérification (hors public/)
CHECK_DIR := /tmp/sarfrance-build-check

# Extension gh Agentic Workflows (gh-aw)
GH_AW_REPO := github/gh-aw

.PHONY: serve build build-prod build-check clean version \
        update update-hugo update-gh update-gh-ext update-gh-aw \
        tools-version doctor \
        aw-compile aw-recompile \
        bump-hugo-ci \
        agenda-dates agenda-dates-check

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
# Agenda — attribut technique `update`
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
# Mise à jour de l'outillage (macOS / Homebrew)
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

# ---------------------------------------------------------------------------
# Synchronisation de la version Hugo épinglée en CI
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
# Workflows agentiques GitHub (gh aw)
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
