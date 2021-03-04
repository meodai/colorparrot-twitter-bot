const templatesJSON = require('./templates.json');
const templates = {};
const Templates = {
  IMAGE_RESPONSE: 'IMAGE_RESPONSE',
  HEX_TAKEN: 'HEX_TAKEN',
  PROPOSAL_ACCEPTED: 'PROPOSAL_ACCEPTED',
  PROPOSAL_DENIED: 'PROPOSAL_DENIED',
  EXACT_HEX_NAME_RESPONSE: 'EXACT_HEX_NAME_RESPONSE',
  CLOSEST_HEX_NAME_RESPONSE: 'CLOSEST_HEX_NAME_RESPONSE',
};

/**
 * Picks a random template from a category for compilation
 * @param {String} category The template category
 * @param {Object} opts Template variables
 */
const buildMessage = (category, opts) => {
  const tmpls = templates[category];
  const idx = Math.floor(Math.random() * tmpls.length);
  const tmpl = tmpls[idx];
  return executeTemplate(tmpl, opts);
};

/**
 * Compiles a template with the passed variables
 * @param {String} tmpl The template to execute
 * @param {Object} opts Variables for the template
 */
const executeTemplate = (tmpl, opts) => {
  const entries = Object.entries(opts);
  let result = tmpl;
  for (const entry of entries) {
    const regex = new RegExp(`{{${entry[0]}}}`, 'g');
    result = result.replace(regex, entry[1]);
  }
  return result;
};

/**
 * Registers a new template for a category
 * @param {String} category The template category
 * @param {String} tmpl The template string
 */
const registerTemplate = (category, tmpl) => {
  if (!templates.hasOwnProperty(category)) {
    templates[category] = [];
  }
  templates[category].push(tmpl.trim());
};

// register templates in the json file
Object.entries(templatesJSON).forEach(([category, tmpls]) => {
  tmpls.forEach((tmpl) => registerTemplate(category, tmpl));
});

module.exports = { Templates, buildMessage };