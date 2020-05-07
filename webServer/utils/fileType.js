/* eslint-disable key-spacing */
const typeMap = {
  'js':     'js',
  'ts':     'js',
  'map':    'map',

  'css':    'css',
  'scss':   'css',

  'png':    'image',
  'gif':    'image',
  'jpg':    'image',
  'jpeg':   'image',
  'svg':    'image',
  'webp':   'image',
  'cur':    'image',

  'ttf':    'font',
  'eot':    'font',
  'woff':   'font',
  'woff2':  'font',
  'otf':    'font',

  'aac':    'audio',
  'mp3':    'audio',
  'ogg':    'audio',

  'swf':    'flash',
  'json':   'json'
};
/* eslint-enable key-spacing */

const whitelist = Object.keys(typeMap);
const categories = [...new Set(Object.values(typeMap))];

const category = ext => typeMap[ext] || 'other';

const isWhitelisted = ext => whitelist.includes(ext);

module.exports = { typeMap, whitelist, categories, category, isWhitelisted };
