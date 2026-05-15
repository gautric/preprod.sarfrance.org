/* Chronologie — tag filtering & Leaflet mini-maps */
$(function() {
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
