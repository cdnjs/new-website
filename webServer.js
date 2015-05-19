#!/usr/bin/env node
require('newrelic');
var express = require("express");
var fs = require("fs");
var _ = require("lodash");
var Mustache = require("mustache");
var app = express();
var bodyParser = require('body-parser');

var cookieParser = require('cookie-parser');
var linkify = require("html-linkify");
var timeago = require('timeago');
var compress = require('compression');
var minify = require('express-minify');



app.use(compress());
app.use(minify({
    cache: __dirname + '/cache'
}));
// Serve public folder
app.use(express.static(__dirname + '/public', {
    maxAge: 7200 * 1000
}));
app.use(bodyParser());
app.use(cookieParser());
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
    library.assets = _.map(library.assets, function(assets) {
        if (library.version === assets.version) {
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


app.get('/libraries/:library', function(req, res) {
    setCache(res, 1);

    var library = req.params.library.toLowerCase().replace(/\./g, '');
    console.log(library);
    res.send(generatePage({
        title: library + ' - cdnjs.com - the missing cdn for javascript and css',
        page: {
            template: templates.library,
            data: {
                library: LIBRARIES_MAP[library]
            },
            description: LIBRARIES_MAP[library] && LIBRARIES_MAP[library].description
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






var port = Number(process.env.PORT || 5500);
app.listen(port, function() {
console.log("Listening on " + port);
})
