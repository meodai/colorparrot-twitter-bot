const ClosestVector = require("closestvector");

const RGB_HEX = /^#?(?:([\da-f]{3})[\da-f]?|([\da-f]{6})(?:[\da-f]{2})?)$/i;

/**
 * disassembles a HEX color to its RGB components
 * https: //gist.github.com/comficker/871d378c535854c1c460f7867a191a5a#gistcomment-2615849
 * @param   {string} hexSrt hex color representatin
 * @return  {object} {r,g,b}
 */
const hexToRgb = (hexSrt) => {
  const [, short, long] = String(hexSrt).match(RGB_HEX) || [];

  if (long) {
    const value = Number.parseInt(long, 16);
    return {
      r: value >> 16,
      g: (value >> 8) & 0xff,
      b: value & 0xff,
    };
  }

  if (short) {
    const rgbArray = Array.from(short, (s) => Number.parseInt(s, 16)).map(
      (n) => (n << 4) | n
    );
    return {
      r: rgbArray[0],
      g: rgbArray[1],
      b: rgbArray[2],
    };
  }

  return null;
}

/**
 * entriches color object and fills RGB color arrays
 * Warning: Not a pure function at all :D
 * @param   {object} colorObj hex representation of color
 * @param   {array} rgbColorArrRef reference to RGB color array
 * @return  {object} enriched color object
 */
const enrichColorObj = (colorObj, rgbColorArrRef) => {
  const rgb = hexToRgb(colorObj.hex);
  // populates array needed for ClosestVector()
  rgbColorArrRef.push([rgb.r, rgb.g, rgb.b]);
  // transform hex to RGB
  colorObj.rgb = rgb;
  // get hsl color value
  // colorObj.hsl = lib.rgbToHsl(...Object.values(rgb));

  // calculate luminancy for each color
  // colorObj.luminance = lib.luminance(rgb);

  return colorObj;
};

module.exports = class FindColors {
  constructor(colors, colorsBestOf) {
    this.colors = colors;
    this.colorsBestOf = colorsBestOf;

    // object containing the name:hex pairs for nearestColor()
    this.rgbColorsArr = [];
    this.rgbColorsArrBestOf = [];

    // prepare color array
    this.colors.forEach((c) => enrichColorObj(c, this.rgbColorsArr));
    this.colorsBestOf.forEach((c) => enrichColorObj(c, this.rgbColorsArrBestOf));

    Object.freeze(this.colors);
    Object.freeze(this.colorsBestOf);

    this.closest = new ClosestVector(this.rgbColorsArr);
    this.closestBestOf = new ClosestVector(this.rgbColorsArrBestOf);
  }

  /**
   * returns all colors that match a name
   * @param {string} searchStr search term
   * @param {boolen} bestOf    if set only returns good names
   */
  searchNames (searchStr, bestOf = false) {
    const colors = bestOf ? this.colorsBestOf : this.colors;
    return colors.filter((color) => color.name.toLowerCase().includes(searchStr.toLowerCase()));
  }

  /**
   * names an array of colors
   * @param   {array} colorArr array containing hex values without the hash
   * @param   {boolean} unique if set to true every returned name will be unque
   * @param   {boolean} bestOf if set only returns good names
   * @return  {object}         object containing all nearest colors
   */
  getNamesForValues (colorArr, unique = false, bestOf = false) {
    let localClosest = bestOf ? this.closestBestOf : this.closest;

    if (unique) {
      localClosest = new ClosestVector(
        bestOf ? this.rgbColorsArrBestOf : this.rgbColorsArr,
        true
      );
    }

    const colorResp = colorArr.map((hex) => {
      // calculate RGB values for passed color
      const rgb = hexToRgb(hex);

      // get the closest named colors
      const closestColor = localClosest.get([rgb.r, rgb.g, rgb.b]);
      const color = bestOf ? this.colorsBestOf[closestColor.index]
        : this.colors[closestColor.index];

      return {
        ...color,
        requestedHex: hex,
        distance: Math.sqrt(
          Math.pow(color.rgb.r - rgb.r, 2)
          + Math.pow(color.rgb.g - rgb.g, 2)
          + Math.pow(color.rgb.b - rgb.b, 2)
        ),
      };
    });

    if (unique) {
      localClosest.clearCache();
    }

    return colorResp;
  }
};
