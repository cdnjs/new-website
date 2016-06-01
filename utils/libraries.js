const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const packageFilePath = path.join(__dirname, '/../public/packages.min.json');
const packagesFile = fs.readFileSync(packageFilePath, 'utf8');
const LIBRARIES = JSON.parse(packagesFile).packages;

const LIBRARIES_MAP = {};
_.each(LIBRARIES, (library) => {
  library.originalName = library.name;
  library.id = library.name.replace(/\./g, '');
  const libName = library.filename;
  const extension = libName.substr(libName.length - 3, libName.length);
  if (library.filename && extension === 'css') {
    library.fileType = 'css';
  } else {
    library.fileType = 'js';
  }
  library.keywords = library.keywords && library.keywords.join(', ');
  LIBRARIES_MAP[library.name.replace(/\./g, '')] = library;
});

module.exports = {
  LIBRARIES,
  LIBRARIES_MAP,
};
