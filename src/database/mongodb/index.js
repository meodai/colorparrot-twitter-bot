const mongoose = require("mongoose");

// models
const request = require("./models/request");

const models = { request };

const connect = (uri) => mongoose.connect(uri, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: true,
  useUnifiedTopology: true,
});

module.exports = {
  connect,
  models,
};
