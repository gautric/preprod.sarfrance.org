/* Library / Books — fetch JSON, render cards, search, category, language & sort */
$(function () {
  var $grid = $('.book-grid');
  var $searchInput = $('#book-search');
  var $catFilters = $('.filter-btn[data-cat]');
  var $sortBtns = $('.book-sort-btn');
  var $noResult = $('#book-no-result');
  var $sortCount = $('#book-sort-count');
  var activeCat = 'all';
  var sortField = 'title';
  var sortDir = 'asc';
  var jsonUrl = $grid.attr('data-json');

  var allBooks = [];
  var categories = {};
  var seeBookLabel = '';

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
      '" data-lang="' + escapeHtml(book.inLanguage || '') + '">';
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

  function sortBooks(books) {
    var sorted = books.slice();
    sorted.sort(function (a, b) {
      var va, vb;
      if (sortField === 'title') { va = a.name || ''; vb = b.name || ''; }
      else if (sortField === 'lang') { va = a.inLanguage || ''; vb = b.inLanguage || ''; }
      else { va = a.author || ''; vb = b.author || ''; }
      var cmp = va.localeCompare(vb, undefined, { sensitivity: 'base' });
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }

  function render() {
    var sorted = sortBooks(allBooks);
    var fragments = [];
    for (var i = 0; i < sorted.length; i++) {
      fragments.push(buildCard(sorted[i]));
    }
    $grid.html(fragments.join(''));
    applyFilters();
  }

  function applyFilters() {
    var query = $searchInput.val().toLowerCase().trim();
    var visibleCount = 0;

    $grid.children('.book-card').each(function () {
      var $c = $(this);
      var cats = ($c.attr('data-cat') || '').split(' ');
      var matchesCat = activeCat === 'all' || cats.indexOf(activeCat) !== -1;
      var matchesSearch = !query || $c.attr('data-search').indexOf(query) !== -1;
      var visible = matchesCat && matchesSearch;
      $c.toggleClass('hidden', !visible);
      if (visible) visibleCount++;
    });

    $noResult.prop('hidden', visibleCount > 0);
    $sortCount.text(visibleCount + ' / ' + allBooks.length);
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
      $btn.find('.sort-arrow').text(dir === 'asc' ? '▲' : '▼');
    } else {
      $sortBtns.removeClass('active');
      $btn.addClass('active');
    }

    sortField = field;
    sortDir = dir;
    render();
  });

  /* Fetch JSON and render */
  if (jsonUrl) {
    $.getJSON(jsonUrl).done(function (data) {
      categories = data.categories || {};
      seeBookLabel = data.seeBookLabel || '';
      allBooks = data.books || [];

      render();
    });
  }
});
