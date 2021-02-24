const ClosestVector = require("../node_modules/closestvector/.");
const namedColors = require("color-name-list");
const lib = require("../node_modules/color-name-list/scripts/lib.js");

const Color = (function () {
  const namedColorsMap = new Map();
  const rgbColorsArr = [];

  const namedColorsExp = [...namedColors];

  namedColorsExp.forEach((c) => {
    const rgb = lib.hexToRgb(c.hex);
    namedColorsMap.set(c.hex, c.name);

    // populates array needed for ClosestVector()
    rgbColorsArr.push([rgb.r, rgb.g, rgb.b]);
    // transform hex to RGB
    c.rgb = rgb;
    // calculate luminancy for each color
    c.luminance = lib.luminance(rgb);
  });

  return {
    namedColors: namedColorsExp,
    closest: new ClosestVector(rgbColorsArr),
    namedColorsMap,
  };
})();

module.exports = Color;
