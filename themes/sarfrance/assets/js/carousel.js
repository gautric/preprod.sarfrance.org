/* Hero Carousel (vanilla) */
SAR.onReady(function () {
    'use strict';

    var track = document.querySelector('.carousel-track');
    if (!track) return;

    var slides = track.querySelectorAll('.carousel-slide');
    var dots = SAR.selectAll('.carousel-dot');
    var prev = document.querySelector('.carousel-prev');
    var next = document.querySelector('.carousel-next');
    var current = 0;
    var timer;

    function goTo(index) {
        current = (index + slides.length) % slides.length;
        track.style.transform = 'translateX(-' + (current * 100) + '%)';
        dots.forEach(function (dot, i) {
            dot.classList.toggle('active', i === current);
        });
    }

    function autoPlay() {
        timer = window.setInterval(function () { goTo(current + 1); }, 7500);
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
