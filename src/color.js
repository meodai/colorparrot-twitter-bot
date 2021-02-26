const axios = require("axios");
const ClosestVector = require("../node_modules/closestvector/.");

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
    const rgb = Color.hexToRgb(c.hex);
    namedColorsMap.set(c.hex, c.name);

    // populates array needed for ClosestVector()
    rgbColorsArr.push([rgb.r, rgb.g, rgb.b]);
    // transform hex to RGB
    c.rgb = rgb;
    // calculate luminancy for each color
    c.luminance = Color.luminance(rgb);
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
  };
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

/**
 * disassembles a HEX color to its RGB components
 * https: //gist.github.com/comficker/871d378c535854c1c460f7867a191a5a#gistcomment-2615849
 * @param   {string} hexSrt hex color representatin
 * @return  {object} {r,g,b}
 */
Color.hexToRgb = (hexSrt) => {
  const [, short, long] = String(hexSrt).match(RGB_HEX) || [];

  if (long) {
    const value = Number.parseInt(long, 16);
    return {
      r: value >> 16,
      g: (value >> 8) & 0xff,
      b: value & 0xff,
    };
  } else if (short) {
    const rgbArray = Array.from(short, (s) => Number.parseInt(s, 16)).map(
      (n) => (n << 4) | n
    );
    return {
      r: rgbArray[0],
      g: rgbArray[1],
      b: rgbArray[2],
    };
  }
};

// return HSP luminance http://alienryderflex.com/hsp.html
Color.luminance = (rgb) =>
  Math.sqrt(
    Math.pow(0.299 * rgb.r, 2) +
      Math.pow(0.587 * rgb.g, 2) +
      Math.pow(0.114 * rgb.b, 2)
  );

module.exports = Color;
