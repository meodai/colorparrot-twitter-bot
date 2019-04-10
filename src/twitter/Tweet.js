const AbstractTweetClass = require('./AbstractTweetClass');
/* eslint-disable */
class Tweet extends AbstractTweetClass{
  constructor(tweet) {
    super(tweet);
  }
  getUserTweet() {
    return this._tweet.text;
  }
  getUserPhoto () {
    if (this._tweet.hasOwnProperty('media') && this._tweet.media.type === "photo") {
      return this._tweet.media['media_url'];
    }
    return null;
  }
  getUserName() {
    return this._tweet.user.screen_name;
  }
  getRetweetedStatus() {
    return this._tweet.hasOwnProperty('retweeted_status');
  }
}

module.exports = Tweet;
