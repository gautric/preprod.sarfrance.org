/* Agenda — filtrage (type + fraîcheur) & mini-cartes Leaflet (vanilla) */
SAR.onReady(function () {
    'use strict';

    /**
     * Vrai si l'URL demande les seuls événements récents (`?new`).
     * Accepte `?new`, `?new=1` ou toute combinaison (`?a=1&new`).
     * @returns {boolean}
     */
    function wantsNewOnly() {
        if (!window.URLSearchParams) return false;
        return new URLSearchParams(window.location.search).has('new');
    }

    // Chaque ligne porte ses valeurs filtrables dans `data-filters` : son type
    // et, pour un événement récent, la valeur « nouveau ». D'où multiValue.
    SAR.initTimelinePage({
        withMaps: true,
        filterSelector: '.filter-btn[data-filter]',
        filterAttr: 'data-filter',
        itemSelector: '.tl-row[data-filters]',
        itemAttr: 'data-filters',
        multiValue: true,
        groupSelector: '.tl-row:has(.tl-group-title)',
        groupMode: 'sibling'
    });

    // `?new` présélectionne le filtre des événements récents. Le bouton n'est
    // rendu par le template que si l'année affichée en contient au moins un :
    // en son absence on laisse « Tout » actif plutôt que d'afficher une liste
    // vide. On déclenche un clic pour réutiliser la logique du FilterEngine
    // (bascule du bouton actif + application des filtres).
    if (wantsNewOnly()) {
        var newBtn = document.querySelector('.filter-btn[data-filter="nouveau"]');
        if (newBtn) newBtn.click();
    }

    // Menu « Ajouter l'agenda à votre calendrier » (.page-header-cal) : le dropdown
    // s'ouvre en CSS pur (:hover / :focus-within). Le JS (1) ajoute une rétention :
    // une fois ouvert, le menu reste visible ≥ 4 s même si la souris quitte la zone
    // (classe `.is-open` posée par JS, retirée par un minuteur), (2) bascule
    // aria-expanded du toggle, et (3) copie dans le presse-papiers l'URL absolue du
    // .ics annuel au lieu de naviguer.
    var calBlock = document.querySelector('.page-header-cal');
    if (calBlock) {
        var toggle = calBlock.querySelector('.page-header-cal-toggle');
        var copyBtn = calBlock.querySelector('.page-header-cal-copy');
        var feedback = calBlock.querySelector('.page-header-cal-feedback');
        var hideTimer = null;

        // Délai minimal de rétention du menu une fois ouvert (ms).
        var CAL_RETENTION_MS = 4000;
        // Minuteur unique de fermeture différée : on le `clearTimeout` avant
        // d'en armer un nouveau et à chaque réouverture.
        var retentionTimer = null;

        /** Ouvre (ou maintient ouvert) le menu : pose `is-open` + aria-expanded
         *  et annule tout minuteur de fermeture en cours. */
        function openCal() {
            if (retentionTimer) {
                clearTimeout(retentionTimer);
                retentionTimer = null;
            }
            calBlock.classList.add('is-open');
            if (toggle) toggle.setAttribute('aria-expanded', 'true');
        }

        /** Ferme immédiatement : retire `is-open` + aria-expanded et annule le
         *  minuteur de rétention. */
        function closeCal() {
            if (retentionTimer) {
                clearTimeout(retentionTimer);
                retentionTimer = null;
            }
            calBlock.classList.remove('is-open');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
        }

        /** Programme une fermeture différée : le menu ne se referme qu'après
         *  CAL_RETENTION_MS, et seulement si le pointeur n'est pas revenu
         *  survoler le bloc et que le focus n'est plus à l'intérieur. Sinon on
         *  laisse le CSS :hover / :focus-within gérer et on réarmera à la
         *  prochaine sortie. */
        function scheduleClose() {
            if (retentionTimer) clearTimeout(retentionTimer);
            retentionTimer = setTimeout(function () {
                retentionTimer = null;
                var stillHovered = false;
                try { stillHovered = calBlock.matches(':hover'); } catch (e) { stillHovered = false; }
                if (stillHovered || calBlock.contains(document.activeElement)) return;
                calBlock.classList.remove('is-open');
                if (toggle) toggle.setAttribute('aria-expanded', 'false');
            }, CAL_RETENTION_MS);
        }

        // Ouverture au survol : on verrouille l'état `is-open` pour que la
        // rétention prenne le relais quand la souris quittera la zone.
        calBlock.addEventListener('mouseenter', openCal);
        calBlock.addEventListener('mouseleave', scheduleClose);

        // Clavier : le focus entrant ouvre le menu (comme :focus-within), le
        // focus sortant arme la rétention plutôt que de fermer tout de suite.
        calBlock.addEventListener('focusin', openCal);
        calBlock.addEventListener('focusout', function () {
            // Report au tour suivant : document.activeElement n'est à jour
            // qu'après le focusout.
            setTimeout(function () {
                if (!calBlock.contains(document.activeElement)) {
                    scheduleClose();
                }
            }, 0);
        });

        // Échap ferme immédiatement et rend le focus au toggle.
        calBlock.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' || e.key === 'Esc') {
                closeCal();
                if (toggle) toggle.focus();
            }
        });

        /** Affiche le libellé de confirmation puis le masque après ~2 s. */
        function showCopied() {
            if (!feedback) return;
            feedback.textContent = (copyBtn && copyBtn.dataset.copiedLabel) || '';
            feedback.classList.remove('hidden');
            if (hideTimer) clearTimeout(hideTimer);
            hideTimer = setTimeout(function () {
                feedback.classList.add('hidden');
                feedback.textContent = '';
            }, 2000);
        }

        /** Repli presse-papiers sans API Clipboard (contextes non sécurisés). */
        function legacyCopy(text) {
            var area = document.createElement('textarea');
            area.value = text;
            area.setAttribute('readonly', '');
            area.style.position = 'absolute';
            area.style.left = '-9999px';
            document.body.appendChild(area);
            area.select();
            var ok = false;
            try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
            document.body.removeChild(area);
            return ok;
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', function () {
                var absoluteUrl = new URL(copyBtn.dataset.icsUrl, window.location.href).href;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(absoluteUrl).then(showCopied, function () {
                        if (legacyCopy(absoluteUrl)) showCopied();
                    });
                } else if (legacyCopy(absoluteUrl)) {
                    showCopied();
                }
            });
        }
    }
});
