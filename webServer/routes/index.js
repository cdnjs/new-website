// Library imports
const router = require('express').Router();

// Local imports
const constants = require('../constants');
const templating = require('../utils/templating');
const cache = require('../utils/cache');
const push = require('../utils/push');

// Home page
router.get('/', (req, res) => {
  if (req.query.q) res.redirect(301, '/#q=' + req.query.q);

  const template = templating.templates.home;
  if (cache.check(req, res, 2, template.lastModified)) return;

  push.defaultAssets(res);
  push.server(res, '/img/algolia.svg');
  res.send(templating.getPage({
    reqUrl: req.url,
    page: {
      template: template.content,
      data: {
        libCount: Object.keys(req.app.get('LIBRARIES_MAP')).length,
        libVerCount: req.app.get('LIBRARIES_VERSIONS'),
        breadcrumbList: res.breadcrumbList
      }
    },
    wrapperClass: 'home'
  }));
});

// About page
router.get('/about', (req, res) => {
  const template = templating.templates.about;
  if (cache.check(req, res, 72, template.lastModified)) return;

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
});

// API page
router.get('/api', (req, res) => {
  const template = templating.templates.api;
  if (cache.check(req, res, 72, template.lastModified)) return;

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
});

// Lib request redirect
router.get('/request-new-lib', (req, res) => {
  return res.redirect(302, constants.REQUEST);
});

// CDN request redirect
router.get('/cdnjs.cloudflare.com/*', (req, res) => {
  return res.redirect(301, 'https:/' + req.url);
});

// Git stats
router.get('/gitstats', (req, res) => {
  return res.redirect(301, '/gitstats/cdnjs');
});

// Git stats 2
router.get('/git_stats', (req, res) => {
  return res.redirect(301, '/git_stats/cdnjs');
});

module.exports = router;
