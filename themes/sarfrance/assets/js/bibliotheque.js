/* Library / Books — Mustache + Isotope-powered filtering, sorting & search */
$(function () {
  var $grid = $('.book-grid');
  var $searchInput = $('#book-search');
  var $catFilters = $('.filter-btn[data-cat]');
  var $sortBtns = $('.book-sort-btn');
  var $noResult = $('#book-no-result');
  var $sortCount = $('#book-sort-count');
  var activeCat = 'all';
  var jsonUrl = $grid.attr('data-json');

  var allBooks = [];
  var categories = {};
  var seeBookLabel = '';
  var iso = null;

  var template = [
    '<div class="book-card{{#image}} has-cover{{/image}}" data-cat="{{genreStr}}" data-search="{{searchStr}}" data-lang="{{inLanguage}}" data-title="{{titleLower}}" data-author="{{authorLower}}">',
      '<div class="book-card-text">',
        '{{#catLabel}}<span class="tag cat-{{catKey}}">{{catLabel}}</span>{{/catLabel}}',
        '<span class="book-name">',
          '{{#isbn}}<a href="https://books.google.com/books?vid=ISBN{{isbn}}" target="_blank" rel="noopener" title="{{seeBookLabel}}">{{name}}</a>{{/isbn}}',
          '{{^isbn}}{{name}}{{/isbn}}',
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
      inLanguage: book.inLanguage,
      genreStr: book.genre.join(' '),
      searchStr: searchStr,
      titleLower: (book.name || '').toLowerCase(),
      authorLower: (book.author || '').toLowerCase(),
      catKey: firstCat,
      catLabel: catData ? catData.label : '',
      seeBookLabel: seeBookLabel,
      publisherDisplay: book.publisher || 'N/A',
      dateDisplay: book.datePublished ? String(book.datePublished) : 'N/A',
      pagesDisplay: book.numberOfPages ? book.numberOfPages + ' p.' : 'N/A'
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
    $sortCount.text(visible + ' / ' + allBooks.length);
    $noResult.prop('hidden', visible > 0);
  }

  function applyFilters() {
    if (!iso) return;
    var query = $searchInput.val().toLowerCase().trim();

    iso.arrange({
      filter: function () {
        var $el = $(this);
        var cats = ($el.attr('data-cat') || '').split(' ');
        var matchesCat = activeCat === 'all' || cats.indexOf(activeCat) !== -1;
        var matchesSearch = !query || ($el.attr('data-search') || '').indexOf(query) !== -1;
        return matchesCat && matchesSearch;
      }
    });
    updateCount();
  }

  $searchInput.on('input', applyFilters);

  $catFilters.on('click', function () {
    $catFilters.removeClass('active');
    $(this).addClass('active');
    activeCat = $(this).attr('data-cat');
    applyFilters();
  });

  $sortBtns.on('click', function () {
    var $btn = $(this);
    var field = $btn.attr('data-sort');
    var dir = $btn.attr('data-dir');

    if ($btn.hasClass('active')) {
      dir = dir === 'asc' ? 'desc' : 'asc';
      $btn.attr('data-dir', dir);
      $btn.find('.sort-arrow').text(dir === 'asc' ? '▼' : '▲');
    } else {
      $sortBtns.removeClass('active');
      $btn.addClass('active');
    }

    if (iso) {
      iso.arrange({
        sortBy: field,
        sortAscending: dir === 'asc'
      });
    }
  });

  /* Fetch JSON, render cards via Mustache, then init Isotope */
  if (jsonUrl) {
    $.getJSON(jsonUrl).done(function (data) {
      categories = data.categories || {};
      seeBookLabel = data.seeBookLabel || '';
      allBooks = data.books || [];

      var fragments = [];
      for (var i = 0; i < allBooks.length; i++) {
        fragments.push(buildCard(allBooks[i]));
      }
      $grid.html(fragments.join(''));

      initIsotope();
    });
  }
});
