/* Agenda - date formatting & type filtering */
$(function() {
    var lang = $('html').attr('lang') || 'fr-FR';
    var locale = (lang === 'en-US' || lang === 'en') ? 'en-US' : 'fr-FR';
    var dateFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    var monthFmt = new Intl.DateTimeFormat(locale, { month: 'long' });

    // Format month labels
    $('.tl-group-title[data-month-date]').each(function() {
        var p = $(this).attr('data-month-date').split('-');
        var d = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
        var name = monthFmt.format(d);
        $(this).text(name.charAt(0).toUpperCase() + name.slice(1));
    });

    // Format event dates
    $('.page-card-date[data-date]').each(function() {
        var p = $(this).attr('data-date').split('-');
        var start = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
        var endAttr = $(this).attr('data-date-end');
        if (endAttr) {
            var e = endAttr.split('-');
            var end = new Date(parseInt(e[0]), parseInt(e[1]) - 1, parseInt(e[2]));
            $(this).text(dateFmt.format(start) + ' \u2013 ' + dateFmt.format(end));
        } else {
            $(this).text(dateFmt.format(start));
        }
    });

    // Format heure (HH:MM → localized time)
    var timeFmt = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' });
    $('.agenda-card-heure[data-heure]').each(function() {
        var parts = $(this).attr('data-heure').split(':');
        var d = new Date(2000, 0, 1, parseInt(parts[0]), parseInt(parts[1]) || 0);
        $(this).text('\uD83D\uDD50 ' + timeFmt.format(d));
    });

    // Mini-maps Leaflet
    if (typeof L !== 'undefined') {
        $('.agenda-map[data-lat][data-lon]').each(function() {
            var $el = $(this);
            var lat = parseFloat($el.attr('data-lat'));
            var lon = parseFloat($el.attr('data-lon'));
            if (!lat && !lon) return;
            var map = L.map(this, { scrollWheelZoom: false, dragging: false, zoomControl: false, attributionControl: false }).setView([lat, lon], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
            L.marker([lat, lon]).addTo(map).bindPopup($el.attr('data-lieu') || '');
            setTimeout(function() { map.invalidateSize(); }, 200);
        });
    }

    // Type filtering
    var $filters = $('.filter-btn[data-type]');
    var $items = $('.tl-row[data-type]');
    var $months = $('.tl-group-title[data-month-date]');

    $filters.on('click', function() {
        $filters.removeClass('active');
        $(this).addClass('active');
        var type = $(this).attr('data-type');

        $items.each(function() {
            if (type === 'all') { $(this).removeClass('hidden'); }
            else { $(this).toggleClass('hidden', $(this).attr('data-type') !== type); }
        });

        $months.each(function() {
            var $monthRow = $(this).closest('.tl-row');
            var $next = $monthRow.next();
            var hasVisible = false;
            while ($next.length && !$next.find('.tl-group-title').length) {
                if ($next.is('[data-type]') && !$next.hasClass('hidden')) { hasVisible = true; break; }
                $next = $next.next();
            }
            $monthRow.toggle(hasVisible);
        });
    });
});
