const templates = {};
const Templates = {
  IMAGE_RESPONSE: 'IMAGE_RESPONSE',
  HEX_TAKEN: 'HEX_TAKEN',
  PROPOSAL_ACCEPTED: 'PROPOSAL_ACCEPTED',
  PROPOSAL_DENIED: 'PROPOSAL_DENIED',
  EXACT_HEX_NAME_RESPONSE: 'EXACT_HEX_NAME_RESPONSE',
  CLOSEST_HEX_NAME_RESPONSE: 'CLOSEST_HEX_NAME_RESPONSE',
};

const buildMessage = (category, opts) => {
  const tmpls = templates[category];
  const idx = Math.floor(Math.random() * tmpls.length);
  const tmpl = tmpls[idx];
  return executeTemplate(tmpl, opts);
};

const executeTemplate = (tmpl, opts) => {
  const entries = Object.entries(opts);
  let result = tmpl;
  for (const entry of entries) {
    const regex = new RegExp(`{{${entry[0]}}}`, 'g');
    result = result.replace(regex, entry[1]);
  }
  return result;
};

const registerTemplate = (category, tmpl) => {
  if (!templates.hasOwnProperty(category)) {
    templates[category] = [];
  }
  templates[category].push(tmpl.trim());
};

registerTemplate(
  Templates.IMAGE_RESPONSE, 
  `Hey @{{screenName}}, that's #{{hashTag}}`
);

registerTemplate(
  Templates.HEX_TAKEN, 
  `@{{screenName}} Darn! {{hex}} is taken already. Try shifting the values ` +
  `a bit and try again`
);

registerTemplate(
  Templates.PROPOSAL_ACCEPTED,
  `@{{screenName}} Thanks for your submission! ` +
  `Your color-name will be reviewed by a bunch of parrots ` +
  `and will end up in the color list soon. {{hex}}`
);

registerTemplate(
  Templates.PROPOSAL_DENIED,
  `@{{screenName}} What?! You need to give me a Name and ` +
  `a color as a hex value... --> {{filteredMessage}}. And if you want ` +
  `to know the name of color just ask me: What is the name of #hex`
);

registerTemplate(
  Templates.EXACT_HEX_NAME_RESPONSE,
  `@{{screenName}} The name of {{hex}} is {{colorName}}`
);

registerTemplate(
  Templates.CLOSEST_HEX_NAME_RESPONSE,
  `@{{screenName}} We don't have an exact match for {{hex}} ` +
  `but the closest color we have is {{closestHex}} and its ` +
  `name is {{closestName}}`
);

module.exports = { Templates, buildMessage };