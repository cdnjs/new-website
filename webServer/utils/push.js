const server = (res, uri) => {
  // Get the uri type
  const parts = uri.split('.');
  const ext = parts[parts.length - 1];

  // Decide how to push
  let as = null;
  switch (ext) {
    case 'js':
      as = 'script';
      break;
    case 'css':
      as = 'style';
      break;
    case 'png' :
    case 'jpg' :
    case 'jpeg':
    case 'gif' :
    case 'ico' :
      as = 'image';
      break;
    case 'xml' :
      as = '';
      break;
    default:
      break;
  }

  // Push if supported type
  if (as !== null) res.append('Link', '<' + uri + '>; rel=preload; as=' + as);
};

const defaultAssets = res => {
  server(res, '/css/main.css');
  server(res, '/js/main.js');
};

module.exports = { server, defaultAssets };
