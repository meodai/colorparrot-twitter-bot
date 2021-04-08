const fs = require('fs');
const hexColorRegex = require('hex-color-regex');

const Color = require('./color');
const Images = require('./images');
const {Templates, buildMessage} = require('./templates');

const hexArrToURLStr = arr => arr.toString().replace(/(,#)/g, '-').replace(/^#/, '');
const palleteArrToHexArr = arr => arr.map(c => c.hex);

/**
 * Middleware provides functionality to implement middleware-style control
 * flow
 * @class
 */
class Middleware {
  constructor(T, tweet, db) {
    this.T = T;
    this.tweet = tweet;
    this.db = db;
    this.listOfMiddlewares = [];
  }

  /**
   * Register middleware
   * @param {function} f - function or asyncFunction.
   */
  use(f) {
    this.listOfMiddlewares.push(f);
  }

  /**
   * Run chain of middlewares, starting from the first
   */
  run() {
    for (let i = 0; i < this.listOfMiddlewares.length; i++) {
      const f = this.listOfMiddlewares[i];
      let func;
      if (f.constructor.name === 'Function') {
        func = () => {
          try {
            f(this.T, this.tweet, this.listOfMiddlewares[i + 1], this.db);
          } catch (e) {
            console.log(e);
          }
        };
      } else if (f.constructor.name === 'AsyncFunction') {
        func = async () => {
          await f(
              this.T,
              this.tweet,
              this.listOfMiddlewares[i + 1],
              this.db
          ).catch((e) => console.log(e));
        };
      }
      this.listOfMiddlewares[i] = func;
    }
    this.listOfMiddlewares[0]();
  }
}

const Middlewares = {};

/**
 * get image by color name
 * @param {*} T
 * @param {*} tweet
 * @param {function} next
 */
Middlewares.getImage = async (T, tweet, next) => {
  const userMessageArray = tweet.getUserTweet().split(' ');
  if (
    userMessageArray[0] === '@color_parrot' ||
    userMessageArray[userMessageArray.length - 1] === '@color_parrot'
  ) {
    userMessageArray.splice(userMessageArray.indexOf('@color_parrot'), 1);
    const colorName = userMessageArray.join(' ');
    const existingColor = await Color.getColorFromName(colorName);
    if (existingColor) {
      const {hex} = existingColor;
      const imgBuff = Images.generateImage({
        name: colorName,
        hex: hex,
      });
      const screenName = tweet.getUserName();
      const hashTag = colorName.split(' ').join('_');
      const imgBase64 = Images.convertImagebuffTobase64(imgBuff);
      const mediaIdString = await T.mediaUpload(imgBase64);
      await T.statusesUpdate({
        status: buildMessage(Templates.IMAGE_RESPONSE, {
          screenName,
          hashTag,
        }),
        media_ids: mediaIdString,
        in_reply_to_status_id: tweet.getStatusID(),
      });
    } else {
      await next();
    }
  } else {
    await next();
  }
};

const isGetImageColorCommand = (userMessage) => {
  const msg = userMessage.replace(/ {2}/g, ' ').toLowerCase();

  return !(
    !msg.includes('what color is this') &&
    !msg.includes('what colour is this') &&
    !msg.includes('what is this color') &&
    !msg.includes('what is this colour') &&
    !msg.includes('what are those colors') &&
    !msg.includes('what are those colours') &&
    !msg.includes('what colors are in this') &&
    !msg.includes('what colours are in this') &&
    !msg.includes('what is the dominant color') &&
    !msg.includes('what are the colors') &&
    !msg.includes('what are the colours') &&
    !msg.includes('what colors are in this picture') &&
    !msg.includes('what colours are in this picture')
  )
};

/**
 * grabs the color palette from an image
 * @param {*} T
 * @param {*} tweet
 * @param {function} next
 */
Middlewares.getImageColor = async (T, tweet, next, db) => {
  const screenName = tweet.getUserName();

  if (!isGetImageColorCommand(tweet.getUserTweet())) {
    await next();
    return;
  }

  let ref = null;
  if (tweet.getMediaURL('photo') || tweet.getMediaURL('animated_gif')) {
    ref = tweet.getStatusID();
  } else if (tweet.isQuotedTweet()) {
    ref = tweet.getQuotedTweet();
    if (ref) ref = ref.id_str;
  } else if (tweet.isReplyTweet()) {
    ref = tweet.getOriginalTweetID();
  }

  if (ref) {
    ref = await T.getTweetByID(ref);
  }

  if (!ref) {
    await T.statusesUpdate({
      status: buildMessage(Templates.REFERENCE_TWEET_NOT_FOUND, {
        screenName,
      }),
      in_reply_to_status_id: tweet.getStatusID(),
    });
    return;
  }

  const media = ref.getMediaURL('photo') || ref.getMediaURL('animated_gif');
  let imageURL = null;
  if (media) {
    imageURL = media['media_url_https'];
  }

  if (!imageURL) {
    try {
      console.log('No image url found: ', JSON.stringify(
          (ref._tweet.extended_entities || ref._tweet.entities)['media']
      ));
    } catch (error) {
      console.log('Error logging error haha :)');
      console.log({error});
    }

    await T.statusesUpdate({
      status: buildMessage(Templates.IMAGE_NOT_FOUND_IN_REFERENCE, {
        screenName,
      }),
      in_reply_to_status_id: tweet.getStatusID(),
    });
    return;
  }

  const startTime = Date.now();
  const palette = await Color.getPalette(imageURL, 9);
  const msElapsed = Date.now() - startTime;
  const sElapsed = Math.round((msElapsed/1000) * 100) / 100;

  const hexArr = palleteArrToHexArr(palette);
  const hexURLStr = hexArrToURLStr(hexArr);

  console.log(
      `it took ${sElapsed}s to generate the image`,
  );

  const generateAndUploadCollection = async (palette) => {
    const imgBuff = Images.generateCollection(palette);
    const imgBase64 = Images.convertImagebuffTobase64(imgBuff);
    const mediaIdString = await T.mediaUpload(imgBase64);
    return mediaIdString;
  };

  const mediaIdString = await generateAndUploadCollection(palette);
  await T.statusesUpdate({
    status: buildMessage(Templates.COLORS_IN_IMAGE, {
      screenName,
      mediaURL: media['url'],
      hexURLStr,
      sElapsed,
    }),
    media_ids: mediaIdString,
    in_reply_to_status_id: tweet.getStatusID(),
  });
};

/**
 * grabs the color palette from an image
 * @param {*} T
 * @param {*} tweet
 * @param {function} next
 */
Middlewares.getFullImagePalette = async (T, tweet, next, db) => {

  const screenName = tweet.getUserName();
  const userMessage = tweet.getUserTweet().replace(/ {2}/g, ' ').toLowerCase();

  if (!userMessage.includes('more')) {
    await next();
    return;
  }

  // abort if this tweet isn't a reply
  if (!tweet.isReplyTweet()) {
    await next();
    return;
  }

  const botTweet = await T.getTweetByID(tweet.getOriginalTweetID());
  const username = botTweet.getUserName();

  if (username !== 'color_parrot' || !botTweet.isReplyTweet()) {
    await next();
    return;
  }

  const getOriginalTweetWithMedia = async (start) => {
    let tweet = await T.getTweetByID(start.getOriginalTweetID());

    if (tweet.isQuotedTweet()) {
      const q = tweet.getQuotedTweet();

      if (q) {
        tweet = await T.getTweetByID(q.id_str);
      } else {
        tweet = null;
      }
    } else if (tweet.isReplyTweet()) {
      tweet = await getOriginalTweetWithMedia(tweet);
    }

    return tweet;
  };

  let originalTweet = await getOriginalTweetWithMedia(botTweet);

  if (!originalTweet) {
    await next();
    return;
  }

  let media = originalTweet.getMediaURL('photo')
    || originalTweet.getMediaURL('animated_gif');

  if (!media) {
    await next();
    return;
  }

  const imageURL = media['media_url_https'];

  const startTime = Date.now();
  const palette = await Color.getPalette(imageURL);
  const msElapsed = Date.now() - startTime;
  const sElapsed = Math.round((msElapsed/1000) * 100) / 100;

  const hexArr = palleteArrToHexArr(palette);
  const hexURLStr = hexArrToURLStr(hexArr);

  console.log(
      `it took ${sElapsed}s to generate the image`,
  );

  if (palette.length <= 9) {
    await T.statusesUpdate({
      status: buildMessage(Templates.NO_MORE_COLORS_IN_IMAGE, {
        screenName,
        mediaURL: media['url'],
        hexURLStr,
        sElapsed,
      }),
      in_reply_to_status_id: tweet.getStatusID(),
    });
    return;
  }

  const generateAndUploadCollection = async (palette) => {
    const imgBuff = Images.generateCollection(palette);
    const imgBase64 = Images.convertImagebuffTobase64(imgBuff);
    const mediaIdString = await T.mediaUpload(imgBase64);
    return mediaIdString;
  };

  const mediaIdString = await generateAndUploadCollection(palette);
  await T.statusesUpdate({
    status: buildMessage(Templates.ALL_COLORS_IN_IMAGE, {
      screenName,
      mediaURL: media['url'],
      palette,
      sElapsed,
    }),
    media_ids: mediaIdString,
    in_reply_to_status_id: tweet.getStatusID(),
  });

};

/**
 * add user tweet to proposals or flood list
 * @param {*} T
 * @param {*} tweet
 * @param {function} next
 * @param {*} db
 */
Middlewares.addProposalOrFlood = async (T, tweet, next, db) => {
  const {namedColorsMap} = await Color.getNamedColors();

  const userMessageArray = tweet.getUserTweet().split(' ');
  let validMessage = false;
  let hex;

  for (const part of userMessageArray) {
    if (hexColorRegex().test(part)) {
      hex = part;
      validMessage = true;
      break;
    }
  }

  const screenName = tweet.getUserName();
  if (validMessage) {
    if (namedColorsMap.get(hex)) {
      await T.statusesUpdate({
        status: buildMessage(Templates.HEX_TAKEN, {
          screenName,
          hex,
        }),
        in_reply_to_status_id: tweet.getStatusID(),
      });
    } else {
      await T.statusesUpdate({
        status: buildMessage(Templates.PROPOSAL_ACCEPTED, {
          screenName,
          hex,
        }),
        in_reply_to_status_id: tweet.getStatusID(),
      });

      await db.addUserMessageToProposalsList(
          `${tweet.getUserName()} ` + `-> ${tweet.getUserTweet()}`
      );
    }
  } else {
    // const filteredMessage = userMessageArray
    //   .map((i) => (i.includes("@color_parrot") ? "color_parrot" : i))
    //   .join(" ");

    // await T.statusesUpdate({
    //   status: buildMessage(Templates.PROPOSAL_DENIED, {
    //     screenName,
    //     filteredMessage,
    //   }),
    //   in_reply_to_status_id: tweet.getStatusID(),
    // });

    await db.addUserMessageToFloodList(
        `${tweet.getUserName()} ` + `-> ${tweet.getUserTweet()}`
    );
  }
};

/**
 * if message is retweet. Do not respond
 * @param {*} T
 * @param {*} tweet
 * @param {function} next
 */
Middlewares.checkMessageType = (T, tweet, next) => {
  if (!tweet.getRetweetedStatus()) {
    next();
  }
};

Middlewares.getColorName = (function() {
  /**
   *
   * @param {*} uri
   * @param {*} filename
   * @param {function} callback
   */
  function download(uri, filename, callback) {
    request.head(uri, function(err, res, body) {
      console.log('content-type:', res.headers['content-type']);
      console.log('content-length:', res.headers['content-length']);

      request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
  }

  /**
   * Determines the color name for the specified hex value.
   * @param {*} T
   * @param {*} tweet
   * @param {function} next
   */
  return async (T, tweet, next) => {
    const {
      namedColors,
      namedColorsMap,
      closest,
    } = await Color.getNamedColors();

    const userMessageArray = tweet.getUserTweet().split(' ');
    const userImageURL = tweet.getUserPhoto();
    let validHex = false;
    let hex;
    let rgb;
    let color;
    let closestColor;
    const screenName = tweet.getUserName();

    if (userImageURL) {
      download(userImageURL);
    }

    const userTweet = tweet.getUserTweet().replace(/ {2}/g, ' ').toLowerCase();

    if (userTweet.includes('what is the name of')) {
      for (const c of userMessageArray) {
        if (hexColorRegex().test(c)) {
          const match = hexColorRegex().exec(c);
          if (!match) continue;

          hex = match[0];
          rgb = Color.hexToRgb(hex);
          validHex = true;

          break;
        }
      }
      if (!validHex && !userImageURL) {
        await next();
      } else if (namedColorsMap.get(hex)) {
        await T.statusesUpdate({
          status: buildMessage(Templates.EXACT_HEX_NAME_RESPONSE, {
            screenName,
            hex,
            colorName: namedColorsMap.get(hex),
          }),
          in_reply_to_status_id: tweet.getStatusID(),
        });
      } else {
        // get the closest named colors
        closestColor = closest.get([rgb.r, rgb.g, rgb.b]);
        color = namedColors[closestColor.index];

        await T.statusesUpdate({
          status: buildMessage(Templates.CLOSEST_HEX_NAME_RESPONSE, {
            screenName,
            hex,
            closestHex: color.hex,
            closestName: color.name,
          }),
          in_reply_to_status_id: tweet.getStatusID(),
        });
      }
    } else {
      await next();
    }
  };
})();

module.exports = {Middleware, Middlewares};
