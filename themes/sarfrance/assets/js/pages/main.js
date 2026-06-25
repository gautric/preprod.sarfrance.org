// SAR FRANCE — Main JavaScript (vanilla, no dependency)
(function () {
    'use strict';

    SAR.onReady(function () {
        initMobileMenu();
        initMobileSubmenus();
        initSmoothScroll();
        initHeaderScrollShadow();
    });

    /** Toggle the mobile navigation menu. */
    function initMobileMenu() {
        var menuToggle = document.querySelector('.menu-toggle');
        var navMenu = document.querySelector('.nav-menu');
        if (!menuToggle || !navMenu) return;

        menuToggle.addEventListener('click', function () {
            navMenu.classList.toggle('active');
            var expanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', String(!expanded));
        });
    }

    /** Expand/collapse submenus on small screens (adapts on resize/rotation). */
    function initMobileSubmenus() {
        var mobileQuery = window.matchMedia('(max-width: 768px)');

        SAR.selectAll('.has-submenu > a').forEach(function (link) {
            link.addEventListener('click', function (e) {
                if (mobileQuery.matches) {
                    e.preventDefault();
                    link.parentElement.classList.toggle('active');
                }
            });
        });
    }

    /**
     * Smooth-scroll to in-page anchors. The actual animation is handled by the
     * CSS `scroll-behavior: smooth` rule on <html>; here we only resolve the
     * target and guard against the bare "#" href.
     */
    function initSmoothScroll() {
        SAR.selectAll('a[href^="#"]').forEach(function (link) {
            link.addEventListener('click', function (e) {
                var href = link.getAttribute('href');
                if (!href || href === '#') return;

                var target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView();
                }
            });
        });
    }

    /** Drop a subtle shadow under the sticky header once the page is scrolled. */
    function initHeaderScrollShadow() {
        var header = document.querySelector('.site-header');
        if (!header) return;

        window.addEventListener('scroll', function () {
            header.style.boxShadow = window.scrollY > 100
                ? '0 2px 10px rgba(0, 0, 0, 0.15)'
                : 'none';
        }, { passive: true });
    }
})();
