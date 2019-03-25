const namedColors = require('color-name-list');
const {hexToRgb} = require('color-name-list/scripts/lib');
const {createCanvas} = require('canvas');


module.exports = (name, hex) => {
  let rgbBackground;
  if (name === undefined && hex === undefined) {
    const randomColor = namedColors[
        Math.floor(Math.random() * namedColors.length)
    ];
    rgbBackground = hexToRgb(randomColor.hex);
    name = randomColor.name;
    hex = randomColor.hex;
  } else {
    rgbBackground = hexToRgb(hex);
  }

  const canvas = createCanvas(300, 300);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = `rgb(${rgbBackground.r},${rgbBackground.g},${rgbBackground.b})`;
  ctx.fillRect(0, 0, 300, 300);

  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.font = 'bold 25px Impact Bold';
  ctx.fillText(`${name}`, 10, 250);

  ctx.fillStyle = 'rgb(128,128,128)';
  ctx.font = '15px Impact Bold';
  ctx.fillText(`${hex}`, 10, 270);
  return canvas.toBuffer();
};
