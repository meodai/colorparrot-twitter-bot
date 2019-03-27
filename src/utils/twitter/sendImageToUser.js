const sendImage = require('./sendImage');

async function sendImageToUser(T, image, status) {
  const b64content = image.toString('base64');
  sendImage(T, b64content, status); // input redis here!
}

module.exports = sendImageToUser;
