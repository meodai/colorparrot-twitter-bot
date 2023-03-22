// eslint-disable-next-line no-unused-vars
const { TwitterApi, EUploadMimeType } = require("twitter-api-v2");

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
    /**
     * @param {import("twitter-api-v2").TweetV1} tweet
     */
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
    /**
     * @param {TwitterApi} userClient
     * @param {TwitterApi} appClient
     */
    constructor(userClient, appClient) {
      this.userClient = userClient;
      this.appClient = appClient;
    }

    async getTweetByID(id) {
      const data = await this.appClient.v1.singleTweet(id);
      return new Tweet(data);
    }

    async statusesUpdate(params) {
      await this.userClient.v2.reply(
        params.status,
        params.in_reply_to_status_id,
        {
          media: {
            media_ids: params.media_ids,
          },
        }
      );

      return true;
    }

    mediaUpload(imageBuffer) {
      return this.userClient.v1.uploadMedia(imageBuffer, {
        mimeType: EUploadMimeType.Png,
      });
    }

    async statusesFilterStream(track) {
      const { appClient } = this;

      const rules = await appClient.v2.streamRules();
      if (rules.data && rules.data.length) {
        await appClient.v2.updateStreamRules({
          delete: { ids: rules.data.map((rule) => rule.id) }
        });
      }

      // Add our rules
      await appClient.v2.updateStreamRules({
        add: [{ value: track }],
      });

      const stream = await appClient.v2.searchStream();

      // Enable auto reconnect
      stream.autoReconnect = true;

      return stream;
    }
    /*
    userStream() {
      return this._T.stream("user");
    }
    */
  }

  return { Tweet, Twit };
}());

module.exports = {
  RedisDB,
  Twitter,
};
