const sendImage = require('./utils/twitter/sendImage');

async function sendImageToUser(T, image, status) {
  const b64content = image.toString('base64');
  sendImage(T, b64content, status);
}

module.exports = sendImageToUser;
