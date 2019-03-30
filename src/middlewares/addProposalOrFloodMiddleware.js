/*
  add user tweet to proposals or flood list
 */
const hexColorRegex = require('hex-color-regex');
const namedColors = require('color-name-list');
const namedColorsMap = new Map();
namedColors.forEach((e) => {
  namedColorsMap.set(e.hex, e.name);
});

module.exports = async (T, tweet, next, db) => {
  const userMessageArray = tweet.getUserTweet().split(' ');
  let validMessage = false;
  let hex;
  for (const i of userMessageArray) {
    if (hexColorRegex().test(i)) {
      hex = i;
      validMessage = true;
      break;
    }
  }
  const screenName = tweet.getUserName();
  if (validMessage) {
    if (namedColorsMap.get(hex)) {
      T.statusesUpdate({
        status: `@${screenName} Darn! ${hex} is taken already. Try ` +
          `shifting the values a bit and try again`,
      });
    } else {
      await T.statusesUpdate({
        status: `@${screenName} Thanks for your submission! ` +
          `Your color-name will be reviewed by a bunch of parrots ` +
          `and will end up in the color list soon. ${hex}`,
      });

      await db.addUserMessageToProposalsList(
          `${tweet.getUserName()} ` +
          `-> ${tweet.getUserTweet()}`
      );
    }
  } else {
    const filteredMessage = userMessageArray
        .map((i) => (i.includes('@color_parrot') ? 'color_parrot' : i))
        .join(' ');

    await T.statusesUpdate({
      status: `@${screenName} What?! You need to give me a Name and ` +
        `a color as a hex value... --> ${filteredMessage}. And if you want ` +
        `to know the name of color just ask me: What if the name of #hex`,
    });

    await db.addUserMessageToFloodList(`${tweet.getUserName()} ` +
      `-> ${tweet.getUserTweet()}`);
  }
};
