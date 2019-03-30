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
  getRetweetedStatus() {
    return this._tweet.hasOwnProperty('retweeted_status');
  }
}

module.exports = Tweet;
