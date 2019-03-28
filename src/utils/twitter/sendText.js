module.exports = (T, params, asyncCallback, saveToDB) => {
  T.post('statuses/update', params, (err) => {
    if (err) {
      console.log(err);
    } else {
      if (saveToDB) {
        asyncCallback().catch((e) => console.log(e));
      }
    }
  });
};
