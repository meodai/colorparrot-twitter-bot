const ClosestVector = require('../../node_modules/closestvector/.');
const lib = require('../../node_modules/color-name-list/scripts/lib.js');
const namedColors = require('color-name-list');
const namedColorsMap = new Map();
const rgbColorsArr = [];

const namedColorsExp = [...namedColors].forEach((c) => {
  const rgb = lib.hexToRgb(c.hex);
  namedColorsMap.set(c.hex, c.name);

  // populates array needed for ClosestVector()
  rgbColorsArr.push([rgb.r, rgb.g, rgb.b]);
  // transform hex to RGB
  c.rgb = rgb;
  // calculate luminancy for each color
  c.luminance = lib.luminance(rgb);
});

module.exports = {
  namedColors: namedColorsExp,
  closest: new ClosestVector(rgbColorsArr)
};
