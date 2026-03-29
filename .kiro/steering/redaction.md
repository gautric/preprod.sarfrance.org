---
inclusion: always
---

# Conventions rédactionnelles

## Langue et registre

- Le site s'adresse à un public cultivé, dans le cadre d'une institution internationale à vocation historique et patrimoniale. Le registre est soutenu sans être académique : précis, élégant, accessible.
- Proscrire tout mot familier, argotique ou relâché. Privilégier un vocabulaire châtié et mesuré.
- En français, éviter systématiquement les anglicismes. Utiliser l'équivalent français reconnu (ex. : « courriel » et non « e-mail », « en ligne » et non « online », « lettre d'information » et non « newsletter », « site » et non « website »).
- Respecter scrupuleusement l'orthographe, la grammaire et la typographie françaises : accords, concordance des temps, traits d'union, majuscules aux noms propres et aux institutions.
- Employer l'orthographe traditionnelle (et non les rectifications de 1990), sauf usage contraire déjà établi sur le site.

## Champ lexical

- S'inscrire dans le champ lexical de l'histoire, de la mémoire, du patrimoine et des relations internationales : commémoration, héritage, alliance, mémoire, patrimoine, descendance, lignée, hommage, fraternité d'armes, indépendance, souveraineté.
- Pour les contenus historiques, employer la terminologie d'époque correcte :
  - « Guerre d'Indépendance américaine » (et non « Révolution américaine »)
  - « Corps expéditionnaire »
  - « Ancien Régime »
  - « Treize Colonies »
- Pour les contenus institutionnels, utiliser le vocabulaire associatif et diplomatique français : assemblée générale, conseil d'administration, secrétariat, cotisation, statuts, reconnaissance d'utilité publique.

## Typographie française

- Espace insécable avant les signes doubles : deux-points, point-virgule, point d'interrogation, point d'exclamation, guillemets fermants.
- Espace insécable après les guillemets ouvrants.
- Guillemets français « … » (et non "…" ni "…").
- Majuscule aux noms d'institutions : « la Société », « la National Society of the Sons of the American Revolution ».
- Dates en toutes lettres dans les textes courants (« 4 juillet 1776 ») ; format numérique (`YYYY-MM-DD`) dans les données structurées YAML.
- Siècles en chiffres romains petites capitales : « XVIII^e siècle ».
- Abréviations ordinales : 1^er, 2^e, 3^e (et non 1er, 2ème, 3ème).
- Pas de point après les abréviations qui se terminent par la dernière lettre du mot (M^me, D^r, n^o).

## Ton

- Informatif et factuel : pas de ton promotionnel ni d'emphase commerciale.
- Sobre et digne, à la hauteur du sujet historique traité.
- Accueillant sans familiarité : vouvoiement systématique pour s'adresser au lecteur.
- Éviter les superlatifs et les formules hyperboliques (« exceptionnel », « unique au monde »). Préférer la précision factuelle.

## Contenu anglais

- Les pages en anglais respectent un registre équivalent : formel, institutionnel, sans familiarité.
- Les noms propres français (lieux, personnes, institutions) conservent leur graphie française, accents compris.
- Les termes historiques français consacrés peuvent être maintenus en français avec une traduction entre parenthèses à la première occurrence (ex. : « Corps expéditionnaire (Expeditionary Corps) »).
- Les titres de noblesse et grades militaires français sont conservés tels quels : « marquis de Lafayette », « comte de Rochambeau ».

## Pages d'index de section (`_index.md`)

Chaque page d'accueil de section (`content/{lang}/section/_index.md`) suit une structure uniforme (Organisation, Histoire, Activités, Contact).

### Structure requise

1. **Introduction** — Un court paragraphe présentant l'objet et le périmètre de la section
2. **Sous-sections thématiques** (`## Titre`) — Chaque thème majeur reçoit son propre `##` avec un paragraphe développé (pas une simple liste à puces). Les liens vers les sous-pages sont tissés naturellement dans le texte.
3. **Actualités récentes** (facultatif) — Une courte liste de faits marquants ou mises à jour
4. **« Pour en savoir plus » / « Learn More »** — Une section de clôture avec une liste à puces renvoyant vers toutes les sous-pages de la section, chacune accompagnée d'une courte description après un tiret

### Squelette type

```markdown
---
title: "Titre de la section"
description: "Description courte"
lastUpdate: YYYY-MM-DD
---

## Paragraphe d'introduction

Un ou deux paragraphes présentant la section.

## Premier thème

Paragraphe développé avec [lien contextuel](/section/sous-page/) vers une sous-page.

## Second thème

Autre paragraphe développé avec des liens pertinents.

## Pour en savoir plus

- [Sous-page A](/section/sous-page-a/) – Description courte
- [Sous-page B](/section/sous-page-b/) – Description courte
```

### Règles

- Les liens français n'ont pas de préfixe de langue (`/activites/...`)
- Utiliser `##` pour les titres de contenu (le `title` du front matter sert de `<h1>`)
- Garder les liens contextuels — les intégrer dans les phrases plutôt que lister des URL nues
- La liste « Pour en savoir plus » doit référencer toutes les sous-pages navigables de la section
- Quand un titre de section couvre deux sujets distincts, le scinder en deux `##` séparés
