const mongoose = require("mongoose");

// models
const request = require("./models/request");

const models = { request };

const connect = (uri) => mongoose.connect(uri);

module.exports = {
  connect,
  models,
};
