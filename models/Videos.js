const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    index: {
      type: Number,
      required: true,
      unique: true,
    },
    link: {
      type: String,
      required: true,
    },
    classVid: {
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
    modifiedTitle: {
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
