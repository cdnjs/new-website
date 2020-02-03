// Library imports
const router = require('express').Router();
const gravatar = require('gravatar');
const fs = require('fs');
const marked = require('marked');
const path = require('path');

// Local imports
const constants = require('../constants');
const libraries = require('../utils/libraries');
const templating = require('../utils/templating');
const getDirectories = require('../utils/getDirectories');
const cache = require('../utils/cache');

// Library tutorial
router.get('/:library/tutorials/:tutorial', (req, res) => {
  const template = templating.templates.tutorial;
  if (cache.check(req, res, 72, template.lastModified)) return;

  const library = req.params.library;
  const tutorial = req.params.tutorial;
  const src = path.resolve(__dirname, '..', '..', 'tutorials', library);
  const indexPath = path.resolve(src, tutorial, 'index.md');

  if (!fs.existsSync(indexPath)) {
    return res.status(404).send(templating.getPage({
      reqUrl: req.url,
      title: '404: Tutorial Not Found - ' + constants.TITLE,
      page: {
        template: templating.templates.notfound.content
      }
    }));
  }

  const tutorialFile = fs.readFileSync(indexPath, 'utf8');
  const directories = getDirectories(src);
  const tutorialPackages = directories.map(tutorial => {
    const tutorialPackage = JSON.parse(fs.readFileSync(path.resolve(src, tutorial, 'tutorial.json'), 'utf8'));
    tutorialPackage.slug = tutorial;
    return tutorialPackage;
  });

  const tutorialPackage = JSON.parse(fs.readFileSync(path.resolve(src, tutorial, 'tutorial.json'), 'utf8'));
  const avatar = gravatar.url(tutorialPackage.author.email, { s: '200', r: 'pg', d: '404' });

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
});

// Library tutorials
router.get('/:library/tutorials', (req, res) => {
  const template = templating.templates.tutorials;
  if (cache.check(req, res, 72, template.lastModified)) return;

  const library = req.params.library;
  const src = path.resolve(__dirname, '..', '..', 'tutorials', library);
  const directories = getDirectories(src);
  const tutorialPackages = directories.map(tutorial => {
    const tutorialPackage = JSON.parse(fs.readFileSync(path.resolve(src, tutorial, 'tutorial.json'), 'utf8'));
    tutorialPackage.slug = tutorial;
    return tutorialPackage;
  });

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
});

// Library specific version
router.get('/:library/:version', libraries.response);

// Library
router.get('/:library', libraries.response);

// All libraries
router.get('/', (req, res) => {
  if (cache.check(req, res, 2, null)) return;

  const template = templating.templates.libraries;
  res.send(templating.getPage({
    reqUrl: req.url,
    title: 'libraries - ' + constants.TITLE,
    page: {
      template: template.content,
      data: {
        packages: Object.values(req.app.get('LIBRARIES_MAP')),
        libCount: Object.keys(req.app.get('LIBRARIES_MAP')).length,
        libVerCount: req.app.get('LIBRARIES_VERSIONS'),
        breadcrumbList: res.breadcrumbList
      }
    }
  }));
});

module.exports = router;
