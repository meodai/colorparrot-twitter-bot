const mongoose = require("mongoose");

// models
const Request = require("./models/request");

const models = { Request };

const connect = (uri) => {
  return mongoose.connect(uri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
  });
};

module.exports = {
  connect,
  models,
};