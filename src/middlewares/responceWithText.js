const hexColorRegex = require('hex-color-regex');

const sendText = require('./../utils/twitter/sendText');
const addUserMessageToProposalsList = require(
    './../redis/addUserMessageToProposalsList'
);

const addUserMessageToFloodList = require(
    './../redis/addUserMessageToFloodList'
);

module.exports = async (T, tweet) => {
  const arrayText = tweet.text.split(' ');
  let validMessage = false;
  const message = arrayText;
  for (const i of message) {
    if (hexColorRegex().test(i)) {
      validMessage = true;
      break;
    }
  }
  const screenName = tweet.user.screen_name;
  if (validMessage) {
    await addUserMessageToProposalsList(`${tweet.user.screen_name} -> ${tweet.text}`);
    sendText(T, {
      status: `@${screenName} Thanks for your submission! Your color-name will be reviewed by a bunch of parrots and will end up in the color list soon`,
    });
  } else {
    await addUserMessageToFloodList(`${tweet.user.screen_name} -> ${tweet.text}`);
    sendText(T, {
      status: `@${screenName} What?! You need to give me a Name and a color as a hex value...`,
    });
  }
};
