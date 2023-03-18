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
    constructor(twitterClient) {
      this.client = twitterClient.readOnly;
    }

    getTweetByID(id) {
      return this.client.v2.singleTweet(id, {
        expansions: [
          "entities.mentions.username",
          "in_reply_to_user_id",
        ]
      }).then(({ data }) => new Tweet(data));
    }

    statusesUpdate(params) {
      return this.client.v1.reply(
        params.status,
        params.in_reply_to_status_id,
        {
          media_ids: params.media_ids,
        },
      ).then(() => true);
    }

    mediaUpload(imageBuffer) {
      return this.client.v1.uploadMedia(imageBuffer);
    }

    async statusesFilterStream(track) {
      const { client } = this;

      const rules = await client.v2.streamRules();
      if (rules.data && rules.data.length) {
        await client.v2.updateStreamRules({
          delete: { ids: rules.data.map((rule) => rule.id) }
        });
      }

      // Add our rules
      await client.v2.updateStreamRules({
        add: [{ value: track }],
      });

      const stream = await client.v2.searchStream({
        "tweet.fields": ["referenced_tweets", "author_id"],
        expansions: ["referenced_tweets.id"],
      });

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
