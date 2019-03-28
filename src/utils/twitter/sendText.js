module.exports = (T, params) => {
  T.post('statuses/update', params, (err, data, responce) => {
    if (err) {
      console.log('broke here')
      console.log(err);
    } else {
      console.log(data, 'data')
      console.log(responce, 'responce')
    }
  });
};
