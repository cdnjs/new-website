// Library imports
const gravatar = require('gravatar');
const fs = require('fs');
const express = require('express');
const _ = require('lodash');
const compress = require('compression');
const highlight = require('highlight.js');
const marked = require('marked');
const path = require('path');

// Local imports
const constants = require('./constants');
const breadcrumbs = require('./utils/breadcrumbs');
const libraries = require('./utils/libraries');
const templating = require('./utils/templating');
const getDirectories = require('./utils/getDirectories');
const cache = require('./utils/cache');
const push = require('./utils/push');

// App constants
const PORT = Number(process.env.PORT || 5500);
const args = process.argv.slice(2);

// Local mode state
let localMode = false;
if (process.env.LOCAL === 'true' || (args.length > 0 && (args[0] === '--local' || args[2] === '--local'))) {
  console.log('local mode: on, gc(), CSP and Public-Key-Pins headers disabled!');
  localMode = true;
} else {
  console.log('local mode: off');
}

// Garbage collection
if (!localMode && (typeof global.gc !== 'undefined')) {
  global.gc();
}

// The app
// TODO: clean all this
// TODO: split routes into routers
module.exports = () => {
  // Basic app configuration
  const app = express();
  highlight.configure({ tabReplace: '  ' });
  app.disable('x-powered-by');

  // Load the library data
  libraries.set(app);

  // Set all the relevant headers for the app
  app.use(function (req, res, next) {
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

  // Always compress whatever we return
  app.use(compress());

  // Serve public folder
  app.use(express.static(path.join(__dirname, '..', 'public'), {
    maxAge: 7200 * 1000
  }));

  // Generate breadcrumb information
  app.use(function (req, res, next) {
    res.breadcrumbList = breadcrumbs(req);
    next();
  });

  // Home page
  app.get('/', function (req, res) {
    if (req.query.q) res.redirect(301, '/#q=' + req.query.q);

    var template = templating.templates.home;
    if (!cache.check(req, res, 2, template.lastModified)) {
      push.defaultAssets(res);
      push.server(res, '/img/algolia.svg');

      res.send(templating.getPage({
        reqUrl: req.url,
        page: {
          template: template.content,
          data: {
            libCount: Object.keys(app.get('LIBRARIES_MAP')).length,
            libVerCount: app.get('LIBRARIES_VERSIONS'),
            breadcrumbList: res.breadcrumbList
          }
        },
        wrapperClass: 'home'
      }));
    }
  });

  // About page
  app.get('/about', function (req, res) {
    var template = templating.templates.about;
    if (!cache.check(req, res, 72, template.lastModified)) {
      res.send(templating.getPage({
        reqUrl: req.url,
        title: 'about - ' + constants.TITLE,
        page: {
          template: template.content,
          data: {
            breadcrumbList: res.breadcrumbList
          }
        }
      }));
    }
  });

  // API page
  app.get('/api', function (req, res) {
    var template = templating.templates.api;
    if (!cache.check(req, res, 72, template.lastModified)) {
      res.send(templating.getPage({
        reqUrl: req.url,
        title: 'API - ' + constants.TITLE,
        page: {
          template: template.content,
          data: {
            breadcrumbList: res.breadcrumbList
          }
        }
      }));
    }
  });

  // Lib request redirect
  app.get('/request-new-lib', function (req, res) {
    return res.redirect(302, constants.REQUEST);
  });

  // CDN request redirect
  app.get('/cdnjs.cloudflare.com/*', function (req, res) {
    return res.redirect(301, 'https:/' + req.url);
  });

  // Library tutorials
  app.get('/libraries/:library/tutorials', function (req, res) {
    var library = req.params.library;
    var srcpath = path.resolve(__dirname, 'tutorials', library);
    var directories = getDirectories(srcpath);
    var tutorialPackages = _.map(directories, function (tutorial) {
      var tutorialPackage = JSON.parse(fs.readFileSync(path.resolve(srcpath, tutorial, 'tutorial.json'), 'utf8'));
      tutorialPackage.slug = tutorial;
      return tutorialPackage;
    });

    var template = templating.templates.tutorials;
    if (!cache.check(req, res, 72, template.lastModified)) {
      res.send(templating.getPage({
        reqUrl: req.url,
        title: library + ' tutorials - ' + constants.TITLE,
        page: {
          template: template.content,
          data: {
            tutorials: tutorialPackages,
            library: library,
            breadcrumbList: res.breadcrumbList
          }
        }
      }));
    }
  });

  // Library tutorial
  app.get('/libraries/:library/tutorials/:tutorial', function (req, res) {
    var library = req.params.library;
    var tutorial = req.params.tutorial;
    var srcpath = path.resolve(__dirname, 'tutorials', library);
    var indexPath = path.resolve(srcpath, tutorial, 'index.md');

    if (!fs.existsSync(indexPath)) {
      return res.status(404).send(templating.getPage({
        reqUrl: req.url,
        title: '404: Tutorial Not Found - ' + constants.TITLE,
        page: {
          template: templating.templates.notfound.content
        }
      }));
    }

    var tutorialFile = fs.readFileSync(indexPath, 'utf8');
    var directories = getDirectories(srcpath);
    var tutorialPackages = _.map(directories, function (tutorial) {
      var tutorialPackage = JSON.parse(fs.readFileSync(path.resolve(srcpath, tutorial, 'tutorial.json'), 'utf8'));
      tutorialPackage.slug = tutorial;
      return tutorialPackage;
    });

    var tutorialPackage = JSON.parse(fs.readFileSync(path.resolve(srcpath, tutorial, 'tutorial.json'), 'utf8'));
    var avatar = gravatar.url(tutorialPackage.author.email, { s: '200', r: 'pg', d: '404' });

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
    });

    var template = templating.templates.tutorial;
    if (!cache.check(req, res, 72, template.lastModified)) {
      res.send(templating.getPage({
        reqUrl: req.url,
        title: tutorialPackage.name + ' - ' + library + ' tutorials - cdnjs.com',
        page: {
          template: template.content,
          data: {
            tute: marked(tutorialFile),
            avatar: avatar,
            tutorial: tutorialPackage,
            disqus_shortname: tutorialPackage.disqus_shortname || 'cdnjstutorials',
            disqus_url: tutorialPackage.disqus_url || ('https://cdnjs.com/' + req.originalUrl),
            disqus_id: tutorialPackage.disqus_url || req.originalUrl,
            author: tutorialPackage.author,
            tutorials: tutorialPackages,
            library: library,
            breadcrumbList: res.breadcrumbList
          }
        }
      }));
    }
  });

  // Library specific version
  app.get('/libraries/:library/:version', libraries.response);

  // Library
  app.get('/libraries/:library', libraries.response);

  // All libraries
  app.get('/libraries', function (req, res) {
    var template = templating.templates.libraries;
    if (!cache.check(req, res, 2, null)) {
      res.send(templating.getPage({
        reqUrl: req.url,
        title: 'libraries - ' + constants.TITLE,
        page: {
          template: template.content,
          data: {
            packages: _.toArray(app.get('LIBRARIES_MAP')),
            libCount: Object.keys(app.get('LIBRARIES_MAP')).length,
            libVerCount: app.get('LIBRARIES_VERSIONS'),
            breadcrumbList: res.breadcrumbList
          }
        }
      }));
    }
  });

  // Git stats
  app.get('/gitstats', function (req, res) {
    return res.redirect(301, '/gitstats/cdnjs');
  });

  // Git stats 2
  app.get('/git_stats', function (req, res) {
    return res.redirect(301, '/git_stats/cdnjs');
  });

  // 404 page
  app.use(function (req, res) {
    res.status(404).send(templating.getPage({
      reqUrl: req.url,
      title: '404: Page Not Found - ' + constants.TITLE,
      page: {
        template: templating.templates.notfound.content
      }
    }));
  });

  // 500 page
  app.use(function (err, req, res) {
    console.error(err.stack);
    res.status(500).send(templating.getPage({
      reqUrl: req.url,
      title: '500 error - ' + constants.TITLE,
      page: {
        template: templating.templates.error.content
      }
    }));
  });

  // START!
  app.listen(PORT, function () {
    console.log('Listening on ' + (localMode ? 'http://0.0.0.0:' : '') + PORT);
  });
};
