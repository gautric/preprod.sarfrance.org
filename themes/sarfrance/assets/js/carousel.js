/* Hero Carousel */
$(function() {
    var $track = $('.carousel-track');
    if (!$track.length) return;

    var $slides = $track.find('.carousel-slide');
    var $dots = $('.carousel-dot');
    var $prev = $('.carousel-prev');
    var $next = $('.carousel-next');
    var current = 0;
    var timer;

    function goTo(index) {
        current = (index + $slides.length) % $slides.length;
        $track.css('transform', 'translateX(-' + current * 100 + '%)');
        $dots.removeClass('active').eq(current).addClass('active');
    }

    function autoPlay() {
        timer = setInterval(function() { goTo(current + 1); }, 7500);
    }

    function resetTimer() {
        clearInterval(timer);
        autoPlay();
    }

    $prev.on('click', function() { goTo(current - 1); resetTimer(); });
    $next.on('click', function() { goTo(current + 1); resetTimer(); });
    $dots.on('click', function() { goTo(Number($(this).data('index'))); resetTimer(); });

    autoPlay();
});
