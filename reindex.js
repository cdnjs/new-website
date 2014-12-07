var _ = require("lodash");
var fs = require("fs");
var AlgoliaSearch = require("algolia-search");

// fetch all libraries from the generated public/packages.json file
var LIBRARIES = _.map(JSON.parse(fs.readFileSync('public/packages.json', 'utf8')).packages, function(library) {
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

// init algolia API client
var client = new AlgoliaSearch('2QWLVLXZB6', process.env.ALGOLIA_API_KEY);

console.log('Initializing the index');
var index = client.initIndex('libraries.tmp');
index.setSettings({
  attributesToIndex: ['name', 'unordered(alternativeNames)', 'unordered(description)', 'keywords', 'filename'],
  customRanking: ['asc(name)'], // FIXME: having the number of downloads or something
                                //        reflecting the popularity could be cool
  attributesForFaceting: ['fileType', 'keywords'],
  optionalWords: ['js', 'css'] // those words are optional (jquery.colorbox.js <=> jquery.colorbox)
});

console.log('Indexing ' + LIBRARIES.length + ' libraries');
index.addObjects(LIBRARIES, function(error, content) {
  if (error) {
    console.log('Error:' + content.message);
    process.exit(1);
  } else {
    // atomic move to production index
    client.moveIndex('libraries.tmp', 'libraries', function(error, content) {
      process.exit(0);
    });
  }
});
