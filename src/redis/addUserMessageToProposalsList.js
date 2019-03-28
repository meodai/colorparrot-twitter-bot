const redis = require('./');

module.exports = async (message) => {
  redis.rpush('proposals', message);
};
