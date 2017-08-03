'use strict';

var _ = require('lodash');

var filterTypes = {
  js: 'js',
  css: 'css',
  fonts: 'ttf', // ??
  images: ['png', 'jpeg', 'jpg', 'gif']
};

module.exports = filterAssets;

/**
 * Filters out asset objects
 * @param {*object} library Full library entry
 * @param {*object} options
 */
function filterAssets(library, options) {
  if (options === undefined) {
    options = {};
  }

  var filter = options.filter === undefined ? false : options.filter;
  var latest = options.latest === undefined ? false : options.latest;

  var version = library.version;
  var assets = library.assets;
  if (latest) {
    assets = library.assets.filter(function (a) {
      return a.version === version;
    });
  }

  if (!filter) { // also matches for ''
    return assets;
  }

  // support filter = 'js,css'
  var filterExt = _.flattenDeep(filter.indexOf(',') !== -1 ? filter.split(',').map(function (f) {
    return filterTypes[f];
  }) : filterTypes[filter]);

  var map = Array.isArray(filterExt) ? function (filename) {
    return filterExt.some(function (ext) {
      return endsWith(filename, ext);
    });
  } : function (filename) {
    return endsWith(filename, filterExt);
  };

  return assets.reduce(function (acc, curr) {
    var version = curr.version;
    var files = curr.files;


    acc.push({
      version: version,
      files: files.filter(map)
    });

    return acc;
  }, []);
}

function endsWith(subjectString, searchString, position) {
  if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
    position = subjectString.length;
  }
  position -= searchString.length;
  var lastIndex = subjectString.lastIndexOf(searchString, position);
  return lastIndex !== -1 && lastIndex === position;
}
