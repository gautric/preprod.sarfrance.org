/* Hauts lieux — tag filtering, text search & Leaflet mini-maps */
$(function() {
    initPageCardMaps();

    FilterEngine({
        filterSelector: '.filter-btn[data-tag]',
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
