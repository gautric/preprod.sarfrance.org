/* Agenda — type filtering & Leaflet mini-maps */
$(function() {
    initPageCardMaps();

    FilterEngine({
        filterSelector: '.filter-btn[data-type]',
        filterAttr: 'data-type',
        itemSelector: '.tl-row[data-type]',
        itemAttr: 'data-type',
        multiValue: false,
        groupSelector: '.tl-row:has(.tl-group-title)',
        groupMode: 'sibling'
    });
});
