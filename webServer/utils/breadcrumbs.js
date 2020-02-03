module.exports = req => {
  // Split the url into parts
  let breadcrumbList = req.originalUrl
    .split('?')[0] // eliminate query string
    .split('/');

  // If the originalUrl ended with '/', pop last item, which will be empty
  if (breadcrumbList[breadcrumbList.length - 1] === '') breadcrumbList.pop();

  // Generate the breadcrumbs
  const lastIndex = breadcrumbList.length - 1;
  let nowUrl = '';
  let position;
  breadcrumbList = breadcrumbList.map(path => {
    position = breadcrumbList.indexOf(path);
    nowUrl += path + (position === lastIndex ? '' : '/'); // don't append / to last item
    return {
      index: path || 'Home',  // empty when it is root
      url: nowUrl,
      position: position + 1
    };
  });

  // Mark the last item
  breadcrumbList[lastIndex].last = true;
  return breadcrumbList;
};
