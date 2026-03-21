/* Notices - search & tag filtering */
$(function() {
    var $searchInput = $('#notices-search');
    var $cards = $('.notice-card');
    var $filters = $('.filter-btn[data-tag]');
    var $noResult = $('#notices-no-result');
    var activeTag = 'all';

    function applyFilters() {
        var query = $searchInput.val().toLowerCase().trim();
        var visibleCount = 0;

        $cards.each(function() {
            var matchesTag = activeTag === 'all' || $(this).attr('data-tags').split(',').indexOf(activeTag) !== -1;
            var matchesSearch = !query || $(this).attr('data-search').indexOf(query) !== -1;
            var visible = matchesTag && matchesSearch;
            $(this).toggleClass('hidden', !visible);
            if (visible) visibleCount++;
        });

        $noResult.prop('hidden', visibleCount > 0);
    }

    $searchInput.on('input', applyFilters);

    $filters.on('click', function() {
        $filters.removeClass('active');
        $(this).addClass('active');
        activeTag = $(this).attr('data-tag');
        applyFilters();
    });
});
