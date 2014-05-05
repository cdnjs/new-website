var superagent = require('superagent');
var _ = require('lodash');
var fs = require('fs');
var http = require('http');



var packagesurl = 'https://s3.amazonaws.com/cdnjs-artifacts/packages.json?' + new Date().getTime();
superagent.get(packagesurl, function(res, textStatus, xhr){
  fs.writeFileSync('public/packages.json', JSON.stringify(res.body, null, 4), 'utf8');
  fs.writeFileSync('public/packages.min.json', JSON.stringify(res.body), 'utf8');


  // Generate sitemap

  var pages = [
    'http://cdnjs.com/',
    'http://cdnjs.com/about',
    'http://cdnjs.com/login',
    'http://cdnjs.com/register'
  ];


  var xml = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';


  var librariePages = _.map(res.body.packages, function (package) {
    return 'http://cdnjs.com/libraries/' + package.name;
  });


  pages = pages.concat(librariePages);

  _.each(pages, function(page){
    xml += '<url><loc>' + page + '</loc></url>';
  });


  xml += '</urlset>';

  fs.writeFileSync('public/sitemap.xml', xml, 'utf8');



});



// I was rushing below r0fl
var file = fs.createWriteStream("public/rss.xml");
var request = http.get("http://s3.amazonaws.com/cdnjs-artifacts/rss", function(response) {
  response.pipe(file);
});

var file2 = fs.createWriteStream("public/atom.xml");
var request2 = http.get("http://s3.amazonaws.com/cdnjs-artifacts/rss", function(response) {
  response.pipe(file2);
});
