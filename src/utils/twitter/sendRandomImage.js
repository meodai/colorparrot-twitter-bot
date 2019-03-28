const namedColors = require('color-name-list');
const randomImage = require('../generateImage');
const sendImage = require('./sendImage');
const checkIfColorExistsInTweets = require(
    '../../redis/checkIfColorExistsInTwitts'
);
const addColorNameInPostedTweets = require(
    '../../redis/addColorNameInPostedTwitts'
);

function generateRandomColor() {
  const randomColor = namedColors[
      Math.floor(Math.random() * namedColors.length)
  ];
  return {
    name: randomColor.name,
    hex: randomColor.hex,
  };
}

async function sendRandomImage(T) {
  let attempts = 3;
  let generatedUnique = false;
  let color;
  while (generatedUnique === false && attempts !== 0) {
    color = generateRandomColor();
    if (!(await checkIfColorExistsInTweets(color.name))) {
      generatedUnique = true;
    }
    attempts -= 1;
  }

  if (generatedUnique) {
    await addColorNameInPostedTweets(color.name);

    const image = randomImage(color);
    const b64content = image.toString('base64');
    const hashTagColorName = color.name.split(' ').join('_');
    const hashTagHexValue = color.hex;
    sendImage(T, b64content, `random color: #${hashTagColorName} ` +
      `${hashTagHexValue}`);
  }
}

module.exports = sendRandomImage;
