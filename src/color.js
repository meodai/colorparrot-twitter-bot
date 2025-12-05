const path = require("path");
const fs = require("fs");
const axios = require("axios");
const ImageData = require("@andreekeberg/imagedata");
const PaletteExtractor = require("./vendor/palette-extractor");
const config = require("./config");
const FindColors = require("./ColorNamer");

const Color = {};

let namedColorsMap;
let namedColorsExp;
let findColors;
let lastColorsUpdateTime = -1;
const CACHE_UPDATE_INTERVAL = 1000 * 60 * 60 * 24 * 3;

const setupColors = (
  namedColors,
  namedColorsBestOf
) => {
  namedColorsMap = new Map();

  findColors = new FindColors(namedColors, namedColorsBestOf);
  namedColorsExp = [...findColors.colors];

  namedColorsExp.forEach((c) => {
    namedColorsMap.set(c.hex, c.name);
  });
};

/**
 * Fetches the named colors list using the API and caches it. Subsequent
 * calls will return cached version.
 */
Color.getNamedColors = async () => {
  const now = new Date().getTime();
  if (!namedColorsExp || now - lastColorsUpdateTime >= CACHE_UPDATE_INTERVAL) {
    const { data } = await axios.get(
      "https://api.color.pizza/v1/"
    );

    const bestOf = await axios.get(
      "https://api.color.pizza/v1/?goodnamesonly=true"
    );

    setupColors(
      data.colors,
      bestOf.data.colors
    );

    lastColorsUpdateTime = now;
  }

  return {
    namedColors: namedColorsExp,
    namedColorsMap,
    findColors,
  };
};

/**
 * Generates random color from color-name-list package
 * @return {object} color
 */
Color.generateRandomColor = async () => {
  const { namedColors } = await Color.getNamedColors();
  const { name, hex } = namedColors[
    Math.floor(Math.random() * namedColors.length)
  ];

  return {
    name,
    hex
  };
};

Color.getColorFromName = async (
  colorName
) => {
  try {
    const url = `https://api.color.pizza/v1/names/${encodeURIComponent(
      colorName
    )}?goodnamesonly=true`;
    const { data } = await axios.get(url);
    const { colors } = data;

    if (!colors.length) return null;

    // find exact match
    const exact = colors.find(
      (color) => color.name.toLowerCase() === colorName.toLowerCase()
    );
    if (exact) {
      return exact;
    }

    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Downloads an image from a URL to a local file
 * @param {string} uri - URL to download from
 * @param {string} filename - Local filename to save to
 */
async function download(uri, filename) {
  const response = await axios({
    url: uri,
    method: "GET",
    responseType: "stream",
  });

  console.log("content-type:", response.headers["content-type"]);
  console.log("content-length:", response.headers["content-length"]);

  const writer = fs.createWriteStream(filename);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

Color.getPalette = async (
  imageURL,
  numColors
) => {
  // imports
  const { findColors } = await Color.getNamedColors();

  const ext = path.extname(imageURL);
  let file = new Date().getTime() + Math.random().toString(16).substr(2);
  file += ext;

  // download image to local disk
  await download(imageURL, file);

  return new Promise((res, rej) => {
    ImageData.get(file, (err, { data }) => {
      if (err) {
        rej(err);
        return;
      }

      const paletteExtractor = new PaletteExtractor();
      const colorCount = numColors || config.MAX_PALETTE_COLORS;
      const colors = paletteExtractor.processImageData(data, colorCount);

      const usableColors = findColors.getNamesForValues(colors, true, true).map((c) => ({
        name: c.name,
        hex: c.requestedHex,
      }));

      fs.unlink(file, (err) => {
        if (err) {
          rej(err);
        } else {
          res(usableColors);
        }
      });
    });
  });
};

module.exports = Color;
