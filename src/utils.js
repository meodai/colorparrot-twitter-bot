/**
 * Redis database class
 */
class RedisDB {
  constructor(redis) {
    this.redis = redis;
  }

  async addColorNameInPostedTweets(colorName) {
    await this.redis.sadd('postedColors', colorName);
  }

  async addUserMessageToFloodList(message) {
    await this.redis.rpush('flood', message);
  }

  async addUserMessageToProposalsList(message) {
    await this.redis.rpush('proposals', message);
  }

  async checkIfColorExistsInTweets(colorName) {
    return await this.redis.sismember('postedColors', colorName);
  }
}


const Twitter = (function () {
  class Tweet {
    constructor(tweet) {
      this._tweet = tweet;
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

  class Twit {
    constructor(twitt) {
      this._T = twitt;
    }

    statusesUpdate(params) {
      return new Promise((res, rej) => {
        this._T.post('statuses/update', params, (err) => {
          if (err) {
            rej(err);
          } else {
            res(true);
          }
        });
      });
    }

    mediaUpload(b64content) {
      return new Promise((res, rej) => {
        this._T.post('media/upload', {media_data: b64content}, (err, data) => {
          if (err) {
            rej(err);
          } else {
            res(data.media_id_string);
          }
        });
      });
    }

    statusesFilterStream(track) {
      return this._T.stream('statuses/filter', {
        track: track, language: 'en',
      });
    }
  }

  return { Tweet, Twit };
})();

module.exports = { 
  RedisDB, 
  Twitter,
};