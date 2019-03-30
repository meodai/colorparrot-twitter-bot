const namedColors = require('color-name-list');
const randomImage = require('../generateImage');
const sendImage = require('./sendImage');

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
    const image = randomImage(color);
    const b64content = image.toString('base64');
    const hashTagColorName = color.name.split(' ').join('_');
    const hashTagHexValue = color.hex;
    sendImage(
        T,
        b64content,
        `#${hashTagColorName} ${hashTagHexValue}`,
        async () => {
          await db.addColorNameInPostedTweets(color.name);
        }
    );
  }
}

module.exports = sendRandomImage;
