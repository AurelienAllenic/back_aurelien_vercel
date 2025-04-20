const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    link: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    modifiedTitleVideo: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Video", videoSchema);
