/* Library / Books — search & category filtering */
$(function() {
    var $searchInput = $('#book-search');
    var $cards = $('.book-card');
    var $filters = $('.filter-btn[data-cat]');
    var $noResult = $('#book-no-result');
    var activeCat = 'all';

    function applyFilters() {
        var query = $searchInput.val().toLowerCase().trim();
        var visibleCount = 0;

        $cards.each(function() {
            var cats = ($(this).attr('data-cat') || '').split(' ');
            var matchesCat = activeCat === 'all' || cats.indexOf(activeCat) !== -1;
            var matchesSearch = !query || $(this).attr('data-search').indexOf(query) !== -1;
            var visible = matchesCat && matchesSearch;
            $(this).toggleClass('hidden', !visible);
            if (visible) visibleCount++;
        });

        $noResult.prop('hidden', visibleCount > 0);
    }

    $searchInput.on('input', applyFilters);

    $filters.on('click', function() {
        $filters.removeClass('active');
        $(this).addClass('active');
        activeCat = $(this).attr('data-cat');
        applyFilters();
    });
});
