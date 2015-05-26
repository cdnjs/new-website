#!/usr/bin/env node
require('newrelic');
var fs = require('fs');
var express = require('express');
var _ = require('lodash');
var app = express();

var compress = require('compression');
var bodyParser = require('body-parser');
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  next();
}
app.use(bodyParser());
app.use(allowCrossDomain);
app.use(compress())

var packages = JSON.parse(fs.readFileSync('public/packages.min.json', 'utf8')).packages;


app.get('/libraries', function(req, res){
  var results;

  res.setHeader("Expires", new Date(Date.now() + 360 * 60 * 1000).toUTCString());
  console.log(req.query);
  var fields = (req.query.fields && req.query.fields.split(',')) || [];
  if(req.query.search) {
    var search = req.query.search;
    results = _.filter(packages, function (package) {
      console.log(package.name.toLowerCase(), search.toLowerCase())
      return package.name.toLowerCase().indexOf(search.toLowerCase()) === -1 ? false : true;
    });
  } else {
    results = _.filter(packages, function(package) {return package});
  }
  results = _.map(results, function (package) {
    var data = {
      name: package.name,
      latest: 'http://cdnjs.cloudflare.com/ajax/libs/' + package.name + '/' + package.version + '/' + package.filename
    };

    _.each(fields, function(field){
      data[field] = package[field] || null;
    });
    return data;
  });
  res.jsonp({
    results: results,
    total: results.length
  });
});
app.get('/libraries/:library', function(req, res){
  var results;

  res.setHeader("Expires", new Date(Date.now() + 360 * 60 * 1000).toUTCString());
  results = _.filter(packages, function(package) {
    if(package.name===req.params.library){
      return package
    } else {
      return false;
    }
  });
  console.log(results);
  if(results.length > 0 ) {
  res.jsonp(results[0]);
} else { res.jsonp({})}
});
var port = process.env.PORT || 5050;

app.listen(port);
