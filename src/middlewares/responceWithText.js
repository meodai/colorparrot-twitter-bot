const hexColorRegex = require('hex-color-regex');

const addUserMessageToProposalsList = require(
    './../redis/addUserMessageToProposalsList'
);

const addUserMessageToFloodList = require(
    './../redis/addUserMessageToFloodList'
);

module.exports = (T, tweet) => {
  const arrayText = tweet.text.split(' ');
  let validMessage = false;
  const message = arrayText;
  for (const i of message) {
    if (hexColorRegex().test(i)) {
      validMessage = true;
      break;
    }
  }
  if (validMessage) {
    addUserMessageToProposalsList(`${tweet.user.screen_name} -> ${tweet.text}`);
  } else {
    addUserMessageToFloodList(`${tweet.user.screen_name} -> ${tweet.text}`);
  }
};
