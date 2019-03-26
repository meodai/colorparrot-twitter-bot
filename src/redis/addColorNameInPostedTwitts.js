const redis = require('./index');

module.exports = async (colorName) => {
  await redis.sadd('postedColors', colorName);
};
