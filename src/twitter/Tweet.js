const AbstractTweetClass = require('./AbstractTweetClass');

class Tweet extends AbstractTweetClass{
  constructor(tweet) {
    super(tweet);
  }
  getUserTweet() {
    return this._tweet.text;
  }
  getUserName() {
    return this._tweet.user.screen_name;
  }
}

module.exports = Tweet;
