module.exports = (T, params) => {
  T.post('statuses/update', params, (err) => {
    if (err) {
      console.log(err);
    }
  });
};
