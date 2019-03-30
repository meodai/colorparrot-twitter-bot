/*
  get color name by hex value
 */
const hexColorRegex = require('hex-color-regex');
const namedColors = require('color-name-list');
const namedColorsMap = new Map();
namedColors.forEach((e) => {
  namedColorsMap.set(e.hex, e.name);
});

module.exports = async (T, tweet, next) => {
  const userMessageArray = tweet.getUserTweet().split(' ');
  let validHex = false;
  let hex;
  const screenName = tweet.getUserName();

  if (tweet.getUserTweet().includes('What is the name of')) {
    for (const i of userMessageArray) {
      if (hexColorRegex().test(i)) {
        hex = i;
        validHex = true;
        break;
      }
    }
    if (!validHex) {
      await next();
    } else if (namedColorsMap.get(hex)) {
      T.statusesUpdate({
        status: `@${screenName} here your color name ` +
          `${namedColorsMap.get(hex)}`,
      });
    } else {
      T.statusesUpdate({
        status: `@${screenName} Darn! ${hex} does not exist in my head!`,
      });
    }
  } else {
    await next();
  }
};
