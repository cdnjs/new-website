var express = require("express");
var fs = require("fs");
var _ = require("lodash");
var Mustache = require("mustache");
var app = express();

// Serve public folder
app.use(express.static(__dirname + '/public'));

// Load libraries into ram
var LIBRARIES = JSON.parse(fs.readFileSync('packages.json', 'utf8')).packages;

// Map libraries array into object for easy access
var LIBRARIES_MAP = {};
_.each(LIBRARIES, function(library){
  LIBRARIES_MAP[library.name] = library;
});

// Templates
var templates = {
  layout: fs.readFileSync('templates/layout.html', 'utf8'),
  home: fs.readFileSync('templates/home.html', 'utf8'),
  library: fs.readFileSync('templates/library.html', 'utf8'),
  login: fs.readFileSync('templates/login.html', 'utf8'),
  register: fs.readFileSync('templates/register.html', 'utf8'),
  profile: fs.readFileSync('templates/profile.html', 'utf8'),
  about: fs.readFileSync('templates/about.html', 'utf8')
}

var generatePage = function (options) {
  var layout = options.layout || templates.layout;

  var page = {
    data: options.page && options.page.data || {},
    template: options.page && options.page.template || 'No content'
  }
  var pageContent = Mustache.render(page.template, page.data);

  var fullContent = Mustache.render(layout, {page: pageContent});
  return fullContent;

}




app.get('/', function(req, res) {
  res.send(generatePage({
    page: {
      template: templates.home,
      data: {packages: LIBRARIES}
    }
  }));
});

app.get('/libraries/:library', function(req, res) {
  var library = req.params.library;
  console.log(library, LIBRARIES_MAP[library]);//.library
  res.send(generatePage({
    page: {
      template: templates.library,
      data: {library: LIBRARIES_MAP[library]}
    }
  }));
});
// TODO - refactor these simple pages
app.get('/login', function(req, res) {
  res.send(generatePage({
    page: {
      template: templates.login
    }
  }));
});

app.get('/register', function(req, res) {
  res.send(generatePage({
    page: {
      template: templates.register
    }
  }));
});
app.get('/about', function(req, res) {
  res.send(generatePage({
    page: {
      template: templates.about
    }
  }));
});
var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});