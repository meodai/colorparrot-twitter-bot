const { EUploadMimeType } = require("twitter-api-v2");

/**
 * Redis database wrapper
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
 * Tweet wrapper class for v2 API response
 */
class Tweet {
  constructor(tweet, includes = {}) {
    this._tweet = tweet;
    this._includes = includes;
    this._reqId = null;
  }

  getRequestID() {
    return this._reqId;
  }

  getStatusID() {
    return this._tweet.id;
  }

  getUserTweet() {
    return this._tweet.text;
  }

  isQuotedTweet() {
    return !!this._tweet.referenced_tweets?.find((ref) => ref.type === "quoted");
  }

  getQuotedTweet() {
    const quotedRef = this._tweet.referenced_tweets?.find((ref) => ref.type === "quoted");
    if (!quotedRef) return null;

    const quotedTweet = this._includes.tweets?.find((t) => t.id === quotedRef.id);
    return quotedTweet ? { id_str: quotedTweet.id } : null;
  }

  isReplyTweet() {
    return !!this._tweet.referenced_tweets?.find((ref) => ref.type === "replied_to");
  }

  getOriginalTweetID() {
    const replyRef = this._tweet.referenced_tweets?.find((ref) => ref.type === "replied_to");
    return replyRef?.id || null;
  }

  getUserPhoto() {
    const media = this._includes.media;
    if (!media || media.length === 0) return null;
    const photo = media.find((m) => m.type === "photo");
    return photo?.url || null;
  }

  getMediaURL(type) {
    const media = this._includes.media;
    if (!media || media.length === 0) return null;
    return media.find((m) => m.type === type) || null;
  }

  getAllMediaOfType(type) {
    const media = this._includes.media;
    if (!media || media.length === 0) return [];

    // Map v2 media types to expected format
    return media
      .filter((m) => m.type === type || (type === "photo" && m.type === "photo"))
      .map((m) => ({
        type: m.type,
        media_url_https: m.url || m.preview_image_url,
      }));
  }

  getUserName() {
    // In v2, author info comes from includes
    const author = this._includes.users?.find((u) => u.id === this._tweet.author_id);
    return author?.username || "";
  }

  getRetweetedStatus() {
    return !!this._tweet.referenced_tweets?.find((ref) => ref.type === "retweeted");
  }
}

/**
 * Twitter API v2 wrapper
 */
class Twit {
  constructor(userClient, appClient) {
    this.userClient = userClient;
    this.appClient = appClient;
  }

  async getTweetByID(id) {
    try {
      const { data, includes } = await this.appClient.v2.singleTweet(id, {
        expansions: ["author_id", "attachments.media_keys", "referenced_tweets.id"],
        "tweet.fields": ["text", "author_id", "referenced_tweets", "attachments"],
        "user.fields": ["username"],
        "media.fields": ["url", "preview_image_url", "type"],
      });
      return new Tweet(data, includes);
    } catch (error) {
      console.log("An error occurred while fetching a tweet");
      throw error;
    }
  }

  async statusesUpdate(params) {
    const payload = {};

    if (params.in_reply_to_status_id) {
      payload.reply = {
        in_reply_to_tweet_id: params.in_reply_to_status_id,
      };
    }

    if (params.media_ids && params.media_ids.length > 0) {
      payload.media = {
        media_ids: params.media_ids,
      };
    }

    try {
      await this.userClient.v2.tweet(params.status, payload);
      return true;
    } catch (error) {
      console.log("An error occurred while sending a tweet");
      throw error;
    }
  }

  async mediaUpload(imageBuffer) {
    try {
      const mediaID = await this.userClient.v1.uploadMedia(imageBuffer, {
        mimeType: EUploadMimeType.Png,
      });
      return mediaID;
    } catch (error) {
      console.log("An error occurred while uploading media");
      throw error;
    }
  }

  async statusesFilterStream(track) {
    const { appClient } = this;

    // Clear existing rules
    const rules = await appClient.v2.streamRules();
    if (rules.data?.length) {
      await appClient.v2.updateStreamRules({
        delete: { ids: rules.data.map((rule) => rule.id) },
      });
    }

    // Add new rule
    await appClient.v2.updateStreamRules({
      add: [{ value: track }],
    });

    const stream = await appClient.v2.searchStream({
      expansions: ["author_id", "attachments.media_keys", "referenced_tweets.id"],
      "tweet.fields": ["text", "author_id", "referenced_tweets", "attachments"],
      "user.fields": ["username"],
      "media.fields": ["url", "preview_image_url", "type"],
    });

    stream.autoReconnect = true;

    return stream;
  }
}

module.exports = {
  RedisDB,
  Twitter: { Tweet, Twit },
};
