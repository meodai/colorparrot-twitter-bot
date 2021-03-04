const fs = require("fs");
const request = require("request");
const hexColorRegex = require("hex-color-regex");

const Color = require("./color");
const Images = require("./images");
const { Templates, buildMessage } = require("./templates");

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
      let f = this.listOfMiddlewares[i];
      let func;
      if (f.constructor.name === "Function") {
        func = () => {
          try {
            f(this.T, this.tweet, this.listOfMiddlewares[i+1], this.db);
          } catch (e) {
            console.log(e);
          }
        };
      } else if (f.constructor.name === "AsyncFunction") {
        func = async () => {
          await f(
            this.T,
            this.tweet,
            this.listOfMiddlewares[i+1],
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
  const userMessageArray = tweet.getUserTweet().split(" ");
  if (
    userMessageArray[0] === "@color_parrot" ||
    userMessageArray[userMessageArray.length - 1] === "@color_parrot"
  ) {
    userMessageArray.splice(userMessageArray.indexOf("@color_parrot"), 1);
    const colorName = userMessageArray.join(" ");
    const existingColor = await Color.getColorFromName(colorName);
    if (existingColor) {
      const { hex } = existingColor;
      const imgBuff = Images.generateImage({
        name: colorName,
        hex: hex,
      });
      const screenName = tweet.getUserName();
      const hashTag = colorName.split(" ").join("_");
      const imgBase64 = Images.convertImagebuffTobase64(imgBuff);
      const mediaIdString = await T.mediaUpload(imgBase64);
      T.statusesUpdate({
        status: buildMessage(Templates.IMAGE_RESPONSE, {
          screenName,
          hashTag
        }),
        media_ids: mediaIdString,
      });
    } else {
      await next();
    }
  } else {
    await next();
  }
};

Middlewares.getImageColor = async (T, tweet, next, db) => {
  const tweets = tweet.getReferencedTweets();
};

/**
 * add user tweet to proposals or flood list
 * @param {*} T
 * @param {*} tweet
 * @param {function} next
 * @param {*} db
 */
Middlewares.addProposalOrFlood = async (T, tweet, next, db) => {
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
      T.statusesUpdate({
        status: buildMessage(Templates.HEX_TAKEN, {
          screenName,
          hex,
        })
      });
    } else {
      await T.statusesUpdate({
        status: buildMessage(Templates.PROPOSAL_ACCEPTED, {
          screenName,
          hex,
        })
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
      status: buildMessage(Templates.PROPOSAL_DENIED, {
        screenName,
        filteredMessage,
      })
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
    const { namedColors, namedColorsMap, closest } = await Color.getNamedColors();

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
          rgb = Color.hexToRgb(hex);
          validHex = true;

          break;
        }
      }
      if (!validHex && !userImageURL) {
        await next();
      } else if (namedColorsMap.get(hex)) {
        T.statusesUpdate({
          status: buildMessage(Templates.EXACT_HEX_NAME_RESPONSE, {
            screenName,
            hex,
            colorName: namedColorsMap.get(hex),
          })
        });
      } else {
        // get the closest named colors
        closestColor = closest.get([rgb.r, rgb.g, rgb.b]);
        color = namedColors[closestColor.index];

        T.statusesUpdate({
          status: buildMessage(Templates.CLOSEST_HEX_NAME_RESPONSE, {
            screenName,
            hex,
            closestHex: color.hex,
            closestName: color.name,
          })
        });
      }
    } else {
      await next();
    }
  };
})();

module.exports = { Middleware, Middlewares };
