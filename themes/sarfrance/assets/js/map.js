/* Shared Leaflet mini-map initialisation for page cards */
function initPageCardMaps() {
    if (typeof L === 'undefined') return;
    $('.page-card-map[data-lat][data-lon]').each(function() {
        if ($(this).data('leaflet-init')) return;
        var $el = $(this);
        var lat = parseFloat($el.attr('data-lat'));
        var lon = parseFloat($el.attr('data-lon'));
        if (!lat && !lon) return;
        var map = L.map(this, { scrollWheelZoom: false, dragging: false, zoomControl: false, attributionControl: false }).setView([lat, lon], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
        L.marker([lat, lon]).addTo(map).bindPopup($el.attr('data-location') || '');
        setTimeout(function() { map.invalidateSize(); }, 200);
        $el.data('leaflet-init', true);
    });
}
