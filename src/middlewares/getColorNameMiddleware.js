/*
  get color name by hex value
 */
const lib = require('../../node_modules/color-name-list/scripts/lib.js');
const hexColorRegex = require('hex-color-regex');
const colorList = require('../utils/colorList');
const namedColors = colorList.namedColors;
const closest = colorList.closest;
const namedColorsMap = colorList.namedColorsMap;

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
