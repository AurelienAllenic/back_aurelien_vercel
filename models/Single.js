const mongoose = require("mongoose");

const SingleSchema = new mongoose.Schema({
  image: { type: String, required: true },
  link: { type: String, required: true },
  alt: { type: String, required: true },
});

module.exports = mongoose.model("Single", SingleSchema);
