const Redis = require('ioredis');


const redis = new Redis(process.env.REDIS_URL, {
  retryStrategy: (times) => {
    if (times > 3) {
      console.log('cannot connect to redis');
      process.exit(1);
    }
    return 5000; // ms
  },
});


module.exports = redis;
