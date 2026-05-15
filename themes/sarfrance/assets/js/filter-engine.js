/* ============================================================
   SAR FRANCE — Filter Engine
   Shared filtering, search & group visibility logic.

   Usage:
     FilterEngine(options)

   Options:
     filterSelector  — selector for filter buttons (required)
     filterAttr      — data attribute on buttons holding the value (e.g. 'data-tag', 'data-type')
     itemSelector    — selector for filterable items (required)
     itemAttr        — data attribute on items holding tag/type values (e.g. 'data-tags', 'data-type')
     multiValue      — true if itemAttr contains comma-separated values (default: false)
     searchSelector  — selector for search input (optional, enables text search)
     searchAttr      — data attribute on items holding searchable text (default: 'data-search')
     noResultSelector — selector for "no result" element (optional)
     noResultMethod  — 'toggle' (jQuery .toggle) or 'hidden' (prop hidden) (default: 'toggle')
     groupSelector   — selector for group containers (optional, enables group show/hide)
     groupItemSelector — selector for items inside a group to check visibility (optional, defaults to itemSelector + ':not(.hidden)')
     groupMode       — 'container' (items inside .tl-group) or 'sibling' (month rows followed by item rows) (default: 'container')
   ============================================================ */

// eslint-disable-next-line no-unused-vars
function FilterEngine(options) {
    var filterAttr = options.filterAttr || 'data-tag';
    var itemAttr = options.itemAttr || 'data-tags';
    var multiValue = options.multiValue !== false;
    var searchAttr = options.searchAttr || 'data-search';
    var noResultMethod = options.noResultMethod || 'toggle';
    var groupMode = options.groupMode || 'container';

    var $filters = $(options.filterSelector);
    var $items = $(options.itemSelector);
    var $search = options.searchSelector ? $(options.searchSelector) : null;
    var $noResult = options.noResultSelector ? $(options.noResultSelector) : null;

    var activeFilter = 'all';

    function matchesFilter($el) {
        if (activeFilter === 'all') return true;
        var val = $el.attr(itemAttr) || '';
        if (multiValue) {
            return val.split(',').indexOf(activeFilter) !== -1;
        }
        return val === activeFilter;
    }

    function matchesSearch($el, query) {
        if (!query) return true;
        var text = ($el.attr(searchAttr) || '').toLowerCase();
        return text.indexOf(query) !== -1;
    }

    function updateGroups() {
        if (!options.groupSelector) return;

        if (groupMode === 'container') {
            $(options.groupSelector).each(function() {
                var selector = options.groupItemSelector || (options.itemSelector + ':not(.hidden)');
                var visible = $(this).find(selector).length;
                $(this).toggle(visible > 0);
            });
        } else if (groupMode === 'sibling') {
            // Agenda-style: group header rows followed by item rows as siblings
            var groupSel = options.groupSelector;
            $(groupSel).each(function() {
                var $next = $(this).next();
                var hasVisible = false;
                while ($next.length && !$next.is(groupSel)) {
                    if ($next.is(options.itemSelector) && !$next.hasClass('hidden')) {
                        hasVisible = true;
                        break;
                    }
                    $next = $next.next();
                }
                $(this).toggle(hasVisible);
            });
        }
    }

    function updateNoResult(visibleCount) {
        if (!$noResult) return;
        if (noResultMethod === 'hidden') {
            $noResult.prop('hidden', visibleCount > 0);
        } else {
            $noResult.toggle(visibleCount === 0);
        }
    }

    function applyFilters() {
        var query = $search ? $search.val().toLowerCase().trim() : '';
        var visibleCount = 0;

        $items.each(function() {
            var $el = $(this);
            var visible = matchesFilter($el) && matchesSearch($el, query);
            $el.toggleClass('hidden', !visible);
            if (visible) visibleCount++;
        });

        updateGroups();
        updateNoResult(visibleCount);
    }

    // Bind filter buttons
    $filters.on('click', function() {
        $filters.removeClass('active');
        $(this).addClass('active');
        activeFilter = $(this).attr(filterAttr);
        applyFilters();
    });

    // Bind search input
    if ($search) {
        $search.on('input', applyFilters);
    }

    // Public API
    return { applyFilters: applyFilters };
}
