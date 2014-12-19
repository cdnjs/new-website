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



    // UserApp Integration

    UserApp.initialize({
      appId: "5343d12871774"
    });
    // Check if there is a session cookie
    var token = Kaka.get("ua_session_token");
    if (token) {
      // Yes, there is
      UserApp.setToken(token);

      // Get the logged in user
      getCurrentUser(function(user) {
        if (user) {
          console.log(user);
          currentUser = user;
          onUserLoaded();
          $('.profile').attr('href', '/profile/' + user.login);
          $('.profile, .logout').show();
          $('.status-container').fadeIn(200);
        } else {
          $('.login, .register').show();
          $('.login-or-register').show(200);
        }
      });
    } else {
      $('.login, .register').show();
          $('.login-or-register').show(200);

    }

    // When the user has loaded
    function get_gravatar(email, size) {

        // MD5 (Message-Digest Algorithm) by WebToolkit
        //

        var MD5=function(s){function L(k,d){return(k<<d)|(k>>>(32-d))}function K(G,k){var I,d,F,H,x;F=(G&2147483648);H=(k&2147483648);I=(G&1073741824);d=(k&1073741824);x=(G&1073741823)+(k&1073741823);if(I&d){return(x^2147483648^F^H)}if(I|d){if(x&1073741824){return(x^3221225472^F^H)}else{return(x^1073741824^F^H)}}else{return(x^F^H)}}function r(d,F,k){return(d&F)|((~d)&k)}function q(d,F,k){return(d&k)|(F&(~k))}function p(d,F,k){return(d^F^k)}function n(d,F,k){return(F^(d|(~k)))}function u(G,F,aa,Z,k,H,I){G=K(G,K(K(r(F,aa,Z),k),I));return K(L(G,H),F)}function f(G,F,aa,Z,k,H,I){G=K(G,K(K(q(F,aa,Z),k),I));return K(L(G,H),F)}function D(G,F,aa,Z,k,H,I){G=K(G,K(K(p(F,aa,Z),k),I));return K(L(G,H),F)}function t(G,F,aa,Z,k,H,I){G=K(G,K(K(n(F,aa,Z),k),I));return K(L(G,H),F)}function e(G){var Z;var F=G.length;var x=F+8;var k=(x-(x%64))/64;var I=(k+1)*16;var aa=Array(I-1);var d=0;var H=0;while(H<F){Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=(aa[Z]|(G.charCodeAt(H)<<d));H++}Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=aa[Z]|(128<<d);aa[I-2]=F<<3;aa[I-1]=F>>>29;return aa}function B(x){var k="",F="",G,d;for(d=0;d<=3;d++){G=(x>>>(d*8))&255;F="0"+G.toString(16);k=k+F.substr(F.length-2,2)}return k}function J(k){k=k.replace(/rn/g,"n");var d="";for(var F=0;F<k.length;F++){var x=k.charCodeAt(F);if(x<128){d+=String.fromCharCode(x)}else{if((x>127)&&(x<2048)){d+=String.fromCharCode((x>>6)|192);d+=String.fromCharCode((x&63)|128)}else{d+=String.fromCharCode((x>>12)|224);d+=String.fromCharCode(((x>>6)&63)|128);d+=String.fromCharCode((x&63)|128)}}}return d}var C=Array();var P,h,E,v,g,Y,X,W,V;var S=7,Q=12,N=17,M=22;var A=5,z=9,y=14,w=20;var o=4,m=11,l=16,j=23;var U=6,T=10,R=15,O=21;s=J(s);C=e(s);Y=1732584193;X=4023233417;W=2562383102;V=271733878;for(P=0;P<C.length;P+=16){h=Y;E=X;v=W;g=V;Y=u(Y,X,W,V,C[P+0],S,3614090360);V=u(V,Y,X,W,C[P+1],Q,3905402710);W=u(W,V,Y,X,C[P+2],N,606105819);X=u(X,W,V,Y,C[P+3],M,3250441966);Y=u(Y,X,W,V,C[P+4],S,4118548399);V=u(V,Y,X,W,C[P+5],Q,1200080426);W=u(W,V,Y,X,C[P+6],N,2821735955);X=u(X,W,V,Y,C[P+7],M,4249261313);Y=u(Y,X,W,V,C[P+8],S,1770035416);V=u(V,Y,X,W,C[P+9],Q,2336552879);W=u(W,V,Y,X,C[P+10],N,4294925233);X=u(X,W,V,Y,C[P+11],M,2304563134);Y=u(Y,X,W,V,C[P+12],S,1804603682);V=u(V,Y,X,W,C[P+13],Q,4254626195);W=u(W,V,Y,X,C[P+14],N,2792965006);X=u(X,W,V,Y,C[P+15],M,1236535329);Y=f(Y,X,W,V,C[P+1],A,4129170786);V=f(V,Y,X,W,C[P+6],z,3225465664);W=f(W,V,Y,X,C[P+11],y,643717713);X=f(X,W,V,Y,C[P+0],w,3921069994);Y=f(Y,X,W,V,C[P+5],A,3593408605);V=f(V,Y,X,W,C[P+10],z,38016083);W=f(W,V,Y,X,C[P+15],y,3634488961);X=f(X,W,V,Y,C[P+4],w,3889429448);Y=f(Y,X,W,V,C[P+9],A,568446438);V=f(V,Y,X,W,C[P+14],z,3275163606);W=f(W,V,Y,X,C[P+3],y,4107603335);X=f(X,W,V,Y,C[P+8],w,1163531501);Y=f(Y,X,W,V,C[P+13],A,2850285829);V=f(V,Y,X,W,C[P+2],z,4243563512);W=f(W,V,Y,X,C[P+7],y,1735328473);X=f(X,W,V,Y,C[P+12],w,2368359562);Y=D(Y,X,W,V,C[P+5],o,4294588738);V=D(V,Y,X,W,C[P+8],m,2272392833);W=D(W,V,Y,X,C[P+11],l,1839030562);X=D(X,W,V,Y,C[P+14],j,4259657740);Y=D(Y,X,W,V,C[P+1],o,2763975236);V=D(V,Y,X,W,C[P+4],m,1272893353);W=D(W,V,Y,X,C[P+7],l,4139469664);X=D(X,W,V,Y,C[P+10],j,3200236656);Y=D(Y,X,W,V,C[P+13],o,681279174);V=D(V,Y,X,W,C[P+0],m,3936430074);W=D(W,V,Y,X,C[P+3],l,3572445317);X=D(X,W,V,Y,C[P+6],j,76029189);Y=D(Y,X,W,V,C[P+9],o,3654602809);V=D(V,Y,X,W,C[P+12],m,3873151461);W=D(W,V,Y,X,C[P+15],l,530742520);X=D(X,W,V,Y,C[P+2],j,3299628645);Y=t(Y,X,W,V,C[P+0],U,4096336452);V=t(V,Y,X,W,C[P+7],T,1126891415);W=t(W,V,Y,X,C[P+14],R,2878612391);X=t(X,W,V,Y,C[P+5],O,4237533241);Y=t(Y,X,W,V,C[P+12],U,1700485571);V=t(V,Y,X,W,C[P+3],T,2399980690);W=t(W,V,Y,X,C[P+10],R,4293915773);X=t(X,W,V,Y,C[P+1],O,2240044497);Y=t(Y,X,W,V,C[P+8],U,1873313359);V=t(V,Y,X,W,C[P+15],T,4264355552);W=t(W,V,Y,X,C[P+6],R,2734768916);X=t(X,W,V,Y,C[P+13],O,1309151649);Y=t(Y,X,W,V,C[P+4],U,4149444226);V=t(V,Y,X,W,C[P+11],T,3174756917);W=t(W,V,Y,X,C[P+2],R,718787259);X=t(X,W,V,Y,C[P+9],O,3951481745);Y=K(Y,h);X=K(X,E);W=K(W,v);V=K(V,g)}var i=B(Y)+B(X)+B(W)+B(V);return i.toLowerCase()};

        var size = size || 80;

        return '//www.gravatar.com/avatar/' + MD5(email) + '.jpg?s=' + size;
    }
    function onUserLoaded() {
      //$('.sponsors').slideUp(200);
      //$('.logged-in').slideDown();

      //$("#name").text(currentUser.login);
      //$("#gravatar").attr('src', get_gravatar(currentUser.email, 64));
      getFavorites(putClassOnFavorites);
      $('body').addClass('authenticated');
      //$('.login-box').hide();

    }

    // Get the logged in user

    function getCurrentUser(callback) {
      UserApp.User.get({
        user_id: "self"
      }, function(error, user) {
        if (error) {
          callback && callback(null);
        } else {
          callback && callback(user[0]);
        }
      });
    }

    // Get this user's articles from the back-end
    $('body').on('click', '.logout', function (){
        Kaka.remove("ua_session_token");
        UserApp.User.logout(function() {
          window.location.href = "/";
        });
        return false;
    })



    // TODO - This is some pretty ugly code by Thomas </honesty>

    var favorites = [];

    function getFavorites(callback) {
      $.get("/favorites?token=" + token, function(data) {
        if (data) {
          favorites = data;
          callback(data);
        }
      }, "json");
    }

    function putClassOnFavorites(favorites) {
      _.each(favorites, function(favId) {
        favId = '#' + favId;
        var $element = $(favId);
        var $clonedElement = $element.clone(true);
        $element.remove();
        $clonedElement.addClass('favorite');
        $('#example tbody').prepend($clonedElement);
      });
    }

    $('body').on('click', '.add-favorite', function(e) {
      if(!currentUser) {
        window.location = '/register';
        return false;
      }
              toastr.success('Added a new favorite')
        var rowId = $(e.currentTarget).parents('tr')[0].id;
          favorites.push(rowId);
          ga('send', 'event', 'favorite', 'added', rowId, 4);
          $.ajax({
            url: '/favorites?token=' + token,
            success: function() {
              console.log(arguments);
            },
            type: 'POST',
            data: {
              library: rowId
            }
          })

        var favRow = $('#' + rowId);
        console.log(favRow);
        if (favRow.hasClass('favorite')) {
          $(favRow).appendTo('#example tbody');
          favRow.removeClass('favorite');
        } else {
          window.a =favRow;
          favRow.addClass('favorite');
          $(favRow).prependTo('#example tbody');

        }
      //$('#example tr').removeClass('favorite');
      //putClassOnFavorites(favorites);
      return false;
    });
$('body').on('click', '.remove-favorite', function(e) {
              toastr.error('Removed a favorite')

        var rowId = $(e.currentTarget).parents('tr')[0].id;
          ga('send', 'event', 'favorite', 'removed', rowId, 4);

          favorites = _.without(favorites, rowId);

          $.ajax({
            url: '/favorites?token=' + token,
            success: function() {
              console.log(arguments)
            },
            type: 'DELETE',
            data: {
              library: rowId
            }
          })

        var favRow = $('#' + rowId);
        console.log(favRow);
        if (favRow.hasClass('favorite')) {
          $(favRow).appendTo('#example tbody');
          favRow.removeClass('favorite');
        } else {
          window.a =favRow;
          favRow.addClass('favorite');
          $(favRow).prependTo('#example tbody');

        }
      //$('#example tr').removeClass('favorite');
      //putClassOnFavorites(favorites);
      return false;
    });
/*
<div class="btn-group">
                  <button type="button" class="btn btn-primary">Primary</button>
                  <button type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button>
                  <ul class="dropdown-menu">
                    <li><a href="#">Action</a></li>
                    <li><a href="#">Another action</a></li>
                    <li><a href="#">Something else here</a></li>
                    <li class="divider"></li>
                    <li><a href="#">Separated link</a></li>
                  </ul>
                </div>
*/




  var copyEl = $('<div/>').addClass('btn-group copy-button-group');
  var copyElButton = $('<button/>').attr('data-copy-type','').attr('type', 'button').addClass('btn btn-primary btn-sm copy-button').text('Copy');
  var toggleButton = $('<button/>').attr('data-toggle', 'dropdown').attr('type', 'button').addClass('btn btn-primary btn-sm dropdown-toggle').append($('<span/>').addClass('caret'));
  copyElButton.appendTo(copyEl);
  toggleButton.appendTo(copyEl);
  copyEl.append('<ul class="dropdown-menu copy-options">' +
                    '<li><a data-copy-type="https:" class="copy-https-url copy-button" href="#">Copy Url</a></li>' +
                    '<li class="js"><a data-copy-embed="script" data-copy-type="https:" class=" copy-https-script copy-button" href="#">Copy Script Tag</a></li>' +
                    '<li class="css"><a data-copy-embed="link" data-copy-type="https:" class=" copy-https-link copy-button" href="#">Copy Link Tag</a></li>' +
                    '<li class="divider"></li>' +
                    '<li><a class="add-favorite" href="#">Add to favorites</a></li>' +
                    '<li><a class="remove-favorite" href="#">Remove from favorites</a></li>' +
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
  setupMouseEvents();

  var client = new ZeroClipboard($(".copy-button"));
  client.on( "ready", function( readyEvent ) {
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
            $.map(hit._highlightResult.keywords || [], function(e) { return '<li class="label label-default">' + e.value + '</li>'; }).join(' ') +
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
  function searchHandler(ev) {
    var val = $(ev.currentTarget).val();
    if (val === '') {
      $hits.html($allRows);
    } else {
      index.search(val, displayMatchingLibraries, { hitsPerPage: 20 });
    }
  }

  $('#search-box').on('keyup change', searchHandler);

  // Put favorite libraries at the top of the list
  //putClassOnFavorites(getFavorites());
  $('#search-box').focus();

  $('.version-selector').on('change', function (ev) {
    var val = $(ev.currentTarget).val();
    $('[data-library-version]').removeClass('active');
    $('[data-library-version="'+val+'"]').addClass('active');

  });


  $('.status-update').on('keydown', function (ev) {
    var count = 200- 1*($(ev.currentTarget).val().length);
    $('.character-count').text(count);;
    if(count < 0) {
      $('.status-update-button').attr('disabled', 'disabled');
    } else {
      $('.status-update-button').removeAttr('disabled');

    }
  });
  $('.post-news').on('submit', function (ev) {
    console.log('update');

    $('textarea', ev.currentTarget).attr('disabled', 'disabled');
    $('[type="submit"]', ev.currentTarget).attr('disabled', 'disabled');
    $.ajax({
      url: '/status?token=' + token,
      success: function(data) {
        if(data.error) {
          toastr.error(data.error);
        } else {
          window.location = '/news';
        }
      },
      type: 'POST',
      data: {
        status: $('textarea', ev.currentTarget).val()
      }
    })
    return false;
  });

  // Function to show and hide the loader anim
  function showLoader(show) {
    document.getElementById("loader").style.display = (show ? "block" : "none");
  }
  $('.login-form').on('submit', function (ev) {
  // Login the user
    // Show the loader
    Kaka.remove("ua_session_token");
    showLoader(true);

    // This will authenticate the user
    UserApp.User.login({
      login: document.getElementById("username").value,
      password: document.getElementById("password").value
    }, function(error, result) {
      if (error) {
        // Wrong password maybe?
        alert("Error: " + error.message);
        showLoader(false);
      } else {

        onLoginSuccessful();
      }
    });
    // When the user has been logged in successfully
    function onLoginSuccessful() {
      // Now, save the token in a cookie
      Kaka.set("ua_session_token", UserApp.global.token);

      // Redirect the user to the index page
      window.location.href = "/";
      showLoader(false);
    }
    return false;

  })

})(jQuery);
