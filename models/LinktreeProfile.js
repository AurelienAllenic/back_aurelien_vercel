const mongoose = require("mongoose");

const linktreeProfileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Paro",
    },
    description: {
      type: String,
      default: "Musique sans visage",
    },
    profileImage: {
      type: String,
      default: "/assets/paro_home.jpg",
    },
    // 3 réseaux sociaux sélectionnables
    socialIcons: [
      {
        platform: {
          type: String,
          enum: ["instagram", "tiktok", "facebook", "youtube", "spotify", "website"],
        },
        url: String,
        order: Number,
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("LinktreeProfile", linktreeProfileSchema);