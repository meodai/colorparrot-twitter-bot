const namedColors = require('color-name-list');
const generateImage = require('../generateImage');
const convertImagebuffTobase64 = require('./../convertImagebuffTobase64');

/**
 * Generates random color from color-name-list package
 * @return {undefined}
 */
function generateRandomColor() {
  const randomColor = namedColors[
      Math.floor(Math.random() * namedColors.length)
  ];
  return {
    name: randomColor.name,
    hex: randomColor.hex,
  };
}
/**
 * @param {object} T The instance of Twit class
 * @param {object} db instance of db class
 * @return {undefined}
 */
async function sendRandomImage(T, db) {
  let attempts = 3;
  let generatedUnique = false;
  let color;
  while (generatedUnique === false && attempts !== 0) {
    color = generateRandomColor();
    if (!(await db.checkIfColorExistsInTweets(color.name))) {
      generatedUnique = true;
    }
    attempts -= 1;
  }

  if (generatedUnique) {
    const imgBuf = generateImage(color);
    const imgBase64 = convertImagebuffTobase64(imgBuf);
    const hashTagColorName = color.name.split(' ').join('_');
    const hashTagHexValue = color.hex;
    const mediaIdString = await T.mediaUpload(imgBase64);
    T.statusesUpdate({status: `#${hashTagColorName} ${hashTagHexValue}`,
      media_ids: mediaIdString});
    db.addColorNameInPostedTweets(color.name);
  }
}

module.exports = sendRandomImage;
