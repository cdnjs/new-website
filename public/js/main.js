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

      var clipboard = event.clipboardData;
      clipboard.setData( "text/plain", url );
    });
  });


  var $hits = $('.packages-table-container tbody');
  var $allRows = $hits.html();
  function displayMatchingLibraries(success, content) {
    $('.packages-table-container').show();

    if (!success || content.query !== $('#search-box').val()) {
      return;
    }

    function getSafeHighlightedValue(highlight) {
      // extract & escape the attribute to prevent any XSS issue keeping the highlighting tags
      var v = highlight && highlight.value || '';
      return $('<div />').text(v).html().replace(/&lt;(\/?)em&gt;/g, '<$1em>');
    }

    var html = '';
    for (var i = 0; i < content.hits.length; ++i) {
      var hit = content.hits[i];
      var githubDetails = '';
      if (hit.github) {
        var user = getSafeHighlightedValue(hit._highlightResult.github.user);
        var repo = getSafeHighlightedValue(hit._highlightResult.github.repo);
        githubDetails = '<ul class="list-inline">' +
          '<li><i class="fa fa-github"></i> <a href="https://github.com/' + hit.github.user + '/' + hit.github.repo + '">' + user + '/' + repo + '</a></li>' +
          '<li><i class="fa fa-eye"></i> ' + hit.github.subscribers_count + '</li>' +
          '<li><i class="fa fa-star"></i> ' + hit.github.stargazers_count + '</li>' +
          '<li><i class="fa fa-code-fork"></i> ' + hit.github.forks + '</li>' +
        '</ul>';
      }

      var description = getSafeHighlightedValue(hit._highlightResult.description);
      var row = '<tr id="' + hit.objectID + '">' +
        '<td>' +
          '<p><a itemprop="name" href="/libraries/'+ hit.name + '">' +
            hit._highlightResult.name.value +
          '</a></p>' +
          '<p class="text-muted">' + description + '</p>' +
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
            '<p itemprop="downloadUrl" class="library-url" style="padding: 0; margin: 0">https://cdnjs.cloudflare.com/ajax/libs/' + hit.originalName + '/' + hit.version + '/' + hit.filename + '</p>' +
          '</div>' +
        '</td>' +
      '</tr>';
      html += row;
    }
    $hits.html(html);
    setupMouseEvents();
  }

  var animateTop = _.once(function() {
    $('.container.home').animate({ 'marginTop': '0px' }, 200);
  });

  var clearHash = _.once(function() {
    location.hash = '';
  });

  var lastHashQuery;
  function replaceHash(ev, val) {
    // Only replace the hash if we press enter
    if(val && val !== lastHashQuery
        && ev.keyCode === 13
        && 'replaceState' in history) {
      var encodedVal = encodeURIComponent(val).replace(/%20/g, '+');
      history.replaceState('', '', '#q=' + encodedVal);
      lastHashQuery = val;
    }
  }

  var algolia = new AlgoliaSearch('2QWLVLXZB6', '2663c73014d2e4d6d1778cc8ad9fd010', { dsn: true }); // public/search-only credentials
  var index = algolia.initIndex('libraries');
  var lastQuery;
  function searchHandler(ev) {
    animateTop();
    clearHash();

    var val = $(ev.currentTarget).val();
    replaceHash(ev, val);

    if (val === '') {
      $hits.html($allRows);
      $('.home .packages-table-container').hide();
    } else if (lastQuery !== val) {
      index.search(val, displayMatchingLibraries, { hitsPerPage: 20 });
    }
    lastQuery = val;
  }

  $('#search-box').on('keyup change', searchHandler);

  // Perform searches automatically based on the URL hash
  if (location.hash.length > 1) {
    var query = location.hash.match(/q=([^&]+)/);
    if (query) {
      query = decodeURIComponent(query[1]).replace(/\+/g, ' ');
      $('#search-box').val(query);
      animateTop();
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
