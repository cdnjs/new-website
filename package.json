{
  "name": "new-website",
  "version": "0.0.0",
  "description": "new-website ===========",
  "main": "webServer/main.js",
  "private": true,
  "scripts": {
    "test": "npm run test:echint && npm run test:eslint && npm run test:stylelint && npm run test:html-validate && npm run test:linthtml",
    "test:echint": "echint -i \"sri/**/*\" -i \"public/**/*\" -v \"tutorials/**/*\" -v",
    "test:eslint": "eslint *.js \"webServer/**/*.js\" public/js/*.js",
    "test:stylelint": "stylelint public/css/*.css",
    "test:html-validate": "html-validate templates/*.html",
    "test:linthtml": "linthtml templates/*.html",
    "dev:api": "LOCAL=true node apiServer.js",
    "dev:web": "LOCAL=true node webServer/main.js",
    "reindex": "node reindex.js"
  },
  "repository": {
    "type": "git",
    "url": "git://github.com/cdnjs/new-website.git"
  },
  "author": "",
  "license": "ISC",
  "bugs": {
    "url": "https://github.com/cdnjs/new-website/issues"
  },
  "homepage": "https://github.com/cdnjs/new-website",
  "engines": {
    "node": "^10"
  },
  "dependencies": {
    "algoliasearch": "^3.35.1",
    "async": "^2.6.3",
    "body-parser": "^1.19.0",
    "colors": "^1.4.0",
    "compression": "^1.7.4",
    "condense-whitespace": "^1.0.0",
    "express": "^4.17.1",
    "git-url-parse": "^11.1.2",
    "github": "^13.1.0",
    "glob-to-regexp": "^0.3.0",
    "gravatar": "^1.8.0",
    "lodash": "^4.17.15",
    "markdown": "^0.5.0",
    "marked": "^0.7.0",
    "mustache": "^2.3.2",
    "newline-remove": "^1.0.2",
    "throng": "^4.0.0"
  },
  "devDependencies": {
    "@linthtml/linthtml": "^0.2.6",
    "echint": "^4.0.2",
    "eslint": "^6.8.0",
    "eslint-plugin-prefer-arrow": "^1.1.7",
    "eslint-plugin-unicorn": "^13.0.0",
    "html-validate": "^1.7.0",
    "stylelint": "^10.1.0",
    "stylelint-config-recommended": "^2.2.0",
    "stylelint-order": "^3.1.0"
  }
}
