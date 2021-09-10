const color = require("./src/color");

const imageColorExtract = async () => {
  const {
    namedColors,
    namedColorsMap,
    findColors,
  } = await color.getNamedColors();

  const colorsInImage = await color.getPalette(
    "https://pbs.twimg.com/media/E-y8HQsWEAQiiTl?format=jpg&name=small",
    9
  );

  const name = findColors.getNamesForValues(['#fedcba']);

  console.log('colors in image', colorsInImage);
  console.log('approx color name', name);

  return colorsInImage;
};

imageColorExtract();
