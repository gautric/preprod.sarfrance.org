/* Shared Leaflet mini-map initialisation for page cards (vanilla) */
// eslint-disable-next-line no-unused-vars
function initPageCardMaps() {
    'use strict';

    if (typeof L === 'undefined') return;

    SAR.selectAll('.page-card-map[data-lat][data-lon]').forEach(function (el) {
        if (el.dataset.leafletInit) return;

        var lat = parseFloat(el.getAttribute('data-lat'));
        var lon = parseFloat(el.getAttribute('data-lon'));
        if (!lat && !lon) return;

        var map = L.map(el, {
            scrollWheelZoom: false,
            dragging: false,
            zoomControl: false,
            attributionControl: false
        }).setView([lat, lon], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
        L.marker([lat, lon]).addTo(map).bindPopup(el.getAttribute('data-location') || '');

        setTimeout(function () { map.invalidateSize(); }, 200);
        el.dataset.leafletInit = 'true';
    });
}
