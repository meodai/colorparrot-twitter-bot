module.exports = (T) => {
  const randomImage = require('./lib/generateImage')();
  const b64content = randomImage.toString('base64');

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
};
