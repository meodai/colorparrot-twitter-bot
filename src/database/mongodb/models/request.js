const mongoose = require("mongoose");

const Request = new mongoose.Schema({
  tweet_id: {
    type: String,
    required: true,
  },
  resolved: {
    type: Boolean,
    required: false,
    default: false,
  },
  failed: {
    type: Boolean,
    required: false,
    default: false,
  }
}, { timestamps: true });

module.exports = mongoose.model("requests", Request);
