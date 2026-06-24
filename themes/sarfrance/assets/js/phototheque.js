/* Photothèque — lightbox gallery (vanilla) */
SAR.onReady(function () {
    'use strict';

    var lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    var lbImg = lightbox.querySelector('img');
    var lbCaption = lightbox.querySelector('.lightbox-caption');
    var prevBtn = lightbox.querySelector('.lightbox-prev');
    var nextBtn = lightbox.querySelector('.lightbox-next');
    var closeBtn = lightbox.querySelector('.lightbox-close');

    var galleryItems = SAR.selectAll('.gallery-item');
    var items = [];
    var currentIndex = 0;

    // Collect all gallery items
    galleryItems.forEach(function (item, i) {
        var img = item.querySelector('img');
        items.push({
            src: (img && (img.dataset.full || img.getAttribute('src'))) || '',
            caption: (img && img.getAttribute('alt')) || ''
        });

        item.addEventListener('click', function () {
            currentIndex = i;
            showImage(currentIndex);
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    function showImage(index) {
        lbImg.setAttribute('src', items[index].src);
        lbCaption.textContent = items[index].caption;
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function showPrev() {
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        showImage(currentIndex);
    }

    function showNext() {
        currentIndex = (currentIndex + 1) % items.length;
        showImage(currentIndex);
    }

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

    // Close when clicking the backdrop (but not its children)
    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) closeLightbox();
    });

    if (prevBtn) {
        prevBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            showPrev();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            showNext();
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') showPrev();
        if (e.key === 'ArrowRight') showNext();
    });
});
