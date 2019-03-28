module.exports = (T, params, asyncCallback) => {
  T.post('statuses/update', params, (err) => {
    if (err) {
      console.log(err);
    } else {
      if (asyncCallback) {
        asyncCallback().catch((e) => console.log(e));
      }
    }
  });
};
