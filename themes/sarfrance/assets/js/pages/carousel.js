/* Hero Carousel (vanilla) */
SAR.onReady(function () {
    'use strict';

    var track = document.querySelector('.carousel-track');
    if (!track) return;

    var slides = SAR.selectAll('.carousel-slide', track);
    var dots = SAR.selectAll('.carousel-dot');
    var prev = document.querySelector('.carousel-prev');
    var next = document.querySelector('.carousel-next');
    /* Option C (carrousel en arrière-plan) : 20 s par image et fondu
       du texte à chaque changement. Autres mises en page : 7,5 s. */
    var root = document.documentElement;
    var heroText = document.querySelector('.hero-text');
    var current = 0;
    var timer;

    function isBackground() {
        return root.getAttribute('data-hero') === 'c';
    }

    function fadeInText() {
        if (!heroText) return;
        heroText.classList.remove('hero-text--fade');
        if (!isBackground()) return;
        void heroText.offsetWidth; /* relance l'animation CSS */
        heroText.classList.add('hero-text--fade');
    }

    function goTo(index) {
        current = (index + slides.length) % slides.length;
        track.style.transform = 'translateX(-' + (current * 100) + '%)';
        dots.forEach(function (dot, i) {
            dot.classList.toggle('active', i === current);
        });
        fadeInText();
    }

    function autoPlay() {
        timer = window.setInterval(function () { goTo(current + 1); }, isBackground() ? 20000 : 7500);
    }

    /* Changement de mise en page via le menu : texte visible, minuterie relancée. */
    document.addEventListener('sar:hero-layout', function () {
        if (heroText) heroText.classList.remove('hero-text--fade');
        resetTimer();
    });

    function resetTimer() {
        window.clearInterval(timer);
        autoPlay();
    }

    if (prev) {
        prev.addEventListener('click', function () { goTo(current - 1); resetTimer(); });
    }
    if (next) {
        next.addEventListener('click', function () { goTo(current + 1); resetTimer(); });
    }
    dots.forEach(function (dot) {
        dot.addEventListener('click', function () {
            goTo(Number(dot.dataset.index));
            resetTimer();
        });
    });

    autoPlay();
});
