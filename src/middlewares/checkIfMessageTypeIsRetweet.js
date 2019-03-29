module.exports = (T, tweet, next) => {
  if (!tweet.hasOwnProperty('retweeted_status')) {
    next();
  }
};
