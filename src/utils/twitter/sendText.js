module.exports = (T, status) => {
  T.post('statuses/update', {status: status}, (err) => {
    if (err) {
      console.log(err);
    }
  });
};
