const sendText = require('./sendText');

module.exports = (T, b64content, status, asyncCallback) => {
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
          const params = {status: status, media_ids: [mediaIdStr]};
          sendText(
              T,
              params,
              asyncCallback
          );
        }
      });
    }
  });
};
