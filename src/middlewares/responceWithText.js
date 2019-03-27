const hexColorRegex = require('hex-color-regex');

const sendText = require('./../utils/twitter/sendText');
const addUserMessageToProposalsList = require(
    './../redis/addUserMessageToProposalsList'
);

const addUserMessageToFloodList = require(
    './../redis/addUserMessageToFloodList'
);

module.exports = async (T, tweet) => {
  const arrayText = tweet.text.split(' '); // user message
  let validMessage = false;
  let hashTag;
  for (const i of arrayText) {
    if (hexColorRegex().test(i)) {
      hashTag = i;
      validMessage = true;
      break;
    }
  }
  const screenName = tweet.user.screen_name;
  if (validMessage) {
    await addUserMessageToProposalsList(`${tweet.user.screen_name} ` +
      `-> ${tweet.text}`);
    sendText(T, {
      status: `@${screenName} Thanks for your submission! ` +
        `Your color-name will be reviewed by a bunch of parrots ` +
        `and will end up in the color list soon. ${hashTag}`,
    });
  } else {
    await addUserMessageToFloodList(`${tweet.user.screen_name} ` +
      `-> ${tweet.text}`);
    const filteredMessage = arrayText.filter((i) => i !== '@color_parrot')
        .join(' ');
    sendText(T, {
      status: `@${screenName} I do not understand you --> ${filteredMessage}`,
    });
  }
};
