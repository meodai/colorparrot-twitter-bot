const Twitt = require('twit');
const AbstractTwitterClass = require('./AbstractTwitterClass');
const config = require('./../config/default');

/* eslint-disable */
class Twit extends AbstractTwitterClass{
  constructor() {
    super();
    this._T = new Twitt({
      consumer_key: config.CONSUMER_KEY,
      consumer_secret: config.CONSUMER_SECRET,
      access_token: config.ACCESS_TOKEN,
      access_token_secret: config.ACCESS_TOKEN_SECRET,
    });
  }

  statusesUpdate(params) {
    return new Promise((res, rej) => {
      this._T.post('statuses/update', params, (err) => {
        if (err) {
          rej(err);
        } else {
          res(true);
        }
      });
    });
  }

  mediaUpload(b64content) {
    return new Promise((res, rej) => {
      this._T.post('media/upload', {media_data: b64content}, (err, data) => {
        if (err) {
          rej(err);
        } else {
          res(data.media_id_string);
        }
      });
    });
  }

  statusesFilterStream(track) {
    return this._T.stream('statuses/filter', {
      track: track, language: 'en',
    });
  }
}

module.exports = Twit;
