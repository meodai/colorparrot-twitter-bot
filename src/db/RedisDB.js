const Redis = require('ioredis');
const config = require('../config');

/* eslint-disable */
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

const DB = new RedisDB(new Redis(config.REDIS_URL, {
  retryStrategy: (times) => {
    if (times > 3) {
      console.log('cannot connect to redis');
      process.exit(1);
    }
    return 5000; // ms
  },
})
);

module.exports = DB;
