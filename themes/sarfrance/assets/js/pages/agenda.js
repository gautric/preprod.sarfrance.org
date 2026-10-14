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
    // s'ouvre en CSS pur (:hover / :focus-within). Le JS ne fait que (1) basculer
    // aria-expanded du toggle au clic/clavier, et (2) copier dans le presse-papiers
    // l'URL absolue du .ics annuel au lieu de naviguer.
    var calBlock = document.querySelector('.page-header-cal');
    if (calBlock) {
        var toggle = calBlock.querySelector('.page-header-cal-toggle');
        var copyBtn = calBlock.querySelector('.page-header-cal-copy');
        var feedback = calBlock.querySelector('.page-header-cal-feedback');
        var hideTimer = null;

        // L'ouverture reste pilotée par CSS (:hover / :focus-within) ; on se
        // contente de refléter l'état « ouvert » pour le clavier via aria-expanded :
        // true dès qu'un élément du menu a le focus, false quand le focus en sort.
        if (toggle) {
            calBlock.addEventListener('focusin', function () {
                toggle.setAttribute('aria-expanded', 'true');
            });
            calBlock.addEventListener('focusout', function () {
                // Report au tour suivant : document.activeElement n'est à jour
                // qu'après le focusout.
                setTimeout(function () {
                    if (!calBlock.contains(document.activeElement)) {
                        toggle.setAttribute('aria-expanded', 'false');
                    }
                }, 0);
            });
        }

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
