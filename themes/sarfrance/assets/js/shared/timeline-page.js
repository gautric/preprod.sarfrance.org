/* ============================================================
   SAR FRANCE — Timeline page initialiser (vanilla)
   Mutualises the near-identical setup of the timeline-style data
   pages (agenda, chronologie, hauts-lieux): optional Leaflet
   mini-maps + a FilterEngine instance.

   Usage (from a page module):
     SAR.onReady(function () {
         SAR.initTimelinePage({
             withMaps: true,
             filterAttr: 'data-tag',
             itemSelector: '.tl-row[data-tags]',
             itemAttr: 'data-tags',
             multiValue: true,
             groupSelector: '.tl-group'
         });
     });

   Config: every FilterEngine option is accepted and forwarded as-is.
   Extra option:
     withMaps — when true, calls initPageCardMaps() first (default: false)

   When `filterSelector` is omitted it defaults to
   '.filter-btn[<filterAttr>]'.

   Depends on: shared/filter-engine.js (FilterEngine) and, when
   withMaps is used, core/leaflet.js (initPageCardMaps).
   ============================================================ */
(function (window) {
    'use strict';

    var SAR = window.SAR = window.SAR || {};

    SAR.initTimelinePage = function (cfg) {
        cfg = cfg || {};

        if (cfg.withMaps && typeof initPageCardMaps === 'function') {
            initPageCardMaps();
        }

        var opts = {};
        Object.keys(cfg).forEach(function (key) {
            if (key !== 'withMaps') opts[key] = cfg[key];
        });

        if (!opts.filterSelector && opts.filterAttr) {
            opts.filterSelector = '.filter-btn[' + opts.filterAttr + ']';
        }

        return FilterEngine(opts);
    };
})(window);
