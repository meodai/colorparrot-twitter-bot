const parseNumber = (val, defaultVal) => {
  const num = Number(val);
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return defaultVal;
  }
  return num;
};

module.exports = {
  CONSUMER_KEY: process.env.CONSUMER_KEY,
  CONSUMER_SECRET: process.env.CONSUMER_SECRET,
  ACCESS_TOKEN: process.env.ACCESS_TOKEN,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  RANDOM_COLOR_DELAY: parseNumber(process.env.RANDOM_COLOR_DELAY, 3600000),
  MAX_PALETTE_COLORS: parseNumber(process.env.MAX_PALETTE_COLORS, 9),
  MAX_USER_COLOR_COUNT: parseNumber(process.env.MAX_USER_COLOR_COUNT, 32),
  INITIAL_PALETTE_COLOR_COUNT: parseNumber(process.env.INITIAL_PALETTE_COLOR_COUNT, 9),
  REDIS_URL: process.env.REDIS_URL,
  TWITTER_BOT_USERNAME: process.env.TWITTER_BOT_USERNAME,
};
