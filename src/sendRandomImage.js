const namedColors = require('color-name-list');
const randomImage = require('./lib/generateImage');
const checkIfColorExistsInTwitts = require(
    './redis/checkIfColorExistsInTwitts'
);
const addColorNameInPostedTwitts = require(
    './redis/addColorNameInPostedTwitts'
);

function generateRandomColor() {
  const randomColor = namedColors[
      Math.floor(Math.random() * namedColors.length)];
  return {name: randomColor.name, hex: randomColor.hex};
}

async function sendRandomImage(T) {
  const color = generateRandomColor();
  if (await checkIfColorExistsInTwitts(color)) {
    return sendRandomImage(T); // here can be a problem in the future!
  } else {
    await addColorNameInPostedTwitts(color.name);
  }
  const image = randomImage(color);
  const b64content = image.toString('base64');

  T.post('media/upload', {media_data: b64content}, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      const mediaIdStr = data.media_id_string;
      const metaParams = {media_id: mediaIdStr};

      T.post('media/metadata/create', metaParams, (err) => {
        if (err) {
          console.log(err);
        } else {
          const params = {status: 'random image', media_ids: [mediaIdStr]};

          T.post('statuses/update', params, (err) => {
            if (err) {
              console.log(err);
            }
          });
        }
      });
    }
  });
}

module.exports = sendRandomImage;
