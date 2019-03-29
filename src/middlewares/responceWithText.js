const hexColorRegex = require('hex-color-regex');
const namedColors = require('color-name-list');
const namedColorsMap = new Map();
namedColors.forEach((e) => {
  namedColorsMap.set(e.hex, e.name);
});

const sendText = require('./../utils/twitter/sendText');
const addUserMessageToProposalsList = require(
    './../redis/addUserMessageToProposalsList'
);

const addUserMessageToFloodList = require(
    './../redis/addUserMessageToFloodList'
);

module.exports = async (T, tweet) => {
  const userMessageArray = tweet.text.split(' ');
  let validMessage = false;
  let hex;
  for (const i of userMessageArray) {
    if (hexColorRegex().test(i)) {
      hex = i;
      validMessage = true;
      break;
    }
  }
  const screenName = tweet.user.screen_name;
  if (validMessage) {
    /*
      if user's message contains valid hex value
     */
    if (namedColorsMap.get(hex)) {
      sendText(
          T,
          {
            status: `@${screenName} Darn! ${hex} is taken already. Try ` +
            `shifting the values a bit and try again`,
          },
      );
    } else {
      sendText(
          T,
          {
            status: `@${screenName} Thanks for your submission! ` +
            `Your color-name will be reviewed by a bunch of parrots ` +
            `and will end up in the color list soon. ${hex}`,
          },
          async () => {
            await addUserMessageToProposalsList(`${tweet.user.screen_name} ` +
            `-> ${tweet.text}`);
          }
      );
    }
  } else {
    const filteredMessage = userMessageArray
        .map((i) => (i.includes('@color_parrot') ? 'color_parrot' : i))
        .join(' ');
    sendText(
        T,
        {
          status: `@${screenName} What?! You need to give me a Name and ` +
        `a color as a hex value... --> ${filteredMessage}`,
        },
        async () => {
          await addUserMessageToFloodList(`${tweet.user.screen_name} ` +
            `-> ${tweet.text}`);
        },
    );
  }
};
