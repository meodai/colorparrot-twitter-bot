const mongodb = require("./mongodb");

const adapters = { mongodb };

class Database {
  constructor(dbclass, uri) {
    this._db = adapters[dbclass];
    this._models = this._db.models;
    this._uri = uri;
  }

  connect() {
    return this._db.connect(this._uri);
  }

  /**
   * Creates a new [unresolved] request in the database
   * @param {String} tweet_id The id for the tweet
   * @returns {Promise}
   */
  createRequest(tweet_id) {
    return this._models.request.create({
      tweet_id,
    });
  }
}

module.exports = { Database };