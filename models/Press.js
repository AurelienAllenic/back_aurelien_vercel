const mongoose = require("mongoose");

const PressSchema = new mongoose.Schema({
  image: { type: String, required: true },
  link: { type: String, default: "" },
  alt: { type: String, required: true },
  order: { type: Number, default: 0 },
});

module.exports = mongoose.model("Press", PressSchema);
