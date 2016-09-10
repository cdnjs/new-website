#!/usr/bin/env node
require('newrelic');
var fs = require('fs'),
  express = require('express'),
  algoliasearch = require("algoliasearch")
  _ = require('lodash'),
  app = express(),
  args = process.argv.slice(2),
  localMode = false,

  compress = require('compression'),
  bodyParser = require('body-parser'),
  allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  next();
}

if (args.length > 0 && (args[0] == '--local' || args[2] == '--local') ) {
  console.log("local mode: on, gc() disabled!");
  localMode = true;
} else {
  console.log("local mode: off");
}

app.use(bodyParser());
app.use(allowCrossDomain);
app.use(compress())

function humanOutput(res, json) {
  res.header('Content-Type', 'text/html');
  res.write('<!doctype><html>');
  res.write('<head><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.1.0/styles/default.min.css" integrity="sha256-WfR+t4V9jUEtco303JmeVqRbf/++XunklhaJkoTp8u0=" crossorigin="anonymous"/></head>');
  res.write('<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.1.0/highlight.min.js" integrity="sha256-fkOAs5tViC8MpG+5VCOqdlSpLL8htz4mdL2VZlWGoMA=" crossorigin="anonymous"></script>')
  res.write('<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.1.0/languages/json.min.js" integrity="sha256-D0YfZN5nP+2bF+7odQ7OaQcJXqMhax4a4sOYrZPf32k=" crossorigin="anonymous" defer></script>')
  res.write('<script defer>hljs.initHighlightingOnLoad();</script>');
  res.write('<pre><code class="json">');
  res.write(JSON.stringify(json, null, 2));
  res.write('</code></pre></body></html>');
  res.end();
}

var packages = JSON.parse(fs.readFileSync('public/packages.min.json', 'utf8')).packages;
// build an indexed version of the packages (speed up lookup)
var packagesByName = {};
_.each(packages, function(package) {
  packagesByName[package.name] = package;
});
delete packages;
var algoliaIndex = algoliasearch('2QWLVLXZB6', '2663c73014d2e4d6d1778cc8ad9fd010').initIndex('libraries');

if (!localMode && (typeof global.gc != 'undefined')) {
  global.gc();
}

app.get('/libraries', function(req, res){
  var results;

  app.set('json spaces', 0);

  // format the results including optional `fields`
  function formatResults(fields, packagesByName) {
    return _.map(packagesByName, function (package) {
      var data = {
        name: package.name,
        latest: 'https://cdnjs.cloudflare.com/ajax/libs/' + package.name + '/' + package.version + '/' + package.filename
      };
      _.each(fields, function(field){
        data[field] = package[field] || null;
      });
      return data;
    });
  }

  res.setHeader("Expires", new Date(Date.now() + 360 * 60 * 1000).toUTCString());
  var fields = (req.query.fields && req.query.fields.split(',')) || [];
  if (req.query.search) {
    var searchParams = {
      typoTolerance: 'min', // only keep the minimum typos
      hitsPerPage: 1000 // maximum
    };
    algoliaIndex.search(req.query.search, searchParams, function(error, content) {
      if (error) {
        res.status(500).send(error.message);
        return;
      }
      // fetch the orignal version of the package based on the search hit
      results = _.map(content.hits, function(hit) { return packagesByName[hit.originalName] || hit; });
      var json = {
          results: formatResults(fields, results),
          total: content.hits.length
      };
      if (req.query.output && req.query.output === 'human') {
        humanOutput(res, json);
      } else {
        res.jsonp(json);
      }
    });
  } else {
    results = formatResults(fields, packagesByName);
    var json = {
      results: results,
      total: results.length
    };
    if (req.query.output && req.query.output === 'human') {
      humanOutput(res, json);
    } else {
      res.jsonp(json);
    }
  }
});
app.get('/libraries/:library', function(req, res){
  var results;

  app.set('json spaces', 0);

  res.setHeader("Expires", new Date(Date.now() + 360 * 60 * 1000).toUTCString());
  results = _.filter(packagesByName, function(package) {
    if (package.name === req.params.library) {
      return package
    }
    return false;
  });
  if(results.length > 0 ) {
    if(req.query.output && req.query.output === 'human') {
      humanOutput(res, results[0]);
    } else {
      res.jsonp(results[0]);
    }
} else { res.jsonp({})}
});

app.get('/', function(req, res){
  res.redirect('https://github.com/cdnjs/cdnjs#api');
});

var port = process.env.PORT || 5050;

app.listen(port);
