/* Chronologie — tag filtering & Leaflet mini-maps */
$(function() {
    // Mini-maps Leaflet (shared helper from map.js)
    initPageCardMaps();

    // Tag filtering
    var $filters = $('.filter-btn[data-tag]');
    var $items = $('.tl-row[data-tags]');

    $filters.on('click', function() {
        $filters.removeClass('active');
        $(this).addClass('active');
        var tag = $(this).attr('data-tag');

        $items.each(function() {
            if (tag === 'all') {
                $(this).removeClass('hidden');
            } else {
                var tags = $(this).attr('data-tags').split(',');
                $(this).toggleClass('hidden', $.inArray(tag, tags) === -1);
            }
        });

        $('.tl-group').each(function() {
            var visible = $(this).find('.tl-row[data-tags]:not(.hidden)').length;
            $(this).toggle(visible > 0);
        });
    });
});
