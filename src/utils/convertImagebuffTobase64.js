
/**
 * @param {buffer} imageBuff, image buffer
 * @return {string}
 */
function convertImagebuffTobase64(imageBuff) {
  return imageBuff.toString('base64');
}

module.exports = convertImagebuffTobase64;
