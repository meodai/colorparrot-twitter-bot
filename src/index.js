const Twit = require('twit');
const config = require('./config/default');
const Middleware = require('./utils/middlewareClass');
const responseWithImage = require(
    './middlewares/responseWithImage'
);

const checkIfMessageTypeIsRetweet = require(
    './middlewares/checkIfMessageTypeIsRetweet'
);
const responseWithText = require('./middlewares/responceWithText');
const sendRandomImage = require('./utils/twitter/sendRandomImage');

const T = new Twit({
  consumer_key: config.CONSUMER_KEY,
  consumer_secret: config.CONSUMER_SECRET,
  access_token: config.ACCESS_TOKEN,
  access_token_secret: config.ACCESS_TOKEN_SECRET,
});


setInterval(() => {
  sendRandomImage(T).catch((e) => console.log(e));
}, config.RANDOM_COLOR_DELAY);


const stream = T.stream('statuses/filter', {
  track: '@color_parrot', language: 'en',
});


stream.on('tweet', async (tweet) => {
  const middleware = new Middleware(T, tweet);
  middleware.use(checkIfMessageTypeIsRetweet);
  middleware.use(responseWithImage);
  middleware.use(responseWithText);
  middleware.run();
});

console.log('bot started work');
