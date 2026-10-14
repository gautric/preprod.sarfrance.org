/* Agenda — panneau « Ajouter au calendrier » d'une carte d'événement (vanilla).

   Les URL Google / Outlook / .ics sont construites AU BUILD par
   partials/event-calendar.html : ce module ouvre et ferme le panneau et copie
   l'URL absolue du .ics dans le presse-papiers. Aucune logique de date ici —
   elle vit dans event-dates.html.

   Ouverture du panneau :
     - bouton .agenda-cal-btn (clic, Entrée, Espace — comportement natif) ;
     - survol de l'icône (souris uniquement, délai de grâce à la sortie) ;
     - raccourci : double-clic sur le corps de la carte.
   Fermeture : croix ✕, Échap (focus rendu au bouton), clic extérieur. */
SAR.onReady(function () {
    'use strict';

    var timeline = document.querySelector('.agenda-tl');
    if (!timeline) return;

    // Le survol n'est activé que sur les pointeurs fins (souris) : sur tactile,
    // le clic reste le seul déclencheur, sans :hover parasite.
    var canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;

    /** Panneau piloté par un bouton (via aria-controls). */
    function panelOf(btn) {
        return document.getElementById(btn.getAttribute('aria-controls'));
    }

    function closePanel(btn) {
        var panel = panelOf(btn);
        btn.setAttribute('aria-expanded', 'false');
        if (panel) panel.classList.add('hidden');
        btn.removeAttribute('data-opened-by-hover');
    }

    /** Ferme tous les panneaux ouverts, sauf celui de `except`. */
    function closeAll(except) {
        SAR.selectAll('.agenda-cal-btn[aria-expanded="true"]').forEach(function (btn) {
            if (btn !== except) closePanel(btn);
        });
    }

    /** Ouvre un panneau — un seul à la fois. */
    function openPanel(btn) {
        closeAll(btn);
        var panel = panelOf(btn);
        btn.setAttribute('aria-expanded', 'true');
        if (panel) panel.classList.remove('hidden');
    }

    function isOpen(btn) {
        return btn.getAttribute('aria-expanded') === 'true';
    }

    // Bouton d'ouverture et croix de fermeture, par délégation sur la timeline.
    timeline.addEventListener('click', function (event) {
        var btn = event.target.closest('.agenda-cal-btn');
        if (btn) {
            // Une interaction explicite neutralise la fermeture différée du survol.
            btn.removeAttribute('data-opened-by-hover');
            if (isOpen(btn)) closePanel(btn);
            else openPanel(btn);
            return;
        }

        var copy = event.target.closest('.agenda-cal-copy');
        if (copy) {
            copyIcsUrl(copy);
            return;
        }

        var close = event.target.closest('.agenda-cal-close');
        if (close) {
            var owner = close.closest('.agenda-cal').querySelector('.agenda-cal-btn');
            closePanel(owner);
            owner.focus();
        }
    });

    /* ---- Copie de l'URL absolue du .ics dans le presse-papiers --------------
       Même patron que l'icône .page-header-ics de pages/agenda.js : essai de
       l'API Clipboard, repli sur document.execCommand('copy') via un <textarea>
       temporaire (contextes non sécurisés comme http://localhost). */
    function copyIcsUrl(btn) {
        var panel = btn.closest('.agenda-cal-panel');
        var feedback = panel ? panel.querySelector('.agenda-cal-feedback') : null;
        var absoluteUrl = new URL(btn.dataset.icsUrl, window.location.href).href;

        function done() { showCopied(btn, feedback); }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(absoluteUrl).then(done, function () {
                if (legacyCopy(absoluteUrl)) done();
            });
        } else if (legacyCopy(absoluteUrl)) {
            done();
        }
    }

    /** Repli presse-papiers sans API Clipboard. Renvoie true si la copie a réussi. */
    function legacyCopy(text) {
        var area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'absolute';
        area.style.left = '-9999px';
        document.body.appendChild(area);
        area.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        document.body.removeChild(area);
        return ok;
    }

    /** Affiche « Lien copié ! » ~2 s puis le masque. */
    function showCopied(btn, feedback) {
        if (!feedback) return;
        feedback.textContent = btn.dataset.copiedLabel || '';
        feedback.classList.remove('hidden');
        if (feedback.hideTimer) clearTimeout(feedback.hideTimer);
        feedback.hideTimer = setTimeout(function () {
            feedback.classList.add('hidden');
            feedback.textContent = '';
        }, 2000);
    }

    /* ---- Ouverture au survol avec délai de grâce ----------------------------
       Souris seulement. L'entrée dans le bloc .agenda-cal ouvre le panneau ;
       la sortie programme sa fermeture après ~200 ms, annulée si le pointeur
       revient (du bouton vers le panneau, par exemple). Un panneau ouvert au
       clic n'est jamais refermé par le survol : seule une ouverture issue du
       survol (data-opened-by-hover) est éligible à la fermeture différée. */
    var GRACE = 200;
    if (canHover) {
        SAR.selectAll('.agenda-cal').forEach(function (block) {
            var btn = block.querySelector('.agenda-cal-btn');
            if (!btn) return;
            var closeTimer = null;

            block.addEventListener('mouseenter', function () {
                if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
                if (!isOpen(btn)) {
                    openPanel(btn);
                    btn.setAttribute('data-opened-by-hover', 'true');
                }
            });

            block.addEventListener('mouseleave', function () {
                if (!isOpen(btn)) return;
                if (btn.getAttribute('data-opened-by-hover') !== 'true') return;
                closeTimer = setTimeout(function () {
                    closePanel(btn);
                    closeTimer = null;
                }, GRACE);
            });
        });
    }

    // Raccourci : double-clic sur le corps de la carte. On épargne les zones
    // qui ont déjà leur propre comportement — liens (titre, 📷 Photos), boutons,
    // le bloc calendrier lui-même et la mini-carte (double-clic = zoom Leaflet).
    timeline.addEventListener('dblclick', function (event) {
        if (event.target.closest('a, button, .agenda-cal, .page-card-map')) return;

        var card = event.target.closest('.page-card');
        if (!card) return;

        var btn = card.querySelector('.agenda-cal-btn');
        if (!btn) return;

        openPanel(btn);
        btn.focus();

        // Le double-clic sélectionne le texte sous le pointeur : on l'annule
        // pour ne pas laisser la carte surlignée derrière le panneau.
        var selection = window.getSelection();
        if (selection) selection.removeAllRanges();
    });

    // Échap referme le panneau ouvert et rend le focus à son bouton.
    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') return;
        var open = document.querySelector('.agenda-cal-btn[aria-expanded="true"]');
        if (!open) return;
        closePanel(open);
        open.focus();
    });

    // Clic hors d'un bloc calendrier : tout refermer.
    document.addEventListener('click', function (event) {
        if (event.target.closest('.agenda-cal')) return;
        closeAll(null);
    });
});
