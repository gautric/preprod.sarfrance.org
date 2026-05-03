/* Agenda — type filtering & Leaflet mini-maps */
$(function() {
    // Mini-maps Leaflet (shared helper from map.js)
    initPageCardMaps();

    // Type filtering
    var $filters = $('.filter-btn[data-type]');
    var $items = $('.tl-row[data-type]');
    var $monthRows = $('.tl-group-title').closest('.tl-row');

    $filters.on('click', function() {
        $filters.removeClass('active');
        $(this).addClass('active');
        var type = $(this).attr('data-type');

        $items.each(function() {
            if (type === 'all') { $(this).removeClass('hidden'); }
            else { $(this).toggleClass('hidden', $(this).attr('data-type') !== type); }
        });

        $monthRows.each(function() {
            var $next = $(this).next();
            var hasVisible = false;
            while ($next.length && !$next.find('.tl-group-title').length) {
                if ($next.is('[data-type]') && !$next.hasClass('hidden')) { hasVisible = true; break; }
                $next = $next.next();
            }
            $(this).toggle(hasVisible);
        });
    });
});
