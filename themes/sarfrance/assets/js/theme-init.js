/* ============================================================
   SAR FRANCE — Theme init (no-FOUC)
   Standalone, dependency-free IIFE loaded render-blocking in
   <head> BEFORE the stylesheets, so the chosen theme is applied
   to <html> before first paint. It must NOT reference SAR (core.js
   loads at the end of <body>) nor the document body (not parsed yet).

   Reads the persisted choice from localStorage ('sar-theme'):
     - 'light' / 'dark' → set data-theme on <html> (manual override)
     - 'system', absent, or anything else → remove data-theme so the
       gated @media (prefers-color-scheme) in colors.css governs.
   ============================================================ */
(function () {
    'use strict';

    var choice = null;
    try {
        choice = window.localStorage.getItem('sar-theme');
    } catch (e) {
        /* localStorage unavailable (privacy mode) — fall back to system */
    }

    var root = document.documentElement;
    if (choice === 'light' || choice === 'dark') {
        root.setAttribute('data-theme', choice);
    } else {
        root.removeAttribute('data-theme');
    }
})();
