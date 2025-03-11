const mongoose = require("mongoose");

const BioSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  image: { type: String, required: false },
  content: { type: String, required: false },
  signature: { type: String, required: false },
});

module.exports = mongoose.model("Bio", BioSchema);
