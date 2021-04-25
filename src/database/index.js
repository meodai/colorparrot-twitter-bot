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
   * @param {String} tweetId The id for the tweet
   * @returns {Promise}
   */
  createRequest(tweetId) {
    return this._models.request.create({
      tweet_id: tweetId,
    });
  }

  resolveRequest(id) {
    return this._models.request.updateOne(
      { _id: id },
      { resolved: true, failed: false },
    );
  }

  failRequest(id) {
    return this._models.request.updateOne(
      { _id: id },
      { resolved: false, failed: true },
    );
  }

  getFailedRequests() {
    return this._models.request.find({
      resolved: false,
      failed: true,
    });
  }
}

module.exports = { Database };
