/* ============================================================
   SAR FRANCE — Filter Engine (vanilla, no dependency)
   Shared filtering, search & group visibility logic.

   Usage:
     FilterEngine(options)

   Options:
     filterSelector  — selector for filter buttons (required)
     filterAttr      — data attribute on buttons holding the value (e.g. 'data-tag', 'data-type')
     itemSelector    — selector for filterable items (required)
     itemAttr        — data attribute on items holding tag/type values (e.g. 'data-tags', 'data-type')
     multiValue      — true if itemAttr contains comma-separated values (default: true)
     searchSelector  — selector for search input (optional, enables text search)
     searchAttr      — data attribute on items holding searchable text (default: 'data-search')
     noResultSelector — selector for "no result" element (optional)
     noResultMethod  — 'toggle' (show/hide via .hidden class) or 'hidden' (native hidden attribute) (default: 'toggle')
     groupSelector   — selector for group containers (optional, enables group show/hide)
     groupItemSelector — selector for items inside a group to check visibility (optional, defaults to itemSelector + ':not(.hidden)')
     groupMode       — 'container' (items inside .tl-group) or 'sibling' (month rows followed by item rows) (default: 'container')

   @param {object} options
   @returns {{ applyFilters: () => void }} public API
   ============================================================ */

// eslint-disable-next-line no-unused-vars
function FilterEngine(options) {
    'use strict';

    var filterAttr = options.filterAttr || 'data-tag';
    var itemAttr = options.itemAttr || 'data-tags';
    var multiValue = options.multiValue !== false;
    var searchAttr = options.searchAttr || 'data-search';
    var noResultMethod = options.noResultMethod || 'toggle';
    var groupMode = options.groupMode || 'container';

    var filters = SAR.selectAll(options.filterSelector);
    var items = SAR.selectAll(options.itemSelector);
    var search = options.searchSelector ? document.querySelector(options.searchSelector) : null;
    var noResult = options.noResultSelector ? document.querySelector(options.noResultSelector) : null;

    var activeFilter = 'all';

    /** @param {Element} el */
    function matchesFilter(el) {
        if (activeFilter === 'all') return true;
        var val = el.getAttribute(itemAttr) || '';
        if (multiValue) {
            return val.split(',').indexOf(activeFilter) !== -1;
        }
        return val === activeFilter;
    }

    /**
     * @param {Element} el
     * @param {string} query lowercased search query
     */
    function matchesSearch(el, query) {
        if (!query) return true;
        var text = (el.getAttribute(searchAttr) || '').toLowerCase();
        return text.indexOf(query) !== -1;
    }

    function updateGroups() {
        if (!options.groupSelector) return;

        if (groupMode === 'container') {
            var selector = options.groupItemSelector || (options.itemSelector + ':not(.hidden)');
            SAR.selectAll(options.groupSelector).forEach(function (group) {
                var visible = group.querySelectorAll(selector).length;
                group.classList.toggle('hidden', visible === 0);
            });
        } else if (groupMode === 'sibling') {
            // Agenda-style: group header rows followed by item rows as siblings
            var groupSel = options.groupSelector;
            SAR.selectAll(groupSel).forEach(function (header) {
                var next = header.nextElementSibling;
                var hasVisible = false;
                while (next && !next.matches(groupSel)) {
                    if (next.matches(options.itemSelector) && !next.classList.contains('hidden')) {
                        hasVisible = true;
                        break;
                    }
                    next = next.nextElementSibling;
                }
                header.classList.toggle('hidden', !hasVisible);
            });
        }
    }

    /** @param {number} visibleCount */
    function updateNoResult(visibleCount) {
        if (!noResult) return;
        if (noResultMethod === 'hidden') {
            noResult.hidden = visibleCount > 0;
        } else {
            noResult.classList.toggle('hidden', visibleCount !== 0);
        }
    }

    function applyFilters() {
        var query = search ? search.value.toLowerCase().trim() : '';
        var visibleCount = 0;

        items.forEach(function (el) {
            var visible = matchesFilter(el) && matchesSearch(el, query);
            el.classList.toggle('hidden', !visible);
            if (visible) visibleCount++;
        });

        updateGroups();
        updateNoResult(visibleCount);
    }

    // Bind filter buttons
    filters.forEach(function (btn) {
        btn.addEventListener('click', function () {
            filters.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            activeFilter = btn.getAttribute(filterAttr);
            applyFilters();
        });
    });

    // Bind search input
    if (search) {
        search.addEventListener('input', applyFilters);
    }

    // Public API
    return { applyFilters: applyFilters };
}
