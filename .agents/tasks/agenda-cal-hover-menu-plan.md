# Plan d'implémentation — Agenda : menu « Ajouter au calendrier » au survol + 4 entrées

## Contexte et décisions tranchées (lues dans le code, pas supposées)

Fonctionnalité déjà en place (commit `ba81ee5`) : chaque carte d'agenda porte un
bloc `.agenda-cal` rendu par `themes/sarfrance/layouts/partials/event-calendar.html`
(un `<button class="agenda-cal-btn" aria-expanded aria-controls>` + un panneau
`.agenda-cal-panel.hidden`), ouvert/fermé par `themes/sarfrance/assets/js/pages/add-to-calendar.js`
(clic, Entrée/Espace, double-clic sur la carte, Échap, clic extérieur, croix `✕`).
Le panneau contient aujourd'hui **trois** liens : Google (`cal_google`), Outlook
(`cal_outlook`), Apple Calendar `.ics` (`cal_apple`).

**Décision 1 — module JS porteur : `themes/sarfrance/assets/js/pages/add-to-calendar.js`.**
C'est déjà le module qui ouvre/ferme le panneau et il est chargé par le layout
agenda (`{{ define "scripts" }}`, après `pages/agenda.js`). On y ajoute le survol,
le délai de grâce et la copie presse-papiers. Justification : éviter de disperser
la logique du panneau ; `pages/agenda.js` reste dédié au filtrage/cartes. Le repli
clipboard réutilise le patron déjà éprouvé dans `pages/agenda.js` (icône
`.page-header-ics` : `navigator.clipboard.writeText` + repli sur navigation).

**Décision 2 — URL absolue du `.ics` : déjà servie à une URL stable au build, on la réutilise.**
`partials/event-calendar.html` appelle `partials/event-ics.html`, qui publie un
fichier par événement via `resources.FromString "calendars/<lang>/<slug>.ics"` et
renvoie une ressource. Le lien Apple actuel pointe déjà sur `$icsRes.RelPermalink`.
→ **Aucun nouvel output format ni shortcode n'est nécessaire.** L'entrée « Copier
l'URL du .ics » copiera l'URL **absolue** calculée côté client à partir de ce même
`RelPermalink` (`new URL(href, location.href).href`), exactement comme le fait déjà
le bouton `.page-header-ics`. Le flux annuel `activites/agenda.ics.ics` n'est pas
touché. Pour que le JS retrouve l'URL sans la recalculer, le lien `.ics` du panneau
expose déjà son `href` ; l'entrée « Copier » lira ce `href` (voir étape 3).

**Décision 3 — iCloud : téléchargement/ouverture du `.ics` par événement (pas de webcal, pas d'API).**
macOS/iOS associent le type `text/calendar` à l'app Calendar : ouvrir le `.ics`
déclenche « Ajouter à Calendrier » (iCloud par défaut). On réutilise donc le même
`$icsRes.RelPermalink` que l'entrée Apple actuelle, en requalifiant le libellé en
« Ajouter à iCloud ». Justification : c'est l'approche la plus robuste et sans
dépendance ; un `webcal:` sur une ressource mono-événement n'apporte rien et casse
hors Apple. Le `.ics` reste `download=` pour un comportement homogène desktop.

**Ordre final des 4 entrées du panneau** (exigence verbatim) :
1. Copier l'URL du `.ics` → `cal_copy` (bouton, pas un lien)
2. Ajouter à Google → `cal_google` (lien existant, `target=_blank rel=noopener`)
3. Ajouter à Outlook → `cal_outlook` (lien existant, `target=_blank rel=noopener`)
4. Ajouter à iCloud → `cal_icloud` (lien `.ics`, `download`)

**i18n — clés existantes à réutiliser / ajouter (dans fr.yaml ET en.yaml) :**
- Réutilisées : `add_to_calendar`, `add_to_calendar_title`, `add_to_calendar_panel`,
  `cal_google`, `cal_outlook`, `cal_close`, `cal_hint`.
- Nouvelles : `cal_copy` (« Copier l'URL du .ics » / « Copy the .ics URL »),
  `cal_copied` (« Lien copié ! » / « Link copied! »), `cal_icloud`
  (« Ajouter à iCloud » / « Add to iCloud »).
- `cal_apple` : conservée mais remplacée à l'usage par `cal_icloud`. Ne pas la
  supprimer dans la même passe pour éviter un fichier `.ics` orphelin de référence ;
  elle peut rester inutilisée (noter dans la doc). Si on la retire, le faire dans
  l'étape i18n et vérifier qu'aucun template ne la référence plus.

**Garde-fous ergonomie/accessibilité (déjà tranchés, à respecter) :** le `<button>`
reste le moyen clavier/tactile ; le survol est un confort souris en plus ; délai de
grâce ~200 ms à la sortie pour aller du bouton au panneau ; ouvrir au survol ne
ferme pas un panneau déjà ouvert au clic ; un seul panneau ouvert ; Échap ferme et
rend le focus ; clic extérieur ferme ; retour visuel + `aria-live` après copie.

**Variables CSS disponibles (colors.css, clair+sombre) :** `--bg-surface`,
`--text-heading`, `--text-muted`, `--accent`, `--gray-border-medium`,
`--gray-border-light`, `--shadow-subtle`. Aucune couleur en dur.

---

# Implementation Plan

- [ ] 1. Ajouter les 3 clés i18n dans les DEUX fichiers (`cal_copy`, `cal_copied`, `cal_icloud`), à placer dans le bloc « calendrier » existant juste après `cal_hint`.
      FR : `cal_copy` = "Copier l'URL du .ics", `cal_copied` = "Lien copié !", `cal_icloud` = "Ajouter à iCloud".
      EN : `cal_copy` = "Copy the .ics URL", `cal_copied` = "Link copied!", `cal_icloud` = "Add to iCloud".
      Conserver `cal_apple` en place (non supprimée). Respecter l'indentation `- id:` / `  translation:` existante.
      Fichiers : `i18n/fr.yaml`, `i18n/en.yaml`
      Verify : `cd /Users/gautric/Source/web-apps/sarfrance/.worktrees/agenda-cal-hover-menu && hugo --minify --destination /tmp/sarfrance-build-check --cacheDir /tmp/sarfrance-build-check/cache` termine sans erreur ni warning i18n manquant (équivaut à `make build-check`).

- [ ] 2. Réordonner et compléter le panneau à 4 entrées dans le partial, dans l'ordre exigé : (1) bouton « Copier l'URL du .ics », (2) Google, (3) Outlook, (4) iCloud (le lien `.ics`). Ajouter une région `aria-live="polite"` visuellement discrète pour le retour de copie.
      Détails markup :
      - Entrée 1 : `<button type="button" class="agenda-cal-copy" data-ics-url="{{ $icsRes.RelPermalink }}" data-copied-label="{{ i18n "cal_copied" }}">{{ i18n "cal_copy" }}</button>` (le JS lira `data-ics-url` et le transformera en URL absolue). Garder un `data-*` plutôt qu'un `href` pour ne pas introduire un lien qui naviguerait sans JS.
      - Entrées 2/3 : liens Google/Outlook inchangés (`target="_blank" rel="noopener"`), ordre après le bouton copier.
      - Entrée 4 : le lien `.ics` existant, libellé `{{ i18n "cal_icloud" }}`, classe `agenda-cal-link--icloud` (remplace `--apple`), `download="sar-{{ $slug }}.ics"` conservé.
      - Ajouter `<span class="agenda-cal-feedback hidden" role="status" aria-live="polite"></span>` dans le panneau (rempli par le JS après copie).
      - Garder la croix `.agenda-cal-close` et `.agenda-cal-hint`.
      Fichiers : `themes/sarfrance/layouts/partials/event-calendar.html`
      Verify : build-check (commande de l'étape 1) sans erreur ; `hugo server` puis sur `/activites/agenda-2026/` le panneau d'une carte montre 4 entrées dans l'ordre Copier / Google / Outlook / iCloud, liens Google/Outlook toujours valides.

- [ ] 3. Implémenter dans le module JS : (a) copie presse-papiers de l'URL absolue du `.ics` avec repli `document.execCommand('copy')`, retour visuel ~2 s + `aria-live` ; (b) ouverture au survol avec délai de grâce ~200 ms ; sans régresser clic/clavier/double-clic/Échap/clic extérieur.
      Détails :
      - Copier : au clic sur `.agenda-cal-copy`, calculer `new URL(btn.dataset.icsUrl, window.location.href).href`. Essayer `navigator.clipboard.writeText` (promesse) ; en repli (API absente ou rejet, ex. http), créer un `<textarea>` temporaire hors écran, `select()`, `document.execCommand('copy')`, puis le retirer. Afficher `cal_copied` dans `.agenda-cal-feedback` (retirer `.hidden`, `textContent = dataset.copiedLabel`) et re-masquer après 2 s via `setTimeout` (nettoyer un éventuel timer précédent). Ne jamais exposer de secret ; aucune requête réseau.
      - Survol : sur `.agenda-cal` (délégation ou binding par bloc), `mouseenter`/`mouseover` → `openPanel(btn)` du bloc ; `mouseleave` → fermer après ~200 ms via `setTimeout`, annulé si le pointeur revient (`mouseenter`). Un panneau déjà ouvert (clic) ne doit pas être fermé par le survol : ne programmer la fermeture différée que si l'ouverture provient du survol — suivre l'état avec un drapeau par bloc (`openedByHover`) remis à false dès qu'un clic/clavier interagit. Respecter `@media (hover: hover)` au moins pour ne pas gêner le tactile : conditionner l'activation du survol à `window.matchMedia('(hover: hover)').matches`.
      - Ne pas déclencher la copie/fermeture quand on interagit avec les liens Google/Outlook/iCloud (laisser leur comportement natif ; `stopPropagation` seulement si nécessaire pour ne pas refermer avant la navigation `_blank`).
      - Garder le code enveloppé dans `SAR.onReady(function () { 'use strict'; ... })`, helpers `SAR.selectAll`, pas de global, pas de `XMLHttpRequest`.
      Fichiers : `themes/sarfrance/assets/js/pages/add-to-calendar.js`
      Verify : build-check sans erreur ; `hugo server`, sur `/activites/agenda-2026/` (FR) et `/en/activites/agenda-2026/` (EN) :
        1. survol de l'icône 📅 → panneau s'ouvre ; sortie → fermeture après court délai ; aller du bouton au panneau ne ferme pas ;
        2. clic/Entrée/Espace ouvre/ferme ; Échap ferme et rend le focus au bouton ; clic extérieur ferme ; un seul panneau ouvert à la fois ;
        3. clic « Copier l'URL du .ics » → message « Lien copié ! » ~2 s ; coller l'URL dans la barre d'adresse ouvre bien le `.ics` ; tester aussi via `http://localhost:1313` (repli `execCommand`) ;
        4. clics Google/Outlook ouvrent un nouvel onglet ; iCloud télécharge/ouvre le `.ics`.

- [ ] 4. Mettre à jour le CSS : renommer la règle d'icône `--apple` en `--icloud`, styler le bouton « Copier » (`.agenda-cal-copy`) comme un lien du panneau, et la région de retour `.agenda-cal-feedback`. Clair + sombre via variables uniquement ; pas de débordement à 375 px.
      Détails :
      - Renommer `.agenda-cal-link--apple::before { content: "🍎 "; }` → `.agenda-cal-link--icloud::before { content: "☁️ "; }` (ou garder 🍎 si préféré — choisir ☁️ pour « iCloud »). Ajouter l'icône du bouton copier `.agenda-cal-copy::before { content: "🔗 "; }`.
      - `.agenda-cal-copy` : même famille visuelle que `.agenda-cal-link` (couleur `--accent`, `font-weight:600`, `cursor:pointer`, `border:0; background:none; font-family:inherit; padding:0`) pour s'aligner dans la ligne du panneau ; état focus visible.
      - `.agenda-cal-feedback` : `flex:1 1 100%`, `font-size:0.75rem`, `color:var(--text-muted)` ; masquée par `.hidden` partagée.
      - Vérifier la règle `@media (max-width:768px)` : inclure `.agenda-cal-copy` dans l'empilement `flex:1 1 100%` comme les liens pour éviter tout débordement.
      - Aucune couleur en dur ; ne pas dupliquer `filters.css`.
      Fichiers : `themes/sarfrance/assets/css/agenda.css`
      Verify : build-check sans erreur ; `hugo server` + DevTools, basculer le thème (clair/sombre) : le panneau et le bouton copier restent lisibles ; à 375 px (émulation mobile) les 4 entrées s'empilent sans déborder de la carte.

- [ ] 5. Mettre à jour la documentation : section « Adding an Event to a Personal Calendar » de `structure-agenda.md` pour décrire les 4 entrées, l'ouverture au survol (+ délai de grâce, `hover: hover`), la copie presse-papiers (repli `execCommand`, `aria-live`), le libellé iCloud, et les nouvelles clés i18n (`cal_copy`, `cal_copied`, `cal_icloud`).
      Préciser que l'URL copiée est l'URL absolue du `.ics` par événement déjà publié par `event-ics.html` (pas de nouvel output format) et que le flux annuel `agenda.ics.ics` reste inchangé.
      Fichiers : `.kiro/steering/structure-agenda.md`
      Verify : relecture : la liste des libellés i18n et des destinations correspond au markup de l'étape 2 ; aucune mention de mécanisme de génération `.ics` nouveau.

- [ ] 6. Vérification de non-régression finale (flux ICS annuel et build complet).
      Détails :
      - Diff du flux annuel avant/après : `git -C /Users/gautric/Source/web-apps/sarfrance/.worktrees/agenda-cal-hover-menu stash` n'est pas nécessaire ; comparer la sortie `public/activites/agenda-2026/index.ics` (ou chemin réel du flux `.ics` annuel) d'un build sur `main` vs la branche — attendu : identique (le partial `event-dates.html` et `agenda.ics.ics` ne sont pas modifiés).
      - Build complet propre : `make build-check` (ou la commande hugo équivalente) sans erreur ni warning nouveau.
      - Cas de dates à vérifier en navigateur sur une carte de chaque forme : journée entière (`"2026-01-17"`), avec heure (`"2026-02-06T18:00:00"`), multi-jours (`"2026-03-03/2026-03-31"`) — les 4 entrées restent cohérentes (Google/Outlook ouvrent le bon créneau, `.ics` téléchargé s'ouvre dans Calendar).
      - FilterEngine, badge « Nouveau », mini-cartes Leaflet, liens titre/📷 Photos : toujours fonctionnels (le double-clic ignore toujours `a, button, .agenda-cal, .page-card-map`).
      Fichiers : aucun (vérification)
      Verify : build-check vert ; diff du `.ics` annuel vide ; les 4 scénarios de date et les éléments listés fonctionnent en FR et EN.

- [ ] 7. Commit en français selon `git-commit.md` (Conventional Commits, scope `theme`, description en anglais car scope technique). Ne pas pousser.
      Message suggéré : `feat(theme): Add hover menu and .ics URL copy to agenda calendar panel`.
      Inclure aussi les changements i18n et steering dans le même commit (changement logique unique touchant les deux langues).
      Fichiers : commit des fichiers modifiés aux étapes 1–5.
      Verify : `git -C /Users/gautric/Source/web-apps/sarfrance/.worktrees/agenda-cal-hover-menu status` propre après commit ; `git log -1` montre le message conforme.

## Notes de vérification transversales

- Commande de build de vérification isolée (sûre même avec `hugo server` actif) :
  `make build-check` → écrit dans `/tmp/sarfrance-build-check`, n'altère pas `public/`.
- Serveur local : `make serve` (`hugo server --buildDrafts`), URL FR `/activites/agenda-2026/`, EN `/en/activites/agenda-2026/`.
- Les greps ne sont pas une vérification : s'appuyer sur le build Hugo et la vérification navigateur ci-dessus.
- Mode sombre : basculer via le sélecteur de thème du site (variables `:root[data-theme="dark"]` dans `colors.css`).
