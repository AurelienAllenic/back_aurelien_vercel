const mongoose = require("mongoose");

const SmartLinkV2Schema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  linkType: { type: String, required: true },
  titleType: { type: String, required: true },
  modifiedTitle: { type: String, required: true, unique: false },
  link: { type: String, required: true, unique: true },
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    required: false,
  },
});

module.exports = mongoose.model("SmartLinkV2", SmartLinkV2Schema);
