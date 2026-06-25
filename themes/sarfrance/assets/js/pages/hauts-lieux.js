/* Hauts lieux — tag filtering, text search & Leaflet mini-maps (vanilla) */
SAR.onReady(function () {
    'use strict';

    SAR.initTimelinePage({
        withMaps: true,
        filterAttr: 'data-tag',
        itemSelector: '.tl-row[data-tags]',
        itemAttr: 'data-tags',
        multiValue: true,
        searchSelector: '#hl-search',
        noResultSelector: '.page-no-result',
        noResultMethod: 'toggle',
        groupSelector: '.tl-group'
    });
});
