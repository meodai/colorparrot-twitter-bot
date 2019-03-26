const redis = require('./index');

module.exports = async (message) => {
  redis.rpush('flood', message);
};
