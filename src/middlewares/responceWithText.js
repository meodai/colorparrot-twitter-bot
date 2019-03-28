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
    sendText(
        T,
        {
          status: `@${screenName} Thanks for your submission! ` +
          `Your color-name will be reviewed by a bunch of parrots ` +
          `and will end up in the color list soon. ${hashTag}`,
        },
        async () => {
          await addUserMessageToProposalsList(`${tweet.user.screen_name} ` +
            `-> ${tweet.text}`);
        },
        true
    );
  } else {
    const filteredMessage = arrayText.filter((i) => i !== '@color_parrot')
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
        true
    );
  }
};
