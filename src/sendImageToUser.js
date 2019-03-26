const sendImage = require('./lib/sendImage');
const checkIfColorExistsInTwitts = require(
  './redis/checkIfColorExistsInTwitts'
);
const addColorNameInPostedTwitts = require(
  './redis/addColorNameInPostedTwitts'
);

async function sendImageToUser(T, image, status) {
  const b64content = image.toString('base64');
  sendImage(T, b64content, status);
}

module.exports = sendImageToUser;
