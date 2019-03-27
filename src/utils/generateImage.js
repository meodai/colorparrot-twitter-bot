const {hexToRgb} = require('color-name-list/scripts/lib');
const Canvas = require('canvas');
Canvas.registerFont('./assets/Inter-Bold.ttf', {family: 'Inter-Bold'});


module.exports = (colorObj) => {
  const name = colorObj.name;
  const rgbBackground = hexToRgb(colorObj.hex);

  const canvas = Canvas.createCanvas(300, 300);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle =
    `rgb(${rgbBackground.r},${rgbBackground.g},${rgbBackground.b})`;
  ctx.fillRect(0, 0, 300, 300);

  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.font = '25px Inter-Bold';
  ctx.fillText(`${name}`, 10, 250);

  ctx.fillStyle = 'rgb(128,128,128)';
  ctx.font = '15px Inter-Bold';
  ctx.fillText(`${colorObj.hex}`, 10, 270);
  return canvas.toBuffer();
};
