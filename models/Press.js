const mongoose = require("mongoose");

const PressSchema = new mongoose.Schema({
  image: { type: String, required: true },
  link: { type: String, required: true },
  alt: { type: String, required: true },
});

module.exports = mongoose.model("Press", PressSchema);
