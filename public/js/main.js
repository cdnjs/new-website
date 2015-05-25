 currentUser = null; // This will contain the logged in user

(function($) {
    function selectText(element) {
      var doc = document;
      var text = element;
      var range;

      if (doc.body.createTextRange) { // ms
        range = doc.body.createTextRange();
        range.moveToElementText(text);
        range.select();
      } else if (window.getSelection) { // moz, opera, webkit
        var selection = window.getSelection();
        range = doc.createRange();
        range.selectNodeContents(text);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }


  var copyEl = $('<div/>').addClass('btn-group copy-button-group');
  var copyElButton = $('<button/>').attr('data-copy-type','').attr('type', 'button').addClass('btn btn-primary btn-sm copy-button').text('Copy');
  var toggleButton = $('<button/>').attr('data-toggle', 'dropdown').attr('type', 'button').addClass('btn btn-primary btn-sm dropdown-toggle').append($('<span/>').addClass('caret'));
  copyElButton.appendTo(copyEl);
  toggleButton.appendTo(copyEl);
  copyEl.append('<ul class="dropdown-menu copy-options">' +
                    '<li><a data-copy-type="https:" class="copy-https-url copy-button" href="#">Copy Url</a></li>' +
                    '<li class="js"><a data-copy-embed="script" data-copy-type="https:" class=" copy-https-script copy-button" href="#">Copy Script Tag</a></li>' +
                    '<li class="css"><a data-copy-embed="link" data-copy-type="https:" class=" copy-https-link copy-button" href="#">Copy Link Tag</a></li>' +
                 '</ul>');

  var copyContainer = $('<div/>');
  copyEl.attr('style', 'display: none;');
  copyEl.appendTo('body');

  function setupMouseEvents() {
    $('.library-column').on( "mouseenter", function(ev) {
      var cont = $(ev.currentTarget);
      copyEl.show();
      copyEl.appendTo(cont);
    })
    .on( "mouseleave", function(ev) {
      var cont = $(ev.currentTarget);
      //copyEl.appendTo('body');
    });
  }

  var client = new ZeroClipboard($(".copy-button"));
  client.on( "ready", function( readyEvent ) {
    // ZeroClipboard is enabled. Display copy button.
    setupMouseEvents();
    client.on( "copy", function (event) {
      var button = $(event.target);
      var embed = button.attr('data-copy-embed');
      var url = $('.library-url', button.parents('.library-column')).text();
      var oldurl = url;
      if(embed === 'script') {
        url = '<script type="text/javascript" src="' + url + '"></script>';
      } else if (embed === 'link') {
        url = '<link rel="stylesheet" href="' + url + '">';
      }
          ga('send', 'event', 'library', 'copied', button.parents('.library-column').attr('data-lib-name'), 4);

      toastr.warning('Copied to the clipboard');

      var clipboard = event.clipboardData;
      clipboard.setData( "text/plain", url );
    });
  });
  //http://www.merriampark.com/ld.htm, http://www.mgilleland.com/ld/ldjavascript.htm, Damerau–Levenshtein distance (Wikipedia)

  function levDist(s, t) {
    var d = []; //2d matrix

    // Step 1
    var n = s.length;
    var m = t.length;

    if (n == 0) return m;
    if (m == 0) return n;

    //Create an array of arrays in javascript (a descending loop is quicker)
    for (var i = n; i >= 0; i--) d[i] = [];

    // Step 2
    for (var i = n; i >= 0; i--) d[i][0] = i;
    for (var j = m; j >= 0; j--) d[0][j] = j;

    // Step 3
    for (var i = 1; i <= n; i++) {
      var s_i = s.charAt(i - 1);

      // Step 4
      for (var j = 1; j <= m; j++) {

        //Check the jagged ld total so far
        if (i == j && d[i][j] > 4) return n;

        var t_j = t.charAt(j - 1);
        var cost = (s_i == t_j) ? 0 : 1; // Step 5

        //Calculate the minimum
        var mi = d[i - 1][j] + 1;
        var b = d[i][j - 1] + 1;
        var c = d[i - 1][j - 1] + cost;

        if (b < mi) mi = b;
        if (c < mi) mi = c;

        d[i][j] = mi; // Step 6

        //Damerau transposition
        if (i > 1 && j > 1 && s_i == t.charAt(j - 2) && s.charAt(i - 2) == t_j) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
        }
      }
    }

    // Step 7
    return d[n][m];
  }

  // TODO: generate this as part of the template
  rowSelector = '#example > tbody > tr';
  matchedRowSelector = '#example tr.search-result';
  libraryNameCache = _.pluck($(rowSelector), 'id');

  var $hits = $('.packages-table-container tbody');
  var $allRows = $hits.html();
  function displayMatchingLibraries(success, content) {
    $('.packages-table-container').show();

    if (!success || content.query !== $('#search-box').val()) {
      return;
    }
    var html = '';
    for (var i = 0; i < content.hits.length; ++i) {
      var hit = content.hits[i];
      var githubDetails = '';
      if (hit.github) {
        githubDetails = '<ul class="list-inline">' +
          '<li><i class="fa fa-github"></i> <a href="https://github.com/' + hit.github.user + '/' + hit.github.repo + '">' + hit.github.user + '/' + hit.github.repo + '</a></li>' +
          '<li><i class="fa fa-star"></i> ' + hit.github.stargazers_count + '</li>' +
          '<li><i class="fa fa-code-fork"></i> ' + hit.github.forks + '</li>' +
        '</ul>';
      }
      var row = '<tr id="' + hit.objectID + '">' +
        '<td>' +
          '<p><a itemprop="name" href="libraries/'+ hit.name + '">' +
            hit._highlightResult.name.value +
          '</a></p>' +
          '<p class="text-muted">' + (hit._highlightResult.description && hit._highlightResult.description.value) + '</p>' +
          '<ul class="list-inline">' +
            $.map(hit._highlightResult.keywords || [], function(e) { 
              var extraClass = (e.matchLevel !== 'none') ? 'highlight' : '';
              return '<li class="label label-default ' + extraClass + '">' + e.value + '</li>'; 
            }).join(' ') +
          '</ul>' +
          githubDetails +
        '</td>' +
        '<td style="white-space: nowrap;">' +
          '<div style="position: relative; padding: 8px;" data-lib-name="' + hit.name + '" class="library-column ' + hit.fileType + '-type">' +
            '<p itemprop="downloadUrl" class="library-url" style="padding: 0; margin: 0">//cdnjs.cloudflare.com/ajax/libs/' + hit.originalName + '/' + hit.version + '/' + hit.filename + '</p>' +
          '</div>' +
        '</td>' +
      '</tr>';
      html += row;
    }
    $hits.html(html);
    setupMouseEvents();
  }

  var algolia = new AlgoliaSearch('2QWLVLXZB6', '2663c73014d2e4d6d1778cc8ad9fd010', { dsn: true }); // public/search-only credentials
  var index = algolia.initIndex('libraries');
  var lastQuery;
  function searchHandler(ev) {
    $('.container.home').animate({ 'marginTop': '0px' }, 200);
    // cleanup URL hash if present
    location.hash = ''

    var val = $(ev.currentTarget).val();
    if (val === '') {
      $hits.html($allRows);
    $('.packages-table-container').hide();

    } else if (lastQuery !== val) {
      index.search(val, displayMatchingLibraries, { hitsPerPage: 20 });
    }
    lastQuery = val;
  }

  $('#search-box').on('keyup change', searchHandler);

  // Perform searches automatically based on the URL hash
  if (location.hash.length > 1) {
    var query = location.hash.match(/q=([\w+]+)/)
    if (query) {
      query = query[1].replace(/\+/, ' ')
      $('#search-box').val(query)
      index.search(query, displayMatchingLibraries, { hitsPerPage: 20 });
    }
  }

  // Put favorite libraries at the top of the list
  //putClassOnFavorites(getFavorites());
  $('#search-box').focus();

  $('.version-selector').on('change', function (ev) {
    var libraryVersion = $(ev.currentTarget).val();
    var libraryName = $('#library-name').text();
    var newURL = window.location.origin + '/libraries/' + libraryName + '/' + libraryVersion;
    window.location.href = newURL;
  });


})(jQuery);
