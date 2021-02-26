const axios = require("axios");
const ClosestVector = require("../node_modules/closestvector/.");
const lib = require("../node_modules/color-name-list/scripts/lib.js");

const Color = {};

let namedColorsMap;
let rgbColorsArr;
let namedColorsExp;
let closest;
let lastColorsUpdateTime = -1;
const CACHE_UPDATE_INTERVAL = 1000 * 60 * 60 * 24 * 3;

const setupColors = (namedColors) => {
  namedColorsMap = new Map();
  rgbColorsArr = [];
  namedColorsExp = [...namedColors];

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
  
  closest = new ClosestVector(rgbColorsArr);
};

/**
 * Fetches the named colors list using the API and caches it. Subsequent
 * calls will return cached version.
 */
Color.getNamedColors = async () => {
  const now = new Date().getTime();
  if (!namedColorsExp || now - lastColorsUpdateTime >= CACHE_UPDATE_INTERVAL) {
    const { data } = await axios.get("https://api.color.pizza/v1/");
    setupColors(data.colors);
  }

  return {
    namedColors: namedColorsExp,
    namedColorsMap,
    closest,
  }
};

/**
 * Generates random color from color-name-list package
 * @return {object} color
 */
Color.generateRandomColor = async () => {
  const { namedColors } = await Color.getNamedColors();
  const { name, hex } = namedColors[
    Math.floor(Math.random() * namedColors.length)
  ];

  return { name, hex };
};

module.exports = Color;
