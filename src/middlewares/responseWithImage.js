const namedColors = require('color-name-list');
const namedColorsMap = new Map();
namedColors.forEach((e) => {
  namedColorsMap.set(e.name, e.hex);
});

const sendImageToUser = require('../utils/twitter/sendImageToUser');
const generateImage = require('./../utils/generateImage');


module.exports = async (T, tweet, next) => {
  const userMessageArray = tweet.text.split(' ');
  if (userMessageArray[0] === '@color_parrot' ||
    userMessageArray[userMessageArray.length - 1] === '@color_parrot'
  ) {
    /*
      if user watns to get an image
     */
    userMessageArray.splice(userMessageArray.indexOf('@color_parrot'), 1);
    const colorName = userMessageArray.join(' ');
    if (namedColorsMap.get(colorName)) {
      const hex = namedColorsMap.get(colorName);
      const img = generateImage({
        name: colorName,
        hex: hex});
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
    await next();
  }
};
