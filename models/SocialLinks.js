const mongoose = require("mongoose");

const SocialLinksSchema = new mongoose.Schema(
  {
    youtube: { type: String, default: "" },
    youtubeMusic: { type: String, default: "" },
    instagram: { type: String, default: "" },
    facebook: { type: String, default: "" },
    tiktok: { type: String, default: "" },
    spotify: { type: String, default: "" },
    deezer: { type: String, default: "" },
    appleMusic: { type: String, default: "" },
    amazonMusic: { type: String, default: "" },
    soundcloud: { type: String, default: "" },
    qobuz: { type: String, default: "" },
    bandcamp: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SocialLinks", SocialLinksSchema);
