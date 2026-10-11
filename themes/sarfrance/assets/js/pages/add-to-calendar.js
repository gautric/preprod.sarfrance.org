/* Agenda — panneau « Ajouter au calendrier » d'une carte d'événement (vanilla).

   Les trois URL (Google, Outlook, .ics) sont construites AU BUILD par
   partials/event-calendar.html : ce module ne fait qu'ouvrir et fermer le
   panneau. Aucune logique de date ici — elle vit dans event-dates.html.

   Deux accès au panneau : le bouton .agenda-cal-btn (clic, Entrée, Espace —
   comportement natif du <button>) et, en raccourci, un double-clic sur le
   corps de la carte. */
SAR.onReady(function () {
    'use strict';

    var timeline = document.querySelector('.agenda-tl');
    if (!timeline) return;

    /** Panneau piloté par un bouton (via aria-controls). */
    function panelOf(btn) {
        return document.getElementById(btn.getAttribute('aria-controls'));
    }

    function closePanel(btn) {
        var panel = panelOf(btn);
        btn.setAttribute('aria-expanded', 'false');
        if (panel) panel.classList.add('hidden');
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
            if (isOpen(btn)) closePanel(btn);
            else openPanel(btn);
            return;
        }

        var close = event.target.closest('.agenda-cal-close');
        if (close) {
            var owner = close.closest('.agenda-cal').querySelector('.agenda-cal-btn');
            closePanel(owner);
            owner.focus();
        }
    });

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
