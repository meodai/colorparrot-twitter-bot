/*
  if message is retweet. Do not respond
 */
module.exports = (T, tweet, next) => {
  if (!tweet.getRetweetedStatus()) {
    next();
  }
};
