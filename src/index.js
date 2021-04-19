const options = {};
if (process.env.NODE_ENV === "development") {
  options.path = ".env.development";
}
require('dotenv').config(options);

const Redis = require('ioredis');
const Twitt = require('twit');
const config = require('./config');

const Images = require('./images');
const {Middleware, Middlewares} = require('./middlewares');

const {
  RedisDB,
  Twitter: {
    Twit,
    Tweet,
  },
} = require('./utils');

/**
 *
 */
function initialize() {
  const db = new RedisDB(
      new Redis(config.REDIS_URL, {
        retryStrategy: (times) => {
          if (times > 3) {
            console.log('cannot connect to redis');
            process.exit(1);
          }
          return 5000; // ms
        },
      })
  );

  const T = new Twit(
      new Twitt({
        consumer_key: config.CONSUMER_KEY,
        consumer_secret: config.CONSUMER_SECRET,
        access_token: config.ACCESS_TOKEN,
        access_token_secret: config.ACCESS_TOKEN_SECRET,
      })
  );

  /**
   * sends a random tweet
   */
  function sendNow() {
    Images.sendRandomImage(T, db).catch((e) => console.log(e));
    console.log('sending a random image');
  }

  setInterval(sendNow, config.RANDOM_COLOR_DELAY);

  const stream = T.statusesFilterStream('@color_parrot');

  stream.on('tweet', async (tweet) => {
    tweet = await T.getTweetByID(tweet.id_str);
    const middleware = new Middleware(T, tweet, db);

    console.log({
      msg: tweet.getUserTweet(),
      user: tweet.getUserName(),
    });

    middleware.use(Middlewares.checkIfSelf);
    middleware.use(Middlewares.checkMessageType);
    middleware.use(Middlewares.getImageColor);
    middleware.use(Middlewares.getFullImagePalette);
    middleware.use(Middlewares.getImage);
    middleware.use(Middlewares.getColorName);
    middleware.use(Middlewares.addProposalOrFlood);

    middleware.run();
  });

  console.log('color parrot started');
}

initialize();
