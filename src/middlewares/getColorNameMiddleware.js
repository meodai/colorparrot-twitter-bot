/*
  get color name by hex value
 */
const lib = require('../../node_modules/color-name-list/scripts/lib.js');
const hexColorRegex = require('hex-color-regex');
const colorList = require('../utils/colorList');
const namedColors = colorList.namedColors;
const closest = colorList.closest;
const namedColorsMap = colorList.namedColorsMap;
const fs = require('fs');
const request = require('request');

/**
 *
 * @param {*} uri
 * @param {*} filename
 * @param {*} callback
 */
function download (uri, filename, callback) {
  request.head(uri, function (err, res, body) {
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

module.exports = async (T, tweet, next) => {
  const userMessageArray = tweet.getUserTweet().split(' ');
  const userImageURL = tweet.getUserPhoto();
  let validHex = false;
  let hex;
  let rgb;
  let color;
  let closestColor;
  const screenName = tweet.getUserName();

  if (userImageURL) {
    download(userImageURL)
  }

  if (tweet.getUserTweet().includes('What is the name of')) {
    for (const c of userMessageArray) {
      if (hexColorRegex().test(c)) {
        hex = c;
        rgb = lib.hexToRgb(hex);
        validHex = true;

        break;
      }
    }
    if (!validHex && !userImageURL ) {
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
