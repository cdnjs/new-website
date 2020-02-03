const fs = require('fs');
const path = require('path');

module.exports = src => {
  return fs.readdirSync(src).filter(file => {
    return fs.statSync(path.resolve(src, file)).isDirectory();
  });
};
