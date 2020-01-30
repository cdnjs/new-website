// Library imports
const path = require('path');
const fs = require('fs');
const removeNewline = require('newline-remove');
const condenseWhitespace = require('condense-whitespace');
const Mustache = require('mustache');

// Local imports
const constants = require('../constants');

// Get a template file
const getTemplate = (templateName, simple) => {
  const templateURL = path.join(__dirname, '..', '..', 'templates', templateName);
  const stats = fs.statSync(templateURL);
  const mtime = stats.mtime;
  if (simple === true) {
    return {
      content: fs.readFileSync(templateURL, 'utf8'),
      lastModified: mtime
    };
  }
  return {
    content: removeNewline(condenseWhitespace(fs.readFileSync(templateURL, 'utf8'))),
    lastModified: mtime
  };
};

// All the templates in the app
const templates = {
  layout: getTemplate('layout.html'),
  breadcrumbs: getTemplate('breadcrumbs.html'),
  home: getTemplate('home.html'),
  libraries: getTemplate('libraries.html'),
  library: getTemplate('library.html'),
  about: getTemplate('about.html'),
  tutorials: getTemplate('tutorials.html', true),
  tutorial: getTemplate('tutorial.html', true),
  api: getTemplate('api.html', true),
  notfound: getTemplate('404.html', true),
  error: getTemplate('500.html', true)
};

// Generate a rendered page
const getPage = options => {
  // Generate page data
  const layout = (options.layout || templates.layout).content;
  const title = options.title || constants.TITLE;
  const keywords = options.page.data && options.page.data.library && options.page.data.library.keywords
    || constants.KEYWORDS;
  const description = (options.page && options.page.description) ? options.page.description + ' - ' + constants.TITLE
    : constants.TITLE;
  const page = {
    data: options.page && options.page.data || {},
    template: options.page && options.page.template || 'No content'
  };

  // Generate breadcrumbs if possible
  if ('breadcrumbList' in page.data) page.data.breadcrumbs = Mustache.render(templates.breadcrumbs.content, page.data);

  // Render the page
  return Mustache.render(layout, {
    url: options.reqUrl,
    title: title,
    keywords: keywords,
    description: description,
    page: Mustache.render(page.template, page.data),
    request: constants.REQUEST,
    wrapperClass: options.wrapperClass || ''
  });
};

module.exports = { templates, getPage };
