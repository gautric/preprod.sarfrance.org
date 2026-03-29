/* Hauts lieux — tag filtering, text search & Leaflet mini-maps */
$(function() {
    var $filters = $('.filter-btn[data-tag]');
    var $items = $('.tl-row[data-tags]');
    var $search = $('#hl-search');
    var $noResult = $('.page-no-result');
    var activeTag = 'all';

    // Mini-maps Leaflet (shared helper from map.js)
    initPageCardMaps();

    function applyFilters() {
        var query = $search.val().toLowerCase().trim();
        var visibleCount = 0;

        $items.each(function() {
            var $row = $(this);
            var tags = $row.attr('data-tags').split(',');
            var matchTag = (activeTag === 'all') || ($.inArray(activeTag, tags) !== -1);
            var matchSearch = !query || ($row.attr('data-search').toLowerCase().indexOf(query) !== -1);
            var visible = matchTag && matchSearch;
            $row.toggleClass('hidden', !visible);
            if (visible) visibleCount++;
        });

        // Show/hide region groups
        $('.tl-group').each(function() {
            var visible = $(this).find('.tl-row[data-tags]:not(.hidden)').length;
            $(this).toggle(visible > 0);
        });

        $noResult.toggle(visibleCount === 0);
    }

    $filters.on('click', function() {
        $filters.removeClass('active');
        $(this).addClass('active');
        activeTag = $(this).attr('data-tag');
        applyFilters();
    });

    $search.on('input', applyFilters);
});
