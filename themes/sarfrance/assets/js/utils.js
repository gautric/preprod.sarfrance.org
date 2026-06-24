/* ============================================================
   SAR FRANCE — Shared DOM utilities (vanilla, no dependency)
   Exposed on the global `SAR` namespace. Loaded before every
   other script so all page modules can rely on it.
   ============================================================ */
(function (window) {
    'use strict';

    /**
     * Run a callback once the DOM is ready. Scripts are loaded at the end of
     * <body>, so the DOM is usually parsed already, but this stays safe either way.
     * @param {() => void} fn
     */
    function onReady(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    /**
     * querySelectorAll returning a real Array (so .forEach/.map/.indexOf work
     * everywhere and the list is static).
     * @param {string} selector
     * @param {ParentNode} [ctx] search root (defaults to document)
     * @returns {Element[]}
     */
    function selectAll(selector, ctx) {
        return Array.prototype.slice.call((ctx || document).querySelectorAll(selector));
    }

    window.SAR = window.SAR || {};
    window.SAR.onReady = onReady;
    window.SAR.selectAll = selectAll;
})(window);
