# SAR France — Commandes de développement local

.PHONY: serve build clean

## Serveur de développement (avec brouillons)
serve:
	hugo server --buildDrafts

## Build de production
build:
	hugo --minify

## Build propre (nettoyage du cache)
clean:
	hugo --gc --cleanDestinationDir
