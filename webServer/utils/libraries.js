// Library imports
const path = require('path');
const fs = require('fs');
const globToRegExp = require('glob-to-regexp');
const gitUrlParse = require('git-url-parse');

// Local imports
const constants = require('../constants');
const fileType = require('./fileType');
const templating = require('./templating');
const getDirectories = require('./getDirectories');
const cache = require('./cache');

// Get all library data
const all = () => {
  // Load the libraries
  const librariesFile = path.join(__dirname, '..', '..', 'public', 'packages.min.json');
  const libraries = JSON.parse(fs.readFileSync(librariesFile, 'utf8')).packages;
  const licenses = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'license-list.json'), 'utf8'));
  const githubMetas = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'GitHub.repos.meta.json'), 'utf8'));

  // Map libraries array into object for easy access and track versions
  const librariesMap = {};
  let versions = 0;
  libraries.forEach(library => {
    library.originalName = library.name;
    library.id = library.name;

    if (library.filename && library.filename.substr(library.filename.length - 3, library.filename.length) === 'css') {
      library.fileType = 'css';
    } else {
      library.fileType = 'js';
    }

    library.keywords = library.keywords && library.keywords.join(', ');
    librariesMap[library.name] = library;
    versions += library.assets.length;
  });

  // Return the map and versions, the raw libraries data will be discarded
  return [librariesMap, versions, licenses, githubMetas];
};

// Set library data within the app
const set = app => {
  const [LIBRARIES_MAP, LIBRARIES_VERSIONS, LICENSES, GITHUB_METAS] = all();
  app.set('LIBRARIES_MAP', LIBRARIES_MAP);
  app.set('LIBRARIES_VERSIONS', LIBRARIES_VERSIONS);
  app.set('LICENSES', LICENSES);
  app.set('GITHUB_METAS', GITHUB_METAS);
};

// Get license data for a library
const licensesList = (library, app) => {
  // Create the licenses array
  library.licenses = Array.isArray(library.licenses) ? library.licenses : [];

  // If a single license, stick it into an array
  if (library.license !== undefined) {
    library.licenses.push(library.license);
    delete library.license;
  }

  // If no licenses, return null
  if (library.licenses.length === 0) return null;

  // Transform into objects
  library.licenses = library.licenses.map(license => {
    // If the license is just a string name, make it an object
    if (typeof license !== 'object') {
      const name = license.toString();
      license = {
        type: name,
        url: '#',
      };
    }

    // If the license is a valid spdx identified, set the URL
    if (app.get('LICENSES').includes(license.type)) license.url = 'https://spdx.org/licenses/' + license.type + '.html';

    // Done
    return license;
  });

  // Done
  return library.licenses;
};

// Get assets for a library version
const assetsList = (library, version) => {
  return library.assets.map(assets => {
    // Set whether this is the selected version or not
    assets.selected = assets.version === version ? 'selected' : '';

    if (assets.gennedFileNames === undefined) {
      // Filter the files to only include ones we serve on the cdn
      assets.whitelistedFiles = assets.files.filter(fileName => {
        const fileExtension = path.extname(fileName).substring(1);
        return fileType.isWhitelisted(fileExtension);
      });

      // This map holds files by type.
      // We will use this to order them by type in the response
      const fileMap = fileType.categories.reduce((o, key) => ({ ...o, [key]: []}), {});
      let mapFiles = [];

      // Minification / hidden asset vars
      const minFileRe = globToRegExp("*.min.*");
      let hasMinFile = false;
      assets.files.map(function (fileName) {
        if (minFileRe.test(fileName)) hasMinFile = true;
      });
      const criticalFilesRegExpr = "{" + "*.min.js," + "*.min.css," + library.filename + "}";
      const commonFileRegExpr = "{" + "*.js.*," + "*.css.*," + library.filename + "}";
      const criticalRe = globToRegExp(criticalFilesRegExpr, { extended: true });
      const commonRe = globToRegExp(commonFileRegExpr, { extended: true });
      assets.hasHidden = assets.whitelistedFiles.length > 40;

      // Sort all the files into their categories
      assets.whitelistedFiles.forEach(function (fileName) {
        // Get the extension and the category
        const fileExtension = path.extname(fileName);
        const fileCategory = fileType.category(fileExtension.substring(1));

        // Determine if the file should be hidden by default
        let isHidden = false;
        if (assets.hasHidden) isHidden = !(hasMinFile ? criticalRe : commonRe).test(fileName);

        // Save the file in the map
        const data = {
          name: fileName,
          type: fileCategory,
          defaultFile: fileName === library.filename ? 'defaultFile' : '',
          isHidden: isHidden
        };
        if (fileCategory === 'map') mapFiles.push(data);
        else fileMap[fileCategory].push(data);
      });

      // The map files put along with their sources
      if (mapFiles.length > 0) {
        mapFiles.forEach(data => {
          const sourceFileParts = data.name.split('.map');
          const sourceFileName = sourceFileParts.join("");
          const sourceFileType = fileType.category(path.extname(sourceFileName).substring(1));
          // TODO: If there is only one type of source file in fileMap, and the map file doesn't have an ext, assume it is for that
          // TODO: jQuery is a good example of this: http://localhost:5500/libraries/jquery/2.2.0
          if (sourceFileType === 'css' || sourceFileType === 'js') {
            const sourceFileIndex = fileMap[sourceFileType].findIndex(file => {
              return file.name.includes(sourceFileParts[0]);
            });
            if (sourceFileIndex >= 0) {
              // Finding source file and push the map file right after it
              return fileMap[sourceFileType].splice(sourceFileIndex + 1, 0, {
                name: data.name,
                type: sourceFileType,
                defaultFile: data.defaultFile,
                isHidden: data.isHidden
              });
            }
          } else {
            // If a corresponding source file for a map file is not found,
            // push it to the "map" file list
            fileMap.map.push({
              name: data.name,
              type: 'map',
              defaultFile: data.defaultFile,
              isHidden: data.isHidden
            });
          }
        });
      }

      // Generate the final set of file tabs
      assets.fileArray = Array.prototype.concat
        .apply([], fileType.categories
          .filter(function (fileType) {
            return fileMap[fileType].length > 0;
          })
          .map(function (fileType, index) {
            return {
              fileType : fileType,
              // Mustache does not handle complex if else statments
              // isActive determines the tab in view
              isActive : index === 0,
              files : fileMap[fileType]
            };
          })
        );

      // Save that we've processed these assets
      assets.gennedFileNames = true;
    }

    return assets;
  });
};

// Get GitHub meta info for a library
const githubMeta = (library, app) => {
  if (library.repository !== undefined && /github\.com/.test(library.repository.url)) {
    const pathname = gitUrlParse(library.repository.url).pathname.replace(/^\/|\.git/g, '');
    return app.get('GITHUB_METAS')[pathname.toString()];
  } else {
    return null;
  }
};

// Get library URLs based on the git repo
const generateURLs = library => {
  let urls = [];
  if (library.repository && library.repository.type === 'git')
    urls.push({ url: gitUrlParse(library.repository.url).toString('https') });
  library.urls = urls;
  return urls;
};

// Handle the express request for a library
const response = (req, res) => {
  cache.check(req, res, 1);

  // Attempt to find the library
  const libraryName = req.params.library;
  const LIBRARIES_MAP = req.app.get('LIBRARIES_MAP');
  const library = LIBRARIES_MAP[libraryName];
  if (!library) return res.redirect(307, '/#q=' + libraryName);

  // Load in tutorials
  const tutorialsPath = path.resolve(__dirname, '..', '..', 'tutorials', libraryName);
  let tutorialPackages = [];
  if (fs.existsSync(tutorialsPath)) {
    const directories = getDirectories(tutorialsPath);
    tutorialPackages = directories.map(tutorial => {
      const tutorialPackage = JSON.parse(fs.readFileSync(path.resolve(tutorialsPath, tutorial, 'tutorial.json'), 'utf8'));
      tutorialPackage.slug = tutorial;
      return tutorialPackage;
    });
  }
  const tutorialsPresent = tutorialPackages.length > 0;

  // Set the library auto-update info
  if (library.autoupdate && !library.autoupdate.url) {
    library.autoupdate.string = library.autoupdate.type ? library.autoupdate.type + ' autoupdate enabled' : '';
    switch (library.autoupdate.type) {
      case 'npm':
        library.autoupdate.url = 'https://www.npmjs.com/package/' + library.autoupdate.target;
        break;
      case 'git':
        library.autoupdate.url = gitUrlParse(library.autoupdate.target).toString('https');
        break;
      default:
        break;
    }
  }

  // Set the homepage to the git repo if it doesn't have a defined homepage
  if (!library.homepage && library.repository && library.repository.type === 'git') {
    library.homepage = gitUrlParse(library.repository.url).toString('https');
  }

  // Get the version requested or default to the latest
  const version = req.params.version || library.version;

  // Attempt to get SRI data for the version
  let SRI;
  try {
    SRI = fs.readFileSync('sri/' + libraryName + '/' + version + '.json');
  } catch {
    SRI = {};
  }

  // Get the assets
  const libraryAssets = assetsList(library, version);
  const librarySelectedAssets = library.assets.filter(assets => assets.version === version);

  // Try to find the requested version
  // TODO: much nicer page here
  if (!librarySelectedAssets.length) return res.status(404).send(libraryName + ' version not found!');

  // Generate additional data for the library
  const libraryLicenses = licensesList(library, req.app);
  let stargazers_count, forks, subscribers_count;
  const metaInfo = githubMeta(library, req.app);
  if (metaInfo !== null && metaInfo !== undefined) {
    stargazers_count = metaInfo.stargazers_count;
    forks = metaInfo.forks;
    subscribers_count = metaInfo.subscribers_count;
  }

  // Generate some library URLs if none present
  if (!library.urls) library.urls = generateURLs(library);

  // Render the page and send it back
  res.send(templating.getPage({
    reqUrl: req.url,
    title: libraryName + ' - ' + constants.TITLE,
    page: {
      template: templating.templates.library.content,
      data: {
        library: library,
        assets: libraryAssets,
        SRI: SRI,
        licenses: libraryLicenses,
        selectedAssets: librarySelectedAssets[0],
        tutorials: tutorialPackages,
        libraryRealName: libraryName,
        tutorialsPresent: tutorialsPresent,
        star: stargazers_count,
        fork: forks,
        watch: subscribers_count,
        breadcrumbList: res.breadcrumbList
      },
      description: library && (library.name + ' - ' + library.description)
    }
  }));
};

module.exports = { all, set, licensesList, assetsList, githubMeta, generateURLs, response };
