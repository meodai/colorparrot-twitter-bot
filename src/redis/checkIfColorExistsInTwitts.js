const redis = require('./index');

module.exports = async (colorName) => {
  return await redis.sismember('postedColors', colorName);
};
