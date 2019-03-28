const Canvas = require('canvas');
const canvasWidth = 300;
const canvasHeight = 400;

Canvas.registerFont('./assets/Inter-ExtraBold.ttf', {
  family: 'Inter-EtraBold',
});

Canvas.registerFont('./assets/Inter-Regular.ttf', {
  family: 'Inter-Regular',
});

// debug: https://codepen.io/meodai/pen/44b054419c82f3f38ffe8fcb4de517ed?editors=0110

module.exports = (colorObj) => {
  const name = colorObj.name;
  const color = colorObj.hex;

  const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
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

  return canvas.toBuffer();
};
