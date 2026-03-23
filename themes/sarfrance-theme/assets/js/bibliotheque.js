/* Bibliothèque - search & category filtering */
$(function() {
    var $searchInput = $('#bibli-search');
    var $cards = $('.bibli-card');
    var $filters = $('.filter-btn[data-cat]');
    var $noResult = $('#bibli-no-result');
    var activeCat = 'all';

    function applyFilters() {
        var query = $searchInput.val().toLowerCase().trim();
        var visibleCount = 0;

        $cards.each(function() {
            var matchesCat = activeCat === 'all' || $(this).attr('data-cat') === activeCat;
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
