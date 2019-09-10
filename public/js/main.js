/* eslint-env browser */
/* global appLoading, Clipboard, SRI, ga, _, scrollProgress, algoliasearch, jQuery */

(function ($) {
  /****
   * CDN Provider Scripting
   ****/

  var cdn_provider = '', cdn_provider_base_url = {};

  function decideCDNProvider() {
    var target_cdn_provider = location.hash.substr(1, location.hash.length).toLowerCase();
    if (!cdn_provider_base_url[target_cdn_provider]) target_cdn_provider = 'cloudflare';
    return target_cdn_provider;
  }

  function setupCDNProviders() {
    // Define providers globally
    cdn_provider_base_url = {
      cloudflare: 'https://cdnjs.cloudflare.com/ajax/libs/'
    };

    // Define initial provider globally
    cdn_provider = decideCDNProvider();

    // Set library URLs to use provider
    $('p.library-url').each(function () {
      $(this).html(cdn_provider_base_url[cdn_provider] + $(this).html());
    });
  }

  function updateCDNProvider(new_provider) {
    // Set library URLs to use provider
    $('p.library-url').each(function () {
      $(this).html($(this).html().replace(cdn_provider_base_url[cdn_provider], cdn_provider_base_url[new_provider]));
    });

    // Update the global provider
    cdn_provider = new_provider;
  }

  /****
   * Copy Button Scripting
   ****/

  var baseURI, copyEl, clipboard;

  function generateCopyDropdown(sri) {
    var SRIcopyButton = '', SRIcopyWithoutTagButton = '';

    if (typeof (SRI) !== 'undefined' || typeof (sri) !== 'undefined') {
      var SRIdata = typeof (sri) !== 'undefined' ? ' data-sri="' + sri + '"' : '';
      SRIcopyButton =
        '  <li class="js"><a data-copy-embed="script-sri" data-copy-type="https:"' + SRIdata + ' class="copy-https-script copy-button" href="javascript:void(0);">Copy Script Tag</a></li>' +
        '  <li class="css"><a data-copy-embed="link-sri" data-copy-type="https:"' + SRIdata + ' class="copy-https-link copy-button" href="javascript:void(0);">Copy Link Tag</a></li>';
      SRIcopyWithoutTagButton =
        '  <li class="js css"><a data-copy-embed="file-sri" class="copy-button"' + SRIdata + ' href="javascript:void(0);">Copy SRI</a></li>';
    }

    return '<ul class="dropdown-menu copy-options">' +
      '  <li><a data-copy-type="https:" class="copy-https-url copy-button" href="javascript:void(0);">Copy Url</a></li>' +
      SRIcopyWithoutTagButton +
      SRIcopyButton +
      '  <li class="js"><a data-copy-embed="script" data-copy-type="https:" class=" copy-https-script copy-button" href="javascript:void(0);">Copy Script Tag without SRI</a></li>' +
      '  <li class="css"><a data-copy-embed="link" data-copy-type="https:" class=" copy-https-link copy-button" href="javascript:void(0);">Copy Link Tag without SRI</a></li>' +
      '</ul>';
  }

  function createBaseCopyButton() {
    baseURI = cdn_provider_base_url[cdn_provider] +
      $('#library-name').text() + '/' +
      $('select.version-selector :selected').val() + '/';

    copyEl = $('<div/>')
      .addClass('btn-group copy-button-group');

    $('<button/>')
      .attr('data-copy-type', '')
      .attr('type', 'button')
      .addClass('btn btn-primary btn-sm copy-button')
      .text('Copy')
      .appendTo(copyEl);

    $('<button/>')
      .attr('data-toggle', 'dropdown')
      .attr('type', 'button')
      .addClass('btn btn-primary btn-sm dropdown-toggle')
      .append($('<span/>').addClass('caret'))
      .appendTo(copyEl);

    copyEl.append(generateCopyDropdown());
    copyEl.attr('style', 'display: none;');
    copyEl.appendTo('body');
  }

  function setupCopyButton() {
    // Create the clipboard handler
    clipboard = new Clipboard('.copy-button', {
      text: function (trigger) {
        var $button = $(trigger),
          url = $('.library-url', $button.parents('.library-column')).text(),
          fileSRI = '';

        if (typeof (SRI) !== 'undefined') {
          fileSRI = SRI[url.replace(baseURI, '')];
        } else if ($button.attr('data-sri') !== 'undefined') {
          fileSRI = $button.attr('data-sri');
        }

        switch ($button.attr('data-copy-embed')) {
          case 'script':
            url = '<script src="' + url + '"></script>';
            break;
          case 'script-sri':
            url = '<script src="' + url + '" integrity="' + fileSRI + '" crossorigin="anonymous"></script>';
            break;
          case 'link':
            url = '<link rel="stylesheet" href="' + url + '" />';
            break;
          case 'link-sri':
            url = '<link rel="stylesheet" href="' + url + '" integrity="' + fileSRI + '" crossorigin="anonymous" />';
            break;
          case 'file-sri':
            url = fileSRI;
            break;
        }
        return url;
      }
    });

    // Show copied tooltip on copy
    clipboard.on('success', function (e) {
      var button = $(e.trigger);
      var btContainer = button.parents('.copy-button-group').tooltip({
        trigger: 'manual',
        placement: 'bottom',
        title: 'Copied!'
      });
      btContainer.tooltip('show');
      setTimeout(function () {
        btContainer.tooltip('hide');
        btContainer.tooltip('destroy');
      }, 1000);

      ga('send', 'event', 'library', 'copied', button.parents('.library-column').attr('data-lib-name'), 4);
    });

    // Revert to text box if copy fails
    clipboard.on('error', function (e) {
      var button = $(e.trigger);
      var msg;
      if (/Mac/i.test(navigator.userAgent)) {
        msg = 'Press ⌘-C to copy';
      } else {
        msg = 'Press Ctrl-C to copy';
      }

      var btContainer = button.parents('.copy-button-group').tooltip({
        trigger: 'manual',
        placement: 'bottom',
        title: msg
      });
      btContainer.tooltip('show');
      setTimeout(function () {
        btContainer.tooltip('hide');
        btContainer.tooltip('destroy');
      }, 1000);

      ga('send', 'event', 'library', 'copied', button.parents('.library-column').attr('data-lib-name'), 4);
    });
  }

  function setupMouseEvents() {
    // Currently not showing the copy button for iOS, check clipboard.js support
    if (!(/iPhone|iPad/i.test(navigator.userAgent))) {
      $('.packages-table-container table tbody tr, .library-table-container table tbody tr').hover(function (ev) {
        // If we're on a search page, update the buttons for the right lib
        if ($(".packages-table-container")[0]) {
          copyEl.children('ul').remove();
          copyEl.append(generateCopyDropdown(this.dataset.sri));
        }

        // Show the button
        copyEl.appendTo($(ev.currentTarget).find('.library-column'));
        copyEl.show();
      }, function () {
        // Hide the button when hover ends
        copyEl.hide();
      });

      // Setup the clipboard handler
      if (clipboard) clipboard.destroy();
      setupCopyButton();
    }
  }

  /****
   * Main Scripting
   ****/

  // Set the loading bar color
  appLoading.setColor('#FF9900');

  // Setup the CDN provide preference
  setupCDNProviders();

  // Setup the copy button
  createBaseCopyButton();
  setupMouseEvents();

  // TODO: below

  var displayPage = 0;
  var queryItems = 20;
  var cachedQueryResult = {};
  var lazyScroll = false;
  var $nbHitsField = $('#nb-hits-field');
  var $processingTimeMS = $('#processing-time-ms');
  var $hits = $('.packages-table-container tbody');
  var $allRows = $hits.html();

  function displayMatchingLibraries(err, content) {
    $('.packages-table-container').show();
    if (err) {
      appLoading.stop();
    }

    if (err || content.query !== $('#search-box').val()) {
      return;
    }

    function getSafeHighlightedValue(highlight) {
      // extract & escape the attribute to prevent any XSS issue keeping the highlighting tags
      var v = highlight && highlight.value || '';
      return $('<div />').text(v).html().replace(/&lt;(\/?)em&gt;/g, '<$1em>');
    }

    if ((displayPage + 1) * queryItems >= content.nbHits) {
      lazyScroll = false;
    }

    // set total hits found, if not set to 0.
    $nbHitsField.text(content.nbHits || 0);
    $processingTimeMS.text(content.processingTimeMS || 0);

    var html = '';
    var match = false;
    if (content.hits.length < 1) {
      $('.packages-table-container > table > thead').hide();
      $nbHitsField.parent().hide();
    } else {
      $('.packages-table-container > table > thead').show();
      $nbHitsField.parent().show();
    }

    scrollProgress.update();
    for (var i = 0; i < content.hits.length; ++i) {
      var hit = content.hits[i];
      if (hit._highlightResult.github && (hit._highlightResult.github.repo.matchedWords.length || hit._highlightResult.name.matchedWords.length)) {
        match = true;
      }

      var githubDetails = '';
      if (hit.github) {
        var user = getSafeHighlightedValue(hit._highlightResult.github.user);
        var repo = getSafeHighlightedValue(hit._highlightResult.github.repo);
        githubDetails = '<ul class="list-inline">' +
          '  <li><i class="fab fa-github"></i> <a href="https://github.com/' + hit.github.user + '/' + hit.github.repo + '" target="_blank">' + user + '/' + repo + '</a></li>' +
          '  <li><i class="fas fa-eye"></i> ' + hit.github.subscribers_count + '</li>' +
          '  <li><i class="fas fa-star"></i> ' + hit.github.stargazers_count + '</li>' +
          '  <li><i class="fas fa-code-branch"></i> ' + hit.github.forks + '</li>' +
          '</ul>';
      }

      var description = getSafeHighlightedValue(hit._highlightResult.description);
      var row = '<tr id="' + hit.objectID + '" data-sri="' + hit.sri + '">' +
      '  <td>' +
      '    <a id="libLink" href="/libraries/' + hit.name + '">' +
      '      <span itemprop="name">' + hit._highlightResult.name.value + '</span>' +
      '      <p class="text-muted">' + description + '</p>' +
      '    </a>' +
      '    <ul class="list-inline">' +
      $.map(hit._highlightResult.keywords || [], function (e) {
        var extraClass = (e.matchLevel !== 'none') ? 'highlight' : '';
        return '      <li class="label label-default ' + extraClass + '">' + e.value + '</li>';
      }).join(' ') +
      '    </ul>' +
      '    ' + githubDetails +
      '  </td>' +
      '  <td style="white-space: nowrap;">' +
      '    <div style="position: relative; padding: 8px;" data-lib-name="' + hit.name + '" class="library-column ' + hit.fileType + '-type">' +
      '      <p itemprop="downloadUrl" class="library-url" style="padding: 0; margin: 0">' + cdn_provider_base_url[cdn_provider] + hit.originalName + '/' + hit.version + '/' + hit.filename + '</p>' +
      '    </div>' +
      '  </td>' +
      '</tr>';
      html += row;
    }

    var libraryName = escape(content.query);

    var scrollToEndText = '<br /><tr><td class="text-center well" colspan="2">Scroll down to the end to load more search result!</td></tr>';
    var tempText = (match ? 'Could not find the lib you\'re looking for?' : 'We are sorry, the library you\'re searching for cannot be found.');
    var tempText2 =
      '<br /><td class="text-center well" colspan="2">' +
      tempText + '<br /> You can ' +
      '<a href="https://github.com/cdnjs/cdnjs/blob/master/CONTRIBUTING.md" target="_blank">contribute it</a> if it fits our <a href="https://github.com/cdnjs/cdnjs/blob/master/CONTRIBUTING.md#a-issue" target="_blank"><strong>requirement</strong></a>.' +
      'Please don\'t forget to <a href="https://github.com/cdnjs/cdnjs/issues?utf8=%E2%9C%93&q=' + libraryName + '" target="_blank"><strong>search if there is already an issue for it</strong></a> before adding a request.' +
      '</td>';
    if (lazyScroll) {
      html += scrollToEndText;
    }

    html += tempText2;

    $hits.html(html);

    setupMouseEvents();
    appLoading.stop();
    scrollProgress.update();
  }

  function animateTop() {
    $('.container.home').animate({ marginTop: '0px' }, 200);
  }

  function animateTopReverse() {
    $('.container.home').animate({ marginTop: '200px' }, 200);
  }

  var clearHash = _.once(function () {
    location.hash = '';
  });

  var lastHashQuery;

  function replaceHash(ev, val) {
    // Only replace the hash if we press enter
    if (val && val !== lastHashQuery
      && ev.keyCode === 13
      && 'replaceState' in history) {
      var encodedVal = encodeURIComponent(val).replace(/%20/g, '+');
      history.replaceState('', '', '#q=' + encodedVal);
      lastHashQuery = val;
    }
  }

  var algolia = algoliasearch('2QWLVLXZB6', '2663c73014d2e4d6d1778cc8ad9fd010'); // public/search-only credentials
  var index = algolia.initIndex('libraries');
  var lastQuery;

  function searchHandler(ev) {
    appLoading.start();
    clearHash();

    var val = $(ev.currentTarget).val();
    replaceHash(ev, val);

    if (val === '') {
      $hits.html($allRows);
      if (location.pathname === '/libraries') {
        $('.packages-table-container').show();
      } else {
        $('.packages-table-container').hide();
      }

      $nbHitsField.parent().hide();
      animateTopReverse();
      appLoading.stop();
      scrollProgress.update();
    } else if (lastQuery !== val) {
      animateTop();
      displayPage = 0;
      lazyScroll = true;
      cachedQueryResult = {};
      index.search(val, { hitsPerPage: queryItems, page: displayPage }, function (err, content) {
        if (!err) {
          cachedQueryResult = content;
        }

        displayMatchingLibraries(err, content);
      });
    }

    lastQuery = val;
  }

  function loadMoreSearchResult() {
    displayPage += 1;
    index.search(lastQuery, { hitsPerPage: queryItems, page: displayPage }, function (err, content) {
      if (!err && cachedQueryResult.hits) {
        content.hits = cachedQueryResult.hits.concat(content.hits);
        cachedQueryResult = content;
        displayMatchingLibraries(err, content);
      }
    });
  }

  $(window).scroll(_.debounce(function () {
    if (lazyScroll && $(window).scrollTop() + $(window).height() >= $(document).height() - 1) {
      loadMoreSearchResult();
    }
  }, 100));

  $('#search-box').on('input', searchHandler);

  if ($('#search-box').val() !== '') {
    $('#search-box').trigger('input');
  }

  function searchByHash() {
    // Perform searches automatically based on the URL hash
    if (location.hash.length > 1) {
      var query = location.hash.match(/q=([^&]+)/);
      if (query) {
        query = decodeURIComponent(query[1]).replace(/\+/g, ' ');
        $('#search-box').val(query);
        $('#search-box').trigger('input');
      }
    }
  }

  searchByHash();
  $('#search-box').focus();

  $('.cdn-provider-selector').on('change', function (ev) {
    location.hash = $(ev.currentTarget).val();
    updateCDNProvider(decideCDNProvider());
  });

  $(window).on('hashchange', function () {
    searchByHash();
    $('.cdn-provider-selector').val(decideCDNProvider());
    updateCDNProvider(decideCDNProvider());
  });

  $('.version-selector').on('change', function (ev) {
    window.location.href = window.location.origin + '/libraries/' +
      $('#library-name').text() + '/' + $(ev.currentTarget).val(); // library name / library version
  });

  console.log('%cThanks for using cdnjs! 😊', 'font: 5em roboto; color: #e95420;');
  $(function () {
    $.scrollUp({
      animation: 'slide',
      scrollDistance: 800,
      activeOverlay: false,
    });
  });

  scrollProgress.set({
    color: '#DD4814',
    height: '2px',
    bottom: false
  });
  window.onresize = function () {
    scrollProgress.update();
  };
})(jQuery);
