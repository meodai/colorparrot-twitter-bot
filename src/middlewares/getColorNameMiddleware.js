/*
  get color name by hex value
 */
const lib = require('../../node_modules/color-name-list/scripts/lib.js');
const ClosestVector = require('../../node_modules/closestvector/.');
const hexColorRegex = require('hex-color-regex');
const namedColors = require('color-name-list');
const namedColorsMap = new Map();
const rgbColorsArr = [];

namedColors.forEach((c) => {
  const rgb = lib.hexToRgb(c.hex);
  namedColorsMap.set(c.hex, c.name);

  // populates array needed for ClosestVector()
  rgbColorsArr.push([rgb.r, rgb.g, rgb.b]);
  // transform hex to RGB
  c.rgb = rgb;
  // calculate luminancy for each color
  c.luminance = lib.luminance(rgb);
});

const closest = new ClosestVector(rgbColorsArr);

module.exports = async (T, tweet, next) => {
  const userMessageArray = tweet.getUserTweet().split(' ');
  let validHex = false;
  let hex;
  let rgb;
  let color;
  let closestColor;
  const screenName = tweet.getUserName();

  if (tweet.getUserTweet().includes('What is the name of')) {
    for (const c of userMessageArray) {
      if (hexColorRegex().test(c)) {
        hex = c;
        rgb = lib.hexToRgb(hex);
        validHex = true;

        break;
      }
    }
    if (!validHex) {
      await next();
    } else if (namedColorsMap.get(hex)) {
      T.statusesUpdate({
        status: `@${screenName} The name of ${hex} is ` +
          `${namedColorsMap.get(hex)}`,
      });
    } else {
      // get the closest named colors
      closestColor = closest.get([rgb.r, rgb.g, rgb.b]);
      color = namedColors[closestColor.index];

      T.statusesUpdate({
        status: `@${screenName} We don't have an exact match for ${hex} ` +
        ` but the closest color we have is ${color.hex} and its name is ` +
        ` ${color.name}`,
      });
    }
  } else {
    await next();
  }
};
