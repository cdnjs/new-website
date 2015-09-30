#!/usr/bin/env node
var _    = require('lodash'),
  fs   = require('fs'),
  http = require('http'),

  pkgMeta = JSON.parse(fs.readFileSync('public/packages.min.json', 'utf8')).packages,

// Generate sitemap
  pages = [
  'http://cdnjs.com/',
  'http://cdnjs.com/about',
  'http://cdnjs.com/login',
  'http://cdnjs.com/register'
];

var xml = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

var librariePages = _.map(pkgMeta, function (package) {
  return 'http://cdnjs.com/libraries/' + package.name;
});

pages = pages.concat(librariePages);

var librarieNewsPages = _.map(pkgMeta, function (package) {
  return 'http://cdnjs.com/libraries/' + package.name + '/news';
});

pages = pages.concat(librarieNewsPages);

_.each(pages, function(page){
  xml += '<url><loc>' + page + '</loc></url>';
});

xml += '</urlset>';

fs.writeFileSync('public/sitemap.xml', xml, 'utf8');
