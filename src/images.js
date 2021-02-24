const Canvas = require('canvas');
const namedColors = require('color-name-list');

const canvasWidth = 768;
const canvasHeight = 1024;

Canvas.registerFont('./assets/Inter-ExtraBold.ttf', {
  family: 'Inter-EtraBold',
});

Canvas.registerFont('./assets/Inter-Regular.ttf', {
  family: 'Inter-Regular',
});

const Images = {};

/**
 * Generates random color from color-name-list package
 * @return {undefined}
 */
Images.generateRandomColor = () => {
  const randomColor = namedColors[
    Math.floor(Math.random() * namedColors.length)
  ];
  return {
    name: randomColor.name,
    hex: randomColor.hex,
  };
};

/**
 * @param {object} T The instance of Twit class
 * @param {object} db instance of db class
 * @return {undefined}
 */
Images.sendRandomImage = async (T, db) => {
  let attempts = 3;
  let generatedUnique = false;
  let color;
  while (generatedUnique === false && attempts !== 0) {
    color = Images.generateRandomColor();
    if (!(await db.checkIfColorExistsInTweets(color.name))) {
      generatedUnique = true;
    }
    attempts -= 1;
  }

  if (generatedUnique) {
    const imgBuf = Images.generateImage(color);
    const imgBase64 = Images.convertImagebuffTobase64(imgBuf);
    const hashTagColorName = color.name.split(' ').join('_');
    const hashTagHexValue = color.hex;
    const mediaIdString = await T.mediaUpload(imgBase64);
    T.statusesUpdate({status: `#${hashTagColorName} ${hashTagHexValue}`,
      media_ids: mediaIdString});
    db.addColorNameInPostedTweets(color.name);
  }
};

// debug: https://codepen.io/meodai/pen/44b054419c82f3f38ffe8fcb4de517ed?editors=0110
Images.generateImage = (colorObj) => {
  const name = colorObj.name;
  const color = colorObj.hex;

  const canvas = Canvas.createCanvas(canvasWidth, canvasHeight, 'png');
  const ctx = canvas.getContext('2d');

  // paints the background in the requested color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // white bar on the bottom of the picture
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, canvasHeight * .8, canvasWidth, canvasHeight * .2);

  // color name
  ctx.fillStyle = '#000';
  ctx.font = `${canvasHeight * .08}px Inter-EtraBold`;
  ctx.fillText(
      `${name}`,
      canvasWidth * .05,
      canvasHeight * .8 + canvasHeight * .1
  );

  // color hex value
  ctx.font = `${canvasHeight * .04}px Inter-Regular`;
  ctx.fillText(
      `${color}`,
      canvasWidth * .05,
      canvasHeight * .8 + canvasHeight * .1 + canvasHeight * .06
  );

  // overlays a gradient on the text so it would not get cut off on the
  // right side
  const gradient = ctx.createLinearGradient(
      canvasWidth * .7, 0,
      canvasWidth * .99, 0
  );
  gradient.addColorStop(0, 'rgba(255,255,255,0)');
  gradient.addColorStop(1, 'rgba(255,255,255,1)');

  ctx.fillStyle = gradient;
  ctx.fillRect(
      canvasWidth * .7,
      canvasHeight * .8,
      canvasWidth * .3,
      canvasHeight * .2
  );

  return canvas.toBuffer('image/png', {
    compressionLevel: 3,
    filters: canvas.PNG_FILTER_NONE
  });
};

 /**
* @param {buffer} imageBuff, image buffer
* @return {string}
*/
Images.convertImagebuffTobase64 = 
  (imageBuff) => imageBuff.toString('base64');

module.exports = Images;