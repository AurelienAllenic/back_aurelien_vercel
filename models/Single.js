const mongoose = require("mongoose");

const singleSchema = new mongoose.Schema(
  {
    index: {
      type: Number,
      required: true,
      unique: true,
    },
    image: {
      type: String,
      required: true,
    },
    classImg: {
      type: String,
      default: "img-single",
    },
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    compositor: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      required: true,
    },
    youtubeEmbed: {
      type: String,
      required: false,
    },
    social: {
      spotify: { type: String },
      deezer: { type: String },
      youtube: { type: String },
      bandcamp: { type: String },
      apple: { type: String },
      amazon: { type: String },
      tidal: { type: String },
      itunes: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Single", singleSchema);
