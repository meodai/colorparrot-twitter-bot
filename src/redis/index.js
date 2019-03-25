const Redis = require('ioredis');

const redis = new Redis({
  retryStrategy: (e) => {
    console.log('cannot connect to redis', e);
    process.exit();
  },
  port: process.env.REDIS_PORT,
  host: process.env.HOST,
});


module.exports = redis;
