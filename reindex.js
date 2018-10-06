#!/usr/bin/env node

var _ = require('lodash');
var fs = require('fs');
var algoliasearch = require('algoliasearch');
var GitHubApi = require('github');
var async = require('async');
var colors = require('colors');
var metas = Object();

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

// ////
// //// Fetch all libraries from the generated public/packages.min.json file
// ////
var LIBRARIES = [];
function load(next) {
  console.log('* Loading GitHub repositories meta data');
  metas = JSON.parse(fs.readFileSync('GitHub.repos.meta.json', 'utf8'));
  console.log('* Loading libraries');
  LIBRARIES = _.map(JSON.parse(fs.readFileSync('public/packages.min.json', 'utf8')).packages, function (library) {
    delete library.assets;
    delete library.autoupdate;
    library.originalName = library.name;
    library.objectID = library.name;

    // add some alternative name forms to improve the search relevance
    library.alternativeNames = [
      library.name.split(/[^a-zA-Z]/).join(''),         // font-awesome <=> fontawesome
      library.name.replace(/([a-z](?=[A-Z]))/g, '$1 ')  // camelCase <=> camel case
    ];
    if (!library.filename) {
      console.log('No filename field in ' + library.name + ': ' + library.filename);
    }

    if (library.filename) {
      library.fileType = library.filename.split('.').pop();
    }

    var SRI;
      try {
        json = JSON.parse(fs.readFileSync('sri/' + library.name + '/' + library.version + '.json', "utf8"));
        SRI = json[library.filename];
      } catch (e) {
        SRI = "";
      }
    library.sri = SRI;

    return library;
  });

  next();
}

// ////
// //// Enrich libraries with GitHub stats
// ////
var github = new GitHubApi({ version: '3.0.0' });

function authenticate(next) {
  github.authenticate({
    type: 'oauth',
    token: process.env.GITHUB_OAUTH_TOKEN // scope=public_repos only (not secret)
  });
  next();
}

function crawl(gnext) {
  console.log('* Enriching libraries with GitHub');
  async.eachLimit(LIBRARIES, 16, function (library, next) {
    var urls = [];

    // collect all repository urls
    if (library.repository) {
      if (_.isObject(library.repository)) {
        urls.push(library.repository.url);
      } else if (_.isString(library.repository)) {
        urls.push(library.repository);
      }
    }

    // for each collected URL, try to find the associated github repo
    var repos = _.compact(_.map(urls, function (url) {
      if (!url || !_.isString(url)) {
        return null;
      }

      var m = url.match(/.*github\.com[\/:]([^\/]+)\/([^\/]+)(\/.*|\.git)?$/);
      if (!m) {
        return null;
      }

      return { owner: m[1], repo: m[2].replace(/.git$/, '') };
    }));

    if (repos.length > 0) {
      var repo = repos[0]; // fetch only the first repository
      if (metas[repo.owner + '/' + repo.repo] === undefined) {
        github.repos.get(repo, function (err, res) {
          if (!err && res.data.stargazers_count === undefined) {
            err = "Didn't fetch the meta data properly!!!";
          }

          if (err) {
            console.log(colors.yellow('Got a problem on ' + repo.owner + '/' + repo.repo + '(' + library.name + ') !!!'));
            console.log(colors.red(err));
          } else {
            // enchrich the library
            console.log('** Enrich ' + repo.owner + '/' + repo.repo + ', ' + res.data.stargazers_count + ' star(s) ...');
            library.github = {
              user: repo.owner,
              repo: repo.repo,
              stargazers_count: res.data.stargazers_count,
              forks: res.data.forks,
              subscribers_count: res.data.watchers_count
            };
            metas[repo.owner + '/' + repo.repo] = library.github;
          }

          async.setImmediate(function () {
            next();
          });
        });
      } else {
        library.github = metas[repo.owner + '/' + repo.repo];
        async.setImmediate(function () {
          next();
        });
      }
    } else {
      async.setImmediate(function () {
        next();
      });
    }
  }, gnext);
}

// ////
// //// Push libraries to Algolia for the indexing
// ////
var client = algoliasearch('2QWLVLXZB6', process.env.ALGOLIA_API_KEY, {
  timeout: 20000
});
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
    customRanking: ['desc(github.stargazers_count)', 'asc(name)'],
    attributesForFaceting: ['fileType', 'keywords'],
    optionalWords: ['js', 'css'], // those words are optional (jquery.colorbox.js <=> jquery.colorbox)
    ranking: ['typo', 'words', 'proximity', 'attribute', 'custom'] // removed the "exact" criteria conflicting with the "keywords" array containing exact forms
  }, function (error, content) {
    if (error) {
      printError(error);
      return;
    } else {
      next();
    }
  });
}

function push(next) {
  console.log('* Indexing ' + LIBRARIES.length + ' libraries');
  index.addObjects(LIBRARIES, function (error, content) {
    if (error) {
      printError(error);
      return;
    } else {
      next();
    }
  });
}

function commit(next) {
  console.log('* Moving index to production');
  client.moveIndex('libraries.tmp', 'libraries', function (error, content) {
    if (error) {
      printError(error);
      return;
    } else {
      next();
    }
  });
}

function saveMeta(next) {
  fs.writeFile('GitHub.repos.meta.json', JSON.stringify(metas, null, 2) + '\n', 'utf8', function (err) {
    if (err) throw err;
    console.log('GitHub repositories meta data saved!');
    next();
  });
}

function printError(error) {
  console.log(error.message);
  console.log(error.debugData);
}

// ////
// //// Orchestrate it!
// ////
async.series([
  load,
  authenticate,
  crawl,
  initIndex,
  push,
  commit,
  saveMeta
], function (err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});
