#!/usr/bin/env node
var throng = require('throng');
var gravatar = require('gravatar');
var gitUrlParse = require("git-url-parse");
var removeNewline = require('newline-remove');
var condenseWhitespace = require('condense-whitespace');
var fs = require('fs');
var licenses = JSON.parse(fs.readFileSync('license-list.json', 'utf8'));
var WORKERS = process.env.WEB_CONCURRENCY || 1;
var PORT = Number(process.env.PORT || 5500);
var TITLE = 'cdnjs.com - The best FOSS CDN for web related libraries to speed up your websites!';
var request = 'https://github.com/cdnjs/cdnjs/issues/new?title=%5BRequest%5D%20Add%20library_name&body=**Library%20name%3A**%20%0A**Git%20repository%20url%3A**%20%0A**npm%20package%20name%20or%20url**%20(if%20there%20is%20one)%3A%20%0A**License%20(List%20them%20all%20if%20it%27s%20multiple)%3A**%20%0A**Official%20homepage%3A**%20%0A**Wanna%20say%20something%3F%20Leave%20message%20here%3A**%20%0A%0A%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%3D%0A%0ANotes%20from%20cdnjs%20maintainer%3A%0APlease%20read%20the%20%5BREADME.md%5D(https%3A%2F%2Fgithub.com%2Fcdnjs%2Fcdnjs%23cdnjs-library-repository)%20and%20%5BCONTRIBUTING.md%5D(https%3A%2F%2Fgithub.com%2Fcdnjs%2Fcdnjs%2Fblob%2Fmaster%2F.github%2FCONTRIBUTING.md)%20document%20first.%0A%0AWe%20encourage%20you%20to%20add%20a%20library%20via%20sending%20pull%20request%2C%0Ait%27ll%20be%20faster%20than%20just%20opening%20a%20request%20issue%2C%0Asince%20there%20are%20tons%20of%20issues%2C%20please%20wait%20with%20patience%2C%0Aand%20please%20don%27t%20forget%20to%20read%20the%20guidelines%20for%20contributing%2C%20thanks!!%0A'
var args = process.argv.slice(2);
var localMode = false;

if (process.env.LOCAL === 'true' || (args.length > 0 && (args[0] === '--local' || args[2] === '--local'))) {
  console.log("local mode: on, gc(), CSP and Public-Key-Pins headers disabled!");
  localMode = true;
} else {
  console.log("local mode: off");
}

throng(start, {
  workers: WORKERS,
  lifetime: Infinity
});

function start() {
  var express = require("express");
  var fs = require("fs");
  var _ = require("lodash");
  var Mustache = require("mustache");
  var app = express();
  var compress = require('compression');
  var highlight = require('highlight.js');
  var marked = require("marked");
  var path = require('path');
  highlight.configure({
    tabReplace: '  '
  });
  app.disable('x-powered-by');
  app.use(function(req, res, next) {
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    res.setHeader('X-Frame-Options', 'deny');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    if (!localMode) {
      res.setHeader('Public-Key-Pins', 'pin-sha256="EULHwYvGhknyznoBvyvgbidiBH3JX3eFHHlIO3YK8Ek=";pin-sha256="x9SZw6TwIqfmvrLZ/kz1o0Ossjmn728BnBKpUFqGNVM=";max-age=3456000;report-uri="https://cdnjs.report-uri.io/r/default/hpkp/enforce');
      res.setHeader('Content-Security-Policy', "upgrade-insecure-requests; default-src 'unsafe-eval' 'self' *.carbonads.com *.getclicky.com fonts.gstatic.com www.google-analytics.com fonts.googleapis.com cdnjs.cloudflare.com 'unsafe-inline' https: data: ;report-uri https://cdnjs.report-uri.io/r/default/hpkp/enforce");
    }
    next();
  });
  app.use(compress());

  if (!localMode && (typeof global.gc !== 'undefined')) {
    global.gc();
  }

    // Serve public folder
  app.use(express.static(__dirname + '/public', {
    maxAge: 7200 * 1000
  }));

    // Load libraries into ram
  var LIBRARIES = JSON.parse(fs.readFileSync('public/packages.min.json', 'utf8')).packages;
    // Load GitHub repositories meta data
  var GITHUB_METAS = JSON.parse(fs.readFileSync('GitHub.repos.meta.json', 'utf8'));

  var LIBRARIES_VERSIONS = 0;
    // Map libraries array into object for easy access
  var LIBRARIES_MAP = {};
  _.each(LIBRARIES, function(library) {
    library.originalName = library.name;
    library.id = library.name;

    if (library.filename && library.filename.substr(library.filename.length - 3, library.filename.length) === 'css') {
      library.fileType = 'css';
    } else {
      library.fileType = 'js';
    }
    library.keywords = library.keywords && library.keywords.join(', ');
    LIBRARIES_MAP[library.name] = library;
    LIBRARIES_VERSIONS += library.assets.length;
  });
  LIBRARIES = null;

  function getTemplate(templateURL, simple) {
    if (simple === true) {
      return fs.readFileSync(templateURL, 'utf8');
    }
    return removeNewline(condenseWhitespace(fs.readFileSync(templateURL, 'utf8')));
  }

    // Templates
  var templates = {
    layout: getTemplate('templates/layout.html'),
    home: getTemplate('templates/home.html'),
    libraries: getTemplate('templates/libraries.html'),
    library: getTemplate('templates/library.html'),
    login: getTemplate('templates/login.html'),
    register: getTemplate('templates/register.html'),
    profile: getTemplate('templates/profile.html'),
    members: getTemplate('templates/members.html'),
    news: getTemplate('templates/news.html'),
    newsfeed_item: getTemplate('templates/newsfeed_item.html'),
    newsfeed: getTemplate('templates/newsfeed.html'),
    about: getTemplate('templates/about.html'),
    tutorials: getTemplate('templates/tutorials.html', true),
    tutorial: getTemplate('templates/tutorial.html', true),
    api: getTemplate('templates/api.html', true),
    notfound: getTemplate('templates/notfound.html', true)
  };

  var generatePage = function(options) {
    var layout = options.layout || templates.layout;
    var title = options.title || TITLE;
    var keywords = options.page.data && options.page.data.library && options.page.data.library.keywords || 'CDN,CDNJS,js,css,library,web,front-end,free,open-source,png,plugin,ng,jQuery,angular';
    var description = (options.page && options.page.description) ? options.page.description + ' - ' + TITLE : TITLE;
    var page = {
      data: options.page && options.page.data || {},
      template: options.page && options.page.template || 'No content'
    };
    var pageContent = Mustache.render(page.template, page.data);
    var fullContent = Mustache.render(layout, {
      url: options.reqUrl,
      title: title,
      keywords: keywords,
      description: description,
      page: pageContent,
      request: request,
      wrapperClass: options.wrapperClass || ''
    });
    return fullContent;
  };
  var setCache = function(res, hours) {
    res.setHeader("Cache-Control", "public, max-age=" + 60 * 60 * hours + ", immutable");
    res.setHeader("Expires", new Date(Date.now() + 60 * 60 * hours * 1000).toUTCString());
  };

  var serverPush = function(res, uri) {
    var temp = uri.split('.');
    var ext = temp[temp.length - 1];
    var as = -1;
    switch (ext) {
      case 'js':
        as = 'script';
        break;
      case 'css':
        as = 'style';
        break;
      case 'png' :
      case 'jpg' :
      case 'jpeg':
      case 'gif' :
      case 'ico' :
        as = 'image';
        break;
      case 'xml' :
        as = '';
        break;
      default:
        break;
    }
    if (as !== -1) {
      res.append("Link", "<" + uri + ">; rel=preload; as=" + as);
    }
    temp = null;
    ext = null;
    as = null;
  };

  function pushAssets(res) {
    serverPush(res, '/css/main.css');
    serverPush(res, '/js/main.js');
  }

  app.get('/request-new-lib', function(req, res) {
    return res.redirect(302, request);
  });

  app.get('/cdnjs.cloudflare.com/*', function(req, res) {
    return res.redirect(301, 'https:/' + req.url);
  });

  app.get('/', function(req, res) {
    if (req.query.q) {
      return res.redirect(301, '/#q=' + req.query.q);
    }
    pushAssets(res);
    serverPush(res, '/img/algolia.svg');
    setCache(res, 2);
    res.send(generatePage({
      reqUrl: req.url,
      page: {
        template: templates.home,
        data: {
          libCount: Object.keys(LIBRARIES_MAP).length,
          libVerCount: LIBRARIES_VERSIONS
        }
      },
      wrapperClass: 'home'
    }));
  });

  function libraryGitRepoList(library) {
    var urls = [];

    if (library.repository === undefined) {
      return null;
    }

    if (library.repository.type === 'git') {
      urls.push({url: gitUrlParse(library.repository.url).toString("https")});
    }
    library.urls = urls;
    return urls;
  }

  function librarylicensesList(library) {
    if (library.license === undefined && library.licenses === undefined) {
      return null;
    }
    if (library.license !== undefined) {
      library.licenses = [];
      library.licenses[0] = library.license;
      delete library.license;
    }
    for (var license in library.licenses) {
      if (typeof (library.licenses[license]) !== 'object') {
        var temp = library.licenses[license];
        library.licenses[license] = {};
        library.licenses[license].type = temp;
        library.licenses[license].url = '#';
      }
      if (licenses.indexOf(library.licenses[license].type) !== -1) {
        library.licenses[license].url = 'https://spdx.org/licenses/' + library.licenses[license].type + '.html';
      }
    }
    return library.licenses;
  }

  function libraryAssetsList(library, version) {
    return _.map(library.assets, function(assets) {
      if (assets.version === version) {
        assets.selected = 'selected';
      } else {
        assets.selected = '';
      }
      if (assets.gennedFileNames === undefined) {
        var fileArray = [];
        assets.files.map(function(fileName, index) {
          var fileExtension = path.extname(fileName);
          var fileType = fileExtension.substring(1) || 'unknown';
          fileArray.push({name: fileName, fileType: fileType});
        });
        assets.files = fileArray;
        assets.gennedFileNames = true;
      }
      return assets;
    });
  }

  function GitHubMetaInfo(library) {
    if (library.repository !== undefined && /github.com/.test(library.repository.url)) {
      var pathname = gitUrlParse(library.repository.url).pathname.replace(/^\/|.git/g , "").toString();
      return GITHUB_METAS[pathname];
    } else {
      return null;
    }
  }

  function libraryResponse(req, res) {
    setCache(res, 1);
    var libraryName = req.params.library;
    var library = LIBRARIES_MAP[libraryName];
    var srcpath = path.resolve(__dirname, 'tutorials', libraryName);
    var tutorialPackages = [];

    if (fs.existsSync(srcpath)) {
      var directories = fs.readdirSync(srcpath).filter(function(file) {
        return fs.statSync(path.resolve(srcpath, file)).isDirectory();
      });

      tutorialPackages = _.map(directories, function(tutorial) {
        var tutorialPackage = JSON.parse(fs.readFileSync(path.resolve(srcpath, tutorial, 'tutorial.json'), 'utf8'));
        tutorialPackage.slug = tutorial;
        return tutorialPackage;
      });
    }
    var tutorialsPresent = tutorialPackages.length > 0;
    if (!library) {
      return res.redirect(307, '/#q=' + libraryName);
    }

    if (library.autoupdate && !library.autoupdate.url) {
      library.autoupdate.string = library.autoupdate.type ? library.autoupdate.type + ' autoupdate enabled' : '';
      switch (library.autoupdate.type) {
        case 'npm':
          library.autoupdate.url = 'https://npmjs.com/package/' + library.autoupdate.target;
          break;
        case 'git':
          library.autoupdate.url = gitUrlParse(library.autoupdate.target).toString("https");
          break;
        default:
          break;
      }
    }
    if (!library.homepage && library.repository && library.repository.type === 'git') {
      library.homepage = gitUrlParse(library.repository.url).toString("https");
    }
    var version = req.params.version || library.version;

    if (!_.find(library.assets, {version: version})) {
      return res.status(404).send(libraryName + ' version not found!');
    }

    var SRI;
    try {
      SRI = fs.readFileSync('sri/' + libraryName + '/' + version + '.json');
    } catch (e) {
      SRI = {};
    }
    var licenses = librarylicensesList(library);
    var assets = libraryAssetsList(library, version);
    var stargazers_count = null, forks = null, subscribers_count = null;
    var metaInfo = GitHubMetaInfo(library);
    if (metaInfo !== null && metaInfo !== undefined) {
      stargazers_count = metaInfo.stargazers_count;
      forks = metaInfo.forks;
      subscribers_count = metaInfo.subscribers_count;
    }
    if (!library.urls) {
      library.urls = libraryGitRepoList(library);
    }
    res.send(generatePage({
      reqUrl: req.url,
      title: libraryName + ' - ' + TITLE,
      page: {
        template: templates.library,
        data: {
          library: library,
          assets: assets,
          SRI: SRI,
          licenses: licenses,
          selectedAssets: _.find(assets, {version: version}),
          tutorials: tutorialPackages,
          libraryRealName: libraryName,
          tutorialsPresent: tutorialsPresent,
          star: stargazers_count,
          fork: forks,
          watch: subscribers_count
        },
        description: library && (library.name + " - " + library.description)
      }
    }));
  }

  app.get('/libraries/:library/tutorials', function(req, res) {
    var library = req.params.library;
    var srcpath = path.resolve(__dirname, 'tutorials', library);

    var directories = fs.readdirSync(srcpath).filter(function(file) {
      return fs.statSync(path.resolve(srcpath, file)).isDirectory();
    });

    var tutorialPackages = _.map(directories, function(tutorial) {
      var tutorialPackage = JSON.parse(fs.readFileSync(path.resolve(srcpath, tutorial, 'tutorial.json'), 'utf8'));
      tutorialPackage.slug = tutorial;
      return tutorialPackage;
    });

    setCache(res, 72);
    res.send(generatePage({
      reqUrl: req.url,
      title: library + ' tutorials - ' + TITLE,
      page: {
        template: templates.tutorials,
        data: {
          tutorials: tutorialPackages,
          library: library
        }
      }
    }));
  });

  app.get('/libraries/:library/tutorials/:tutorial', function(req, res) {
    var library = req.params.library;
    var tutorial = req.params.tutorial;
    var srcpath = path.resolve(__dirname, 'tutorials', library);
    var indexPath = path.resolve(srcpath, tutorial, 'index.md');

    if (!fs.existsSync(indexPath)) {
      return res.status(404).send('Tutorial not found!');
    }

    var tutorialFile = fs.readFileSync(indexPath, 'utf8');
    var directories = fs.readdirSync(srcpath).filter(function(file) {
      return fs.statSync(path.resolve(srcpath, file)).isDirectory();
    });

    var tutorialPackages = _.map(directories, function(tutorial) {
      var tutorialPackage = JSON.parse(fs.readFileSync(path.resolve(srcpath, tutorial, 'tutorial.json'), 'utf8'));
      tutorialPackage.slug = tutorial;
      return tutorialPackage;
    });

    var tutorialPackage = JSON.parse(fs.readFileSync(path.resolve(srcpath, tutorial, 'tutorial.json'), 'utf8'));
    var avatar = gravatar.url(tutorialPackage.author.email, {s: '200', r: 'pg', d: '404'});

    marked.setOptions({
      renderer: new marked.Renderer(),
      gfm: true,
      tables: true,
      breaks: false,
      pedantic: false,
      sanitize: false,
      smartLists: false,
      smartypants: false,
      langPrefix: ''
          // highlight: function (code, lang) {
          //  var language = lang || 'html';
          //  return highlight.highlightAuto(code).value;
          // }
    });

    setCache(res, 72);
    res.send(generatePage({
      reqUrl: req.url,
      title: tutorialPackage.name + ' - ' + library + ' tutorials - cdnjs.com',
      page: {
        template: templates.tutorial,
        data: {
          tute: marked(tutorialFile),
          avatar: avatar,
          tutorial: tutorialPackage,
          disqus_shortname: tutorialPackage.disqus_shortname || 'cdnjstutorials',
          disqus_url: tutorialPackage.disqus_url || ('https://cdnjs.com/' + req.originalUrl),
          disqus_id: tutorialPackage.disqus_url || req.originalUrl,
          author: tutorialPackage.author,
          tutorials: tutorialPackages,
          library: library
        }
      }
    }));
  });

  app.get('/libraries/:library/:version', libraryResponse);

  app.get('/libraries/:library', libraryResponse);

  app.get('/libraries', function(req, res) {
    setCache(res, 2);

    res.send(generatePage({
      reqUrl: req.url,
      title: 'libraries - ' + TITLE,
      page: {
        template: templates.libraries,
        data: {
          packages: _.toArray(LIBRARIES_MAP),
          libCount: Object.keys(LIBRARIES_MAP).length,
          libVerCount: LIBRARIES_VERSIONS
        }
      }
    }));
  });

  app.get('/gitstats', function(req, res) {
    return res.redirect(301, '/gitstats/cdnjs');
  });
  app.get('/git_stats', function(req, res) {
    return res.redirect(301, '/git_stats/cdnjs');
  });
  app.get('/about', function(req, res) {
    setCache(res, 72);
    res.send(generatePage({
      reqUrl: req.url,
      title: 'about - ' + TITLE,
      page: {
        template: templates.about
      }
    }));
  });

  app.get('/api', function(req, res) {
    setCache(res, 72);
    res.send(generatePage({
      reqUrl: req.url,
      title: 'API - ' + TITLE,
      page: {
        template: templates.api
      }
    }));
  });

  app.use(function(req, res) {
    res.status(404).send(generatePage({
      reqUrl: req.url,
      title: '404: Page Not Found - ' + TITLE,
      page: {
        template: templates.notfound
      }
    }));
  });

  app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

  app.listen(PORT, function() {
    console.log("Listening on " + PORT);
  });
}
