module.exports = (T, tweet, next) => {
  if (!tweet.getRetweetedStatus()) {
    next();
  }
};
