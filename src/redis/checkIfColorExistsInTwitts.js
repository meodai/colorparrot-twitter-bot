const redis = require('./index');

module.exports = async (colorObj) => {
  return await redis.sismember('postedColors', colorObj.name);
};
