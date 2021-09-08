const color = require("./src/color");

const imageColorExtract = async () => {
  const {
    namedColors,
    namedColorsMap,
    findColors,
  } = await color.getNamedColors();

  const he = await color.getPalette(
    'https://pbs.twimg.com/media/E-ysPycXoAAb00E?format=jpg&name=900x900'
  , 9);

  console.log(he);

  return he;
};

imageColorExtract();
