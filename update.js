#!/usr/bin/env node
var _ = require('lodash');
var fs = require('fs');
var pkgMeta = JSON.parse(fs.readFileSync('public/packages.min.json', 'utf8')).packages;

// Generate sitemap
var pages = [
  'https://cdnjs.com/',
  'https://cdnjs.com/about',
  'https://cdnjs.com/login',
  'https://cdnjs.com/register'
];

var xml = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

var librariePages = _.map(pkgMeta, function(library) {
  return 'https://cdnjs.com/libraries/' + library.name;
});

pages = pages.concat(librariePages);

var librarieNewsPages = _.map(pkgMeta, function(library) {
  return 'https://cdnjs.com/libraries/' + library.name + '/news';
});

pages = pages.concat(librarieNewsPages);

_.each(pages, function(page) {
  xml += '<url><loc>' + page + '</loc></url>';
});

xml += '</urlset>';

fs.writeFileSync('public/sitemap.xml', xml, 'utf8');
