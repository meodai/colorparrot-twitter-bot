const fs = require("fs");
const request = require("request");
const namedColors = require("color-name-list");
const hexColorRegex = require("hex-color-regex");

const { namedColorsMap, closest } = require("./colors");

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
   * @return {undefined}.
   */
  use(f) {
    let func;
    if (f.constructor.name === "Function") {
      func = () => {
        try {
          f(this.T, this.tweet, this.listOfMiddlewares[i + 1], this.db);
        } catch (e) {
          console.log(e);
        }
      };
    } else if (f.constructor.name === "AsyncFunction") {
      func = async () => {
        await f(
          this.T,
          this.tweet,
          this.listOfMiddlewares[i + 1],
          this.db
        ).catch((e) => console.log(e));
      };
    }
    this.listOfMiddlewares.push(func);
  }

  /**
   * Run chain of middlewares, starting from the first
   */
  run() {
    if (this.listOfMiddlewares.length) {
      this.listOfMiddlewares[0]();
    }
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
  const userMessageArray = tweet.getUserTweet().split(" ");
  if (
    userMessageArray[0] === "@color_parrot" ||
    userMessageArray[userMessageArray.length - 1] === "@color_parrot"
  ) {
    userMessageArray.splice(userMessageArray.indexOf("@color_parrot"), 1);
    const colorName = userMessageArray.join(" ");
    if (namedColorsMap.get(colorName)) {
      const hex = namedColorsMap.get(colorName);
      const imgBuff = Image.generateImage({
        name: colorName,
        hex: hex,
      });
      const screenName = tweet.getUserName();
      const hashTag = colorName.split(" ").join("_");
      const imgBase64 = Image.convertImagebuffTobase64(imgBuff);
      const mediaIdString = await T.mediaUpload(imgBase64);
      T.statusesUpdate({
        status: `Hey @${screenName} thats #${hashTag}`,
        media_ids: mediaIdString,
      });
    } else {
      await next();
    }
  } else {
    await next();
  }
};

/**
 * add user tweet to proposals or flood list
 * @param {*} T
 * @param {*} tweet
 * @param {function} next
 * @param {*} db
 */
Middlewares.addProposalOrFlood = async (T, tweet, next, db) => {
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
      T.statusesUpdate({
        status:
          `@${screenName} Darn! ${hex} is taken already. Try ` +
          `shifting the values a bit and try again`,
      });
    } else {
      await T.statusesUpdate({
        status:
          `@${screenName} Thanks for your submission! ` +
          `Your color-name will be reviewed by a bunch of parrots ` +
          `and will end up in the color list soon. ${hex}`,
      });

      await db.addUserMessageToProposalsList(
        `${tweet.getUserName()} ` + `-> ${tweet.getUserTweet()}`
      );
    }
  } else {
    const filteredMessage = userMessageArray
      .map((i) => (i.includes("@color_parrot") ? "color_parrot" : i))
      .join(" ");

    await T.statusesUpdate({
      status:
        `@${screenName} What?! You need to give me a Name and ` +
        `a color as a hex value... --> ${filteredMessage}. And if you want ` +
        `to know the name of color just ask me: What is the name of #hex`,
    });

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

Middlewares.getColorName = (function () {
  /**
   *
   * @param {*} uri
   * @param {*} filename
   * @param {function} callback
   */
  function download(uri, filename, callback) {
    request.head(uri, function (err, res, body) {
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
  return async (T, tweet, next) => {
    const userMessageArray = tweet.getUserTweet().split(" ");
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

    if (tweet.getUserTweet().includes("What is the name of")) {
      for (const c of userMessageArray) {
        if (hexColorRegex().test(c)) {
          hex = c;
          rgb = lib.hexToRgb(hex);
          validHex = true;

          break;
        }
      }
      if (!validHex && !userImageURL) {
        await next();
      } else if (namedColorsMap.get(hex)) {
        T.statusesUpdate({
          status:
            `@${screenName} The name of ${hex} is ` +
            `${namedColorsMap.get(hex)}`,
        });
      } else {
        // get the closest named colors
        closestColor = closest.get([rgb.r, rgb.g, rgb.b]);
        color = namedColors[closestColor.index];

        T.statusesUpdate({
          status:
            `@${screenName} We don't have an exact match for ${hex} ` +
            ` but the closest color we have is ${color.hex} and its name is ` +
            ` ${color.name}`,
        });
      }
    } else {
      await next();
    }
  };
})();

module.exports = { Middleware, Middlewares };
