const redis = require('./');

module.exports = async (colorName) => {
  await redis.sadd('postedColors', colorName);
};
