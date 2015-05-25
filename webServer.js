#!/usr/bin/env node
require('newrelic');
var throng = require('throng');

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
        library.name = library.name.toLowerCase();
        library.id = library.name.replace(/\./g, '');

        if (library.filename && library.filename.substr(library.filename.length - 3, library.filename.length) === 'css') {
            library.fileType = 'css';
        } else {
            library.fileType = 'js';
        }
        library.keywords = library.keywords && library.keywords.join(', ');
        LIBRARIES_MAP[library.name.toLowerCase().replace(/\./g, '')] = library;

    });

    function generateSlug(value) {
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
            page: pageContent
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
            }
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

        var libraryName = req.params.library.toLowerCase().replace(/\./g, '');
        var library = LIBRARIES_MAP[libraryName];

        if(!library) {
            // If we don't find the library, redirect to the homepage.
            return res.status(404).send('Library "' + libraryName + '" not found!');
        }

        var version = req.params.version || library.version;

        if(!_.findWhere(library.assets, { version: version })) {
            return res.status(404).send(libraryName + ' version "' + version + '" not found!');
        }

        var assets = libraryAssetsList(library, version);

        res.send(generatePage({
            title: libraryName + ' - cdnjs.com - the missing cdn for javascript and css',
            page: {
                template: templates.library,
                data: {
                    library: library,
                    assets: assets,
                    selectedAssets: _.findWhere(assets, {version: version})
                },
                description: LIBRARIES_MAP[library] && LIBRARIES_MAP[library].description
            }
        }));
    }


    app.get('/libraries/:library/:version', libraryResponse);
    app.get('/libraries/:library', libraryResponse);


    app.get('/about', function(req, res) {
        setCache(res, 72);
        res.send(generatePage({
            page: {
                template: templates.about,
                title: 'about - cdnjs.com - the missing cdn for javascript and css'
            }
        }));
    });


    app.listen(PORT, function() {
        console.log("Listening on " + PORT);
    });
}