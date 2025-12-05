const prisma = require("./prisma");

class Database {
  constructor() {
    this._db = prisma;
    this._models = this._db.models;
  }

  connect() {
    return this._db.connect();
  }

  disconnect() {
    return this._db.disconnect();
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
