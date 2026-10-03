/* Photothèque — lightbox gallery (vanilla) */
SAR.onReady(function () {
    'use strict';

    highlightEvent();

    /*
     * Arrivée depuis le lien 📷 d'une carte de l'agenda (?event=<id de l'événement>) :
     * met en évidence toutes les photos portant data-event="<id>", fait défiler jusqu'à
     * la première (ou jusqu'à celle de l'ancre #photo-…) et annonce leur nombre.
     */
    function highlightEvent() {
        var eventId = new URLSearchParams(window.location.search).get('event');
        if (!eventId) return;

        // Comparaison sur dataset : l'identifiant contient « / » et « : », inutilisables tels quels dans un sélecteur.
        var matches = SAR.selectAll('.gallery-item[data-event]').filter(function (item) {
            return item.dataset.event === eventId;
        });
        if (!matches.length) return;

        matches.forEach(function (item) {
            item.classList.add('photo--highlight');
        });

        var hashTarget = window.location.hash ? document.getElementById(window.location.hash.slice(1)) : null;
        var first = matches.indexOf(hashTarget) !== -1 ? hashTarget : matches[0];
        first.scrollIntoView({ block: 'start' });

        var status = document.querySelector('.gallery-status');
        if (status) {
            var msg = matches.length === 1 ? status.dataset.msgOne : status.dataset.msgOther;
            // Léger délai : une région aria-live modifiée pendant le chargement n'est pas toujours annoncée.
            window.setTimeout(function () {
                status.textContent = (msg || '').replace('{n}', matches.length);
            }, 500);
        }
    }

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
