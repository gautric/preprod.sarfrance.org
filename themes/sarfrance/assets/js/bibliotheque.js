/* Library / Books — Isotope-powered filtering, sorting & search */
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

  function escapeHtml(str) {
    if (!str) return '';
    return $('<span>').text(str).html();
  }

  function buildCard(book) {
    var firstCat = book.genre[0] || '';
    var catData = categories[firstCat];
    var hasCover = book.image ? ' has-cover' : '';
    var searchStr = [book.author, book.name, book.publisher].join(' ').toLowerCase();

    var html = '<div class="book-card' + hasCover + '" data-cat="' +
      escapeHtml(book.genre.join(' ')) + '" data-search="' + escapeHtml(searchStr) +
      '" data-lang="' + escapeHtml(book.inLanguage || '') +
      '" data-title="' + escapeHtml((book.name || '').toLowerCase()) +
      '" data-author="' + escapeHtml((book.author || '').toLowerCase()) + '">';
    html += '<div class="book-card-text">';

    if (catData) {
      html += '<span class="tag cat-' + escapeHtml(firstCat) + '">' + escapeHtml(catData.label) + '</span>';
    }

    html += '<span class="book-name">';
    if (book.isbn) {
      html += '<a href="https://books.google.com/books?vid=ISBN' + escapeHtml(book.isbn) +
        '" target="_blank" rel="noopener" title="' + escapeHtml(seeBookLabel) + '">' +
        escapeHtml(book.name) + '</a>';
    } else {
      html += escapeHtml(book.name);
    }
    html += '</span>';

    html += '<span class="book-sep">—</span>';
    html += '<span class="book-author">' + escapeHtml(book.author) + '</span>';
    html += '<span class="book-publisher">(' +
      escapeHtml(book.publisher || 'N/A') + ', ' +
      escapeHtml(book.datePublished ? String(book.datePublished) : 'N/A') + ')</span>';
    html += '<span class="book-detail">' +
      (book.numberOfPages ? book.numberOfPages + ' p.' : 'N/A') + '</span>';

    if (book.bookFormat) {
      html += '<span class="book-detail">' + escapeHtml(book.bookFormat) + '</span>';
    }
    if (book.isbn) {
      html += '<span class="book-isbn">ISBN ' + escapeHtml(book.isbn) + '</span>';
    }
    if (book.inLanguage) {
      html += '<span class="book-lang book-lang-' + escapeHtml(book.inLanguage) + '"></span>';
    }

    html += '</div>';
    if (book.image) {
      html += '<img class="book-cover" src="' + escapeHtml(book.image) + '" alt="" loading="lazy">';
    }
    html += '</div>';
    return html;
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

  /* Fetch JSON, render cards, then init Isotope */
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
