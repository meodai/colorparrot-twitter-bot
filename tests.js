const color = require("./src/color");

const imageColorExtract = async () => {
  const {
    namedColors,
    namedColorsMap,
    findColors,
  } = await color.getNamedColors();

  const he = await color.getPalette(
    "https://pbs.twimg.com/media/E-y8HQsWEAQiiTl?format=jpg&name=small",
    9
  );

  console.log(he);

  return he;
};

imageColorExtract();
