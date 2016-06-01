const fs = require('fs');
const path = require('path');
const Mustache = require("mustache");
const condenseWhitespace = require('condense-whitespace');
const removeNewline = require('newline-remove');

// move to config
const TITLE = 'cdnjs.com - The free and open source CDN for web related libraries to speed up your website!';

const getTemplate = (templateURL, simple) => {
  const template = fs.readFileSync(path.join(__dirname, '..', templateURL), 'utf8');
  return simple ? template : removeNewline(condenseWhitespace(template));
};

// Templates
const templates = {
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
};

const generatePage = (options) => {
  const layout = options.layout || templates.layout;
  const title = options.title || TITLE;
  const description = options.page && options.page.description || 'The free and open source CDN for all web libraries. Speed up your websites and save bandwidth!';

  const page = {
    data: options.page && options.page.data || {},
    template: options.page && options.page.template || 'No content',
  };
  const pageContent = Mustache.render(page.template, page.data);

  const fullContent = Mustache.render(layout, {
    title,
    description,
    page: pageContent,
    wrapperClass: options.wrapperClass || '',
  });

  return fullContent;
};

module.exports = {
  templates,
  generatePage,
};
