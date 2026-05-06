$(document).ready(function () {
    var $lightbox = $('#lightbox');
    var $lbImg = $lightbox.find('img');
    var $lbCaption = $lightbox.find('.lightbox-caption');
    var items = [];
    var currentIndex = 0;

    // Collect all gallery items
    $('.gallery-item').each(function (i) {
        var $img = $(this).find('img');
        items.push({
            src: $img.data('full') || $img.attr('src'),
            caption: $img.attr('alt') || ''
        });
        $(this).data('index', i);
    });

    // Open lightbox on click
    $('.gallery-item').on('click', function () {
        currentIndex = $(this).data('index');
        showImage(currentIndex);
        $lightbox.addClass('active');
        $('body').css('overflow', 'hidden');
    });

    // Close lightbox
    $lightbox.find('.lightbox-close').on('click', closeLightbox);
    $lightbox.on('click', function (e) {
        if ($(e.target).is($lightbox)) {
            closeLightbox();
        }
    });

    // Navigation
    $lightbox.find('.lightbox-prev').on('click', function (e) {
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        showImage(currentIndex);
    });

    $lightbox.find('.lightbox-next').on('click', function (e) {
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % items.length;
        showImage(currentIndex);
    });

    // Keyboard navigation
    $(document).on('keydown', function (e) {
        if (!$lightbox.hasClass('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') $lightbox.find('.lightbox-prev').trigger('click');
        if (e.key === 'ArrowRight') $lightbox.find('.lightbox-next').trigger('click');
    });

    function showImage(index) {
        $lbImg.attr('src', items[index].src);
        $lbCaption.text(items[index].caption);
    }

    function closeLightbox() {
        $lightbox.removeClass('active');
        $('body').css('overflow', '');
    }
});
