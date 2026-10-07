/* ============================================================
   SAR FRANCE — Theme switcher (light / dark / system)
   Drives the nav dropdown menu (mirror of the language switcher)
   wired to the data-theme strategy in colors.css. The no-FOUC init
   (theme-init.js, in <head>) already applied the saved choice before
   paint; this module only syncs the control's UI and handles input.

   Persisted choice: localStorage 'sar-theme' = light | dark | system.
     - light / dark → data-theme on <html> (manual override)
     - system       → remove data-theme so the gated @media governs

   Desktop open/close: CSS hover (inherited from .has-submenu) and
   :focus-within reveal the menu; this module keeps aria-expanded
   truthful and adds click-toggle, Escape and outside-click closing.
   Mobile open/close is handled by main.js (.has-submenu.active),
   exactly like the language switcher.
   ============================================================ */
SAR.onReady(function () {
    'use strict';

    var STORAGE_KEY = 'sar-theme';
    var VALUES = ['light', 'dark', 'system'];
    var root = document.documentElement;
    var mobileQuery = window.matchMedia('(max-width: 768px)');

    var switches = SAR.selectAll('.theme-switch');
    if (!switches.length) return;

    function isValid(value) {
        return VALUES.indexOf(value) !== -1;
    }

    function readChoice() {
        try {
            var v = window.localStorage.getItem(STORAGE_KEY);
            if (isValid(v)) return v;
        } catch (e) { /* localStorage unavailable */ }
        return 'system';
    }

    function writeChoice(value) {
        try {
            window.localStorage.setItem(STORAGE_KEY, value);
        } catch (e) { /* localStorage unavailable — in-memory only */ }
    }

    /* Set or clear data-theme on <html> for the given choice. */
    function applyTheme(value) {
        if (value === 'light' || value === 'dark') {
            root.setAttribute('data-theme', value);
        } else {
            root.removeAttribute('data-theme');
        }
    }

    /* Reflect the active choice across every switcher instance: the
       trigger shows the matching icon, and the matching option is
       marked active (parallel to the language switcher's li.active). */
    function syncUI(value) {
        SAR.selectAll('.theme-switch__ico').forEach(function (ico) {
            ico.classList.toggle('is-shown', ico.getAttribute('data-theme-icon') === value);
        });
        SAR.selectAll('.theme-switch .theme-opt').forEach(function (opt) {
            var active = opt.getAttribute('data-theme-value') === value;
            opt.parentElement.classList.toggle('active', active);
            if (active) {
                opt.setAttribute('aria-current', 'true');
            } else {
                opt.removeAttribute('aria-current');
            }
        });
    }

    function setOpen(sw, open) {
        sw.classList.toggle('is-open', open);
        var trigger = sw.querySelector('.theme-switch__trigger');
        if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function closeOthers(except) {
        switches.forEach(function (sw) {
            if (sw !== except) setOpen(sw, false);
        });
    }

    /* Reflect the persisted choice on load (theme-init.js already applied
       it to <html>, so no re-paint flash here). */
    syncUI(readChoice());

    switches.forEach(function (sw) {
        var trigger = sw.querySelector('.theme-switch__trigger');

        if (trigger) {
            trigger.addEventListener('click', function (e) {
                e.preventDefault();
                /* On mobile the submenu is driven by main.js (.active),
                   exactly like the language switcher — stay out of its way. */
                if (mobileQuery.matches) return;
                var willOpen = !sw.classList.contains('is-open');
                closeOthers(sw);
                setOpen(sw, willOpen);
            });

            /* Keep aria-expanded truthful while the CSS hover rule opens
               the menu on desktop (no is-open class involved there). */
            sw.addEventListener('mouseenter', function () {
                if (!mobileQuery.matches) trigger.setAttribute('aria-expanded', 'true');
            });
            sw.addEventListener('mouseleave', function () {
                if (!mobileQuery.matches && !sw.classList.contains('is-open')) {
                    trigger.setAttribute('aria-expanded', 'false');
                }
            });
        }

        SAR.selectAll('.theme-opt', sw).forEach(function (opt) {
            opt.addEventListener('click', function (e) {
                e.preventDefault();
                var value = opt.getAttribute('data-theme-value');
                if (!isValid(value)) return;
                writeChoice(value);
                applyTheme(value);
                syncUI(value);
                setOpen(sw, false);
                sw.classList.remove('active'); /* collapse the mobile submenu */
            });
        });
    });

    /* Escape closes an open menu and returns focus to its trigger. */
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' && e.key !== 'Esc') return;
        switches.forEach(function (sw) {
            if (!sw.classList.contains('is-open')) return;
            setOpen(sw, false);
            var trigger = sw.querySelector('.theme-switch__trigger');
            if (trigger) trigger.focus();
        });
    });

    /* Click outside an open menu closes it. */
    document.addEventListener('click', function (e) {
        switches.forEach(function (sw) {
            if (sw.classList.contains('is-open') && !sw.contains(e.target)) {
                setOpen(sw, false);
            }
        });
    });

    /* While in system mode the CSS already reacts to OS changes; this
       keeps the attribute cleanly unset so the gated @media stays in
       charge. No-op visually. */
    if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-color-scheme: dark)');
        var onChange = function () {
            if (readChoice() === 'system') applyTheme('system');
        };
        if (mq.addEventListener) {
            mq.addEventListener('change', onChange);
        } else if (mq.addListener) {
            mq.addListener(onChange);
        }
    }
});
