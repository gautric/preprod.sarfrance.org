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
});
