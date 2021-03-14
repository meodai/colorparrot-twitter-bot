const Canvas = require("canvas");
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
 */
Images.sendRandomImage = async (T, db) => {
  let attempts = 3;
  let generatedUnique = false;
  let color;
  while (generatedUnique === false && attempts !== 0) {
    color = await Color.generateRandomColor();
    if (!(await db.checkIfColorExistsInTweets(color.name))) {
      generatedUnique = true;
    }
    attempts -= 1;
  }

  if (generatedUnique) {
    const imgBuf = Images.generateImage(color);
    const imgBase64 = Images.convertImagebuffTobase64(imgBuf);
    const hashTagColorName = color.name.split(" ").join("_");
    const hashTagHexValue = color.hex;
    const mediaIdString = await T.mediaUpload(imgBase64);
    T.statusesUpdate({
      status: `#${hashTagColorName} ${hashTagHexValue}`,
      media_ids: mediaIdString,
    });
    db.addColorNameInPostedTweets(color.name);
  }
};

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
    `${name}`,
    canvasWidth * 0.05,
    canvasHeight * 0.8 + canvasHeight * 0.1
  );

  // color hex value
  ctx.font = `${canvasHeight * 0.04}px Inter-Regular`;
  ctx.fillText(
    `${color}`,
    canvasWidth * 0.05,
    canvasHeight * 0.8 + canvasHeight * 0.1 + canvasHeight * 0.06
  );

  // overlays a gradient on the text so it would not get cut off on the
  // right side
  const gradient = ctx.createLinearGradient(
    canvasWidth * 0.7,
    0,
    canvasWidth * 0.99,
    0
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

  return canvas.toBuffer("image/png", {
    compressionLevel: 3,
    filters: canvas.PNG_FILTER_NONE,
  });
};

/**
 * Converts an image buffer to base64
 * @param {buffer} imageBuff, image buffer
 * @return {string}
 */
Images.convertImagebuffTobase64 = (imageBuff) => imageBuff.toString("base64");

Images.generateCollection = (() => {
  const generateImage = (colorObj, w = 768, h = 1024) => {
    const canvasWidth = w;
    const canvasHeight = h;
    
    const row1 = colorObj.row1;
    const row2 = colorObj.row2;
    const color = colorObj.color;
  
    const canvas = Canvas.createCanvas(canvasWidth, canvasHeight, "png");  
    const ctx = canvas.getContext('2d');
  
    // paints the background in the requested color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
    // white bar on the bottom of the picture
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, canvasHeight * 0.8, canvasWidth, canvasHeight * 0.2);
  
    // name row1
    ctx.fillStyle = '#000';
    ctx.font = `${canvasHeight * 0.08}px Inter-EtraBold`;
    ctx.fillText(
      `${row1}`,
      canvasWidth * 0.05,
      canvasHeight * 0.8 + canvasHeight * 0.1
    );
  
    // color row2 value
    ctx.font = `${canvasHeight * 0.04}px Inter-Regular`;
    
    ctx.fillText(
      `${row2}`,
      canvasWidth * 0.05,
      canvasHeight * 0.8 + canvasHeight * 0.1 + canvasHeight * 0.06
    );
  
    // overlays a gradient on the text so it would not get cut off on the
    // right side
    const gradient = ctx.createLinearGradient(
      canvasWidth * 0.7,
      0,
      canvasWidth * 0.99,
      0
    );
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(1, 'rgba(255,255,255,1)');
  
    ctx.fillStyle = gradient;
    ctx.fillRect(
      canvasWidth * 0.7,
      canvasHeight * 0.8,
      canvasWidth * 0.3,
      canvasHeight * 0.2
    );
  
    return canvas;
  };
  
  const generateCollection = (
    colors, 
    w, h, 
    x = 3, y = 2,
    margin = 20
  ) => {
    const canvasWidth = w + margin * 2;
    const canvasHeight = h + margin * 2;
  
    const canvas = Canvas.createCanvas(canvasWidth, canvasHeight, "png");  
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#212121';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.translate(margin, margin);
    
    colors.forEach((color, i) => {
      ctx.drawImage(
        generateImage(
          color,
          w/x - (margin * 2),
          h/y - (margin * 2)
        ), 
        margin + (i % x) * (w / x), 
        margin + Math.floor(i / y) * (h / y)
      )
    });
    
    return canvas.toBuffer("image/png", {
      compressionLevel: 3,
      filters: canvas.PNG_FILTER_NONE,
    });
  };

  return generateCollection;
})();

module.exports = Images;
