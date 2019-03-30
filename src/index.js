const Twit = require('./twitter/Twit');
const Tweet = require('./twitter/Tweet');
const config = require('./config/default');
const Middleware = require('./utils/middlewareClass');
const sendImageMiddleware = require(
    './middlewares/sendImageMiddleware'
);
const checkIfMessageTypeIsRetweet = require(
    './middlewares/checkIfMessageTypeIsRetweet'
);
const proposalAndFloodMiddleware = require(
    './middlewares/proposalAndFloodMiddleware'
);
const db = require('./db/RedisDB');
const sendRandomImage = require('./utils/twitter/sendRandomImage');

const T = new Twit();


setInterval(() => {
  sendRandomImage(T, db).catch((e) => console.log(e));
}, config.RANDOM_COLOR_DELAY);


const stream = T.statusesFilterStream('@color_parrot');


stream.on('tweet', async (tweet) => {
  tweet = new Tweet(tweet);
  const middleware = new Middleware(T, tweet, db);
  middleware.use(checkIfMessageTypeIsRetweet);
  middleware.use(sendImageMiddleware);
  middleware.use(proposalAndFloodMiddleware);
  middleware.run();
});

console.log('bot started work');
