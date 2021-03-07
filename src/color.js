const request = require("request");
const fs = require('fs');
const axios = require("axios");
const ColorThief = require("color-thief");
const ClosestVector = require("../node_modules/closestvector/.");

const Color = {};
const colorThief = new ColorThief();

let namedColorsMap;
let rgbColorsArr;
let namedColorsExp;
let closest;
let lastColorsUpdateTime = -1;
const CACHE_UPDATE_INTERVAL = 1000 * 60 * 60 * 24 * 3;
const RGB_HEX = /^#?(?:([\da-f]{3})[\da-f]?|([\da-f]{6})(?:[\da-f]{2})?)$/i;

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
    lastColorsUpdateTime = now;
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

Color.getColorFromName = async (colorName) => {
  try {
    const url = `https://api.color.pizza/v1/names/${encodeURIComponent(
      colorName
    )}`;
    const { data } = await axios.get(url);
    const { colors } = data;

    if (!colors.length) return null;

    // find exact match
    const exact = colors.find(
      (color) => color.name.toLowerCase() === colorName.toLowerCase()
    );
    if (exact) {
      return exact;
    }

    return colors[0];
  } catch (error) {
    return null;
  }
};

Color.rgbToHex = ({ r, g, b }) => {
  const s = x => x.toString(16);
  return '#' + s(r) + s(g) + s(b);
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

Color.getDominantColor = async (imageURL) => {
  return new Promise((resolve, reject) => {
    request({ url: imageURL, encoding: 'binary' }, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        // grnerate file name
        const file = Math.random().toString(16).substr(2) 
        + '.' + imageURL.split('.').pop();
        // write to disk
        fs.writeFile(file, body, 'binary', (err) => {
          if (err) {
            reject(err);
            return;
          }

          const [r,g,b] = colorThief.getColor(file);
          fs.unlink(file, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(Color.rgbToHex({ r, g, b }));
            }
          });
        });
      } else {
        reject(error);
      }
    });
  });
};

module.exports = Color;
