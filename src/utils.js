/**
 * Redis database
 */
class RedisDB {
  constructor(redis) {
    this.redis = redis;
  }

  async addColorNameInPostedTweets(colorName) {
    await this.redis.sadd("postedColors", colorName);
  }

  getLastRandomPostTime() {
    return this.redis.get("lastRandomPostTime");
  }

  async updateLastRandomPostTime() {
    const time = new Date().getTime();
    await this.redis.set("lastRandomPostTime", time);
  }

  async addUserMessageToFloodList(message) {
    await this.redis.rpush("flood", message);
  }

  async addUserMessageToProposalsList(message) {
    await this.redis.rpush("proposals", message);
  }

  async checkIfColorExistsInTweets(colorName) {
    return await this.redis.sismember("postedColors", colorName);
  }
}

/**
 * Twitter utility
 */
const Twitter = (function() {
  class Tweet {
    constructor(tweet) {
      this._tweet = tweet;
      this._reqId = null;
    }

    getRequestID() {
      return this._reqId;
    }

    getStatusID() {
      return this._tweet.id_str;
    }

    getUserTweet() {
      return this._tweet.full_text || this._tweet.text;
    }

    isQuotedTweet() {
      return this._tweet.is_quote_status;
    }

    getQuotedTweet() {
      return this._tweet.quoted_status;
    }

    isReplyTweet() {
      return !!this._tweet.in_reply_to_status_id;
    }

    getOriginalTweetID() {
      return this._tweet.in_reply_to_status_id_str;
    }

    getUserPhoto() {
      if (
        this._tweet.hasOwnProperty("media")
        && this._tweet.media.type === "photo"
      ) {
        return this._tweet.media.media_url;
      }
      return null;
    }

    getMediaURL(type) {
      const { media } = this._tweet.extended_entities || this._tweet.entities;
      if (!media || media.length === 0) {
        return null;
      }
      return media.find((m) => m.type === type) || null;
    }

    getAllMediaOfType(type) {
      const { media } = this._tweet.extended_entities || this._tweet.entities;
      if (!media || media.length === 0) {
        return [];
      }
      const checkIfOfType = (object) => object.type == type;
      return media.filter(checkIfOfType);
    }

    getUserName() {
      return this._tweet.user.screen_name;
    }

    getRetweetedStatus() {
      return this._tweet.hasOwnProperty("retweeted_status");
    }
  }

  class Twit {
    constructor(twitt) {
      this._T = twitt;
    }

    getTweetByID(id) {
      return new Promise((res, rej) => {
        this._T.get("statuses/show/:id", { id, tweet_mode: "extended" }, (err, data) => {
          if (err) {
            rej(err);
          } else {
            res(new Tweet(data));
          }
        });
      });
    }

    statusesUpdate(params) {
      return new Promise((res, rej) => {
        this._T.post("statuses/update", params, (err) => {
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
        this._T.post(
          "media/upload",
          { media_data: b64content },
          (err, data) => {
            if (err) {
              rej(err);
            } else {
              res(data.media_id_string);
            }
          }
        );
      });
    }

    statusesFilterStream(track) {
      return this._T.stream("statuses/filter", {
        track,
        //language: "en",
      });
    }

    userEvents(source) {
      return this._T.stream("user_event", {
        source,
      });
    }
  }

  return { Tweet, Twit };
}());

module.exports = {
  RedisDB,
  Twitter,
};
