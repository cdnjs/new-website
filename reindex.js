#!/usr/bin/env node

var _ = require("lodash");
var fs = require("fs");
var AlgoliaSearch = require("algolia-search");
var GitHubApi = require("github");
var async = require("async");


/*
 * This script is in charge of the libraries indexing
 * It makes an intensive use of the `async` library to ease the asynchronous processing.
 *
 * Here is how it works:
 *  - fetch the libraries from public/packages.min.json
 *  - retrieve various infos from GitHub (number of stars, etc..)
 *    - authenticate with a public token
 *    - for each library
 *      - try to find a github.com URL in the library's configuration
 *      - fetch the associated repository stats
 *      - enrich the library with various infos
 *  - push the libraries to Algolia
 *    - init+configure a temporary index
 *    - push libraries to the temporary index
 *    - move the temporary index to the production index (atomic)
 *
*/

//////
////// Fetch all libraries from the generated public/packages.min.json file
//////
var LIBRARIES = [];
function load(next) {
  console.log('* Loading libraries');
  LIBRARIES = _.map(JSON.parse(fs.readFileSync('public/packages.min.json', 'utf8')).packages, function(library) {
    library.originalName = library.name;
    library.name = library.name.toLowerCase();
    library.objectID = library.name.replace(/\./g, '');
    // add some alternative name forms to improve the search relevance
    library.alternativeNames = [
      library.name.split(/[^a-zA-Z]/).join(''),         // font-awesome <=> fontawesome
      library.name.replace(/([a-z](?=[A-Z]))/g, '$1 ')  // camelCase <=> camel case
    ];
    if(library.filename && library.filename.substr(library.filename.length-3, library.filename.length) === 'css') {
      library.fileType = 'css';
    } else {
      library.fileType = 'js';
    }
    delete library.assets;
    return library;
  });
  next();
}

//////
////// Enrich libraries with GitHub stats
//////
var github = new GitHubApi({ version: "3.0.0" });

function authenticate(next) {
  github.authenticate({
    type: "oauth",
    token: process.env.GITHUB_OAUTH_TOKEN // scope=public_repos only (not secret)
  });
  next();
}

function crawl(gnext) {
  console.log('* Enriching libraries with GitHub');
  async.each(LIBRARIES, function(library, next) {
    var urls = [];
    // collect all repository urls
    if (library.repositories && _.isArray(library.repositories)) {
      for (var i = 0; i < library.repositories.length; ++i) {
        urls.push(library.repositories[i].url);
      }
    }
    if (library.repository) {
      if (_.isObject(library.repository)) {
        urls.push(library.repository.url);
      } else if (_.isString(library.repository)) {
        urls.push(library.repository);
      }
    }
    // for each collected URL, try to find the associated github repo
    var repos = _.compact(_.map(urls, function(url) {
      if (!url || !_.isString(url)) {
        return null;
      }
      var m = url.match(/.*github\.com\/([^\/]+)\/([^\/]+)(\/.*|\.git)?$/);
      if (!m) {
        return null;
      }
      return { user: m[1], repo: m[2].replace(/.git$/, '') };
    }));

    if (repos.length > 0) {
      var repo = repos[0]; // fetch only the first repository
      github.repos.get(repo, function(err, res) {
        if (!err) {
          // enchrich the library
          console.log('** Enrich ' + repo.user + '/' + repo.repo);
          library.github = {
            user: repo.user,
            repo: repo.repo,
            stargazers_count: res.stargazers_count,
            watchers_count: res.watchers_count,
            forks: res.forks,
            open_issues_count: res.open_issues_count,
            subscribers_count: res.subscribers_count
          }
        }
        next();
      });
    } else {
      next();
    }
  }, gnext);
}

//////
////// Push libraries to Algolia for the indexing
//////
var client = new AlgoliaSearch('2QWLVLXZB6', process.env.ALGOLIA_API_KEY);
var index = client.initIndex('libraries.tmp');

function initIndex(next) {
  console.log('* Initializing the index');
  index.setSettings({
    attributesToIndex: ['unordered(name)', 'unordered(alternativeNames)', 'unordered(description)', 'unordered(keywords)', 'unordered(filename)'],
    customRanking: [ 'desc(github.stargazers_count)', 'asc(name)' ],
    attributesForFaceting: ['fileType', 'keywords'],
    optionalWords: ['js', 'css'], // those words are optional (jquery.colorbox.js <=> jquery.colorbox)
    ranking: ['typo', 'words', 'proximity', 'attribute', 'custom'] // removed the "exact" criteria conflicting with the "keywords" array containing exact forms
  }, function(error, content) {
    next();
  });
}

function push(next) {
  console.log('* Indexing ' + LIBRARIES.length + ' libraries');
  index.addObjects(LIBRARIES, function(error, content) {
    next();
  });
}

function commit(next) {
  console.log('* Moving index to production');
  client.moveIndex('libraries.tmp', 'libraries', function(error, content) {
    next();
  });
}

//////
////// Orchestrate it!
//////
async.series([
  load,
  authenticate,
  crawl,
  initIndex,
  push,
  commit
], function(err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});
