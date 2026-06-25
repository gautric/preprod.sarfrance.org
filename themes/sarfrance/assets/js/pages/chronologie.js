/* Chronologie — tag filtering & Leaflet mini-maps (vanilla) */
SAR.onReady(function () {
    'use strict';

    SAR.initTimelinePage({
        withMaps: true,
        filterAttr: 'data-tag',
        itemSelector: '.tl-row[data-tags]',
        itemAttr: 'data-tags',
        multiValue: true,
        groupSelector: '.tl-group'
    });
});
