/* Hero Carousel (vanilla) */
SAR.onReady(function () {
    'use strict';

    var track = document.querySelector('.carousel-track');
    if (!track) return;

    var slides = SAR.selectAll('.carousel-slide', track);
    var dots = SAR.selectAll('.carousel-dot');
    var prev = document.querySelector('.carousel-prev');
    var next = document.querySelector('.carousel-next');
    var carousel = track.closest('.hero-carousel');
    var interval = Number(carousel && carousel.dataset.interval) || 7500;
    /* Hero en arrière-plan : le texte réapparaît en fondu à chaque image */
    var heroText = document.querySelector('.hero--bg .hero-text');
    var current = 0;
    var timer;

    function fadeInText() {
        if (!heroText) return;
        heroText.classList.remove('hero-text--fade');
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
        timer = window.setInterval(function () { goTo(current + 1); }, interval);
    }

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
