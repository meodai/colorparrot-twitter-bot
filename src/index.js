const options = {};
if (process.env.NODE_ENV === "development") {
  options.path = ".env.development";
}
require("dotenv").config(options);

const Redis = require("ioredis");
const Twitt = require("twit");
const config = require("./config");

const Images = require("./images");
const { Middleware, Middlewares } = require("./middlewares");
const { Database } = require("./database");

const {
  RedisDB,
  Twitter: {
    Twit,
  },
} = require("./utils");

/**
 *
 */
async function initialize() {
  const redis = new RedisDB(
    new Redis(config.REDIS_URL, {
      retryStrategy: (times) => {
        if (times > 3) {
          console.log("cannot connect to redis");
          process.exit(1);
        }
        return 5000; // ms
      },
    })
  );

  const db = new Database("mongodb", config.MONGODB_URI);

  // connect to the database
  try {
    await db.connect();
    console.log("db connected");
  } catch (e) {
    // TODO: handle?
    console.log(e);
    return;
  }

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
    console.log("sending a random image");
    return Images.sendRandomImage(T, db, redis);
  }

  /**
   * Handles an incoming request
   * @param {mongoose.Document} req The mongoose document for the request
   * @param {string} tweetId
   */
  const handleIncomingTweet = async (req, tweetId) => {
    const tweet = await T.getTweetByID(tweetId);
    const middleware = new Middleware(T, tweet, db, redis);

    console.log({
      msg: tweet.getUserTweet(),
      user: tweet.getUserName(),
    });

    tweet._reqId = req._id;

    // 1) Check if bot mentioned itself, if not continue
    middleware.use(Middlewares.checkIfSelf);

    // 2) Ignore if its a retweet
    middleware.use(Middlewares.checkMessageType);

    // 3) If its a reply and the user thanks the bot reply something
    // and end it here
    middleware.use(Middlewares.replyThankYou);

    // 4) Check if user wants "more" colors, and respond with an image
    middleware.use(Middlewares.getFullImagePalette);

    // 5) if an image is found in the tweet, get colors an return a palette
    middleware.use(Middlewares.getImage);

    // 6) checks if user wants to know the name of a hex color
    middleware.use(Middlewares.getColorName);

    // 7) finally if the tweet contains an image, extract its colors
    middleware.use(Middlewares.getImageColor);

    // 8) the bot exhausted all of its possiblities
    // there must always be a next, fn
    middleware.use(async () => {
      console.log("The bot did nothing. :(");
      await db.resolveRequest(req._id);
    });

    middleware.run();
  };

  /**
   * Retries fulfulling requests that failed. It schedules a next retry
   * automatically after it's done. This ensures that no two retry processes
   * interrupt each other.
   */
  const retryFailedRequests = async () => {
    const requests = await db.getFailedRequests();
    const next = async () => {
      if (!requests.length) return;
      const req = requests.pop();
      try {
        await handleIncomingTweet(req, req.tweet_id);
      } catch (e) {
        console.log("an error occured while retrying failed request %s:\n %s", req._id, e);
      } finally {
        await next();
      }
    };

    try {
      await next();
    } catch (e) {
      console.log("an error occured while retrying failed requests:", e);
    } finally {
      setTimeout(retryFailedRequests, 1000 * 60);
    }
  };

  const stream = T.statusesFilterStream("@color_parrot");

  stream.on("tweet", async (tweet) => {
    const tweetId = tweet.id_str;
    let req;
    console.log("new tweet:", tweetId);
    try {
      req = await db.createRequest(tweetId);
    } catch (e) {
      console.log("error occured while creating a new request:", e);
      return;
    }
    await handleIncomingTweet(req, tweetId);
  });

  //eventStream.on("favorite", async (eventMsg) => console.log(eventMsg));

  /**
   * Calculates the difference between now and the next random post time
   * @returns {Promise<number>}
   */
  const calcRandomScheduleTimeDiff = async () => {
    const lastRandomPostTime = await redis.getLastRandomPostTime();
    if (!lastRandomPostTime) return 0;
    const nextTime = Number(lastRandomPostTime) + config.RANDOM_COLOR_DELAY;
    const diff = nextTime - new Date().getTime();
    return diff;
  };

  const postRandomTweet = async () => {
    const diff = await calcRandomScheduleTimeDiff();
    // only send if we're ahead of the next random post time
    if (diff <= 0) {
      try {
        const sent = await sendNow();
        if (sent) {
          await redis.updateLastRandomPostTime();
        }
      } catch (e) {
        console.log(e);
      }
    }
  };

  const startTimers = () => {
    setInterval(postRandomTweet, 1000 * 60);
    //setTimeout(retryFailedRequests, 1000 * 60);
  };

  // timers
  Promise.all([postRandomTweet() /*, retryFailedRequests() */])
    .then(() => startTimers())
    .catch(() => startTimers());

  console.log("color parrot started");
}

initialize();
