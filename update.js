var superagent = require('superagent');
var _ = require('lodash');
var fs = require('fs');
var http = require('http');



var packagesurl = 'https://s3.amazonaws.com/cdnjs-artifacts/packages.json?' + new Date().getTime();
superagent.get(packagesurl, function(res, textStatus, xhr){
  fs.writeFileSync('public/packages.json', JSON.stringify(res.body, null, 4), 'utf8');
  fs.writeFileSync('public/packages.min.json', JSON.stringify(res.body), 'utf8');
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
