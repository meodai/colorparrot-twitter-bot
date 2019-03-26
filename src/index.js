const Twit = require('twit');
const responseWithImage = require('./middlewares/responseWithImage');
const responceWithText = require('./middlewares/responceWithText');


const T = new Twit({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
});

/*
setInterval(() => {
  sendRandomImage(T).catch((e) => console.log(e));
}, 60000);
*/

const stream = T.stream('statuses/filter', {
  track: '@color_parrot', language: 'en',
});

stream.on('disconnect', (disconnectMessage) => {
  console.log(disconnectMessage);
});

stream.on('tweet', async (tweet) => {
  await responseWithImage(T, tweet);
  await responceWithText(T, tweet);
});

console.log('bot started work');
