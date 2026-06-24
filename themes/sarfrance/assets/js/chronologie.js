/* Chronologie — tag filtering & Leaflet mini-maps (vanilla) */
SAR.onReady(function () {
    'use strict';

    initPageCardMaps();

    FilterEngine({
        filterSelector: '.filter-btn[data-tag]',
        filterAttr: 'data-tag',
        itemSelector: '.tl-row[data-tags]',
        itemAttr: 'data-tags',
        multiValue: true,
        groupSelector: '.tl-group'
    });
});
