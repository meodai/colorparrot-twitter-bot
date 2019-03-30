//* eslint-disable */

class AbstractTweetClass {
  constructor(tweet) {
    this._tweet = tweet;
  }
  getUserTweet() {
    throw 'getUserMessage is not implemented';
  }
  getUserName() {
    throw 'getUserName is not implemented';
  }
}


module.exports = AbstractTweetClass;
