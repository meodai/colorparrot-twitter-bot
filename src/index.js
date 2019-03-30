const Twit = require('./twitter/Twit');
const Tweet = require('./twitter/Tweet');
const config = require('./config/default');
const Middleware = require('./utils/middlewareClass');
const getImageMiddleware = require(
    './middlewares/getImageMiddleware'
);
const checkMessageTypeMiddleware = require(
    './middlewares/checkMessageTypeMiddleware'
);
const addProposalOrFloodMiddleware = require(
    './middlewares/addProposalOrFloodMiddleware'
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
  middleware.use(checkMessageTypeMiddleware);
  middleware.use(getImageMiddleware);
  middleware.use(addProposalOrFloodMiddleware);
  middleware.run();
});

console.log('bot started work');
