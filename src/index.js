const Twit = require('./twitter/Twit');
const Tweet = require('./twitter/Tweet');
const config = require('./config');
const Middleware = require('./utils/middlewareClass');
const db = require('./db/RedisDB');
const sendRandomImage = require('./utils/twitter/sendRandomImage');

const {
  Middlewares
} = require("./utils");


/**
 * 
 */
function initialize() {
  const T = new Twit();

  /**
   * sends a random tweet
   */
  function sendNow() {
    sendRandomImage(T, db).catch((e) => console.log(e));
    console.log('sending a random image');
  }

  setInterval(sendNow, config.RANDOM_COLOR_DELAY);


  const stream = T.statusesFilterStream('@color_parrot');

  stream.on('tweet', async (tweet) => {
    tweet = new Tweet(tweet);
    const middleware = new Middleware(T, tweet, db);
    middleware.use(Middlewares.checkMessageType);
    middleware.use(Middlewares.getImage);
    middleware.use(Middlewares.getColorName);
    middleware.use(Middlewares.addProposalOrFlood);
    middleware.run();
  });

  console.log('color parrot started');
}

initialize();