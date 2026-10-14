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

    /* ---- Recentrage de la mini-carte à l'ouverture du panneau ---------------
       L'ouverture du panneau fait passer celui-ci en pleine largeur sous la
       ligne de méta (`.page-card--has-map`), ce qui décale la mise en page et
       peut désaligner les tuiles Leaflet. On récupère l'instance exposée par
       initPageCardMaps (core.js) sur l'élément `.page-card-map` et on la
       recentre : invalidateSize() pour recalculer la taille du conteneur, puis
       setView() sur les coordonnées de la carte (zoom courant conservé).
       On n'agit pas si la carte est absente, non initialisée, ou si l'événement
       n'a pas de lieu physique (lat/lon à 0/0, carte supprimée). */
    function recenterCardMap(btn) {
        var card = btn.closest('.page-card');
        if (!card) return;
        var mapEl = card.querySelector('.page-card-map');
        if (!mapEl) return;
        var map = mapEl._leafletMap;
        if (!map) return;

        var lat = parseFloat(mapEl.dataset.lat);
        var lon = parseFloat(mapEl.dataset.lon);
        if (!lat && !lon) return;

        // Le panneau vient d'être affiché : on attend la frame suivante pour que
        // Leaflet mesure le conteneur APRÈS le changement de mise en page.
        setTimeout(function () {
            map.invalidateSize();
            map.setView([lat, lon], map.getZoom());
        }, 0);
    }

    /** Ouvre un panneau — un seul à la fois. */
    function openPanel(btn) {
        closeAll(btn);
        var panel = panelOf(btn);
        btn.setAttribute('aria-expanded', 'true');
        if (panel) panel.classList.remove('hidden');
        recenterCardMap(btn);
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
       Mutualisé avec le menu .page-header-cal (pages/agenda.js) via les
       helpers SAR.copyToClipboard / SAR.flashFeedback (core.js) : essai de
       l'API Clipboard, repli sur document.execCommand('copy') dans les
       contextes non sécurisés comme http://localhost. */
    function copyIcsUrl(btn) {
        var panel = btn.closest('.agenda-cal-panel');
        var feedback = panel ? panel.querySelector('.agenda-cal-feedback') : null;
        var absoluteUrl = new URL(btn.dataset.icsUrl, window.location.href).href;
        SAR.copyToClipboard(absoluteUrl).then(function () {
            SAR.flashFeedback(feedback, btn.dataset.copiedLabel || '');
        });
    }

    /* ---- Ouverture au survol avec délai de grâce ----------------------------
       Souris seulement. L'entrée dans le bloc .agenda-cal ouvre le panneau ;
       la sortie programme sa fermeture après ~1500 ms, annulée si le pointeur
       revient (du bouton vers le panneau, par exemple). Un panneau ouvert au
       clic n'est jamais refermé par le survol : seule une ouverture issue du
       survol (data-opened-by-hover) est éligible à la fermeture différée. */
    var GRACE = 1500;
    if (canHover) {
        SAR.selectAll('.agenda-cal').forEach(function (block) {
            var btn = block.querySelector('.agenda-cal-btn');
            if (!btn) return;
            var panel = panelOf(btn);
            var closeTimer = null;

            function cancelClose() {
                if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
            }

            function enter() {
                cancelClose();
                if (!isOpen(btn)) {
                    openPanel(btn);
                    btn.setAttribute('data-opened-by-hover', 'true');
                }
            }

            function leave() {
                if (!isOpen(btn)) return;
                if (btn.getAttribute('data-opened-by-hover') !== 'true') return;
                closeTimer = setTimeout(function () {
                    closePanel(btn);
                    closeTimer = null;
                }, GRACE);
            }

            // `.agenda-cal` est en `display: contents` (CSS) : il n'a pas de boîte
            // propre, donc on écoute le bouton ET le panneau. La période de grâce
            // partagée laisse le pointeur passer de l'un à l'autre sans fermeture.
            btn.addEventListener('mouseenter', enter);
            btn.addEventListener('mouseleave', leave);
            if (panel) {
                panel.addEventListener('mouseenter', enter);
                panel.addEventListener('mouseleave', leave);
            }
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
