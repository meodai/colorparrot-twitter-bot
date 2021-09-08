const fs = require("fs");
const request = require("request");
const hexColorRegex = require("hex-color-regex");

const Color = require("./color");
const config = require("./config");
const Images = require("./images");
const { Templates, buildMessage } = require("./templates");

const hexArrToURLStr = (arr) => arr.toString().replace(/(,#)/g, "-").replace(/^#/, "");
const palleteArrToHexArr = (arr) => arr.map((c) => c.hex);

/**
 * Middleware provides functionality to implement middleware-style control
 * flow
 * @class
 */
class Middleware {
  constructor(T, tweet, db, redis) {
    this.T = T;
    this.tweet = tweet;
    this.db = db;
    this.redis = redis;
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
    const fail = (e) => {
      console.log(e);

      // this need to be modified, it should only retry if the code was statusCode 403
      return this.db.failRequest(this.tweet.getRequestID())
        .catch((err) => console.log("an error occured while marking a request as failed:", err));
    };

    for (let i = 0; i < this.listOfMiddlewares.length; i++) {
      const f = this.listOfMiddlewares[i];
      let func;
      if (f.constructor.name === "Function") {
        func = () => {
          try {
            f(this.T, this.tweet, this.listOfMiddlewares[i + 1], this.db, this.redis);
          } catch (e) {
            fail(e);
          }
        };
      } else if (f.constructor.name === "AsyncFunction") {
        func = async () => {
          await f(
            this.T,
            this.tweet,
            this.listOfMiddlewares[i + 1],
            this.db,
            this.redis
          ).catch((e) => fail(e));
        };
      }
      this.listOfMiddlewares[i] = func;
    }
    this.listOfMiddlewares[0]();
  }
}

const Middlewares = {};

/**
 * checks if the tweet is from the bot itself
 * makes sure bot does not answers itself
 * @param {*} T
 * @param {*} tweet
 * @param {*} next
 */
Middlewares.checkIfSelf = async (T, tweet, next) => {
  const screenName = tweet.getUserName();
  if (screenName !== config.TWITTER_BOT_USERNAME) {
    next();
  } else {
    console.log("Bot mentioned itself.");
  }
};

/**
 * get image by color name
 * @param {*} T
 * @param {*} tweet
 * @param {function} next
 */
Middlewares.getImage = async (T, tweet, next, db) => {
  const userMessageArray = tweet.getUserTweet().split(" ");
  if (
    userMessageArray[0] === "@color_parrot"
    || userMessageArray[userMessageArray.length - 1] === "@color_parrot"
  ) {
    userMessageArray.splice(userMessageArray.indexOf("@color_parrot"), 1);
    const colorName = userMessageArray.join(" ");
    const existingColor = await Color.getColorFromName(colorName);
    if (existingColor) {
      const { hex } = existingColor;
      const imgBuff = Images.generateImage({
        name: colorName,
        hex,
      });
      const screenName = tweet.getUserName();
      const hashTag = colorName.split(" ").join("_");
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
      await db.resolveRequest(tweet.getRequestID());
    } else {
      await next();
    }
  } else {
    await next();
  }
};

const isGetImageColorCommand = (userMessage) => {
  const msg = userMessage.replace(/ {2}/g, " ").toLowerCase();

  return !(
    !msg.includes("what color is this")
    && !msg.includes("what colour is this")
    && !msg.includes("what color is that")
    && !msg.includes("what colour is that")
    && !msg.includes("what is this color")
    && !msg.includes("what is this colour")
    && !msg.includes("what is that color")
    && !msg.includes("what is that colour")
    && !msg.includes("what are those colors")
    && !msg.includes("what are those colours")
    && !msg.includes("what colors are in this")
    && !msg.includes("what colours are in this")
    && !msg.includes("what is the dominant color")
    && !msg.includes("what are the colors")
    && !msg.includes("what are the colours")
    && !msg.includes("what colors are in this picture")
    && !msg.includes("what colours are in this picture")
    && !msg.includes("what colors are these")
    && !msg.includes("what colours are these")
    && !msg.includes("what colors are those")
    && !msg.includes("what colours are those")
    && !msg.includes("what are these colors")
    && !msg.includes("what are these colours")
  );
};

/**
 * Strips a tweet of unnecessary entities
 * @param {string} userMessage - the tweet's content
 * @returns {string}
 */
const stripUserMessage = (userMessage) => userMessage
  // remove user mentions
  .replace(/@\S+/g, "")
  // remove URLs
  .replace(/https?:\/\/\S*/gi, "")
  // remove extra spaces
  .replace(/ {2}/g, " ")
  .trim()
  .toLowerCase();

const checkIfTweetIsEmpty = (userMessage) => stripUserMessage(userMessage) === "";

const checkIfTweetHasMedia = (tweet) => {
  const photos = tweet.getAllMediaOfType("photo");
  const gifs = tweet.getAllMediaOfType("animated_gif");
  return photos.length + gifs.length > 0;
};

/**
 * grabs the color palette from an image
 * @param {*} T
 * @param {*} tweet
 * @param {function} next
 */
Middlewares.getImageColor = async (T, tweet, next, db, redis) => {
  const screenName = tweet.getUserName();
  const userMessage = tweet.getUserTweet();
  const strippedMessage = stripUserMessage(userMessage);

  let ref = null;
  if (checkIfTweetHasMedia(tweet)) {
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
    await db.resolveRequest(tweet.getRequestID());
    return;
  }

  const photos = ref.getAllMediaOfType("photo");
  const gifs = ref.getAllMediaOfType("animated_gif");
  const allMedia = photos.concat(gifs);
  const allMediaURLs = allMedia.map((media) => media.media_url_https);
  const mediaCount = allMediaURLs.length;

  const noImagesFound = async () => {
    try {
      console.log("No image url found: ", JSON.stringify(
        (ref._tweet.extended_entities || ref._tweet.entities).media
      ));
    } catch (error) {
      console.log("Error logging error haha :)");
      console.log({ error });
    }

    /*
    await T.statusesUpdate({
      status: buildMessage(Templates.IMAGE_NOT_FOUND_IN_REFERENCE, {
        screenName,
      }),
      in_reply_to_status_id: tweet.getStatusID(),
    });
    */

    await db.resolveRequest(tweet.getRequestID());
  };

  const tweetIsEmpty = checkIfTweetIsEmpty(userMessage);
  const hasMedia = mediaCount > 0;

  // abort if there isn't any media
  if (!hasMedia) {
    await noImagesFound();
    return;
  }

  let colorCount = config.INITIAL_PALETTE_COLOR_COUNT;
  if (!tweetIsEmpty) {
    const match = /\d+/.exec(strippedMessage);
    if (match) {
      colorCount = Math.min(parseInt(match[0], 10), config.MAX_USER_COLOR_COUNT);
    }
  }

  // abort if command not recognized and tweet isn't empty
  if (!isGetImageColorCommand(userMessage)) {
    // abort if the tweet is not empty and doesn't contain
    // only numbers
    if (!tweetIsEmpty && !/^\d+$/.test(strippedMessage)) {
      await next();
      return;
    }
  }

  const startTime = Date.now();
  const paletteWorkers = allMediaURLs.map((url) => Color.getPalette(url, colorCount));
  const palettes = await Promise.all(paletteWorkers);
  const msElapsed = Date.now() - startTime;
  const sElapsed = Math.round((msElapsed / 1000) * 100) / 100;

  const hexArrays = palettes.map((palette) => palleteArrToHexArr(palette));
  const hexURLStrings = hexArrays.map((hexArr) => hexArrToURLStr(hexArr));

  console.log(
    `it took ${sElapsed}s to generate the images`,
  );

  const generateAndUploadCollection = async (palette) => {
    const imgBuff = Images.generateCollection(palette);
    const imgBase64 = Images.convertImagebuffTobase64(imgBuff);
    const mediaIdString = await T.mediaUpload(imgBase64);
    return mediaIdString;
  };

  const uploadWorkers = palettes.map((palette) => generateAndUploadCollection(palette));
  const mediaIds = await Promise.all(uploadWorkers);

  await T.statusesUpdate({
    status: buildMessage(Templates.COLORS_IN_IMAGE, {
      screenName,
      hexURLStrings,
      sElapsed,
    }),
    media_ids: mediaIds,
    in_reply_to_status_id: tweet.getStatusID(),
  });

  await db.resolveRequest(tweet.getRequestID());
};

/**
 * grabs the color palette from an image
 * @param {*} T
 * @param {*} tweet
 * @param {function} next
 */
Middlewares.getFullImagePalette = async (T, tweet, next, db, redis) => {
  const screenName = tweet.getUserName();
  const userMessage = tweet.getUserTweet().replace(/ {2}/g, " ").toLowerCase();

  if (!userMessage.includes("more")) {
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

  if (username !== config.TWITTER_BOT_USERNAME) {
    await next();
    return;
  }

  const getOriginalTweetWithMedia = async (start) => {
    let tweet = await T.getTweetByID(start.getOriginalTweetID());

    if (!checkIfTweetHasMedia(tweet)) {
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
    }

    return tweet;
  };

  const originalTweet = await getOriginalTweetWithMedia(botTweet);

  if (!originalTweet) {
    await next();
    return;
  }

  const photos = originalTweet.getAllMediaOfType("photo");
  const gifs = originalTweet.getAllMediaOfType("animated_gif");
  const allMedia = photos.concat(gifs);
  if (allMedia.length === 0) {
    await next();
    return;
  }

  const imageURLs = allMedia.map((media) => media.media_url_https);

  const startTime = Date.now();
  const paletteWorkers = imageURLs.map((url) => Color.getPalette(url));
  const palettes = await Promise.all(paletteWorkers);
  const msElapsed = Date.now() - startTime;
  const sElapsed = Math.round((msElapsed / 1000) * 100) / 100;

  const hexArrays = palettes.map((palette) => palleteArrToHexArr(palette));
  const hexURLStrings = hexArrays.map((hexArr) => hexArrToURLStr(hexArr));

  console.log(
    `it took ${sElapsed}s to generate the image`,
  );

  const validPalettes = palettes.filter((palette) => palette.length > 9);

  if (validPalettes.length === 0) {
    await T.statusesUpdate({
      status: buildMessage(Templates.NO_MORE_COLORS_IN_IMAGE, {
        screenName,
        hexURLStrings,
        sElapsed,
      }),
      in_reply_to_status_id: tweet.getStatusID(),
    });
    await db.resolveRequest(tweet.getRequestID());
    return;
  }

  const generateAndUploadCollection = async (palette) => {
    const imgBuff = Images.generateCollection(palette);
    const imgBase64 = Images.convertImagebuffTobase64(imgBuff);
    const mediaIdString = await T.mediaUpload(imgBase64);
    return mediaIdString;
  };

  const uploadWorkers = validPalettes.map((palette) => generateAndUploadCollection(palette));
  const mediaIds = await Promise.all(uploadWorkers);

  await T.statusesUpdate({
    status: buildMessage(Templates.ALL_COLORS_IN_IMAGE, {
      screenName,
      palettes: validPalettes,
      sElapsed,
    }),
    media_ids: mediaIds,
    in_reply_to_status_id: tweet.getStatusID(),
  });

  await db.resolveRequest(tweet.getRequestID());
};

const isThankYouMessage = (msg) => {
  const queries = [
    "thank you",
    "thanks",
    "ty",
    "merci",
    "danke",
    "thank"
  ];
  return queries.some((query) => msg.includes(query));
};

/**
 * grabs the color palette from an image
 * @param {*} T
 * @param {*} tweet
 * @param {function} next
 */
Middlewares.replyThankYou = async (T, tweet, next, db, redis) => {
  const screenName = tweet.getUserName();
  const userMessage = tweet.getUserTweet()
    .replace(/ {2}/g, " ").toLowerCase();

  // abort if this tweet isn't a reply
  if (!tweet.isReplyTweet()) {
    await next();
    return;
  }

  if (!isThankYouMessage(userMessage)) {
    await next();
    return;
  }

  const botTweet = await T.getTweetByID(tweet.getOriginalTweetID());
  const username = botTweet.getUserName();

  if (username !== config.TWITTER_BOT_USERNAME) {
    // abort if it's not a reply to the bot
    await next();
    return;
  }

  await T.statusesUpdate({
    status: buildMessage(Templates.THANK_YOU_REPLY, {
      screenName,
    }),
    in_reply_to_status_id: tweet.getStatusID(),
  });

  await db.resolveRequest(tweet.getRequestID());
};

/**
 * add user tweet to proposals or flood list
 * @param {*} T
 * @param {*} tweet
 * @param {function} next
 * @param {*} redis
 */
Middlewares.addProposalOrFlood = async (T, tweet, next, db, redis) => {
  const { namedColorsMap } = await Color.getNamedColors();

  const userMessageArray = tweet.getUserTweet().split(" ");
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

      await redis.addUserMessageToProposalsList(
        `${tweet.getUserName()} -> ${tweet.getUserTweet()}`
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

    await redis.addUserMessageToFloodList(
      `${tweet.getUserName()} -> ${tweet.getUserTweet()}`
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
    request.head(uri, (err, res, body) => {
      console.log("content-type:", res.headers["content-type"]);
      console.log("content-length:", res.headers["content-length"]);

      request(uri).pipe(fs.createWriteStream(filename)).on("close", callback);
    });
  }

  /**
   * Determines the color name for the specified hex value.
   * @param {*} T
   * @param {*} tweet
   * @param {function} next
   */
  return async (T, tweet, next, db) => {
    const {
      namedColorsMap,
      findColors,
    } = await Color.getNamedColors();

    const userMessageArray = tweet.getUserTweet().split(" ");
    const userImageURL = tweet.getUserPhoto();
    let validHex = false;
    let hex;
    let rgb;
    let color;
    const screenName = tweet.getUserName();

    if (userImageURL) {
      download(userImageURL);
    }

    const userTweet = tweet.getUserTweet().replace(/ {2}/g, " ").toLowerCase();

    if (
      userTweet.includes("what is the name of")
      || userTweet.includes("what's the name of")
    ) {
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
        await db.resolveRequest(tweet.getRequestID());
      } else {
        // get the closest named colors
        color = findColors.getNamesForValues([rgb.r, rgb.g, rgb.b]);

        await T.statusesUpdate({
          status: buildMessage(Templates.CLOSEST_HEX_NAME_RESPONSE, {
            screenName,
            hex,
            closestHex: color.hex,
            closestName: color.name,
          }),
          in_reply_to_status_id: tweet.getStatusID(),
        });

        await db.resolveRequest(tweet.getRequestID());
      }
    } else {
      await next();
    }
  };
}());

module.exports = { Middleware, Middlewares };
