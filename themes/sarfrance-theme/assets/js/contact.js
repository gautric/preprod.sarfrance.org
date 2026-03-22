/* Contact page — Leaflet maps */
$(function () {
    var tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var tileAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>';

    /* SAR France — 20 rue Bosquet, 75007 Paris */
    var mapParis = L.map('map-paris').setView([48.8575, 2.3025], 16);
    L.tileLayer(tileUrl, { attribution: tileAttr, maxZoom: 18 }).addTo(mapParis);
    L.marker([48.8575, 2.3025]).addTo(mapParis)
        .bindPopup($('#map-paris').data('popup')).openPopup();

    /* NSSAR — 809 W Main St, Louisville, KY */
    var mapLouisville = L.map('map-louisville').setView([38.2574, -85.7665], 16);
    L.tileLayer(tileUrl, { attribution: tileAttr, maxZoom: 18 }).addTo(mapLouisville);
    L.marker([38.2574, -85.7665]).addTo(mapLouisville)
        .bindPopup($('#map-louisville').data('popup')).openPopup();
});
