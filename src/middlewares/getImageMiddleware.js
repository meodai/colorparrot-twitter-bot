/*
  get image by color name
 */
const namedColors = require('color-name-list');
const namedColorsMap = new Map();
namedColors.forEach((e) => {
  namedColorsMap.set(e.name, e.hex);
});

const convertImagebuffTobase64 = require('../utils/convertImagebuffTobase64');
const generateImage = require('./../utils/generateImage');


module.exports = async (T, tweet, next) => {
  const userMessageArray = tweet.getUserTweet().split(' ');
  if (userMessageArray[0] === '@color_parrot' ||
    userMessageArray[userMessageArray.length - 1] === '@color_parrot'
  ) {
    userMessageArray.splice(userMessageArray.indexOf('@color_parrot'), 1);
    const colorName = userMessageArray.join(' ');
    if (namedColorsMap.get(colorName)) {
      const hex = namedColorsMap.get(colorName);
      const imgBuff = generateImage({
        name: colorName,
        hex: hex});
      const screenName = tweet.getUserName();
      const hashTag = colorName.split(' ').join('_');
      const imgBase64 = convertImagebuffTobase64(imgBuff);
      const mediaIdString = await T.mediaUpload(imgBase64);
      T.statusesUpdate({status: `Hey @${screenName} thats #${hashTag}`,
        media_ids: mediaIdString});
    } else {
      await next();
    }
  } else {
    await next();
  }
};
