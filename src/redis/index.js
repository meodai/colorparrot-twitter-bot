const Redis = require('ioredis');
const config = require('./../config/default');


const redis = new Redis(config.REDIS_URL, {
  retryStrategy: (times) => {
    if (times > 3) {
      console.log('cannot connect to redis');
      process.exit(1);
    }
    return 5000; // ms
  },
});


module.exports = redis;
