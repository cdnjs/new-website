#!/usr/bin/env node
require('newrelic');
var throng = require('throng'),
  gravatar = require('gravatar'),

  WORKERS = process.env.WEB_CONCURRENCY || 1,
  PORT = Number(process.env.PORT || 5500);

throng(start, {
    workers: WORKERS,
    lifetime: Infinity
});

function start() {
    var express = require("express"),
      fs = require("fs"),
      _ = require("lodash"),
      Mustache = require("mustache"),
      app = express(),
      compress = require('compression'),
      highlight = require('highlight.js'),
      marked = require( "marked" ),
      path = require('path');
    highlight.configure({
      tabReplace: '  '
                          // … other options aren't changed
    })
    app.use(compress());

    // Serve public folder
    app.use(express.static(__dirname + '/public', {
        maxAge: 7200 * 1000
    }));

    // Load libraries into ram
    var LIBRARIES = JSON.parse(fs.readFileSync('public/packages.min.json', 'utf8')).packages;

    // Map libraries array into object for easy access
    var LIBRARIES_MAP = {};
    _.each(LIBRARIES, function(library) {
        library.originalName = library.name;
        library.id = library.name.replace(/\./g, '');

        if (library.filename && library.filename.substr(library.filename.length - 3, library.filename.length) === 'css') {
            library.fileType = 'css';
        } else {
            library.fileType = 'js';
        }
        library.keywords = library.keywords && library.keywords.join(', ');
        LIBRARIES_MAP[library.name.replace(/\./g, '')] = library;

    });

    function generateSlug(value) {
        return value.replace(/-+/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    };

    // Templates
    var templates = {
        layout: fs.readFileSync('templates/layout.html', 'utf8'),
        home: fs.readFileSync('templates/home.html', 'utf8'),
        libraries: fs.readFileSync('templates/libraries.html', 'utf8'),
        library: fs.readFileSync('templates/library.html', 'utf8'),
        login: fs.readFileSync('templates/login.html', 'utf8'),
        register: fs.readFileSync('templates/register.html', 'utf8'),
        profile: fs.readFileSync('templates/profile.html', 'utf8'),
        members: fs.readFileSync('templates/members.html', 'utf8'),
        news: fs.readFileSync('templates/news.html', 'utf8'),
        newsfeed_item: fs.readFileSync('templates/newsfeed_item.html', 'utf8'),
        newsfeed: fs.readFileSync('templates/newsfeed.html', 'utf8'),
        about: fs.readFileSync('templates/about.html', 'utf8'),
        tutorials: fs.readFileSync('templates/tutorials.html', 'utf8'),
        tutorial: fs.readFileSync('templates/tutorial.html', 'utf8')
    }

    var generatePage = function(options) {
        var layout = options.layout || templates.layout,
          title = options.title || 'cdnjs.com - the missing cdn for javascript and css',
          description = options.page && options.page.description || 'An open source CDN for Javascript and CSS sponsored by CloudFlare that hosts everything from jQuery and Modernizr to Bootstrap. Speed up your site with cdnjs!',

          page = {
            data: options.page && options.page.data || {},
            template: options.page && options.page.template || 'No content'
        },
          pageContent = Mustache.render(page.template, page.data),

          fullContent = Mustache.render(layout, {
            title: title,
            description: description,
            page: pageContent,
            wrapperClass: options.wrapperClass || ''
        });
        return fullContent;

    }
    var setCache = function(res, hours) {
        res.setHeader("Cache-Control", "public, max-age=" + 60 * 60 * hours); // 4 days
        res.setHeader("Expires", new Date(Date.now() + 60 * 60 * hours * 1000).toUTCString());
    }


    app.get('/', function(req, res) {
        setCache(res, 2);
        res.send(generatePage({
            page: {
                template: templates.home,
                data: {
                    packages: LIBRARIES
                }
            },
            wrapperClass: 'home'
        }));
    });

    function libraryAssetsList(library, version) {
        return _.map(library.assets, function(assets) {
            if (assets.version === version) {
                assets.selected = 'selected="selected"';
            } else {
                assets.selected = '';
            }
            if (assets.gennedFileNames === undefined) {
                var fileArray = [];
                assets.files.map(function(fileName, index) {
                    fileArray.push({"name": fileName});
                });
                assets.files = fileArray;
                assets.gennedFileNames = true;
            }
            return assets;
        });
    }

    function checkVersion(library, version) {
        return _.findWhere(library.assets, { version: version });
    }


    function libraryResponse(req, res) {
        setCache(res, 1);
        var libraryRealName = req.params.library,
          libraryName = req.params.library.replace(/\./g, ''),
          library = LIBRARIES_MAP[libraryName],
          srcpath = path.resolve(__dirname, 'tutorials', libraryRealName),
          tutorialPackages = [];
        if(fs.existsSync(srcpath)){
            var directories = fs.readdirSync(srcpath).filter(function(file) {
                return fs.statSync(path.resolve(srcpath, file)).isDirectory();
            });

            var tutorialPackages = _.map(directories, function(tutorial) {
                var tutorialPackage = JSON.parse(fs.readFileSync(path.resolve(srcpath, tutorial, 'tutorial.json'), 'utf8'));
                tutorialPackage.slug = tutorial;
                return tutorialPackage;
            });
        }
        var tutorialsPresent = tutorialPackages.length > 0 ? true : false;
        if(!library) {
            // If we don't find the library, redirect to the homepage.
            return res.status(404).send('Library not found!');
        }

        //Get the repository url
        var urls = [];
        // collect all repository urls
        if (library.repositories && _.isArray(library.repositories)) {
          for (var i = 0; i < library.repositories.length; ++i) {
            urls.push(library.repositories[i].url);
          }      
        }
        if (library.repository) {
          if (_.isObject(library.repository)) {
            urls.push(library.repository.url);
          } else if (_.isString(library.repository)) {
            urls.push(library.repository);
          }   
        }
        // for each collected URL, try to find the associated github repo
        var repos = _.compact(_.map(urls, function(url) {
          if (!url || !_.isString(url)) {
            return null;
          }
          var m = url.match(/.*github\.com\/([^\/]+)\/([^\/]+)(\/.*|\.git)?$/);
          if (!m) {
            return null;
          }
          return { user: m[1], repo: m[2].replace(/.git$/, '') };
        }));
  
        library.repo = '';
        if (repos.length > 0) {
          var repo = repos[0]; // fetch only the first repository   
          library.repo = repo.user + '/' + repo.repo;
        }       
       
        library.autoupdateEnabled = library.autoupdate ? library.autoupdate + ' autoupdate enabled' : '';
        var version = req.params.version || library.version;

        if(!_.findWhere(library.assets, { version: version })) {
            return res.status(404).send(libraryName + ' version not found!');
        }

        var assets = libraryAssetsList(library, version);

        res.send(generatePage({
            title: libraryName + ' - cdnjs.com - the missing cdn for javascript and css',
            page: {
                template: templates.library,
                data: {
                    library: library,
                    assets: assets,
                    selectedAssets: _.findWhere(assets, {version: version}),
                    tutorials: tutorialPackages,
                    libraryRealName: libraryRealName,
                    tutorialsPresent: tutorialsPresent
                },
                description: LIBRARIES_MAP[library] && LIBRARIES_MAP[library].description
            }
        }));
    }

    app.get('/libraries/:library/tutorials', function (req, res) {
        var library = req.params.library,
          srcpath = path.resolve(__dirname, 'tutorials', library),

          directories = fs.readdirSync(srcpath).filter(function(file) {
            return fs.statSync(path.resolve(srcpath, file)).isDirectory();
        });

        var tutorialPackages = _.map(directories, function(tutorial) {
            var tutorialPackage = JSON.parse(fs.readFileSync(path.resolve(srcpath, tutorial, 'tutorial.json'), 'utf8'));
            tutorialPackage.slug = tutorial;
            return tutorialPackage;
        });

        setCache(res, 72);
        res.send(generatePage({
            page: {
                template: templates.tutorials,
                title: library + ' tutorials - cdnjs.com - the missing cdn for javascript and css',
                data: {
                    tutorials: tutorialPackages,
                    library: library
                }
            }
        }));
    });

    app.get('/libraries/:library/tutorials/:tutorial', function (req, res) {
        var library = req.params.library,
          tutorial = req.params.tutorial,

          srcpath = path.resolve(__dirname, 'tutorials', library),
          indexPath = path.resolve(srcpath, tutorial, 'index.md');

        if(!fs.existsSync(indexPath)) {
            return res.status(404).send('Tutorial not found!');
        }

        var tutorialFile = fs.readFileSync(indexPath, 'utf8'),

          directories = fs.readdirSync(srcpath).filter(function(file) {
            return fs.statSync(path.resolve(srcpath, file)).isDirectory();
        });

        var tutorialPackages = _.map(directories, function(tutorial) {
            var tutorialPackage = JSON.parse(fs.readFileSync(path.resolve(srcpath, tutorial, 'tutorial.json'), 'utf8'));
            tutorialPackage.slug = tutorial;
            return tutorialPackage;
        });

        var tutorialPackage = JSON.parse(fs.readFileSync(path.resolve(srcpath, tutorial, 'tutorial.json'), 'utf8')),
          avatar = gravatar.url(tutorialPackage.author.email, {s: '200', r: 'pg', d: '404'}),
          marked = require( "marked" );

        marked.setOptions({
          renderer: new marked.Renderer(),
          gfm: true,
          tables: true,
          breaks: false,
          pedantic: false,
          sanitize: false,
          smartLists: false,
          smartypants: false,
          langPrefix: '',
          //highlight: function (code, lang) {
          //  var language = lang || 'html';
          //  return highlight.highlightAuto(code).value;
          //}
        });

        setCache(res, 72);
        res.send(generatePage({
            title:  tutorialPackage.name + ' - ' + library + ' tutorials - cdnjs.com',
            page: {
                template: templates.tutorial,
                data: {
                    tute: marked( tutorialFile ),
                    avatar: avatar,
                    tutorial: tutorialPackage,
                    disqus_shortname: tutorialPackage.disqus_shortname || 'cdnjstutorials',
                    disqus_url: tutorialPackage.disqus_url || req.originalUrl,
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
            title: 'libraries - cdnjs.com - the missing cdn for javascript and css',
            page: {
                template: templates.libraries,
                data: {
                    packages: LIBRARIES
                }
            }
        }));
    });


    app.get('/about', function(req, res) {
        
        setCache(res, 72);
        res.send(generatePage({
            page: {
                template: templates.about,
                title: 'about - cdnjs.com - the missing cdn for javascript and css'
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
