var _ = require("lodash");
var fs = require("fs");
var AlgoliaSearch = require("algolia-search");

// fetch all libraries from the generated public/packages.json file
var LIBRARIES = _.map(JSON.parse(fs.readFileSync('public/packages.json', 'utf8')).packages, function(library) {
  library.originalName = library.name;
  library.name = library.name.toLowerCase();
  library.objectID = library.name.replace(/\./g, '');
  if(library.filename && library.filename.substr(library.filename.length-3, library.filename.length) === 'css') {
    library.fileType = 'css';
  } else {
    library.fileType = 'js';
  }
  delete library.assets;
  return library;
});

// init algolia API client
var client = new AlgoliaSearch('DLTKH38S7L', process.env.ALGOLIA_API_KEY);

console.log('Initializing the index');
var index = client.initIndex('libraries.tmp');
index.setSettings({
  attributesToIndex: ['name', 'unordered(description)', 'keywords', 'filename'],
  customRanking: ['asc(name)'], // FIXME: having the number of downloads or something
                                //        reflecting the popularity could be cool
  attributesForFaceting: ['fileType', 'keywords']
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
