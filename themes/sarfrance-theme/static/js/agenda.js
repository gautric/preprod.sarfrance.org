/* Agenda - date formatting & type filtering */
$(function() {
    var lang = $('html').attr('lang') || 'fr-FR';
    var locale = (lang === 'en-US' || lang === 'en') ? 'en-US' : 'fr-FR';
    var dateFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    var monthFmt = new Intl.DateTimeFormat(locale, { month: 'long' });

    // Format month labels
    $('.agenda-item__label[data-month-date]').each(function() {
        var p = $(this).attr('data-month-date').split('-');
        var d = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
        var name = monthFmt.format(d);
        $(this).text(name.charAt(0).toUpperCase() + name.slice(1));
    });

    // Format event dates
    $('.agenda-item__date[data-date]').each(function() {
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

    // Type filtering
    var $filters = $('.filter-btn[data-type]');
    var $items = $('.agenda-item[data-type]');
    var $months = $('.agenda-item__label[data-month-date]');

    $filters.on('click', function() {
        $filters.removeClass('active');
        $(this).addClass('active');
        var type = $(this).attr('data-type');

        $items.each(function() {
            if (type === 'all') { $(this).removeClass('hidden'); }
            else { $(this).toggleClass('hidden', $(this).attr('data-type') !== type); }
        });

        $months.each(function() {
            var $monthRow = $(this).closest('.agenda-item');
            var $next = $monthRow.next();
            var hasVisible = false;
            while ($next.length && !$next.find('.agenda-item__label').length) {
                if ($next.is('[data-type]') && !$next.hasClass('hidden')) { hasVisible = true; break; }
                $next = $next.next();
            }
            $monthRow.toggle(hasVisible);
        });
    });
});
