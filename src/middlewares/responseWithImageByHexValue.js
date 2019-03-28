const hexColorRegex = require('hex-color-regex');
const namedColors = require('color-name-list');
const namedColorsMap = new Map();
namedColors.forEach((e) => {
  namedColorsMap.set(e.hex, e.name);
});

const sendImageToUser = require('../utils/twitter/sendImageToUser');
const generateImage = require('./../utils/generateImage');

module.exports = async (T, tweet, next) => {
  console.log('debug prod')
  const userMessageArray = tweet.text.split(' ');
  const filteredMessage = userMessageArray
      .filter((i) => i !== '@color_parrot')
      .join(' ');
  if (userMessageArray.length === 2 && hexColorRegex().test(filteredMessage)) {
    if (namedColorsMap.get(filteredMessage)) {
      const colorName = namedColorsMap.get(filteredMessage);
      const img = generateImage({
        name: colorName,
        hex: filteredMessage});
      const screenName = tweet.user.screen_name;
      const hashTag = colorName.split(' ').join('_');
      await sendImageToUser(
          T,
          img,
          `Hey @${screenName} thats #${hashTag}`);
    } else {
      await next();
    }
  } else {
    await next;
  }
};
