const Twit = require('twit');
const namedColors = require('color-name-list');
const namedColorsMap = new Map();
namedColors.forEach((e) => {
  namedColorsMap.set(e.name, e.hex);
});

const sendRandomImage = require('./sendRandomImage');
const sendImageToUser = require('./sendImageToUser');
const generateImage = require('./utils/generateImage');
const sendText = require('./utils/twitter/sendText');
const checkIfColorExistsInTwitts = require('./redis/checkIfColorExistsInTwitts');
const addColorNameInPostedTwitts = require('./redis/addColorNameInPostedTwitts');

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

stream.on('tweet', async (tweet) => {
  let arrayText = tweet.text.split(' ');
  if (arrayText[0] === '@color_parrot' ||
    arrayText[arrayText.length - 1] === '@color_parrot'
  ) {
    arrayText.splice(arrayText.indexOf('@color_parrot'), 1);
    const colorName = arrayText.join(' ');
    if (namedColorsMap.get(colorName)) {
      const hex = namedColorsMap.get(colorName);
      const img = generateImage({
        name: colorName,
        hex: hex});
      const screenName = tweet.user.screen_name;
      if (await checkIfColorExistsInTwitts(colorName)) {
        sendText(T, `@${screenName} Posted already see: hex ${hex}`);
      } else {
        await sendImageToUser(T, img, `For @${screenName} hex: ${hex}`);
        await addColorNameInPostedTwitts(colorName);
      }
    } else {
      console.log('flood');
    }
  }
});

console.log('bot started work');
