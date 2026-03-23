/* Chronologie - date formatting & tag filtering */
$(function() {
    var lang = $('html').attr('lang') || 'fr-FR';
    var locale = (lang === 'en-US' || lang === 'en') ? 'en-US' : 'fr-FR';

    // Format dates
    $('.page-card-date[data-iso-date]').each(function() {
        var isoDate = $(this).attr('data-iso-date');
        if (isoDate) {
            try {
                var p = isoDate.split('-');
                var date = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
                $(this).text(date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }));
            } catch (e) {
                console.warn('Failed to parse date:', isoDate);
            }
        }
    });

    // Tag filtering
    var $filters = $('.filter-btn[data-tag]');
    var $items = $('.tl-row[data-tags]');

    $filters.on('click', function() {
        $filters.removeClass('active');
        $(this).addClass('active');
        var tag = $(this).attr('data-tag');

        $items.each(function() {
            if (tag === 'all') {
                $(this).removeClass('hidden');
            } else {
                var tags = $(this).attr('data-tags').split(',');
                $(this).toggleClass('hidden', $.inArray(tag, tags) === -1);
            }
        });

        $('.tl-group').each(function() {
            var visible = $(this).find('.tl-row[data-tags]:not(.hidden)').length;
            $(this).toggle(visible > 0);
        });
    });
});
