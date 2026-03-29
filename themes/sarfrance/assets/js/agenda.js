/* Agenda — date formatting & type filtering (moment.js) */
$(function() {
    var lang = $('html').attr('lang') || 'fr-FR';
    var locale = (lang === 'en-US' || lang === 'en') ? 'en' : 'fr';
    moment.locale(locale);

    var dateFmt = (locale === 'en') ? 'MMMM D, YYYY' : 'D MMMM YYYY';
    var timeFmt = (locale === 'en') ? 'h:mm A' : 'HH:mm';
    var dateTimeFmt = dateFmt + ', ' + timeFmt;

    // Format month labels
    $('.tl-group-title[data-month-date]').each(function() {
        var raw = $(this).attr('data-month-date').split('/')[0];
        var m = moment(raw);
        var name = m.format('MMMM');
        $(this).text(name.charAt(0).toUpperCase() + name.slice(1));
    });

    // Format event dates — handles ISO 8601 intervals (start/end) and optional T component
    $('.page-card-date[data-date]').each(function() {
        var raw = $(this).attr('data-date');
        var interval = raw.split('/');
        var start = moment(interval[0]);
        var fmt = (interval[0].indexOf('T') !== -1) ? dateTimeFmt : dateFmt;
        if (interval.length > 1) {
            var end = moment(interval[1]);
            var sameDay = start.isSame(end, 'day');
            var endFmt;
            if (sameDay) {
                endFmt = (interval[1].indexOf('T') !== -1) ? timeFmt : dateFmt;
            } else {
                endFmt = (interval[1].indexOf('T') !== -1) ? dateTimeFmt : dateFmt;
            }
            $(this).text(start.format(fmt) + ' \u2013 ' + end.format(endFmt));
        } else {
            $(this).text(start.format(fmt));
        }
    });

    // Mini-maps Leaflet (shared helper from map.js)
    initPageCardMaps();

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
