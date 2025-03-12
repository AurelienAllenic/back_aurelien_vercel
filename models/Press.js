const mongoose = require("mongoose");

const PressSchema = new mongoose.Schema({
  image: { type: String, required: true },
  link: { type: String, required: false },
  alt: { type: String, required: true },
});

module.exports = mongoose.model("Press", PressSchema);
