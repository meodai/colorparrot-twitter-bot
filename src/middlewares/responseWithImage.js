const namedColors = require('color-name-list');
const namedColorsMap = new Map();
namedColors.forEach((e) => {
  namedColorsMap.set(e.name, e.hex);
});

const sendImageToUser = require('../utils/twitter/sendImageToUser');
const generateImage = require('./../utils/generateImage');
const sendText = require('./../utils/twitter/sendText');

const checkIfColorExistsInTwitts = require(
    './../redis/checkIfColorExistsInTwitts'
);
const addColorNameInPostedTwitts = require(
    './../redis/addColorNameInPostedTwitts'
);

module.exports = async (T, tweet, next) => {
  const arrayText = tweet.text.split(' ');
  if (arrayText[0] === '@color_parrot' ||
    arrayText[arrayText.length - 1] === '@color_parrot'
  ) {
    arrayText.splice(arrayText.indexOf('@color_parrot'), 1);
    const colorName = arrayText.join(' ');
    if (namedColorsMap.get(colorName)) {
      const hex = namedColorsMap.get(colorName);
      const img = generateImage({
        name: colorName,
        hex: hex});
      const screenName = tweet.user.screen_name;
      const hashTag = colorName.split(' ').join('_');
      if (await checkIfColorExistsInTwitts(colorName)) {
        sendText(
            T,
            {
              status:
                `@${screenName} #${hashTag} already exists!`,
            }
        );
      } else {
        await sendImageToUser(
            T,
            img,
            `Hey @${screenName} thats #${hashTag}`);
        await addColorNameInPostedTwitts(colorName);
      }
    } else {
      await next();
    }
  } else {
    await next();
  }
};