const sendImage = require('./sendImage');

/**
 * @param {object} T, The instance of Twit class
 * @param {buffer} image, image buffer
 * @param {string} status, payload with image (name of color...)
 * @return {undefined}
 */
async function sendImageToUser(T, image, status) {
  const b64content = image.toString('base64');
  sendImage(T, b64content, status);
}

module.exports = sendImageToUser;
