const Redis = require('ioredis');


const redis = new Redis(process.env.REDIS_URL, {
  retryStrategy: (e) => {
    console.log('cannot connect to redis', e);
    process.exit();
  },
});


module.exports = redis;
