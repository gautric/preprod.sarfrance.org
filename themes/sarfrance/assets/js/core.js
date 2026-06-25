/* ============================================================
   SAR FRANCE — Core helpers (vanilla, no dependency)
   Single bundle of cross-cutting helpers exposed on the global
   `SAR` namespace. Loaded first and globally (via site-scripts.html)
   so every page module can rely on it.

   Sections:
     1. DOM utilities      — SAR.onReady, SAR.selectAll
     2. Language helpers   — SAR.isEnglish, SAR.lang, SAR.homeUrl
     3. Network helpers    — SAR.fetchJSON
     4. DOM interactions   — SAR.activate
     5. Leaflet helpers    — SAR.map (+ global initPageCardMaps)
                             (no-op until Leaflet's `L` global is present)
   ============================================================ */
(function (window) {
    'use strict';

    var SAR = window.SAR = window.SAR || {};

    /* ─── 1. DOM utilities ──────────────────────────────────────────────── */

    /**
     * Run a callback once the DOM is ready. Scripts are loaded at the end of
     * <body>, so the DOM is usually parsed already, but this stays safe either way.
     * @param {() => void} fn
     */
    SAR.onReady = function (fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    };

    /**
     * querySelectorAll returning a real Array (so .forEach/.map/.indexOf work
     * everywhere and the list is static).
     * @param {string} selector
     * @param {ParentNode} [ctx] search root (defaults to document)
     * @returns {Element[]}
     */
    SAR.selectAll = function (selector, ctx) {
        return Array.prototype.slice.call((ctx || document).querySelectorAll(selector));
    };

    /* ─── 2. Language helpers ───────────────────────────────────────────── */

    /**
     * True when the current page is served under the English subdir (/en/).
     * Mirrors the `lang-prefix.html` template partial.
     * @returns {boolean}
     */
    SAR.isEnglish = function () {
        return window.location.pathname.indexOf('/en/') === 0;
    };

    /**
     * Current language code, matching Hugo's `.Lang`.
     * @returns {'en' | 'fr'}
     */
    SAR.lang = function () {
        return SAR.isEnglish() ? 'en' : 'fr';
    };

    /**
     * Home URL for the current language (French at root, English under /en/).
     * @returns {string}
     */
    SAR.homeUrl = function () {
        return SAR.isEnglish() ? '/en/' : '/';
    };

    /* ─── 3. Network helpers ────────────────────────────────────────────── */

    /**
     * Fetch a URL and parse it as JSON, throwing on a non-2xx response so
     * callers can rely on a single `.catch`.
     * @param {string} url
     * @param {RequestInit} [options] passed straight to fetch
     * @returns {Promise<any>}
     */
    SAR.fetchJSON = async function (url, options) {
        var res = await fetch(url, options);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
    };

    /* ─── 4. DOM interaction helpers ────────────────────────────────────── */

    /**
     * Mark a single button as active within a group: removes the `active`
     * class from every button in the group, then adds it to the chosen one.
     * Used by filter / sort button bars.
     * @param {Element[] | NodeList} group all buttons in the bar
     * @param {Element} btn the button to activate
     */
    SAR.activate = function (group, btn) {
        Array.prototype.forEach.call(group, function (b) {
            b.classList.remove('active');
        });
        btn.classList.add('active');
    };

    /* ─── 5. Leaflet helpers ────────────────────────────────────────────── */
    /* Centralises OSM tile config and map creation. Definitions are inert
       until called, so they are harmless on pages where Leaflet (`L`) is
       absent. */

    SAR.map = {
        tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        tileAttr: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',

        /** @returns {boolean} whether the Leaflet library is loaded */
        available: function () {
            return typeof L !== 'undefined';
        },

        /**
         * Create a Leaflet map with the shared OSM tile layer.
         * @param {HTMLElement} el target element
         * @param {object} opts
         * @param {[number, number]} opts.center [lat, lon]
         * @param {number} [opts.zoom=13]
         * @param {number} [opts.maxZoom=18]
         * @param {boolean} [opts.attribution=true] set false to hide attribution
         * @param {boolean} [opts.marker=false] add a marker at center
         * @param {string}  [opts.popup] popup text bound to the marker
         * @param {boolean} [opts.openPopup=false] open the popup immediately
         * @param {object}  [opts.mapOptions] extra options passed to L.map
         * @returns {L.Map}
         */
        create: function (el, opts) {
            opts = opts || {};
            var map = L.map(el, opts.mapOptions || {})
                .setView(opts.center, opts.zoom == null ? 13 : opts.zoom);

            L.tileLayer(SAR.map.tileUrl, {
                attribution: opts.attribution === false ? '' : SAR.map.tileAttr,
                maxZoom: opts.maxZoom || 18
            }).addTo(map);

            if (opts.marker) {
                var marker = L.marker(opts.center).addTo(map);
                if (opts.popup != null) {
                    marker.bindPopup(opts.popup);
                    if (opts.openPopup) marker.openPopup();
                }
            }

            return map;
        }
    };
})(window);

/* Shared Leaflet mini-map initialisation for page cards (vanilla).
   Kept global so timeline page modules can call it directly. */
// eslint-disable-next-line no-unused-vars
function initPageCardMaps() {
    'use strict';

    if (!SAR.map.available()) return;

    SAR.selectAll('.page-card-map[data-lat][data-lon]').forEach(function (el) {
        if (el.dataset.leafletInit) return;

        var lat = parseFloat(el.getAttribute('data-lat'));
        var lon = parseFloat(el.getAttribute('data-lon'));
        if (!lat && !lon) return;

        var map = SAR.map.create(el, {
            center: [lat, lon],
            zoom: 13,
            attribution: false,
            marker: true,
            popup: el.getAttribute('data-location') || '',
            mapOptions: {
                scrollWheelZoom: false,
                dragging: false,
                zoomControl: false,
                attributionControl: false
            }
        });

        setTimeout(function () { map.invalidateSize(); }, 200);
        el.dataset.leafletInit = 'true';
    });
}
