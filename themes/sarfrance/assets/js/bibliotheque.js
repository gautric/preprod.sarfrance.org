/* Library / Books — Mustache + Isotope filtering, sorting & search (vanilla) */
(function () {
    'use strict';

    function init() {
        var grid = document.querySelector('.book-grid');
        if (!grid) return;

        var searchInput = document.getElementById('book-search');
        var catFilters = SAR.selectAll('.filter-btn[data-cat]');
        var sortBtns = SAR.selectAll('.book-sort-btn');
        var noResult = document.getElementById('book-no-result');
        var sortCount = document.getElementById('book-sort-count');
        var activeCat = 'all';
        var jsonUrl = grid.getAttribute('data-json');

        var allBooks = [];
        var categories = {};
        var seeBookLabel = '';
        var seeGallicaLabel = '';
        var iso = null;

        var template = [
            '<div class="book-card{{#image}} has-cover{{/image}}" data-cat="{{genreStr}}" data-search="{{searchStr}}" data-lang="{{inLanguage}}" data-title="{{titleLower}}" data-author="{{authorLower}}">',
                '<div class="book-card-text">',
                    '{{#catLabel}}<span class="tag cat-{{catKey}}">{{catLabel}}</span>{{/catLabel}}',
                    '<span class="book-name">',
                        '{{#gallica}}<a href="{{gallica}}" target="_blank" rel="noopener" title="{{seeGallicaLabel}}">{{name}}</a>{{/gallica}}',
                        '{{^gallica}}{{#isbn}}<a href="https://books.google.com/books?vid=ISBN{{isbn}}" target="_blank" rel="noopener" title="{{seeBookLabel}}">{{name}}</a>{{/isbn}}{{/gallica}}',
                        '{{^gallica}}{{^isbn}}{{name}}{{/isbn}}{{/gallica}}',
                    '</span>',
                    '<span class="book-sep">\u2014</span>',
                    '<span class="book-author">{{author}}</span>',
                    '<span class="book-publisher">({{publisherDisplay}}, {{dateDisplay}})</span>',
                    '<span class="book-detail">{{pagesDisplay}}</span>',
                    '{{#bookFormat}}<span class="book-detail">{{bookFormat}}</span>{{/bookFormat}}',
                    '{{#isbn}}<span class="book-isbn">ISBN {{isbn}}</span>{{/isbn}}',
                    '{{#inLanguage}}<span class="book-lang book-lang-{{inLanguage}}"></span>{{/inLanguage}}',
                '</div>',
                '{{#image}}<img class="book-cover" src="{{image}}" alt="" loading="lazy">{{/image}}',
            '</div>'
        ].join('');
        Mustache.parse(template);

        function buildCard(book) {
            var firstCat = book.genre[0] || '';
            var catData = categories[firstCat];
            var searchStr = [book.author, book.name, book.publisher].join(' ').toLowerCase();

            var view = {
                author: book.author,
                name: book.name,
                publisher: book.publisher,
                datePublished: book.datePublished,
                numberOfPages: book.numberOfPages,
                bookFormat: book.bookFormat,
                isbn: book.isbn,
                image: book.image,
                gallica: book.gallica,
                inLanguage: book.inLanguage,
                genreStr: book.genre,
                searchStr: searchStr,
                titleLower: (book.name || '').toLowerCase(),
                authorLower: (book.author || '').toLowerCase(),
                catKey: firstCat,
                catLabel: catData ? catData.label : '',
                seeBookLabel: seeBookLabel,
                seeGallicaLabel: seeGallicaLabel,
                publisherDisplay: book.publisher || 'N/A',
                dateDisplay: book.datePublished ? String(book.datePublished) : ' - ',
                pagesDisplay: book.numberOfPages ? book.numberOfPages + ' p.' : ' - '
            };

            return Mustache.render(template, view);
        }

        function initIsotope() {
            iso = new Isotope('.book-grid', {
                itemSelector: '.book-card',
                layoutMode: 'vertical',
                getSortData: {
                    title: '[data-title]',
                    author: '[data-author]',
                    lang: '[data-lang]'
                },
                sortBy: 'title',
                sortAscending: true,
                filter: '*',
                transitionDuration: '0.0s'
            });
            updateCount();
        }

        function updateCount() {
            if (!iso) return;
            var visible = iso.getFilteredItemElements().length;
            if (sortCount) sortCount.textContent = visible + ' / ' + allBooks.length;
            if (noResult) noResult.hidden = visible > 0;
        }

        function applyFilters() {
            if (!iso) return;
            var query = searchInput ? searchInput.value.toLowerCase().trim() : '';

            iso.arrange({
                filter: function () {
                    var cats = (this.getAttribute('data-cat') || '').split(' ');
                    var matchesCat = activeCat === 'all' || cats.indexOf(activeCat) !== -1;
                    var matchesSearch = !query || (this.getAttribute('data-search') || '').indexOf(query) !== -1;
                    return matchesCat && matchesSearch;
                }
            });
            updateCount();
        }

        if (searchInput) {
            searchInput.addEventListener('input', applyFilters);
        }

        catFilters.forEach(function (btn) {
            btn.addEventListener('click', function () {
                catFilters.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                activeCat = btn.getAttribute('data-cat');
                applyFilters();
            });
        });

        sortBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var field = btn.getAttribute('data-sort');
                var dir = btn.getAttribute('data-dir');

                if (btn.classList.contains('active')) {
                    dir = dir === 'asc' ? 'desc' : 'asc';
                    btn.setAttribute('data-dir', dir);
                    var arrow = btn.querySelector('.sort-arrow');
                    if (arrow) arrow.textContent = dir === 'asc' ? '▼' : '▲';
                } else {
                    sortBtns.forEach(function (b) { b.classList.remove('active'); });
                    btn.classList.add('active');
                }

                if (iso) {
                    iso.arrange({
                        sortBy: field,
                        sortAscending: dir === 'asc'
                    });
                }
            });
        });

        /* Fetch JSON, render cards via Mustache, then init Isotope */
        if (jsonUrl) {
            fetch(jsonUrl)
                .then(function (res) {
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    return res.json();
                })
                .then(function (data) {
                    categories = data.categories || {};
                    seeBookLabel = data.seeBookLabel || '';
                    seeGallicaLabel = data.seeGallicaLabel || '';
                    allBooks = data.books || [];

                    var fragments = [];
                    for (var i = 0; i < allBooks.length; i++) {
                        fragments.push(buildCard(allBooks[i]));
                    }
                    grid.innerHTML = fragments.join('');

                    initIsotope();
                })
                .catch(function () {
                    /* Silent failure — grid stays empty if the data cannot be loaded */
                });
        }
    }

    SAR.onReady(init);
})();
