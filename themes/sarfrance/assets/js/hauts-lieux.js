/* Hauts lieux — tag filtering, text search & Leaflet map */
$(function() {
    var $filters = $('.filter-btn[data-tag]');
    var $cards = $('.hl-card[data-tags]');
    var $regions = $('.hl-region');
    var $search = $('#hl-search');
    var $noResult = $('.page-no-result');
    var activeTag = 'all';
    var searchTerm = '';

    /* --- Leaflet map --- */
    var map = L.map('hl-map').setView([46.8, 2.3], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 18
    }).addTo(map);

    var marker = null;

    function showOnMap(lat, lon, title) {
        if (marker) {
            marker.setLatLng([lat, lon]).setPopupContent(title).openPopup();
        } else {
            marker = L.marker([lat, lon]).addTo(map).bindPopup(title).openPopup();
        }
        map.setView([lat, lon], 15, { animate: true, duration: 0.4 });
    }

    /* --- Hover on cards → update map --- */
    $cards.on('mouseenter', function() {
        var $card = $(this);
        var lat = parseFloat($card.attr('data-lat'));
        var lon = parseFloat($card.attr('data-lon'));
        var title = $card.find('.page-card-title').text().trim();
        if (lat && lon) {
            showOnMap(lat, lon, title);
        }
    });

    /* --- Filtering --- */
    function applyFilters() {
        var term = searchTerm.toLowerCase();
        var visibleCount = 0;

        $cards.each(function() {
            var $card = $(this);
            var tags = $card.attr('data-tags').split(',');
            var matchTag = (activeTag === 'all') || ($.inArray(activeTag, tags) !== -1);
            var matchSearch = !term || ($card.attr('data-search').toLowerCase().indexOf(term) !== -1);
            var visible = matchTag && matchSearch;
            $card.toggleClass('hidden', !visible);
            if (visible) visibleCount++;
        });

        $regions.each(function() {
            var hasVisible = $(this).find('.hl-card:not(.hidden)').length > 0;
            $(this).toggleClass('hidden', !hasVisible);
        });

        $noResult.toggle(visibleCount === 0);
    }

    $filters.on('click', function() {
        $filters.removeClass('active');
        $(this).addClass('active');
        activeTag = $(this).attr('data-tag');
        applyFilters();
    });

    $search.on('input', function() {
        searchTerm = $(this).val();
        applyFilters();
    });

    /* Show first card on map by default */
    var $first = $cards.first();
    if ($first.length) {
        var lat = parseFloat($first.attr('data-lat'));
        var lon = parseFloat($first.attr('data-lon'));
        var title = $first.find('.page-card-title').text().trim();
        if (lat && lon) {
            showOnMap(lat, lon, title);
        }
    }
});
