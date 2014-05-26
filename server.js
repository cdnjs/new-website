var express = require("express");
var fs = require("fs");
var _ = require("lodash");
var Mustache = require("mustache");
var app = express();
var bodyParser = require('body-parser');

var cookieParser = require('cookie-parser');
var MongoClient = require('mongodb').MongoClient;
var UserApp = require("userapp");
var UserAppAPI = require("userapp");
var Twit = require('twit')
var linkify = require("html-linkify");
var mongo = require('mongodb');
var BSON = mongo.BSONPure;
var Hipchat = require('node-hipchat');
var timeago = require('timeago');
var compress = require('compression');

var user_app_token = process.env.USER_APP;
var DISQUS_SECRET = process.env.DISQUS_SECRET;
var DISQUS_PUBLIC = process.env.DISQUS_PUBLIC;
// Setup UserApp for sessions
UserApp.initialize({
  appId: '5343d12871774'
});

/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
var CryptoJS=CryptoJS||function(g,l){var e={},d=e.lib={},m=function(){},k=d.Base={extend:function(a){m.prototype=this;var c=new m;a&&c.mixIn(a);c.hasOwnProperty("init")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
p=d.WordArray=k.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=l?c:4*a.length},toString:function(a){return(a||n).stringify(this)},concat:function(a){var c=this.words,q=a.words,f=this.sigBytes;a=a.sigBytes;this.clamp();if(f%4)for(var b=0;b<a;b++)c[f+b>>>2]|=(q[b>>>2]>>>24-8*(b%4)&255)<<24-8*((f+b)%4);else if(65535<q.length)for(b=0;b<a;b+=4)c[f+b>>>2]=q[b>>>2];else c.push.apply(c,q);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<
32-8*(c%4);a.length=g.ceil(c/4)},clone:function(){var a=k.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],b=0;b<a;b+=4)c.push(4294967296*g.random()|0);return new p.init(c,a)}}),b=e.enc={},n=b.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],f=0;f<a;f++){var d=c[f>>>2]>>>24-8*(f%4)&255;b.push((d>>>4).toString(16));b.push((d&15).toString(16))}return b.join("")},parse:function(a){for(var c=a.length,b=[],f=0;f<c;f+=2)b[f>>>3]|=parseInt(a.substr(f,
2),16)<<24-4*(f%8);return new p.init(b,c/2)}},j=b.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],f=0;f<a;f++)b.push(String.fromCharCode(c[f>>>2]>>>24-8*(f%4)&255));return b.join("")},parse:function(a){for(var c=a.length,b=[],f=0;f<c;f++)b[f>>>2]|=(a.charCodeAt(f)&255)<<24-8*(f%4);return new p.init(b,c)}},h=b.Utf8={stringify:function(a){try{return decodeURIComponent(escape(j.stringify(a)))}catch(c){throw Error("Malformed UTF-8 data");}},parse:function(a){return j.parse(unescape(encodeURIComponent(a)))}},
r=d.BufferedBlockAlgorithm=k.extend({reset:function(){this._data=new p.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=h.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var c=this._data,b=c.words,f=c.sigBytes,d=this.blockSize,e=f/(4*d),e=a?g.ceil(e):g.max((e|0)-this._minBufferSize,0);a=e*d;f=g.min(4*a,f);if(a){for(var k=0;k<a;k+=d)this._doProcessBlock(b,k);k=b.splice(0,a);c.sigBytes-=f}return new p.init(k,f)},clone:function(){var a=k.clone.call(this);
a._data=this._data.clone();return a},_minBufferSize:0});d.Hasher=r.extend({cfg:k.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){r.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(b,d){return(new a.init(d)).finalize(b)}},_createHmacHelper:function(a){return function(b,d){return(new s.HMAC.init(a,
d)).finalize(b)}}});var s=e.algo={};return e}(Math);
(function(){var g=CryptoJS,l=g.lib,e=l.WordArray,d=l.Hasher,m=[],l=g.algo.SHA1=d.extend({_doReset:function(){this._hash=new e.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(d,e){for(var b=this._hash.words,n=b[0],j=b[1],h=b[2],g=b[3],l=b[4],a=0;80>a;a++){if(16>a)m[a]=d[e+a]|0;else{var c=m[a-3]^m[a-8]^m[a-14]^m[a-16];m[a]=c<<1|c>>>31}c=(n<<5|n>>>27)+l+m[a];c=20>a?c+((j&h|~j&g)+1518500249):40>a?c+((j^h^g)+1859775393):60>a?c+((j&h|j&g|h&g)-1894007588):c+((j^h^
g)-899497514);l=g;g=h;h=j<<30|j>>>2;j=n;n=c}b[0]=b[0]+n|0;b[1]=b[1]+j|0;b[2]=b[2]+h|0;b[3]=b[3]+g|0;b[4]=b[4]+l|0},_doFinalize:function(){var d=this._data,e=d.words,b=8*this._nDataBytes,g=8*d.sigBytes;e[g>>>5]|=128<<24-g%32;e[(g+64>>>9<<4)+14]=Math.floor(b/4294967296);e[(g+64>>>9<<4)+15]=b;d.sigBytes=4*e.length;this._process();return this._hash},clone:function(){var e=d.clone.call(this);e._hash=this._hash.clone();return e}});g.SHA1=d._createHelper(l);g.HmacSHA1=d._createHmacHelper(l)})();
(function(){var g=CryptoJS,l=g.enc.Utf8;g.algo.HMAC=g.lib.Base.extend({init:function(e,d){e=this._hasher=new e.init;"string"==typeof d&&(d=l.parse(d));var g=e.blockSize,k=4*g;d.sigBytes>k&&(d=e.finalize(d));d.clamp();for(var p=this._oKey=d.clone(),b=this._iKey=d.clone(),n=p.words,j=b.words,h=0;h<g;h++)n[h]^=1549556828,j[h]^=909522486;p.sigBytes=b.sigBytes=k;this.reset()},reset:function(){var e=this._hasher;e.reset();e.update(this._iKey)},update:function(e){this._hasher.update(e);return this},finalize:function(e){var d=
this._hasher;e=d.finalize(e);d.reset();return d.finalize(this._oKey.clone().concat(e))}})})();

function disqusSignon(user) {
    var disqusData = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    var disqusStr = JSON.stringify(disqusData);
    var timestamp = Math.round(+new Date() / 1000);

    /*
     * Note that `Buffer` is part of node.js
     * For pure Javascript or client-side methods of
     * converting to base64, refer to this link:
     * http://stackoverflow.com/questions/246801/how-can-you-encode-a-string-to-base64-in-javascript
     */
    var message = new Buffer(disqusStr).toString('base64');

    /*
     * CryptoJS is required for hashing (included in dir)
     * https://code.google.com/p/crypto-js/
     */
    var result = CryptoJS.HmacSHA1(message + " " + timestamp, DISQUS_SECRET);
    var hexsig = CryptoJS.enc.Hex.stringify(result);

    return {
      pubKey: DISQUS_PUBLIC,
      auth: message + " " + hexsig + " " + timestamp
    };
}

var HC = new Hipchat(process.env.HIPCHAT);
var hipchat = {
  message: function(color, message) {
    if (process.env.HIPCHAT) {
      var params = {
        room: 165440,
        from: 'Website',
        message: message,
        color: color,
        notify: 1
      };
      HC.postMessage(params, function(data) {console.log(arguments)});
    } else {
      console.log('No Hipchat API Key');
    }
  }
};
hipchat.message('purple', 'Server restarting');

var T = new Twit({
    consumer_key:         process.env.CONSUMER_KEY
  , consumer_secret:      process.env.CONSUMER_SECRET
  , access_token:         process.env.ACCESS_TOKEN
  , access_token_secret:  process.env.ACCESS_TOKEN_SECRET
});

app.use(compress())
// Serve public folder
app.use(express.static(__dirname + '/public', {maxAge: 7200 * 1000}));
app.use(bodyParser());
app.use(cookieParser());
// Load libraries into ram
var LIBRARIES = JSON.parse(fs.readFileSync('public/packages.json', 'utf8')).packages;

// Map libraries array into object for easy access
var LIBRARIES_MAP = {};
_.each(LIBRARIES, function(library){
  library.originalName = library.name;
  library.name = library.name.toLowerCase();
  library.id = library.name.replace(/\./g, '');

  if(library.filename && library.filename.substr(library.filename.length-3, library.filename.length) === 'css') {
    library.fileType = 'css';
  } else {
    library.fileType = 'js';
  }
  library.keywords = library.keywords && library.keywords.join(', ');
  library.assets = _.map(library.assets, function (assets) {
    if(library.version === assets.version) {
      assets.selected = 'selected="selected"';
      assets.classes = 'active';
    } else {
      assets.selected = '';
      assets.classes = '';
    }
    return assets;
  })
  LIBRARIES_MAP[library.name.toLowerCase().replace(/\./g, '')] = library;

});

function generateSlug (value) {
  return value.toLowerCase().replace(/-+/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

// Templates
var templates = {
  layout: fs.readFileSync('templates/layout.html', 'utf8'),
  home: fs.readFileSync('templates/home.html', 'utf8'),
  library: fs.readFileSync('templates/library.html', 'utf8'),
  login: fs.readFileSync('templates/login.html', 'utf8'),
  register: fs.readFileSync('templates/register.html', 'utf8'),
  profile: fs.readFileSync('templates/profile.html', 'utf8'),
  members: fs.readFileSync('templates/members.html', 'utf8'),
  news: fs.readFileSync('templates/news.html', 'utf8'),
  newsfeed_item: fs.readFileSync('templates/newsfeed_item.html', 'utf8'),
  newsfeed: fs.readFileSync('templates/newsfeed.html', 'utf8'),
  about: fs.readFileSync('templates/about.html', 'utf8')
}

var generatePage = function (options) {
  var layout = options.layout || templates.layout;
  var title = options.title || 'cdnjs.com - the missing cdn for javascript and css'
  var description = options.page && options.page.description || 'An open source CDN for Javascript and CSS sponsored by CloudFlare that hosts everything from jQuery and Modernizr to Bootstrap. Speed up your site with cdnjs!'

  var page = {
    data: options.page && options.page.data || {},
    template: options.page && options.page.template || 'No content'
  }
  var pageContent = Mustache.render(page.template, page.data);

  var fullContent = Mustache.render(layout, {title: title, description: description, page: pageContent});
  return fullContent;

}
var setCache = function (res, hours) {
  res.setHeader("Cache-Control", "public, max-age=" + 60 * 60 * hours); // 4 days
  res.setHeader("Expires", new Date(Date.now() + 60 * 60 * hours * 1000).toUTCString());
}
MongoClient.connect(process.env.MONGOHQ_URL, function(err, db) {

  /*
    db.collection('user_data').aggregate(
    { $project: { favorites: 1 }},
    { $unwind: "$favorites" },
    { $group: { _id: "result", count: { $sum: 1 }}}
  , function () {
    console.log(arguments);
  });
  */
  app.get('/', function(req, res) {
    setCache(res, 2);
    res.send(generatePage({
      page: {
        template: templates.home,
        data: {packages: LIBRARIES}
      }
    }));
  });


  app.get('/libraries/:library', function(req, res) {
    setCache(res, 1);
    db.collection('updates').find({$contains:{"status":"http"}}, {'limit':3, 'sort':{'posted_at':-1}}).toArray(function(err, docs) {
      console.log('Number of Updates --------------------------------------- ', docs.length);
      _.each(docs, function(doc){
        doc.posted_at = new Date(doc.posted_at);
        doc.status = linkify(doc.status);
        doc.slug = generateSlug(doc.status);
        doc.timeago = timeago(new Date(doc.posted_at));
      });
      var library = req.params.library.toLowerCase().replace(/\./g, '');
      console.log(library);
      res.send(generatePage({
        title: library + ' - cdnjs.com - the missing cdn for javascript and css',
        page: {
          template: templates.library,
          data: {library: LIBRARIES_MAP[library], updates: docs},
          description: LIBRARIES_MAP[library] && LIBRARIES_MAP[library].description
        }
      }));
    });
  });

  app.get('/libraries/:library/news', function(req, res) {
    setCache(res, 48);

    var library = req.params.library.toLowerCase().replace(/\./g, '');
    T.get('search/tweets', { q: library, count: 100 }, function(err, data, response) {
      res.send(generatePage({
        title: library + ' news - cdnjs.com - the missing cdn for javascript and css',
        page: {
          template: templates.news,
          data: {statuses: data.statuses, library: LIBRARIES_MAP[library]},
          description: LIBRARIES_MAP[library].description
        }
      }));
    })

  });
  var get_gravatar = function (email, size) {

      // MD5 (Message-Digest Algorithm) by WebToolkit
      //

      var MD5=function(s){function L(k,d){return(k<<d)|(k>>>(32-d))}function K(G,k){var I,d,F,H,x;F=(G&2147483648);H=(k&2147483648);I=(G&1073741824);d=(k&1073741824);x=(G&1073741823)+(k&1073741823);if(I&d){return(x^2147483648^F^H)}if(I|d){if(x&1073741824){return(x^3221225472^F^H)}else{return(x^1073741824^F^H)}}else{return(x^F^H)}}function r(d,F,k){return(d&F)|((~d)&k)}function q(d,F,k){return(d&k)|(F&(~k))}function p(d,F,k){return(d^F^k)}function n(d,F,k){return(F^(d|(~k)))}function u(G,F,aa,Z,k,H,I){G=K(G,K(K(r(F,aa,Z),k),I));return K(L(G,H),F)}function f(G,F,aa,Z,k,H,I){G=K(G,K(K(q(F,aa,Z),k),I));return K(L(G,H),F)}function D(G,F,aa,Z,k,H,I){G=K(G,K(K(p(F,aa,Z),k),I));return K(L(G,H),F)}function t(G,F,aa,Z,k,H,I){G=K(G,K(K(n(F,aa,Z),k),I));return K(L(G,H),F)}function e(G){var Z;var F=G.length;var x=F+8;var k=(x-(x%64))/64;var I=(k+1)*16;var aa=Array(I-1);var d=0;var H=0;while(H<F){Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=(aa[Z]|(G.charCodeAt(H)<<d));H++}Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=aa[Z]|(128<<d);aa[I-2]=F<<3;aa[I-1]=F>>>29;return aa}function B(x){var k="",F="",G,d;for(d=0;d<=3;d++){G=(x>>>(d*8))&255;F="0"+G.toString(16);k=k+F.substr(F.length-2,2)}return k}function J(k){k=k.replace(/rn/g,"n");var d="";for(var F=0;F<k.length;F++){var x=k.charCodeAt(F);if(x<128){d+=String.fromCharCode(x)}else{if((x>127)&&(x<2048)){d+=String.fromCharCode((x>>6)|192);d+=String.fromCharCode((x&63)|128)}else{d+=String.fromCharCode((x>>12)|224);d+=String.fromCharCode(((x>>6)&63)|128);d+=String.fromCharCode((x&63)|128)}}}return d}var C=Array();var P,h,E,v,g,Y,X,W,V;var S=7,Q=12,N=17,M=22;var A=5,z=9,y=14,w=20;var o=4,m=11,l=16,j=23;var U=6,T=10,R=15,O=21;s=J(s);C=e(s);Y=1732584193;X=4023233417;W=2562383102;V=271733878;for(P=0;P<C.length;P+=16){h=Y;E=X;v=W;g=V;Y=u(Y,X,W,V,C[P+0],S,3614090360);V=u(V,Y,X,W,C[P+1],Q,3905402710);W=u(W,V,Y,X,C[P+2],N,606105819);X=u(X,W,V,Y,C[P+3],M,3250441966);Y=u(Y,X,W,V,C[P+4],S,4118548399);V=u(V,Y,X,W,C[P+5],Q,1200080426);W=u(W,V,Y,X,C[P+6],N,2821735955);X=u(X,W,V,Y,C[P+7],M,4249261313);Y=u(Y,X,W,V,C[P+8],S,1770035416);V=u(V,Y,X,W,C[P+9],Q,2336552879);W=u(W,V,Y,X,C[P+10],N,4294925233);X=u(X,W,V,Y,C[P+11],M,2304563134);Y=u(Y,X,W,V,C[P+12],S,1804603682);V=u(V,Y,X,W,C[P+13],Q,4254626195);W=u(W,V,Y,X,C[P+14],N,2792965006);X=u(X,W,V,Y,C[P+15],M,1236535329);Y=f(Y,X,W,V,C[P+1],A,4129170786);V=f(V,Y,X,W,C[P+6],z,3225465664);W=f(W,V,Y,X,C[P+11],y,643717713);X=f(X,W,V,Y,C[P+0],w,3921069994);Y=f(Y,X,W,V,C[P+5],A,3593408605);V=f(V,Y,X,W,C[P+10],z,38016083);W=f(W,V,Y,X,C[P+15],y,3634488961);X=f(X,W,V,Y,C[P+4],w,3889429448);Y=f(Y,X,W,V,C[P+9],A,568446438);V=f(V,Y,X,W,C[P+14],z,3275163606);W=f(W,V,Y,X,C[P+3],y,4107603335);X=f(X,W,V,Y,C[P+8],w,1163531501);Y=f(Y,X,W,V,C[P+13],A,2850285829);V=f(V,Y,X,W,C[P+2],z,4243563512);W=f(W,V,Y,X,C[P+7],y,1735328473);X=f(X,W,V,Y,C[P+12],w,2368359562);Y=D(Y,X,W,V,C[P+5],o,4294588738);V=D(V,Y,X,W,C[P+8],m,2272392833);W=D(W,V,Y,X,C[P+11],l,1839030562);X=D(X,W,V,Y,C[P+14],j,4259657740);Y=D(Y,X,W,V,C[P+1],o,2763975236);V=D(V,Y,X,W,C[P+4],m,1272893353);W=D(W,V,Y,X,C[P+7],l,4139469664);X=D(X,W,V,Y,C[P+10],j,3200236656);Y=D(Y,X,W,V,C[P+13],o,681279174);V=D(V,Y,X,W,C[P+0],m,3936430074);W=D(W,V,Y,X,C[P+3],l,3572445317);X=D(X,W,V,Y,C[P+6],j,76029189);Y=D(Y,X,W,V,C[P+9],o,3654602809);V=D(V,Y,X,W,C[P+12],m,3873151461);W=D(W,V,Y,X,C[P+15],l,530742520);X=D(X,W,V,Y,C[P+2],j,3299628645);Y=t(Y,X,W,V,C[P+0],U,4096336452);V=t(V,Y,X,W,C[P+7],T,1126891415);W=t(W,V,Y,X,C[P+14],R,2878612391);X=t(X,W,V,Y,C[P+5],O,4237533241);Y=t(Y,X,W,V,C[P+12],U,1700485571);V=t(V,Y,X,W,C[P+3],T,2399980690);W=t(W,V,Y,X,C[P+10],R,4293915773);X=t(X,W,V,Y,C[P+1],O,2240044497);Y=t(Y,X,W,V,C[P+8],U,1873313359);V=t(V,Y,X,W,C[P+15],T,4264355552);W=t(W,V,Y,X,C[P+6],R,2734768916);X=t(X,W,V,Y,C[P+13],O,1309151649);Y=t(Y,X,W,V,C[P+4],U,4149444226);V=t(V,Y,X,W,C[P+11],T,3174756917);W=t(W,V,Y,X,C[P+2],R,718787259);X=t(X,W,V,Y,C[P+9],O,3951481745);Y=K(Y,h);X=K(X,E);W=K(W,v);V=K(V,g)}var i=B(Y)+B(X)+B(W)+B(V);return i.toLowerCase()};

      var size = size || 80;

      return 'http://www.gravatar.com/avatar/' + MD5(email) + '.jpg?s=' + size;
  }

  // User APP is playing hard ball this is a hack


    app.get('/profile/:login', function(req, res) {
      UserApp.setToken(user_app_token);
      UserApp.User.search({
        "fields": ["email", "login", "created_at", "user_id"],
        "filters": {
          "query": "login:" + req.params.login
        }
      }, function(error, result){
        console.log(error, result);
        if(error) {
            res.send(generatePage({
          page: {
            template: 'A random error occured'
          }
        }));
            return false;
        }
       users = result.items

      // TODO - This is very gross
      var user = users[0]
      if(user && user.user_id) {
        db.collection('user_data').findOne({user_id: user.user_id}, function(err, document) {
          var favorites = document && document.favorites || [];
          var fullFavorites = [];

          _.each(favorites, function(favorite){
            if(LIBRARIES_MAP[favorite]) {
              fullFavorites.push(LIBRARIES_MAP[favorite]);
            }
          })
          var data = {
            login: req.params.login,
            created_at: user.created_at,
            favorites: fullFavorites,
            gravatar: get_gravatar(user.email, 100)
          }
          res.send(generatePage({
            title: data.login + ' profile - cdnjs.com - the missing cdn for javascript and css',
            page: {
              template: templates.profile,
              data: data
            }
          }));

        });
      } else {
        res.send(generatePage({
          page: {
            template: 'A random error occured'
          }
        }));
      }
    });

  });


  // TODO - refactor these simple pages
  app.get('/login', function(req, res) {
    res.send(generatePage({
      page: {
        template: templates.login
      }
    }));
  });

  app.get('/register', function(req, res) {
    res.send(generatePage({
      page: {
        template: templates.register
      }
    }));
  });


  var membersRoute = function(req, res) {
    var page = req.params.page || 1;
    console.log(page);
    UserApp.setToken(user_app_token);
    UserApp.User.search({
        "page": page,
        "fields": ["login", "email"],
        "page_size": 100
    }, function(error, result){
        // Handle error/result
        var users = result.items;
        users = _.map(users, function(user){
          return {
            login: user.login,
            gravatar: get_gravatar(user.email, 25)
          }
        })

        var page_nav = [];
        for(var i = 0; i<result.total_pages;i++) {
          page_nav.push({
            page: i + 1,
            classes: i + 1 === page*1 ? 'active' : ''
          })
        }
      res.send(generatePage({
        title: 'members - cdnjs.com - the missing cdn for javascript and css',
        page: {
          template: templates.members,
          data: {
            users: users,
            total_pages: result.total_pages,
            total_users: result.total_items,
            current_page: page,
            page_nav: page_nav
          }
        }
      }));
    });
  }
  // TODO - refactor these simple pages
  app.get('/members', membersRoute);
  app.get('/members/:page', membersRoute);



  app.get('/about', function(req, res) {
    res.send(generatePage({
      page: {
        template: templates.about,
        title: 'about - cdnjs.com - the missing cdn for javascript and css'
      }
    }));
  });

  var checkUser = function (token, callback, error) {
    // TODO - implement session instead of making API call each time
    console.log('token', token);
    UserApp.setToken(token);
    UserApp.User.get({}, function(err, result) {
      if(result && result.length > 0) {
        callback(result[0]);
      } else {
        error();
      }
    });
  };

  // Favorites
  app.get('/favorites', function(req, res) {
    if(req.query.token) {
      checkUser(req.query.token, function (user) {
        db.collection('user_data').findOne({user_id: user.user_id}, function(err, document) {
          if(err) {
            res.send([]);
          } else {
            res.send(document && document.favorites || []);
          }
        });
      }, function () {
        res.send({message: 'error'})
      })
    } else {
      res.send([]);
    }
  });

  app.post('/favorites', function(req, res) {
    var library = req.body.library;
    checkUser(req.query.token, function (user) {
      db.collection('user_data').findOne({user_id: user.user_id}, function(err, document) {
        var favorites = document && document.favorites || [];
        if(!_.contains(favorites, library)) {
          favorites.push(library);
          db.collection('user_data').update({user_id: user.user_id}, {$set: {favorites: favorites}}, {upsert:true}, function(err) {});
          res.send({message: 'success'});
        } else {
          res.send({message: 'duplicate'});
        }
      });
    })
  });

  app.del('/favorites', function(req, res) {
    var library = req.body.library;
    checkUser(req.query.token, function (user) {
      db.collection('user_data').findOne({user_id: user.user_id}, function(err, document) {
        var favorites = document && document.favorites || [];
        favorites = _.without(favorites, library);
        db.collection('user_data').update({user_id: user.user_id}, {$set: {favorites: favorites}}, {upsert:true}, function(err) {});
        res.send({message: 'success'});
      });
    })
  });
  app.get('/news', function(req, res) {
    db.collection('updates').find().toArray(function(err, docs) {
      console.log('Number of Updates --------------------------------------- ', docs.length);
      _.each(docs, function(doc){
        doc.posted_at = new Date(doc.posted_at);
        doc.status = linkify(doc.status);
        doc.slug = generateSlug(doc.status);
        doc.timeago = timeago(new Date(doc.posted_at));
      });
      res.send(generatePage({
        title: 'news feed - community status updates from cdnjs.com',
        page: {
          template: templates.newsfeed,
          data: {updates: docs.reverse()}
        }
      }));
    });
  });
  var get_news = function(user, req, res) {
    console.log(user);
    var id = new BSON.ObjectID(req.params.id);
    db.collection('updates').findOne({_id: id}, function(err, doc) {
      var description = doc.status;
      doc.status = linkify(doc.status);
      doc.timeago = timeago(new Date(doc.posted_at));
      doc.slug = generateSlug(doc.status);
      doc.posted_at = new Date(doc.posted_at);
      if(user!==null){
        doc.hasUser = true;

        var disqusUser = {
          id: user.user_id,
          username: user.username,
          email: user.email
        }
        doc.user = disqusSignon(disqusUser);
      }
      res.send(generatePage({
        title: description + ' - cdnjs.com',
        page: {
          description: description,
          template: templates.newsfeed_item,
          data: doc
        }
      }));
    });
  }
  var news_item = function(req, res) {
    if(typeof req.cookies.ua_session_token !== 'undefined') {
      checkUser(req.cookies.ua_session_token, function (user) {
          get_news(user, req, res);
      }, function () {
        get_news(null, req, res);
      });
    } else {
      get_news(null, req, res);
    }

  }
app.get('/news/:id', news_item);
app.get('/news/:id/:slug', news_item);

  app.post('/status', function(req, res) {
    if(req.body.status.length > 200) {
      res.send({error: 'Message too long'});
      return false;
    };
    var now = (new Date).getTime();
    checkUser(req.query.token, function (user) {

      if(user) {
        db.collection('updates').find({user_id: user.user_id}).toArray(function(err, docs) {
          var updates = docs;
          var okay = true;
          if(updates && updates.length > 0) {
            updates = updates.reverse();
            console.log('what',now - updates[0].posted_at*1);
            if(now - updates[0].posted_at*1 < 86400) {
              okay = false;
            }
          }
          if(okay){
            db.collection('updates').insert({user_id: user.user_id, login: user.login, status: req.body.status, posted_at: now, gravatar: get_gravatar(user.email, 100)}, {w: 1}, function(err) {});
            hipchat.message('green', 'New status update by ' + user.login + ' - http://cdnjs.com/news');
            res.send({message: 'Success'});

          } else {
            res.send({error: 'You can only post once every 24 hours'});
          }
        });

      } else {
        res.send({error: 'You are not logged in'});
      }

    })
  });

  app.get('/newregistration/:login', function(req, res) {
      hipchat.message('green', 'New User - ' + req.params.login + ' - http://cdnjs.com/profile/'+ req.params.login);
    res.send({});
  });

  var port = Number(process.env.PORT || 5500);
  app.listen(port, function() {
    console.log("Listening on " + port);
  })
});
