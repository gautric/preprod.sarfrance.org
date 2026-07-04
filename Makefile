# SAR France — Commandes de développement local

HUGO_VERSION_CI := 0.163.3

.PHONY: serve build build-prod clean version

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
clean:
	hugo --gc --cleanDestinationDir

## Vérifier la version de Hugo (locale vs version épinglée en CI)
version:
	@echo "Version Hugo locale :"
	@hugo version
	@echo "Version épinglée en CI (deploy.yml / preview.yml) : $(HUGO_VERSION_CI)"
