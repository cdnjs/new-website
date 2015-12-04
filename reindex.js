#!/usr/bin/env node

var _ = require("lodash"),
  fs = require("fs"),
  algoliasearch = require("algoliasearch"),
  GitHubApi = require("github"),
  async = require("async"),
  colors = require('colors'),
  metas = Object();


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
  console.log('* Loading GitHub repositories meta data');
  metas = JSON.parse(fs.readFileSync('GitHub.repos.meta.json', 'utf8'));
  console.log('* Loading libraries');
  LIBRARIES = _.map(JSON.parse(fs.readFileSync('public/packages.min.json', 'utf8')).packages, function(library) {
    delete library.assets;
    library.originalName = library.name;
    library.objectID = library.name.replace(/\./g, '');
    // add some alternative name forms to improve the search relevance
    library.alternativeNames = [
      library.name.split(/[^a-zA-Z]/).join(''),         // font-awesome <=> fontawesome
      library.name.replace(/([a-z](?=[A-Z]))/g, '$1 ')  // camelCase <=> camel case
    ];
    if(library.filename) {
      if(library.filename[0] == '/') {
        library.filename = library.filename.substr(1);
      }
    } else {
      console.log("No filename field in " + library.name + ": " + library.filename);
    }
    if(library.filename && library.filename.substr(library.filename.length-3, library.filename.length) === 'css') {
      library.fileType = 'css';
    } else {
      library.fileType = 'js';
    }
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
  async.eachLimit(LIBRARIES, 16, function(library, next) {
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
      var m = url.match(/.*github\.com[\/:]([^\/]+)\/([^\/]+)(\/.*|\.git)?$/);
      if (!m) {
        return null;
      }
      return { user: m[1], repo: m[2].replace(/.git$/, '') };
    }));

    if (repos.length > 0) {
      var repo = repos[0]; // fetch only the first repository
      if (metas[repo.user + '/' + repo.repo] != undefined) {
        library.github = metas[repo.user + '/' + repo.repo];
      } else {
        github.repos.get(repo, function(err, res) {
          if (!err && res.stargazers_count == undefined) {
            err = "Didn't fetch the meta data properly!!!";
          }
          if (!err) {
            // enchrich the library
            console.log('** Enrich ' + repo.user + '/' + repo.repo + ', ' + res.stargazers_count + ' star(s) ...');
            library.github = {
              user: repo.user,
              repo: repo.repo,
              stargazers_count: res.stargazers_count,
              forks: res.forks,
              subscribers_count: res.subscribers_count
            }
            metas[repo.user + '/' + repo.repo] = library.github;
          } else {
              console.log(colors.yellow('Got a problem on ' + repo.user + '/' + repo.repo + '(' + library.name + ') !!!'));
              console.log(colors.red(err));
          }
        });
      }
      next();
    } else {
      next();
    }
  }, gnext);
}

//////
////// Push libraries to Algolia for the indexing
//////
var client = algoliasearch('2QWLVLXZB6', process.env.ALGOLIA_API_KEY);
var index = client.initIndex('libraries.tmp');

function initIndex(next) {
  console.log('* Initializing the index');
  index.setSettings({
    attributesToIndex: [
      'unordered(name)',
      'unordered(alternativeNames)',
      'unordered(github.repo)',
      'unordered(description)',
      'unordered(keywords)',
      'unordered(filename)',
      'unordered(repositories.url)',
      'unordered(github.user)',
      'unordered(maintainers.name)'
    ],
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

function saveMeta(next) {
    fs.writeFile('GitHub.repos.meta.json', JSON.stringify(metas, null, 2) + '\n', 'utf8', function(err){
      if (err) throw err;
      console.log('GitHub repositories meta data saved!');
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
  commit,
  saveMeta
], function(err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});
