appLoading.setColor('#FF9900');
var cdn_provider_base_url = [];
var cdn_provider;
var urlSetDecided = false;
cdn_provider_base_url.cloudflare = 'https://cdnjs.cloudflare.com/ajax/libs/';

function decideCDNProvider() {
  var target_cdn_provider = location.hash.substr(1, location.hash.length).toLowerCase();
  if (!cdn_provider_base_url[target_cdn_provider]) target_cdn_provider = 'cloudflare';
  return target_cdn_provider;
}

cdn_provider = decideCDNProvider();
setFileURLs();

function setFileURLs(new_provider) {
  if (urlSetDecided === false) {
    $('p.library-url').each(function() {
      $(this).html(cdn_provider_base_url[cdn_provider] + $(this).html());
    });
    urlSetDecided = true;
  } else {
    $('p.library-url').each(function() {
      $(this).html($(this).html().replace(cdn_provider_base_url[cdn_provider], cdn_provider_base_url[new_provider]));
    });
    cdn_provider = new_provider;
  }
}

(function($) {
  baseURI = cdn_provider_base_url[cdn_provider] + $('h1#libraryName').html() + '/' + $('select.version-selector :selected').val() + '/';
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
  var copyElButton = $('<button/>').attr('data-copy-type', '').attr('type', 'button').addClass('btn btn-primary btn-sm copy-button').text('Copy');
  var toggleButton = $('<button/>').attr('data-toggle', 'dropdown').attr('type', 'button').addClass('btn btn-primary btn-sm dropdown-toggle').append($('<span/>').addClass('caret'));
  copyElButton.appendTo(copyEl);
  toggleButton.appendTo(copyEl);
  var SRIcopyButton = '';
  var SRIcopyWithoutTagButton = '';
  if (typeof (SRI) !== "undefined") {
    SRIcopyButton =
      '<li class="js"><a data-copy-embed="script-sri" data-copy-type="https:" class="copy-https-script copy-button" href="javascript:void(0);">Copy Script Tag with SRI</a></li>' +
      '<li class="css"><a data-copy-embed="link-sri" data-copy-type="https:" class="copy-https-link copy-button" href="javascript:void(0);">Copy Link Tag with SRI</a></li>';
    SRIcopyWithoutTagButton =
      '<li class="js css"><a data-copy-embed="file-sri" class="copy-button" href="javascript:void(0);">Copy SRI</a></li>';
  }
  copyEl.append('<ul class="dropdown-menu copy-options">' +
                '<li><a data-copy-type="https:" class="copy-https-url copy-button" href="javascript:void(0);">Copy Url</a></li>' + SRIcopyWithoutTagButton +
                '<li class="js"><a data-copy-embed="script" data-copy-type="https:" class=" copy-https-script copy-button" href="javascript:void(0);">Copy Script Tag</a></li>' +
                '<li class="css"><a data-copy-embed="link" data-copy-type="https:" class=" copy-https-link copy-button" href="javascript:void(0);">Copy Link Tag</a></li>' +
                SRIcopyButton + '</ul>');
  var copyContainer = $('<div/>');
  copyEl.attr('style', 'display: none;');
  copyEl.appendTo('body');
  var clipboard;

  function setupMouseEvents() {
    // Currently not showing the copy button for iOS, check clipboard.js support
    if (!(/iPhone|iPad/i.test(navigator.userAgent))) {
      $('.packages-table-container table tbody tr, .library-table-container table tbody tr').hover(function(ev) {
        var cont = $(ev.currentTarget);
        var libraryColumn = cont.find('.library-column');
        copyEl.show();
        copyEl.appendTo(libraryColumn);
      }, function(e){
        copyEl.hide();
      });
      if (clipboard) {
        clipboard.destroy();
      }
      setupCopyButton();
    }
  }

  function setupCopyButton() {
    clipboard = new Clipboard(".copy-button", {
      text: function(trigger) {
        var button = $(trigger);
        var embed = button.attr('data-copy-embed');
        var url = $('.library-url', button.parents('.library-column')).text();
        var fileSRI = '';
        if (typeof (SRI) !== "undefined") {
          fileSRI = SRI[url.replace(baseURI, '')];
        }
        switch (embed) {
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

    clipboard.on("success", function(e) {
      var button = $(e.trigger);
      var btContainer = button.parents('.copy-button-group').tooltip({
        trigger: 'manual',
        placement: 'bottom',
        title: 'Copied!'
      });
      btContainer.tooltip('show');
      setTimeout(function() {
        btContainer.tooltip('hide');
        btContainer.tooltip('destroy');
      }, 1000);
      ga('send', 'event', 'library', 'copied', button.parents('.library-column').attr('data-lib-name'), 4);
    });

    clipboard.on("error", function(e) {
      var button = $(e.trigger);
      var msg;
      if (/Mac/i.test(navigator.userAgent)) {
        msg = 'Press ⌘-C to copy';
      }
      else {
        msg = 'Press Ctrl-C to copy';
      }
      var btContainer = button.parents('.copy-button-group').tooltip({
        trigger: 'manual',
        placement: 'bottom',
        title: msg
      });
      btContainer.tooltip('show');
      setTimeout(function() {
        btContainer.tooltip('hide');
        btContainer.tooltip('destroy');
      }, 1000);
      ga('send', 'event', 'library', 'copied', button.parents('.library-column').attr('data-lib-name'), 4);
    });
  }

  setupMouseEvents();

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

    var html = '';
    var match = false;
    if (content.hits.length < 1) {
      $('.packages-table-container > table > thead').hide();
    } else {
      $('.packages-table-container > table > thead').show();
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
          '<li><i class="fa fa-github"></i> <a href="https://github.com/' + hit.github.user + '/' + hit.github.repo + '" target="_blank">' + user + '/' + repo + '</a></li>' +
          '<li><i class="fa fa-eye"></i> ' + hit.github.subscribers_count + '</li>' +
          '<li><i class="fa fa-star"></i> ' + hit.github.stargazers_count + '</li>' +
          '<li><i class="fa fa-code-fork"></i> ' + hit.github.forks + '</li>' +
        '</ul>';
      }

      var description = getSafeHighlightedValue(hit._highlightResult.description);
      var row = '<tr id="' + hit.objectID + '">' +
        '<td>' +
          '<p><a itemprop="name" href="/libraries/' + hit.name + '">' +
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
            '<p itemprop="downloadUrl" class="library-url" style="padding: 0; margin: 0">' + cdn_provider_base_url[cdn_provider] + hit.originalName + '/' + hit.version + '/' + hit.filename + '</p>' +
          '</div>' +
        '</td>' +
      '</tr>';
      html += row;
    }
    var libraryName = escape(content.query);

    var tempText = (match ? 'Could not found the lib you\'re looking for?' : 'We are sorry, the library you\'re searching for cannot be found.');
    var tempText2 =
      '<br /><td class="text-center well" colspan="2">' +
      tempText + '<br /> You can ' +
      '<a href="' +
      'https://github.com/cdnjs/cdnjs/issues/new?title=%5BRequest%5D%20Add%20' + libraryName + '&body=**Library%20name%3A**%20' + libraryName + '%0A**Git%20repository%20url%3A**%20%0A**npm%20package%20name%20or%20url**%20(if%20there%20is%20one)%3A%20%0A**License%20(List%20them%20all%20if%20it%27s%20multiple)%3A**%20%0A**Official%20homepage%3A**%20%0A**Wanna%20say%20something%3F%20Leave%20message%20here%3A**%20%0A%0A%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%0A%0ANotes%20from%20cdnjs%20maintainer%3A%0APlease%20read%20the%20%5BREADME.md%5D(https%3A%2F%2Fgithub.com%2Fcdnjs%2Fcdnjs%23cdnjs-library-repository)%20and%20%5BCONTRIBUTING.md%5D(https%3A%2F%2Fgithub.com%2Fcdnjs%2Fcdnjs%2Fblob%2Fmaster%2FCONTRIBUTING.md)%20document%20first.%0A%0AWe%20encourage%20you%20to%20add%20a%20library%20via%20sending%20pull%20request%2C%0Ait%27ll%20be%20faster%20than%20just%20opening%20a%20request%20issue%2C%0Asince%20there%20are%20tons%20of%20issues%2C%20please%20wait%20with%20patience%2C%0Aand%20please%20don%27t%20forget%20to%20read%20the%20guidelines%20for%20contributing%2C%20thanks!!%0A' +
        '" target="_blank">request it</a> if it fits our <a href="https://github.com/cdnjs/cdnjs/blob/master/CONTRIBUTING.md#a-issue" target="_blank">requirement</a>.' +
        ' Please don\'t forget to <a href="https://github.com/cdnjs/cdnjs/issues?utf8=%E2%9C%93&q=' + libraryName + '" target="_blank"><strong>search if there is already an issue for it</strong></a> before adding a request.' +
      '</td>';
    html += tempText2;

    $hits.html(html);

    setupMouseEvents();
    appLoading.stop();
    scrollProgress.update();
  }

  function animateTop() {
    $('.container.home').animate({marginTop: '0px'}, 200);
  }

  function animateTopReverse() {
    $('.container.home').animate({marginTop: '200px'}, 200);
  }

  var clearHash = _.once(function() {
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
      animateTopReverse();
      appLoading.stop();
      scrollProgress.update();
    } else if (lastQuery !== val) {
      animateTop();
      index.search(val, displayMatchingLibraries);
    }
    lastQuery = val;
  }

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
  // Put favorite libraries at the top of the list
  // putClassOnFavorites(getFavorites());
  $('#search-box').focus();

  $('.cdn-provider-selector').on('change', function(ev) {
    location.hash = $(ev.currentTarget).val();
    setFileURLs(decideCDNProvider());
  });
  $(window).on('hashchange', function() {
    searchByHash();
    $('.cdn-provider-selector').val(decideCDNProvider());
    setFileURLs(decideCDNProvider());
  });
  $('.version-selector').on('change', function(ev) {
    var libraryVersion = $(ev.currentTarget).val();
    var libraryName = $('#library-name').text();
    var newURL = window.location.origin + '/libraries/' + libraryName + '/' + libraryVersion;
    window.location.href = newURL;
  });
  console.log("%cThanks for using CDNJS! 😊", "font: 5em roboto; color: #dd4814;");
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
  window.onresize = function() {
    scrollProgress.update();
  };
})(jQuery);
