const Canvas = require("canvas");
const chroma = require("chroma-js");
const Color = require("./color");

const canvasWidth = 768;
const canvasHeight = 1024;

Canvas.registerFont("./assets/Inter-ExtraBold.ttf", {
  family: "Inter-EtraBold",
});

Canvas.registerFont("./assets/Inter-Regular.ttf", {
  family: "Inter-Regular",
});

const Images = {};

/**
 * Sends an image for a random but unique color
 * @param {object} T The instance of Twit class
 * @param {object} db instance of db class
 * @param {object} redis instance of redis db class
 * @returns {Promise<boolean>} true if an image was sent; false otherwise
 */
Images.sendRandomImage = async (T, db, redis) => {
  let attempts = 3;
  let generatedUnique = false;
  let color;
  while (generatedUnique === false && attempts !== 0) {
    color = await Color.generateRandomColor();
    if (!(await redis.checkIfColorExistsInTweets(color.name))) {
      generatedUnique = true;
    }
    attempts -= 1;
  }

  if (generatedUnique) {
    const imgBuf = Images.generateImage(color);
    // const imgBase64 = Images.convertImagebuffTobase64(imgBuf);
    const hashTagColorName = color.name.split(" ").join("_");
    const hashTagHexValue = color.hex;
    const mediaIdString = await T.mediaUpload(imgBuf);
    T.statusesUpdate({
      status: `#${hashTagColorName} ${hashTagHexValue} https://parrot.color.pizza/color/${hashTagHexValue.replace("#", "")}`,
      media_ids: [mediaIdString],
    });
    redis.addColorNameInPostedTweets(color.name);
    return true;
  }

  return false;
};

/**
 * Cuts off text amd adds ellipsis after text gets too wide
 * @param {object}  ctx
 * @param {string}  str
 * @param {integer} maxWidth
 * @param {string} ellipsis
 * @returns {string} cut string including ellipsis character
 */
function textOverflowEllipsis(
  ctx,
  str,
  maxWidth,
  ellipsis = "…"
) {
  let width = ctx.measureText(str).width;
  const ellipsisWidth = ctx.measureText(ellipsis).width;

  if (width <= maxWidth) {
    return str;
  }

  let strLength = str.length;
  while (width >= maxWidth - ellipsisWidth && --strLength > 0) {
    str = str.substring(0, strLength);
    width = ctx.measureText(str).width;
  }
  return str + ellipsis;
}

/**
 * Generates an image [buffer] from a color
 * @param {object} colorObj
 * @param {string} colorObj.name
 * @param {string} colorObj.hex
 * @return {Buffer}
 */
// debug: https://codepen.io/meodai/pen/44b054419c82f3f38ffe8fcb4de517ed?editors=0110
Images.generateImage = (colorObj) => {
  const name = colorObj.name;
  const color = colorObj.hex;

  const canvas = Canvas.createCanvas(canvasWidth, canvasHeight, "png");
  const ctx = canvas.getContext("2d");

  // paints the background in the requested color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // white bar on the bottom of the picture
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, canvasHeight * 0.8, canvasWidth, canvasHeight * 0.2);

  // color name
  ctx.fillStyle = "#000";
  ctx.font = `${canvasHeight * 0.08}px Inter-EtraBold`;

  ctx.fillText(
    `${textOverflowEllipsis(ctx, name, canvasWidth * 0.9)}`,
    canvasWidth * 0.05,
    canvasHeight * 0.8 + canvasHeight * 0.1
  );

  // color hex value
  ctx.font = `${canvasHeight * 0.04}px Inter-Regular`;
  ctx.fillText(
    `${textOverflowEllipsis(ctx, color, canvasWidth * 0.9)}`,
    canvasWidth * 0.05,
    canvasHeight * 0.8 + canvasHeight * 0.1 + canvasHeight * 0.06
  );

  return canvas.toBuffer("image/png", {
    compressionLevel: 3,
    filters: canvas.PNG_FILTER_NONE,
  });
};

/**
 * Converts an image buffer to base64
 * @param {Buffer} imageBuff, image buffer
 * @return {string}
 */
Images.convertImagebuffTobase64 = (imageBuff) => imageBuff.toString("base64");

Images.generateCollection = (() => {
  const generateImage = (
    colorObj,
    w = 768, h = 1024,
    labelBackground = "#fff", // eslint-disable-line
    labelColor = "#000" // eslint-disable-line
  ) => {
    const canvasWidth = w;
    const canvasHeight = h;

    const row1 = colorObj.row1;
    const row2 = colorObj.row2;
    const color = colorObj.color;

    const canvas = Canvas.createCanvas(canvasWidth, canvasHeight, "png");
    const ctx = canvas.getContext("2d");

    // paints the background in the requested color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // white bar on the bottom of the picture
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, canvasHeight * 0.8, canvasWidth, canvasHeight * 0.2);

    // color row1
    ctx.fillStyle = "#000";
    ctx.font = `700 ${canvasHeight * 0.08}px 'Inter-EtraBold'`;
    ctx.fillText(
      `${row1}`,
      canvasWidth * 0.05,
      canvasHeight * 0.8 + canvasHeight * 0.1
    );

    // color row2 value
    ctx.font = `${canvasHeight * 0.04}px 'Inter-Regular'`;

    ctx.fillText(
      `${row2}`,
      canvasWidth * 0.05,
      canvasHeight * 0.8 + canvasHeight * 0.1 + canvasHeight * 0.06
    );

    // overlays a gradient on the text so it would not get cut off on the
    // right side
    const gradient = ctx.createLinearGradient(
      canvasWidth * 0.7, 0,
      canvasWidth * 0.99, 0
    );

    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(1, "rgba(255,255,255,1)");

    ctx.fillStyle = gradient;
    ctx.fillRect(
      canvasWidth * 0.7,
      canvasHeight * 0.8,
      canvasWidth * 0.3,
      canvasHeight * 0.2
    );

    return canvas;
  };

  const generateGrid = (
    colors,
    w, h,
    x = 3, y = 3,
    padding = 40
  ) => {
    const realX = Math.min(colors.length, x);
    const realY = Math.ceil(colors.length / x);
    const canvasWidth = realX * (w + padding * 2) + (padding * 2);
    const canvasHeight = realY * (h + padding * 2) + (padding * 2);

    const canvas = Canvas.createCanvas(canvasWidth, canvasHeight, "png");
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#212121";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.translate(padding * 2, padding * 2);

    colors.forEach((color, i) => {
      const rx = (i % x);
      const ry = Math.floor(i / y);
      const cx = (rx * padding * 2) + rx * w;
      const cy = (ry * padding * 2) + ry * h;

      // adds color shine
      /*
      ctx.filter = `blur(${padding * 2}px)`;
      ctx.fillStyle = color.color;
      ctx.fillRect(cx, cy, w, h);
      ctx.filter = 'none';
      */

      ctx.drawImage(
        generateImage(color, w, h),
        cx, cy
      );
    });

    return canvas;
  };

  const generateTable = (
    colors,
    watchSize = [70, 80],
    rowWidth = 650,
    rowHeight = 100,
    padding = 20,
    rows = 1
  ) => {
    const canvasWidth = rows * (rowWidth + padding * 2);
    const canvasHeight = Math.ceil(colors.length / rows) * rowHeight + padding;

    const canvas = Canvas.createCanvas(canvasWidth, canvasHeight, "png");
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#212121";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    colors.forEach((color, i) => {
      const currentRowIndex = Math.floor(i / Math.ceil(colors.length / rows));
      const left = currentRowIndex * rowWidth + (currentRowIndex * padding);
      const top = currentRowIndex * canvasHeight - (currentRowIndex * padding);

      ctx.save();
      ctx.translate(padding, i * rowHeight + padding);

      ctx.drawImage(
        generateImage(
          {
            ...color,
            row1: "",
            row2: "",
          },
          watchSize[0],
          watchSize[1]
        ),
        left,
        -top
      );

      // color row1
      ctx.fillStyle = "#fff";

      ctx.font = `900 ${rowHeight * 0.4}px 'Inter-EtraBold'`;
      ctx.fillText(
        `${color.row1}`,
        watchSize[0] + padding + left,
        rowHeight * 0.4 - top
      );

      // color row2 value
      ctx.font = `${rowHeight * 0.2}px 'Inter-Regular'`;

      ctx.fillText(
        `${color.row2}`,
        watchSize[0] + padding + left,
        rowHeight * 0.7 - top
      );

      ctx.restore();
    });

    return canvas;
  };

  const colorsToImage = (colors) => {
    if (colors.length === 1) {
      return generateImage(colors.map((c) => ({
        row1: c.name, row2: c.hex, color: c.hex
      }))[0]);
    } if (colors.length < 10) {
      return generateGrid(colors.map((c) => ({
        row2: c.name, row1: c.hex, color: c.hex
      })), 768, 1024);
    }

    // eslint-disable-next-line
    colors = colors.sort((a, b) => (chroma(b.hex).luminance() - chroma(a.hex).luminance()) - (chroma(b.hex).hcl()[0] - chroma(a.hex).hcl()[0]));

    return generateTable(
      colors.map(
        (c) => ({ row1: c.name, row2: c.hex, color: c.hex })
      ),
      [70, 80],
      660,
      100,
      20,
      colors.length > 16 ? 2 : 1
    );
  };

  const generateCollection = (colors) => {
    const canvas = colorsToImage(colors);
    return canvas.toBuffer("image/png", {
      compressionLevel: 3,
      filters: canvas.PNG_FILTER_NONE,
    });
  };

  return generateCollection;
})();

module.exports = Images;
