// SAR FRANCE - Main JavaScript

$(function() {
    // Mobile menu toggle
    var $menuToggle = $('.menu-toggle');
    var $navMenu = $('.nav-menu');

    $menuToggle.on('click', function() {
        $navMenu.toggleClass('active');
        var expanded = $menuToggle.attr('aria-expanded') === 'true';
        $menuToggle.attr('aria-expanded', !expanded);
    });

    // Mobile submenu toggle
    if ($(window).width() <= 768) {
        $('.has-submenu > a').on('click', function(e) {
            e.preventDefault();
            $(this).parent().toggleClass('active');
        });
    }

    // Smooth scroll for anchor links
    $('a[href^="#"]').on('click', function(e) {
        e.preventDefault();
        var target = $($(this).attr('href'));
        if (target.length) {
            $('html, body').animate({ scrollTop: target.offset().top }, 400);
        }
    });

    // Header scroll effect
    var $header = $('.site-header');
    $(window).on('scroll', function() {
        if ($(window).scrollTop() > 100) {
            $header.css('box-shadow', '0 2px 10px rgba(0, 0, 0, 0.15)');
        } else {
            $header.css('box-shadow', 'none');
        }
    });
});
