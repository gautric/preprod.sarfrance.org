/* ============================================================
   SAR FRANCE — Hero layout switcher (home page proposals)
   Lets the committee compare the home hero layouts from a nav menu
   that mirrors the theme switcher:
     actuelle → current layout (no data-hero on <html>)
     a | b | c → data-hero="a|b|c" on <html> (see carousel.css)

   Persisted choice: localStorage 'sar-hero'. theme-init.js already
   applied it before paint; this module syncs the menu and handles
   input. Opening/closing the dropdown is handled by theme-switcher.js
   (the <li> also carries .theme-switch) and by main.js on mobile.
   Dispatches 'sar:hero-layout' on document so carousel.js can adapt.
   ============================================================ */
SAR.onReady(function () {
    'use strict';

    var STORAGE_KEY = 'sar-hero';
    var VALUES = ['actuelle', 'a', 'b', 'c'];
    var root = document.documentElement;

    var switches = SAR.selectAll('.hero-switch');
    if (!switches.length) return;

    function isValid(value) {
        return VALUES.indexOf(value) !== -1;
    }

    function readChoice() {
        try {
            var v = window.localStorage.getItem(STORAGE_KEY);
            if (isValid(v)) return v;
        } catch (e) { /* localStorage unavailable */ }
        return 'actuelle';
    }

    function writeChoice(value) {
        try {
            window.localStorage.setItem(STORAGE_KEY, value);
        } catch (e) { /* localStorage unavailable — in-memory only */ }
    }

    function applyLayout(value) {
        if (value === 'actuelle') {
            root.removeAttribute('data-hero');
        } else {
            root.setAttribute('data-hero', value);
        }
        document.dispatchEvent(new CustomEvent('sar:hero-layout', { detail: value }));
    }

    function syncUI(value) {
        SAR.selectAll('.hero-switch .hero-opt').forEach(function (opt) {
            var active = opt.getAttribute('data-hero-value') === value;
            opt.parentElement.classList.toggle('active', active);
            if (active) {
                opt.setAttribute('aria-current', 'true');
            } else {
                opt.removeAttribute('aria-current');
            }
        });
    }

    syncUI(readChoice());

    switches.forEach(function (sw) {
        SAR.selectAll('.hero-opt', sw).forEach(function (opt) {
            opt.addEventListener('click', function (e) {
                e.preventDefault();
                var value = opt.getAttribute('data-hero-value');
                if (!isValid(value)) return;
                writeChoice(value);
                applyLayout(value);
                syncUI(value);
                sw.classList.remove('is-open', 'active');
                var trigger = sw.querySelector('.theme-switch__trigger');
                if (trigger) trigger.setAttribute('aria-expanded', 'false');
            });
        });
    });
});
