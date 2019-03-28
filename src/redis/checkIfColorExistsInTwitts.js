const redis = require('./');

module.exports = async (colorName) => {
  return await redis.sismember('postedColors', colorName);
};
