/* Notices — search & tag filtering (vanilla) */
SAR.onReady(function () {
    'use strict';

    FilterEngine({
        filterSelector: '.filter-btn[data-tag]',
        filterAttr: 'data-tag',
        itemSelector: '.notice-card',
        itemAttr: 'data-tags',
        multiValue: true,
        searchSelector: '#notices-search',
        noResultSelector: '#notices-no-result',
        noResultMethod: 'hidden'
    });
});
