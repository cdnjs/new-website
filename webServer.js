#!/usr/bin/env node
//require('newrelic');
var throng = require('throng');
var gravatar = require('gravatar');

var WORKERS = process.env.WEB_CONCURRENCY || 1;
var PORT = Number(process.env.PORT || 5500);

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
    var marked = require( "marked" );
    var path = require('path');
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
        var layout = options.layout || templates.layout;
        var title = options.title || 'cdnjs.com - the missing cdn for javascript and css'
        var description = options.page && options.page.description || 'An open source CDN for Javascript and CSS sponsored by CloudFlare that hosts everything from jQuery and Modernizr to Bootstrap. Speed up your site with cdnjs!'

        var page = {
            data: options.page && options.page.data || {},
            template: options.page && options.page.template || 'No content'
        }
        var pageContent = Mustache.render(page.template, page.data);

        var fullContent = Mustache.render(layout, {
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
            return assets;
        });
    }

    function checkVersion(library, version) {
        return _.findWhere(library.assets, { version: version });
    }


    function libraryResponse(req, res) {
        setCache(res, 1);
        var libraryRealName = req.params.library;
        var libraryName = req.params.library.replace(/\./g, '');
        var library = LIBRARIES_MAP[libraryName];
        var srcpath = 'tutorials/' + libraryRealName;
        var tutorialPackages = [];
        if(fs.existsSync(srcpath)){
            var directories = fs.readdirSync(srcpath).filter(function(file) {
                return fs.statSync(path.join(srcpath, file)).isDirectory();
            });

            var tutorialPackages = _.map(directories, function(tutorial) {
                var tutorialPackage = JSON.parse(fs.readFileSync('tutorials/' + libraryRealName + '/' + tutorial + '/tutorial.json', 'utf8'));
                tutorialPackage.slug = tutorial;
                return tutorialPackage;
            });
        }
        var tutorialsPresent = tutorialPackages.length > 0 ? true : false;
        if(!library) {
            // If we don't find the library, redirect to the homepage.
            return res.status(404).send('Library not found!');
        }

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
        var library = req.params.library
        var srcpath = 'tutorials/' + library;

        var directories = fs.readdirSync(srcpath).filter(function(file) {
            return fs.statSync(path.join(srcpath, file)).isDirectory();
        });

        var tutorialPackages = _.map(directories, function(tutorial) {
            var tutorialPackage = JSON.parse(fs.readFileSync('tutorials/' + library + '/' + tutorial + '/tutorial.json', 'utf8'));
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
        var library = req.params.library;
        var tutorial = req.params.tutorial;


        var srcpath = 'tutorials/' + library;

        var directories = fs.readdirSync(srcpath).filter(function(file) {
            return fs.statSync(path.join(srcpath, file)).isDirectory();
        });

        var tutorialPackages = _.map(directories, function(tutorial) {
            var tutorialPackage = JSON.parse(fs.readFileSync('tutorials/' + library + '/' + tutorial + '/tutorial.json', 'utf8'));
            tutorialPackage.slug = tutorial;
            return tutorialPackage;
        });

        var tutorialFile = fs.readFileSync('tutorials/' + library + '/' + tutorial + '/index.md', 'utf8');
        var tutorialPackage = JSON.parse(fs.readFileSync('tutorials/' + library + '/' + tutorial + '/tutorial.json', 'utf8'));
        console.log(tutorialPackage.author.email);
        var avatar = gravatar.url(tutorialPackage.author.email, {s: '200', r: 'pg', d: '404'});
        var marked = require( "marked" );

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
            page: {
                template: templates.tutorial,
                title:  tutorialPackage.name + ' - ' + library + ' tutorials - cdnjs.com',
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