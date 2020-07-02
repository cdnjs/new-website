// Library imports
const express = require('express');
const compress = require('compression');
const path = require('path');

// Local imports
const constants = require('./constants');
const breadcrumbs = require('./utils/breadcrumbs');
const libraries = require('./utils/libraries');
const templating = require('./utils/templating');

// Routes imports
const indexRoutes = require('./routes/index');
const librariesRotes = require('./routes/libraries');

// App constants
const PORT = Number(process.env.PORT || 5500);
const args = process.argv.slice(2);

// Local mode state
let localMode = false;
if (process.env.LOCAL === 'true' || (args.length > 0 && (args[0] === '--local' || args[2] === '--local'))) {
  console.log('local mode: on, gc() and CSP headers disabled!');
  localMode = true;
} else {
  console.log('local mode: off');
}

// Garbage collection
if (!localMode && (typeof global.gc !== 'undefined')) {
  global.gc();
}

// The app
module.exports = () => {
  // Basic app configuration
  const app = express();
  app.disable('x-powered-by');

  // Load the library data
  libraries.set(app);

  // Set all the relevant headers for the app
  app.use((req, res, next) => {
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    res.setHeader('X-Frame-Options', 'deny');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    if (!localMode) {
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
  app.use((req, res, next) => {
    res.breadcrumbList = breadcrumbs(req);
    next();
  });

  // Load the routers
  app.use('/', indexRoutes);
  app.use('/libraries', librariesRotes);

  // 404 page
  app.use((req, res) => {
    res.status(404).send(templating.getPage({
      reqUrl: req.url,
      title: '404: Page Not Found - ' + constants.TITLE,
      page: {
        template: templating.templates.notfound.content
      }
    }));
  });

  // 500 page
  app.use((err, req, res) => {
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
  app.listen(PORT, () => {
    console.log('Listening on ' + (localMode ? 'http://0.0.0.0:' : '') + PORT);
  });
};
