#!/usr/bin/env node
var fs = require('fs');
var express = require('express');
var algoliasearch = require('algoliasearch');
var _ = require('lodash');
var app = express();
var args = process.argv.slice(2);
var localMode = false;
var compress = require('compression');
var bodyParser = require('body-parser');
var marked = require('marked');
var allowCrossDomain = function (req, res, next) {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  next();
};

if (process.env.LOCAL === 'true' || (args.length > 0 && (args[0] === '--local' || args[2] === '--local'))) {
  console.log('local mode: on, gc() disabled!');
  localMode = true;
} else {
  console.log('local mode: off');
}

app.disable('x-powered-by');
app.use(bodyParser());
app.use(allowCrossDomain);
app.use(compress());

function humanOutput(res, json) {
  res.header('Content-Type', 'text/html');
  var htmlOutput = '<!doctype><html>' +
      '<head><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/default.min.css" integrity="sha256-Zd1icfZ72UBmsId/mUcagrmN7IN5Qkrvh75ICHIQVTk=" crossorigin="anonymous"/></head><body>' +
      '<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/highlight.min.js" integrity="sha256-/BfiIkHlHoVihZdc6TFuj7MmJ0TWcWsMXkeDFwhi0zw=" crossorigin="anonymous"></script>' +
      '<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/languages/json.min.js" integrity="sha256-KPdGtw3AdDen/v6+9ue/V3m+9C2lpNiuirroLsHrJZM=" crossorigin="anonymous" defer></script>' +
      '<script src="https://cdnjs.cloudflare.com/ajax/libs/json2/20160511/json2.min.js" integrity="sha256-Fsw5X9ZUnlJb302irkG8pKCRwerGfxSArAw22uG/QkQ=" crossorigin="anonymous"></script>' +
      '<script defer>hljs.initHighlightingOnLoad();</script>' +
      '<script defer>var output=' + JSON.stringify(json) + '; ' +
      'document.write("<pre><code class=\'json\'>" + JSON.stringify(output,null,2) + "</code></pre>");</script>' +
      '<script defer>console.log("%cThanks for using cdnjs! 😊", "font: 5em roboto; color: #e95420;");</script>' +
      '</body></html>';
  res.write(htmlOutput);
  res.end();
  htmlOutput = null;
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeFields(unsafe) {
  return _.map(unsafe, escapeHtml);
}

var packages = JSON.parse(fs.readFileSync('public/packages.min.json', 'utf8')).packages;

// build an indexed version of the packages (speed up lookup)
var packagesByName = {};
_.each(packages, function (library) {
  packagesByName[library.name] = library;
});

packages = null;
var algoliaIndex = algoliasearch('2QWLVLXZB6', 'e16bd99a5c7a8fccae13ad40762eec3c').initIndex('libraries');

if (!localMode && (typeof global.gc !== 'undefined')) {
  global.gc();
}

app.get('/libraries', function (req, res) {
  app.set('json spaces', 0);

  // format the results including optional `fields`
  function formatResults(fields, hits) {
    return _.map(hits, function (library) {
      var data = {
        name: library.name,
        latest: 'https://cdnjs.cloudflare.com/ajax/libs/' + library.name + '/' + library.version + '/' + library.filename
      };

      _.each(fields, function (field) {
        data[field] = library[field] || null;
      });

      return data;
    });
  }

  res.setHeader('Expires', new Date(Date.now() + 360 * 60 * 1000).toUTCString());
  var fields = safeFields((req.query.fields && req.query.fields.split(',')) || []);
  var allhits = [];
  new Promise(function (resolve, reject) {
    var browser = algoliaIndex.browseAll(req.query.search || '', { typoTolerance: 'min' });
    browser.on('result', function (content) {
      allhits = allhits.concat(content.hits);
    });
    browser.on('error', function (error) {
      reject(error);
    });
    browser.on('end', function () {
      resolve();
    });
  }).then(function () {
    var json = {
      results: formatResults(fields, allhits),
      total: allhits.length
    };
    if (req.query.output && req.query.output === 'human') {
      humanOutput(res, json);
    } else {
      res.jsonp(json);
    }
  }).catch(function (error) {
    res.status(500).send(error.message);
  });
});

app.get('/libraries/:library', function (req, res) {
  var results;
  var fields = safeFields((req.query.fields && req.query.fields.split(',')) || []);
  var ret = {};

  app.set('json spaces', 0);

  res.setHeader('Expires', new Date(Date.now() + 360 * 60 * 1000).toUTCString());
  results = _.filter(packagesByName, function (library) {
    if (library.name === req.params.library) {
      return library;
    }

    return false;
  });

  if (fields.length > 0 && results.length > 0) {
    _.each(fields, function (field) {
      ret[field] = results[0][field] || null;
    });

    if (fields.indexOf('sri') > -1) {
      try {
        ret.sri = JSON.parse(fs.readFileSync('sri/' + req.params.library + '/' + results[0].version + '.json'))[results[0].filename];
      } catch (err) {
        ret.sri = null;
      }
    }
    if (fields.indexOf('assets') > -1) {
      _.each(ret.assets, function (asset) {
        try {
          asset.sri = JSON.parse(fs.readFileSync('sri/' + req.params.library + '/' + asset.version + '.json'));
        } catch (e) {
          asset.sri = {};
        }
      })
    }

    results[0] = ret;
  } else if (!fields && results.length > 0) {
    try {
      results[0].sri = JSON.parse(fs.readFileSync('sri/' + req.params.library + '/' + results[0].version + '.json'))[results[0].filename];
    } catch (err) {
      results[0].sri = null;
    }
    _.each(results[0].assets, function (asset) {
      try {
        asset.sri = JSON.parse(fs.readFileSync('sri/' + req.params.library + '/' + asset.version + '.json'));
      } catch (e) {
        asset.sri = {};
      }
    })
  }

  if (results.length > 0) {
    if (req.query.output && req.query.output === 'human') {
      humanOutput(res, results[0]);
    } else {
      res.jsonp(results[0]);
    }
  } else {
    res.jsonp({});
  }
});

app.get('/libraries/:library/tutorials', function (req, res) {
  var results = [], ret = {};
  var fields = safeFields((req.query.fields && req.query.fields.split(',')) || []);

  app.set('json spaces', 0);
  res.setHeader('Expires', new Date(Date.now() + 360 * 60 * 1000).toUTCString());

  try {
    results = fs.readdirSync('tutorials/' + req.params.library);
  } catch (e) {
    // If no tutorials, this will error and results will be an empty array
  }

  _.each(results, function (tutorial) {
    try {
      fs.readFileSync('tutorials/' + req.params.library + '/' + tutorial + '/index.md', 'utf8');
      var data = JSON.parse(fs.readFileSync('tutorials/' + req.params.library + '/' + tutorial + '/tutorial.json', 'utf8'));

      if (fields.length > 0) {
        var retData = {};
        _.each(fields, function (field) {
          retData[field] = data[field] || null;
        });
        ret[tutorial] = retData;
      } else {
        ret[tutorial] = data;
      }
    } catch (e) {
      // If index.md or tutorial.json doesn't exist (or not valid), just skip this result
    }
  });

  if (req.query.output && req.query.output === 'human') {
    humanOutput(res, ret);
  } else {
    res.jsonp(ret);
  }
});

app.get('/libraries/:library/tutorials/:tutorial', function (req, res) {
  var results = {};
  var fields = safeFields((req.query.fields && req.query.fields.split(',')) || []);

  app.set('json spaces', 0);
  res.setHeader('Expires', new Date(Date.now() + 360 * 60 * 1000).toUTCString());

  try {
    var data = JSON.parse(fs.readFileSync('tutorials/' + req.params.library + '/' + req.params.tutorial + '/tutorial.json', 'utf8'));
    var raw = fs.readFileSync('tutorials/' + req.params.library + '/' + req.params.tutorial + '/index.md', 'utf8');

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
    data.markdown = raw;
    data.html = marked(raw);

    if (fields.length > 0) {
      _.each(fields, function (field) {
        results[field] = data[field] || null;
      });
    } else {
      results = data;
    }

    if (req.query.output && req.query.output === 'human') {
      humanOutput(res, results);
    } else {
      res.jsonp(results);
    }
  } catch (e) {
    // If index.md or tutorial.json doesn't exist (or not valid), just return nothing
    res.jsonp({});
  }
});

app.get('/', function (req, res) {
  res.redirect('https://cdnjs.com/api');
});

var PORT = process.env.PORT || 5050;

app.listen(PORT, function () {
  console.log('Listening on ' + PORT);
});
