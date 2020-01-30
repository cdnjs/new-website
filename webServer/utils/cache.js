const check = (req, res, hours, lastModified) => {
  res.setHeader("Cache-Control", "public, max-age=" + 60 * 60 * hours + ", immutable");
  res.setHeader("Expires", new Date(Date.now() + 60 * 60 * hours * 1000).toUTCString());

  // Get the if-modified-since header from the request
  const reqMod = req.headers["if-modified-since"];

  // Check if if-modified-since header is the same as the mtime of the file
  if (lastModified && reqMod != null) {
    const reqModDate = new Date(reqMod);

    // Compared dates to the nearest second as that is what the if modified since header is accurate to
    if (Math.floor(reqModDate.getTime() / 1000) === Math.floor(lastModified.getTime() / 1000)) {
      res.writeHead(304, {
        "Last-Modified": lastModified.toUTCString()
      });

      res.end();
      return true;
    }
  }

  return false;
};

module.exports = { check };
