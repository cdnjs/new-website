
const generateSlug = (value) => {
  return value.replace(/-+/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

module.export = {
  generateSlug,
};
